#!/usr/bin/env python3
"""Validate docs/project/PROGRAM_STATUS.md for internal consistency and staleness.

This is a validation-only check: it never rewrites PROGRAM_STATUS.md. It fails
(non-zero exit) on a hard inconsistency and prints warnings for checks that
could not be completed (e.g. no network/`gh` auth available).

Checks:
1. The evidence-cutoff commit SHA is a real ancestor of the current checkout.
2. Every workstream Status value uses PROGRESS_MEASUREMENT_STANDARD.md's
   status vocabulary.
3. A workstream marked `complete` cites at least one merged PR/issue reference
   and contains no leftover "pending" qualifier (the exact defect this script
   was written to catch: a PR9 row that stayed "complete pending merge gate"
   after the PR had actually merged).
4. A workstream marked `planned` shows 0% stage completion and 0% weighted
   contribution.
5. The declared weights sum to 100% and the sum of weighted contributions
   matches each row's weight * stage completion, and matches the declared
   total / first-slice-implementation percentage.
6. The production-readiness row never claims readiness; it must read as
   explicitly not-claimed regardless of the implementation percentage.
7. Every `#NNN` issue/PR reference in the document resolves to a real GitHub
   issue or PR, when `gh` is authenticated. Skipped (warning only) otherwise.
"""

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STATUS_FILE = REPO_ROOT / "docs" / "project" / "PROGRAM_STATUS.md"
STANDARD_FILE = REPO_ROOT / "docs" / "project" / "PROGRESS_MEASUREMENT_STANDARD.md"

ALLOWED_STATUSES = {
    "not-started",
    "planned",
    "in-progress",
    "evidence-pending",
    "complete",
    "blocked",
    "deferred",
}

STALE_QUALIFIERS = ("pending merge gate", "pending merge", "awaiting merge")

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def run_git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=REPO_ROOT, capture_output=True, text=True, check=False
    )


def check_evidence_cutoff(text: str) -> None:
    match = re.search(r"\*\*Evidence cutoff:\*\*\s*`main` at `([0-9a-f]{7,40})`", text)
    if not match:
        fail("Could not find a parseable '**Evidence cutoff:** `main` at `<sha>`' line.")
        return
    sha = match.group(1)
    result = run_git("cat-file", "-e", f"{sha}^{{commit}}")
    if result.returncode != 0:
        fail(f"Evidence-cutoff commit {sha} is not present in this checkout's history.")
        return
    merge_base = run_git("merge-base", "--is-ancestor", sha, "HEAD")
    if merge_base.returncode != 0:
        warn(
            f"Evidence-cutoff commit {sha} exists but is not an ancestor of HEAD in "
            "this checkout (may be a shallow clone, or main has diverged)."
        )


def parse_workstream_rows(text: str) -> list[dict]:
    # | WS0 — Scaffold alignment and contracts | 8% | complete | 100% | 8.0% | ... |
    pattern = re.compile(
        r"^\|\s*(WS\d[^|]*?)\s*\|\s*(\d+)%\s*\|\s*([a-z-]+)\s*\|\s*(\d+)%\s*\|\s*([\d.]+)%\s*\|\s*(.*?)\s*\|\s*$",
        re.MULTILINE,
    )
    rows = []
    for m in pattern.finditer(text):
        rows.append(
            {
                "name": m.group(1),
                "weight": int(m.group(2)),
                "status": m.group(3),
                "stage_completion": int(m.group(4)),
                "weighted_contribution": float(m.group(5)),
                "evidence": m.group(6),
            }
        )
    return rows


