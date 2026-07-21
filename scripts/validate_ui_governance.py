#!/usr/bin/env python3
"""Enforce the CLAUDE.md/AGENTS.md §8 UI governance rules that were
previously honor-system: no CI step, script, or lint rule checked provenance
records, catalog "Platform Approved" evidence, or raw-palette prohibitions
before this validator existed.

Three independent checks:

1. Raw palette: every `.ts`/`.tsx`/`.css` file under `apps/` or `packages/`
   is free of raw hex color literals and Tailwind palette utility classes
   (e.g. `bg-red-500`), except an explicit, justified allowlist of
   token/config source files. Seeded 2026-07-20: the allowlist starts at
   exactly the three files an audit of the live repository found, each a
   token source rather than a component -- there was no burn-down debt to
   grandfather in.
2. Provenance records: every JSON file under `evidence/ui-provenance/`
   conforms to `registry/premium-ui-provenance-template.json`'s field set,
   and its commercially sensitive fields (`license_owner`,
   `permitted_entity`, `permitted_products`) stay null in this public
   repository, per `COMPONENT_ACQUISITION_POLICY.md`'s instruction that
   sensitive commercial evidence remains outside the public repository.
3. Catalog evidence: every `PREFERRED_COMPONENT_CATALOG.md` entry whose
   Status cites "Platform Approved" also cites a non-placeholder
   License/provenance record, Accessibility evidence, and Tests entry.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
IGNORED_TREE_PARTS = {"node_modules", ".next", ".turbo", ".source", "dist"}
UI_ROOTS = ("apps", "packages")
SCANNED_EXTENSIONS = {".ts", ".tsx", ".css"}

PROVENANCE_DIR = ROOT / "evidence" / "ui-provenance"
PROVENANCE_TEMPLATE = ROOT / "registry" / "premium-ui-provenance-template.json"
CATALOG_FILE = ROOT / "docs" / "blueprint" / "09-UX" / "PREFERRED_COMPONENT_CATALOG.md"

# Seeded 2026-07-20 audit: the entire allowlist for raw hex literals. Each
# entry is a token/config source, never a component. A new entry here needs
# the same justification -- this file defines a token, it does not consume
# one -- recorded in the PR that adds it.
HEX_ALLOWLIST = {
    "apps/native/lib/constants.ts",
    "apps/web/src/app/manifest.ts",
    "packages/ui-web/core/src/styles/globals.css",
}

HEX_PATTERN = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")
TAILWIND_PALETTE_PATTERN = re.compile(
    r"\b(?:bg|text|border|ring|fill|stroke)-(?:red|blue|green|yellow|purple|pink|indigo|"
    r"gray|grey|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|"
    r"fuchsia|rose)-[0-9]{2,3}\b"
)

SENSITIVE_PROVENANCE_FIELDS = ("license_owner", "permitted_entity", "permitted_products")
PLACEHOLDER_VALUES = {"", "tbd", "n/a", "na", "none", "todo", "-"}


def ui_source_files(roots: tuple[str, ...] = UI_ROOTS) -> list[Path]:
    files: list[Path] = []
    for root_name in roots:
        root = ROOT / root_name
        if not root.exists():
            continue
        for directory, subdirectories, filenames in os.walk(root):
            subdirectories[:] = [
                name
                for name in subdirectories
                if not name.startswith(".") and name not in IGNORED_TREE_PARTS
            ]
            base = Path(directory)
            for filename in filenames:
                path = base / filename
                if path.suffix in SCANNED_EXTENSIONS:
                    files.append(path)
    return sorted(files)


def check_raw_palette() -> list[str]:
    errors: list[str] = []
    for path in ui_source_files():
        rel = path.relative_to(ROOT).as_posix()
        if rel in HEX_ALLOWLIST:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if HEX_PATTERN.search(content):
            errors.append(f"{rel}: raw hex color literal found; use a semantic token")
        if TAILWIND_PALETTE_PATTERN.search(content):
            errors.append(
                f"{rel}: raw Tailwind palette utility class found; use a semantic token"
            )
    return errors


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def check_provenance_records() -> list[str]:
    errors: list[str] = []
    if not PROVENANCE_DIR.exists():
        return errors
    template = load_json(PROVENANCE_TEMPLATE)
    required_fields = set(template["record"].keys())
    for path in sorted(PROVENANCE_DIR.glob("*.json")):
        rel = path.relative_to(ROOT).as_posix()
        try:
            data = load_json(path)
        except (ValueError, OSError) as exc:
            errors.append(f"{rel}: could not parse JSON ({exc})")
            continue
        record = data.get("record") if isinstance(data, dict) else None
        if not isinstance(record, dict):
            errors.append(f"{rel}: missing top-level 'record' object")
            continue
        missing = required_fields - record.keys()
        if missing:
            errors.append(
                f"{rel}: missing required provenance fields: {sorted(missing)}"
            )
        for field in SENSITIVE_PROVENANCE_FIELDS:
            if record.get(field) not in (None, [], ""):
                errors.append(
                    f"{rel}: {field!r} must stay null in the public repository; "
                    "sensitive commercial or licensing detail belongs in a private "
                    "provenance inventory per COMPONENT_ACQUISITION_POLICY.md"
                )
    return errors


def parse_catalog_entries(text: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for block in re.split(r"^### ", text, flags=re.MULTILINE)[1:]:
        lines = block.splitlines()
        name = lines[0].strip()
        fields: dict[str, str] = {}
        for line in lines[1:]:
            match = re.match(r"-\s*([A-Za-z /]+):\s*(.*)", line)
            if match:
                fields[match.group(1).strip()] = match.group(2).strip()
        entries.append({"name": name, **fields})
    return entries


def check_catalog_platform_approved(text: str | None = None) -> list[str]:
    if text is None:
        if not CATALOG_FILE.exists():
            return []
        text = CATALOG_FILE.read_text(encoding="utf-8")
    errors: list[str] = []
    for entry in parse_catalog_entries(text):
        status = entry.get("Status", "")
        if "platform approved" not in status.lower():
            continue
        name = entry["name"]
        for field in ("License/provenance record", "Accessibility evidence", "Tests"):
            value = entry.get(field, "").strip().lower()
            if value in PLACEHOLDER_VALUES:
                errors.append(f"{name!r}: Platform Approved entry is missing {field}")
    return errors


def main() -> int:
    errors = (
        check_raw_palette()
        + check_provenance_records()
        + check_catalog_platform_approved()
    )
    if errors:
        print("UI governance validation failed:", file=sys.stderr)
        for error in sorted(set(errors)):
            print(f"- {error}", file=sys.stderr)
        return 1
    print("UI governance validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
