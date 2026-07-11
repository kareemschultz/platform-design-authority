#!/usr/bin/env python3
"""Generate deterministic machine-readable documentation registries.

Generates documents, capabilities, events, and permissions registries.
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
EVENT = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*)`\s*$")
PERMISSION = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*)`\s*$")
HEADING = re.compile(r"^(#{2,6})\s+(.+?)\s*$")
CAPABILITY_SOURCES = [
    ROOT / "04-Business-Domains" / "BUSINESS_CAPABILITY_MAP.md",
    ROOT / "08-Marketplace" / "MARKETPLACE_ARCHITECTURE.md",
]


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
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            body = value[1:-1].strip()
            result[key.strip()] = [] if not body else [item.strip() for item in body.split(",")]
        elif value in {"null", "~"}:
            result[key.strip()] = None
        else:
            result[key.strip()] = value.strip('"').strip("'")
    return result


def governed_documents() -> list[Path]:
    files: list[Path] = []
    for path in sorted(ROOT.rglob("*.md")):
        rel = path.relative_to(ROOT)
        if any(part.startswith(".") for part in rel.parts) or (rel.parts and rel.parts[0] == "templates"):
            continue
        metadata = parse_front_matter(path)
        if metadata and metadata.get("document_id"):
            files.append(path)
    return files


def build_documents_registry() -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    for path in governed_documents():
        metadata = parse_front_matter(path) or {}
        document_id = str(metadata["document_id"])
        if document_id in seen:
            raise ValueError(f"duplicate document_id: {document_id}")
        seen.add(document_id)
        records.append({
            "document_id": document_id,
            "path": path.relative_to(ROOT).as_posix(),
            "title": metadata.get("title"),
            "version": metadata.get("version"),
            "status": metadata.get("status"),
            "owner": metadata.get("owner"),
            "last_reviewed": metadata.get("last_reviewed"),
            "related_adrs": metadata.get("related_adrs", []),
        })
    records.sort(key=lambda item: item["document_id"])
    return {"schema_version": "1.1.0", "documents": records}


def load_namespaces() -> dict[str, dict[str, Any]]:
    data = json.loads((ROOT / "registry" / "domains.json").read_text(encoding="utf-8"))
    namespaces: dict[str, dict[str, Any]] = {}
    for record in data.get("namespaces", []):
        namespaces[record["prefix"]] = record
        for prefix in record.get("additional_prefixes", []):
            namespaces[prefix] = record
    return namespaces


def load_first_slice() -> tuple[dict[str, str], set[str]]:
    path = ROOT / "registry" / "first-slice.json"
    if not path.exists():
        return {}, set()
    data = json.loads(path.read_text(encoding="utf-8"))
    capability_depth: dict[str, str] = {}
    for item in data.get("capabilities", []):
        if isinstance(item, str):
            capability_depth[item] = "undeclared"
        elif isinstance(item, dict) and item.get("id"):
            depth = str(item.get("depth", "undeclared"))
            if depth not in {"full", "prototype", "seam", "undeclared"}:
                raise ValueError(f"invalid first-slice depth {depth!r} for {item['id']}")
            capability_depth[str(item["id"])] = depth
        else:
            raise ValueError("first-slice capabilities must be strings or objects with id")
    deferred: set[str] = set()
    for item in data.get("explicitly_deferred", []):
        if isinstance(item, str):
            deferred.add(item)
        elif isinstance(item, dict) and item.get("id"):
            deferred.add(str(item["id"]))
        else:
            raise ValueError("explicitly_deferred entries must be strings or objects with id")
    return capability_depth, deferred


def is_capability_heading(heading: str) -> bool:
    normalized = heading.strip().lower()
    return normalized in {
        "platform kernel", "shared engine registrations", "ai orchestration", "loyalty",
        "fiscalization and statutory reporting", "security platform", "developer platform",
        "commercial control plane", "capability family",
    } or normalized in {
        "commerce", "product catalog", "inventory", "warehouse", "procurement", "finance", "crm",
        "workforce", "payroll", "supply chain and logistics", "manufacturing", "projects",
        "service and help desk", "assets and maintenance", "fleet", "rental", "marketing",
        "documents and knowledge", "governance and compliance", "planning and analytics",
    }


def build_capabilities_registry() -> dict[str, Any]:
    namespaces = load_namespaces()
    first_slice_depth, explicitly_deferred = load_first_slice()
    records: list[dict[str, Any]] = []
    seen: set[str] = set()

    for path in CAPABILITY_SOURCES:
        current_heading = ""
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            heading = HEADING.match(line)
            if heading:
                current_heading = heading.group(2)
                continue
            if not is_capability_heading(current_heading):
                continue
            match = CAPABILITY.match(line)
            if not match:
                continue
            capability_id = match.group(1)
            if capability_id in seen:
                raise ValueError(f"duplicate canonical capability: {capability_id}")
            seen.add(capability_id)
            prefix = capability_id.split(".", 1)[0]
            namespace = namespaces.get(prefix)
            if namespace is None:
                raise ValueError(f"unknown capability prefix {prefix!r}: {capability_id}")
            records.append({
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
                "first_slice": capability_id in first_slice_depth,
                "first_slice_depth": first_slice_depth.get(capability_id),
                "explicitly_deferred": capability_id in explicitly_deferred,
            })

    unknown = sorted((set(first_slice_depth) | explicitly_deferred) - seen)
    if unknown:
        raise ValueError(f"first-slice registry contains unknown capabilities: {', '.join(unknown)}")
    records.sort(key=lambda item: item["id"])
    return {"schema_version": "1.2.0", "capability_sources": [p.relative_to(ROOT).as_posix() for p in CAPABILITY_SOURCES], "capabilities": records}


def is_canonical_event_heading(heading: str) -> bool:
    normalized = heading.strip().lower()
    return normalized == "events" or normalized.endswith(" events") or normalized in {"event integration", "required events", "representative events"}


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
            if not is_canonical_event_heading(current_heading):
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
            records.append({
                "name": event_name, "namespace": namespace, "owner": owner["name"],
                "entity": entity, "fact": fact, "major_version": int(version[1:]),
                "source_path": path.relative_to(ROOT).as_posix(), "source_heading": current_heading,
                "source_line": line_number, "document_status": metadata.get("status"),
            })
    records.sort(key=lambda item: item["name"])
    return {"schema_version": "1.1.0", "events": records}


def build_permissions_registry() -> dict[str, Any]:
    path = ROOT / "01-Platform" / "FIRST_SLICE_PERMISSION_CATALOG.md"
    namespaces = load_namespaces()
    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    current_heading = ""
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        heading = HEADING.match(line)
        if heading:
            current_heading = heading.group(2)
            continue
        match = PERMISSION.match(line)
        if not match:
            continue
        permission_id = match.group(1)
        if permission_id in seen:
            raise ValueError(f"duplicate permission: {permission_id}")
        seen.add(permission_id)
        namespace, resource, action = permission_id.split(".")
        owner = namespaces.get(namespace)
        if owner is None:
            raise ValueError(f"unknown permission prefix {namespace!r}: {permission_id}")
        records.append({
            "id": permission_id, "namespace": namespace, "owner": owner["name"],
            "resource": resource, "action": action,
            "source_path": path.relative_to(ROOT).as_posix(), "source_heading": current_heading,
            "source_line": line_number, "status": "Draft",
        })
    records.sort(key=lambda item: item["id"])
    return {"schema_version": "1.0.0", "permissions": records}


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
        outputs = {
            ROOT / "registry" / "documents.json": render(build_documents_registry()),
            ROOT / "registry" / "capabilities.json": render(build_capabilities_registry()),
            ROOT / "registry" / "events.json": render(build_events_registry()),
            ROOT / "registry" / "permissions.json": render(build_permissions_registry()),
        }
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"registry generation failed: {exc}", file=sys.stderr)
        return 1
    ok = True
    for path, content in outputs.items():
        ok &= write_or_check(path, content, args.check)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
