#!/usr/bin/env python3
"""Generate deterministic machine-readable Platform Design Authority registries."""

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
IGNORED_TREE_PARTS = {"node_modules", ".next", ".turbo", ".source", "dist"}

CAPABILITY_SOURCES = [
    ROOT / "04-Business-Domains" / "BUSINESS_CAPABILITY_MAP.md",
    ROOT / "04-Business-Domains" / "CAPABILITY_MAP_AMENDMENT-2026-07-11.md",
    ROOT / "08-Marketplace" / "MARKETPLACE_ARCHITECTURE.md",
]

TEST_DIMENSIONS = [
    "happy_path",
    "validation_and_denial",
    "tenant_isolation",
    "permission_and_entitlement",
    "idempotency_and_duplicate",
    "concurrency_and_conflict",
    "events_jobs_and_projections",
    "audit_and_observability",
    "privacy_and_classification",
    "offline_and_degraded",
    "accessibility_and_responsive",
    "performance_and_capacity",
    "recovery_replay_and_reconciliation",
]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


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
    files: list[Path] = []
    for path in sorted(ROOT.rglob("*.md")):
        rel = path.relative_to(ROOT)
        if any(part.startswith(".") or part in IGNORED_TREE_PARTS for part in rel.parts):
            continue
        if rel.parts and rel.parts[0] == "templates":
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
            "review_evidence": metadata.get("review_evidence"),
        })
    records.sort(key=lambda item: item["document_id"])
    return {"schema_version": "1.2.0", "documents": records}


def load_namespaces() -> dict[str, dict[str, Any]]:
    data = load_json(ROOT / "registry" / "domains.json")
    namespaces: dict[str, dict[str, Any]] = {}
    for record in data.get("namespaces", []):
        namespaces[str(record["prefix"])] = record
        for prefix in record.get("additional_prefixes", []):
            namespaces[str(prefix)] = record
    return namespaces


def load_first_slice() -> tuple[dict[str, str], set[str], dict[str, str]]:
    data = load_json(ROOT / "registry" / "first-slice.json")
    depth: dict[str, str] = {}
    deferred: set[str] = set()
    reasons: dict[str, str] = {}
    for item in data.get("capabilities", []):
        if not isinstance(item, dict) or not item.get("id"):
            raise ValueError("first-slice capabilities must be objects with id and depth")
        capability_id = str(item["id"])
        value = str(item.get("depth", ""))
        if value not in {"full", "prototype", "seam"}:
            raise ValueError(f"invalid first-slice depth {value!r} for {capability_id}")
        if capability_id in depth:
            raise ValueError(f"duplicate first-slice capability: {capability_id}")
        depth[capability_id] = value
    for item in data.get("explicitly_deferred", []):
        if not isinstance(item, dict) or not item.get("id"):
            raise ValueError("deferred capabilities must be objects with id and reason")
        capability_id = str(item["id"])
        deferred.add(capability_id)
        reasons[capability_id] = str(item.get("reason", ""))
    overlap = sorted(set(depth) & deferred)
    if overlap:
        raise ValueError(f"capabilities cannot be included and deferred: {', '.join(overlap)}")
    return depth, deferred, reasons


def is_capability_heading(heading: str) -> bool:
    normalized = heading.strip().lower()
    approved = {
        "platform kernel", "shared engine registrations", "ai orchestration", "loyalty",
        "fiscalization and statutory reporting", "security platform", "developer platform",
        "commercial control plane", "capability family", "party and relationships",
        "payment orchestration", "business dna",
        "commerce", "product catalog", "inventory", "warehouse", "procurement", "finance",
        "crm", "workforce", "payroll", "supply chain and logistics", "manufacturing",
        "projects", "service and help desk", "assets and maintenance", "fleet", "rental",
        "marketing", "documents and knowledge", "governance and compliance",
        "planning and analytics",
    }
    return normalized in approved


def load_capability_metadata() -> tuple[dict[str, Any], dict[str, Any]]:
    data = load_json(ROOT / "registry" / "capability-metadata.json")
    return data.get("namespace_defaults", {}), data.get("capabilities", {})


def build_capabilities_registry() -> dict[str, Any]:
    namespaces = load_namespaces()
    first_slice_depth, explicitly_deferred, deferred_reasons = load_first_slice()
    namespace_defaults, overrides = load_capability_metadata()
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
            namespace = capability_id.split(".", 1)[0]
            owner = namespaces.get(namespace)
            if owner is None:
                raise ValueError(f"unknown capability prefix {namespace!r}: {capability_id}")
            default = dict(namespace_defaults.get(namespace, {}))
            explicit = dict(overrides.get(capability_id, {}))
            metadata = {**default, **explicit}
            records.append({
                "id": capability_id,
                "namespace": namespace,
                "owner": owner["name"],
                "source_path": path.relative_to(ROOT).as_posix(),
                "source_heading": current_heading,
                "source_line": line_number,
                "status": "Draft",
                "packaging_class": metadata.get("packaging_class", "NeedsClassification"),
                "offline": metadata.get("offline", "NeedsDeclaration"),
                "dependencies": sorted(set(metadata.get("dependencies", []))),
                "metadata_source": "explicit" if capability_id in overrides else "namespace-default",
                "first_slice": capability_id in first_slice_depth,
                "first_slice_depth": first_slice_depth.get(capability_id),
                "explicitly_deferred": capability_id in explicitly_deferred,
                "deferral_reason": deferred_reasons.get(capability_id),
            })

    unknown = sorted((set(first_slice_depth) | explicitly_deferred | set(overrides)) - seen)
    if unknown:
        raise ValueError(f"capability metadata references unknown capabilities: {', '.join(unknown)}")
    records.sort(key=lambda item: item["id"])
    return {
        "schema_version": "1.3.0",
        "capability_sources": [path.relative_to(ROOT).as_posix() for path in CAPABILITY_SOURCES],
        "metadata_source": "registry/capability-metadata.json",
        "capabilities": records,
    }


