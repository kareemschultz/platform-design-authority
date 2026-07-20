"""Regression tests for the labels-as-code sync script."""

import unittest
from unittest import mock

from scripts import sync_labels
from scripts.sync_labels import LABELS_FILE, diff, load_desired, main


class DiffTests(unittest.TestCase):
    def test_missing_label_needs_sync(self) -> None:
        desired = [{"name": "bug", "color": "d73a4a", "description": "Broken"}]
        needs_sync, unlisted = diff(desired, {})
        self.assertEqual(needs_sync, desired)
        self.assertEqual(unlisted, [])

    def test_matching_label_needs_no_sync(self) -> None:
        desired = [{"name": "bug", "color": "d73a4a", "description": "Broken"}]
        live = {"bug": {"name": "bug", "color": "d73a4a", "description": "Broken"}}
        needs_sync, unlisted = diff(desired, live)
        self.assertEqual(needs_sync, [])
        self.assertEqual(unlisted, [])

    def test_color_case_is_not_a_mismatch(self) -> None:
        desired = [{"name": "bug", "color": "D73A4A", "description": "Broken"}]
        live = {"bug": {"name": "bug", "color": "d73a4a", "description": "Broken"}}
        needs_sync, _ = diff(desired, live)
        self.assertEqual(needs_sync, [])

    def test_color_drift_needs_sync(self) -> None:
        desired = [{"name": "bug", "color": "000000", "description": "Broken"}]
        live = {"bug": {"name": "bug", "color": "d73a4a", "description": "Broken"}}
        needs_sync, _ = diff(desired, live)
        self.assertEqual(needs_sync, desired)

    def test_description_drift_needs_sync(self) -> None:
        desired = [{"name": "bug", "color": "d73a4a", "description": "New wording"}]
        live = {"bug": {"name": "bug", "color": "d73a4a", "description": "Old wording"}}
        needs_sync, _ = diff(desired, live)
        self.assertEqual(needs_sync, desired)

    def test_live_only_label_is_reported_unlisted_not_deleted(self) -> None:
        desired = [{"name": "bug", "color": "d73a4a", "description": "Broken"}]
        live = {
            "bug": {"name": "bug", "color": "d73a4a", "description": "Broken"},
            "stray": {"name": "stray", "color": "ffffff", "description": ""},
        }
        needs_sync, unlisted = diff(desired, live)
        self.assertEqual(needs_sync, [])
        self.assertEqual(unlisted, ["stray"])


class LoadDesiredTests(unittest.TestCase):
    def test_live_labels_file_parses_and_has_required_fields(self) -> None:
        labels = load_desired(LABELS_FILE)
        self.assertGreater(len(labels), 0)
        for label in labels:
            self.assertIn("name", label)
            self.assertIn("color", label)
            self.assertRegex(label["color"], r"^[0-9a-fA-F]{6}$")

    def test_live_labels_file_has_no_duplicate_names(self) -> None:
        labels = load_desired(LABELS_FILE)
        names = [label["name"] for label in labels]
        self.assertEqual(len(names), len(set(names)), "duplicate label name in labels.yml")


class MainDegradationTests(unittest.TestCase):
    def test_main_skips_cleanly_when_gh_is_not_authenticated(self) -> None:
        with mock.patch.object(sync_labels, "gh_authenticated", return_value=False), mock.patch(
            "sys.argv", ["sync_labels.py", "--check"]
        ):
            self.assertEqual(main(), 0)


if __name__ == "__main__":
    unittest.main()
