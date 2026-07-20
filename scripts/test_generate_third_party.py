from __future__ import annotations

import json
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import generate_third_party as subject


class JsoncTests(unittest.TestCase):
    def test_comments_and_trailing_commas_preserve_string_literals(self) -> None:
        source = '{"literal":",}","url":"https://example.test/a//b",/*x*/"items":[1,],}'
        self.assertEqual(
            {"literal": ",}", "url": "https://example.test/a//b", "items": [1]},
            json.loads(subject.strip_jsonc(source)),
        )

    def test_unterminated_block_comment_fails(self) -> None:
        with self.assertRaisesRegex(subject.BaselineError, "unterminated"):
            subject.strip_jsonc("{/* no end")


class RestrictedMaterialTests(unittest.TestCase):
    def test_restricted_singular_and_plural_keys_fail(self) -> None:
        for key in ("license-key", "invoices", "entitlements", "private_urls"):
            with self.subTest(key=key):
                with self.assertRaisesRegex(subject.BaselineError, "restricted field"):
                    subject.reject_restricted_material({key: "redacted"})

    def test_credential_shaped_value_fails(self) -> None:
        with self.assertRaisesRegex(subject.BaselineError, "credential-shaped"):
            subject.reject_restricted_material({"evidence": "sk-" + "a" * 25})

    def test_repository_paths_reject_escape_and_windows_separators(self) -> None:
        for path in (
            "../outside", "/absolute", "a\\b", "C:/Windows/win.ini",
            "https://example.test/file",
        ):
            with self.subTest(path=path):
                with self.assertRaisesRegex(subject.BaselineError, "invalid repository"):
                    subject._repo_relative(path)


class LockInventoryTests(unittest.TestCase):
    def test_scoped_alias_specs_and_purls(self) -> None:
        self.assertEqual(
            ("@scope/pkg", "1.2.3"), subject.split_package_spec("npm:@scope/pkg@1.2.3")
        )
        self.assertEqual("pkg:npm/%40scope/pkg@1.2.3", subject.purl("@scope/pkg", "1.2.3"))
        digest = subject._sha512_hex("sha512-" + "AA==")
        self.assertRegex(digest or "", re.compile(r"^[a-f0-9]+$"))

    def test_workspace_entries_are_excluded_and_edges_are_sorted(self) -> None:
        lock = {"packages": {
            "app": ["app@workspace:apps/app"],
            "dep": ["dep@1.0.0", "", {"dependencies": {"z": "2", "a": "1"}}, "sha512-AA=="],
        }}
        records, by_key = subject.package_inventory(lock)
        self.assertEqual(["dep"], list(by_key))
        self.assertEqual([("a", "1"), ("z", "2")], records[0]["dependencies"])

    def test_workspace_specific_resolution_wins_and_ambiguity_fails(self) -> None:
        root = {"lock_key": "dep", "name": "dep", "version": "1.0.0"}
        local = {"lock_key": "web/dep", "name": "dep", "version": "2.0.0"}
        self.assertEqual(
            "2.0.0",
            subject.resolve_direct_dependency(
                {"name": "web"}, "dep", "^2", {"dep": root, "web/dep": local}
            )["version"],
        )
        with self.assertRaisesRegex(subject.BaselineError, "cannot deterministically resolve"):
            subject.resolve_direct_dependency(
                {"name": "other"}, "dep", "^1", {"a/dep": root, "b/dep": local}
            )

    def test_alias_equivalent_declared_components_are_deduplicated(self) -> None:
        record = {
            "lock_key": "shared",
            "name": "shared",
            "version": "1.0.0",
            "integrity": "sha512-AA==",
        }
        sbom = subject.declared_sbom(
            "apps/test",
            {
                "name": "test",
                "dependencies": {
                    "alias-a": "npm:shared@1.0.0",
                    "alias-b": "npm:shared@1.0.0",
                },
            },
            {"name": "test", "version": "0.0.0"},
            {"shared": record},
        )
        self.assertEqual(1, len(sbom["components"]))
        declarations = json.loads(
            next(
                item["value"]
                for item in sbom["components"][0]["properties"]
                if item["name"] == "pda:declared-dependencies-json"
            )
        )
        self.assertEqual(["alias-a", "alias-b"], [item["name"] for item in declarations])


