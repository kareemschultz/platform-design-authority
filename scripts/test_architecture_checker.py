#!/usr/bin/env python3
"""Regression probes for the path-aware architecture checker."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / "scripts" / "check_architecture.py"
sys.path.insert(0, str(ROOT / "scripts"))

from generate_registries import apply_rule_allowances  # noqa: E402


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
    print("architecture checker regression probes passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
