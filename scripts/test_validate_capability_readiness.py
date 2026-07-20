"""Regression tests for capability-family readiness registration."""

import copy
import tempfile
import unittest
from pathlib import Path

from scripts.validate_capability_readiness import (
    ALLOWED_STATES,
    validate_capability_readiness,
)


class CapabilityReadinessValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "AUTH.md").write_text("authority\n", encoding="utf-8")
        (self.root / "REGISTER.md").write_text("register\n", encoding="utf-8")
        self.capabilities = {
            "capabilities": [
                {
                    "id": "alpha.first",
                    "namespace": "alpha",
                    "owner": "Alpha Owner",
                    "first_slice": True,
                }
            ]
        }
        self.domains = {
            "namespaces": [
                {
                    "prefix": "alpha",
                    "name": "Alpha Owner",
                    "authoritative_document": "AUTH.md",
                }
            ]
        }
        self.permissions = {"permissions": []}
        self.events = {"events": []}
        self.tests = {
            "tests": [
                {
                    "capability_id": "alpha.first",
                    "evidence_status": "Planned",
                }
            ]
        }
        self.readiness = {
            "source_document": "REGISTER.md",
            "state_definitions": {state: state for state in ALLOWED_STATES},
            "families": [
                {
                    "namespace": "alpha",
                    "owner": "Alpha Owner",
                    "readiness_state": "contract-planned",
                    "admission_trigger": "Admit the bounded Alpha slice after contract review.",
                    "blockers": ["Contract review remains open"],
                    "evidence_refs": ["AUTH.md"],
                }
            ],
        }

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> list[str]:
        return validate_capability_readiness(
            self.capabilities,
            self.domains,
            self.permissions,
            self.events,
            self.tests,
            self.readiness,
            self.root,
        )

    def test_valid_registration_passes(self) -> None:
        self.assertEqual(self.validate(), [])

    def test_missing_family_fails(self) -> None:
        self.readiness["families"] = []
        self.assertTrue(any("no readiness row" in error for error in self.validate()))

    def test_wrong_owner_fails(self) -> None:
        self.readiness["families"][0]["owner"] = "Wrong Owner"
        self.assertTrue(any("does not match" in error for error in self.validate()))

    def test_first_slice_family_cannot_be_deferred(self) -> None:
        self.readiness["families"][0]["readiness_state"] = "deferred"
        self.assertTrue(any("cannot use" in error for error in self.validate()))

    def test_prototype_evidence_claim_requires_evidence(self) -> None:
        self.readiness["families"][0]["readiness_state"] = "prototype-evidenced"
        self.assertTrue(any("has no Evidenced" in error for error in self.validate()))

    def test_evidenced_capability_requires_evidence_state(self) -> None:
        self.tests["tests"][0]["evidence_status"] = "Evidenced"
        self.assertTrue(any("require prototype-evidenced" in error for error in self.validate()))

    def test_missing_evidence_path_fails(self) -> None:
        mutated = copy.deepcopy(self.readiness)
        mutated["families"][0]["evidence_refs"].append("MISSING.md")
        self.readiness = mutated
        self.assertTrue(any("does not exist" in error for error in self.validate()))


if __name__ == "__main__":
    unittest.main()
