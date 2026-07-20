#!/usr/bin/env python3
"""Report remote branches that are fully merged, dead-ended, or abandoned.

A dead branch with a deleted upstream produced several audit findings this
session that evaporated on re-verification against `origin/main` (see the
2026-07-20 Engineering Notebook entry) -- and `gh pr merge --auto
--delete-branch` was independently found not to reliably delete the head
branch when the merge is deferred to GitHub's own automerge queue. Both are
the same underlying failure mode: a remote branch outlives its purpose and
nothing notices. This script reports, on the Phase 3 schedule, rather than
deletes -- branch deletion stays a reviewed action.

Every remote branch is classified into exactly one bucket:

- fully_merged: its tip is an ancestor of origin/main. Safe to delete.
- closed_unmerged: it has a closed (not merged) pull request. A dead end;
  worth a look before deleting.
- stale_no_pr: no pull request references it and its last commit is older
  than the configured age threshold. Likely abandoned.
- active: none of the above -- an open PR, or a recent branch with no PR
  yet. Not reported.

`EXCLUDED_BRANCHES` is a manually maintained allowlist for branches this
report must never flag even if they otherwise match a bucket above --
long-lived non-default work (e.g. FDR-012's WS3 controlled-prototype
branch) that is deliberately not merged to main yet.
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPO = "kareemschultz/platform-design-authority"
DEFAULT_BASE = "main"
STALE_NO_PR_DAYS = 30

# Branches this report must never flag, regardless of merge/PR state.
# Update this alongside the plan's own worktree-sweep cautions.
EXCLUDED_BRANCHES = frozenset(
    {
        "main",
        "claude/ws3-integration",
        "claude/ws3-entry-authorization",
    }
)


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )


def gh_authenticated() -> bool:
    try:
        result = subprocess.run(
            ["gh", "auth", "status"], capture_output=True, text=True, check=False
        )
    except FileNotFoundError:
        return False
    return result.returncode == 0


def remote_branches(remote: str = "origin") -> list[str]:
    result = run_git(
        "for-each-ref", f"refs/remotes/{remote}", "--format=%(refname:short)"
    )
    prefix = f"{remote}/"
    names = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line or line == f"{remote}/HEAD":
            continue
        names.append(line.removeprefix(prefix))
    return names


def is_fully_merged(branch: str, remote: str, base: str) -> bool:
    return (
        run_git(
            "merge-base", "--is-ancestor", f"{remote}/{branch}", f"{remote}/{base}"
        ).returncode
        == 0
    )


def last_commit_age_days(branch: str, remote: str, today: datetime.date) -> int | None:
    result = run_git(
        "log", "-1", "--format=%ct", f"{remote}/{branch}"
    )
    if result.returncode != 0 or not result.stdout.strip():
        return None
    committed = datetime.datetime.fromtimestamp(
        int(result.stdout.strip()), tz=datetime.timezone.utc
    ).date()
    return (today - committed).days


def pr_state_for_branch(branch: str, repo: str) -> dict | None:
    result = subprocess.run(
        [
            "gh",
            "pr",
            "list",
            "--repo",
            repo,
            "--state",
            "all",
            "--head",
            branch,
            "--json",
            "number,state,mergedAt",
            "--limit",
            "1",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    if result.returncode != 0:
        return None
    items = json.loads(result.stdout or "[]")
    return items[0] if items else None


def classify(
    branch: str,
    remote: str,
    base: str,
    repo: str,
    today: datetime.date,
) -> tuple[str, str] | None:
    """Returns (bucket, reason), or None if the branch is active and should
    not be reported.

    A merged pull request is checked before ancestry: a squash or rebase
    merge (this repository's norm) creates a new commit on the base branch
    whose tree matches the PR's diff but whose commit lineage does NOT
    include the source branch's commits, so `merge-base --is-ancestor`
    returns false for a genuinely, completely merged branch. The ancestor
    check remains as a fallback for branches merged some other way (a plain
    merge commit, or fast-forward) where no PR record exists to check."""
    pr = pr_state_for_branch(branch, repo)
    if pr is not None and pr.get("mergedAt"):
        return "fully_merged", f"PR #{pr['number']} merged"

    if is_fully_merged(branch, remote, base):
        return "fully_merged", f"tip is an ancestor of {remote}/{base}"

    if pr is not None and pr["state"] == "CLOSED" and not pr.get("mergedAt"):
        return "closed_unmerged", f"PR #{pr['number']} was closed without merging"

    if pr is None:
        age = last_commit_age_days(branch, remote, today)
        if age is not None and age > STALE_NO_PR_DAYS:
            return "stale_no_pr", f"no pull request references it; last commit {age} days ago"

    return None


def build_report(
    repo: str = DEFAULT_REPO,
    remote: str = "origin",
    base: str = DEFAULT_BASE,
    today: datetime.date | None = None,
) -> dict[str, list[tuple[str, str]]]:
    today = today or datetime.date.today()
    buckets: dict[str, list[tuple[str, str]]] = {
        "fully_merged": [],
        "closed_unmerged": [],
        "stale_no_pr": [],
    }
    for branch in sorted(remote_branches(remote)):
        if branch in EXCLUDED_BRANCHES:
            continue
        result = classify(branch, remote, base, repo, today)
        if result is not None:
            bucket, reason = result
            buckets[bucket].append((branch, reason))
    return buckets


def format_report(buckets: dict[str, list[tuple[str, str]]]) -> str:
    labels = {
        "fully_merged": "Fully merged (safe to delete)",
        "closed_unmerged": "Closed without merging (dead end)",
        "stale_no_pr": f"No pull request, stale >{STALE_NO_PR_DAYS} days (likely abandoned)",
    }
    lines: list[str] = []
    for bucket, label in labels.items():
        entries = buckets[bucket]
        if not entries:
            continue
        lines.append(f"## {label}")
        for branch, reason in entries:
            lines.append(f"- `{branch}` -- {reason}")
        lines.append("")
    return "\n".join(lines).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=DEFAULT_REPO)
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--base", default=DEFAULT_BASE)
    args = parser.parse_args()

    if not gh_authenticated():
        print("Stale-branch report skipped: gh is not authenticated in this environment.")
        return 0

    buckets = build_report(args.repo, args.remote, args.base)
    total = sum(len(entries) for entries in buckets.values())
    if total == 0:
        print("No fully merged, closed-unmerged, or stale-with-no-PR branches found.")
        return 0

    print(format_report(buckets))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
