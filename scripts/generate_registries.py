#!/usr/bin/env python3
"""Generate deterministic machine-readable Platform Design Authority registries."""

from __future__ import annotations

import argparse
import json
import os
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
    ROOT / "docs" / "blueprint" / "04-Business-Domains" / "BUSINESS_CAPABILITY_MAP.md",
    ROOT / "docs" / "blueprint" / "04-Business-Domains" / "CAPABILITY_MAP_AMENDMENT-2026-07-11.md",
    ROOT / "docs" / "blueprint" / "08-Marketplace" / "MARKETPLACE_ARCHITECTURE.md",
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

FIRST_SLICE_EVIDENCE_SOURCES = sorted(
    (ROOT / "evidence" / "first-slice").glob("*-capability-evidence.json")
)


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
    for directory, subdirectories, filenames in os.walk(ROOT):
        subdirectories[:] = [
            name
            for name in subdirectories
            if not name.startswith(".") and name not in IGNORED_TREE_PARTS
        ]
        base = Path(directory)
        for filename in filenames:
            if not filename.endswith(".md"):
                continue
            path = base / filename
            rel = path.relative_to(ROOT)
            if rel.parts[:2] == ("docs", "templates"):
                continue
            metadata = parse_front_matter(path)
            if metadata and metadata.get("document_id"):
                files.append(path)
    return sorted(files)


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
    path = ROOT / "docs" / "blueprint" / "01-Platform" / "FIRST_SLICE_PERMISSION_CATALOG.md"
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
    first_slice_ids = {str(item["id"]) for item in first_slice}
    evidence_catalog: dict[str, dict[str, Any]] = {}
    evidence_coverage: dict[tuple[str, str], list[str]] = {}
    evidenced_capabilities: set[str] = set()
    evidence_workstreams: set[str] = set()

    for source_path in FIRST_SLICE_EVIDENCE_SOURCES:
        source = load_json(source_path)
        if source.get("schema_version") != "1.0.0":
            raise ValueError(f"unsupported evidence schema version: {source_path}")
        workstream_id = str(source.get("workstream_id", "")).strip()
        if not workstream_id or workstream_id in evidence_workstreams:
            raise ValueError(f"duplicate or empty evidence workstream: {workstream_id!r}")
        evidence_workstreams.add(workstream_id)
        declared_capabilities = source.get("capabilities", [])
        if not isinstance(declared_capabilities, list):
            raise ValueError(f"evidence capabilities must be an array: {source_path}")
        declared_capability_ids = {str(value) for value in declared_capabilities}
        for capability_id in declared_capability_ids:
            if capability_id not in first_slice_ids:
                raise ValueError(
                    f"evidence source references a non-first-slice capability: {capability_id}"
                )
            evidenced_capabilities.add(capability_id)

        for evidence in source.get("evidence", []):
            evidence_id = str(evidence.get("id", "")).strip()
            if not evidence_id or evidence_id in evidence_catalog:
                raise ValueError(f"duplicate or empty evidence id: {evidence_id!r}")
            path_value = str(evidence.get("path", "")).strip()
            evidence_path = ROOT / path_value
            if not path_value or not evidence_path.is_file():
                raise ValueError(f"evidence path does not exist: {path_value!r}")
            content = evidence_path.read_text(encoding="utf-8")
            markers = evidence.get("contains", [])
            if not isinstance(markers, list) or not markers:
                raise ValueError(f"evidence {evidence_id} requires contains markers")
            for marker in markers:
                if str(marker) not in content:
                    raise ValueError(
                        f"evidence marker {marker!r} is absent from {path_value}"
                    )
            evidence_capabilities = [str(value) for value in evidence.get("capabilities", [])]
            evidence_dimensions = [str(value) for value in evidence.get("dimensions", [])]
            if not evidence_capabilities or not evidence_dimensions:
                raise ValueError(
                    f"evidence {evidence_id} requires capabilities and dimensions"
                )
            for capability_id in evidence_capabilities:
                if capability_id not in declared_capability_ids:
                    raise ValueError(
                        f"evidence {evidence_id} uses capability {capability_id} not declared by {source_path}"
                    )
            for dimension in evidence_dimensions:
                if dimension not in TEST_DIMENSIONS:
                    raise ValueError(
                        f"evidence {evidence_id} uses unknown dimension {dimension}"
                    )
            evidence_catalog[evidence_id] = {
                "id": evidence_id,
                "path": path_value,
                "kind": str(evidence.get("kind", "automated-test")),
                "runtimes": [str(value) for value in evidence.get("runtimes", [])],
                "command": str(evidence.get("command", "")),
            }
            for capability_id in evidence_capabilities:
                for dimension in evidence_dimensions:
                    evidence_coverage.setdefault((capability_id, dimension), []).append(
                        evidence_id
                    )

    records: list[dict[str, Any]] = []
    required_cell_count = 0
    evidenced_cell_count = 0
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
        required_dimensions = [
            dimension for dimension, status in dimensions.items() if status == "required"
        ]
        required_cell_count += len(required_dimensions)
        capability_id = str(item["id"])
        dimension_evidence = {
            dimension: evidence_coverage.get((capability_id, dimension), [])
            for dimension in TEST_DIMENSIONS
        }
        if capability_id in evidenced_capabilities:
            missing = [
                dimension
                for dimension in required_dimensions
                if not dimension_evidence[dimension]
            ]
            if missing:
                raise ValueError(
                    f"evidenced capability {capability_id} lacks required cells: {', '.join(missing)}"
                )
            evidence_status = "Evidenced"
            evidenced_cell_count += len(required_dimensions)
        else:
            evidence_status = "Planned"
        evidence_ids = sorted(
            {
                evidence_id
                for dimension in dimension_evidence.values()
                for evidence_id in dimension
            }
        )
        records.append({
            "capability_id": capability_id,
            "owner": item["owner"],
            "depth": depth,
            "fixture": "Demerara Retail Test Group",
            "dimensions": dimensions,
            "dimension_reasons": dimension_reasons,
            "evidence_status": evidence_status,
            "dimension_evidence": dimension_evidence,
            "evidence_paths": sorted(
                {evidence_catalog[evidence_id]["path"] for evidence_id in evidence_ids}
            ),
            "blocking_defects": [],
        })
    records.sort(key=lambda item: item["capability_id"])
    return {
        "schema_version": "1.1.0",
        "source_document": "docs/blueprint/16-Testing/FIRST_SLICE_CAPABILITY_TEST_MATRIX.md",
        "source_registry": "registry/first-slice.json",
        "evidence_sources": [
            path.relative_to(ROOT).as_posix() for path in FIRST_SLICE_EVIDENCE_SOURCES
        ],
        "dimensions": TEST_DIMENSIONS,
        "evidence_catalog": [evidence_catalog[key] for key in sorted(evidence_catalog)],
        "coverage": {
            "capabilities_evidenced": len(evidenced_capabilities),
            "capabilities_total": len(first_slice),
            "required_cells_evidenced": evidenced_cell_count,
            "required_cells_total": required_cell_count,
        },
        "tests": records,
    }


