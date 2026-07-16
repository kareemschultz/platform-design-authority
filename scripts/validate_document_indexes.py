#!/usr/bin/env python3
"""Validate canonical navigation for every governed document.

The generated document registry is the inventory. Each non-index document must
have exactly one clickable entry in the README beside it, and that entry must
show the registered document ID and lifecycle. Governed README indexes must in
turn be linked once from their parent navigation plane.
"""

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCUMENT_REGISTRY = REPO_ROOT / "registry" / "documents.json"
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def link_targets(index_path: Path) -> list[tuple[Path, int, str]]:
    """Return local Markdown link targets with line evidence."""

    targets: list[tuple[Path, int, str]] = []
    for line_number, line in enumerate(
        index_path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        for match in MARKDOWN_LINK.finditer(line):
            raw_target = match.group(1).split("#", maxsplit=1)[0].strip("<>")
            if not raw_target or "://" in raw_target or raw_target.startswith("mailto:"):
                continue
            target = (index_path.parent / unquote(raw_target)).resolve()
            targets.append((target, line_number, line))
    return targets


def parent_index_for(index_path: Path, repo_root: Path) -> Path | None:
    """Return the navigation plane that must link a governed README index."""

    docs_root = repo_root / "docs"
    blueprint_root = docs_root / "blueprint"
    if index_path == blueprint_root / "README.md":
        return docs_root / "README.md"
    if index_path.parent.parent == blueprint_root:
        return blueprint_root / "README.md"
    if index_path.parent in {docs_root / "implementation", docs_root / "reviews"}:
        return docs_root / "README.md"
    return None


def validate_index_coverage(
    documents: list[dict[str, str]], repo_root: Path
) -> list[str]:
    """Return deterministic navigation errors for registry document records."""

    errors: list[str] = []
    registered_paths = {
        (repo_root / document["path"]).resolve() for document in documents
    }

    for document in documents:
        document_path = (repo_root / document["path"]).resolve()
        document_id = document["document_id"]
        status = document["status"]

        if not document_path.exists():
            errors.append(f"{document_id}: registered path does not exist: {document['path']}")
            continue

        if document_path.name == "README.md":
            parent_index = parent_index_for(document_path, repo_root)
            if parent_index is None:
                errors.append(
                    f"{document_id}: governed index has no declared parent navigation plane: "
                    f"{document['path']}"
                )
                continue
            if not parent_index.exists():
                errors.append(
                    f"{document_id}: parent navigation index does not exist: "
                    f"{parent_index.relative_to(repo_root).as_posix()}"
                )
                continue
            hits = [
                evidence
                for target, *evidence in link_targets(parent_index)
                if target == document_path
            ]
            if len(hits) != 1:
                errors.append(
                    f"{document_id}: expected exactly one parent-index link from "
                    f"{parent_index.relative_to(repo_root).as_posix()}, found {len(hits)}"
                )
            continue

        canonical_index = document_path.parent / "README.md"
        if not canonical_index.exists():
            errors.append(
                f"{document_id}: canonical sibling index is missing: "
                f"{canonical_index.relative_to(repo_root).as_posix()}"
            )
            continue
        if canonical_index.resolve() not in registered_paths:
            errors.append(
                f"{document_id}: canonical sibling index is not governed and registered: "
                f"{canonical_index.relative_to(repo_root).as_posix()}"
            )

        hits = [
            (line_number, line)
            for target, line_number, line in link_targets(canonical_index)
            if target == document_path
        ]
        if len(hits) != 1:
            errors.append(
                f"{document_id}: expected exactly one canonical link in "
                f"{canonical_index.relative_to(repo_root).as_posix()}, found {len(hits)}"
            )
            continue

        line_number, line = hits[0]
        missing = [value for value in (document_id, status) if value not in line]
        if missing:
            errors.append(
                f"{document_id}: canonical entry at "
                f"{canonical_index.relative_to(repo_root).as_posix()}:{line_number} "
                f"does not show registered {' and '.join(missing)}"
            )

    return errors


def main() -> int:
    if not DOCUMENT_REGISTRY.exists():
        print(f"ERROR: document registry is missing: {DOCUMENT_REGISTRY}")
        return 1

    payload = json.loads(DOCUMENT_REGISTRY.read_text(encoding="utf-8"))
    errors = validate_index_coverage(payload.get("documents", []), REPO_ROOT)
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} document-index error(s).")
        return 1
    print(
        "Document-index validation passed: every governed artifact has one "
        "canonical linked index entry."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
