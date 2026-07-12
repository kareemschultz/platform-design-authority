---
document_id: PDA-PLT-009
title: Jobs and Scheduling
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0023]
---

# Jobs and Scheduling

## Purpose

Define how deferred, recurring, long-running, retryable, and asynchronous work is created, executed, monitored, cancelled, and recovered.

## Job Types

- Immediate background job
- Scheduled one-time job
- Recurring job
- Event-triggered job
- Long-running workflow step
- Import, export, reconciliation, or migration job
- Tenant maintenance job
- AI or automation task
- Offline synchronization task

## Required Job Metadata

- Job identifier and type
- Tenant and organization context
- Requesting actor and source
- Correlation and causation identifiers
- Entitlement and authorization context or revalidation policy
- Priority, queue, schedule, and expiry
- Idempotency key
- Retry and timeout policy
- Progress, result, and failure details
- Cancellation and compensation behavior
- Data classification and retention

## Rules

1. Jobs must be idempotent or explicitly guarded against duplicate effects.
2. Authorization and entitlement must be captured and revalidated according to action risk and execution delay.
3. Recurring schedules must define time zone, daylight-saving behavior, missed-run behavior, overlap policy, and end conditions.
4. Long-running jobs must expose progress, status, expected duration where possible, and user-visible failure guidance.
5. Retries must not repeat unsafe external or financial effects without idempotency protection.
6. Cancellation must define whether work stops immediately, finishes the current step, or triggers compensation.
7. Jobs must preserve tenant isolation in queues, workers, logs, files, and results.
8. Resource-heavy jobs require quotas, concurrency controls, and fair scheduling.

## Job States

- Created
- Queued
- Scheduled
- Running
- Waiting for approval or dependency
- Retrying
- Succeeded
- Partially succeeded
- Failed
- Cancelled
- Expired
- Compensating
- Compensated

## Administrative Experience

Authorized users need job search, progress, retries, cancellation, failure details, dependency inspection, downloadable results, and audit history. Platform operators need queue depth, latency, worker health, stuck-job detection, and tenant-level throttling.

## Reliability Patterns

- Durable queues
- Lease or visibility timeouts
- Idempotency records
- Checkpointing for long jobs
- Dead-letter queues
- Outbox and inbox patterns
- Backpressure and circuit breaking
- Compensation for multi-step work

## Runtime Routing

- Use an application worker for bounded background work and ordinary provider adapters.
- Use the Workflow Engine plus the selected general-purpose durable runtime for long-lived, cross-domain, provider-facing, human-task, or compensation-sensitive processes.
- Evaluate `pg_durable` only for bounded database-local Labs work under ADR-0023.
- Runtime choice does not relax required job metadata, authorization revalidation, tenant isolation, idempotency, compensation, or audit.

## Testing

- Duplicate delivery and retry tests
- Time-zone and recurrence tests
- Cancellation and timeout tests
- Worker crash and recovery tests
- Tenant fairness and isolation tests
- Authorization expiry tests
- Partial-failure and compensation tests
