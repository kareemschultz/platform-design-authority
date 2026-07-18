"""Generate a reproducible SBOM and license inventory from the installed workspace.

Reads every node_modules/**/package.json (authoritative, offline — no network
call, no registry lookup) and writes:
  - evidence/licensing/sbom.json: full package/version/license inventory
  - evidence/licensing/license-summary.json: counts by license, and the list
    of packages needing manual disposition (missing/unrecognized/choice license)

This is a workspace-level SBOM (root node_modules, bun workspaces hoist a
single install tree). It does not yet isolate per-distributable dependency
sets (apps/web vs apps/server vs apps/worker vs apps/native) — that requires
filtering by each app's own transitive dependency graph and is tracked as a
known limitation until issue #93 extends this script.

Usage: python scripts/generate_sbom.py [--check]
  --check: exit 1 if the committed evidence files are stale vs. a fresh run,
           without overwriting them (CI-safe verification mode).
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NODE_MODULES = ROOT / "node_modules"
OUT_DIR = ROOT / "evidence" / "licensing"
SBOM_PATH = OUT_DIR / "sbom.json"
SUMMARY_PATH = OUT_DIR / "license-summary.json"

# SPDX-recognized permissive/weak-copyleft licenses common in the npm ecosystem.
# This is a recognition allowlist for automatic bucketing, not a legal policy
# decision — qualified legal review (issue #93) still governs actual use.
KNOWN_LICENSES = {
    "MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "BSD-3-Clause-Clear",
    "Apache-2.0", "0BSD", "CC0-1.0", "Unlicense", "Python-2.0", "WTFPL",
    "BlueOak-1.0.0", "CC-BY-3.0", "CC-BY-4.0", "MPL-2.0", "Zlib",
}

# Licenses that carry copyleft or attribution obligations materially
# stronger than the permissive set above and should always route to manual
# review regardless of recognition.
NEEDS_REVIEW_ALWAYS = {
    "GPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0",
    "GPL-2.0-only", "GPL-3.0-only", "AGPL-3.0-only", "LGPL-2.1-only", "LGPL-3.0-only",
}


def normalize_license(pkg_json):
    """Return (kind, value) where kind is one of:
    'spdx' (single SPDX string), 'object' (legacy {type,url} form),
    'choice' (array of licenses / OR expression), 'missing'.
    """
    lic = pkg_json.get("license")
    licenses = pkg_json.get("licenses")

    if lic is None and licenses is None:
        return ("missing", None)

    if isinstance(lic, str):
        if " OR " in lic or " AND " in lic or "(" in lic:
            return ("choice", lic)
        return ("spdx", lic)

    if isinstance(lic, dict):
        return ("object", lic.get("type") or lic.get("name"))

    if isinstance(licenses, list) and licenses:
        types = [entry.get("type") if isinstance(entry, dict) else entry for entry in licenses]
        if len(types) == 1:
            return ("spdx", types[0])
        return ("choice", " OR ".join(str(t) for t in types))

    if isinstance(lic, list) and lic:
        return ("choice", " OR ".join(str(entry) for entry in lic))

    return ("missing", None)


def _iter_canonical_package_json(bun_store):
    """Yield package.json paths exactly at <store-entry>/node_modules/[<scope>/]<name>/package.json.

    Bun's hoisted store (node_modules/.bun/<name>@<version>[+hash]/node_modules/<name>/...)
    nests the real package one level down; some packages also ship subpath
    package.json files deeper in their own tree (e.g. zod/mini/package.json)
    for export-map resolution — those are NOT separate dependencies and must
    be excluded by fixing the exact depth rather than globbing recursively.
    """
    for entry in bun_store.iterdir():
        if not entry.is_dir():
            continue
        inner = entry / "node_modules"
        if not inner.is_dir():
            continue
        for child in inner.iterdir():
            if not child.is_dir():
                continue
            if child.name.startswith("@"):
                for scoped in child.iterdir():
                    candidate = scoped / "package.json"
                    if candidate.is_file():
                        yield candidate
            else:
                candidate = child / "package.json"
                if candidate.is_file():
                    yield candidate


def collect_packages():
    if not NODE_MODULES.exists():
        print(
            "error: node_modules not found — run `bun install --frozen-lockfile` first",
            file=sys.stderr,
        )
        sys.exit(2)

    bun_store = NODE_MODULES / ".bun"
    if not bun_store.exists():
        print(f"error: {bun_store} not found — unexpected bun install layout", file=sys.stderr)
        sys.exit(2)

    packages = {}
    for pkg_json_path in _iter_canonical_package_json(bun_store):
        try:
            data = json.loads(pkg_json_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue

        name = data.get("name")
        version = data.get("version")
        if not name or not version:
            continue

        # internal workspace packages are our own source, not a third-party dependency
        if name.startswith("@meridian/"):
            continue

        key = f"{name}@{version}"
        if key in packages:
            continue

        kind, value = normalize_license(data)
        packages[key] = {
            "name": name,
            "version": version,
            "license_kind": kind,
            "license": value,
            "path": str(pkg_json_path.relative_to(NODE_MODULES).parent),
            "repository": _repo_url(data),
        }

    return packages


def _repo_url(data):
    repo = data.get("repository")
    if isinstance(repo, str):
        return repo
    if isinstance(repo, dict):
        return repo.get("url")
    return None


def bucket(packages):
    by_license = {}
    needs_review = []

    for key, pkg in sorted(packages.items()):
        kind = pkg["license_kind"]
        lic = pkg["license"]

        if kind == "missing":
            needs_review.append({**pkg, "reason": "missing license metadata"})
            bucket_name = "MISSING"
        elif kind == "choice":
            needs_review.append({**pkg, "reason": "combined/choice license expression"})
            bucket_name = f"CHOICE: {lic}"
        elif kind == "object" and not lic:
            needs_review.append({**pkg, "reason": "unparseable legacy license object"})
            bucket_name = "MISSING"
        else:
            bucket_name = str(lic)
            if bucket_name in NEEDS_REVIEW_ALWAYS:
                needs_review.append({**pkg, "reason": "copyleft license requires disposition"})
            elif bucket_name not in KNOWN_LICENSES:
                needs_review.append({**pkg, "reason": "unrecognized license identifier"})

        by_license.setdefault(bucket_name, []).append(key)

    return by_license, needs_review


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    packages = collect_packages()
    by_license, needs_review = bucket(packages)

    sbom = {
        "generated_by": "scripts/generate_sbom.py",
        "scope": "workspace root node_modules (hoisted bun install tree; not yet per-distributable)",
        "package_count": len(packages),
        "packages": packages,
    }
    summary = {
        "generated_by": "scripts/generate_sbom.py",
        "package_count": len(packages),
        "license_counts": {lic: len(pkgs) for lic, pkgs in sorted(by_license.items())},
        "needs_manual_review_count": len(needs_review),
        "needs_manual_review": sorted(needs_review, key=lambda p: (p["reason"], p["name"])),
    }

    new_sbom_text = json.dumps(sbom, indent=2, sort_keys=True) + "\n"
    new_summary_text = json.dumps(summary, indent=2, sort_keys=True) + "\n"

    if args.check:
        stale = False
        if not SBOM_PATH.exists() or SBOM_PATH.read_text(encoding="utf-8") != new_sbom_text:
            stale = True
        if not SUMMARY_PATH.exists() or SUMMARY_PATH.read_text(encoding="utf-8") != new_summary_text:
            stale = True
        if stale:
            print("SBOM evidence is stale — run `python scripts/generate_sbom.py` and commit the result.", file=sys.stderr)
            sys.exit(1)
        print(f"SBOM evidence current: {len(packages)} packages, {len(needs_review)} need manual review.")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SBOM_PATH.write_text(new_sbom_text, encoding="utf-8")
    SUMMARY_PATH.write_text(new_summary_text, encoding="utf-8")
    print(f"Wrote {SBOM_PATH} and {SUMMARY_PATH}: {len(packages)} packages, {len(needs_review)} need manual review.")


if __name__ == "__main__":
    main()