class LicenseObservationTests(unittest.TestCase):
    def test_and_and_or_semantics_remain_distinct(self) -> None:
        inventory = [
            {"name": "and-package", "version": "1"},
            {"name": "or-package", "version": "1"},
        ]
        base = {
            "review_status": "qualified-review-required",
            "license_conclusion": "NOASSERTION",
            "source_context": "fixture",
            "limitation": "fixture only",
        }
        observations = [
            {**base, "package": "and-package", "version": "1", "observed_expression": "MIT AND Apache-2.0", "expression_kind": "and-conjunctive"},
            {**base, "package": "or-package", "version": "1", "observed_expression": "MIT OR Apache-2.0", "expression_kind": "or-choice"},
        ]
        validated = subject.validate_license_observations(
            {
                "license_review_observation_count": 2,
                "license_review_required_identities": [
                    {"package": "and-package", "version": "1"},
                    {"package": "or-package", "version": "1"},
                ],
                "license_review_observations": observations,
            },
            inventory,
        )
        self.assertEqual(["and-conjunctive", "or-choice"], [x["expression_kind"] for x in validated])

        observations[0]["expression_kind"] = "or-choice"
        with self.assertRaisesRegex(subject.BaselineError, "kind mismatch"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 2,
                    "license_review_required_identities": [
                        {"package": "and-package", "version": "1"},
                        {"package": "or-package", "version": "1"},
                    ],
                    "license_review_observations": observations,
                },
                inventory,
            )

    def test_empty_or_count_drift_observations_fail(self) -> None:
        with self.assertRaisesRegex(subject.BaselineError, "non-empty"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 1,
                    "license_review_observations": [],
                },
                [],
            )
        with self.assertRaisesRegex(subject.BaselineError, "count mismatch"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 2,
                    "license_review_observations": [
                        {
                            "package": "one",
                            "version": "1",
                            "observed_expression": "MIT",
                            "expression_kind": "obligation-review",
                            "review_status": "qualified-review-required",
                            "license_conclusion": "NOASSERTION",
                            "source_context": "fixture",
                            "limitation": "fixture only",
                        }
                    ],
                },
                [{"name": "one", "version": "1"}],
            )

    def test_required_license_identity_coverage_cannot_drift(self) -> None:
        base = {
            "observed_expression": "MIT",
            "expression_kind": "obligation-review",
            "review_status": "qualified-review-required",
            "license_conclusion": "NOASSERTION",
            "source_context": "fixture",
            "limitation": "fixture only",
        }
        with self.assertRaisesRegex(subject.BaselineError, "identity coverage mismatch"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 1,
                    "license_review_required_identities": [
                        {"package": "required", "version": "1"}
                    ],
                    "license_review_observations": [
                        {**base, "package": "replacement", "version": "1"}
                    ],
                },
                [
                    {"name": "required", "version": "1"},
                    {"name": "replacement", "version": "1"},
                ],
            )

    def test_repository_license_identity_scope_is_independently_pinned(self) -> None:
        provenance = subject.load_jsonc(subject.SOURCE)
        subject.validate_pinned_license_review_scope(provenance)
        provenance["license_review_required_identities"].pop()
        provenance["license_review_observations"].pop()
        provenance["license_review_observation_count"] -= 1
        with self.assertRaisesRegex(subject.BaselineError, "exactly 21"):
            subject.validate_pinned_license_review_scope(provenance)

    def test_observation_absent_from_lock_or_promoted_conclusion_fails(self) -> None:
        observation = {
            "package": "missing", "version": "1", "observed_expression": None,
            "expression_kind": "metadata-missing", "review_status": "qualified-review-required",
            "license_conclusion": "NOASSERTION", "source_context": "fixture",
            "limitation": "fixture only",
        }
        with self.assertRaisesRegex(subject.BaselineError, "absent from bun.lock"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 1,
                    "license_review_required_identities": [
                        {"package": "missing", "version": "1"}
                    ],
                    "license_review_observations": [observation],
                },
                [],
            )
        observation["license_conclusion"] = "MIT"
        with self.assertRaisesRegex(subject.BaselineError, "NOASSERTION"):
            subject.validate_license_observations(
                {
                    "license_review_observation_count": 1,
                    "license_review_required_identities": [
                        {"package": "missing", "version": "1"}
                    ],
                    "license_review_observations": [observation],
                },
                [{"name": "missing", "version": "1"}],
            )


