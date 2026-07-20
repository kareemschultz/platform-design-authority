"""Keep the local gate runner in step with the workflow files.

A local runner that drifts from continuous integration is worse than no runner
at all: it reports success while the branch is still red. These tests derive
the command set from `.github/workflows/` and require every command to be
either declared as a gate or explicitly recorded as not run locally.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

from scripts.run_gates import NOT_RUN_LOCALLY, build_gates

REPO_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = REPO_ROOT / ".github" / "workflows"

# Commands that are infrastructure rather than gates.
INFRASTRUCTURE = re.compile(
    r"^(docker|python -m pip|bun install|bun run --cwd apps/server db:migrate$)"
)


GATE_COMMAND = re.compile(
    r"""(?P<command>
        python\ -m\ unittest\ scripts/[\w.]+
      | python\ scripts/[\w.]+(?:\ --[\w-]+)*
      | bun\ run\ (?:--cwd\ \S+\ )?[\w:.-]+
    )""",
    re.X,
)


def workflow_commands() -> set[str]:
    """Return the governance commands continuous integration executes.

    Commands are matched anywhere in a line, not only at its start, because
    workflows nest them inside `docker compose exec ... bun run db:migrate`
    and similar wrappers.
    """

    commands: set[str] = set()
    for workflow in WORKFLOWS.glob("*.yml"):
        for raw in workflow.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            for match in GATE_COMMAND.finditer(line):
                command = match.group("command").strip()
                if INFRASTRUCTURE.match(command):
                    continue
                # --event-path names a runtime payload, not a distinct gate.
                command = command.removesuffix(" --event-path").strip()
                commands.add(command)
    return commands


def declared_commands() -> set[str]:
    """Return the gate commands the runner declares, in workflow notation."""

    declared: set[str] = set()
    for gate in build_gates():
        name = gate.name
        if name.startswith("bun run"):
            declared.add(name)
        elif name.startswith("test_"):
            declared.add(f"python -m unittest scripts/{name}")
            # test_architecture_checker.py is invoked directly in CI.
            declared.add(f"python scripts/{name}")
        else:
            script, _, flags = name.partition(" ")
            declared.add(f"python scripts/{script}{(' ' + flags) if flags else ''}")
    return declared


class GateRunnerParityTests(unittest.TestCase):
    def test_every_workflow_gate_is_declared_or_recorded_as_skipped(self) -> None:
        declared = declared_commands()
        skipped = set(NOT_RUN_LOCALLY)
        missing = sorted(
            command
            for command in workflow_commands()
            if command not in declared and command not in skipped
        )
        self.assertEqual(
            missing,
            [],
            "These commands run in CI but are neither declared in run_gates.build_gates() "
            "nor recorded in run_gates.NOT_RUN_LOCALLY. Add them to one or the other so "
            "the local runner cannot silently under-report:\n  "
            + "\n  ".join(missing),
        )

    def test_skip_list_records_a_reason_for_every_entry(self) -> None:
        for command, reason in NOT_RUN_LOCALLY.items():
            with self.subTest(command=command):
                self.assertTrue(reason.strip(), f"{command} is skipped without a reason")

    def test_skip_list_has_no_stale_entries(self) -> None:
        """A command recorded as skipped must still exist in a workflow."""
        commands = workflow_commands()
        stale = sorted(
            command
            for command in NOT_RUN_LOCALLY
            if command not in commands and command not in declared_commands()
        )
        self.assertEqual(
            stale,
            [],
            "These entries in NOT_RUN_LOCALLY no longer appear in any workflow; "
            "remove them: " + ", ".join(stale),
        )

    def test_every_declared_gate_names_a_real_script(self) -> None:
        for gate in build_gates():
            if gate.command[0] == "bun":
                continue
            script = next(
                (part for part in gate.command if part.startswith("scripts/")), None
            )
            with self.subTest(gate=gate.name):
                self.assertIsNotNone(script, f"{gate.name} declares no script path")
                self.assertTrue(
                    (REPO_ROOT / script).exists(), f"{script} does not exist"
                )


if __name__ == "__main__":
    unittest.main()
