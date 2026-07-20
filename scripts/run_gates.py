"""Run the continuous-integration gate set locally.

Continuous integration runs more than twenty separate validators and test
suites across three workflows. Reconstructing that list by hand before opening
a pull request is error-prone: a contributor who runs `validate_docs.py` and
sees it pass can still be several red gates away from a mergeable branch,
because the document-index, product-documentation, capability-readiness,
operational-readiness, document-class, ratification-wave, and research
registration validators are all separate commands.

This runner executes that set in one command and prints a pass/fail table.
`scripts/test_run_gates.py` asserts that the declared set stays in step with
the workflow files, so the runner cannot silently drift out of date.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Gates that continuous integration runs but that this runner deliberately does
# not, mapped to the reason. `test_run_gates.py` requires every workflow command
# to be either declared as a gate below or listed here, so skipping is always a
# recorded decision rather than an oversight.
NOT_RUN_LOCALLY: dict[str, str] = {
    "bun run build": (
        "requires a fully populated environment; fails on a bare checkout with "
        "'Invalid environment variables' rather than on any real defect"
    ),
    "bun run db:generate": "requires a running PostgreSQL instance",
    "bun run db:migrate": "requires a running PostgreSQL instance",
    "bun run db:test": "requires a running PostgreSQL instance",
    "bun run db:test:node": "requires a running PostgreSQL instance",
    "bun run test:node": "requires the worker container",
    "bun run e2e:seed": "requires the seeded Docker stack",
    "bun run --cwd apps/web test:e2e": "requires the running Docker stack",
    "bun run --cwd apps/web test:e2e:install": "downloads Playwright browsers; infrastructure setup",
    "python scripts/validate_pr_governance.py": (
        "validates a GitHub pull-request event payload, which only exists in CI"
    ),
}


@dataclass
class Gate:
    """One command, with the group it belongs to."""

    name: str
    command: list[str]
    group: str
    needs_docker: bool = False


@dataclass
class Result:
    gate: Gate
    passed: bool
    seconds: float
    output: str = field(default="", repr=False)


def _python(script: str) -> list[str]:
    return [sys.executable, f"scripts/{script}"]


def _unittest(script: str) -> list[str]:
    return [sys.executable, "-m", "unittest", f"scripts/{script}"]


def build_gates() -> list[Gate]:
    """Declare the gate set, grouped by what a contributor is likely changing."""

    gates: list[Gate] = []

    # Governed documentation: front matter, indexes, classes, product docs.
    for script in (
        "validate_docs.py",
        "validate_document_indexes.py",
        "validate_document_classes.py",
        "validate_product_docs.py",
        "validate_codename_boundary.py",
        "check_public_disclosure.py",
        "validate_research_registration.py",
        "validate_capability_readiness.py",
        "validate_ratification_waves.py",
        "validate_operational_readiness.py",
    ):
        gates.append(Gate(script, _python(script), "docs"))

    for script in (
        "test_validate_document_indexes.py",
        "test_validate_document_classes.py",
        "test_validate_product_docs.py",
        "test_validate_codename_boundary.py",
        "test_check_public_disclosure.py",
        "test_validate_research_registration.py",
        "test_validate_capability_readiness.py",
        "test_validate_ratification_waves.py",
        "test_validate_operational_readiness.py",
    ):
        gates.append(Gate(script, _unittest(script), "docs-tests"))

    # Generated artefacts must be regenerable without drift.
    gates.append(
        Gate(
            "generate_registries.py --check",
            [*_python("generate_registries.py"), "--check"],
            "generated",
        )
    )
    gates.append(
        Gate(
            "generate_contracts.py --check",
            [*_python("generate_contracts.py"), "--check"],
            "generated",
        )
    )
    gates.append(
        Gate(
            "generate_api_reference.py --check",
            [*_python("generate_api_reference.py"), "--check"],
            "generated",
        )
    )
    gates.append(
        Gate("bun run third-party:check", ["bun", "run", "third-party:check"], "generated")
    )
    gates.append(
        Gate("bun run third-party:test", ["bun", "run", "third-party:test"], "generated")
    )
    for script in (
        "test_generate_registries.py",
        "test_generate_api_reference.py",
    ):
        gates.append(Gate(script, _unittest(script), "generated"))

    # Architecture boundaries and workstream evidence. These are invoked through
    # their package.json aliases so the runner exercises the same entry points as
    # continuous integration rather than a parallel spelling of them.
    gates.append(Gate("bun run architecture:check", ["bun", "run", "architecture:check"], "architecture"))
    gates.append(
        Gate(
            "test_architecture_checker.py",
            [sys.executable, "scripts/test_architecture_checker.py"],
            "architecture",
        )
    )
    gates.append(Gate("bun run ws1:evidence:check", ["bun", "run", "ws1:evidence:check"], "evidence"))
    gates.append(Gate("bun run ws2:evidence:check", ["bun", "run", "ws2:evidence:check"], "evidence"))

    # Program status tracking.
    gates.append(
        Gate("validate_program_status.py", _python("validate_program_status.py"), "status")
    )
    gates.append(
        Gate(
            "test_validate_program_status.py",
            _unittest("test_validate_program_status.py"),
            "status",
        )
    )
    gates.append(
        Gate("test_validate_pr_governance.py", _unittest("test_validate_pr_governance.py"), "status")
    )

    # This runner's own parity with the workflow files.
    gates.append(Gate("test_run_gates.py", _unittest("test_run_gates.py"), "meta"))

    # Workspace gates.
    for name in ("check-types", "test", "check"):
        gates.append(Gate(f"bun run {name}", ["bun", "run", name], "workspace"))
    gates.append(Gate("bun run changeset:status", ["bun", "run", "changeset:status"], "workspace"))

    return gates


def run_gate(gate: Gate) -> Result:
    started = time.monotonic()
    try:
        completed = subprocess.run(
            gate.command,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as error:  # pragma: no cover - environment specific
        return Result(gate, False, time.monotonic() - started, f"command not found: {error}")
    output = (completed.stdout or "") + (completed.stderr or "")
    return Result(gate, completed.returncode == 0, time.monotonic() - started, output)


def main() -> int:
    gates = build_gates()
    groups = sorted({gate.group for gate in gates})

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--group",
        action="append",
        choices=groups,
        help="Run only the named group. Repeatable. Defaults to every group.",
    )
    parser.add_argument("--list", action="store_true", help="List gates without running them.")
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Print only the summary table, not failing gate output.",
    )
    args = parser.parse_args()

    selected = [gate for gate in gates if not args.group or gate.group in args.group]

    if args.list:
        for group in groups:
            if args.group and group not in args.group:
                continue
            print(f"\n{group}")
            for gate in selected:
                if gate.group == group:
                    print(f"  {gate.name}")
        if NOT_RUN_LOCALLY:
            print("\nnot run locally")
            for command, reason in sorted(NOT_RUN_LOCALLY.items()):
                print(f"  {command}\n      {reason}")
        return 0

    results: list[Result] = []
    width = max(len(gate.name) for gate in selected)
    current_group = None
    for gate in selected:
        if gate.group != current_group:
            current_group = gate.group
            print(f"\n{current_group}")
        print(f"  {gate.name:<{width}} ", end="", flush=True)
        result = run_gate(gate)
        results.append(result)
        print(f"{'PASS' if result.passed else 'FAIL'}  {result.seconds:5.1f}s")

    failures = [result for result in results if not result.passed]

    if failures and not args.quiet:
        for result in failures:
            print(f"\n{'=' * 70}\nFAILED: {result.gate.name}\n{'=' * 70}")
            print(result.output.strip()[-4000:])

    print(f"\n{len(results) - len(failures)}/{len(results)} gates passed")
    if NOT_RUN_LOCALLY:
        print(
            f"{len(NOT_RUN_LOCALLY)} CI gates are not run locally "
            "(see --list); continuous integration still evaluates them."
        )
    if failures:
        print("failing: " + ", ".join(result.gate.name for result in failures))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
