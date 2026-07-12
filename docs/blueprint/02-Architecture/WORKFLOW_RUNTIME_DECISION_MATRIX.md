---
document_id: PDA-ARC-018
title: Workflow Runtime Decision Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0003, ADR-0004, ADR-0023, ADR-0024]
---

# Workflow Runtime Decision Matrix

## Outcome

Use ordinary application jobs for bounded short work, retain Temporal as the preferred durable general-purpose candidate, and evaluate `pg_durable` only for narrow database-local Labs workloads.

| Criterion | Weight | Application worker | Temporal | pg_durable 0.2.3 | pg_cron + SQL |
|---|---:|---:|---:|---:|---:|
| Production maturity | 15 | 4 | 5 | 2 | 5 |
| Durable timers/signals/retries | 15 | 2 | 5 | 4 | 2 |
| Compensation/versioning | 15 | 2 | 5 | 1 | 1 |
| Heterogeneous activities/SDKs | 10 | 4 | 5 | 2 | 1 |
| Database-local simplicity | 10 | 3 | 2 | 5 | 5 |
| Failure/resource isolation | 10 | 4 | 5 | 1 | 2 |
| Managed/self-host portability | 10 | 5 | 3 | 2 | 3 |
| Tenant/authority integration | 10 | 5 | 4 | 2 | 2 |
| Operational overhead | 5 | 4 | 2 | 4 | 5 |
| **Weighted total / 500** | **100** | **350** | **425** | **245** | **275** |

## Workload Routing

| Workload | Preferred path | pg_durable relevance |
|---|---|---|
| Immediate bounded application job | Application worker | Low |
| Transactional event publication | Outbox dispatcher | None; do not replace outbox |
| Database maintenance/materialized view refresh | `pg_cron` or pg_durable prototype | High |
| Database-local ETL/projection rebuild | Application worker or pg_durable prototype | Medium/high after load tests |
| Human business approval | Workflow Engine + application commands | Signals may be prototyped, never direct SQL authority |
| Payment/provider/webhook orchestration | Temporal/application adapter | Low; database HTTP is prohibited initially |
| Cross-domain business process | Workflow Engine + Temporal candidate | Low; direct table access violates ownership |
| Financial/inventory/payroll compensation | Domain commands and accepted workflow runtime | Not until compensation is implemented and proven |
| AI document ingestion | Application pipeline; pg_durable Labs comparison | Medium for database-local non-authoritative stages |
| Recovery and repair | Explicit runbook/tool with approvals | Labs only with synthetic restore exercises |

## Video Claim Disposition

| Claim | Disposition |
|---|---|
| Crash-proof durable steps | Substantially supported; still requires platform crash/failover/PITR evidence |
| Replaces queues, Temporal, and workers | Overbroad; only credible for SQL-shaped database-local workflows |
| Sequences, parallelism, signals | Verified |
| Scheduling through `df.weight` | Incorrect name; current API is `df.wait_for_schedule()` |
| PostgreSQL 17 Docker image | Verified, and PG18 is also published; both are evaluation-only and AMD64 |
| Human approval | Mechanically possible; platform permission revalidation, audit, tenant context, immutable definitions, and domain commands remain missing |
| Hundreds of lines reduced to SQL | Plausible for narrow workflows; does not remove security, testing, operations, idempotency, or domain-boundary work |

## Non-Negotiable Boundaries

- Workflow state never replaces authoritative domain state.
- Workflow SQL cannot mutate another domain's tables.
- Human signals revalidate actor, tenant, permission, entitlement, expiry, and segregation of duties in the application layer.
- External effects require idempotency and reconciliation.
- Database restore must not silently repeat external effects.
- Database workload quotas protect transactional SLOs.

## Prototype Exit Criteria

- A PostgreSQL 18 pinned evaluation build with HTTP disabled
- Tenant/shared-role isolation and RLS tests
- Crash, restart, failover, PITR, duplicate, cancellation, timeout, and stuck-instance tests
- Connection, CPU, memory, WAL, table-growth, backup, and restore measurements
- Upgrade/uninstall and PostgreSQL-major migration
- Equivalent worker/Temporal/pg_cron comparison
- Security, Data, Operations, and domain-ownership disposition

## Official References

- `https://microsoft.github.io/pg_durable/`
- `https://github.com/microsoft/pg_durable`
- `https://github.com/microsoft/pg_durable/releases/tag/v0.2.3`
