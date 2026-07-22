"""Regression tests for the WS3 evidence checker.

Includes the WS3 remediation R4 (Evidence system repair) negative tests:
proof that `validate_evidence_entry`/`categorize_cell_tier` actually
REJECT a fake marker, an empty-test claim, an overbroad capability x
dimension mapping, and a prose-only claim of behavioral closure — the
prior checker's own test suite (below, the AI-runtime-closure tests) never
exercised this marker/cell logic at all, which is exactly how the
original 156/156 headline shipped with two confirmed overclaim categories
undetected. Each test below constructs a SYNTHETIC fixture (no real
repository files touched) and asserts the checker's real production
functions raise/classify correctly against it.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import sys
from pathlib import Path

# Fifth-audit F-I-001: allow both `python -m unittest scripts.test_x` and the
# documented plain-script invocation `python scripts/test_x.py`.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts import check_ws3_evidence as checker


class Ws3AiRuntimeClosureTests(unittest.TestCase):
    def write_workspace_config(
        self, root: Path, patterns: list[str] | None = None
    ) -> None:
        (root / "package.json").write_text(
            json.dumps(
                {
                    "name": "test-workspace",
                    "private": True,
                    "workspaces": {
                        "packages": patterns or ["apps/*", "packages/*/*"]
                    },
                }
            ),
            encoding="utf-8",
        )

    def write_package(
        self,
        root: Path,
        relative_path: str,
        name: str,
        dependencies: dict[str, str] | None = None,
        dev_dependencies: dict[str, str] | None = None,
    ) -> Path:
        package_root = root / relative_path
        package_root.mkdir(parents=True)
        manifest = {
            "name": name,
            "dependencies": dependencies or {},
            "devDependencies": dev_dependencies or {},
        }
        (package_root / "package.json").write_text(
            json.dumps(manifest), encoding="utf-8"
        )
        return package_root

    def test_derives_transitive_runtime_workspace_closure(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root)
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/middle": "workspace:*"},
                {"@example/dev-only": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            self.write_package(
                root,
                "packages/platform/middle",
                "@example/middle",
                {"@example/leaf": "workspace:*"},
            )
            self.write_package(root, "packages/platform/leaf", "@example/leaf")
            self.write_package(root, "packages/platform/dev-only", "@example/dev-only")

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)

            self.assertEqual(
                {package.name for package in closure},
                {"server", "web", "worker", "@example/middle", "@example/leaf"},
            )

    def test_detects_ai_marker_in_transitive_workspace_package(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root)
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/transitive": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            transitive_root = self.write_package(
                root, "packages/platform/transitive", "@example/transitive"
            )
            (transitive_root / "src").mkdir()
            (transitive_root / "src" / "index.ts").write_text(
                'import { generateText } from "@ai-sdk/core";\n', encoding="utf-8"
            )

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)
            violations = checker.find_ai_runtime_violations(closure, root)

            self.assertEqual(
                violations,
                ["packages/platform/transitive/src/index.ts: @ai-sdk"],
            )

    def test_discovers_configured_workspace_patterns_and_rejects_hidden_ai(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root, ["apps/*", "services/*"])
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/hidden": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            hidden_root = self.write_package(
                root, "services/hidden", "@example/hidden"
            )
            (hidden_root / "src").mkdir()
            (hidden_root / "src" / "index.ts").write_text(
                'import { generateText } from "@ai-sdk/core";\n', encoding="utf-8"
            )

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)

            self.assertIn("@example/hidden", {package.name for package in closure})
            self.assertEqual(
                checker.find_ai_runtime_violations(closure, root),
                ["services/hidden/src/index.ts: @ai-sdk"],
            )

    def test_rejects_an_undiscovered_workspace_runtime_dependency(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root, ["apps/*"])
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/missing": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")

            packages = checker.discover_workspace_packages(root)
            with self.assertRaisesRegex(
                AssertionError, "undiscovered workspace runtime dependencies"
            ):
                checker.derive_runtime_dependency_closure(packages)

    def test_live_closure_includes_frontend_and_authority_transitives(self) -> None:
        packages = checker.discover_workspace_packages(checker.ROOT)
        closure = checker.derive_runtime_dependency_closure(packages)
        closure_names = {package.name for package in closure}

        self.assertTrue(
            {
                "@meridian/platform-clients-api-client",
                "@meridian/ui-web",
                "@meridian/platform-authorization",
                "@meridian/platform-entitlements",
            }
            <= closure_names
        )


class Ws3EvidenceEntryValidationTests(unittest.TestCase):
    """WS3 remediation R4: negative tests proving the redesigned evidence
    checker actually REJECTS the four overclaim shapes the remediation
    directive names, plus the "prose-only" categorization guard. Every
    test below is fully synthetic (no real repository file is read) so
    these prove the CHECKER's own logic, independent of whether the real
    production evidence file happens to currently pass.
    """

    def valid_capabilities(self) -> set[str]:
        return {"commerce.pos", "commerce.refunds"}

    def valid_dimensions(self) -> set[str]:
        return {"happy_path", "audit_and_observability", "tenant_isolation"}

    def base_entry(self, **overrides: object) -> dict[str, object]:
        entry = {
            "id": "fixture-entry",
            "kind": "automated-test",
            "path": "fixture/path.test.ts",
            "contains": ["a genuinely descriptive real test name proving real behavior"],
            "command": "bun test fixture/path.test.ts",
            "runtimes": ["Bun 1.3.14"],
            "capabilities": ["commerce.pos"],
            "dimensions": ["happy_path"],
        }
        entry.update(overrides)
        return entry

    def test_accepts_a_genuine_well_formed_entry(self) -> None:
        entry = self.base_entry()
        content = "describe(x, () => { test(\"a genuinely descriptive real test name proving real behavior\", async () => {}); });"
        marker_count = checker.validate_evidence_entry(
            entry, content, self.valid_capabilities(), self.valid_dimensions()
        )
        self.assertEqual(marker_count, 1)

    def test_rejects_a_fake_marker_absent_from_the_cited_source(self) -> None:
        """Pre-fix reproduction: the ORIGINAL checker only ever compared
        markers against whatever file the evidence entry HAPPENED to
        cite correctly — nothing ever exercised the "marker is actually
        wrong" branch with a synthetic fixture. This proves it fires."""
        entry = self.base_entry(
            contains=["this exact sentence does not exist in the file"]
        )
        content = "test(\"a completely different, unrelated test name\", () => {});"
        with self.assertRaisesRegex(AssertionError, "is absent from its cited source"):
            checker.validate_evidence_entry(
                entry, content, self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_an_empty_test_claim_with_zero_markers(self) -> None:
        entry = self.base_entry(contains=[])
        with self.assertRaisesRegex(AssertionError, "has no source markers"):
            checker.validate_evidence_entry(
                entry, "irrelevant content", self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_an_overbroad_capability_dimension_mapping(self) -> None:
        """A single 5-character marker claiming THREE dimensions is the
        thin/fabricated-coverage shape the remediation directive calls
        out ("capability x dimension Cartesian products cannot
        automatically imply coverage") — this must be REJECTED, not
        silently accepted the way marker-presence-only checking would.
        `MIN_MARKER_CHARS_PER_DIMENSION` (20) requires >=60 characters
        for 3 dimensions; "audit" (5 chars) is far short."""
        entry = self.base_entry(
            contains=["audit"],
            dimensions=["happy_path", "audit_and_observability", "tenant_isolation"],
        )
        content = "some file containing the word audit somewhere in prose"
        with self.assertRaisesRegex(AssertionError, "overbroad capability x dimension mapping"):
            checker.validate_evidence_entry(
                entry, content, self.valid_capabilities(), self.valid_dimensions()
            )

    def test_overbroad_guard_does_not_apply_to_governance_or_deferred_kinds(self) -> None:
        """A short, honest one-line disclosure marker for a SINGLE
        dimension must still be accepted for `deferred-pending` /
        `governance-validation` kinds — the overbroad-mapping floor is a
        behavioral-evidence guard, not a blanket length minimum on every
        kind of evidence (a real disclosure sentence can legitimately be
        short and still be genuine, verifiable proof of an honest
        disclosure)."""
        entry = self.base_entry(
            kind="deferred-pending",
            contains=["disclosed gap"],
            dimensions=["audit_and_observability"],
        )
        content = "This is a disclosed gap, recorded honestly."
        marker_count = checker.validate_evidence_entry(
            entry, content, self.valid_capabilities(), self.valid_dimensions()
        )
        self.assertEqual(marker_count, 1)

    def test_rejects_an_unknown_evidence_kind(self) -> None:
        entry = self.base_entry(kind="totally-made-up-kind")
        with self.assertRaisesRegex(AssertionError, "unknown evidence kind"):
            checker.validate_evidence_entry(
                entry, "test(\"x\", () => {});", self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_undeclared_capabilities(self) -> None:
        entry = self.base_entry(capabilities=["commerce.not-a-real-capability"])
        with self.assertRaisesRegex(AssertionError, "undeclared capabilities"):
            checker.validate_evidence_entry(
                entry, "test(\"a genuinely descriptive real test name proving real behavior\", () => {});", self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_unknown_dimensions(self) -> None:
        entry = self.base_entry(dimensions=["not_a_real_dimension"])
        with self.assertRaisesRegex(AssertionError, "unknown dimensions"):
            checker.validate_evidence_entry(
                entry, "test(\"a genuinely descriptive real test name proving real behavior\", () => {});", self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_a_missing_reproduction_command(self) -> None:
        entry = self.base_entry(command="")
        with self.assertRaisesRegex(AssertionError, "requires a reproduction command"):
            checker.validate_evidence_entry(
                entry, "test(\"a genuinely descriptive real test name proving real behavior\", () => {});", self.valid_capabilities(), self.valid_dimensions()
            )

    def test_rejects_missing_runtimes(self) -> None:
        entry = self.base_entry(runtimes=[])
        with self.assertRaisesRegex(AssertionError, "requires at least one runtime"):
            checker.validate_evidence_entry(
                entry, "test(\"a genuinely descriptive real test name proving real behavior\", () => {});", self.valid_capabilities(), self.valid_dimensions()
            )


class Ws3CellTierCategorizationTests(unittest.TestCase):
    """WS3 remediation R4: proves `categorize_cell_tier` never lets a
    prose-only (governance/deferred) claim masquerade as behavioral
    closure — the exact "prose-only claim" guard the remediation
    directive requires, and the precise defect class that let the
    original checker's audit-dimension cells cite files containing the
    word "audit" nowhere while still reporting uniform "Evidenced"."""

    def test_governance_only_cell_is_never_reported_as_behavioral(self) -> None:
        tier = checker.categorize_cell_tier(
            {"gov-entry"}, {"gov-entry": "governance-validation"}
        )
        self.assertEqual(tier, "governance")
        self.assertNotEqual(tier, "behavioral")

    def test_deferred_only_cell_is_never_reported_as_behavioral(self) -> None:
        tier = checker.categorize_cell_tier(
            {"deferred-entry"}, {"deferred-entry": "deferred-pending"}
        )
        self.assertEqual(tier, "deferred")
        self.assertNotEqual(tier, "behavioral")

    def test_a_real_behavioral_entry_alongside_a_governance_entry_still_counts_as_behavioral(
        self,
    ) -> None:
        """Precedence: if genuine behavioral proof exists for a cell, the
        cell IS behaviorally closed even if a governance entry is also
        attached — this is the correct, non-punitive reading (extra
        supporting documentation does not downgrade a cell that already
        has real test evidence)."""
        tier = checker.categorize_cell_tier(
            {"gov-entry", "test-entry"},
            {"gov-entry": "governance-validation", "test-entry": "live-postgresql-test"},
        )
        self.assertEqual(tier, "behavioral")

    def test_empty_evidence_set_categorizes_as_none(self) -> None:
        self.assertEqual(checker.categorize_cell_tier(set(), {}), "none")


if __name__ == "__main__":
    unittest.main()
