#!/usr/bin/env python3
"""Regression probes for the path-aware architecture checker."""

from __future__ import annotations

import ast
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / "scripts" / "check_architecture.py"
RULES_PATH = ROOT / "registry" / "architecture-rules.json"
sys.path.insert(0, str(ROOT / "scripts"))

from generate_registries import apply_rule_allowances  # noqa: E402


def _rule_id_from_errors_append(call: ast.Call) -> str | None:
    """Extract RULE_ID from an errors.append(f"{source_path}: RULE_ID...") call."""
    if not call.args:
        return None
    value = call.args[0]
    if not isinstance(value, ast.JoinedStr) or len(value.values) < 2:
        return None
    tail = value.values[1]
    if not isinstance(tail, ast.Constant) or not isinstance(tail.value, str):
        return None
    text = tail.value.lstrip(" ").removeprefix(": ")
    match = re.match(r"([a-z][a-z0-9-]+)", text)
    return match.group(1) if match else None


def _if_test_calls_is_test_source(test: ast.expr) -> bool:
    return any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "is_test_source"
        for node in ast.walk(test)
    )


def assert_test_source_exempt_rules_match_registry() -> None:
    """Fifth-audit F-B-004, second-review closure: the registered
    test-source-exempt-rules table must name exactly the forbidden-pattern
    rule IDs whose enclosing `if` statement gates on is_test_source(source)
    — no more, no less — so the doc/registry claim and the code cannot
    drift apart silently. Uses the real AST (not text/paren heuristics,
    which broke on regex string literals containing literal parens) to walk
    every `if` node, check whether its test calls is_test_source, and
    collect the rule IDs of any errors.append(...) reachable in its body
    (including nested `if`s, e.g. connection-lifecycle-outside-composition's
    exception_allows guard) — deliberately excluding the unrelated
    `if source_family in runtime_neutral and not is_test_source(source):`
    family (bun/hono/orpc/database-adapter leaks), which skips test files
    for a different reason (test files may use runtime-specific test
    globals) and is out of scope for this table."""
    tree = ast.parse(CHECKER.read_text(encoding="utf-8"), filename=str(CHECKER))
    code_exempt_rules: set[str] = set()
    for node in ast.walk(tree):
        if not (isinstance(node, ast.If) and _if_test_calls_is_test_source(node.test)):
            continue
        for inner in ast.walk(node):
            if (
                isinstance(inner, ast.Call)
                and isinstance(inner.func, ast.Attribute)
                and inner.func.attr == "append"
                and isinstance(inner.func.value, ast.Name)
                and inner.func.value.id == "errors"
            ):
                rule_id = _rule_id_from_errors_append(inner)
                if rule_id:
                    code_exempt_rules.add(rule_id)

    registry_exempt_rules = set(
        json.loads(RULES_PATH.read_text(encoding="utf-8")).get(
            "test_source_exempt_rules", []
        )
    )
    if code_exempt_rules != registry_exempt_rules:
        raise AssertionError(
            "test-source-exempt rules drifted between check_architecture.py "
            f"({sorted(code_exempt_rules)}) and registry/architecture-rules.json "
            f"({sorted(registry_exempt_rules)}); update the Registered "
            "Test-Source-Exempt Rules table in ARCHITECTURE_DEPENDENCY_RULES.md "
            "and regenerate"
        )


def run_checker() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["python", str(CHECKER)],
        cwd=ROOT,
        capture_output=True,
        check=False,
        text=True,
    )


def probe(
    path: Path,
    expected_success: bool,
    expected_text: str = "",
    source: str = 'import { createIdentityAuth } from "@meridian/platform-identity";\nvoid createIdentityAuth;\n',
) -> None:
    # Fifth-audit F-B-003: record directories this probe creates so teardown
    # removes them and never leaves phantom app/package directories behind.
    created_directories: list[Path] = []
    ancestor = path.parent
    while not ancestor.exists():
        created_directories.append(ancestor)
        ancestor = ancestor.parent
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(source, encoding="utf-8")
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
        for directory in created_directories:
            try:
                directory.rmdir()
            except OSError:
                break


