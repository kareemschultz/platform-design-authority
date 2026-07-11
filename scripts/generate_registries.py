#!/usr/bin/env python3
"""Generate deterministic machine-readable documentation registries.

The script uses only the Python standard library. It generates:
- registry/documents.json
- registry/capabilities.json

Run with --check in CI to fail when committed registries are stale.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
NUMBERED_SECTION = re.compile(r"^\d{2}-")
CAPABILITY = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*)`\s*$")
HEADING = re.compile(r"^(#{2,6})\s+(.+?)\s*$")


def parse_front_matter(path: Path) -> dict[str, Any] | None:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    try:
        end = lines.index("---", 1)
    except ValueError:
        return None

    result: dict[str, Any] = {}
    for raw in lines[1:end]:
        if not raw.strip() or raw.lstrip().startswith("#") or ":" not in raw:
            continue
        key, value = raw.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            body = value[1:-1].strip()
            result[key] = [] if not body else [item.strip() for item in body.split(",")]
        elif value in {"null", "~"}:
            result[key] = None
        else:
            result[key] = value.strip('"').strip("'")
    return result


def governed_documents() -> list[Path]:
    files = [ROOT / "PLATFORM_MANIFEST.md"]
    for directory in sorted(ROOT.iterdir()):
        if directory.is_dir() and NUMBERED_SECTION.match(directory.name):
            files.extend(sorted(directory.rglob("*.md")))
    return [path for path in files if path.exists()]


def build_documents_registry() -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    seen: set[str] = set()

    for path in governed_documents():
        metadata = parse_front_matter(path)
        if not metadata or not metadata.get("document_id"):
            continue
        document_id = str(metadata["document_id"])
        if document_id in seen:
            raise ValueError(f"duplicate document_id: {document_id}")
        seen.add(document_id)
        records.append(
            {
                "document_id": document_id,
                "path": str(path.relative_to(ROOT)),
                "title": metadata.get("title"),
                "version": metadata.get("version"),
                "status": metadata.get("status"),
                "owner": metadata.get("owner"),
                "last_reviewed": metadata.get("last_reviewed"),
                "related_adrs": metadata.get("related_adrs", []),
            }
        )

    records.sort(key=lambda item: item["document_id"])
    return {"schema_version": "1.0.0", "documents": records}


def load_namespaces() -> dict[str, dict[str, Any]]:
    path = ROOT / "registry" / "domains.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    namespaces: dict[str, dict[str, Any]] = {}
    for record in data.get("namespaces", []):
        namespaces[record["prefix"]] = record
        for prefix in record.get("additional_prefixes", []):
            namespaces[prefix] = record
    return namespaces


def build_capabilities_registry() -> dict[str, Any]:
    path = ROOT / "04-Business-Domains" / "BUSINESS_CAPABILITY_MAP.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    namespaces = load_namespaces()
    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    current_heading = ""

    for line_number, line in enumerate(lines, start=1):
        heading = HEADING.match(line)
        if heading:
            current_heading = heading.group(2)
            continue

        match = CAPABILITY.match(line)
        if not match:
            continue
        capability_id = match.group(1)
        if capability_id in seen:
            raise ValueError(f"duplicate capability: {capability_id}")
        seen.add(capability_id)
        prefix = capability_id.split(".", 1)[0]
        namespace = namespaces.get(prefix)
        if namespace is None:
            raise ValueError(f"unknown capability prefix {prefix!r}: {capability_id}")
        records.append(
            {
                "id": capability_id,
                "namespace": prefix,
                "owner": namespace["name"],
                "source_path": str(path.relative_to(ROOT)),
                "source_heading": current_heading,
                "source_line": line_number,
                "status": "Draft",
                "dependencies": [],
                "packaging_class": "Unclassified",
                "offline": "Undeclared",
                "first_slice": False,
            }
        )

    records.sort(key=lambda item: item["id"])
    return {"schema_version": "1.0.0", "capabilities": records}


def render(value: dict[str, Any]) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def write_or_check(path: Path, content: str, check: bool) -> bool:
    if check:
        current = path.read_text(encoding="utf-8") if path.exists() else ""
        if current != content:
            print(f"stale registry: {path.relative_to(ROOT)}", file=sys.stderr)
            return False
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    try:
        documents = render(build_documents_registry())
        capabilities = render(build_capabilities_registry())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"registry generation failed: {exc}", file=sys.stderr)
        return 1

    ok = True
    ok &= write_or_check(ROOT / "registry" / "documents.json", documents, args.check)
    ok &= write_or_check(ROOT / "registry" / "capabilities.json", capabilities, args.check)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
