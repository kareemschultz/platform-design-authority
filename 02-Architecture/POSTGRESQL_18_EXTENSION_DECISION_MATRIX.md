---
document_id: PDA-ARC-019
title: PostgreSQL 18 Extension Decision Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0003, ADR-0004, ADR-0023, ADR-0024]
---

# PostgreSQL 18 Extension Decision Matrix

## Outcome

PostgreSQL 18 is the platform baseline. Keep the default close to upstream PostgreSQL: preload `pg_stat_statements`, add `pg_trgm` only with the first approved fuzzy-search index, and require a named trigger for everything else.

## Extension Matrix

| Capability/extension | Initial disposition | Trigger | Main risk/control | Fallback |
|---|---|---|---|---|
| PostgreSQL 18 core | Required | Platform database | Track current security patch; pin digest | Supported PG18 deployment |
| `pg_stat_statements` | Baseline/preloaded | Every persistent environment | Shared memory/restart; restrict views and resets; measure overhead | Provider query insights plus logs, with reduced portability |
| `pg_trgm` | First approved search use | Fuzzy names, products, parties, references, or substring search with measured need | GIN/GiST size/write cost and collation behavior | Full-text, normalized prefix index, external search projection |
| Native `uuidv7()` | Prefer core, not extension | Time-ordered opaque ID policy | Time information is encoded; never expose chronology-sensitive IDs blindly | App-generated approved UUID/opaque ID |
| `vector` / pgvector | Isolated prototype | Named semantic-retrieval requirement and evaluation set | External extension, index/recall/upgrade cost, non-authoritative results | PostgreSQL lexical search; provider-neutral external vector projection |
| `btree_gist` | Requirement-triggered | Exclusion constraint needs scalar equality plus ranges | Additional opclasses/index cost | Explicit constraint/locking strategy |
| `unaccent` | Requirement-triggered | Verified language/search behavior | Linguistic correctness and immutable-index caveats | Application normalization or search projection |
| PostGIS | Industry/capability-triggered | Spatial topology, distance, containment, or geospatial indexing | Large surface, specialized upgrades and data | Basic coordinates plus external/geospatial service until justified |
| pgAudit | External-control-triggered | Named auditor/customer requirement not met by existing audit/logs | Log volume, secrets/PII, performance, operations | Platform audit + PostgreSQL/provider logs |
| `pgcrypto` | Not default | Specific reviewed database cryptographic function | Key handling and false database-encryption assumptions | Application/KMS crypto; core UUID functions |
| `uuid-ossp` | Do not install by default | Legacy UUID algorithm interoperability only | Redundant for UUIDv4/v7 | PostgreSQL core UUID functions |
| `citext` | Do not install by default | Only after collation/Unicode comparison proves benefit | Locale/collation semantics and hidden normalization | Explicit normalized columns and indexes |
| `pg_cron` | Deferred | Database-only schedule proven simpler than application scheduler | Background scheduling, failover, timezone, managed availability | Application scheduler/worker |
| `pg_durable` | Separate Labs only | ADR-0023 prototype | Pre-1.0 background worker in authoritative failure domain | Application worker, Temporal, `pg_cron` |
| pg_partman | Deferred | Measured partition count/maintenance burden | Background maintenance and upgrade surface | Native declarative partitioning and owned jobs |
| TimescaleDB | Not initial | Time-series workload exceeds core evidence | Storage engine/provider/license/upgrade coupling | Native partitioning, indexes, aggregates |
| Citus | Not initial | Measured scale requires distributed PostgreSQL | Distribution, transaction, operations, provider coupling | Vertical scale, partitioning, replicas, extraction |
| Logical replication extensions | Deferred | Core logical replication cannot meet a named topology | Conflict, data-loss, upgrade, security complexity | PostgreSQL core replication and outbox |

## Native PostgreSQL 18 Before Extension Rule

Use core PostgreSQL first for:

- UUIDv4 and UUIDv7
- full-text search
- JSONB and generated columns
- range and multirange types
- declarative partitioning
- logical replication
- row-level security
- `LISTEN`/`NOTIFY` only for hints, never durable delivery
- B-tree, GIN, GiST, BRIN, hash, expression, and partial indexes

## Admission Checklist

An extension proposal identifies:

1. User/operational requirement and why PostgreSQL core or application code is insufficient.
2. Owner, lifecycle, exact version, license, source, supported PG18 patches, OS/architecture, and provider availability.
3. Required preload, background worker, superuser, schema, tables, functions, network, filesystem, and secrets.
4. Tenant, role, permission, audit, privacy, and domain-ownership behavior.
5. Performance, connection, WAL, replication, backup, PITR, failover, and restore impact.
6. Installation, upgrade, downgrade, rollback, removal, and corrupted/stuck-state runbooks.
7. Tests, observability, capacity limits, and a no-extension fallback.

## Environment Policy

- Local/CI use the same baseline extensions as production candidates, not a convenience-rich image.
- Labs extensions run in explicitly separate images/databases and never appear in the baseline migration set.
- Staging proves exact production extension versions and configuration.
- Self-hosted support declares which extensions are required, optional, or unsupported.

## References

- `https://www.postgresql.org/docs/18/`
- `https://www.postgresql.org/docs/18/functions-uuid.html`
- `https://www.postgresql.org/docs/18/pgstatstatements.html`
- `https://www.postgresql.org/docs/18/pgtrgm.html`
- `18-Decisions/ADR-0024-POSTGRESQL-18-MINIMAL-EXTENSION-POLICY.md`
