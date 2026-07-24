"""Guard RR-003/TD-003's closure: apps/native must stay in Biome's lint scope.

Reintroducing `"!apps/native"` (or an equivalent exclusion) to `biome.json`
would make `ultracite check`/`bun run check` silently stop scanning the
native app while remaining green -- the same regression RR-003 (issue #20)
closed. This test fails loudly if that exclusion returns, per the Codex
review finding on PR #219 that closing a risk-register entry on lint output
alone, with no regression test, leaves the closure unprotected.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BIOME_CONFIG = ROOT / "biome.json"


class BiomeNativeCoverageTests(unittest.TestCase):
    def test_apps_native_is_not_excluded_from_lint_scope(self) -> None:
        config = json.loads(BIOME_CONFIG.read_text(encoding="utf-8"))
        includes = config.get("files", {}).get("includes", [])
        excluding_native = [
            pattern
            for pattern in includes
            if pattern.startswith("!") and "apps/native" in pattern
        ]
        self.assertEqual(
            excluding_native,
            [],
            "biome.json excludes apps/native from lint scope again "
            f"({excluding_native!r}) -- this reopens RR-003/TD-003 "
            "(issue #20); fix the surfaced violations instead of "
            "re-excluding the app.",
        )


if __name__ == "__main__":
    unittest.main()
