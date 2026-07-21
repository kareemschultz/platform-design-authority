"""Regression tests for first-slice evidence-state generation."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import generate_registries
from scripts.generate_registries import TEST_DIMENSIONS, build_first_slice_tests_registry


def _load_capabilities() -> dict:
    root = Path(__file__).resolve().parents[1]
    return json.loads(
        (root / "registry" / "capabilities.json").read_text(encoding="utf-8")
    )


class FirstSliceEvidenceGenerationTests(unittest.TestCase):
    def test_generator_reports_partial_cell_evidence(self) -> None:
        """A capability evidenced on some but not all required dimensions is
        reported as Partially Evidenced.

        A synthetic evidence source is used rather than the repository's own
        evidence files: which capabilities are partially evidenced changes as
        workstreams close, so asserting against live evidence made this a test
        of delivery progress rather than of generator behaviour.
        """
        capabilities = _load_capabilities()
        first_slice = [
            item for item in capabilities["capabilities"] if item.get("first_slice")
        ]
        self.assertTrue(first_slice, "expected at least one first-slice capability")
        target = str(first_slice[0]["id"])

        source = {
            "schema_version": "1.0.0",
            "workstream_id": "TEST-PARTIAL",
            "status": "controlled-prototype-evidence",
            "verified_on": "2026-07-20",
            "capabilities": [target],
            "evidence": [
                {
                    "id": "synthetic-partial-evidence",
                    "kind": "automated-test",
                    "path": "scripts/test_generate_registries.py",
                    "contains": ["synthetic fixture"],
                    "command": "python -m unittest scripts/test_generate_registries.py",
                    "runtimes": ["Python 3.12"],
                    "capabilities": [target],
                    # Deliberately a strict subset of the required dimensions.
                    "dimensions": ["happy_path"],
                }
            ],
        }

        # The generator records evidence-source provenance relative to the
        # repository root, so the fixture has to live inside it.
        root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(dir=root) as tmp:
            path = Path(tmp) / "test-capability-evidence.json"
            path.write_text(json.dumps(source), encoding="utf-8")
            with mock.patch.object(
                generate_registries, "FIRST_SLICE_EVIDENCE_SOURCES", [path]
            ):
                registry = build_first_slice_tests_registry(capabilities)

        row = next(item for item in registry["tests"] if item["capability_id"] == target)
        self.assertEqual(row["evidence_status"], "Partially Evidenced")
        self.assertEqual(set(row["dimension_status"]), set(TEST_DIMENSIONS))
        self.assertIn("evidenced", set(row["dimension_status"].values()))
        self.assertIn("planned", set(row["dimension_status"].values()))
        self.assertGreater(len(row["unproven_required_dimensions"]), 0)
        self.assertGreaterEqual(
            registry["coverage"]["capabilities_partially_evidenced"], 1
        )

    def test_repository_registry_cell_accounting_is_consistent(self) -> None:
        """Per-cell accounting balances against the repository's real evidence
        sources, whatever the current mix of evidenced and planned capabilities
        happens to be."""
        registry = build_first_slice_tests_registry(_load_capabilities())
        coverage = registry["coverage"]

        self.assertGreater(coverage["required_cells_evidenced"], 0)
        self.assertEqual(
            coverage["required_cells_evidenced"] + coverage["required_cells_planned"],
            coverage["required_cells_total"],
        )
        allowed_statuses = {"Evidenced", "Partially Evidenced", "Planned"}
        for row in registry["tests"]:
            self.assertIn(row["evidence_status"], allowed_statuses)
            self.assertEqual(set(row["dimension_status"]), set(TEST_DIMENSIONS))


if __name__ == "__main__":
    unittest.main()
