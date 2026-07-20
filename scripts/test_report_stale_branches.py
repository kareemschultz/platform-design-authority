"""Regression tests for the stale/merged/abandoned remote-branch reporter."""

import datetime
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import report_stale_branches as reporter
from scripts.report_stale_branches import (
    build_report,
    classify,
    format_report,
    main,
)


def _run_git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


class FixtureRepoTests(unittest.TestCase):
    """A real temp repo with a 'remote' (a bare clone), so ancestry and
    last-commit-age checks exercise real git plumbing rather than mocks."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.bare = root / "origin.git"
        self.work = root / "work"
        _run_git(root, "init", "-q", "--bare", str(self.bare))
        _run_git(root, "clone", "-q", str(self.bare), str(self.work))
        _run_git(self.work, "config", "user.email", "test@example.com")
        _run_git(self.work, "config", "user.name", "Test")
        (self.work / "f.txt").write_text("1\n", encoding="utf-8")
        _run_git(self.work, "add", "-A")
        _run_git(self.work, "commit", "-q", "-m", "init")
        _run_git(self.work, "push", "-q", "origin", "HEAD:main")

        # A branch fully merged into main.
        _run_git(self.work, "checkout", "-q", "-b", "merged-branch")
        (self.work / "f.txt").write_text("2\n", encoding="utf-8")
        _run_git(self.work, "commit", "-q", "-am", "merged work")
        _run_git(self.work, "push", "-q", "origin", "merged-branch")
        _run_git(self.work, "checkout", "-q", "main")
        _run_git(self.work, "merge", "-q", "merged-branch")
        _run_git(self.work, "push", "-q", "origin", "main")

        # A branch never merged, with no PR (simulated via mocked gh calls).
        _run_git(self.work, "checkout", "-q", "-b", "unmerged-branch")
        (self.work / "g.txt").write_text("1\n", encoding="utf-8")
        _run_git(self.work, "add", "-A")
        _run_git(self.work, "commit", "-q", "-m", "unmerged work")
        _run_git(self.work, "push", "-q", "origin", "unmerged-branch")
        _run_git(self.work, "checkout", "-q", "main")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_merge_commit_branch_with_no_pr_record_falls_back_to_ancestor_check(
        self,
    ) -> None:
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter, "pr_state_for_branch", return_value=None
        ):
            result = classify(
                "merged-branch",
                "origin",
                "main",
                "irrelevant/irrelevant",
                datetime.date.today(),
            )
        self.assertIsNotNone(result)
        bucket, reason = result
        self.assertEqual(bucket, "fully_merged")
        self.assertIn("ancestor", reason)

    def test_squash_merged_branch_is_fully_merged_even_though_not_an_ancestor(
        self,
    ) -> None:
        """A squash or rebase merge (this repository's norm) creates a new
        commit on main whose lineage does not include the source branch's
        commits, so the ancestor check alone would miss it. The merged pull
        request record must be checked first."""
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter,
            "pr_state_for_branch",
            return_value={"number": 42, "state": "MERGED", "mergedAt": "2026-07-20T00:00:00Z"},
        ):
            result = classify(
                "unmerged-branch",
                "origin",
                "main",
                "irrelevant/irrelevant",
                datetime.date.today(),
            )
        self.assertIsNotNone(result)
        bucket, reason = result
        self.assertEqual(bucket, "fully_merged")
        self.assertIn("#42", reason)
        self.assertIn("merged", reason)

    def test_unmerged_branch_with_no_pr_and_old_commit_is_stale(self) -> None:
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter, "pr_state_for_branch", return_value=None
        ):
            far_future = datetime.date.today() + datetime.timedelta(days=60)
            result = classify(
                "unmerged-branch", "origin", "main", "irrelevant/irrelevant", far_future
            )
        self.assertIsNotNone(result)
        bucket, _ = result
        self.assertEqual(bucket, "stale_no_pr")

    def test_unmerged_branch_with_no_pr_but_recent_is_not_reported(self) -> None:
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter, "pr_state_for_branch", return_value=None
        ):
            result = classify(
                "unmerged-branch",
                "origin",
                "main",
                "irrelevant/irrelevant",
                datetime.date.today(),
            )
        self.assertIsNone(result)

    def test_unmerged_branch_with_open_pr_is_not_reported(self) -> None:
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter,
            "pr_state_for_branch",
            return_value={"number": 1, "state": "OPEN", "mergedAt": None},
        ):
            far_future = datetime.date.today() + datetime.timedelta(days=60)
            result = classify(
                "unmerged-branch", "origin", "main", "irrelevant/irrelevant", far_future
            )
        self.assertIsNone(result)

    def test_unmerged_branch_with_closed_pr_is_closed_unmerged(self) -> None:
        with mock.patch.object(reporter, "ROOT", self.work), mock.patch.object(
            reporter,
            "pr_state_for_branch",
            return_value={"number": 7, "state": "CLOSED", "mergedAt": None},
        ):
            result = classify(
                "unmerged-branch",
                "origin",
                "main",
                "irrelevant/irrelevant",
                datetime.date.today(),
            )
        self.assertIsNotNone(result)
        bucket, reason = result
        self.assertEqual(bucket, "closed_unmerged")
        self.assertIn("#7", reason)

    def test_excluded_branch_is_never_reported_even_if_merged(self) -> None:
        _run_git(self.work, "checkout", "-q", "-b", "claude/ws3-integration")
        (self.work / "h.txt").write_text("1\n", encoding="utf-8")
        _run_git(self.work, "add", "-A")
        _run_git(self.work, "commit", "-q", "-m", "ws3 work")
        _run_git(self.work, "push", "-q", "origin", "claude/ws3-integration")
        _run_git(self.work, "checkout", "-q", "main")
        _run_git(self.work, "merge", "-q", "claude/ws3-integration")
        _run_git(self.work, "push", "-q", "origin", "main")

        with mock.patch.object(reporter, "ROOT", self.work):
            buckets = build_report(repo="irrelevant/irrelevant", remote="origin", base="main")
        reported_branches = {branch for entries in buckets.values() for branch, _ in entries}
        self.assertNotIn("claude/ws3-integration", reported_branches)


class FormatReportTests(unittest.TestCase):
    def test_empty_buckets_produce_empty_string(self) -> None:
        self.assertEqual(
            format_report({"fully_merged": [], "closed_unmerged": [], "stale_no_pr": []}), ""
        )

    def test_populated_bucket_includes_branch_and_reason(self) -> None:
        report = format_report(
            {
                "fully_merged": [("old-feature", "tip is an ancestor of origin/main")],
                "closed_unmerged": [],
                "stale_no_pr": [],
            }
        )
        self.assertIn("old-feature", report)
        self.assertIn("ancestor of origin/main", report)
        self.assertIn("Fully merged", report)


class MainDegradationTests(unittest.TestCase):
    def test_main_skips_cleanly_when_gh_is_not_authenticated(self) -> None:
        with mock.patch.object(reporter, "gh_authenticated", return_value=False), mock.patch(
            "sys.argv", ["report_stale_branches.py"]
        ):
            self.assertEqual(main(), 0)


if __name__ == "__main__":
    unittest.main()
