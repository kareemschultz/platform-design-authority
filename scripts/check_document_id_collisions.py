#!/usr/bin/env python3
"""Fail a branch when a document_id it adds collides with one already on origin/main.

Parallel branches each allocating the "next free" identifier from a shared
family (e.g. PDA-OPS-###) look correct in isolation: `generate_registries.py`
only rejects a document_id repeated twice in the *same* working tree. The
collision only becomes visible once both branches land — which is exactly
what produced eight duplicate document_id reassignments during the PR #75
merge. This check compares the current working tree's document_id -> path
assignments against origin/main's committed registry and fails on any
document_id that resolves to a different path on each side, so the second
branch to run this check (not the second branch to merge) is the one that
has to renumber.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.generate_registries import governed_documents, parse_front_matter

ROOT = Path(__file__).resolve().parents[1]


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def current_tree_ids() -> dict[str, str]:
    """document_id -> repo-relative path, for every governed document in the
    current working tree."""
    ids: dict[str, str] = {}
    for path in governed_documents():
        metadata = parse_front_matter(path) or {}
        document_id = metadata.get("document_id")
        if document_id:
            ids[str(document_id)] = path.relative_to(ROOT).as_posix()
    return ids


def main_branch_ids(ref: str = "origin/main") -> dict[str, str] | None:
    """document_id -> path, as committed in ref's registry/documents.json.

    Returns None (rather than raising) when ref cannot be resolved, so this
    check degrades to a no-op warning in a shallow clone or an offline
    environment instead of blocking every other gate.
    """
    present = run_git("cat-file", "-e", f"{ref}^{{commit}}")
    if present.returncode != 0:
        return None
    result = run_git("show", f"{ref}:registry/documents.json")
    if result.returncode != 0:
        return None
    import json

    try:
        data = json.loads(result.stdout)
    except ValueError:
        return None
    return {
        str(record["document_id"]): str(record["path"])
        for record in data.get("documents", [])
        if record.get("document_id") and record.get("path")
    }


def find_collisions(
    current: dict[str, str], main: dict[str, str]
) -> list[tuple[str, str, str]]:
    """Return (document_id, path_on_main, path_here) for every document_id
    that this working tree assigns to a different path than origin/main
    already assigns it to."""
    collisions: list[tuple[str, str, str]] = []
    for document_id, path_here in sorted(current.items()):
        path_on_main = main.get(document_id)
        if path_on_main is not None and path_on_main != path_here:
            collisions.append((document_id, path_on_main, path_here))
    return collisions


def main() -> int:
    main_ids = main_branch_ids()
    if main_ids is None:
        print(
            "Document-ID collision check skipped: origin/main is not resolvable "
            "in this checkout (shallow clone or offline)."
        )
        return 0

    collisions = find_collisions(current_tree_ids(), main_ids)
    if collisions:
        print("Document-ID collision check failed:", file=sys.stderr)
        for document_id, path_on_main, path_here in collisions:
            print(
                f"- {document_id}: already assigned to {path_on_main} on "
                f"origin/main, but this branch assigns it to {path_here}. "
                "Reassign the id in this branch to a value above the "
                "family's current maximum on origin/main.",
                file=sys.stderr,
            )
        return 1

    print("Document-ID collision check passed: no document_id collides with origin/main.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
