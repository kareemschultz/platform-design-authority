#!/usr/bin/env python3
"""Enforce the governed package graph and path-aware composition-root rules."""

from __future__ import annotations

import fnmatch
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = ROOT / "registry" / "architecture-rules.json"
SOURCE_SUFFIXES = {
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".sql",
}
EXCLUDED_DIRECTORIES = {
    ".next",
    ".source",
    ".turbo",
    "coverage",
    "dist",
    "node_modules",
}
IMPORT_PATTERN = re.compile(
    r"""(?:\b(?:import|export)\s+(?:type\s+)?[^;]*?\sfrom\s*|\bimport\s*\()"""
    r"""["']([^"']+)["']"""
)
DATABASE_MODULES = {
    "pg",
    "postgres",
    "drizzle-orm",
    "drizzle-kit",
    "kysely",
}
TRANSPORT_MODULE_PREFIXES = (
    "@orpc/server",
    "@orpc/openapi",
    "@orpc/zod",
    "hono",
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def matches(path: str, patterns: list[str]) -> bool:
    return any(
        fnmatch.fnmatch(path, pattern)
        or fnmatch.fnmatch(path, f"{pattern}/**")
        for pattern in patterns
    )


def package_roots() -> list[Path]:
    manifests = [
        *(ROOT / "apps").glob("*/package.json"),
        *(ROOT / "packages").glob("*/package.json"),
        *(ROOT / "packages").glob("*/*/package.json"),
    ]
    return sorted({manifest.parent for manifest in manifests})


def is_test_source(path: Path) -> bool:
    return any(
        marker in path.name
        for marker in (".test.", ".spec.", ".types.test.")
    )


def classify(path: str, families: list[dict[str, Any]]) -> str | None:
    for family in families:
        if matches(path, [str(pattern) for pattern in family.get("globs", [])]):
            return str(family["id"])
    return None


def source_files(root: Path) -> list[Path]:
    return [
        path
        for path in root.rglob("*")
        if path.is_file()
        and path.suffix in SOURCE_SUFFIXES
        and not EXCLUDED_DIRECTORIES.intersection(path.parts)
    ]


def dependency_name(specifier: str) -> str:
    if specifier.startswith("@"):
        return "/".join(specifier.split("/")[:2])
    return specifier.split("/")[0]


def exception_allows(
    exceptions: list[dict[str, Any]], rule: str, source_path: str
) -> bool:
    for exception in exceptions:
        if rule not in exception.get("rules", []):
            continue
        if matches(source_path, [str(item) for item in exception.get("paths", [])]):
            return True
    return False


def main() -> int:
    data = load_json(RULES_PATH)
    families = data["package_families"]
    family_by_id = {str(item["id"]): item for item in families}
    requirements = data.get("requirements", {})
    composition_roots = [
        str(item) for item in requirements.get("composition_roots", [])
    ]
    composition_targets = set(
        str(item) for item in requirements.get("composition_root_may_depend_on", [])
    )
    runtime_neutral = set(
        str(item) for item in requirements.get("runtime_neutral_families", [])
    )
    exceptions = data.get("exceptions", [])

    roots = package_roots()
    package_by_name: dict[str, Path] = {}
    family_by_root: dict[Path, str] = {}
    manifest_dependencies: dict[Path, set[str]] = defaultdict(set)
    runtime_manifest_dependencies: dict[Path, set[str]] = defaultdict(set)
    errors: list[str] = []

    for root in roots:
        relative = posix(root)
        family = classify(relative, families)
        if family is None:
            errors.append(f"{relative}: package does not match a registered family")
            continue
        family_by_root[root] = family
        manifest = load_json(root / "package.json")
        name = manifest.get("name")
        if isinstance(name, str):
            if name in package_by_name:
                errors.append(f"{relative}: duplicate package name {name}")
            package_by_name[name] = root
        for section in ("dependencies", "devDependencies", "peerDependencies"):
            manifest_dependencies[root].update(manifest.get(section, {}).keys())
        for section in ("dependencies", "peerDependencies"):
            runtime_manifest_dependencies[root].update(
                manifest.get(section, {}).keys()
            )

    package_edges: dict[Path, set[Path]] = defaultdict(set)
    imported_internal_dependencies: dict[Path, set[str]] = defaultdict(set)

    for package_root, source_family in sorted(
        family_by_root.items(), key=lambda item: posix(item[0])
    ):
        for source in source_files(package_root):
            source_path = posix(source)
            text = source.read_text(encoding="utf-8")

            if source_family in runtime_neutral and not is_test_source(source):
                if re.search(r"""(?:from\s*|import\s*\()["']bun:""", text) or re.search(
                    r"\bBun\.", text
                ):
                    errors.append(
                        f"{source_path}: bun-runtime-leak: runtime-neutral package uses Bun"
                    )
                if any(
                    dependency_name(specifier) in TRANSPORT_MODULE_PREFIXES
                    or specifier.startswith(TRANSPORT_MODULE_PREFIXES)
                    for specifier in IMPORT_PATTERN.findall(text)
                ):
                    errors.append(
                        f"{source_path}: transport-runtime-leak: runtime-neutral package imports HTTP/oRPC transport"
                    )

            imports = IMPORT_PATTERN.findall(text)
            for specifier in imports:
                module = dependency_name(specifier)
                if module in DATABASE_MODULES or specifier.startswith(
                    ("drizzle-orm/", "better-auth/adapters/drizzle")
                ):
                    allowed = source_family == "persistence" or matches(
                        source_path, composition_roots
                    )
                    if not allowed and not exception_allows(
                        exceptions, "database-outside-persistence", source_path
                    ):
                        errors.append(
                            f"{source_path}: database-outside-persistence: imports {specifier}"
                        )

                target_root = package_by_name.get(module)
                if target_root is None:
                    continue
                if target_root == package_root:
                    continue
                imported_internal_dependencies[package_root].add(module)
                package_edges[package_root].add(target_root)
                target_family = family_by_root[target_root]

                allowed_families = set(
                    str(item)
                    for item in family_by_id[source_family].get("may_depend_on", [])
                )
                allowed = target_family in allowed_families
                if matches(source_path, composition_roots):
                    allowed = allowed or target_family in composition_targets
                if not allowed:
                    errors.append(
                        f"{source_path}: family edge {source_family} -> {target_family} is prohibited ({specifier})"
                    )

                if (
                    source_family == "applications"
                    and target_family in {"platform", "engines", "domains", "persistence"}
                    and not matches(source_path, composition_roots)
                ):
                    errors.append(
                        f"{source_path}: concrete application binding belongs in a registered composition root ({specifier})"
                    )
                if (
                    source_family in {"platform", "engines", "domains"}
                    and target_family in {"platform", "engines", "domains"}
                ):
                    errors.append(
                        f"{source_path}: family grants are contract-only; import a published contract, not {specifier}"
                    )

            if (
                re.search(r"\bnew\s+Pool\s*\(", text)
                or re.search(r"\bpool\.end\s*\(", text)
                or ("DATABASE_URL" in text and source_family != "tooling")
            ) and not matches(source_path, composition_roots):
                if not exception_allows(
                    exceptions, "connection-lifecycle-outside-composition", source_path
                ):
                    errors.append(
                        f"{source_path}: connection-lifecycle-outside-composition"
                    )

            if (
                source_family in runtime_neutral
                and "migrations" in source.relative_to(package_root).parts
                and not exception_allows(
                    exceptions, "migration-outside-persistence", source_path
                )
            ):
                errors.append(
                    f"{source_path}: migration-outside-persistence: runtime-neutral package owns a concrete migration artifact"
                )

    for root, dependencies in manifest_dependencies.items():
        for dependency in dependencies:
            target = package_by_name.get(dependency)
            if target is not None and target != root:
                source_family = family_by_root[root]
                target_family = family_by_root[target]
                allowed_families = set(
                    str(item)
                    for item in family_by_id[source_family].get("may_depend_on", [])
                )
                if source_family == "applications":
                    # Applications may declare implementation dependencies only
                    # so their registered composition roots can bind them. The
                    # source-path checks above reject use from ordinary paths.
                    allowed_families.update(composition_targets)
                if (
                    dependency in runtime_manifest_dependencies[root]
                    and target_family not in allowed_families
                ):
                    errors.append(
                        f"{posix(root / 'package.json')}: manifest family edge "
                        f"{source_family} -> {target_family} is prohibited ({dependency})"
                    )
                package_edges[root].add(target)

    visiting: set[Path] = set()
    visited: set[Path] = set()

    def visit(node: Path, chain: list[Path]) -> None:
        if node in visiting:
            start = chain.index(node)
            cycle = chain[start:] + [node]
            errors.append(
                "package dependency cycle: " + " -> ".join(posix(item) for item in cycle)
            )
            return
        if node in visited:
            return
        visiting.add(node)
        for target in sorted(package_edges[node], key=posix):
            visit(target, [*chain, target])
        visiting.remove(node)
        visited.add(node)

    for root in sorted(roots, key=posix):
        visit(root, [root])

    if errors:
        for error in sorted(set(errors)):
            print(error, file=sys.stderr)
        print(f"architecture validation failed with {len(set(errors))} error(s)", file=sys.stderr)
        return 1
    print(
        f"architecture validation passed: {len(roots)} packages, "
        f"{sum(len(source_files(root)) for root in roots)} source files"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
