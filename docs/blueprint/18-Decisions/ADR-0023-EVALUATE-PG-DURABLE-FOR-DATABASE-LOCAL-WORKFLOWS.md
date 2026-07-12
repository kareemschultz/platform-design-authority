---
document_id: ADR-0023
title: Evaluate pg_durable for Database-Local Workflows Without Replacing Temporal
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0002, ADR-0003, ADR-0004, ADR-0024]
---

# ADR-0023 — Evaluate pg_durable for Database-Local Workflows Without Replacing Temporal

## Status

Proposed Platform Labs evaluation. No pilot or production use is authorized.

## Context

Microsoft's open-source `pg_durable` extension executes checkpointed SQL workflow graphs through a PostgreSQL background worker. It supports sequencing, parallel branches, conditions, timers, schedules, signals, retries, and SQL-visible state. Version 0.2.3 supports PostgreSQL 17 and 18 on AMD64, requires `shared_preload_libraries`, and publishes an evaluation-only container.

The platform currently expects lightweight jobs initially and Temporal when durable timers, retries, compensation, long-running coordination, or heterogeneous activities justify it. A database-local option could reduce infrastructure for SQL-centric maintenance and data workflows, but it also moves orchestration load and failure into the authoritative database.

## Options Considered

- Replace Temporal and application workers with `pg_durable`
- Reject in-database orchestration entirely
- Evaluate `pg_durable` only for bounded database-local workflows
- Use `pg_cron` plus ordinary jobs for every database-local task

## Decision

Evaluate `pg_durable` only for bounded, database-local, non-first-slice workflows. Retain Temporal as the preferred candidate for heterogeneous, application-heavy, cross-domain, provider-facing, or compensation-sensitive orchestration.

Potential Labs cases:

- controlled materialized-view refresh and database maintenance;
- bounded ETL or projection rebuild inside one owning data boundary;
- search/index rebuild coordination;
- recovery-tool experiments using synthetic data;
- non-authoritative AI ingestion experiments.

Prohibited until a later accepted ADR:

- direct cross-domain table mutation;
- payments, stored value, Finance, payroll, inventory, cash, audit, or privacy corrections;
- authoritative business approvals implemented as raw `df.signal` plus SQL updates;
- provider calls or webhooks from database HTTP activities;
- replacement of the transactional outbox;
- workflows requiring implemented saga compensation, mature definition versioning, broad SDK activities, or managed-provider portability.

## Rationale

`pg_durable` is relevant but too early and too database-coupled for the platform workflow engine. Its compensation model is currently a proposal, its release image says evaluation-only, and arbitrary extensions/background workers are unavailable in many managed PostgreSQL offerings. The database is also the platform's authoritative failure domain and should not absorb unbounded orchestration load without evidence.

## Consequences

### Positive

- Tests a credible low-infrastructure option for SQL-centric work
- Workflow state participates in PostgreSQL backup and SQL observability
- May remove bespoke polling and retry plumbing for narrow cases
- Preserves Temporal for cases that need general-purpose activities and isolation

### Negative

- Adds a Rust/pgrx extension, preload/restart requirement, upgrade path, and PostgreSQL-major coupling
- Workflow execution competes with authoritative transactions for connections, CPU, WAL, storage, backup, and recovery
- Current packages and images are AMD64 only; managed-provider availability is uncertain
- Platform tenant, actor, permission, entitlement, correlation, audit, and data-classification context are not automatic

## Required Prototype Controls

- Use an isolated PostgreSQL 18 Labs instance with synthetic data and immutable image/package digest; PostgreSQL 17 support is vendor evidence, not a platform target.
- Compile with HTTP disabled and deny external provider calls.
- Map one platform tenant and actor context explicitly; prove that shared application roles cannot cross tenant state.
- Measure connection, CPU, WAL, table growth, backup, PITR, failover, cancellation, retry, duplicate effect, and noisy-neighbor behavior.
- Require idempotency at every externally visible boundary.
- Test extension upgrade, PostgreSQL major upgrade, restore, uninstall, stuck workflow repair, retention, and observability.
- Compare equivalent implementations with ordinary SQL/`pg_cron`, an application worker, and Temporal.

## Revisit Triggers

- Stable 1.0 release and production-supported images/packages
- Implemented and tested compensation/versioning semantics
- Supported target managed PostgreSQL providers
- Multi-architecture release artifacts
- Successful platform isolation, recovery, performance, and security prototype

## References

- `docs/blueprint/02-Architecture/WORKFLOW_RUNTIME_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/PG_DURABLE_VERIFICATION-2026-07-12.md`
- `docs/blueprint/01-Platform/JOBS_AND_SCHEDULING.md`
- `docs/blueprint/03-Business-Engines/WORKFLOW_ENGINE.md`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Data architecture | Database failure domain | Pending | | |
| Security | SQL, roles, HTTP, extension | Pending | | |
| Operations | HA, restore, upgrades | Pending | | |
| Domain architecture | Ownership and compensation | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial evaluation proposal |
| 0.2.0 | 2026-07-12 | Platform Design Authority | Added explicit prohibitions, evidence gates, and operational review details while retaining Labs-only status |
