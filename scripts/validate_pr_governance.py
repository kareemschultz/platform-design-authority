#!/usr/bin/env python3
"""Validate the governed pull-request documentation and release dispositions."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DOCUMENTATION_PATHS = (
    ".github/PULL_REQUEST_TEMPLATE.md",
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "apps/docs/",
    "docs/",
    "openapi/",
    "registry/",
    "schemas/",
)
DISPOSITION_OPTIONS = {
    "Documentation impact disposition": (
        "Updated in this PR",
        "No documentation impact",
        "Blocking documentation issue",
    ),
    "Changeset and release impact disposition": (
        "Changeset included",
        "No Changeset required",
        "Blocking Changeset issue",
    ),
}
PLACEHOLDER_EVIDENCE = {"", "#", "n/a", "na", "none", "todo", "tbd"}


def section(body: str, title: str) -> str | None:
    pattern = re.compile(rf"^##\s+{re.escape(title)}\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(body)
    if not match:
        return None
    next_heading = re.search(r"^##\s+", body[match.end() :], re.MULTILINE)
    end = match.end() + next_heading.start() if next_heading else len(body)
    return body[match.end() : end]


def selected_option(content: str, options: tuple[str, ...]) -> tuple[str | None, list[str]]:
    selected: list[str] = []
    errors: list[str] = []
    for option in options:
        matches = re.findall(
            rf"^- \[([ xX])\]\s+{re.escape(option)}(?:\s|$)",
            content,
            re.MULTILINE,
        )
        if len(matches) != 1:
            errors.append(f"option {option!r} must appear exactly once")
        elif matches[0].lower() == "x":
            selected.append(option)
    if len(selected) != 1:
        errors.append("exactly one disposition option must be checked")
        return None, errors
    return selected[0], errors


def evidence_value(content: str) -> str | None:
    match = re.search(r"^Evidence:\s*(.+?)\s*$", content, re.MULTILINE)
    return match.group(1).strip() if match else None


def validate_pr_body(
    body: str,
    changed_paths: list[str],
    head_sha: str | None = None,
) -> list[str]:
    errors: list[str] = []
    selections: dict[str, str] = {}
    evidences: dict[str, str] = {}

    for title, options in DISPOSITION_OPTIONS.items():
        content = section(body, title)
        if content is None:
            errors.append(f"PR body is missing required section {title!r}")
            continue
        selection, selection_errors = selected_option(content, options)
        errors.extend(f"{title}: {message}" for message in selection_errors)
        if selection:
            selections[title] = selection
        evidence = evidence_value(content)
        if evidence is None or evidence.casefold() in PLACEHOLDER_EVIDENCE:
            errors.append(f"{title}: Evidence must name paths, a rationale, or a blocking issue")
        else:
            evidences[title] = evidence

    documentation_selection = selections.get("Documentation impact disposition")
    if documentation_selection == "Updated in this PR" and not any(
        path == prefix or path.startswith(prefix) for path in changed_paths for prefix in DOCUMENTATION_PATHS
    ):
        errors.append("Documentation impact disposition: no governed documentation path changed")
    if documentation_selection == "Blocking documentation issue" and not re.search(
        r"#\d+", evidences.get("Documentation impact disposition", "")
    ):
        errors.append("Documentation impact disposition: blocking disposition requires an issue number")

    changeset_selection = selections.get("Changeset and release impact disposition")
    changeset_paths = [
        path
        for path in changed_paths
        if path.startswith(".changeset/") and path.endswith(".md") and path != ".changeset/README.md"
    ]
    if changeset_selection == "Changeset included" and not changeset_paths:
        errors.append("Changeset and release impact disposition: no Changeset file changed")
    if changeset_selection == "Blocking Changeset issue" and not re.search(
        r"#\d+", evidences.get("Changeset and release impact disposition", "")
    ):
        errors.append("Changeset and release impact disposition: blocking disposition requires an issue number")

    lifecycle = section(body, "Lifecycle statement")
    if lifecycle is None:
        errors.append("PR body is missing required section 'Lifecycle statement'")
    else:
        visible = re.sub(r"<!--.*?-->", "", lifecycle, flags=re.DOTALL).strip()
        if not visible or visible.casefold() in PLACEHOLDER_EVIDENCE:
            errors.append("Lifecycle statement must state the exact claimed lifecycle")

    unsupported = section(body, "No unsupported production-readiness claim")
    if unsupported is None:
        errors.append("PR body is missing required section 'No unsupported production-readiness claim'")
    elif not re.search(r"^- \[[xX]\].*does not claim", unsupported, re.MULTILINE | re.IGNORECASE):
        errors.append("No unsupported production-readiness claim acknowledgement must be checked")

    if head_sha:
        for claimed in re.findall(r"^\s*-?\s*PR head:\s*`([0-9a-f]{7,40})`", body, re.MULTILINE):
            if not head_sha.startswith(claimed) and not claimed.startswith(head_sha):
                errors.append(f"PR body pins stale PR head {claimed}; event head is {head_sha}")
    return errors


def changed_paths_for_event(event: dict[str, Any], root: Path) -> list[str]:
    pull_request = event.get("pull_request")
    if not isinstance(pull_request, dict):
        return []
    base = pull_request.get("base", {}).get("sha")
    head = pull_request.get("head", {}).get("sha")
    if not isinstance(base, str) or not isinstance(head, str):
        raise ValueError("pull_request event is missing base/head SHA")
    completed = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...{head}"],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


def validate_event(event: dict[str, Any], changed_paths: list[str]) -> list[str]:
    pull_request = event.get("pull_request")
    if not isinstance(pull_request, dict):
        return []
    body = pull_request.get("body")
    head_sha = pull_request.get("head", {}).get("sha")
    if not isinstance(body, str):
        return ["pull request body is missing"]
    return validate_pr_body(body, changed_paths, head_sha if isinstance(head_sha, str) else None)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event-path", type=Path, required=True)
    args = parser.parse_args()
    event = json.loads(args.event_path.read_text(encoding="utf-8"))
    if not isinstance(event.get("pull_request"), dict):
        print("Pull-request governance validation skipped for non-PR event.")
        return 0
    try:
        changed_paths = changed_paths_for_event(event, ROOT)
    except (subprocess.CalledProcessError, ValueError) as exc:
        print(f"Pull-request governance validation failed: {exc}", file=sys.stderr)
        return 1
    errors = validate_event(event, changed_paths)
    if errors:
        print("Pull-request governance validation failed:", file=sys.stderr)
        for error in sorted(set(errors)):
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Pull-request governance validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
