"""Regression tests for the UI-governance validator."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import validate_ui_governance as validator
from scripts.validate_ui_governance import (
    check_catalog_platform_approved,
    check_provenance_records,
    check_raw_palette,
    parse_catalog_entries,
)


class RawPaletteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "apps" / "web" / "src").mkdir(parents=True)
        (self.root / "packages" / "ui" / "src").mkdir(parents=True)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def _write(self, rel: str, content: str) -> None:
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_clean_component_produces_no_errors(self) -> None:
        self._write(
            "apps/web/src/Button.tsx",
            "export const Button = () => <button className='bg-primary text-primary-foreground' />;\n",
        )
        with mock.patch.object(validator, "ROOT", self.root):
            self.assertEqual(check_raw_palette(), [])

    def test_hex_literal_in_component_is_an_error(self) -> None:
        self._write(
            "apps/web/src/Button.tsx",
            "export const style = { color: '#ff0000' };\n",
        )
        with mock.patch.object(validator, "ROOT", self.root):
            errors = check_raw_palette()
        self.assertEqual(len(errors), 1)
        self.assertIn("hex color literal", errors[0])

    def test_tailwind_palette_class_is_an_error(self) -> None:
        self._write(
            "apps/web/src/Button.tsx",
            "export const Button = () => <button className='bg-red-500' />;\n",
        )
        with mock.patch.object(validator, "ROOT", self.root):
            errors = check_raw_palette()
        self.assertEqual(len(errors), 1)
        self.assertIn("Tailwind palette", errors[0])

    def test_allowlisted_file_is_exempt(self) -> None:
        self._write(
            "apps/native/lib/constants.ts",
            "export const BRAND_HEX = '#ff0000';\n",
        )
        with mock.patch.object(validator, "ROOT", self.root), mock.patch.object(
            validator, "HEX_ALLOWLIST", {"apps/native/lib/constants.ts"}
        ):
            self.assertEqual(check_raw_palette(), [])

    def test_node_modules_is_never_scanned(self) -> None:
        self._write(
            "apps/web/node_modules/some-dep/index.ts",
            "export const color = '#ff0000';\n",
        )
        with mock.patch.object(validator, "ROOT", self.root):
            self.assertEqual(check_raw_palette(), [])

    def test_live_repository_is_clean_against_the_seeded_allowlist(self) -> None:
        """Regression guard: the 2026-07-20 audit found zero Tailwind palette
        classes and exactly three hex-literal files repository-wide. This
        runs against the real repository, not a fixture, since the whole
        point is that the seeded allowlist should need no burn-down."""
        self.assertEqual(check_raw_palette(), [])


class ProvenanceRecordTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "evidence" / "ui-provenance").mkdir(parents=True)
        (self.root / "registry").mkdir(parents=True)
        self.template = {
            "schema_version": "1.0.0",
            "status": "template",
            "record": {
                "id": None,
                "source_product": None,
                "license_owner": None,
                "permitted_entity": None,
                "permitted_products": [],
                "platform_component_name": None,
            },
        }
        (self.root / "registry" / "premium-ui-provenance-template.json").write_text(
            json.dumps(self.template), encoding="utf-8"
        )

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def _write_record(self, name: str, record: dict) -> None:
        path = self.root / "evidence" / "ui-provenance" / name
        path.write_text(json.dumps({"record": record}), encoding="utf-8")

    def test_missing_directory_is_not_an_error(self) -> None:
        empty_root = Path(tempfile.mkdtemp())
        with mock.patch.object(validator, "ROOT", empty_root), mock.patch.object(
            validator, "PROVENANCE_DIR", empty_root / "evidence" / "ui-provenance"
        ):
            self.assertEqual(check_provenance_records(), [])

    def test_conforming_record_with_null_sensitive_fields_passes(self) -> None:
        self._write_record(
            "example.json",
            {
                "id": "ui-source.example",
                "source_product": "shadcn/studio",
                "license_owner": None,
                "permitted_entity": None,
                "permitted_products": [],
                "platform_component_name": "PlatformButton",
            },
        )
        with mock.patch.object(validator, "ROOT", self.root), mock.patch.object(
            validator, "PROVENANCE_DIR", self.root / "evidence" / "ui-provenance"
        ), mock.patch.object(
            validator,
            "PROVENANCE_TEMPLATE",
            self.root / "registry" / "premium-ui-provenance-template.json",
        ):
            self.assertEqual(check_provenance_records(), [])

    def test_missing_field_is_an_error(self) -> None:
        self._write_record(
            "example.json",
            {
                "id": "ui-source.example",
                "license_owner": None,
                "permitted_entity": None,
                "permitted_products": [],
                "platform_component_name": "PlatformButton",
                # source_product omitted
            },
        )
        with mock.patch.object(validator, "ROOT", self.root), mock.patch.object(
            validator, "PROVENANCE_DIR", self.root / "evidence" / "ui-provenance"
        ), mock.patch.object(
            validator,
            "PROVENANCE_TEMPLATE",
            self.root / "registry" / "premium-ui-provenance-template.json",
        ):
            errors = check_provenance_records()
        self.assertTrue(any("missing required provenance fields" in e for e in errors))

    def test_non_null_license_owner_is_an_error(self) -> None:
        self._write_record(
            "example.json",
            {
                "id": "ui-source.example",
                "source_product": "shadcn/studio",
                "license_owner": "Acme Corp",
                "permitted_entity": None,
                "permitted_products": [],
                "platform_component_name": "PlatformButton",
            },
        )
        with mock.patch.object(validator, "ROOT", self.root), mock.patch.object(
            validator, "PROVENANCE_DIR", self.root / "evidence" / "ui-provenance"
        ), mock.patch.object(
            validator,
            "PROVENANCE_TEMPLATE",
            self.root / "registry" / "premium-ui-provenance-template.json",
        ):
            errors = check_provenance_records()
        self.assertTrue(any("license_owner" in e and "must stay null" in e for e in errors))

    def test_malformed_json_is_an_error(self) -> None:
        path = self.root / "evidence" / "ui-provenance" / "broken.json"
        path.write_text("{not valid json", encoding="utf-8")
        with mock.patch.object(validator, "ROOT", self.root), mock.patch.object(
            validator, "PROVENANCE_DIR", self.root / "evidence" / "ui-provenance"
        ), mock.patch.object(
            validator,
            "PROVENANCE_TEMPLATE",
            self.root / "registry" / "premium-ui-provenance-template.json",
        ):
            errors = check_provenance_records()
        self.assertTrue(any("could not parse JSON" in e for e in errors))


class CatalogEntryParsingTests(unittest.TestCase):
    def test_parses_fields_from_a_single_entry(self) -> None:
        text = (
            "## Some section\n\n"
            "### Example Button\n\n"
            "- Status: Preferred Candidate\n"
            "- License/provenance record: none\n"
        )
        entries = parse_catalog_entries(text)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["name"], "Example Button")
        self.assertEqual(entries[0]["Status"], "Preferred Candidate")


class CatalogPlatformApprovedTests(unittest.TestCase):
    def test_non_approved_entry_is_not_checked(self) -> None:
        text = "### Example\n\n- Status: Researching\n"
        self.assertEqual(check_catalog_platform_approved(text), [])

    def test_platform_approved_entry_with_full_evidence_passes(self) -> None:
        text = (
            "### Example Button\n\n"
            "- Status: Platform Approved\n"
            "- License/provenance record: evidence/ui-provenance/example.json\n"
            "- Accessibility evidence: docs/reviews/example-a11y.md\n"
            "- Tests: packages/ui/src/Button.test.tsx\n"
        )
        self.assertEqual(check_catalog_platform_approved(text), [])

    def test_platform_approved_entry_missing_provenance_is_an_error(self) -> None:
        text = (
            "### Example Button\n\n"
            "- Status: Platform Approved\n"
            "- License/provenance record: TBD\n"
            "- Accessibility evidence: docs/reviews/example-a11y.md\n"
            "- Tests: packages/ui/src/Button.test.tsx\n"
        )
        errors = check_catalog_platform_approved(text)
        self.assertTrue(any("License/provenance record" in e for e in errors))

    def test_platform_approved_entry_missing_tests_is_an_error(self) -> None:
        text = (
            "### Example Button\n\n"
            "- Status: Platform Approved\n"
            "- License/provenance record: evidence/ui-provenance/example.json\n"
            "- Accessibility evidence: docs/reviews/example-a11y.md\n"
            "- Tests:\n"
        )
        errors = check_catalog_platform_approved(text)
        self.assertTrue(any("Tests" in e for e in errors))

    def test_live_catalog_has_no_platform_approved_entries_yet(self) -> None:
        """Regression guard, not a fixture test: as of 2026-07-20 the catalog
        itself states 'None is Platform Approved'. This documents that this
        check currently has no live subject, and will start applying the
        moment the first entry is promoted."""
        self.assertEqual(check_catalog_platform_approved(), [])


class MainEntryPointTests(unittest.TestCase):
    def test_main_returns_zero_on_live_repository_state(self) -> None:
        self.assertEqual(validator.main(), 0)


if __name__ == "__main__":
    unittest.main()
