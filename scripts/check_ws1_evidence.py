#!/usr/bin/env python3
"""Validate the WS1 closeout matrix and deterministic, AI-independent surface."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CAPABILITIES = {
    "party.records",
    "platform.administration",
    "platform.audit",
    "platform.authentication",
    "platform.authorization",
    "platform.entitlements",
    "platform.events",
    "platform.identity",
    "platform.organizations",
    "platform.tenancy",
    "security.tenant-isolation",
}
IMPLEMENTATION_ROOTS = [
    ROOT / "apps" / "server",
    ROOT / "apps" / "web",
    ROOT / "packages" / "domains" / "party",
    ROOT / "packages" / "platform" / "audit",
    ROOT / "packages" / "platform" / "authorization",
    ROOT / "packages" / "platform" / "entitlements",
    ROOT / "packages" / "platform" / "events",
    ROOT / "packages" / "platform" / "identity",
    ROOT / "packages" / "platform" / "tenancy",
]
AI_RUNTIME_MARKERS = ("@ai-sdk", "openai", "anthropic", "openrouter")
EVIDENCE_SOURCE = ROOT / "evidence" / "first-slice" / "ws1-capability-evidence.json"


def validate_source_claims(registry: dict[str, object]) -> int:
    source = json.loads(EVIDENCE_SOURCE.read_text(encoding="utf-8"))
    if source.get("schema_version") != "1.0.0" or source.get("workstream_id") != "WS1":
        raise AssertionError("WS1 evidence source has an unsupported identity or schema")
    declared_capabilities = {str(value) for value in source.get("capabilities", [])}
    if declared_capabilities != EXPECTED_CAPABILITIES:
        raise AssertionError(
            f"WS1 source capability drift: {sorted(declared_capabilities ^ EXPECTED_CAPABILITIES)}"
        )
    known_dimensions = {str(value) for value in registry.get("dimensions", [])}
    evidence_ids: set[str] = set()
    marker_count = 0
    for evidence in source.get("evidence", []):
        evidence_id = str(evidence.get("id", "")).strip()
        if not evidence_id or evidence_id in evidence_ids:
            raise AssertionError(f"duplicate or empty WS1 evidence id: {evidence_id!r}")
        evidence_ids.add(evidence_id)
        path_value = str(evidence.get("path", "")).strip()
        evidence_path = ROOT / path_value
        if not path_value or not evidence_path.is_file():
            raise AssertionError(f"{evidence_id} references missing source {path_value!r}")
        markers = evidence.get("contains", [])
        if not isinstance(markers, list) or not markers:
            raise AssertionError(f"{evidence_id} has no source markers")
        content = evidence_path.read_text(encoding="utf-8")
        for marker in markers:
            marker_value = str(marker)
            if marker_value not in content:
                raise AssertionError(
                    f"{evidence_id} marker {marker_value!r} is absent from {path_value}"
                )
            marker_count += 1
        capabilities = {str(value) for value in evidence.get("capabilities", [])}
        dimensions = {str(value) for value in evidence.get("dimensions", [])}
        if not capabilities or not dimensions:
            raise AssertionError(f"{evidence_id} requires capabilities and dimensions")
        if not capabilities <= declared_capabilities:
            raise AssertionError(
                f"{evidence_id} uses undeclared capabilities: {sorted(capabilities - declared_capabilities)}"
            )
        if not dimensions <= known_dimensions:
            raise AssertionError(
                f"{evidence_id} uses unknown dimensions: {sorted(dimensions - known_dimensions)}"
            )
    catalog_ids = {
        str(item.get("id")) for item in registry.get("evidence_catalog", [])
    }
    if not evidence_ids <= catalog_ids:
        raise AssertionError(
            f"generated registry omits WS1 evidence: {sorted(evidence_ids - catalog_ids)}"
        )
    return marker_count


def main() -> int:
    registry = json.loads(
        (ROOT / "registry" / "first-slice-tests.json").read_text(encoding="utf-8")
    )
    marker_count = validate_source_claims(registry)
    all_rows = {
        str(row["capability_id"]): row
        for row in registry.get("tests", [])
    }
    rows = {
        capability_id: all_rows[capability_id]
        for capability_id in EXPECTED_CAPABILITIES
        if capability_id in all_rows
        and all_rows[capability_id].get("evidence_status") == "Evidenced"
    }
    if set(rows) != EXPECTED_CAPABILITIES:
        raise AssertionError(
            f"WS1 evidenced capability drift: {sorted(set(rows) ^ EXPECTED_CAPABILITIES)}"
        )

    required_cells = 0
    for capability_id, row in rows.items():
        blocking = row.get("blocking_defects", [])
        if blocking:
            raise AssertionError(f"{capability_id} has blocking defects: {blocking}")
        dimension_evidence = row.get("dimension_evidence", {})
        for dimension, status in row.get("dimensions", {}).items():
            if status != "required":
                continue
            required_cells += 1
            if not dimension_evidence.get(dimension):
                raise AssertionError(f"{capability_id}.{dimension} lacks evidence")
        for path_value in row.get("evidence_paths", []):
            if not (ROOT / str(path_value)).is_file():
                raise AssertionError(
                    f"{capability_id} references missing evidence path {path_value}"
                )

    coverage = registry.get("coverage", {})
    if int(coverage.get("required_cells_evidenced", 0)) < required_cells:
        raise AssertionError("generated evidence-cell total omits WS1 evidence")

    violations: list[str] = []
    for root in IMPLEMENTATION_ROOTS:
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix not in {".json", ".ts", ".tsx"}:
                continue
            if any(part in {"dist", "node_modules", ".next", ".turbo"} for part in path.parts):
                continue
            content = path.read_text(encoding="utf-8").lower()
            for marker in AI_RUNTIME_MARKERS:
                if marker in content:
                    violations.append(f"{path.relative_to(ROOT).as_posix()}: {marker}")
    if violations:
        raise AssertionError(
            "WS1 essential paths depend on an AI runtime:\n" + "\n".join(violations)
        )

    print(
        f"WS1 evidence verified: {len(rows)} capabilities, {required_cells} required cells, {marker_count} source markers, no AI runtime dependency"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
