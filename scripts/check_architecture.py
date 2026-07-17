#!/usr/bin/env python3
"""Enforce the governed package graph and path-aware composition-root rules."""

from __future__ import annotations

import fnmatch
import json
import os
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
PG_TABLE_PATTERN = re.compile(r"\bpgTable\s*\(\s*[\"']([^\"']+)[\"']")
SQL_TABLE_PATTERN = re.compile(
    r"\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"']?([a-zA-Z0-9_]+)[\"']?",
    re.IGNORECASE,
)
MIGRATION_INVOCATION_PATTERN = re.compile(
    r"\b(?:await\s+)?migrate[A-Z][A-Za-z0-9_$]*\s*\("
)
# Fifth-audit F-B-002: catch migrator-module imports and aliased persistence
# migrate-export imports regardless of call-site casing, so the ADR-0027
# "worker never runs migrations" gate cannot be evaded by lowercase or
# re-exported invocation.
MIGRATOR_MODULE_IMPORT_PATTERN = re.compile(
    r"""(?:from\s+|import\s*\(\s*)["'](?:drizzle-orm/[^"']*migrator[^"']*|drizzle-kit(?:/[^"']*)?)["']"""
)
PERSISTENCE_MIGRATE_IMPORT_PATTERN = re.compile(
    r"""import\s*\{[^}]*\bmigrate[A-Za-z0-9_$]*\b[^}]*\}\s*from\s*["']@meridian/persistence-[^"']+["']"""
)
# Second-review remediation (F-B-002 gap): a namespace import
# (`import * as p from "@meridian/persistence-..."`) or a dynamic import
# (`await import("@meridian/persistence-...")`) followed by an aliased
# property-access call (`const run = p.migrateCatalog; run(...)`) evades both
# MIGRATION_INVOCATION_PATTERN (call site isn't literally `migrate[A-Z](`) and
# PERSISTENCE_MIGRATE_IMPORT_PATTERN (import isn't the static named form).
# Live-confirmed at exact head 2cdfdcf: `tsc --noEmit` compiles both forms
# clean, and the pre-fix checker passed with either fixture present.
PERSISTENCE_MODULE_IMPORT_PATTERN = re.compile(
    r"""(?:from\s+|import\s*\(\s*)["']@meridian/persistence-[^"']+["']"""
)
PERSISTENCE_MIGRATE_PROPERTY_ACCESS_PATTERN = re.compile(
    r"""\.\s*migrate[A-Za-z0-9_$]*\b"""
)
# Fourth-review remediation (F-B-002 gap): a destructured migrate binding
# (`const { migrateCatalog: run } = p;` after `import * as p from
# "@meridian/persistence-..."`) evades PERSISTENCE_MIGRATE_PROPERTY_ACCESS_PATTERN
# because the binding is introduced with no `.migrate*` member access; and a
# migrate-named re-export (`export { migrateCatalog as run } from
# "@meridian/persistence-..."`) evades PERSISTENCE_MIGRATE_IMPORT_PATTERN because
# it is an `export ... from`, not an `import`. Live-confirmed at exact head
# a0bfe12: the pre-fix checker exited 0 with either fixture present.
PERSISTENCE_MIGRATE_DESTRUCTURE_PATTERN = re.compile(
    r"""\{[^{}]*\bmigrate[A-Za-z0-9_$]*\b[^{}]*\}\s*="""
)
PERSISTENCE_MIGRATE_REEXPORT_PATTERN = re.compile(
    r"""export\s*\{[^}]*\bmigrate[A-Za-z0-9_$]*\b[^}]*\}\s*from\s*"""
    r"""["']@meridian/persistence-[^"']+["']"""
)
# Fifth-audit F-B-005: the raw process pool module is composition-internal;
# ordinary application paths use the shutdown-only lifecycle module. The
# pattern matches the import specifier, not the imported binding form, so
# named, namespace, and dynamic imports of the same relative path are all
# covered without a separate rule per import style.
COMPOSITION_POOL_IMPORT_PATTERN = re.compile(
    r"""(?:from\s+|import\s*\(\s*)["']\.{1,2}(?:/[^"']*)?/composition/postgres["']"""
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def matches(path: str, patterns: list[str]) -> bool:
    path_parts = path.split("/")

    def match_parts(pattern_parts: list[str], path_index: int = 0) -> bool:
        if not pattern_parts:
            return path_index == len(path_parts)
        pattern_head, *pattern_tail = pattern_parts
        if pattern_head == "**":
            return match_parts(pattern_tail, path_index) or (
                path_index < len(path_parts)
                and match_parts(pattern_parts, path_index + 1)
            )
        return (
            path_index < len(path_parts)
            and fnmatch.fnmatchcase(path_parts[path_index], pattern_head)
            and match_parts(pattern_tail, path_index + 1)
        )

    return any(
        match_parts(pattern.split("/"))
        or match_parts(f"{pattern}/**".split("/"))
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
    sources: list[Path] = []
    for directory, child_directories, files in os.walk(root, followlinks=False):
        child_directories[:] = [
            name for name in child_directories if name not in EXCLUDED_DIRECTORIES
        ]
        directory_path = Path(directory)
        sources.extend(
            directory_path / name
            for name in files
            if Path(name).suffix in SOURCE_SUFFIXES
        )
    return sources


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
    migration_invocation_roots = [
        str(item) for item in requirements.get("migration_invocation_roots", [])
    ]
    runtime_neutral = set(
        str(item) for item in requirements.get("runtime_neutral_families", [])
    )
    exceptions = data.get("exceptions", [])
    pattern_exceptions = {
        str(pattern["id"]): [str(value) for value in pattern.get("except", [])]
        for pattern in data.get("forbidden_patterns", [])
    }
    persistence_owners = data.get("persistence_owners", [])

    owner_ids = [str(item.get("id", "")) for item in persistence_owners]
    if len(owner_ids) != len(set(owner_ids)):
        errors: list[str] = ["persistence owner ids must be unique"]
    else:
        errors = []
    owner_by_root: dict[Path, dict[str, Any]] = {}
    table_owner: dict[str, str] = {}
    for record in persistence_owners:
        root = ROOT / str(record.get("package", ""))
        if root in owner_by_root:
            errors.append(f"{posix(root)}: duplicate persistence owner mapping")
        owner_by_root[root] = record
        for table in record.get("tables", []):
            table_name = str(table)
            previous = table_owner.get(table_name)
            if previous is not None:
                errors.append(
                    f"table {table_name}: multiple persistence owners ({previous}, {record.get('owner')})"
                )
            table_owner[table_name] = str(record.get("owner", ""))

    roots = package_roots()
    for source in source_files(ROOT / "apps"):
        if not any(root in source.parents for root in roots):
            errors.append(
                f"{posix(source)}: unregistered-application-source: "
                "application source must belong to an app package"
            )
    # Fifth-audit F-B-001: the same stray-source guard for packages/, so no
    # unmanifested source file can bypass family, database, or ownership rules.
    for source in source_files(ROOT / "packages"):
        if not any(root in source.parents for root in roots):
            errors.append(
                f"{posix(source)}: unregistered-package-source: "
                "package source must belong to a registered workspace package"
            )
    package_by_name: dict[str, Path] = {}
    family_by_root: dict[Path, str] = {}
    manifest_dependencies: dict[Path, set[str]] = defaultdict(set)
    runtime_manifest_dependencies: dict[Path, set[str]] = defaultdict(set)
    discovered_tables: dict[Path, set[str]] = defaultdict(set)

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
        if family == "persistence":
            owner = owner_by_root.get(root)
            if owner is None:
                errors.append(f"{relative}: persistence package has no registered owner")
            else:
                if owner.get("package_name") != name:
                    errors.append(
                        f"{relative}: registered package_name does not match manifest name"
                    )
                owner_package = str(owner.get("owner_package", ""))
                if owner_package not in manifest.get("dependencies", {}):
                    errors.append(
                        f"{relative}: owner package {owner_package} must be a runtime dependency"
                    )
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

            if (
                source_family == "applications"
                and not is_test_source(source)
                and MIGRATION_INVOCATION_PATTERN.search(text)
                and not matches(source_path, migration_invocation_roots)
            ):
                errors.append(
                    f"{source_path}: migration-invocation-outside-authority: "
                    "application migration runners are server-composition-only"
                )

            if (
                source_family == "applications"
                and not is_test_source(source)
                and not matches(source_path, migration_invocation_roots)
                and (
                    MIGRATOR_MODULE_IMPORT_PATTERN.search(text)
                    or PERSISTENCE_MIGRATE_IMPORT_PATTERN.search(text)
                    or PERSISTENCE_MIGRATE_REEXPORT_PATTERN.search(text)
                    or (
                        PERSISTENCE_MODULE_IMPORT_PATTERN.search(text)
                        and (
                            PERSISTENCE_MIGRATE_PROPERTY_ACCESS_PATTERN.search(text)
                            or PERSISTENCE_MIGRATE_DESTRUCTURE_PATTERN.search(text)
                        )
                    )
                )
            ):
                errors.append(
                    f"{source_path}: migration-import-outside-authority: "
                    "migration modules and persistence migrate exports may only "
                    "be imported from registered migration-invocation roots"
                )

            if (
                source_family == "applications"
                and not is_test_source(source)
                and not matches(source_path, composition_roots)
                and COMPOSITION_POOL_IMPORT_PATTERN.search(text)
            ):
                errors.append(
                    f"{source_path}: pool-import-outside-composition: "
                    "the process pool module is composition-internal; import "
                    "the shutdown-only lifecycle module instead"
                )

            if source_family == "persistence":
                discovered_tables[package_root].update(PG_TABLE_PATTERN.findall(text))
                if source.suffix == ".sql":
                    discovered_tables[package_root].update(
                        SQL_TABLE_PATTERN.findall(text)
                    )

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

                if (
                    source_family == "persistence"
                    and target_family in {"platform", "engines", "domains"}
                ):
                    owner = owner_by_root.get(package_root)
                    owner_package = str(owner.get("owner_package", "")) if owner else ""
                    if module != owner_package:
                        errors.append(
                            f"{source_path}: persistence-cross-owner-import: "
                            f"registered owner package is {owner_package}, imported {module}"
                        )

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
                or "DATABASE_URL" in text
            ) and not is_test_source(source) and not matches(
                source_path, composition_roots
            ) and not matches(
                source_path,
                pattern_exceptions.get(
                    "connection-lifecycle-outside-composition", []
                ),
            ):
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

            if (
                source_family == "applications"
                and "migrations" in source.relative_to(package_root).parts
            ):
                errors.append(
                    f"{source_path}: application-migration-owned: applications may invoke registered migration streams but may not own migration artifacts"
                )

    for root, record in owner_by_root.items():
        if root not in family_by_root:
            errors.append(f"{posix(root)}: registered persistence package does not exist")
            continue
        registered_tables = {str(item) for item in record.get("tables", [])}
        actual_tables = discovered_tables.get(root, set())
        for table in sorted(actual_tables - registered_tables):
            errors.append(
                f"{posix(root)}: table {table} has no owner entry in persistence_owners"
            )
        for table in sorted(registered_tables - actual_tables):
            errors.append(
                f"{posix(root)}: registered table {table} is not declared by this package"
            )

        migration_directory = ROOT / str(record.get("migration_directory", ""))
        if not migration_directory.is_dir():
            errors.append(
                f"{posix(root)}: registered migration directory does not exist"
            )
        elif registered_tables and not list(migration_directory.glob("*.sql")):
            errors.append(
                f"{posix(root)}: registered tables require at least one SQL migration"
            )
        for migration in root.rglob("*.sql"):
            if migration_directory not in migration.parents:
                errors.append(
                    f"{posix(migration)}: migration is outside the registered owner directory"
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