def apply_rule_allowances(
    data: dict[str, Any], rule_allowances: dict[str, list[str]]
) -> None:
    """Replace generated allowance lists with the current authoritative source."""
    patterns = {str(item["id"]): item for item in data["forbidden_patterns"]}
    for pattern in patterns.values():
        pattern.pop("except", None)
    for rule, allowed_paths in rule_allowances.items():
        if rule not in patterns:
            raise ValueError(f"architecture-rule allowance uses unknown rule: {rule}")
        patterns[rule]["except"] = allowed_paths


def build_architecture_rules_registry() -> dict[str, Any]:
    """Propagate the governed persistence-owner table into its executable registry."""
    registry_path = ROOT / "registry" / "architecture-rules.json"
    source_path = (
        ROOT
        / "docs"
        / "blueprint"
        / "14-Engineering"
        / "ARCHITECTURE_DEPENDENCY_RULES.md"
    )
    data = load_json(registry_path)
    records: list[dict[str, Any]] = []
    rule_allowances: dict[str, list[str]] = {}
    composition_roots: list[str] = []
    migration_invocation_roots: list[str] = []
    in_owner_table = False
    in_allowance_table = False
    in_composition_table = False
    for line in source_path.read_text(encoding="utf-8").splitlines():
        if line == "### Registered Composition Roots":
            in_composition_table = True
            continue
        if line == "### Registered Persistence Owners":
            in_composition_table = False
            in_owner_table = True
            continue
        if line == "### Registered Rule Allowances":
            in_composition_table = False
            in_owner_table = False
            in_allowance_table = True
            continue
        if in_owner_table and line.startswith("### "):
            in_owner_table = False
        if in_allowance_table and line.startswith("### "):
            in_allowance_table = False
        if in_composition_table and line.startswith("### "):
            in_composition_table = False
        if in_composition_table and line.startswith("| `"):
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) != 5:
                raise ValueError(f"invalid composition-root row: {line}")
            composition_roots.append(cells[0].strip("`"))
            if cells[3].startswith("Allowed"):
                migration_invocation_roots.append(cells[0].strip("`"))
            continue
        if in_allowance_table and line.startswith("| `"):
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) != 3:
                raise ValueError(f"invalid architecture-rule allowance row: {line}")
            rule = cells[0].strip("`")
            allowed_path = cells[1].strip("`")
            rule_allowances.setdefault(rule, []).append(allowed_path)
            continue
        if not in_owner_table or not line.startswith("| `packages/persistence/"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 5:
            raise ValueError(f"invalid persistence-owner row: {line}")
        package = cells[0].strip("`")
        owner = cells[1].strip("`")
        owner_package = cells[2].strip("`")
        tables = re.findall(r"`([^`]+)`", cells[3])
        migration_directory = cells[4].strip("`")
        manifest = load_json(ROOT / package / "package.json")
        records.append({
            "id": Path(package).name,
            "package": package,
            "package_name": manifest.get("name"),
            "owner": owner,
            "owner_package": owner_package,
            "tables": tables,
            "migration_directory": migration_directory,
        })
    if not records:
        raise ValueError("registered persistence-owner table is empty")
    if not rule_allowances:
        raise ValueError("registered architecture-rule allowance table is empty")
    if not composition_roots:
        raise ValueError("registered composition-root table is empty")
    if not migration_invocation_roots:
        raise ValueError("registered migration-invocation authority is empty")
    apply_rule_allowances(data, rule_allowances)
    data["requirements"]["composition_roots"] = composition_roots
    data["requirements"]["migration_invocation_roots"] = migration_invocation_roots
    data["persistence_owners"] = records
    return data


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
        architecture_rules = build_architecture_rules_registry()
        outputs = {
            ROOT / "registry" / "documents.json": render(documents),
            ROOT / "registry" / "capabilities.json": render(capabilities),
            ROOT / "registry" / "events.json": render(events),
            ROOT / "registry" / "permissions.json": render(permissions),
            ROOT / "registry" / "first-slice-tests.json": render(tests),
            ROOT / "registry" / "architecture-rules.json": render(architecture_rules),
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
