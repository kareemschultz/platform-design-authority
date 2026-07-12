---
document_id: ADR-0014
title: Isolate PII and Use Irreversible Pseudonymization for Valid Erasure
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0014 — Isolate PII and Use Irreversible Pseudonymization for Valid Erasure

## Context

The platform requires append-oriented financial, inventory, payroll, audit, stored-value, and operational records. It also requires privacy rights, including deletion or erasure where applicable. Many immutable records need to retain economic or legal facts while direct identifiers may no longer be necessary or lawful to retain.

A blanket destructive delete would corrupt ledgers, evidence, reconciliation, and legal retention. A blanket refusal to erase would violate the platform's privacy doctrine. The mechanism must be designed before first-slice schemas because identity placement determines whether erasure is practical.

## Options Considered

### Destructive deletion from all records

Rejected because it breaks legal and financial integrity, referential history, audit, and reconciliation.

### Crypto-shredding as the universal mechanism

Rejected as the sole mechanism. Destroying encryption keys can be useful for isolated sensitive payloads, but key scope, backups, indexes, derived data, and shared records make universal crypto-shredding difficult to prove and operate safely.

### PII isolation with irreversible pseudonymization

Separate mutable identity attributes from immutable business facts. Store stable subject references in ledgers and snapshots where possible. On a valid erasure action, remove or irreversibly pseudonymize non-retention-bound identifiers while retaining the minimum lawful business fact and an auditable privacy transformation record.

## Decision

Adopt PII isolation and irreversible pseudonymization as the default erasure architecture.

1. Direct identifiers are stored in governed Party, identity, contact, or protected-profile structures rather than copied into every ledger entry.
2. Immutable records reference opaque party or subject identifiers and retain only the minimum snapshot data required for the business, legal, fiscal, safety, or dispute purpose.
3. When erasure is approved, mutable PII is deleted, generalized, or replaced with irreversible pseudonyms according to record-class policy.
4. Legally required historical values remain only under a recorded retention basis and are hidden from ordinary use.
5. Derived systems—search, vectors, caches, analytics, webhooks, exports, AI logs, devices, and backups—receive deletion or pseudonymization instructions through a deletion journal.
6. Crypto-shredding may supplement this design for isolated encrypted payloads whose key scope and recovery behavior are proven.

## Non-Destructive Privacy Transformation

A privacy transformation is not treated as an ordinary correction of a posted business fact. It is a governed operation that:

- Preserves amounts, dates, product, tax, and transaction relationships required for integrity
- Removes or replaces direct and quasi-identifiers that no longer have a retention basis
- Records policy, authorization, scope, timestamp, and transformation version
- Prevents reverse lookup through a retained mapping unless a legal hold requires controlled retention

Append-only doctrine therefore permits privacy transformation of identity attributes while prohibiting alteration of economic meaning.

## Multi-Role Parties

Erasure is evaluated per role, purpose, tenant, record class, and legal basis. A Party that is both an erasable marketing prospect and a retention-bound employee is not globally deleted. The erasable role and unnecessary attributes are removed while retained roles remain restricted and purpose-limited.

## Backups

Backups are not rewritten record by record by default. A durable deletion journal and subject tombstone set must be re-applied after restore before the environment serves ordinary traffic. Backup retention and expiry remain documented.

## Consequences

### Positive

- Preserves ledger integrity
- Makes erasure technically feasible
- Reduces uncontrolled PII copying
- Supports proof of propagation
- Works across online, offline, analytical, and AI projections

### Negative

- Requires disciplined schema design and data classification
- Historical document snapshots require careful policy
- Multi-role and legal-hold cases remain operationally complex
- Complete anonymization may be impossible where law requires identifiable retention

## Required Controls

- Data-classification and record-retention registry
- Party and subject linkage contracts
- Deletion journal with idempotent target acknowledgements
- Search, vector, analytics, cache, and webhook purge contracts
- Offline-device purge lease, expiry, and non-returning-device policy
- Restore-time reapplication gate
- AI prompt, response, and evaluation retention classes
- Privacy case evidence without retaining erased source PII
- Tests proving identifiers cannot be reconstructed from ordinary platform data

## Validation

Validate with a multi-role person connected to CRM, Commerce, Workforce, Audit, Search, an offline device, a webhook delivery, and an AI interaction. Demonstrate role-scoped erasure, required retention, projection purge, backup restore, and evidence closure.