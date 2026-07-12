---
document_id: PDA-ARC-006
title: Data Ownership and Consistency
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0003, ADR-0007, ADR-0013, ADR-0014]
---

# Data Ownership and Consistency

## Purpose

Define authoritative ownership, consistency boundaries, projections, replication, lifecycle, privacy transformation, and integrity rules for platform data.

## Ownership Rules

1. Every authoritative entity has exactly one owning domain or named platform service.
2. Only the owner may define lifecycle, invariants, and direct mutation rules.
3. Other domains access authoritative data through published contracts or consume approved projections.
4. Shared master data requires a named owner and governed extension model.
5. Reporting, search, analytics, integration, webhook, and offline copies are non-authoritative unless explicitly designated otherwise.
6. Customer stored value is Commerce-owned; Payment orchestrates tender and Finance owns accounting interpretation.
7. Transactional security risk and enterprise GRC risk remain distinct ownership models.

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
- Personal and identity data
- Privacy deletion and transformation journal

## Consistency Levels

### Strong Consistency

Required within a domain when invariants must succeed or fail together.

### Eventual Consistency

Allowed for search, analytics, notifications, webhooks, projections, and cross-domain reactions when delay is visible or operationally acceptable.

### Reserved Consistency

Used when stock, capacity, funds, stored value, or other scarce resources must be temporarily reserved before final confirmation.

### Human-Reconciled Consistency

Used only where offline operation, external systems, or conflicting legal records make automatic resolution unsafe.

## Ledger Rules

Financial, inventory, payroll, stored-value, settlement, and audit ledgers preserve economic and evidentiary history. Corrections use reversals, adjustments, or superseding entries rather than destructive edits.

Privacy transformation under ADR-0014 is a permitted non-destructive operation class. It may delete, generalize, redact, restrict, or irreversibly pseudonymize identity attributes while preserving amounts, dates, accounts, products, tax, sequence, and economic meaning. The transformation itself is audited and does not masquerade as an ordinary business correction.

## PII Placement

- Direct identifiers should be isolated in Party, identity, contact, or protected-profile structures.
- Immutable records store opaque references and only the minimum required historical snapshot.
- A copied snapshot must declare its retention purpose and transformation behavior.
- Secrets and authentication factors are never copied into domain records.

## Concurrency

Use optimistic concurrency, idempotency, unique constraints, and explicit state transitions. Silent last-write-wins is prohibited for consequential records.

## Replication and Projection Requirements

Every derived copy documents:

- Authoritative source
- Purpose and permitted use
- Freshness expectation
- Rebuild mechanism
- Retention, erasure, and tombstone propagation
- Security classification
- Conflict or lag behavior
- Restore behavior and deletion-journal watermark

## Data Lifecycle

Creation, activation, suspension, archival, retention, legal hold, export, anonymization, pseudonymization, restriction, and deletion are defined by entity class, role, purpose, tenant, and jurisdiction.

Backup restoration must reapply privacy transformations newer than the restored backup before ordinary traffic is permitted.

## Quality Gates

- Ownership catalog validation
- Cross-domain write prevention
- Concurrency and duplicate tests
- Projection rebuild and lag tests
- Ledger reversal tests
- Privacy transformation without economic mutation
- Multi-role Party erasure tests
- Retention, tombstone, and deletion propagation tests
- Backup restore and deletion-journal reapplication