def is_canonical_event_heading(heading: str) -> bool:
    normalized = heading.strip().lower()
    return normalized == "events" or normalized.endswith(" events") or normalized in {
        "event integration", "required events", "representative events",
    }


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
            schema_path = ROOT / "schemas" / "events" / f"{event_name}.schema.json"
            records.append({
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
                "schema_path": schema_path.relative_to(ROOT).as_posix() if schema_path.exists() else None,
            })
    records.sort(key=lambda item: item["name"])
    return {"schema_version": "1.2.0", "events": records}


def build_permissions_registry() -> dict[str, Any]:
    path = ROOT / "01-Platform" / "FIRST_SLICE_PERMISSION_CATALOG.md"
    namespaces = load_namespaces()
    endpoints = load_json(ROOT / "registry" / "endpoint-permissions.json").get("endpoints", [])
    endpoint_counts: dict[str, int] = {}
    for item in endpoints:
        permission = item.get("permission")
        if permission:
            endpoint_counts[str(permission)] = endpoint_counts.get(str(permission), 0) + 1
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
            "id": permission_id,
            "namespace": namespace,
            "owner": owner["name"],
            "resource": resource,
            "action": action,
            "source_path": path.relative_to(ROOT).as_posix(),
            "source_heading": current_heading,
            "source_line": line_number,
            "status": "Draft",
            "endpoint_count": endpoint_counts.get(permission_id, 0),
        })
    unknown = sorted(set(endpoint_counts) - seen)
    if unknown:
        raise ValueError(f"endpoint manifest references unknown permissions: {', '.join(unknown)}")
    records.sort(key=lambda item: item["id"])
    return {
        "schema_version": "1.1.0",
        "endpoint_manifest": "registry/endpoint-permissions.json",
        "permissions": records,
    }


def build_first_slice_tests_registry(capabilities: dict[str, Any]) -> dict[str, Any]:
    first_slice = [item for item in capabilities["capabilities"] if item.get("first_slice")]
    metadata = load_json(ROOT / "registry" / "capability-metadata.json")
    depth_defaults = metadata.get("test_dimension_defaults", {})
    allowed_statuses = {"required", "not-applicable", "deferred-by-depth"}
    records: list[dict[str, Any]] = []
    for item in first_slice:
        depth = item["first_slice_depth"]
        dimensions = {dimension: "required" for dimension in TEST_DIMENSIONS}
        dimension_reasons: dict[str, str] = {}
        for dimension, override in depth_defaults.get(depth, {}).items():
            if dimension not in dimensions:
                raise ValueError(f"unknown test dimension override {dimension!r} for depth {depth!r}")
            status = str(override.get("status", ""))
            reason = str(override.get("reason", "")).strip()
            if status not in allowed_statuses:
                raise ValueError(f"invalid test dimension status {status!r} for {depth}.{dimension}")
            if status == "not-applicable" and not reason:
                raise ValueError(f"not-applicable test dimension requires a reason: {depth}.{dimension}")
            dimensions[dimension] = status
            if reason:
                dimension_reasons[dimension] = reason
        records.append({
            "capability_id": item["id"],
            "owner": item["owner"],
            "depth": depth,
            "fixture": "Demerara Retail Test Group",
            "dimensions": dimensions,
            "dimension_reasons": dimension_reasons,
            "evidence_status": "Planned",
            "evidence_paths": [],
            "blocking_defects": [],
        })
    records.sort(key=lambda item: item["capability_id"])
    return {
        "schema_version": "1.0.0",
        "source_document": "16-Testing/FIRST_SLICE_CAPABILITY_TEST_MATRIX.md",
        "source_registry": "registry/first-slice.json",
        "dimensions": TEST_DIMENSIONS,
        "tests": records,
    }


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
        documents = build_documents_registry()
        capabilities = build_capabilities_registry()
        events = build_events_registry()
        permissions = build_permissions_registry()
        tests = build_first_slice_tests_registry(capabilities)
        outputs = {
            ROOT / "registry" / "documents.json": render(documents),
            ROOT / "registry" / "capabilities.json": render(capabilities),
            ROOT / "registry" / "events.json": render(events),
            ROOT / "registry" / "permissions.json": render(permissions),
            ROOT / "registry" / "first-slice-tests.json": render(tests),
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
