#!/usr/bin/env python3
"""Validate docs/project/PROGRAM_STATUS.md without rewriting it.

The validator checks governed vocabulary and weights, cutoff ancestry,
stage-weighted arithmetic, merged evidence for completed workstreams,
current-work references, and the separation of implementation completion from
production readiness. GitHub state checks run when ``gh`` is authenticated and
degrade to an explicit warning when external verification is unavailable.
"""

import datetime
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
STATUS_FILE = REPO_ROOT / "docs" / "project" / "PROGRAM_STATUS.md"
STANDARD_FILE = REPO_ROOT / "docs" / "project" / "PROGRESS_MEASUREMENT_STANDARD.md"
FIRST_SLICE_TESTS_FILE = REPO_ROOT / "registry" / "first-slice-tests.json"
DEFAULT_REPOSITORY = "kareemschultz/platform-design-authority"
EXPECTED_WORKSTREAMS = tuple(f"WS{index}" for index in range(8))
STALE_QUALIFIERS = ("pending merge gate", "pending merge", "awaiting merge")
LAST_UPDATED_WARN_DAYS = 7
LAST_UPDATED_FAIL_DAYS = 14

errors: list[str] = []
warnings: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def warn(message: str) -> None:
    warnings.append(message)


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def section(text: str, heading: str) -> str:
    match = re.search(
        rf"^## {re.escape(heading)}\s*$([\s\S]*?)(?=^## |\Z)",
        text,
        re.MULTILINE,
    )
    return match.group(1) if match else ""


def parse_status_vocabulary(standard_text: str) -> set[str]:
    body = section(standard_text, "Status vocabulary")
    return set(re.findall(r"^- `([a-z-]+)`\s*$", body, re.MULTILINE))


def parse_standard_weights(standard_text: str) -> dict[str, int]:
    body = section(standard_text, "First-slice implementation percentage")
    return {
        key: int(weight)
        for key, weight in re.findall(
            r"^\|\s*(WS[0-7])\b[^|]*\|\s*(\d+)%\s*\|\s*$",
            body,
            re.MULTILINE,
        )
    }


def check_evidence_cutoff(text: str) -> None:
    line_match = re.search(r"\*\*Evidence cutoff:\*\*.*", text)
    if not line_match:
        fail("Could not find an 'Evidence cutoff' line.")
        return
    line = line_match.group(0)
    if "main" not in line:
        fail("Evidence-cutoff line does not reference `main`.")
        return
    sha_match = re.search(r"`([0-9a-f]{7,40})`", line)
    if not sha_match:
        fail(
            "Evidence-cutoff line does not contain a backtick-quoted commit SHA "
            "(e.g. `main` at ... `<sha>` ...)."
        )
        return
    sha = sha_match.group(1)
    if run_git("cat-file", "-e", f"{sha}^{{commit}}").returncode != 0:
        fail(f"Evidence-cutoff commit {sha} is not present in this checkout's history.")
        return
    if run_git("merge-base", "--is-ancestor", sha, "HEAD").returncode != 0:
        fail(f"Evidence-cutoff commit {sha} is not an ancestor of the evaluated HEAD.")


def check_last_updated_age(text: str, today: datetime.date | None = None) -> None:
    """A status-tracking document that is only re-validated when it changes
    goes blind the moment the world changes instead — an issue closes, a
    board is created — with nothing to notice the document is now stale.
    This check runs on the workflow's own `schedule:` trigger, independent
    of whether PROGRAM_STATUS.md itself was touched, so staleness caused by
    external state is still caught."""
    match = re.search(r"\*\*Last updated:\*\*\s*(\d{4}-\d{2}-\d{2})", text)
    if not match:
        fail("Could not find a 'Last updated: YYYY-MM-DD' line.")
        return
    try:
        last_updated = datetime.date.fromisoformat(match.group(1))
    except ValueError:
        fail(f"'Last updated' date {match.group(1)!r} is not a valid ISO date.")
        return
    today = today or datetime.date.today()
    age_days = (today - last_updated).days
    if age_days > LAST_UPDATED_FAIL_DAYS:
        fail(
            f"PROGRAM_STATUS.md was last updated {age_days} days ago "
            f"({last_updated.isoformat()}), exceeding the "
            f"{LAST_UPDATED_FAIL_DAYS}-day freshness limit."
        )
    elif age_days > LAST_UPDATED_WARN_DAYS:
        warn(
            f"PROGRAM_STATUS.md was last updated {age_days} days ago "
            f"({last_updated.isoformat()}), past the {LAST_UPDATED_WARN_DAYS}-day "
            "freshness guideline."
        )


