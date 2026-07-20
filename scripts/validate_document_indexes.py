#!/usr/bin/env python3
"""Validate canonical navigation for every governed document.

The generated document registry is the inventory. Each non-index document must
have exactly one clickable entry in the README beside it, and that entry must
show the registered document ID and lifecycle. Governed README indexes must in
turn be linked once from their parent navigation plane.
"""

import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCUMENT_REGISTRY = REPO_ROOT / "registry" / "documents.json"
GOVERNANCE_EXEMPTIONS = REPO_ROOT / "registry" / "governance-exemptions.json"
PRODUCT_DOCUMENTATION = REPO_ROOT / "registry" / "product-documentation.json"
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
PUBLIC_ROOT_FILES = ("AGENTS.md", "CLAUDE.md", "README.md")
PUBLIC_DOCUMENT_ROOTS = ("docs", "apps/docs", "ops")
AUXILIARY_DOCUMENT_ROOTS = (".agents/skills", ".claude/skills", ".changeset", ".github")
IGNORED_DIRECTORY_NAMES = {
    ".git",
    ".next",
    ".source",
    ".turbo",
    "coverage",
    "dist",
    "node_modules",
}


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


def discover_public_artifacts(repo_root: Path) -> set[Path]:
    """Return repository prose that must have exactly one accounting route."""

    artifacts = {
        (repo_root / filename).resolve()
        for filename in PUBLIC_ROOT_FILES
        if (repo_root / filename).is_file()
    }
    for relative_root in PUBLIC_DOCUMENT_ROOTS:
        root = repo_root / relative_root
        if not root.exists():
            continue
        for candidate in root.rglob("*"):
            if not candidate.is_file() or candidate.suffix.lower() not in {".md", ".mdx"}:
                continue
            relative_parts = candidate.relative_to(root).parts
            if any(part in IGNORED_DIRECTORY_NAMES for part in relative_parts):
                continue
            artifacts.add(candidate.resolve())
    return artifacts


def discover_auxiliary_artifacts(repo_root: Path) -> set[Path]:
    """Return bounded tool, release, and contribution Markdown sources."""

    artifacts: set[Path] = set()
    for relative_root in AUXILIARY_DOCUMENT_ROOTS:
        root = repo_root / relative_root
        if not root.exists():
            continue
        artifacts.update(
            candidate.resolve()
            for candidate in root.rglob("*")
            if candidate.is_file() and candidate.suffix.lower() in {".md", ".mdx"}
        )
    return artifacts


def discover_repository_artifacts(repo_root: Path) -> set[Path]:
    """Return all source Markdown/MDX while pruning generated/dependency trees."""

    artifacts: set[Path] = set()
    for directory, child_directories, filenames in os.walk(repo_root):
        child_directories[:] = [
            name for name in child_directories if name not in IGNORED_DIRECTORY_NAMES
        ]
        base = Path(directory)
        artifacts.update(
            (base / filename).resolve()
            for filename in filenames
            if Path(filename).suffix.lower() in {".md", ".mdx"}
        )
    return artifacts


def validate_artifact_accounting(
    documents: list[dict[str, str]],
    exemptions: list[dict[str, str]],
    product_pages: list[dict[str, str]],
    repo_root: Path,
) -> list[str]:
    """Require one and only one inventory route for every public prose artifact."""

    errors: list[str] = []
    categories = {
        "governed registry": [document["path"] for document in documents],
        "governance exemption": [exemption["path"] for exemption in exemptions],
        "product-documentation manifest": [page["path"] for page in product_pages],
    }
    category_paths: dict[str, set[Path]] = {}
    for category, paths in categories.items():
        duplicates = sorted({path for path in paths if paths.count(path) > 1})
        for path in duplicates:
            errors.append(f"{path}: duplicate entry in {category}")
        resolved = {(repo_root / path).resolve() for path in paths}
        category_paths[category] = resolved
        for path in sorted(resolved):
            if not path.is_file():
                errors.append(
                    f"{path.relative_to(repo_root).as_posix()}: {category} path does not exist"
                )

    category_paths["auxiliary workflow source"] = discover_auxiliary_artifacts(
        repo_root
    )

    category_names = list(category_paths)
    for index, left_name in enumerate(category_names):
        for right_name in category_names[index + 1 :]:
            for path in sorted(category_paths[left_name] & category_paths[right_name]):
                errors.append(
                    f"{path.relative_to(repo_root).as_posix()}: accounted by both "
                    f"{left_name} and {right_name}"
                )

    accounted = set().union(*category_paths.values())
    for path in sorted(discover_repository_artifacts(repo_root) - accounted):
        errors.append(
            f"{path.relative_to(repo_root).as_posix()}: repository Markdown/MDX artifact "
            "is neither governed, explicitly exempt, product-manifested, nor a bounded "
            "auxiliary workflow source"
        )
    return errors


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
    required_registries = (
        DOCUMENT_REGISTRY,
        GOVERNANCE_EXEMPTIONS,
        PRODUCT_DOCUMENTATION,
    )
    missing = [path for path in required_registries if not path.exists()]
    if missing:
        for path in missing:
            print(f"ERROR: required document inventory is missing: {path}")
        return 1

    payload = json.loads(DOCUMENT_REGISTRY.read_text(encoding="utf-8"))
    exemption_payload = json.loads(GOVERNANCE_EXEMPTIONS.read_text(encoding="utf-8"))
    product_payload = json.loads(PRODUCT_DOCUMENTATION.read_text(encoding="utf-8"))
    documents = payload.get("documents", [])
    exemptions = exemption_payload.get("exemptions", [])
    product_pages = product_payload.get("pages", [])
    errors = validate_index_coverage(documents, REPO_ROOT)
    errors.extend(
        validate_artifact_accounting(
            documents,
            exemptions,
            product_pages,
            REPO_ROOT,
        )
    )
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} document-index error(s).")
        return 1
    print(
        "Document-index validation passed: every governed artifact has one "
        "canonical linked index entry and every repository Markdown/MDX artifact "
        "has exactly one inventory route."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
