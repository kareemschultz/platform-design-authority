"""Guard the repository-root scanning invariant.

Coding agents create full repository checkouts under `.codex/worktrees/` and
`.claude/worktrees/`. A script that walks the repository root without pruning
them sees every governed file once per worktree. That has already broken two
gates in different tools:

* nested `biome.json` files made `bun run check` fail (issue #113)
* `validate_document_indexes.py` reported 6479 false errors (issue #115)

Both were invisible in continuous integration, which clones fresh, and only
degraded local development — the worse failure mode, because a contributor
sees red for reasons unrelated to their change.

Three scripts currently walk the repository root. Two are protected only
incidentally, by skipping dot-directories for unrelated reasons. This test
makes the invariant explicit so a new root-walking script cannot silently
reintroduce the defect.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent

# Walking the repository root itself, as opposed to a narrow subtree such as
# (root / "docs") or a package directory.
#
# `os.walk` over any root-named variable counts. For `rglob`, only the
# module-level constants count: several scripts bind a lowercase `root` as a
# loop variable over narrow roots (`for root in IMPLEMENTATION_ROOTS`), which
# is not a repository-root walk. This is a safety net, not a parser — a script
# that binds the repository root to some other name and calls `rglob` on it
# would not be detected.
ROOT_WALK = re.compile(
    r"os\.walk\(\s*(REPO_ROOT|ROOT|repo_root|root)\s*\)"
    r"|(?<![\w.)\]])(REPO_ROOT|ROOT)\.rglob\("
)

# Either prune is sufficient: skipping every dot-directory excludes .codex and
# .claude, and an explicit deny list names them directly. A script that scans
# inside a dot-directory on purpose (validate_document_indexes.py reads
# .claude/skills) cannot use the first and must use the second.
DOTFILE_PRUNE = re.compile(r"startswith\(\s*[\"']\.[\"']\s*\)")
EXPLICIT_PRUNE = re.compile(r"[\"']\.codex[\"']")
WORKTREE_PRUNE = re.compile(r"[\"']worktrees[\"']")


def root_walking_scripts() -> dict[str, str]:
    """Return {filename: source} for scripts that walk the repository root."""

    found = {}
    for path in sorted(SCRIPTS.glob("*.py")):
        if path.name.startswith("test_"):
            continue
        source = path.read_text(encoding="utf-8")
        if ROOT_WALK.search(source):
            found[path.name] = source
    return found


class RepositoryScanningTests(unittest.TestCase):
    def test_root_walking_scripts_prune_agent_worktrees(self) -> None:
        offenders = []
        for name, source in root_walking_scripts().items():
            dotfile = bool(DOTFILE_PRUNE.search(source))
            explicit = bool(EXPLICIT_PRUNE.search(source) and WORKTREE_PRUNE.search(source))
            if not (dotfile or explicit):
                offenders.append(name)

        self.assertEqual(
            offenders,
            [],
            "These scripts walk the repository root without pruning agent worktree "
            "checkouts, so they will report every governed file once per worktree "
            "(see issues #113 and #115). Either skip dot-directories, or name "
            "'.codex' and 'worktrees' in an ignore set: " + ", ".join(offenders),
        )

    def test_the_invariant_still_has_subjects(self) -> None:
        """If nothing walks the root any more, this guard is dead weight."""
        self.assertNotEqual(
            root_walking_scripts(),
            {},
            "No script walks the repository root; delete this guard rather than "
            "leaving a test that can never fail.",
        )


if __name__ == "__main__":
    unittest.main()
