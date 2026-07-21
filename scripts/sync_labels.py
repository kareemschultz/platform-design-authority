#!/usr/bin/env python3
"""Reconcile GitHub's live labels to the .github/labels.yml source of truth.

Never deletes a label absent from labels.yml: a label attached to open
issues or pull requests is real repository state this file should catch
up to, not silently erase. Use --check for a read-only drift report
(non-zero exit on drift, CI-friendly) and --apply to create or update
labels on GitHub via `gh`.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
LABELS_FILE = ROOT / ".github" / "labels.yml"
DEFAULT_REPO = "kareemschultz/platform-design-authority"


def gh_authenticated() -> bool:
    try:
        result = subprocess.run(
            ["gh", "auth", "status"],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return False
    return result.returncode == 0


def load_desired(path: Path = LABELS_FILE) -> list[dict[str, str]]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected a top-level list of label records")
    return data


def load_live(repo: str) -> dict[str, dict[str, str]]:
    # encoding="utf-8" is required, not decorative: on Windows, text=True
    # alone decodes gh's UTF-8 stdout using the console codepage, which
    # mangles any non-ASCII label description (e.g. an em dash) into
    # mojibake and produces false drift on every --check run.
    result = subprocess.run(
        [
            "gh",
            "label",
            "list",
            "--repo",
            repo,
            "--limit",
            "1000",
            "--json",
            "name,color,description",
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return {item["name"]: item for item in json.loads(result.stdout)}


def diff(
    desired: list[dict[str, str]], live: dict[str, dict[str, str]]
) -> tuple[list[dict[str, str]], list[str]]:
    """Returns (labels to create or update, names live on GitHub but not in
    labels.yml). A label needs sync if it's missing entirely, or its color
    or description differs from the live value."""
    needs_sync: list[dict[str, str]] = []
    for label in desired:
        existing = live.get(label["name"])
        if existing is None:
            needs_sync.append(label)
            continue
        color_matches = existing.get("color", "").lower() == label["color"].lower().lstrip("#")
        description_matches = (existing.get("description") or "") == label.get("description", "")
        if not (color_matches and description_matches):
            needs_sync.append(label)
    unlisted = sorted(set(live) - {label["name"] for label in desired})
    return needs_sync, unlisted


def apply_sync(needs_sync: list[dict[str, str]], repo: str) -> None:
    for label in needs_sync:
        subprocess.run(
            [
                "gh",
                "label",
                "create",
                label["name"],
                "--repo",
                repo,
                "--color",
                label["color"].lstrip("#"),
                "--description",
                label.get("description", ""),
                "--force",
            ],
            check=True,
        )
        print(f"Synced label {label['name']!r}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=DEFAULT_REPO)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--check", action="store_true", help="Report drift without changing GitHub."
    )
    mode.add_argument(
        "--apply", action="store_true", help="Create or update labels on GitHub."
    )
    args = parser.parse_args()

    if not gh_authenticated():
        print(
            "Label sync skipped: gh is not authenticated in this environment.",
        )
        return 0

    desired = load_desired()
    live = load_live(args.repo)
    needs_sync, unlisted = diff(desired, live)

    for name in unlisted:
        print(
            f"WARNING: label {name!r} exists on GitHub but is not listed in "
            f"{LABELS_FILE.relative_to(ROOT)}; add it there or it will keep "
            "being reported.",
            file=sys.stderr,
        )

    if not needs_sync:
        print("Labels are in sync with .github/labels.yml.")
        return 0

    if args.check:
        print("Label drift detected:", file=sys.stderr)
        for label in needs_sync:
            print(f"- {label['name']}", file=sys.stderr)
        return 1

    apply_sync(needs_sync, args.repo)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
