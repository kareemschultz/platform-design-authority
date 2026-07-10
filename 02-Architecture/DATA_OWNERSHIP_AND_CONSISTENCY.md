---
document_id: PDA-ARC-006
title: Data Ownership and Consistency
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Data Ownership and Consistency

## Purpose

Define authoritative ownership, consistency boundaries, projections, replication, lifecycle, and integrity rules for platform data.

## Ownership Rules

1. Every authoritative entity has exactly one owning domain.
2. Only the owning domain may define lifecycle, invariants, and direct mutation rules.
3. Other domains access authoritative data through published contracts or consume approved projections.
4. Shared master data requires a named owner and governed extension model.
5. Reporting, search, analytics, integration, and offline copies are non-authoritative unless explicitly designated otherwise.

## Data Categories

- Master data
- Transaction data
- Ledger data
- Reference data
- Configuration data
- Audit data
- Analytical and derived data
- Cached and offline data
- Documents and unstructured content

## Consistency Levels

### Strong Consistency

Required within a domain when invariants must succeed or fail together.

### Eventual Consistency

Allowed for search, analytics, notifications, projections, and cross-domain reactions when delay is visible or operationally acceptable.

### Reserved Consistency

Used when stock, capacity, funds, or other scarce resources must be temporarily reserved before final confirmation.

### Human-Reconciled Consistency

Used only where offline operation, external systems, or conflicting legal records make automatic resolution unsafe.

## Ledger Rules

Financial, inventory, payroll, settlement, and audit ledgers must preserve history. Corrections use reversals, adjustments, or superseding entries rather than destructive edits.

## Concurrency

Use optimistic concurrency, idempotency, unique constraints, and explicit state transitions. Silent last-write-wins is prohibited for consequential records.

## Replication and Projection Requirements

Every derived copy must document:

- Authoritative source
- Purpose and permitted use
- Freshness expectation
- Rebuild mechanism
- Retention and deletion propagation
- Security classification
- Conflict or lag behavior

## Data Lifecycle

Creation, activation, suspension, archival, retention, legal hold, export, anonymization, and deletion must be defined by entity class and jurisdiction.

## Quality Gates

- Ownership catalog validation
- Cross-domain write prevention
- Concurrency and duplicate tests
- Projection rebuild and lag tests
- Ledger reversal tests
- Retention and deletion propagation tests