def parse_workstream_rows(text: str) -> list[dict[str, Any]]:
    pattern = re.compile(
        r"^\|\s*(WS\d[^|]*?)\s*\|\s*(\d+)%\s*\|\s*([a-z-]+)\s*\|\s*(\d+)%\s*\|\s*([\d.]+)%\s*\|\s*(.*?)\s*\|\s*$",
        re.MULTILINE,
    )
    return [
        {
            "key": match.group(1).split()[0],
            "name": match.group(1),
            "weight": int(match.group(2)),
            "status": match.group(3),
            "stage_completion": int(match.group(4)),
            "weighted_contribution": float(match.group(5)),
            "evidence": match.group(6),
        }
        for match in pattern.finditer(text)
    ]


def check_workstream_rows(
    rows: list[dict[str, Any]],
    text: str,
    allowed_statuses: set[str],
    standard_weights: dict[str, int],
) -> None:
    if not rows:
        fail("Found no parseable workstream rows in the First-slice workstreams table.")
        return

    keys = [row["key"] for row in rows]
    if tuple(keys) != EXPECTED_WORKSTREAMS:
        fail(
            "Workstream rows must appear exactly once in WS0-WS7 order; "
            f"found {keys}."
        )
    if set(standard_weights) != set(EXPECTED_WORKSTREAMS):
        fail(
            "PROGRESS_MEASUREMENT_STANDARD.md must define weights for exactly WS0-WS7; "
            f"found {sorted(standard_weights)}."
        )

    total_weight = sum(row["weight"] for row in rows)
    if total_weight != 100:
        fail(f"Workstream weights sum to {total_weight}%, not 100%.")

    total_weighted = 0.0
    for row in rows:
        key = row["key"]
        if key in standard_weights and row["weight"] != standard_weights[key]:
            fail(
                f"{key}: dashboard weight {row['weight']}% does not match the governed "
                f"weight {standard_weights[key]}%."
            )
        if row["status"] not in allowed_statuses:
            fail(
                f"{row['name']}: status '{row['status']}' is not in the vocabulary "
                f"declared by PROGRESS_MEASUREMENT_STANDARD.md ({sorted(allowed_statuses)})."
            )

        expected = round(row["weight"] * row["stage_completion"] / 100, 1)
        if abs(expected - row["weighted_contribution"]) > 0.05:
            fail(
                f"{row['name']}: weighted contribution {row['weighted_contribution']}% "
                f"does not match weight {row['weight']}% * stage completion "
                f"{row['stage_completion']}% (expected {expected}%)."
            )
        total_weighted += row["weighted_contribution"]

        if row["status"] == "complete":
            if not re.search(r"PR\s*#\d+", row["evidence"]):
                fail(
                    f"{row['name']}: marked complete but its evidence column cites no "
                    "explicit PR #N merge evidence."
                )
            lowered = row["evidence"].lower()
            for qualifier in STALE_QUALIFIERS:
                if qualifier in lowered:
                    fail(
                        f"{row['name']}: marked complete but evidence still reads "
                        f"'{qualifier}'."
                    )

        if row["status"] in {"planned", "not-started", "deferred"} and (
            row["stage_completion"] != 0 or row["weighted_contribution"] != 0
        ):
            fail(
                f"{row['name']}: status {row['status']} cannot carry nonzero completion."
            )

    total_match = re.search(
        r"\*\*Total\*\*\s*\|\s*\*\*100%\*\*.*?\*\*([\d.]+)%\*\*",
        text,
    )
    if not total_match:
        fail("Could not find the declared weighted-completion total row.")
        return
    declared_total = float(total_match.group(1))
    if abs(declared_total - total_weighted) > 0.05:
        fail(
            f"Declared total {declared_total}% does not match row contributions "
            f"{round(total_weighted, 1)}%."
        )

    executive_match = re.search(
        r"\|\s*First-slice implementation\s*\|\s*\*\*([\d.]+)%",
        text,
    )
    if not executive_match:
        fail("Could not find the executive first-slice implementation percentage.")
    elif abs(float(executive_match.group(1)) - total_weighted) > 0.05:
        fail("Executive first-slice percentage does not match the workstream total.")


def check_production_readiness(text: str) -> None:
    match = re.search(
        r"\|\s*Production readiness\s*\|\s*\*\*(.*?)\*\*\s*\|(.*?)\|\s*$",
        text,
        re.MULTILINE,
    )
    if not match:
        fail("Could not find the Production readiness row in the Executive view table.")
    elif "not claimed" not in match.group(1).lower():
        fail("Production readiness must explicitly read 'Not claimed'.")