def check_workstream_rows(rows: list[dict], text: str) -> None:
    if not rows:
        fail("Found no parseable workstream rows in the First-slice workstreams table.")
        return

    total_weight = sum(r["weight"] for r in rows)
    if total_weight != 100:
        fail(f"Workstream weights sum to {total_weight}%, not 100%.")

    total_weighted = 0.0
    for r in rows:
        if r["status"] not in ALLOWED_STATUSES:
            fail(
                f"{r['name']}: status '{r['status']}' is not in the allowed vocabulary "
                f"({sorted(ALLOWED_STATUSES)}); see PROGRESS_MEASUREMENT_STANDARD.md."
            )

        expected = round(r["weight"] * r["stage_completion"] / 100, 1)
        if abs(expected - r["weighted_contribution"]) > 0.05:
            fail(
                f"{r['name']}: weighted contribution {r['weighted_contribution']}% does not "
                f"match weight {r['weight']}% * stage completion {r['stage_completion']}% "
                f"(expected {expected}%)."
            )
        total_weighted += r["weighted_contribution"]

        if r["status"] == "complete":
            if not re.search(r"(PR\s*#\d+|Issue\s*#\d+|PDA-[A-Z]+-\d+)", r["evidence"]):
                fail(
                    f"{r['name']}: marked complete but its evidence column cites no "
                    "merged PR/issue/document reference."
                )
            lowered = r["evidence"].lower()
            for qualifier in STALE_QUALIFIERS:
                if qualifier in lowered:
                    fail(
                        f"{r['name']}: marked complete but evidence still reads "
                        f"'{qualifier}' — this is the exact staleness pattern this "
                        "check exists to catch."
                    )

        if r["status"] == "planned":
            if r["stage_completion"] != 0 or r["weighted_contribution"] != 0:
                fail(
                    f"{r['name']}: marked planned but shows nonzero stage completion "
                    f"({r['stage_completion']}%) or weighted contribution "
                    f"({r['weighted_contribution']}%). Future/unstarted work must not "
                    "be counted complete."
                )

    total_row = re.search(
        r"\*\*Total\*\*\s*\|\s*\*\*100%\*\*.*?\*\*([\d.]+)%\*\*", text
    )
    if total_row:
        declared_total = float(total_row.group(1))
        if abs(declared_total - total_weighted) > 0.05:
            fail(
                f"Declared total weighted completion {declared_total}% does not match "
                f"the sum of row contributions {round(total_weighted, 1)}%."
            )
    else:
        warn("Could not find a parseable '**Total** | **100%** | ... | **N%**' row to cross-check.")


def check_production_readiness(text: str) -> None:
    match = re.search(
        r"\|\s*Production readiness\s*\|\s*\*\*(.*?)\*\*\s*\|(.*?)\|\s*$",
        text,
        re.MULTILINE,
    )
    if not match:
        fail("Could not find the Production readiness row in the Executive view table.")
        return
    result_cell = match.group(1).lower()
    if "not claimed" not in result_cell:
        fail(
            "Production readiness row must explicitly read 'Not claimed' — it must "
            "never be inferred from implementation completion percentage."
        )


def check_issue_pr_references(text: str) -> None:
    refs = sorted({int(n) for n in re.findall(r"#(\d+)\b", text)})
    if not refs:
        return

    auth_check = subprocess.run(
        ["gh", "auth", "status"], capture_output=True, text=True, check=False
    )
    if auth_check.returncode != 0:
        warn(
            f"Skipping existence check for {len(refs)} referenced issue/PR numbers "
            "(gh CLI not authenticated in this environment)."
        )
        return

    for n in refs:
        result = subprocess.run(
            ["gh", "api", f"repos/kareemschultz/platform-design-authority/issues/{n}"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            fail(f"Referenced #{n} does not resolve to an existing GitHub issue or PR.")


def main() -> int:
    if not STATUS_FILE.exists():
        fail(f"{STATUS_FILE} does not exist.")
        print_and_exit()
        return 1
    if not STANDARD_FILE.exists():
        warn(f"{STANDARD_FILE} does not exist; status-vocabulary check uses a hardcoded copy.")

    text = STATUS_FILE.read_text(encoding="utf-8")

    check_evidence_cutoff(text)
    rows = parse_workstream_rows(text)
    check_workstream_rows(rows, text)
    check_production_readiness(text)
    check_issue_pr_references(text)

    return print_and_exit()


def print_and_exit() -> int:
    for w in warnings:
        print(f"WARNING: {w}")
    for e in errors:
        print(f"ERROR: {e}")
    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s).")
        return 1
    print(f"OK — 0 errors, {len(warnings)} warning(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
