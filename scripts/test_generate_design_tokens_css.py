"""Regression tests for scripts/generate_design_tokens_css.py."""

from __future__ import annotations

import json
import textwrap
import unittest
from pathlib import Path

from scripts.generate_design_tokens_css import (
    COMMENTED_KEYS,
    STATUS_KEYS,
    apply_to_css,
    build_blocks,
    render_comment,
)

ROOT = Path(__file__).resolve().parents[1]


def _sample_css(light_body: str, dark_body: str) -> str:
    return textwrap.dedent(
        f"""\
        :root {{
        \t--background: oklch(1 0 0);
        \t/* BEGIN generated design tokens (scripts/generate_design_tokens_css.py) */
        {light_body}
        \t/* END generated design tokens */
        \t--density-compact-control: 2rem;
        }}

        .dark {{
        \t--background: oklch(0.145 0 0);
        \t/* BEGIN generated design tokens (scripts/generate_design_tokens_css.py) */
        {dark_body}
        \t/* END generated design tokens */
        }}
        """
    )


def _sample_registry() -> dict:
    def theme_tokens(status_value: str, border_value: str, overlay_value: str, warn_fg_value: str) -> dict:
        return {
            "status-info": {"$type": "color", "$value": status_value},
            "status-success": {"$type": "color", "$value": status_value},
            "status-warning": {"$type": "color", "$value": status_value},
            "status-critical": {"$type": "color", "$value": status_value},
            "status-pending": {"$type": "color", "$value": status_value},
            "status-offline": {"$type": "color", "$value": status_value},
            "border-strong": {
                "$type": "color",
                "$value": border_value,
                "$description": "Test rationale for border-strong.",
            },
            "border-strong-overlay": {
                "$type": "color",
                "$value": overlay_value,
                "$description": "Test rationale for border-strong-overlay.",
            },
            "status-warning-foreground": {
                "$type": "color",
                "$value": warn_fg_value,
                "$description": "Test rationale for status-warning-foreground.",
            },
        }

    return {
        "tokens": {
            "color": {
                "light": theme_tokens("#ABCDEF", "#111111", "#222222", "#333333"),
                "dark": theme_tokens("#FEDCBA", "#444444", "#555555", "#666666"),
            }
        }
    }


class RenderCommentTests(unittest.TestCase):
    def test_lowercases_are_not_applied_to_prose(self) -> None:
        comment = render_comment("border-strong", "light", "Reaches 4.76:1 against #64748B.")
        self.assertIn("4.76:1", comment)
        self.assertIn("#64748B", comment)
        self.assertTrue(comment.startswith("\t/* border-strong (color.light.border-strong,"))
        self.assertTrue(comment.rstrip().endswith("*/"))

    def test_every_continuation_line_is_tab_plus_three_char_indent(self) -> None:
        long_description = " ".join(f"word{i}" for i in range(40))
        comment = render_comment("border-strong-overlay", "dark", long_description)
        lines = comment.split("\n")
        self.assertGreater(len(lines), 1, "fixture description should wrap onto multiple lines")
        for line in lines:
            self.assertTrue(line.startswith("\t/* ") or line.startswith("\t   "))

    def test_empty_description_check_is_build_blocks_responsibility(self) -> None:
        # render_comment renders whatever prose it is given; it is
        # build_blocks() that refuses to call it with an empty $description
        # (see BuildBlocksTests.test_missing_description_on_a_commented_key_raises).
        # An empty description here still renders the "name (path): " header
        # with nothing after it, which is why build_blocks must guard first.
        comment = render_comment("status-warning-foreground", "light", "")
        self.assertIn("status-warning-foreground (color.light.status-warning-foreground", comment)


