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


def main() -> int:
    registry = json.loads(
        (ROOT / "registry" / "first-slice-tests.json").read_text(encoding="utf-8")
    )
    rows = {
        str(row["capability_id"]): row
        for row in registry.get("tests", [])
        if row.get("evidence_status") == "Evidenced"
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
    if coverage.get("required_cells_evidenced") != required_cells:
        raise AssertionError("generated WS1 evidence-cell total is inconsistent")

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
        f"WS1 evidence verified: {len(rows)} capabilities, {required_cells} required cells, no AI runtime dependency"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
