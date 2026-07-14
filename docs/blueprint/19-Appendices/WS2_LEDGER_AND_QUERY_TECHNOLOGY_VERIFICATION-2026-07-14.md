---
document_id: PDA-APP-021
title: WS2 Ledger and Query Technology Verification
version: 0.1.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-14
verified_as_of: 2026-07-14
related_adrs: [ADR-0020, ADR-0024, ADR-0027]
---

# WS2 Ledger and Query Technology Verification

## Purpose and evidence boundary

Record the executable WS2 PR1 suitability spike required by PDA-RDM-009 G3 at the repository's exact controlled-prototype lock. This evidence supports proceeding to owner migrations and application code; it is not production capacity, high-availability, recovery, or regulatory evidence.

## Exact implementation lock

| Component | Verified lock | Evidence |
|---|---:|---|
| PostgreSQL | 18.4 container | Compose health check and disposable live database |
| Drizzle ORM | 0.45.2 | `bun.lock`, server build, transaction/query spike |
| Drizzle Kit | 0.31.10 | `bun.lock`, registered per-owner generated migration streams |
| node-postgres | 8.22.0 | `bun.lock`, one checked-out-client transaction and concurrent clients |
| Bun | 1.3.14 | Docker image and 22-case live integration run |
| Node.js | 24 container fallback | Server image; existing persistence fallback lane remains required |

PostgreSQL 18.4 was released on 2026-05-14. The installed locks, rather than an unpinned upstream `latest`, are the implementation authority for this spike.

## Executable results

The disposable `apps/server/composition/ws2-ledger-spike.integration.test.ts` fixture created only `ws2_spike_*` evidence tables and removed its database after the run.

| Probe | Result |
|---|---|
| State plus outbox atomicity | An induced failure rolled back both the balance mutation and outbox insert |
| Same-key concurrency | 20 concurrent postings of `0.100000` serialized with row locking to exactly `2.000000`; no lost or double-applied movement |
| Exact quantity | PostgreSQL `numeric(38,6)` preserved `3.333333`; its linked `-3.333333` reversal summed to exactly zero |
| Reversal discipline | The correction was a new linked movement; no posted movement was mutated or deleted |
| Projection rebuild | Summing immutable movements rebuilt the materialized balance with zero divergence |
| Query shape | Exact tenant-scoped barcode lookup and cursor/filter pagination used the intended indexes over 250,000 synthetic Products |
| Migration ownership | Catalog, Inventory, and Platform Numbering each had an owner-qualified empty migration stream and distinct history table in deterministic server-owned order |
| Full live suite | 22 passed, 0 failed, 351 expectations on PostgreSQL 18.4 |

The query probe is an index-shape check, not a latency service-level objective. It uses exact barcode and lexical cursor/filter behavior; it does not prove fuzzy search, locale relevance, multi-million-row ledger capacity, or production concurrency.

## Suitability conclusion

Drizzle ORM 0.45.2 with node-postgres 8.22.0 and PostgreSQL 18.4 is suitable for WS2's controlled-prototype owner migrations, transactional state-plus-outbox work, exact-quantity movements, linked reversals, and scoped query paths. Complex ledger statements may use reviewed parameterized SQL behind the owner adapter while preserving the Drizzle migration and composition rules; this result does not justify a Kysely or persistence-architecture change.

The following remain unproven and are required before production readiness is claimed:

- representative production cardinality, contention, p50/p95/p99 latency, and connection-budget tests;
- failover, PITR, restore, rolling upgrade, stuck-transaction, worker-lease, and crash recovery;
- production database roles and PostgreSQL row-level-security evidence under RR-007;
- index bloat, vacuum, retention, partitioning, projection rebuild time, and long-running import behavior;
- locale-aware or fuzzy Product search and any `pg_trgm` activation under PDA-ARC-015;
- event worker retry, dead-letter, replay, ordering, and consumer-idempotency evidence under RR-006.

## Primary sources

- PostgreSQL 18.4 release: `https://www.postgresql.org/docs/release/18.4/`
- PostgreSQL numeric types: `https://www.postgresql.org/docs/18/datatype-numeric.html`
- PostgreSQL row locking and `SKIP LOCKED`: `https://www.postgresql.org/docs/18/sql-select.html`
- Drizzle ORM releases: `https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.2`
- Drizzle generated migrations: `https://orm.drizzle.team/docs/drizzle-kit-generate`
- Drizzle migration overview: `https://orm.drizzle.team/docs/migrations`
- node-postgres transactions: `https://node-postgres.com/features/transactions`
- node-postgres pool lifecycle: `https://node-postgres.com/apis/pool`

## Recheck triggers

Re-run and amend this evidence on any PostgreSQL, Drizzle, node-postgres, Bun, or Node lock change; when PR3 introduces real ledger migrations; before a search extension is enabled; and before any scale, production, or availability claim.