class BuildBlocksTests(unittest.TestCase):
    def test_builds_one_block_per_theme_in_declared_key_order(self) -> None:
        registry = _sample_registry()
        blocks = build_blocks(registry)
        self.assertEqual(set(blocks), {"light", "dark"})
        for theme in ("light", "dark"):
            block = blocks[theme]
            # Declared order is preserved: every status key line appears
            # before every commented key's property line.
            last_status_index = max(block.index(f"--{key}:") for key in STATUS_KEYS)
            first_commented_index = min(block.index(f"--{key}:") for key in COMMENTED_KEYS)
            self.assertLess(last_status_index, first_commented_index)

    def test_missing_description_on_a_commented_key_raises(self) -> None:
        registry = _sample_registry()
        del registry["tokens"]["color"]["light"]["border-strong"]["$description"]
        with self.assertRaises(ValueError):
            build_blocks(registry)

    def test_missing_theme_raises(self) -> None:
        registry = _sample_registry()
        del registry["tokens"]["color"]["dark"]
        with self.assertRaises(ValueError):
            build_blocks(registry)

    def test_missing_status_key_raises(self) -> None:
        registry = _sample_registry()
        del registry["tokens"]["color"]["light"]["status-info"]
        with self.assertRaises(ValueError):
            build_blocks(registry)

    def test_hex_values_are_lowercased_for_css(self) -> None:
        registry = _sample_registry()
        blocks = build_blocks(registry)
        self.assertIn("--status-info: #abcdef;", blocks["light"])
        self.assertIn("--border-strong: #111111;", blocks["light"])


class ApplyToCssTests(unittest.TestCase):
    def test_replaces_both_marker_blocks_and_leaves_surrounding_css_untouched(self) -> None:
        css = _sample_css("\t--status-info: #000000;", "\t--status-info: #000000;")
        blocks = {"light": "\tLIGHT-BODY", "dark": "\tDARK-BODY"}
        result = apply_to_css(css, blocks)
        self.assertIn("\tLIGHT-BODY", result)
        self.assertIn("\tDARK-BODY", result)
        self.assertNotIn("#000000", result)
        self.assertIn("--background: oklch(1 0 0);", result)
        self.assertIn("--background: oklch(0.145 0 0);", result)
        self.assertIn("--density-compact-control: 2rem;", result)

    def test_is_idempotent_on_its_own_output(self) -> None:
        css = _sample_css("\t--status-info: #000000;", "\t--status-info: #000000;")
        blocks = {"light": "\tLIGHT-BODY", "dark": "\tDARK-BODY"}
        once = apply_to_css(css, blocks)
        twice = apply_to_css(once, blocks)
        self.assertEqual(once, twice)

    def test_missing_markers_raises(self) -> None:
        css = "/* no markers here */\n"
        with self.assertRaises(ValueError):
            apply_to_css(css, {"light": "x", "dark": "y"})

    def test_wrong_marker_count_raises(self) -> None:
        css = _sample_css("\t--status-info: #000000;", "\t--status-info: #000000;")
        # Duplicate the light block's markers to simulate a corrupted file.
        css = css.replace(
            "/* END generated design tokens */\n\t--density-compact-control: 2rem;",
            "/* END generated design tokens */\n\t/* BEGIN generated design tokens "
            "(scripts/generate_design_tokens_css.py) */\n\tx\n\t/* END generated design "
            "tokens */\n\t--density-compact-control: 2rem;",
        )
        with self.assertRaises(ValueError):
            apply_to_css(css, {"light": "x", "dark": "y"})


class RepositoryStateTests(unittest.TestCase):
    """The committed globals.css and design-tokens.json must already agree."""

    def test_generator_is_a_no_op_against_the_committed_repository_files(self) -> None:
        from scripts.generate_design_tokens_css import CSS_PATH, REGISTRY_PATH

        registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
        blocks = build_blocks(registry)
        current = CSS_PATH.read_text(encoding="utf-8")
        regenerated = apply_to_css(current, blocks)
        self.assertEqual(
            current,
            regenerated,
            "committed globals.css has drifted from registry/design-tokens.json; "
            "run `python scripts/generate_design_tokens_css.py`",
        )

    def test_every_commented_key_has_a_description_in_both_themes(self) -> None:
        registry = json.loads((ROOT / "registry" / "design-tokens.json").read_text(encoding="utf-8"))
        color = registry["tokens"]["color"]
        for theme in ("light", "dark"):
            for key in COMMENTED_KEYS:
                description = color[theme][key].get("$description")
                self.assertTrue(
                    description and description.strip(),
                    f"tokens.color.{theme}.{key} is missing a non-empty $description",
                )


if __name__ == "__main__":
    unittest.main()