def main() -> int:
    generated_rules = {
        "forbidden_patterns": [
            {"id": "current-rule", "except": ["stale/path"]},
            {"id": "removed-rule", "except": ["removed/path"]},
        ]
    }
    apply_rule_allowances(generated_rules, {"current-rule": ["current/path"]})
    current_rule, removed_rule = generated_rules["forbidden_patterns"]
    if current_rule.get("except") != ["current/path"]:
        raise AssertionError("registry generation did not replace the sourced allowance")
    if "except" in removed_rule:
        raise AssertionError("registry generation preserved an unsourced rule allowance")

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
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_pool_fixture.ts",
        expected_success=True,
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "apps"
        / "worker-adjacent"
        / "composition"
        / "__architecture_adjacent_worker_pool_fixture.ts",
        expected_success=False,
        expected_text="unregistered-application-source",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "migrations"
        / "0000_forbidden.sql",
        expected_success=False,
        expected_text="application-migration-owned",
        source="CREATE TABLE worker_owned_migration (id text PRIMARY KEY);\n",
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_migration_invocation_fixture.ts",
        expected_success=False,
        expected_text="migration-invocation-outside-authority",
        source=(
            'import { migrateCatalog } from "@meridian/persistence-catalog-postgres";\n'
            "await migrateCatalog({} as never);\n"
        ),
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "composition"
        / "__architecture_server_migration_invocation_fixture.ts",
        expected_success=True,
        source=(
            'import { migrateCatalog } from "@meridian/persistence-catalog-postgres";\n'
            "await migrateCatalog({} as never);\n"
        ),
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "src"
        / "__architecture_cross_owner_consumer_fixture.ts",
        expected_success=False,
        expected_text="concrete application binding belongs in a registered composition root",
        source='import type { CatalogPersistencePort } from "@meridian/domain-catalog";\nexport type Fixture = CatalogPersistencePort;\n',
    )
    probe(
        ROOT
        / "apps"
        / "random-app"
        / "composition"
        / "__architecture_unknown_app_pool_fixture.ts",
        expected_success=False,
        expected_text="unregistered-application-source",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "src"
        / "composition"
        / "__architecture_unregistered_composition_fixture.ts",
        expected_success=False,
        expected_text="connection-lifecycle-outside-composition",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "packages"
        / "persistence"
        / "platform-events-postgres"
        / "src"
        / "__architecture_cross_owner_fixture.ts",
        expected_success=False,
        expected_text="persistence-cross-owner-import",
    )
    probe(
        ROOT
        / "packages"
        / "persistence"
        / "platform-events-postgres"
        / "src"
        / "__architecture_table_owner_fixture.ts",
        expected_success=False,
        expected_text="table unregistered_fixture has no owner entry",
        source=(
            'import { pgTable, text } from "drizzle-orm/pg-core";\n'
            'export const fixture = pgTable("unregistered_fixture", { id: text("id") });\n'
        ),
    )
    probe(
        ROOT
        / "packages"
        / "persistence"
        / "inventory-postgres"
        / "src"
        / "__architecture_catalog_owner_fixture.ts",
        expected_success=False,
        expected_text="persistence-cross-owner-import",
        source='import type { CatalogPersistencePort } from "@meridian/domain-catalog";\nexport type Fixture = CatalogPersistencePort;\n',
    )
    probe(
        ROOT / "apps" / "server" / "src" / "__architecture_pool_fixture.ts",
        expected_success=False,
        expected_text="connection-lifecycle-outside-composition",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "src"
        / "__architecture_worker_pool_outside_composition_fixture.ts",
        expected_success=False,
        expected_text="database-outside-persistence",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "packages"
        / "tooling"
        / "env"
        / "src"
        / "__architecture_connection_fixture.ts",
        expected_success=False,
        expected_text="connection-lifecycle-outside-composition",
        source='export const connectionName = "DATABASE_URL";\n',
    )
    probe(
        ROOT
        / "packages"
        / "__architecture_stray__"
        / "src"
        / "__architecture_stray_package_fixture.ts",
        expected_success=False,
        expected_text="unregistered-package-source",
        source='import { Pool } from "pg";\nexport const pool = new Pool();\n',
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_lowercase_migrator_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'import { migrate } from "drizzle-orm/node-postgres/migrator";\n'
            'await migrate({} as never, { migrationsFolder: "x" });\n'
        ),
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_aliased_migration_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'import { migrateCatalog as run } from "@meridian/persistence-catalog-postgres";\n'
            "await run({} as never);\n"
        ),
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "composition"
        / "__architecture_server_migrator_import_fixture.ts",
        expected_success=True,
        source=(
            'import { migrateCatalog as run } from "@meridian/persistence-catalog-postgres";\n'
            "await run({} as never);\n"
        ),
    )
    probe(
        ROOT / "apps" / "server" / "src" / "__architecture_pool_import_fixture.ts",
        expected_success=False,
        expected_text="pool-import-outside-composition",
        source=(
            'import { databasePool } from "../composition/postgres";\n'
            "void databasePool;\n"
        ),
    )
    # Second-review remediation: live-confirmed at exact head 2cdfdcf that a
    # namespace or dynamic import combined with an aliased call site evaded
    # both the pre-existing call-site rule and the static-named-import rule.
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_namespace_aliased_call_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'import * as catalogPersistence from "@meridian/persistence-catalog-postgres";\n'
            "const runMigration = catalogPersistence.migrateCatalog;\n"
            "await runMigration({} as never);\n"
        ),
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_dynamic_aliased_call_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            "export async function runProbe(): Promise<void> {\n"
            '\tconst mod = await import("@meridian/persistence-catalog-postgres");\n'
            "\tconst runMigration = mod.migrateCatalog;\n"
            "\tawait runMigration({} as never);\n"
            "}\n"
        ),
    )
    # Fourth-review remediation (Codex PR #80 finding): a destructured migrate
    # binding after a namespace import evades the property-access rule, and a
    # migrate-named re-export evades the static-named-import rule. Both were
    # live-confirmed passing (exit 0) at exact head a0bfe12 before this fix.
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_destructured_migration_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'import * as catalogPersistence from "@meridian/persistence-catalog-postgres";\n'
            "const { migrateCatalog: run } = catalogPersistence;\n"
            "await run({} as never);\n"
        ),
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_reexported_migration_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'export { migrateCatalog as run } from "@meridian/persistence-catalog-postgres";\n'
        ),
    )
    probe(
        ROOT
        / "apps"
        / "server"
        / "composition"
        / "__architecture_server_destructured_migration_fixture.ts",
        expected_success=True,
        source=(
            'import * as catalogPersistence from "@meridian/persistence-catalog-postgres";\n'
            "const { migrateCatalog: run } = catalogPersistence;\n"
            "await run({} as never);\n"
        ),
    )
    # Fourth-review remediation, second pass (independent review of 532a010):
    # bracket access (`p["migrateCatalog"]`) evades any dot-access rule, and a
    # wildcard re-export (`export * from "@meridian/persistence-..."`) re-exports
    # the migrate runners with no migrate token in the file. Both live-confirmed
    # passing (checker exit 0) at 532a010 before the token-reference and
    # wildcard-re-export rules.
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_bracket_access_migration_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source=(
            'import * as catalogPersistence from "@meridian/persistence-catalog-postgres";\n'
            'await catalogPersistence["migrateCatalog"]({} as never);\n'
        ),
    )
    probe(
        ROOT
        / "apps"
        / "worker"
        / "composition"
        / "__architecture_worker_wildcard_reexport_migration_fixture.ts",
        expected_success=False,
        expected_text="migration-import-outside-authority",
        source='export * from "@meridian/persistence-catalog-postgres";\n',
    )
    assert_test_source_exempt_rules_match_registry()
    print("architecture checker regression probes passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
