---
document_id: PDA-PLT-023
title: Sequence and Numbering Service
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Sequence and Numbering Service

## Purpose

Define the platform primitive for generating human-readable business references that remain unique, auditable, configurable, jurisdiction-aware, and safe during offline or distributed operation.

## Architectural Position

Internal record identity uses opaque globally unique identifiers. The Sequence and Numbering Service issues human-facing references such as orders, invoices, receipts, purchase orders, employees, shipments, cases, and work orders.

Domains own the meaning and lifecycle of their records. The service owns allocation policy and issued-reference evidence.

## Requirements

- Tenant, legal-entity, branch, location, register, device, and document-type scopes
- Configurable prefixes, suffixes, date or fiscal-period segments, and padding
- Collision prevention
- Atomic online allocation
- Offline range leasing
- Gap and void policy
- Fiscal-year and period rollover
- Jurisdiction-specific immutable numbering
- Migration from legacy sequences
- Preview and validation
- Audit and reconciliation
- High availability without weakening legal controls

## Sequence Definition

A sequence definition includes:

- Sequence ID and stable key
- Tenant and optional organization scope
- Owning domain and record type
- Pattern template
- Counter scope
- Increment and starting value
- Reset policy
- Fiscal calendar reference
- Allocation mode
- Gap policy
- Void policy
- Offline-lease policy
- Effective dates and version
- Status
- Jurisdiction and legal constraints

## Example Pattern

```text
{prefix}-{fiscalYear}-{locationCode}-{counter:6}
```

Example output:

```text
INV-2026-GEO-000123
```

## Allocation Modes

### Strict Online

Every number is allocated transactionally by the central service. Use where law or business policy requires contiguous or centrally controlled issuance.

### Hi-Lo or Range Lease

A device, edge node, or worker receives a signed range for offline issuance. Each lease declares scope, start, end, expiry, device, operator constraints, and reconciliation policy.

### Provisional Reference

An offline client creates a clearly provisional reference that is replaced or supplemented by an official number after synchronization. Use only where customer and legal documents may tolerate it.

### External Number

A trusted external fiscal device, government service, marketplace, or partner allocates the official number. The platform records the external authority, result, and verification.

### WS2 controlled-prototype selection

PR5 implements Strict Online allocation only through runtime-neutral `@meridian/platform-numbering` and owner-specific `@meridian/persistence-platform-numbering-postgres`. A definition is tenant-scoped and uses a fixed prefix, increment of one, fixed decimal padding, no automatic reset, and one active version. Allocation locks the tenant/definition row, records the immutable allocation and `platform.sequence.number-issued.v1` in the same PostgreSQL transaction, then advances the counter. The request fingerprint binds tenant, definition, source command, and optional business-record reference to the idempotency key.

Retrying identical input returns the existing reference without advancing the counter. Reusing an idempotency key with different input fails closed. Concurrent callers cannot issue the same value. A transaction failure, including an outbox append failure, rolls back both allocation and counter advancement. Definition administration, reset, void, rollover, legal/fiscal patterns, range leasing, device signing, and multi-region allocation remain unimplemented gates and may not be inferred from the online prototype.

## Offline Range Leasing

A range lease must include:

- Lease ID
- Sequence definition and version
- Tenant, location, register, and device scope
- Start and end values
- Next expected value
- Issued and unused values
- Expiry
- Signature or integrity protection
- Revocation state
- Reconciliation state

Rules:

1. Leases cannot overlap within the same sequence scope.
2. Devices cannot extend leases locally.
3. Expired unused values follow the configured gap policy.
4. Issued references remain valid even if synchronization is delayed, subject to legal policy.
5. Device replacement and clock changes must not create duplicate references.
6. Reconciliation records missing, duplicated, voided, and out-of-range values.

## Gap and Void Policy

A sequence declares whether gaps are:

- Allowed without explanation
- Allowed only with recorded reason
- Represented by explicit void records
- Prohibited except through an external authority

The platform must never silently renumber already-issued invoices, receipts, payslips, tax documents, or other legally significant records.

## Idempotency

Allocation requests include an idempotency key tied to the business command. Retrying the same command returns the same allocated reference rather than consuming another number.

## Migration

Legacy migration must support:

- Imported historical references
- Next-counter seeding
- Duplicate detection
- Preserving original format
- Mapping multiple legacy sequences
- Cutover date and ownership
- Rollback before live issuance

Imported references are marked as imported and are not regenerated.

## Security and Permissions

Separate permissions for:

- Viewing definitions
- Previewing formats
- Creating or changing definitions
- Resetting or reseeding counters
- Leasing ranges
- Voiding values
- Reconciling devices
- Overriding allocation failures

Changing a live legally significant sequence requires approval and audit.

## Events

- `platform.sequence.definition-created.v1`
- `platform.sequence.definition-changed.v1`
- `platform.sequence.number-issued.v1`
- `platform.sequence.range-leased.v1`
- `platform.sequence.range-revoked.v1`
- `platform.sequence.number-voided.v1`
- `platform.sequence.range-reconciled.v1`
- `platform.sequence.rollover-completed.v1`

## Failure Handling

The service must define behavior for:

- Database unavailability
- Duplicate or stale idempotency keys
- Exhausted lease
- Fiscal-period closure
- Pattern change during an active lease
- Device theft or compromise
- External fiscal authority outage
- Counter corruption or manual tampering
- Multi-region split-brain risk

Fail closed for legally strict numbering unless an approved continuity mode exists.

## Validation Scenarios

- Two online registers issue references concurrently without collision.
- Ten offline registers receive non-overlapping ranges and reconcile correctly.
- A retried sale receives the same receipt number.
- A fiscal-year rollover does not invalidate active records or create duplicates.
- A stolen device's unused range is revoked and reconciled.
- A jurisdiction requiring explicit void documents receives a complete gap explanation.

## PR5 Persistence Classification

`platform_number_sequence` owns the tenant-scoped definition and current counter. `platform_number_allocation` owns immutable issued-reference and idempotency evidence. Neither table grants authority to create or change the numbered business record. PDA-DAT-019 defines every PR5 field before migration generation; RR-007 and production retention remain open.

## Change Log

- 0.2.0 (2026-07-16): Selected the bounded Strict Online PR5 implementation, atomic allocation-plus-outbox boundary, fingerprinted idempotency, concurrency and rollback proof, concrete table ownership, and explicit offline/administration deferrals.
