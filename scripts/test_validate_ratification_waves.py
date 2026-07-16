"""Regression tests for ratification-wave evidence gates."""

import copy
import tempfile
import unittest
from pathlib import Path

from scripts.validate_ratification_waves import (
    ALLOWED_STATES,
    validate_ratification_waves,
)


class RatificationWaveValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "STANDARD.md").write_text("standard\n", encoding="utf-8")
        (self.root / "SCOPE.md").write_text("scope\n", encoding="utf-8")
        self.waves = {
            "source_document": "STANDARD.md",
            "state_definitions": {state: state for state in ALLOWED_STATES},
            "waves": [self._wave(number) for number in range(9)],
        }
        self.documents = {"documents": []}

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _wave(self, number: int) -> dict:
        return {
            "wave_id": f"RW-{number:02d}",
            "sequence": number,
            "title": f"Wave {number}",
            "state": "preparation" if number == 0 else "not-started",
            "approval_authority": "Test authority",
            "required_reviewer_roles": ["independent-review"],
            "scope_refs": ["SCOPE.md"],
            "blocking_dependencies": ["Review is not complete"],
            "candidate_revision": None,
            "scope_manifest": [],
            "review_records": [],
            "finding_disposition": None,
            "approval_record": None,
            "promotion_records": [],
        }

    def validate(self) -> list[str]:
        return validate_ratification_waves(self.waves, self.documents, self.root)

    def test_valid_preparation_register_passes(self) -> None:
        self.assertEqual(self.validate(), [])

    def test_missing_wave_fails(self) -> None:
        self.waves["waves"].pop()
        self.assertTrue(any("is missing" in error for error in self.validate()))

    def test_review_cannot_begin_without_frozen_evidence(self) -> None:
        self.waves["waves"][0]["state"] = "in-review"
        errors = self.validate()
        self.assertTrue(any("exact Git SHA" in error for error in errors))
        self.assertTrue(any("frozen scope manifest" in error for error in errors))

    def test_approval_without_records_fails(self) -> None:
        self.waves["waves"][0]["state"] = "approved"
        errors = self.validate()
        self.assertTrue(any("approval record is missing" in error for error in errors))
        self.assertTrue(any("missing reviewer roles" in error for error in errors))

    def test_premature_promotion_fails(self) -> None:
        self.waves["waves"][0]["promotion_records"] = [
            {"document_id": "PDA-TEST-001", "status_after": "Approved"}
        ]
        self.assertTrue(any("promotion_records is premature" in error for error in self.validate()))

    def test_broken_scope_reference_fails(self) -> None:
        mutated = copy.deepcopy(self.waves)
        mutated["waves"][0]["scope_refs"] = ["MISSING.md"]
        self.waves = mutated
        self.assertTrue(any("does not exist" in error for error in self.validate()))

    def test_duplicate_sequence_fails(self) -> None:
        self.waves["waves"][1]["sequence"] = 0
        self.assertTrue(any("duplicate ratification sequence" in error for error in self.validate()))


if __name__ == "__main__":
    unittest.main()
