---
document_id: PDA-APP-020
title: WS1 Persistence Technology Verification 2026-07-13
version: 0.1.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-13
verified_as_of: 2026-07-13
related_adrs: [ADR-0027, ADR-0020, ADR-0024]
---

# WS1 Persistence Technology Verification — 2026-07-13

## Decision Scope

This evidence locks the controlled WS1 Technical Prototype 1 persistence combination. It does not promote ADR-0027, authorize production, or prove later financial-ledger suitability.

| Component | Exact prototype lock | Evidence |
|---|---:|---|
| Drizzle ORM | `0.45.2` | root catalog, `bun.lock`, installed package manifest |
| Drizzle Kit | `0.31.10` | persistence-package manifests, `bun.lock`, installed package manifest |
| node-postgres (`pg`) | `8.22.0` | persistence/server manifests, `bun.lock`, installed package manifest |
| PostgreSQL | `18.4` | immutable Compose image digest and live version assertion |
| Bun | `1.3.14` | root package-manager lock and CI setup |
| Node fallback | `24` | CI runtime matrix |

The stable Drizzle line remains `0.45.2`; upstream `1.0` releases observed on the verification date were prereleases and were not adopted. PostgreSQL 18.4 remained the current PostgreSQL 18 patch documented by the project. No database extension was added: the existing `pg_stat_statements` baseline remains unchanged under PDA-ARC-019 and ADR-0024.

## Compatibility Findings

- Drizzle Kit generates SQL and snapshots from TypeScript schemas. Committed migrations remain generated artifacts; freshness reruns generation and requires a clean diff.
- Each owner uses a separate Drizzle migration directory and history table. This prevents one owner's migration bookkeeping from suppressing another owner's stream.
- The composition runner invokes streams serially in the registered order: `platform.identity`, then `platform.events`.
- node-postgres transactions must use one checked-out client for every statement. The composition binder creates only the selected owner/outbox port scope over that client and releases it in `finally`.
- Pool construction, connection configuration, idle-client error handling, and shutdown live only in `apps/server/composition/**`.
- Owner persistence packages accept an injected `Pool` or `PoolClient`; they do not read environment configuration, construct pools, close pools, or import another owner's persistence.

## Required Regression Evidence

WS1 PR2 must keep these checks green on the exact lock above:

1. clean database migration;
2. representative Identity-only upgrade to Identity plus Event Backbone;
3. repeat migration with no drift;
4. deliberate failed-stream rollback followed by successful recovery;
5. owner-state plus outbox commit and rollback on the same checked-out client;
6. duplicate event-id idempotency;
7. architecture denial for unregistered tables, cross-owner imports, and pool lifecycle outside composition;
8. Bun tests, Node fallback build/health, PostgreSQL 18.4 smoke, and generated migration freshness.

## Limits and Fallback

- This proves the WS1 Identity/Event Backbone shape, not high-volume delivery, PITR, failover, RLS, or complex ledger workloads.
- Pool size `10` is a prototype default; deployment topology and reserved operational capacity must be measured before staging.
- A future Drizzle/pg upgrade must rerun the full migration/atomicity suite and review generated SQL before the lock changes.
- If Drizzle cannot meet later ownership, decimal, migration, or ledger requirements, the governed fallback is Kysely or explicit SQL after ADR amendment and a migration/rollback plan.

## Official Sources

- `https://github.com/drizzle-team/drizzle-orm/releases`
- `https://orm.drizzle.team/docs/drizzle-kit-generate`
- `https://orm.drizzle.team/docs/drizzle-config-file`
- `https://node-postgres.com/apis/pool`
- `https://node-postgres.com/features/transactions`
- `https://www.postgresql.org/docs/18/release-18-4.html`

Repository evidence: `package.json`, `bun.lock`, `docker-compose.yml`, `packages/persistence/*`, `apps/server/composition/*`, and `.github/workflows/meridian-prototype.yml`.
