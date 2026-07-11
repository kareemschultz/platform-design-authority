---
document_id: PDA-OPS-012
title: Problem Change Release and Data Repair Operations
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Problem, Change, Release, and Data Repair Operations

## Purpose

Define how recurring incidents, production changes, releases, migrations, and exceptional data repairs are governed.

## Problem Management

Recurring or severe incidents create a problem record with impact, timeline, root causes, contributing conditions, corrective actions, owner, deadline, regression tests, and verification.

A problem remains open until corrective actions are verified or explicitly accepted as residual risk.

## Change Classes and Approval Matrix

| Class | Examples | Minimum approval | Lead time | Required evidence |
|---|---|---|---:|---|
| Standard | Pre-approved low-risk dependency patch, documentation-only change, tested non-production config | Service owner or delegated reviewer | Same day | Automated tests, rollback or reversal, no customer impact |
| Normal | Feature release, backward-compatible API change, ordinary schema migration, provider config change | Service owner + independent reviewer | 2 business days | Tests, migration, observability, rollback, support notes |
| High Risk | Financial or stored-value logic, authorization, privacy, tenant isolation, breaking contract, destructive migration, region or provider change | Engineering owner + Architecture/Security/Privacy as applicable + release authority | 5 business days | Threat/data review, rehearsal, staged rollout, customer communication, incident coverage |
| Emergency | Active incident, critical vulnerability, provider shutdown, legal or safety requirement | Incident commander + accountable technical owner | Immediate | Incident record, narrow scope, monitoring, rollback, post-change review within 2 business days |

A change may be escalated based on customer impact, data classification, blast radius, reversibility, novelty, or exhausted error budget.

## Error-Budget Integration

SLO and workflow error budgets directly affect change authority:

- Healthy: normal release policy applies.
- More than 50% consumed before half the window: high-risk releases require reliability review.
- More than 75% consumed: freeze nonessential high-risk changes to the affected workflow.
- Exhausted: only remediation, security, legal, or incident-approved changes proceed until recovery is demonstrated.
- Repeated exhaustion: create a Problem record and capacity/reliability plan.

Emergency changes may proceed while exhausted but require stronger rollback and monitoring.

## Freeze Rules

Production freezes apply during:

- Active Severity 1 incident
- Critical financial or privacy reconciliation
- Unverified recovery after restore
- Major pilot cutover or accounting close window
- Declared customer change freeze
- Known provider instability affecting the release

Freeze exceptions require incident or executive release authority and a documented business reason.

## Change Record

Every change records:

- Owner and reviewers
- Class and risk rationale
- Affected services, tenants, environments, regions, providers, and data
- Dependencies and compatibility
- Test and security evidence
- Migration and backfill
- Observability and success thresholds
- Rollout cohorts
- Rollback, compensation, or forward-fix plan
- Customer and support communication
- Error-budget state
- Approval and timestamps

## Release Operations

Use immutable artifacts, staged rollout, health gates, tenant cohorts, feature controls, migration compatibility, rollback or compensation, and support readiness.

### Stages

1. CI evidence complete
2. Staging rehearsal
3. Internal or synthetic tenant
4. Pilot cohort
5. Limited tenant cohort
6. Broad release
7. Post-release observation

A release advances only when the prior stage meets declared health and business-correctness gates.

## Schema and Data Changes

- Prefer expand-and-contract.
- Separate long backfills from request transactions.
- Preserve old readers during the compatibility window.
- Measure locks, replication, and queue effects.
- Validate tenant-by-tenant counts and invariants.
- Do not remove old representation until rollback and delayed-client windows close.

## Data Repair

Data repair is exceptional and uses approved tools or scripts with:

- Named owner and independent reviewer
- Tenant and record scope
- Dry run and affected-count estimate
- Backup or recovery point
- Invariant checks
- Audit and correlation
- Idempotency
- Reconciliation
- Customer communication where appropriate
- Secure artifact retention
- Post-repair verification

Direct ad hoc database edits are prohibited except under documented emergency authority. Every emergency edit is captured afterward as a reproducible repair or migration, with evidence and root-cause follow-up.

## Post-Change Validation

Validate:

- Technical health
- User workflow completion
- Financial, inventory, stored-value, payment, and privacy invariants
- Queue and projection freshness
- Tenant isolation
- Error budget and latency
- Support contacts and incident signals

## Quality Gates

- Correct change classification
- Required approval present
- Error-budget policy applied
- Release checklist
- Migration rehearsal
- Repair simulation
- Rollback or compensation evidence
- Post-change validation
- Customer/support communication
- Problem-action tracking