def check_evidence_coverage(text: str, registry: dict[str, Any]) -> None:
    match = re.search(
        r"\|\s*Capability evidence coverage\s*\|\s*\*\*"
        r"(\d+) fully evidenced \+ (\d+) partially evidenced / (\d+) capabilities; "
        r"([\d,]+)/([\d,]+) required cells\*\*",
        text,
    )
    if not match:
        fail("Could not parse the machine-bound Capability evidence coverage row.")
        return
    declared = tuple(int(value.replace(",", "")) for value in match.groups())
    coverage = registry.get("coverage", {})
    generated = (
        int(coverage.get("capabilities_evidenced", -1)),
        int(coverage.get("capabilities_partially_evidenced", -1)),
        int(coverage.get("capabilities_total", -1)),
        int(coverage.get("required_cells_evidenced", -1)),
        int(coverage.get("required_cells_total", -1)),
    )
    if declared != generated:
        fail(
            "Capability evidence coverage row does not match "
            f"registry/first-slice-tests.json: declared={declared}, generated={generated}."
        )


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


def gh_json(endpoint: str) -> dict[str, Any] | None:
    try:
        result = subprocess.run(
            ["gh", "api", endpoint],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return None
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def current_work_references(text: str) -> set[int]:
    current_text = section(text, "Immediate priorities")
    not_complete = re.search(
        r"Not yet complete:\s*([\s\S]*?)(?=^## )",
        text,
        re.MULTILINE,
    )
    if not_complete:
        current_text += not_complete.group(1)
    return {int(number) for number in re.findall(r"#(\d+)\b", current_text)}


def check_github_state(text: str, rows: list[dict[str, Any]]) -> None:
    references = sorted({int(number) for number in re.findall(r"#(\d+)\b", text)})
    if not references:
        return
    if not gh_authenticated():
        warn(
            f"Skipped GitHub state verification for {len(references)} references because "
            "gh is not authenticated."
        )
        return

    repository = os.environ.get("GITHUB_REPOSITORY", DEFAULT_REPOSITORY)
    issue_cache: dict[int, dict[str, Any]] = {}
    for number in references:
        item = gh_json(f"repos/{repository}/issues/{number}")
        if item is None:
            fail(f"Referenced #{number} does not resolve in {repository}.")
        else:
            issue_cache[number] = item

    for row in rows:
        if row["status"] != "complete":
            continue
        pr_numbers = {int(number) for number in re.findall(r"PR\s*#(\d+)\b", row["evidence"])}
        if not pr_numbers:
            continue
        if not any(
            (pull := gh_json(f"repos/{repository}/pulls/{number}")) is not None
            and pull.get("merged_at")
            for number in pr_numbers
        ):
            fail(
                f"{row['name']}: no cited PR is verified merged in {repository}: "
                f"{sorted(pr_numbers)}."
            )

    for number in sorted(current_work_references(text)):
        item = issue_cache.get(number)
        if item is not None and item.get("state") == "closed":
            fail(
                f"Current-work section references closed #{number}; update or remove the stale item."
            )


def print_result() -> int:
    for message in warnings:
        print(f"WARNING: {message}")
    for message in errors:
        print(f"ERROR: {message}")
    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s).")
        return 1
    print(f"OK — 0 errors, {len(warnings)} warning(s).")
    return 0


def main() -> int:
    errors.clear()
    warnings.clear()
    if not STATUS_FILE.exists():
        fail(f"{STATUS_FILE} does not exist.")
        return print_result()
    if not STANDARD_FILE.exists():
        fail(f"{STANDARD_FILE} does not exist.")
        return print_result()
    if not FIRST_SLICE_TESTS_FILE.exists():
        fail(f"{FIRST_SLICE_TESTS_FILE} does not exist.")
        return print_result()

    text = STATUS_FILE.read_text(encoding="utf-8")
    standard_text = STANDARD_FILE.read_text(encoding="utf-8")
    allowed_statuses = parse_status_vocabulary(standard_text)
    standard_weights = parse_standard_weights(standard_text)
    if not allowed_statuses:
        fail("Could not parse the governed status vocabulary.")

    check_evidence_cutoff(text)
    check_last_updated_age(text)
    rows = parse_workstream_rows(text)
    check_workstream_rows(rows, text, allowed_statuses, standard_weights)
    check_evidence_coverage(
        text,
        json.loads(FIRST_SLICE_TESTS_FILE.read_text(encoding="utf-8")),
    )
    check_production_readiness(text)
    check_github_state(text, rows)
    return print_result()


if __name__ == "__main__":
    sys.exit(main())
