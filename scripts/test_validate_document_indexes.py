"""Regression tests for canonical document-index validation."""

import tempfile
import unittest
from pathlib import Path

from scripts.validate_document_indexes import (
    discover_repository_artifacts,
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

    def test_agent_worktree_checkouts_are_not_repository_artifacts(self) -> None:
        """Agent scratch worktrees are gitignored working state, not content.

        Each is a full repository checkout, so scanning them reports every
        governed document again per worktree and makes the gate unusable on
        any machine that uses them.
        """
        for scratch in (
            self.root / ".codex" / "worktrees" / "issue-1" / "docs",
            self.root / ".claude" / "worktrees" / "review-2" / "docs",
        ):
            scratch.mkdir(parents=True)
            (scratch / "COPY.md").write_text("# Copy\n", encoding="utf-8")

        # A governed auxiliary root under .claude must still be discovered.
        skill = self.root / ".claude" / "skills" / "example"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("# Skill\n", encoding="utf-8")

        # Slash commands (.claude/commands/) are auxiliary too, not governed
        # blueprint documents -- adding one without this must not fail
        # artifact accounting the way COMPONENT_INTAKE_FAST_PATH.md's four
        # sibling command files did before AUXILIARY_DOCUMENT_ROOTS covered them.
        commands = self.root / ".claude" / "commands"
        commands.mkdir(parents=True)
        (commands / "cui.md").write_text("Call a tool...\n", encoding="utf-8")

        artifacts = discover_repository_artifacts(self.root)
        relative = {
            path.relative_to(self.root.resolve()).as_posix() for path in artifacts
        }
        self.assertNotIn(".codex/worktrees/issue-1/docs/COPY.md", relative)
        self.assertNotIn(".claude/worktrees/review-2/docs/COPY.md", relative)
        self.assertIn(".claude/skills/example/SKILL.md", relative)
        self.assertIn(".claude/commands/cui.md", relative)

    def test_claude_commands_are_accounted_as_auxiliary(self) -> None:
        commands = self.root / ".claude" / "commands"
        commands.mkdir(parents=True)
        (commands / "cui.md").write_text("Call a tool...\n", encoding="utf-8")

        errors = validate_artifact_accounting([], [], [], self.root)
        self.assertEqual(
            [e for e in errors if ".claude/commands/cui.md" in e],
            [],
            "a .claude/commands file must be accounted for as an auxiliary "
            "workflow source, not flagged as unaccounted",
        )


if __name__ == "__main__":
    unittest.main()
