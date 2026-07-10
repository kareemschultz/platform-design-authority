---
document_id: PDA-ENG-002
title: Workflow Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
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

## States

Draft, Active, Paused, Completed, Failed, Cancelled, Compensating, and Compensated.

## Quality Gates

- Version migration tests
- Duplicate and retry tests
- Timer and escalation tests
- Permission-change tests
- Compensation tests
- Long-running recovery tests
