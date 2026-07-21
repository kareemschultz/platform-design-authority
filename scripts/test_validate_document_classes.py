"""Regression tests for opt-in document-class adoption validation."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_document_classes import validate_document_classes


class DocumentClassValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "registry").mkdir()
        (self.root / "docs").mkdir()
        self.policy = {
            "depths": ["indexed"],
            "evidence_states": ["implemented"],
            "dimensions": [{"id": "authority-and-scope"}],
            "classes": [
                {"id": "foundation-authority", "required_dimensions": ["authority-and-scope"]}
            ],
        }
        self.adoption = {
            "review_evidence": "docs/review.md",
            "artifacts": [
                {
                    "artifact_id": "CLASS-SAMPLE-001",
                    "path": "docs/sample.md",
                    "identity": "PDA-FND-001",
                    "class_id": "foundation-authority",
                    "declared_depth": "indexed",
                    "evidence_state": "implemented",
                    "review_state": "author-self-reviewed",
                    "dimensions": {
                        "authority-and-scope": {
                            "disposition": "addressed",
                            "sections": ["Scope"],
                        }
                    },
                }
            ],
        }
        self._write_json("registry/document-classes.json", self.policy)
        self._write_json("registry/document-class-adoption.json", self.adoption)
        (self.root / "docs/review.md").write_text(
            "CLASS-SAMPLE-001 PDA-FND-001 foundation-authority", encoding="utf-8"
        )
        self._write_sample()

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _write_json(self, relative: str, value: object) -> None:
        (self.root / relative).write_text(json.dumps(value), encoding="utf-8")

    def _write_sample(self, *, section: str = "Scope", dimensions: str = "authority-and-scope") -> None:
        (self.root / "docs/sample.md").write_text(
            "---\n"
            "document_id: PDA-FND-001\n"
            "document_class: foundation-authority\n"
            "declared_depth: indexed\n"
            "evidence_state: implemented\n"
            f"applicable_dimensions: [{dimensions}]\n"
            "---\n\n"
            f"# Sample\n\n## {section}\n",
            encoding="utf-8",
        )

    def test_valid_adoption_passes(self) -> None:
        self.assertEqual(validate_document_classes(self.root), [])

    def test_unknown_class_fails(self) -> None:
        self.adoption["artifacts"][0]["class_id"] = "unknown"
        self._write_json("registry/document-class-adoption.json", self.adoption)
        self.assertTrue(any("unknown document class" in error for error in validate_document_classes(self.root)))

    def test_metadata_mismatch_fails(self) -> None:
        self._write_sample(dimensions="different")
        self.assertTrue(any("applicable_dimensions" in error for error in validate_document_classes(self.root)))

    def test_missing_section_fails(self) -> None:
        self.adoption["artifacts"][0]["dimensions"]["authority-and-scope"]["sections"] = ["Missing"]
        self._write_json("registry/document-class-adoption.json", self.adoption)
        self.assertTrue(any("missing heading" in error for error in validate_document_classes(self.root)))

    def test_short_not_applicable_reason_fails(self) -> None:
        self.adoption["artifacts"][0]["dimensions"]["authority-and-scope"] = {
            "disposition": "not-applicable",
            "reason": "No",
        }
        self._write_json("registry/document-class-adoption.json", self.adoption)
        self.assertTrue(any("reason is not specific" in error for error in validate_document_classes(self.root)))

    def test_missing_dimension_mapping_fails(self) -> None:
        self.adoption["artifacts"][0]["dimensions"] = {}
        self._write_json("registry/document-class-adoption.json", self.adoption)
        self.assertTrue(any("dimension mappings" in error for error in validate_document_classes(self.root)))

    def test_missing_review_identity_fails(self) -> None:
        (self.root / "docs/review.md").write_text("unrelated review", encoding="utf-8")
        self.assertTrue(any("review evidence" in error for error in validate_document_classes(self.root)))

    def test_missing_class_sample_fails(self) -> None:
        self.policy["classes"].append(
            {"id": "architecture-decision", "required_dimensions": ["authority-and-scope"]}
        )
        self._write_json("registry/document-classes.json", self.policy)
        self.assertTrue(any("no adoption sample" in error for error in validate_document_classes(self.root)))


if __name__ == "__main__":
    unittest.main()
