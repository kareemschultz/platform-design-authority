"""Regression tests for the document_id vs origin/main collision check."""

import subprocess
import unittest
from unittest import mock

from scripts import check_document_id_collisions as check


class FindCollisionsTests(unittest.TestCase):
    def test_no_collision_when_ids_disjoint(self) -> None:
        current = {"PDA-OPS-020": "docs/a.md"}
        main = {"PDA-OPS-019": "docs/existing.md"}
        self.assertEqual(check.find_collisions(current, main), [])

    def test_no_collision_when_id_unchanged_at_same_path(self) -> None:
        current = {"PDA-OPS-019": "docs/existing.md"}
        main = {"PDA-OPS-019": "docs/existing.md"}
        self.assertEqual(check.find_collisions(current, main), [])

    def test_collision_when_id_reassigned_to_different_path(self) -> None:
        current = {"PDA-OPS-019": "docs/new-doc.md"}
        main = {"PDA-OPS-019": "docs/existing.md"}
        collisions = check.find_collisions(current, main)
        self.assertEqual(
            collisions, [("PDA-OPS-019", "docs/existing.md", "docs/new-doc.md")]
        )

    def test_collision_list_is_sorted_by_document_id(self) -> None:
        current = {"PDA-OPS-002": "docs/b.md", "PDA-OPS-001": "docs/a.md"}
        main = {"PDA-OPS-001": "docs/other-a.md", "PDA-OPS-002": "docs/other-b.md"}
        collisions = check.find_collisions(current, main)
        self.assertEqual([c[0] for c in collisions], ["PDA-OPS-001", "PDA-OPS-002"])


class MainBranchIdsTests(unittest.TestCase):
    def test_returns_none_when_ref_unresolvable(self) -> None:
        with mock.patch.object(
            check,
            "run_git",
            return_value=subprocess.CompletedProcess(args=[], returncode=1),
        ):
            self.assertIsNone(check.main_branch_ids())

    def test_parses_document_id_and_path_from_registry(self) -> None:
        registry_json = (
            '{"documents": [{"document_id": "PDA-OPS-019", '
            '"path": "docs/existing.md"}]}'
        )

        def fake_run_git(*args: str) -> subprocess.CompletedProcess[str]:
            if args[:2] == ("cat-file", "-e"):
                return subprocess.CompletedProcess(args=[], returncode=0)
            return subprocess.CompletedProcess(
                args=[], returncode=0, stdout=registry_json
            )

        with mock.patch.object(check, "run_git", side_effect=fake_run_git):
            self.assertEqual(
                check.main_branch_ids(), {"PDA-OPS-019": "docs/existing.md"}
            )


class MainEntryPointTests(unittest.TestCase):
    def test_main_returns_zero_when_origin_main_unresolvable(self) -> None:
        with mock.patch.object(check, "main_branch_ids", return_value=None):
            self.assertEqual(check.main(), 0)

    def test_main_returns_zero_on_live_repository_state(self) -> None:
        """The live repository must be collision-free against its own
        origin/main right now; this is the regression guard for future
        collisions, not a fixture-based test, since the check's entire
        purpose is comparing live working-tree state to live origin/main."""
        self.assertEqual(check.main(), 0)

    def test_main_returns_one_and_reports_on_collision(self) -> None:
        with mock.patch.object(
            check,
            "current_tree_ids",
            return_value={"PDA-OPS-019": "docs/new-doc.md"},
        ), mock.patch.object(
            check,
            "main_branch_ids",
            return_value={"PDA-OPS-019": "docs/existing.md"},
        ):
            self.assertEqual(check.main(), 1)


if __name__ == "__main__":
    unittest.main()
