"""Regression tests for operational-readiness evidence gates."""

import copy
import tempfile
import unittest
from pathlib import Path

from scripts.validate_operational_readiness import (
    READINESS_STATES,
    validate_operational_readiness,
)


class OperationalReadinessValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "SOURCE.md").write_text(
            "Registered service OPS-SVC-001", encoding="utf-8"
        )
        for name in ("RUNBOOK.md", "APP.ts"):
            (self.root / name).write_text(name, encoding="utf-8")
        self.capabilities = {"capabilities": [{"id": "alpha.first"}]}
        self.register = {
            "schema_version": "1.0.0",
            "source_document": "SOURCE.md",
            "runbook_document": "RUNBOOK.md",
            "evidence_cutoff": {
                "main_commit": "a" * 40,
                "verified_on": "2026-07-16",
                "merged_pull_requests": [74],
                "excludes_open_pull_requests": [],
            },
            "readiness_states": {state: state for state in READINESS_STATES},
            "services": [
                {
                    "service_id": "OPS-SVC-001",
                    "name": "Alpha service",
                    "owner": "Alpha Owner",
                    "escalation_owner": "Operations",
                    "implementation_state": "merged-controlled-prototype",
                    "readiness_state": "procedure-draft",
                    "pilot_ready": False,
                    "capabilities": ["alpha.first"],
                    "artifact_paths": ["APP.ts"],
                    "runbook_paths": ["RUNBOOK.md"],
                    "review_evidence_paths": [],
                    "telemetry": {
                        "liveness_probes": ["GET /health"],
                        "business_checks": ["Synthetic read"],
                        "dashboard_paths": [],
                        "tested_alert_evidence_paths": [],
                        "limitations": ["No dashboard"],
                    },
                    "exercise_evidence_paths": [],
                    "blockers": ["Independent review and exercise are open"],
                }
            ],
            "deferred_services": [
                {
                    "name": "Deferred beta service",
                    "reason": "The executable beta service does not exist yet.",
                    "admission_trigger": "Register it after implementation and telemetry merge.",
                }
            ],
        }

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def validate(self) -> list[str]:
        return validate_operational_readiness(
            self.register, self.capabilities, self.root
        )

    def test_valid_procedure_draft_passes(self) -> None:
        self.assertEqual(self.validate(), [])

    def test_duplicate_service_id_fails(self) -> None:
        self.register["services"].append(copy.deepcopy(self.register["services"][0]))
        self.assertTrue(any("duplicate" in error for error in self.validate()))

    def test_unknown_capability_fails(self) -> None:
        self.register["services"][0]["capabilities"] = ["alpha.unknown"]
        self.assertTrue(any("unknown canonical" in error for error in self.validate()))

    def test_missing_artifact_fails(self) -> None:
        self.register["services"][0]["artifact_paths"] = ["MISSING.ts"]
        self.assertTrue(any("does not exist" in error for error in self.validate()))

    def test_reviewed_state_requires_review_evidence(self) -> None:
        self.register["services"][0]["readiness_state"] = "reviewed"
        self.assertTrue(any("requires review evidence" in error for error in self.validate()))

    def test_exercised_state_requires_exercise_evidence(self) -> None:
        service = self.register["services"][0]
        service["readiness_state"] = "exercised"
        service["review_evidence_paths"] = ["SOURCE.md"]
        self.assertTrue(any("requires exercise evidence" in error for error in self.validate()))

    def test_pilot_ready_rejects_missing_operational_evidence(self) -> None:
        service = self.register["services"][0]
        service["pilot_ready"] = True
        service["readiness_state"] = "pilot-ready"
        self.assertTrue(any("pilot_ready requires" in error for error in self.validate()))

    def test_non_pilot_service_requires_blockers(self) -> None:
        self.register["services"][0]["blockers"] = []
        self.assertTrue(any("requires explicit blockers" in error for error in self.validate()))

    def test_evidence_cutoff_rejects_merged_and_excluded_pr_overlap(self) -> None:
        self.register["evidence_cutoff"]["excludes_open_pull_requests"] = [74]
        self.assertTrue(any("both merged and excluded" in error for error in self.validate()))

    def test_deferred_service_rejects_reference_to_merged_pr(self) -> None:
        self.register["deferred_services"][0]["reason"] = (
            "The executable service remains unavailable because PR #74 is not merged."
        )
        self.assertTrue(any("already-merged PRs" in error for error in self.validate()))

    def test_source_catalog_and_register_service_ids_must_match(self) -> None:
        (self.root / "SOURCE.md").write_text(
            "Registered services OPS-SVC-001 and OPS-SVC-002", encoding="utf-8"
        )
        self.assertTrue(
            any("register omits source services" in error for error in self.validate())
        )


if __name__ == "__main__":
    unittest.main()
