"""Regression tests for canonical document-index validation."""

import tempfile
import unittest
from pathlib import Path

from scripts.validate_document_indexes import (
    validate_artifact_accounting,
    validate_index_coverage,
)


class DocumentIndexValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "docs" / "blueprint" / "01-Test").mkdir(parents=True)
        (self.root / "docs" / "blueprint" / "README.md").write_text(
            "[Test](01-Test/README.md)\n", encoding="utf-8"
        )
        (self.root / "docs" / "blueprint" / "01-Test" / "README.md").write_text(
            "[Test Specification](TEST_SPEC.md) — `PDA-TST-900` · Draft\n",
            encoding="utf-8",
        )
        (self.root / "docs" / "blueprint" / "01-Test" / "TEST_SPEC.md").write_text(
            "# Test\n", encoding="utf-8"
        )
        self.documents = [
            {
                "document_id": "PDA-TST-901",
                "path": "docs/blueprint/01-Test/README.md",
                "status": "Draft",
            },
            {
                "document_id": "PDA-TST-900",
                "path": "docs/blueprint/01-Test/TEST_SPEC.md",
                "status": "Draft",
            },
        ]

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_valid_canonical_links_pass(self) -> None:
        self.assertEqual(validate_index_coverage(self.documents, self.root), [])

    def test_removed_link_fails_as_orphan(self) -> None:
        index = self.root / "docs" / "blueprint" / "01-Test" / "README.md"
        index.write_text("No catalog entry.\n", encoding="utf-8")
        errors = validate_index_coverage(self.documents, self.root)
        self.assertTrue(any("found 0" in error for error in errors))

    def test_bare_filename_is_not_a_navigable_entry(self) -> None:
        index = self.root / "docs" / "blueprint" / "01-Test" / "README.md"
        index.write_text("- `TEST_SPEC.md`\n", encoding="utf-8")
        errors = validate_index_coverage(self.documents, self.root)
        self.assertTrue(any("found 0" in error for error in errors))

    def test_missing_lifecycle_metadata_fails(self) -> None:
        index = self.root / "docs" / "blueprint" / "01-Test" / "README.md"
        index.write_text("[Test Specification](TEST_SPEC.md)\n", encoding="utf-8")
        errors = validate_index_coverage(self.documents, self.root)
        self.assertTrue(any("does not show registered" in error for error in errors))

    def test_duplicate_canonical_links_fail(self) -> None:
        index = self.root / "docs" / "blueprint" / "01-Test" / "README.md"
        entry = "[Test Specification](TEST_SPEC.md) — `PDA-TST-900` · Draft\n"
        index.write_text(entry + entry, encoding="utf-8")
        errors = validate_index_coverage(self.documents, self.root)
        self.assertTrue(any("found 2" in error for error in errors))

    def test_unaccounted_public_artifact_fails(self) -> None:
        (self.root / "docs" / "UNACCOUNTED.md").write_text("# Missing\n", encoding="utf-8")
        errors = validate_artifact_accounting(self.documents, [], [], self.root)
        self.assertTrue(any("neither governed" in error for error in errors))

    def test_explicit_exemption_accounts_for_non_authoritative_artifact(self) -> None:
        (self.root / "docs" / "STATUS.md").write_text("# Status\n", encoding="utf-8")
        exemptions = [
            {"path": "docs/STATUS.md"},
            {"path": "docs/blueprint/README.md"},
        ]
        errors = validate_artifact_accounting(
            self.documents, exemptions, [], self.root
        )
        self.assertEqual(errors, [])

    def test_overlapping_accounting_routes_fail(self) -> None:
        exemptions = [{"path": "docs/blueprint/01-Test/TEST_SPEC.md"}]
        errors = validate_artifact_accounting(
            self.documents, exemptions, [], self.root
        )
        self.assertTrue(any("accounted by both" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
