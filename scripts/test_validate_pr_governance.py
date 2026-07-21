from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts.validate_pr_governance import changed_paths_between, main, validate_pr_body


VALID_BODY = """## Documentation impact disposition

- [x] Updated in this PR
- [ ] No documentation impact
- [ ] Blocking documentation issue
Evidence: docs/example.md

## Changeset and release impact disposition

- [x] Changeset included
- [ ] No Changeset required
- [ ] Blocking Changeset issue
Evidence: .changeset/example.md

## Lifecycle statement

Controlled-prototype and Draft documentation only; no production claim.

## No unsupported production-readiness claim

- [x] This PR does not claim founder, legal, customer, provider, security, accessibility, operational, pilot, or production readiness beyond separately evidenced results.
"""


class PullRequestGovernanceTests(unittest.TestCase):
    def messages(
        self,
        body: str = VALID_BODY,
        paths: list[str] | None = None,
        head_sha: str = "a" * 40,
    ) -> list[str]:
        return validate_pr_body(
            body,
            paths or ["docs/example.md", ".changeset/example.md"],
            head_sha,
        )

    def test_valid_contract_passes(self) -> None:
        self.assertEqual([], self.messages())

    def test_requires_both_disposition_sections(self) -> None:
        body = VALID_BODY.replace("## Documentation impact disposition", "## Documentation")
        body = body.replace("## Changeset and release impact disposition", "## Changeset")
        messages = self.messages(body)
        self.assertEqual(2, len([message for message in messages if "missing required section" in message]))

    def test_requires_exactly_one_checked_option(self) -> None:
        body = VALID_BODY.replace("- [ ] No documentation impact", "- [x] No documentation impact")
        self.assertTrue(any("exactly one disposition" in message for message in self.messages(body)))

    def test_requires_non_placeholder_evidence(self) -> None:
        body = VALID_BODY.replace("Evidence: docs/example.md", "Evidence: TBD")
        self.assertTrue(any("Evidence must name" in message for message in self.messages(body)))

    def test_updated_documentation_requires_changed_documentation(self) -> None:
        messages = self.messages(paths=["packages/example/src/index.ts", ".changeset/example.md"])
        self.assertTrue(any("no governed documentation path changed" in message for message in messages))

    def test_included_changeset_requires_changed_changeset_file(self) -> None:
        self.assertTrue(
            any("no Changeset file changed" in message for message in self.messages(paths=["docs/example.md"]))
        )

    def test_blocking_dispositions_require_issue_numbers(self) -> None:
        body = VALID_BODY.replace("- [x] Updated in this PR", "- [ ] Updated in this PR")
        body = body.replace("- [ ] Blocking documentation issue", "- [x] Blocking documentation issue")
        body = body.replace("Evidence: docs/example.md", "Evidence: blocked")
        self.assertTrue(any("requires an issue number" in message for message in self.messages(body)))

    def test_requires_lifecycle_and_readiness_acknowledgement(self) -> None:
        body = VALID_BODY.replace(
            "Controlled-prototype and Draft documentation only; no production claim.",
            "TBD",
        ).replace("- [x] This PR does not claim", "- [ ] This PR does not claim")
        messages = self.messages(body)
        self.assertTrue(any("exact claimed lifecycle" in message for message in messages))
        self.assertTrue(any("acknowledgement must be checked" in message for message in messages))

    def test_rejects_stale_manual_head_pin(self) -> None:
        body = VALID_BODY + "\n- PR head: `bbbbbbb`\n"
        self.assertTrue(any("stale PR head" in message for message in self.messages(body)))


def _run_git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


class BodyFileModeTests(unittest.TestCase):
    """`--body-file` lets a contributor check a draft PR body locally by
    diffing real refs, instead of fabricating a GitHub pull_request event
    with base/head SHAs."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        _run_git(self.repo, "init", "-q", "-b", "main")
        _run_git(self.repo, "config", "user.email", "test@example.com")
        _run_git(self.repo, "config", "user.name", "Test")
        (self.repo / "docs").mkdir()
        (self.repo / "docs" / "example.md").write_text("hello\n", encoding="utf-8")
        _run_git(self.repo, "add", "-A")
        _run_git(self.repo, "commit", "-q", "-m", "init")
        _run_git(self.repo, "checkout", "-q", "-b", "feature")
        (self.repo / "docs" / "example.md").write_text("hello world\n", encoding="utf-8")
        _run_git(self.repo, "add", "-A")
        _run_git(self.repo, "commit", "-q", "-m", "update doc")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_changed_paths_between_reports_the_real_diff(self) -> None:
        self.assertEqual(
            changed_paths_between(self.repo, "main", "feature"), ["docs/example.md"]
        )

    def test_main_passes_when_body_matches_the_local_diff(self) -> None:
        # The fixture diff only touches docs/example.md, so the disposition
        # claimed here must match that: documentation updated, no Changeset.
        body = VALID_BODY.replace("- [x] Changeset included", "- [ ] Changeset included")
        body = body.replace("- [ ] No Changeset required", "- [x] No Changeset required")
        body = body.replace("Evidence: .changeset/example.md", "Evidence: no package behavior changed")
        body_file = self.repo / "pr-body.md"
        body_file.write_text(body, encoding="utf-8")
        with mock.patch("scripts.validate_pr_governance.ROOT", self.repo), mock.patch(
            "sys.argv",
            [
                "validate_pr_governance.py",
                "--body-file",
                str(body_file),
                "--base-ref",
                "main",
                "--head-ref",
                "feature",
            ],
        ):
            self.assertEqual(main(), 0)

    def test_main_fails_when_body_claims_changes_the_local_diff_does_not_show(self) -> None:
        body_file = self.repo / "pr-body.md"
        body_file.write_text(VALID_BODY, encoding="utf-8")
        with mock.patch("scripts.validate_pr_governance.ROOT", self.repo), mock.patch(
            "sys.argv",
            [
                "validate_pr_governance.py",
                "--body-file",
                str(body_file),
                "--base-ref",
                "main",
                "--head-ref",
                "main",
            ],
        ):
            self.assertEqual(main(), 1)

    def test_event_path_and_body_file_are_mutually_exclusive(self) -> None:
        with mock.patch(
            "sys.argv",
            [
                "validate_pr_governance.py",
                "--body-file",
                "pr-body.md",
                "--event-path",
                "event.json",
            ],
        ):
            with self.assertRaises(SystemExit):
                main()


if __name__ == "__main__":
    unittest.main()
