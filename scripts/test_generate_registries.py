"""Regression tests for first-slice evidence-state generation."""

import json
import unittest
from pathlib import Path

from scripts.generate_registries import TEST_DIMENSIONS, build_first_slice_tests_registry


class FirstSliceEvidenceGenerationTests(unittest.TestCase):
    def test_existing_registry_supports_partial_cell_evidence(self) -> None:
        root = Path(__file__).resolve().parents[1]
        capabilities = json.loads(
            (root / "registry" / "capabilities.json").read_text(encoding="utf-8")
        )
        # The repository evidence sources are intentionally used here: the assertion
        # guards the generated status vocabulary and per-cell state contract.
        registry = build_first_slice_tests_registry(capabilities)
        row = next(
            item
            for item in registry["tests"]
            if item["capability_id"] == "catalog.products"
        )
        self.assertEqual(row["evidence_status"], "Partially Evidenced")
        self.assertEqual(set(row["dimension_status"]), set(TEST_DIMENSIONS))
        self.assertIn("evidenced", set(row["dimension_status"].values()))
        self.assertIn("planned", set(row["dimension_status"].values()))
        self.assertGreater(len(row["unproven_required_dimensions"]), 0)
        self.assertGreater(registry["coverage"]["required_cells_evidenced"], 0)
        self.assertEqual(
            registry["coverage"]["required_cells_evidenced"]
            + registry["coverage"]["required_cells_planned"],
            registry["coverage"]["required_cells_total"],
        )
        self.assertGreaterEqual(
            registry["coverage"]["capabilities_partially_evidenced"], 1
        )


if __name__ == "__main__":
    unittest.main()
