---
document_id: PDA-APP-015
title: pg_durable Verification 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
---

# pg_durable Verification — 2026-07-12

## Scope

Verify the supplied video summary against Microsoft primary sources and identify platform relevance. This is dated research, not production approval.

## Release and Distribution

- Repository: `microsoft/pg_durable`
- Latest release observed: `v0.2.3`, published 2026-06-17
- License: PostgreSQL License
- PostgreSQL: 17 and 18
- Packages/images: AMD64 Debian packages and GHCR images
- Required configuration: `shared_preload_libraries`, PostgreSQL restart, then `CREATE EXTENSION pg_durable`
- Published image status: explicitly for evaluation/learning, not production
- Latest release fixed correctness and resource-safety defects found in a reliability audit, including condition evaluation, graph-depth/node-count limits, and connection timeout

## Architecture

`pg_durable` is a pgrx extension with a PostgreSQL background worker hosting Microsoft's Duroxide runtime. Workflow graphs and execution history live in PostgreSQL tables. Each SQL activity runs as a checkpointed step rather than one long transaction. The current architecture documents one persistent background worker and table-based orchestration/activity queues.

## Verified Features

- Sequential, parallel join, race, condition, loop, sleep, and named-result operations
- Durable checkpoint and recovery after crash/restart/failover claims
- Status, results, cancellation, history, and SQL observability
- Cron-style waiting through `df.wait_for_schedule()`
- External signals and timeouts through `df.wait_for_signal()` and `df.signal()`
- Per-role usage grants and RLS over extension instance data
- SQL execution as the submitting database role
- Optional outbound HTTP compiled behind security features and runtime privilege checks
- One target database per workflow invocation; cross-database workflow composition is not supported directly

## Corrections to the Video Summary

- The scheduling function is `df.wait_for_schedule()`, not `df.weight`.
- The release artifacts support PostgreSQL 17 and 18, not only 17.
- The Docker images are evaluation-only and currently AMD64.
- “No external services” is accurate, but execution still uses a background worker inside the PostgreSQL failure and resource domain.
- It may replace bespoke queue/worker plumbing for SQL-shaped workflows; it does not generally eliminate the need for Temporal or application workers.

## Material Limitations and Risks

- Version 0.2.3 is pre-1.0 and recently underwent correctness/safety fixes.
- Saga compensation is documented as a proposal, not verified implemented functionality.
- The SQL-shaped model is unsuitable for arbitrary SDK/application logic and heterogeneous workflows.
- Installation requires extension/preload privileges unavailable on many managed PostgreSQL products.
- Workflows consume authoritative database CPU, connections, WAL, storage, backup, restore, and failover capacity.
- PostgreSQL role/RLS isolation does not automatically carry platform tenant, actor, permission, entitlement, correlation, classification, or audit context.
- HTTP egress policy is selected at Rust build time. Released packages allow selected Azure domains; unrestricted mode is documented for local development only.
- External effects remain vulnerable to duplicate/replay consequences unless idempotent and reconciled, especially after PITR.
- Workflow-definition immutability, migration/versioning, compensation, tenant fairness, dead-letter operations, and product administration require platform evidence.

## Relevant Platform Uses

Potential Labs value exists for database maintenance, bounded ETL, projection/search rebuilds, and non-authoritative data/AI pipelines. It is not currently appropriate for payment, stored value, Finance, inventory, payroll, cash, audit/privacy corrections, cross-domain workflows, provider calls, or the transactional outbox.

## Required Prototype

Compare one database-local maintenance or projection workflow across ordinary SQL/`pg_cron`, an application worker, `pg_durable`, and Temporal where applicable. Use synthetic data, disable HTTP, pin artifacts, and measure correctness, isolation, performance, WAL, backup/PITR, failover, upgrade, uninstall, observability, and operator recovery.

## Official Sources

- `https://microsoft.github.io/pg_durable/`
- `https://github.com/microsoft/pg_durable`
- `https://github.com/microsoft/pg_durable/releases/tag/v0.2.3`
- `https://github.com/microsoft/pg_durable/blob/main/USER_GUIDE.md`
- `https://github.com/microsoft/pg_durable/blob/main/docs/ARCHITECTURE.md`
- `https://github.com/microsoft/pg_durable/blob/main/docs/http-security.md`
- `https://github.com/microsoft/pg_durable/blob/main/docs/spec-compensation.md`
- `https://github.com/microsoft/pg_durable/blob/main/docs/multi-database.md`
