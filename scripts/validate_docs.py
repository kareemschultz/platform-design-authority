#!/usr/bin/env python3
"""Validate Platform Design Authority documentation governance rules.

Uses only the Python standard library so it can run locally and in CI without
installing project dependencies.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NUMBERED_SECTION = re.compile(r"^\d{2}-")
ADR_FILE = re.compile(r"^ADR-\d{4}-[A-Z0-9-]+\.md$")
SPEC_FILE = re.compile(r"^[A-Z0-9_]+(?:-\d{4}-\d{2}-\d{2})?\.md$")
DOCUMENT_ID = re.compile(r"^(?:PDA-[A-Z]+-\d{3}|ADR-\d{4})$")
VALID_STATUSES = {
    "Planned",
    "Draft",
    "Proposed",
    "In Review",
    "Approved",
    "Accepted",
    "Ratified",
    "Deprecated",
    "Superseded",
    "Archived",
}
REQUIRED_FIELDS = {"document_id", "title", "version", "status", "owner", "last_reviewed"}


def parse_front_matter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening front-matter delimiter")

    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("missing closing front-matter delimiter") from exc

    values: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"invalid front-matter line: {line!r}")
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def governed_markdown_files() -> list[Path]:
    files: list[Path] = [ROOT / "PLATFORM_MANIFEST.md"]
    for directory in ROOT.iterdir():
        if directory.is_dir() and NUMBERED_SECTION.match(directory.name):
            files.extend(sorted(directory.rglob("*.md")))
    return [path for path in files if path.exists()]


def validate_documents() -> list[str]:
    errors: list[str] = []
    ids: dict[str, list[Path]] = defaultdict(list)

    for path in governed_markdown_files():
        rel = path.relative_to(ROOT)
        try:
            meta = parse_front_matter(path)
        except ValueError as exc:
            errors.append(f"{rel}: {exc}")
            continue

        missing = REQUIRED_FIELDS - set(meta)
        if missing:
            errors.append(f"{rel}: missing required fields {sorted(missing)}")

        document_id = meta.get("document_id", "")
        if document_id:
            ids[document_id].append(rel)
            if not DOCUMENT_ID.fullmatch(document_id):
                errors.append(f"{rel}: invalid document_id {document_id!r}")

        status = meta.get("status", "")
        if status and status not in VALID_STATUSES:
            errors.append(f"{rel}: unsupported status {status!r}")

        if path.parent.name == "18-Decisions":
            if not ADR_FILE.fullmatch(path.name):
                errors.append(f"{rel}: ADR filename does not match required pattern")
        elif path.name != "README.md" and not SPEC_FILE.fullmatch(path.name):
            errors.append(
                f"{rel}: specification filename must use uppercase snake case; "
                "a trailing ISO date is allowed only for inherently periodic evidence"
            )

    for document_id, paths in ids.items():
        if len(paths) > 1:
            errors.append(f"duplicate document_id {document_id}: {', '.join(map(str, paths))}")

    return errors


def validate_domain_registry() -> list[str]:
    errors: list[str] = []
    path = ROOT / "registry" / "domains.json"
    if not path.exists():
        return ["registry/domains.json: missing"]

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        return [f"registry/domains.json: {exc}"]

    prefixes: dict[str, str] = {}
    for item in data.get("namespaces", []):
        name = item.get("name")
        prefix = item.get("prefix")
        if not name or not prefix:
            errors.append("registry/domains.json: namespace missing name or prefix")
            continue
        if not re.fullmatch(r"[a-z][a-z0-9-]*", prefix):
            errors.append(f"registry/domains.json: invalid prefix {prefix!r}")
        if prefix in prefixes:
            errors.append(
                f"registry/domains.json: prefix {prefix!r} used by both {prefixes[prefix]!r} and {name!r}"
            )
        prefixes[prefix] = name

        for additional in item.get("additional_prefixes", []):
            if additional in prefixes:
                errors.append(f"registry/domains.json: duplicate additional prefix {additional!r}")
            prefixes[additional] = name

    return errors


def main() -> int:
    errors = validate_documents() + validate_domain_registry()
    if errors:
        print("Documentation governance validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Documentation governance validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
