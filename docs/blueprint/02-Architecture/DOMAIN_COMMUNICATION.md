---
document_id: PDA-ARC-003
title: Domain Communication
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Domain Communication

## Purpose

Define how domains collaborate without sharing ownership, duplicating rules, or creating hidden coupling.

## Communication Modes

### Synchronous Query

Used when the caller needs an immediate authoritative answer. Queries must be read-only, time-bounded, permission-aware, and resilient to failure.

### Synchronous Command

Used when an immediate business decision is required from the owning domain. Commands must be idempotent where retries are possible.

### Asynchronous Event

Used to announce completed facts and allow independent downstream reactions.

### Workflow Orchestration

Used for long-running, multi-domain processes requiring state, approvals, retries, deadlines, and compensation.

### Read Projection

Used when a domain needs locally optimized read data owned elsewhere. Projections remain non-authoritative and declare freshness.

## Rules

1. A domain may not directly update another domain’s tables or internal objects.
2. Cross-domain contracts must use canonical business language and stable identifiers.
3. Commands must name intent; events must describe completed facts.
4. Synchronous chains should be short and must define timeout and failure behavior.
5. Event consumers must be idempotent and tolerate compatible schema evolution.
6. Cross-domain workflows must define ownership of the overall process and each step.
7. Sensitive data should be referenced or minimized rather than copied into messages unnecessarily.
8. Correlation and causation identifiers are mandatory for consequential cross-domain work.

## Consistency Patterns

- Reservation before confirmation
- Pending state followed by finalization
- Eventual projection update
- Compensation or reversal
- Human reconciliation for irreducible conflicts

## Prohibited Patterns

- Shared database tables with ambiguous ownership
- Direct repository access across domains
- Unversioned internal HTTP calls treated as private shortcuts
- Events used as hidden commands
- Long synchronous chains across many domains
- Silent fallback to stale data for consequential decisions

## Documentation Requirements

Every cross-domain dependency must identify producer, consumer, contract, consistency expectation, failure behavior, permissions, entitlement impact, and observability.
