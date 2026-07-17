#!/usr/bin/env python3
"""Validate WS2's registry-derived closeout matrix and AI-independent paths."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CAPABILITY_REGISTRY = ROOT / "registry" / "capabilities.json"
TEST_REGISTRY = ROOT / "registry" / "first-slice-tests.json"
EVIDENCE_SOURCE = ROOT / "evidence" / "first-slice" / "ws2-capability-evidence.json"
WORKSTREAM_NAMESPACES = {"catalog", "inventory"}
EXPECTED_CAPABILITY_COUNT = 14
EXPECTED_DIMENSION_COUNT = 13
AI_RUNTIME_MARKERS = ("@ai-sdk", "openai", "anthropic", "openrouter")
SOURCE_SUFFIXES = {".cjs", ".js", ".json", ".mjs", ".ts", ".tsx"}
IGNORED_PARTS = {".next", ".turbo", "dist", "node_modules", "playwright-report", "test-results"}
IMPLEMENTATION_ROOTS = (
    ROOT / "apps" / "server",
    ROOT / "apps" / "web",
    ROOT / "apps" / "worker",
    ROOT / "packages" / "contracts" / "events",
    ROOT / "packages" / "contracts" / "platform-api",
    ROOT / "packages" / "domains" / "catalog",
    ROOT / "packages" / "domains" / "inventory",
    ROOT / "packages" / "persistence" / "catalog-postgres",
    ROOT / "packages" / "persistence" / "inventory-postgres",
    ROOT / "packages" / "persistence" / "platform-events-postgres",
    ROOT / "packages" / "persistence" / "platform-import-export-postgres",
    ROOT / "packages" / "persistence" / "platform-numbering-postgres",
    ROOT / "packages" / "platform" / "events",
    ROOT / "packages" / "platform" / "import-export",
    ROOT / "packages" / "platform" / "numbering",
)


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise AssertionError(f"required evidence input is missing: {path.relative_to(ROOT)}")
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"expected a JSON object: {path.relative_to(ROOT)}")
    return value


def derive_ws2_capabilities(capability_registry: dict[str, Any]) -> set[str]:
    capabilities = {
        str(item["id"])
        for item in capability_registry.get("capabilities", [])
        if item.get("first_slice") is True
        and str(item.get("namespace", "")) in WORKSTREAM_NAMESPACES
    }
    if len(capabilities) != EXPECTED_CAPABILITY_COUNT:
        raise AssertionError(
            "WS2 registry-derived capability count drift: "
            f"expected {EXPECTED_CAPABILITY_COUNT}, found {len(capabilities)} "
            f"({sorted(capabilities)})"
        )
    return capabilities


def resolve_evidence_path(path_value: str, evidence_id: str) -> Path:
    candidate = (ROOT / path_value).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise AssertionError(
            f"{evidence_id} references a path outside the repository: {path_value!r}"
        ) from exc
    if not path_value or not candidate.is_file():
        raise AssertionError(f"{evidence_id} references missing source {path_value!r}")
    return candidate


def validate_source_claims(
    registry: dict[str, Any], expected_capabilities: set[str]
) -> tuple[int, set[str]]:
    source = load_json(EVIDENCE_SOURCE)
    if source.get("schema_version") != "1.0.0" or source.get("workstream_id") != "WS2":
        raise AssertionError("WS2 evidence source has an unsupported identity or schema")
    if source.get("status") != "controlled-prototype-evidence":
        raise AssertionError("WS2 evidence source has an unsupported lifecycle status")
    if not str(source.get("verified_on", "")).strip():
        raise AssertionError("WS2 evidence source requires a verification date")
    declared_capabilities = {str(value) for value in source.get("capabilities", [])}
    if declared_capabilities != expected_capabilities:
        raise AssertionError(
            "WS2 source capability drift: "
            f"{sorted(declared_capabilities ^ expected_capabilities)}"
        )

    known_dimensions = {str(value) for value in registry.get("dimensions", [])}
    if len(known_dimensions) != EXPECTED_DIMENSION_COUNT:
        raise AssertionError(
            "WS2 test-dimension count drift: "
            f"expected {EXPECTED_DIMENSION_COUNT}, found {len(known_dimensions)}"
        )

    evidence_ids: set[str] = set()
    marker_count = 0
    evidence_entries = source.get("evidence", [])
    if not isinstance(evidence_entries, list) or not evidence_entries:
        raise AssertionError("WS2 evidence source has no evidence entries")
    for evidence in evidence_entries:
        if not isinstance(evidence, dict):
            raise AssertionError("WS2 evidence entries must be objects")
        evidence_id = str(evidence.get("id", "")).strip()
        if not evidence_id or evidence_id in evidence_ids:
            raise AssertionError(f"duplicate or empty WS2 evidence id: {evidence_id!r}")
        evidence_ids.add(evidence_id)

        path_value = str(evidence.get("path", "")).strip()
        evidence_path = resolve_evidence_path(path_value, evidence_id)
        markers = evidence.get("contains", [])
        if not isinstance(markers, list) or not markers:
            raise AssertionError(f"{evidence_id} has no source markers")
        content = evidence_path.read_text(encoding="utf-8")
        for marker in markers:
            marker_value = str(marker)
            if not marker_value or marker_value not in content:
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
                f"{evidence_id} uses undeclared capabilities: "
                f"{sorted(capabilities - declared_capabilities)}"
            )
        if not dimensions <= known_dimensions:
            raise AssertionError(
                f"{evidence_id} uses unknown dimensions: {sorted(dimensions - known_dimensions)}"
            )
        if not str(evidence.get("command", "")).strip():
            raise AssertionError(f"{evidence_id} requires a reproduction command")
        runtimes = evidence.get("runtimes", [])
        if not isinstance(runtimes, list) or not any(
            str(value).strip() for value in runtimes
        ):
            raise AssertionError(f"{evidence_id} requires at least one runtime")

    catalog_ids = {str(item.get("id")) for item in registry.get("evidence_catalog", [])}
    if not evidence_ids <= catalog_ids:
        raise AssertionError(
            f"generated registry omits WS2 evidence: {sorted(evidence_ids - catalog_ids)}"
        )
    return marker_count, evidence_ids


def validate_workstream_rows(
    registry: dict[str, Any],
    expected_capabilities: set[str],
    workstream_evidence_ids: set[str],
) -> int:
    all_rows = {
        str(row.get("capability_id")): row for row in registry.get("tests", [])
    }
    missing_rows = expected_capabilities - set(all_rows)
    if missing_rows:
        raise AssertionError(f"WS2 capabilities absent from test registry: {sorted(missing_rows)}")

    required_cells = 0
    for capability_id in sorted(expected_capabilities):
        row = all_rows[capability_id]
        if row.get("evidence_status") != "Evidenced":
            raise AssertionError(f"{capability_id} is not Evidenced")
        blocking = row.get("blocking_defects", [])
        if blocking:
            raise AssertionError(f"{capability_id} has blocking defects: {blocking}")
        dimension_evidence = row.get("dimension_evidence", {})
        for dimension, status in row.get("dimensions", {}).items():
            if status != "required":
                raise AssertionError(
                    f"WS2 {capability_id}.{dimension} is {status!r}; all 13 cells are required"
                )
            required_cells += 1
            cell_evidence = {str(value) for value in dimension_evidence.get(dimension, [])}
            if not cell_evidence & workstream_evidence_ids:
                raise AssertionError(
                    f"{capability_id}.{dimension} lacks WS2-owned evidence"
                )
        for path_value in row.get("evidence_paths", []):
            resolve_evidence_path(str(path_value), capability_id)

    expected_cells = EXPECTED_CAPABILITY_COUNT * EXPECTED_DIMENSION_COUNT
    if required_cells != expected_cells:
        raise AssertionError(
            f"WS2 required-cell drift: expected {expected_cells}, found {required_cells}"
        )

    generated_evidenced_cells = sum(
        sum(1 for status in row.get("dimensions", {}).values() if status == "required")
        for row in registry.get("tests", [])
        if row.get("evidence_status") == "Evidenced"
    )
    coverage = registry.get("coverage", {})
    if coverage.get("required_cells_evidenced") != generated_evidenced_cells:
        raise AssertionError("generated aggregate evidence-cell total is inconsistent")
    if int(coverage.get("capabilities_evidenced", -1)) < EXPECTED_CAPABILITY_COUNT:
        raise AssertionError("generated aggregate capability coverage omits WS2")
    return required_cells


def validate_ai_independence() -> None:
    violations: list[str] = []
    for root in IMPLEMENTATION_ROOTS:
        if not root.is_dir():
            raise AssertionError(f"WS2 implementation root is missing: {root.relative_to(ROOT)}")
        for path in root.rglob("*"):
            if (
                not path.is_file()
                or path.suffix not in SOURCE_SUFFIXES
                or any(part in IGNORED_PARTS for part in path.parts)
            ):
                continue
            content = path.read_text(encoding="utf-8").lower()
            for marker in AI_RUNTIME_MARKERS:
                if marker in content:
                    violations.append(f"{path.relative_to(ROOT).as_posix()}: {marker}")
    if violations:
        raise AssertionError(
            "WS2 essential paths depend on an AI runtime:\n" + "\n".join(violations)
        )


def main() -> int:
    capability_registry = load_json(CAPABILITY_REGISTRY)
    registry = load_json(TEST_REGISTRY)
    expected_capabilities = derive_ws2_capabilities(capability_registry)
    marker_count, evidence_ids = validate_source_claims(registry, expected_capabilities)
    required_cells = validate_workstream_rows(
        registry, expected_capabilities, evidence_ids
    )
    validate_ai_independence()
    print(
        "WS2 evidence verified: "
        f"{len(expected_capabilities)} capabilities, {required_cells} required cells, "
        f"{marker_count} source markers, no AI runtime dependency"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
