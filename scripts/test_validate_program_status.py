"""Regression tests for the program-status freshness validator."""

import unittest
from unittest.mock import patch

import sys
from pathlib import Path

# Fifth-audit F-I-001: allow both `python -m unittest scripts.test_x` and the
# documented plain-script invocation `python scripts/test_x.py`.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts import validate_program_status as validator


class ProgramStatusValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        validator.errors.clear()
        validator.warnings.clear()
        self.status_text = validator.STATUS_FILE.read_text(encoding="utf-8")
        self.standard_text = validator.STANDARD_FILE.read_text(encoding="utf-8")

    def test_governed_vocabulary_and_weights_parse(self) -> None:
        self.assertEqual(
            validator.parse_status_vocabulary(self.standard_text),
            {
                "not-started",
                "planned",
                "in-progress",
                "evidence-pending",
                "complete",
                "blocked",
                "deferred",
            },
        )
        self.assertEqual(
            validator.parse_standard_weights(self.standard_text),
            {
                "WS0": 8,
                "WS1": 17,
                "WS2": 17,
                "WS3": 17,
                "WS4": 11,
                "WS5": 12,
                "WS6": 9,
                "WS7": 9,
            },
        )

    def test_dashboard_contains_exact_workstream_set(self) -> None:
        rows = validator.parse_workstream_rows(self.status_text)
        self.assertEqual([row["key"] for row in rows], list(validator.EXPECTED_WORKSTREAMS))

    def test_complete_workstream_requires_explicit_pr_reference(self) -> None:
        rows = validator.parse_workstream_rows(self.status_text)
        rows[0]["evidence"] = "PDA-IMPL-005 only"
        validator.check_workstream_rows(
            rows,
            self.status_text,
            validator.parse_status_vocabulary(self.standard_text),
            validator.parse_standard_weights(self.standard_text),
        )
        self.assertTrue(any("explicit PR #N" in error for error in validator.errors))

    def test_current_work_reference_extraction_ignores_historical_evidence(self) -> None:
        text = """## Delivery detail\nHistorical PR #54.\n\n## Immediate priorities\n1. Track issue #12.\n"""
        self.assertEqual(validator.current_work_references(text), {12})

    @patch.object(validator, "gh_authenticated", return_value=True)
    @patch.object(validator, "gh_json")
    def test_closed_current_work_reference_is_an_error(self, gh_json, _auth) -> None:
        def response(endpoint: str):
            if endpoint.endswith("/pulls/23"):
                return {"merged_at": "2026-07-14T00:00:00Z"}
            if endpoint.endswith("/issues/12"):
                return {"state": "closed"}
            return {"state": "closed", "pull_request": {}}

        gh_json.side_effect = response
        text = """## Delivery detail\nPR #23 merged.\n\n## Immediate priorities\n1. Track issue #12.\n"""
        rows = [{"name": "WS0", "status": "complete", "evidence": "PR #23"}]
        validator.check_github_state(text, rows)
        self.assertTrue(any("closed #12" in error for error in validator.errors))

    @patch.object(validator, "gh_authenticated", return_value=True)
    @patch.object(validator, "gh_json")
    def test_unmerged_pr_cannot_close_a_workstream(self, gh_json, _auth) -> None:
        def response(endpoint: str):
            if endpoint.endswith("/pulls/23"):
                return {"merged_at": None}
            return {"state": "open", "pull_request": {}}

        gh_json.side_effect = response
        rows = [{"name": "WS0", "status": "complete", "evidence": "PR #23"}]
        validator.check_github_state("PR #23", rows)
        self.assertTrue(any("no cited PR is verified merged" in error for error in validator.errors))

    @patch.object(validator, "run_git")
    def test_non_ancestor_cutoff_is_an_error(self, run_git) -> None:
        present = unittest.mock.Mock(returncode=0)
        non_ancestor = unittest.mock.Mock(returncode=1)
        run_git.side_effect = [present, non_ancestor]
        validator.check_evidence_cutoff(
            "**Evidence cutoff:** `main` at `fce9c338511579a6a1097f505c1af532556ff01d`"
        )
        self.assertTrue(any("not an ancestor" in error for error in validator.errors))

    @patch("subprocess.run", side_effect=FileNotFoundError(2, "No such file or directory", "gh"))
    def test_missing_gh_binary_degrades_to_unauthenticated(self, _run) -> None:
        self.assertFalse(validator.gh_authenticated())
        self.assertIsNone(validator.gh_json("repos/owner/repo/issues/1"))
        # check_github_state must degrade to a warning, not raise, when gh is absent.
        validator.check_github_state("PR #23", [])


if __name__ == "__main__":
    unittest.main()
