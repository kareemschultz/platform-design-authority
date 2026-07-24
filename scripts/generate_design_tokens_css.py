#!/usr/bin/env python3
"""Generate the registry-backed design-token CSS custom properties in
packages/ui-web/core/src/styles/globals.css.

Mirrors the determinism and ``--check`` semantics of
``scripts/generate_registries.py``: the registry is the single source of
truth for the properties this script owns, and CI fails if the generated
block drifts from it (RR-004 / TD-004, PDA-UX-023).

Scope is deliberately narrow. This generator owns ONLY the CSS custom
properties that already have a direct 1:1 name-and-value mapping to
``registry/design-tokens.json``'s ``tokens.color.light.*`` /
``tokens.color.dark.*`` entries: the six ``--status-*`` roles plus
``--border-strong`` and ``--border-strong-overlay``. It deliberately does
NOT touch:

- The "non-status semantic aliases" block (``--action-primary``,
  ``--surface-canvas``, ``--surface-panel``, ``--text-default``,
  ``--text-muted``, ``--focus-ring``, and their `-foreground` /
  `-hover` companions). These deliberately resolve to the governed shadcn
  preset values, NOT the registry, per the fifth-audit F-H-003
  controlled-prototype exception recorded in
  ``docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`` and
  enforced by ``scripts/validate_docs.py``'s
  ``validate_design_token_alias_exceptions()``. A generator that
  overwrote that block with registry values would silently revert a
  deliberate, reviewed divergence -- this script never reads or writes
  anything between the ``BEGIN/END non-status semantic aliases``
  markers.
- Density control tokens (``--density-*``), the ``@theme inline`` block's
  Tailwind ``--color-*`` re-exports, and any other hand-authored CSS.
- The registry's ``space``, ``radius``, ``motion``, ``screen``, and
  ``size`` groups, which have no CSS custom-property representation yet.
  Because of this, and because the alias exception above is permanent by
  design, this generator closes TD-004 (status-token literals) but only
  partially addresses RR-004 (the registry is not yet "the single styling
  source in code" end to end) -- see the risk register for the recorded,
  scope-bounded closure.

Contrast-rationale comments are rendered from each token's registry
``$description`` field and re-wrapped deterministically by this script.
They are NOT required to reproduce globals.css's pre-generator historical
line-wrapping byte-for-byte -- only the ``--check`` mode's requirement
that regeneration be idempotent, and (checked separately in this
repository's PR record, not by this script) that every hand-verified
contrast ratio and hex value survives unchanged. A token in
``COMMENTED_KEYS`` without a populated ``$description`` fails generation
outright rather than silently emitting no rationale, so contrast
reasoning can never be silently dropped by a future registry edit.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import textwrap
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "registry" / "design-tokens.json"
CSS_PATH = ROOT / "packages" / "ui-web" / "core" / "src" / "styles" / "globals.css"

BEGIN_MARKER = "/* BEGIN generated design tokens (scripts/generate_design_tokens_css.py) */"
END_MARKER = "/* END generated design tokens */"

# Explicit, ordered list of registry/design-tokens.json `color.<theme>.*`
# keys with a direct 1:1 CSS custom-property mapping. Order matches the
# pre-generator globals.css layout so the first regeneration only changes
# comment wrapping, never property order or values. This is NOT "every
# color key in the registry" -- see the module docstring for what is
# deliberately excluded and why.
STATUS_KEYS: list[str] = [
    "status-info",
    "status-success",
    "status-warning",
    "status-critical",
    "status-pending",
    "status-offline",
]
COMMENTED_KEYS: list[str] = ["border-strong", "border-strong-overlay", "status-warning-foreground"]
THEMES: list[str] = ["light", "dark"]

WRAP_WIDTH = 68


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def render_comment(css_name: str, theme: str, description: str) -> str:
    """Render a tab-indented, word-wrapped CSS block comment sourced from a
    registry token's $description. Continuation lines line up with the
    first line because "/* " and "   " are both three characters wide."""
    prefix = f"{css_name} (color.{theme}.{css_name}, registry/design-tokens.json): "
    wrapped = textwrap.wrap(
        prefix + description,
        width=WRAP_WIDTH,
        break_long_words=False,
        break_on_hyphens=False,
    )
    if not wrapped:
        raise ValueError(f"empty rendered comment for color.{theme}.{css_name}")
    lines: list[str] = []
    last_index = len(wrapped) - 1
    for index, line in enumerate(wrapped):
        marker = "/* " if index == 0 else "   "
        suffix = " */" if index == last_index else ""
        lines.append(f"\t{marker}{line}{suffix}")
    return "\n".join(lines)


def render_theme_block(theme_tokens: dict[str, Any], theme: str) -> str:
    lines: list[str] = [
        f"\t/* Status roles from registry/design-tokens.json (color.{theme}.status-*) */"
    ]
    for key in STATUS_KEYS:
        token = theme_tokens.get(key)
        if not isinstance(token, dict) or "$value" not in token:
            raise ValueError(f"registry/design-tokens.json is missing tokens.color.{theme}.{key}")
        value = str(token["$value"]).lower()
        lines.append(f"\t--{key}: {value};")
    for key in COMMENTED_KEYS:
        token = theme_tokens.get(key)
        if not isinstance(token, dict) or "$value" not in token:
            raise ValueError(f"registry/design-tokens.json is missing tokens.color.{theme}.{key}")
        description = token.get("$description")
        if not description or not str(description).strip():
            raise ValueError(
                f"registry/design-tokens.json tokens.color.{theme}.{key} has no $description; "
                "this generator requires one for every commented key so contrast rationale is "
                "never silently dropped from globals.css"
            )
        value = str(token["$value"]).lower()
        lines.append(render_comment(key, theme, str(description).strip()))
        lines.append(f"\t--{key}: {value};")
    return "\n".join(lines)


def build_blocks(registry: dict[str, Any]) -> dict[str, str]:
    color = registry.get("tokens", {}).get("color", {})
    blocks: dict[str, str] = {}
    for theme in THEMES:
        theme_tokens = color.get(theme)
        if not isinstance(theme_tokens, dict):
            raise ValueError(f"registry/design-tokens.json is missing tokens.color.{theme}")
        blocks[theme] = render_theme_block(theme_tokens, theme)
    return blocks


BLOCK_PATTERN = re.compile(
    re.escape("\t" + BEGIN_MARKER) + r"\n(.*?)\n" + re.escape("\t" + END_MARKER),
    re.DOTALL,
)


def apply_to_css(css_text: str, blocks: dict[str, str]) -> str:
    matches = list(BLOCK_PATTERN.finditer(css_text))
    if len(matches) != len(THEMES):
        raise ValueError(
            f"expected exactly {len(THEMES)} generated-design-token blocks "
            f"(one per theme: {', '.join(THEMES)}) in {CSS_PATH.relative_to(ROOT)}, "
            f"found {len(matches)} -- has the BEGIN/END marker pair been removed or duplicated?"
        )
    pieces: list[str] = []
    cursor = 0
    for match, theme in zip(matches, THEMES):
        pieces.append(css_text[cursor : match.start(1)])
        pieces.append(blocks[theme])
        cursor = match.end(1)
    pieces.append(css_text[cursor:])
    return "".join(pieces)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the file would change.")
    args = parser.parse_args()

    try:
        registry = load_json(REGISTRY_PATH)
        blocks = build_blocks(registry)
        current = CSS_PATH.read_text(encoding="utf-8")
        updated = apply_to_css(current, blocks)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"design-token CSS generation failed: {exc}", file=sys.stderr)
        return 1

    rel = CSS_PATH.relative_to(ROOT).as_posix()
    if current == updated:
        print(f"generated design tokens in {rel} are current.")
        return 0
    if args.check:
        print(f"stale generated design tokens in {rel}; run scripts/generate_design_tokens_css.py", file=sys.stderr)
        return 1
    CSS_PATH.write_text(updated, encoding="utf-8", newline="\n")
    print(f"wrote {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
