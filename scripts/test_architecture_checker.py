#!/usr/bin/env python3
"""Regression probes for the path-aware architecture checker."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / "scripts" / "check_architecture.py"


def run_checker() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["python", str(CHECKER)],
        cwd=ROOT,
        capture_output=True,
        check=False,
        text=True,
    )


def probe(path: Path, expected_success: bool, expected_text: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        'import { auth } from "@meridian/platform-identity";\nvoid auth;\n',
        encoding="utf-8",
    )
    try:
        result = run_checker()
        output = result.stdout + result.stderr
        if (result.returncode == 0) != expected_success:
            raise AssertionError(output)
        if expected_text and expected_text not in output:
            raise AssertionError(
                f"expected checker output to include {expected_text!r}:\n{output}"
            )
    finally:
        path.unlink(missing_ok=True)


def main() -> int:
    baseline = run_checker()
    if baseline.returncode != 0:
        raise AssertionError(baseline.stdout + baseline.stderr)

    probe(
        ROOT / "apps" / "server" / "src" / "__architecture_negative_fixture.ts",
        expected_success=False,
        expected_text="concrete application binding belongs in a registered composition root",
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "src"
        / "composition"
        / "__architecture_nested_negative_fixture.ts",
        expected_success=False,
        expected_text="concrete application binding belongs in a registered composition root",
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "composition"
        / "__architecture_positive_fixture.ts",
        expected_success=True,
    )
    print("architecture checker regression probes passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
