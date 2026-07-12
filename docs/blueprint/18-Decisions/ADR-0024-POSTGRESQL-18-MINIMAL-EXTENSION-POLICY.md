---
document_id: ADR-0024
title: Adopt PostgreSQL 18 with a Minimal Extension Policy
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0003, ADR-0004, ADR-0023]
---

# ADR-0024 — Adopt PostgreSQL 18 with a Minimal Extension Policy

## Status

Proposed. The founder selected PostgreSQL 18 and explicitly prefers a small, necessary extension set over convenience-driven complexity.

## Context

The platform requires an authoritative relational database for tenant-scoped transactional data, ledgers, outbox records, audit, search, reporting, and recovery. PostgreSQL 18 provides native UUIDv7 generation, full-text search, JSONB, range types, generated columns, skip-scan improvements, and asynchronous I/O. Installing overlapping or background-worker extensions by default increases upgrade, security, managed-provider, restore, self-hosting, and operational risk.

## Options Considered

- PostgreSQL 18 with many preinstalled convenience extensions
- PostgreSQL 18 with no extensions
- PostgreSQL 18 with a minimal baseline and evidence-triggered additions
- An extension-rich PostgreSQL distribution as the platform database

## Decision

Select PostgreSQL major 18 with the latest approved security patch; 18.4 was current when this proposal was verified. Pin exact container/package versions and immutable image digests in implementation evidence.

The baseline is deliberately small:

1. `pg_stat_statements` is the only always-preloaded extension, for query planning/execution observability.
2. `pg_trgm` may be installed in an application database when an approved fuzzy/substring search path requires it and has index/query tests.
3. All other extensions are absent by default and require the trigger, owner, security/license/provider review, performance evidence, backup/restore evidence, rollback, and ADR/specification propagation defined in `docs/blueprint/02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md`.

Use PostgreSQL 18 native `uuidv7()` for time-ordered internal identifiers where the identifier policy selects UUIDv7. Do not install `uuid-ossp` or `pgcrypto` merely to generate UUIDs.

## Conditional Extension Classes

- **Prototype isolated:** `vector`/pgvector for a named semantic-retrieval prototype; `pg_durable` in a separate Labs database under ADR-0023.
- **Requirement triggered:** `btree_gist` for a proven exclusion-constraint need; `unaccent` for a verified language/search requirement; PostGIS for a governed geospatial capability.
- **External-evidence triggered:** pgAudit only when a named compliance/customer control cannot be satisfied by platform audit plus provider/database logs.
- **Deferred:** `pg_cron`, TimescaleDB, Citus, pg_partman, logical-replication extensions, and other background-worker or storage-engine extensions until measured requirements justify them.

## Consequences

### Positive

- Smaller database attack, upgrade, compatibility, and recovery surface
- Broad managed and self-hosted PostgreSQL portability
- Native PostgreSQL features remain the default
- Extension inventory is explicit, testable, reversible, and owned
- Fewer background workers compete with authoritative transactions

### Negative

- Some capabilities require application workers or explicit SQL rather than extension convenience.
- Adding an extension later requires evidence and migration work.
- `pg_stat_statements` needs shared memory, `shared_preload_libraries`, and a restart.
- Search teams must prove when trigram indexes are appropriate and manage their write/storage cost.

## Required Controls

- No `CREATE EXTENSION` permission for ordinary application roles.
- Migrations declare extension dependency and fail safely when unavailable.
- Record extension name, version, license, source, owner, database/schema, privileges, preload/background workers, configuration, data objects, upgrade path, provider availability, backup/PITR/restore behavior, and removal plan.
- Restrict `pg_stat_statements` views/reset functions and prevent raw sensitive literals in SQL.
- Test each extension on Bun and Node application paths only where application behavior can differ.
- Rehearse PostgreSQL minor/major upgrades, backup, PITR, failover, replica, and self-hosted installation with the exact allowlist.
- An extension never bypasses domain table ownership, tenant scope, application commands, outbox, reversal/compensation, privacy, or audit rules.

## Migration and Rollback

Start from the official PostgreSQL 18 image/package at the approved patch and enable only `pg_stat_statements`. Add `pg_trgm` through an idempotent, owned migration when the first approved search index is implemented. Conditional extensions begin in isolated prototype environments. Rollback removes dependent application behavior and objects before the extension; an extension is not considered reversible merely because `DROP EXTENSION` exists.

## Validation

- PostgreSQL 18.4 security-patched image/package and digest record
- `uuidv7()` identifier and ordering tests
- `pg_stat_statements` overhead, privacy, privilege, retention/reset, and observability tests
- `pg_trgm` relevance, collation, GIN/GiST, write amplification, size, and fallback tests
- Extension-free restore plus baseline-extension restore
- Managed, dedicated, and self-hosted compatibility matrix
- Major/minor upgrade and rollback rehearsal

## References

- `docs/blueprint/02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/POSTGRESQL_18_AND_EXTENSION_VERIFICATION-2026-07-12.md`
- `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Founder | Complexity and baseline | Proposed direction | 2026-07-12 | PostgreSQL 18; necessary extensions only |
| Data architecture | Integrity and ownership | Pending | | |
| Security | Extension and privilege surface | Pending | | |
| Operations | Upgrade, HA, and recovery | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial proposal |