class ProvenanceCoverageTests(unittest.TestCase):
    def _record(self, files: list[str]) -> dict[str, object]:
        return {
            "id": "asset.one", "kind": "asset", "source_name": "Source",
            "source_version": "1", "source_url": "https://example.test/source",
            "declared_upstream_license": "NOASSERTION", "upstream_license_url": None,
            "license_conclusion": "NOASSERTION",
            "notice_status": "included-in-generated-baseline",
            "permitted_use_evidence": {
                "status": "not-established-for-exact-assets", "references": []
            },
            "distribution_status": "replace-before-distribution",
            "modifications": "none", "files": files,
        }

    def test_unmapped_or_untracked_file_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "assets").mkdir()
            (root / "assets" / "one.png").write_bytes(b"one")
            (root / "assets" / "two.png").write_bytes(b"two")
            provenance = {
                "coverage_scopes": ["assets/*"],
                "records": [self._record(["assets/one.png"])],
            }
            with patch.object(subject, "ROOT", root):
                with self.assertRaisesRegex(subject.BaselineError, "missing=.*two.png"):
                    subject.source_asset_inventory(
                        provenance, {"assets/one.png", "assets/two.png"}
                    )
                provenance["records"] = [self._record(["assets/one.png", "assets/two.png"])]
                with self.assertRaisesRegex(subject.BaselineError, "not a tracked regular"):
                    subject.source_asset_inventory(provenance, {"assets/one.png"})

    def test_license_promotion_and_build_time_promotion_fail(self) -> None:
        record = self._record(["asset.txt"])
        record["license_conclusion"] = "MIT"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "asset.txt").write_text("asset", encoding="utf-8")
            with patch.object(subject, "ROOT", root):
                with self.assertRaisesRegex(subject.BaselineError, "NOASSERTION"):
                    subject.source_asset_inventory(
                        {"coverage_scopes": ["asset.txt"], "records": [record]},
                        {"asset.txt"},
                    )
        record = self._record(["asset.txt"])
        record["distribution_status"] = "approved-for-distribution"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "asset.txt").write_text("asset", encoding="utf-8")
            with patch.object(subject, "ROOT", root):
                with self.assertRaisesRegex(subject.BaselineError, "distribution status"):
                    subject.source_asset_inventory(
                        {"coverage_scopes": ["asset.txt"], "records": [record]},
                        {"asset.txt"},
                    )

    def test_build_time_reference_is_conservative_and_hash_bound(self) -> None:
        reference = {
            "id": "font.one",
            "kind": "build-time-font-reference",
            "source_name": "Font",
            "source_url": "https://example.test/font",
            "declared_upstream_license": "OFL-1.1",
            "upstream_license_url": "https://example.test/license",
            "license_conclusion": "NOASSERTION",
            "permitted_use_evidence": {
                "status": "public-upstream-license-observed-not-artifact-reviewed",
                "references": ["layout.tsx"],
            },
            "distribution_status": "artifact-review-required",
            "reference_paths": ["layout.tsx"],
            "limitation": "fixture only",
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "layout.tsx"
            path.write_text("layout", encoding="utf-8")
            with patch.object(subject, "ROOT", root):
                validated = subject.validate_build_time_references(
                    {"build_time_references": [reference]}, {"layout.tsx"}
                )
                self.assertEqual(
                    subject._sha256(path),
                    validated[0]["reference_files"][0]["sha256"],
                )
                reference["reference_paths"] = ["C:/Windows/win.ini"]
                with self.assertRaisesRegex(subject.BaselineError, "repository-relative"):
                    subject.validate_build_time_references(
                        {"build_time_references": [reference]}, {"layout.tsx"}
                    )


class RepositoryBaselineTests(unittest.TestCase):
    def test_outputs_are_deterministic_bounded_and_standard_shaped(self) -> None:
        first = subject.build_outputs()
        second = subject.build_outputs()
        self.assertEqual(first, second)
        self.assertEqual(8, len(first))
        sboms = [
            json.loads(content)
            for path, content in first.items()
            if path.name.endswith(".cdx.json")
        ]
        self.assertEqual(5, len(sboms))
        for sbom in sboms:
            self.assertEqual("CycloneDX", sbom["bomFormat"])
            self.assertEqual("1.6", sbom["specVersion"])
            refs = [item["bom-ref"] for item in sbom["components"]]
            self.assertEqual(len(refs), len(set(refs)))
            self.assertEqual("incomplete", sbom["compositions"][0]["aggregate"])
            properties = {
                item["name"]: item["value"]
                for item in sbom["metadata"]["component"]["properties"]
            }
            self.assertEqual("true", properties["pda:not-post-build-or-artifact-sbom"])
            self.assertEqual("none", properties["pda:distribution-authority"])
            self.assertIn("artifact-boms-must-mint-rfc4122", properties["pda:serial-number-policy"])

    def test_every_tracked_manifest_is_private_and_no_root_license_exists(self) -> None:
        tracked = subject.tracked_regular_files()
        lock = subject.load_jsonc(subject.ROOT / "bun.lock")
        manifests = subject.validate_private_manifests(lock, tracked)
        self.assertTrue(manifests)
        root_license_files = sorted({
            path.name
            for pattern in ("LICENSE*", "LICENCE*", "COPYING*")
            for path in subject.ROOT.glob(pattern)
            if path.is_file() or path.is_symlink()
        })
        self.assertEqual([], root_license_files)

    def test_unexpected_generated_files_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            generated = Path(directory) / "generated"
            generated.mkdir()
            expected = generated / "expected.json"
            extra = generated / "obsolete.json"
            expected.write_text("{}", encoding="utf-8")
            extra.write_text("{}", encoding="utf-8")
            self.assertEqual(
                ["obsolete.json"],
                subject.unexpected_generated_paths({expected: b"{}"}, generated),
            )


if __name__ == "__main__":
    unittest.main()
