---
document_id: PDA-APP-016
title: PostgreSQL 18 and Extension Verification 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
---

# PostgreSQL 18 and Extension Verification — 2026-07-12

## Release Verification

PostgreSQL 18.4 was the current supported PostgreSQL 18 patch release. It was released on 2026-05-14 and fixed 11 security vulnerabilities across supported PostgreSQL versions plus more than 60 bugs. Architecture selects major 18; deployment pins the current approved patch and immutable artifact digest rather than freezing this evidence date forever.

## Native PostgreSQL 18 Findings

- PostgreSQL 18 includes native `uuidv7()` with millisecond time ordering and randomness, plus UUIDv4 generation.
- PostgreSQL 18 introduced asynchronous I/O, improved `pg_upgrade` statistics retention, skip-scan index use, virtual generated columns by default, OAuth authentication, and `OLD`/`NEW` in DML `RETURNING`.
- Full-text search, JSONB, ranges/multiranges, generated columns, declarative partitioning, row-level security, logical replication, and major index families are core features.
- `pgcrypto`'s `gen_random_uuid()` is documented as an obsolete wrapper around the core function, so UUID generation is not a reason to install it.
- `uuid-ossp` is only needed for additional/legacy UUID algorithms beyond the core UUIDv4/v7 path.

## Baseline Extension Findings

### `pg_stat_statements`

This supplied module tracks planning and execution statistics. It requires `shared_preload_libraries`, query identifiers, shared memory, a server restart, and `CREATE EXTENSION` in databases where its views/functions are used. Its operational value justifies being the only baseline preload, subject to overhead and sensitive-query controls.

### `pg_trgm`

This trusted supplied extension provides trigram similarity plus GiST/GIN operator classes for fuzzy, `LIKE`, `ILIKE`, and regex search. It is relevant to bounded product, Party, reference, and catalog search, but indexes add storage/write cost and collation behavior must be tested. PostgreSQL 18 release notes warn that non-libc collation-provider differences can affect some full-text and `pg_trgm` behavior.

## Complexity Findings

- Every shared-preload library can allocate shared memory, reserve locks, or start background workers and requires a restart; PostgreSQL recommends it only for libraries used broadly or requiring postmaster startup.
- An unavailable preload library can prevent the server from starting.
- Extension data and background state participate in upgrade, backup, PITR, failover, replication, and restore procedures.
- Managed PostgreSQL providers expose different extension allowlists and configuration privileges.
- Convenience-rich local images create false portability if staging, managed, dedicated, and self-hosted targets cannot reproduce them.

## Recommendation

Use PostgreSQL 18 with `pg_stat_statements` as the only always-preloaded extension. Add `pg_trgm` through an owned migration when approved fuzzy search is implemented. Keep pgvector and `pg_durable` isolated to named prototypes and require evidence-triggered admission for all other extensions.

## Official Sources

- `https://www.postgresql.org/docs/18/`
- `https://www.postgresql.org/docs/18/release-18-4.html`
- `https://www.postgresql.org/about/news/postgresql-184-1710-1614-1518-and-1423-released-3297/`
- `https://www.postgresql.org/docs/18/release-18.html`
- `https://www.postgresql.org/docs/18/functions-uuid.html`
- `https://www.postgresql.org/docs/18/pgstatstatements.html`
- `https://www.postgresql.org/docs/18/pgtrgm.html`
- `https://www.postgresql.org/docs/18/pgcrypto.html`
- `https://www.postgresql.org/docs/18/runtime-config-client.html#RUNTIME-CONFIG-CLIENT-PRELOAD`
