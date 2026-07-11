#!/usr/bin/env python3
"""Generate deterministic machine-readable documentation registries.

The script uses only the Python standard library. It generates:
- registry/documents.json
- registry/capabilities.json
- registry/events.json

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
CAPABILITY = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*)`\s*$")
EVENT = re.compile(
    r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*)`\s*$"
)
HEADING = re.compile(r"^(#{2,6})\s+(.+?)\s*$")
EVENT_HEADING = re.compile(r"\bevents?\b", re.IGNORECASE)


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
    """Return every Markdown file with PDA front matter, regardless of folder."""
    files: list[Path] = []
    for path in sorted(ROOT.rglob("*.md")):
        if any(part.startswith(".") for part in path.relative_to(ROOT).parts):
            continue
        metadata = parse_front_matter(path)
        if metadata and metadata.get("document_id"):
            files.append(path)
    return files


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
                "path": path.relative_to(ROOT).as_posix(),
                "title": metadata.get("title"),
                "version": metadata.get("version"),
                "status": metadata.get("status"),
                "owner": metadata.get("owner"),
                "last_reviewed": metadata.get("last_reviewed"),
                "related_adrs": metadata.get("related_adrs", []),
            }
        )

    records.sort(key=lambda item: item["document_id"])
    return {"schema_version": "1.1.0", "documents": records}


def load_namespaces() -> dict[str, dict[str, Any]]:
    path = ROOT / "registry" / "domains.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    namespaces: dict[str, dict[str, Any]] = {}
    for record in data.get("namespaces", []):
        namespaces[record["prefix"]] = record
        for prefix in record.get("additional_prefixes", []):
            namespaces[prefix] = record
    return namespaces


def load_first_slice() -> tuple[set[str], set[str]]:
    path = ROOT / "registry" / "first-slice.json"
    if not path.exists():
        return set(), set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return set(data.get("capabilities", [])), set(data.get("explicitly_deferred", []))


def build_capabilities_registry() -> dict[str, Any]:
    path = ROOT / "04-Business-Domains" / "BUSINESS_CAPABILITY_MAP.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    namespaces = load_namespaces()
    first_slice, explicitly_deferred = load_first_slice()
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
                "source_path": path.relative_to(ROOT).as_posix(),
                "source_heading": current_heading,
                "source_line": line_number,
                "status": "Draft",
                "dependencies": [],
                "packaging_class": "Unclassified",
                "offline": "Undeclared",
                "first_slice": capability_id in first_slice,
                "explicitly_deferred": capability_id in explicitly_deferred,
            }
        )

    unknown = sorted((first_slice | explicitly_deferred) - seen)
    if unknown:
        raise ValueError(f"first-slice registry contains unknown capabilities: {', '.join(unknown)}")

    records.sort(key=lambda item: item["id"])
    return {"schema_version": "1.1.0", "capabilities": records}


def build_events_registry() -> dict[str, Any]:
    namespaces = load_namespaces()
    records: list[dict[str, Any]] = []
    seen: dict[str, str] = {}

    for path in governed_documents():
        metadata = parse_front_matter(path) or {}
        current_heading = ""
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            heading = HEADING.match(line)
            if heading:
                current_heading = heading.group(2)
                continue
            if not EVENT_HEADING.search(current_heading):
                continue
            match = EVENT.match(line)
            if not match:
                continue
            event_name = match.group(1)
            source = f"{path.relative_to(ROOT).as_posix()}:{line_number}"
            if event_name in seen:
                raise ValueError(f"duplicate event definition {event_name}: {seen[event_name]} and {source}")
            seen[event_name] = source
            namespace, entity, fact, version = event_name.split(".")
            owner = namespaces.get(namespace)
            if owner is None:
                raise ValueError(f"unknown event prefix {namespace!r}: {event_name}")
            records.append(
                {
                    "name": event_name,
                    "namespace": namespace,
                    "owner": owner["name"],
                    "entity": entity,
                    "fact": fact,
                    "major_version": int(version[1:]),
                    "source_path": path.relative_to(ROOT).as_posix(),
                    "source_heading": current_heading,
                    "source_line": line_number,
                    "document_status": metadata.get("status"),
                }
            )

    records.sort(key=lambda item: item["name"])
    return {"schema_version": "1.0.0", "events": records}


def render(value: dict[str, Any]) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def write_or_check(path: Path, content: str, check: bool) -> bool:
    if check:
        current = path.read_text(encoding="utf-8") if path.exists() else ""
        if current != content:
            print(f"stale registry: {path.relative_to(ROOT).as_posix()}", file=sys.stderr)
            return False
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {path.relative_to(ROOT).as_posix()}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    try:
        documents = render(build_documents_registry())
        capabilities = render(build_capabilities_registry())
        events = render(build_events_registry())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"registry generation failed: {exc}", file=sys.stderr)
        return 1

    ok = True
    ok &= write_or_check(ROOT / "registry" / "documents.json", documents, args.check)
    ok &= write_or_check(ROOT / "registry" / "capabilities.json", capabilities, args.check)
    ok &= write_or_check(ROOT / "registry" / "events.json", events, args.check)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
