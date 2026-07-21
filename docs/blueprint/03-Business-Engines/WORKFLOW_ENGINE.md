---
document_id: PDA-ENG-002
title: Workflow Engine
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
related_adrs: [ADR-0023]
---

# Workflow Engine

## Purpose

Provide a reusable engine for long-running, multi-step business processes involving state, deadlines, human tasks, automated steps, approvals, retries, and compensation.

## Core Capabilities

- Versioned workflow definitions
- States, transitions, conditions, and timers
- Human and automated tasks
- Parallel, sequential, and conditional branches
- Wait states, escalations, and service-level timers
- Compensation and cancellation
- Instance history, visualization, and diagnostics
- Reusable subflows and templates

## Rules

1. Workflow definitions are immutable once instances depend on them; changes create new versions.
2. Every workflow instance carries tenant, actor, entitlement, correlation, and audit context.
3. Human tasks enforce current permissions at execution time.
4. Automated steps use explicit service identities and idempotency.
5. Failures, retries, timeouts, cancellation, and compensation must be defined.
6. Workflow state does not replace authoritative domain state.
7. Domain actions occur through published commands, never direct data mutation.
8. Workflow runtime selection is an infrastructure concern; SQL, Temporal, or application-worker execution cannot bypass these engine rules.
9. `pg_durable` is Labs-only for bounded database-local work and cannot implement cross-domain or consequential business workflows until separately accepted.
10. A shared human-task presentation (a cross-domain review queue or inbox aggregating tasks from multiple owning domains) supports assign, accept, delegate, snooze, and escalate interactions with explicit SLA effects; previews a source-domain command and reauthorizes against the current record version before executing it; and never copies a source domain's business payload as new authority — the shared surface aggregates and assigns, it does not decide. This elaborates Rules 3 and 7 for the multi-domain case and adopts AIR-006 ("shared inbox/review mechanics," `docs/blueprint/19-Competitive-Research/ADOPT_IMPROVE_REJECT_REGISTER.md`) and `CROSS_DOMAIN_REVIEW_QUEUE_STANDARD.md`'s (`PDA-CIR-085`) required-interactions and prohibited-design lists.
11. A long-running workflow instance's lifecycle follows a reusable grammar: resolve context (tenant, organization, role, entitlement) → capture intent (durable command/draft identity, validated input) → preview (diff, affected records, uncertainty) → approve when required (accountable reviewer, scope, reason) → commit in the owning domain (reauthorize at execution, write authoritative facts) → propagate (projections/notifications declare freshness) → recover (retry idempotently, reconcile, compensate). This names the sequence already implicit in this document's states and Rules 1-9, per `CROSS_DOMAIN_WORKFLOW_PATTERNS.md`'s (`PDA-CIR-083`) reusable workflow grammar.

## States

Draft, Active, Paused, Completed, Failed, Cancelled, Compensating, and Compensated.

## Quality Gates

- Version migration tests
- Duplicate and retry tests
- Timer and escalation tests
- Permission-change tests
- Compensation tests
- Long-running recovery tests
