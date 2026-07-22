#!/usr/bin/env python3
"""Generate the controlled-prototype third-party provenance baseline."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "third_party" / "provenance.json"
GENERATED = ROOT / "third_party" / "generated"
DISTRIBUTABLES = ("apps/docs", "apps/native", "apps/server", "apps/web", "apps/worker")
REGULAR_FILE_MODES = {"100644", "100755"}
PROHIBITED_KEYS = {
    "api_key", "api_keys", "credential", "credentials", "entitlement",
    "entitlements", "invoice", "invoices", "license_key", "license_keys",
    "password", "passwords", "private_download_url", "private_download_urls",
    "private_url", "private_urls", "secret", "secrets", "token", "tokens",
}
PROHIBITED_VALUE_PATTERNS = (
    re.compile(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"),
    re.compile(r"\b(?:gh[opusr]_|sk-)[A-Za-z0-9_-]{20,}"),
)
OBSERVATION_KINDS = {
    "and-conjunctive", "license-file-pointer", "metadata-missing",
    "obligation-review", "or-choice",
}
PROVENANCE_DISTRIBUTION_STATUSES = {
    "legal-review-required", "replace-before-distribution",
}
PROVENANCE_EVIDENCE_STATUSES = {
    "not-established-for-exact-assets",
    "public-upstream-license-observed-not-legally-reviewed",
}
PINNED_LICENSE_REVIEW_IDENTITY_COUNT = 21
PINNED_LICENSE_REVIEW_IDENTITY_SHA256 = (
    "dab9ded48ceb4807cc209813be21850d585c5834ddc624f2f927ce405190d39f"
)


class BaselineError(ValueError):
    """A deterministic baseline invariant failed."""


def json_bytes(value: Any) -> bytes:
    text = json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    return text.encode("utf-8")


def strip_jsonc(text: str) -> str:
    """Remove JSONC comments and trailing commas without touching strings."""
    without_comments: list[str] = []
    index = 0
    in_string = False
    escaped = False
    while index < len(text):
        char = text[index]
        if in_string:
            without_comments.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            index += 1
            continue
        if char == '"':
            in_string = True
            without_comments.append(char)
            index += 1
            continue
        if char == "/" and index + 1 < len(text) and text[index + 1] == "/":
            index += 2
            while index < len(text) and text[index] not in "\r\n":
                index += 1
            continue
        if char == "/" and index + 1 < len(text) and text[index + 1] == "*":
            end = text.find("*/", index + 2)
            if end == -1:
                raise BaselineError("unterminated JSONC block comment")
            index = end + 2
            continue
        without_comments.append(char)
        index += 1

    result: list[str] = []
    text = "".join(without_comments)
    index = 0
    in_string = False
    escaped = False
    while index < len(text):
        char = text[index]
        if in_string:
            result.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            index += 1
            continue
        if char == '"':
            in_string = True
            result.append(char)
            index += 1
            continue
        if char == ",":
            lookahead = index + 1
            while lookahead < len(text) and text[lookahead].isspace():
                lookahead += 1
            if lookahead < len(text) and text[lookahead] in "}]":
                index += 1
                continue
        result.append(char)
        index += 1
    return "".join(result)


def _display_path(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def load_jsonc(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(strip_jsonc(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError) as error:
        raise BaselineError(f"cannot read {_display_path(path)}: {error}") from error
    if not isinstance(value, dict):
        raise BaselineError(f"{_display_path(path)} must contain an object")
    return value


def reject_restricted_material(value: Any, location: str = "provenance") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            normalized = str(key).lower().replace("-", "_")
            if normalized in PROHIBITED_KEYS:
                raise BaselineError(f"restricted field {key!r} is prohibited at {location}")
            reject_restricted_material(child, f"{location}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            reject_restricted_material(child, f"{location}[{index}]")
    elif isinstance(value, str):
        for pattern in PROHIBITED_VALUE_PATTERNS:
            if pattern.search(value):
                raise BaselineError(f"credential-shaped value is prohibited at {location}")


def _repo_relative(raw: str) -> str:
    if (
        not isinstance(raw, str)
        or not raw
        or "\\" in raw
        or "://" in raw
        or re.match(r"^[A-Za-z]:", raw)
    ):
        raise BaselineError(f"invalid repository-relative path {raw!r}")
    parsed = PurePosixPath(raw)
    if parsed.is_absolute() or ".." in parsed.parts or "." in parsed.parts:
        raise BaselineError(f"invalid repository-relative path {raw!r}")
    return parsed.as_posix()


def tracked_regular_files(root: Path = ROOT) -> set[str]:
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "ls-files", "-z", "--cached", "--stage"],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    except OSError as error:
        raise BaselineError("unable to execute git ls-files") from error
    if result.returncode != 0:
        raise BaselineError("unable to enumerate tracked files")
    files: set[str] = set()
    for item in result.stdout.split(b"\0"):
        if not item:
            continue
        try:
            metadata, raw_path = item.split(b"\t", 1)
            mode, _object_id, stage = metadata.split(b" ")
            path = raw_path.decode("utf-8")
        except (UnicodeDecodeError, ValueError) as error:
            raise BaselineError("unable to parse git index entries") from error
        if stage != b"0":
            raise BaselineError(f"unresolved git index stage for {path}")
        if mode.decode("ascii") in REGULAR_FILE_MODES:
            files.add(path)
    return files


def validate_private_manifests(
    lock: dict[str, Any], tracked: set[str]
) -> dict[str, dict[str, Any]]:
    workspaces = lock.get("workspaces")
    if not isinstance(workspaces, dict):
        raise BaselineError("bun.lock has no workspace map")
    manifests: dict[str, dict[str, Any]] = {}
    for relative in sorted(path for path in tracked if path.endswith("package.json")):
        manifest = load_jsonc(ROOT / relative)
        if manifest.get("private") is not True:
            raise BaselineError(f"{relative} must set private: true")
    for workspace_path in sorted(workspaces):
        relative = f"{workspace_path}/package.json" if workspace_path else "package.json"
        if relative not in tracked:
            raise BaselineError(f"workspace manifest is not tracked: {relative}")
        manifests[workspace_path] = load_jsonc(ROOT / relative)
    return manifests


def split_package_spec(spec: str) -> tuple[str, str]:
    if spec.startswith("npm:"):
        spec = spec[4:]
    separator = spec.rfind("@") if spec.startswith("@") else spec.find("@")
    if separator <= 0:
        raise BaselineError(f"unrecognized lock package spec {spec!r}")
    return spec[:separator], spec[separator + 1 :]


def package_inventory(
    lock: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    packages = lock.get("packages")
    if not isinstance(packages, dict):
        raise BaselineError("bun.lock has no package map")
    records: list[dict[str, Any]] = []
    by_key: dict[str, dict[str, Any]] = {}
    for lock_key in sorted(packages):
        entry = packages[lock_key]
        if (
            isinstance(entry, list)
            and entry
            and isinstance(entry[0], str)
            and "@workspace:" in entry[0]
        ):
            continue
        if not isinstance(entry, list) or len(entry) < 3 or not isinstance(entry[0], str):
            raise BaselineError(f"invalid bun.lock package entry {lock_key!r}")
        name, version = split_package_spec(entry[0])
        metadata = entry[2] if isinstance(entry[2], dict) else {}
        record = {
            "lock_key": lock_key,
            "name": name,
            "version": version,
            "integrity": entry[3] if len(entry) > 3 and isinstance(entry[3], str) else None,
            "dependencies": sorted((metadata.get("dependencies") or {}).items()),
            "optional_dependencies": sorted(
                (metadata.get("optionalDependencies") or {}).items()
            ),
            "peer_dependencies": sorted((metadata.get("peerDependencies") or {}).items()),
            "os": metadata.get("os"),
            "cpu": metadata.get("cpu"),
            "license_conclusion": "NOASSERTION",
        }
        records.append(record)
        by_key[lock_key] = record
    return records, by_key


def validate_license_observations(
    provenance: dict[str, Any], inventory: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    observations = provenance.get("license_review_observations")
    required_identities = provenance.get("license_review_required_identities")
    expected_count = provenance.get("license_review_observation_count")
    if not isinstance(observations, list) or not observations:
        raise BaselineError("license_review_observations must be a non-empty array")
    if not isinstance(expected_count, int) or expected_count < 1:
        raise BaselineError("license_review_observation_count must be a positive integer")
    if len(observations) != expected_count:
        raise BaselineError(
            "license review observation count mismatch: "
            f"expected {expected_count}, found {len(observations)}"
        )
    if not isinstance(required_identities, list) or not required_identities:
        raise BaselineError("license_review_required_identities must be a non-empty array")
    required_identity_set: set[tuple[str, str]] = set()
    for item in required_identities:
        if (
            not isinstance(item, dict)
            or set(item) != {"package", "version"}
            or not isinstance(item["package"], str)
            or not isinstance(item["version"], str)
        ):
            raise BaselineError("invalid required license review identity")
        required_identity_set.add((item["package"], item["version"]))
    if len(required_identity_set) != len(required_identities):
        raise BaselineError("required license review identity is duplicated")
    available = {(item["name"], item["version"]) for item in inventory}
    validated: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for observation in observations:
        if not isinstance(observation, dict):
            raise BaselineError("license observation must be an object")
        required = {
            "package", "version", "observed_expression", "expression_kind",
            "review_status", "license_conclusion", "source_context", "limitation",
        }
        missing = required.difference(observation)
        if missing:
            raise BaselineError(f"license observation missing {sorted(missing)}")
        identity = (observation["package"], observation["version"])
        if identity not in available:
            raise BaselineError(f"license observation is absent from bun.lock: {identity}")
        if identity in seen:
            raise BaselineError(f"license observation is duplicated: {identity}")
        seen.add(identity)
        if observation["expression_kind"] not in OBSERVATION_KINDS:
            raise BaselineError(f"invalid license expression kind for {identity}")
        expression = observation["observed_expression"]
        if expression is None:
            expected_kind = "metadata-missing"
        elif not isinstance(expression, str) or not expression.strip():
            raise BaselineError(f"invalid observed license expression for {identity}")
        elif " AND " in expression:
            expected_kind = "and-conjunctive"
        elif " OR " in expression:
            expected_kind = "or-choice"
        elif expression.startswith("SEE LICENSE IN "):
            expected_kind = "license-file-pointer"
        else:
            expected_kind = "obligation-review"
        if observation["expression_kind"] != expected_kind:
            raise BaselineError(
                f"license expression kind mismatch for {identity}: "
                f"expected {expected_kind}, found {observation['expression_kind']}"
            )
        if observation["license_conclusion"] != "NOASSERTION":
            raise BaselineError(f"license conclusion must remain NOASSERTION for {identity}")
        if observation["review_status"] != "qualified-review-required":
            raise BaselineError(f"qualified review must remain required for {identity}")
        validated.append(observation)
    if seen != required_identity_set:
        raise BaselineError(
            "license review identity coverage mismatch: "
            f"missing={sorted(required_identity_set - seen)}, "
            f"unexpected={sorted(seen - required_identity_set)}"
        )
    return sorted(validated, key=lambda item: (item["package"], item["version"]))


def validate_pinned_license_review_scope(provenance: dict[str, Any]) -> None:
    identities = provenance.get("license_review_required_identities")
    if not isinstance(identities, list):
        raise BaselineError("pinned license review identities must be an array")
    normalized = sorted(
        (item.get("package"), item.get("version"))
        for item in identities
        if isinstance(item, dict)
    )
    if (
        len(identities) != PINNED_LICENSE_REVIEW_IDENTITY_COUNT
        or len(normalized) != PINNED_LICENSE_REVIEW_IDENTITY_COUNT
        or provenance.get("license_review_observation_count")
        != PINNED_LICENSE_REVIEW_IDENTITY_COUNT
    ):
        raise BaselineError(
            f"pinned license review scope must contain exactly "
            f"{PINNED_LICENSE_REVIEW_IDENTITY_COUNT} identities"
        )
    payload = "\n".join(f"{package}@{version}" for package, version in normalized)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    if digest != PINNED_LICENSE_REVIEW_IDENTITY_SHA256:
        raise BaselineError("pinned license review identity set has drifted")


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_asset_inventory(
    provenance: dict[str, Any], tracked: set[str]
) -> dict[str, Any]:
    records = provenance.get("records")
    scopes = provenance.get("coverage_scopes")
    if not isinstance(records, list) or not isinstance(scopes, list):
        raise BaselineError("provenance records and coverage_scopes must be arrays")
    expected: set[str] = set()
    for raw_pattern in scopes:
        pattern = _repo_relative(raw_pattern)
        matches = {
            path.relative_to(ROOT).as_posix()
            for path in ROOT.glob(pattern)
            if path.is_file() and not path.is_symlink()
        }
        if not matches:
            raise BaselineError(f"coverage scope matched no files: {pattern}")
        expected.update(matches)
    covered: dict[str, str] = {}
    inventory: list[dict[str, Any]] = []
    record_ids: set[str] = set()
    for record in sorted(records, key=lambda item: item.get("id", "")):
        if not isinstance(record, dict):
            raise BaselineError("provenance record must be an object")
        required = {
            "id", "kind", "source_name", "source_version", "source_url",
            "declared_upstream_license", "upstream_license_url", "license_conclusion",
            "notice_status", "permitted_use_evidence", "distribution_status",
            "modifications", "files",
        }
        missing = required.difference(record)
        if missing:
            raise BaselineError(f"provenance record {record.get('id')!r} missing {sorted(missing)}")
        if not isinstance(record["id"], str) or not record["id"]:
            raise BaselineError("provenance record id must be a non-empty string")
        if record["id"] in record_ids:
            raise BaselineError(f"provenance record id is duplicated: {record['id']}")
        record_ids.add(record["id"])
        if record["license_conclusion"] != "NOASSERTION":
            raise BaselineError(f"{record['id']} must remain NOASSERTION")
        if record["notice_status"] != "included-in-generated-baseline":
            raise BaselineError(f"{record['id']} must be included in the notice")
        evidence = record["permitted_use_evidence"]
        if (
            not isinstance(evidence, dict)
            or evidence.get("status") not in PROVENANCE_EVIDENCE_STATUSES
            or not isinstance(evidence.get("references"), list)
        ):
            raise BaselineError(f"{record['id']} has invalid permitted-use evidence")
        if record["distribution_status"] not in PROVENANCE_DISTRIBUTION_STATUSES:
            raise BaselineError(f"{record['id']} has invalid distribution status")
        for reference in evidence["references"]:
            relative_reference = _repo_relative(reference)
            reference_path = ROOT / relative_reference
            if (
                relative_reference not in tracked
                or not reference_path.is_file()
                or reference_path.is_symlink()
            ):
                raise BaselineError(f"{record['id']} has untracked evidence {reference!r}")
        if not isinstance(record["files"], list) or not record["files"]:
            raise BaselineError(f"{record['id']} must cover at least one file")
        for raw_relative in sorted(record["files"]):
            relative = _repo_relative(raw_relative)
            path = ROOT / relative
            if relative not in tracked or not path.is_file() or path.is_symlink():
                raise BaselineError(f"provenance path is not a tracked regular file: {relative}")
            if relative in covered:
                raise BaselineError(f"provenance path {relative} is covered twice")
            covered[relative] = record["id"]
            inventory.append({
                "path": relative,
                "sha256": _sha256(path),
                "record_id": record["id"],
                "kind": record["kind"],
                "declared_upstream_license": record["declared_upstream_license"],
                "license_conclusion": "NOASSERTION",
                "distribution_status": record["distribution_status"],
            })
    missing = sorted(expected.difference(covered))
    outside = sorted(set(covered).difference(expected))
    if missing or outside:
        raise BaselineError(f"source/asset coverage mismatch; missing={missing}, outside={outside}")
    return {
        "schema_version": "1.0.0",
        "generated_from": "third_party/provenance.json",
        "distribution_authority": "none",
        "files": sorted(inventory, key=lambda item: item["path"]),
        "build_time_references": [],
    }


def validate_build_time_references(
    provenance: dict[str, Any], tracked: set[str]
) -> list[dict[str, Any]]:
    references = provenance.get("build_time_references", [])
    if not isinstance(references, list):
        raise BaselineError("build_time_references must be an array")
    validated: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_paths: set[str] = set()
    for reference in references:
        required = {
            "id", "kind", "source_name", "source_url", "declared_upstream_license",
            "upstream_license_url", "license_conclusion", "permitted_use_evidence",
            "distribution_status", "reference_paths", "limitation",
        }
        if not isinstance(reference, dict) or required.difference(reference):
            raise BaselineError("build-time reference is missing required fields")
        if not isinstance(reference["id"], str) or not reference["id"]:
            raise BaselineError("build-time reference id must be a non-empty string")
        if reference["id"] in seen_ids:
            raise BaselineError(f"build-time reference id is duplicated: {reference['id']}")
        seen_ids.add(reference["id"])
        if reference.get("license_conclusion") != "NOASSERTION":
            raise BaselineError("build-time license conclusions must remain NOASSERTION")
        if reference.get("distribution_status") != "artifact-review-required":
            raise BaselineError("build-time references must require artifact review")
        evidence = reference["permitted_use_evidence"]
        if (
            not isinstance(evidence, dict)
            or evidence.get("status")
            != "public-upstream-license-observed-not-artifact-reviewed"
            or not isinstance(evidence.get("references"), list)
        ):
            raise BaselineError("build-time permitted-use evidence must remain unapproved")
        raw_paths = reference["reference_paths"]
        if not isinstance(raw_paths, list) or not raw_paths:
            raise BaselineError("build-time reference_paths must be a non-empty array")
        paths = [_repo_relative(item) for item in raw_paths]
        evidence_paths = [_repo_relative(item) for item in evidence["references"]]
        if sorted(paths) != sorted(evidence_paths):
            raise BaselineError("build-time evidence references must match reference_paths")
        bound_paths: list[dict[str, str]] = []
        for relative in sorted(paths):
            path = ROOT / relative
            if relative in seen_paths:
                raise BaselineError(f"build-time reference path is duplicated: {relative}")
            if relative not in tracked or not path.is_file() or path.is_symlink():
                raise BaselineError(
                    f"build-time reference is not a tracked regular file: {relative}"
                )
            seen_paths.add(relative)
            bound_paths.append({"path": relative, "sha256": _sha256(path)})
        validated.append({**reference, "reference_files": bound_paths})
    return sorted(validated, key=lambda item: item["id"])


def purl(name: str, version: str) -> str:
    if name.startswith("@") and "/" in name:
        namespace, package_name = name.split("/", 1)
        package_path = f"{quote(namespace, safe='')}/{quote(package_name, safe='')}"
    else:
        package_path = quote(name, safe="")
    return f"pkg:npm/{package_path}@{quote(version, safe='')}"


def _sha512_hex(integrity: str | None) -> str | None:
    if not integrity or not integrity.startswith("sha512-"):
        return None
    try:
        return base64.b64decode(integrity[7:], validate=True).hex()
    except ValueError as error:
        raise BaselineError("invalid sha512 integrity in bun.lock") from error


def resolve_direct_dependency(
    workspace: dict[str, Any], dependency: str, selector: str,
    by_key: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    if selector.startswith("workspace:"):
        raise BaselineError("workspace dependency passed to external resolver")
    workspace_name = workspace.get("name")
    requested_name = dependency
    requested_version: str | None = None
    if selector.startswith("npm:"):
        requested_name, requested_version = split_package_spec(selector)
    for key in (f"{workspace_name}/{dependency}", dependency):
        if key in by_key:
            return by_key[key]
    candidates = [item for item in by_key.values() if item["name"] == requested_name]
    if requested_version:
        candidates = [item for item in candidates if item["version"] == requested_version]
    unique = {(item["name"], item["version"]): item for item in candidates}
    if len(unique) == 1:
        return next(iter(unique.values()))
    versions = sorted(version for _, version in unique)
    raise BaselineError(
        f"cannot deterministically resolve {workspace_name}:{dependency}@{selector}; "
        f"candidate versions={versions}"
    )


def declared_sbom(
    workspace_path: str, workspace: dict[str, Any], manifest: dict[str, Any],
    by_key: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    components_by_ref: dict[str, dict[str, Any]] = {}
    dependency_refs: list[str] = []
    dependencies = workspace.get("dependencies") or {}
    for dependency in sorted(dependencies):
        selector = dependencies[dependency]
        if selector.startswith("workspace:"):
            continue
        record = resolve_direct_dependency(workspace, dependency, selector, by_key)
        ref = purl(record["name"], record["version"])
        digest = _sha512_hex(record["integrity"])
        dependency_refs.append(ref)
        if ref not in components_by_ref:
            component = {
                "type": "library", "bom-ref": ref, "name": record["name"],
                "version": record["version"], "purl": ref,
                "properties": [
                    {"name": "pda:license-conclusion", "value": "NOASSERTION"},
                    {"name": "pda:lock-key", "value": record["lock_key"]},
                ],
                "_declarations": [],
            }
            if digest:
                component["hashes"] = [{"alg": "SHA-512", "content": digest}]
            components_by_ref[ref] = component
        components_by_ref[ref]["_declarations"].append(
            {"name": dependency, "selector": selector}
        )
    components: list[dict[str, Any]] = []
    for ref in sorted(components_by_ref):
        component = components_by_ref[ref]
        declarations = component.pop("_declarations")
        component["properties"].append({
            "name": "pda:declared-dependencies-json",
            "value": json.dumps(declarations, sort_keys=True, separators=(",", ":")),
        })
        components.append(component)
    component_ref = f"urn:pda:workspace:{workspace_path}"
    return {
        "bomFormat": "CycloneDX", "specVersion": "1.6", "version": 1,
        "metadata": {"component": {
            "type": "application", "bom-ref": component_ref, "name": manifest["name"],
            "version": manifest.get("version", "0.0.0-prototype"),
            "properties": [
                {"name": "pda:distribution-authority", "value": "none"},
                {"name": "pda:inventory-scope", "value": "direct-declared-runtime-dependencies"},
                {"name": "pda:sbom-type", "value": "declared-manifest"},
                {"name": "pda:not-post-build-or-artifact-sbom", "value": "true"},
                {"name": "pda:license-conclusions", "value": "NOASSERTION"},
                {"name": "pda:source-lockfile", "value": "bun.lock"},
                {
                    "name": "pda:serial-number-policy",
                    "value": "omitted-for-byte-reproducible-source-baseline;artifact-boms-must-mint-rfc4122",
                },
            ],
        }},
        "components": components,
        "dependencies": [{"ref": component_ref, "dependsOn": sorted(set(dependency_refs))}],
        "compositions": [{"aggregate": "incomplete", "assemblies": [component_ref]}],
    }


def notices(
    provenance: dict[str, Any], inventory: list[dict[str, Any]],
    observations: list[dict[str, Any]],
) -> bytes:
    unique_packages = sorted({(item["name"], item["version"]) for item in inventory})
    lines = [
        "# Third-Party Notices — Controlled-Prototype Baseline", "",
        "> This generated inventory does not license repository-maintained material, establish",
        "> legal approval, or authorize source, package, app, binary, native, or container",
        "> distribution. License conclusions remain `NOASSERTION`. This is a declared",
        "> manifest/lock baseline, not a post-build or artifact notice bundle.", "",
        "## Copied source and retained assets", "",
    ]
    for record in sorted(provenance["records"], key=lambda item: item["id"]):
        lines.extend([
            f"### {record['source_name']} ({record['id']})", "",
            f"- Source/version: {record['source_url']} — {record['source_version']}",
            f"- Upstream-declared license: `{record['declared_upstream_license']}`",
            f"- Public license evidence: {record['upstream_license_url'] or 'not established for exact assets'}",
            "- Repository license conclusion: `NOASSERTION`",
            f"- Permitted-use evidence: `{record['permitted_use_evidence']['status']}`",
            f"- Distribution status: `{record['distribution_status']}`",
            f"- Modifications: {record['modifications']}", "- Covered paths:", "",
        ])
        lines.extend(f"  - `{path}`" for path in sorted(record["files"]))
        lines.append("")
    lines.extend(["## License-review observations", ""])
    for item in observations:
        expression = item["observed_expression"] or "missing package metadata"
        lines.append(
            f"- `{item['package']}@{item['version']}` — observed `{expression}`; "
            f"kind `{item['expression_kind']}`; conclusion `NOASSERTION`; qualified review required."
        )
    lines.extend(["", "## Build-time references outside the lock inventory", ""])
    for item in provenance.get("build_time_references", []):
        lines.append(
            f"- **{item['source_name']}** — upstream-declared "
            f"`{item['declared_upstream_license']}`; conclusion `NOASSERTION`; "
            f"status `{item['distribution_status']}`. {item['limitation']}"
        )
    lines.extend([
        "", "## Locked JavaScript packages", "",
        f"The lock inventory contains {len(inventory)} resolution records and "
        f"{len(unique_packages)} unique package/version pairs. Lock presence is not runtime",
        "reachability or permission to distribute. Every conclusion below is `NOASSERTION`.", "",
        "| Package | Version | License conclusion |", "|---|---:|---|",
    ])
    lines.extend(f"| `{name}` | `{version}` | `NOASSERTION` |" for name, version in unique_packages)
    lines.extend(["", "Generated by `python scripts/generate_third_party.py`.", ""])
    return "\n".join(lines).encode("utf-8")


def build_outputs() -> dict[Path, bytes]:
    provenance = load_jsonc(SOURCE)
    reject_restricted_material(provenance)
    if provenance.get("distribution_authority") != "none":
        raise BaselineError("distribution authority must remain none")
    tracked = tracked_regular_files()
    lock = load_jsonc(ROOT / "bun.lock")
    manifests = validate_private_manifests(lock, tracked)
    inventory, by_key = package_inventory(lock)
    validate_pinned_license_review_scope(provenance)
    observations = validate_license_observations(provenance, inventory)
    build_time_references = validate_build_time_references(provenance, tracked)
    source_inventory = source_asset_inventory(provenance, tracked)
    source_inventory["build_time_references"] = build_time_references
    outputs = {
        GENERATED / "dependency-inventory.json": json_bytes({
            "schema_version": "1.0.0", "generated_from": "bun.lock",
            "inventory_scope": "complete-bun-lock-resolution-records",
            "distribution_authority": "none",
            "license_conclusion_default": "NOASSERTION", "records": inventory,
        }),
        GENERATED / "source-asset-inventory.json": json_bytes(source_inventory),
        ROOT / "THIRD_PARTY_NOTICES.md": notices(provenance, inventory, observations),
    }
    workspaces = lock["workspaces"]
    for workspace_path in DISTRIBUTABLES:
        outputs[GENERATED / "sbom" / f"{Path(workspace_path).name}.cdx.json"] = json_bytes(
            declared_sbom(
                workspace_path, workspaces[workspace_path], manifests[workspace_path], by_key
            )
        )
    return outputs


def unexpected_generated_paths(
    outputs: dict[Path, bytes], generated_root: Path = GENERATED
) -> list[str]:
    expected = {
        path.resolve()
        for path in outputs
        if path == generated_root or generated_root in path.parents
    }
    if not generated_root.exists():
        return []
    actual = {
        path.resolve()
        for path in generated_root.rglob("*")
        if path.is_file() or path.is_symlink()
    }
    return sorted(
        path.relative_to(generated_root.resolve()).as_posix()
        for path in actual.difference(expected)
    )


def run(check: bool) -> int:
    try:
        outputs = build_outputs()
    except BaselineError as error:
        print(f"third-party baseline error: {error}", file=sys.stderr)
        return 1
    unexpected = unexpected_generated_paths(outputs)
    if unexpected:
        print("third-party generated tree contains unexpected files:", file=sys.stderr)
        for path in unexpected:
            print(f"  {path}", file=sys.stderr)
        return 1
    stale: list[str] = []
    for path, content in sorted(outputs.items(), key=lambda item: item[0].as_posix()):
        if check:
            if not path.is_file() or path.read_bytes() != content:
                stale.append(path.relative_to(ROOT).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        print("third-party generated output is stale or missing:", file=sys.stderr)
        for path in stale:
            print(f"  {path}", file=sys.stderr)
        return 1
    action = "checked" if check else "generated"
    print(f"Third-party baseline {action}: {len(outputs)} deterministic outputs.")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    arguments = parser.parse_args()
    raise SystemExit(run(arguments.check))
