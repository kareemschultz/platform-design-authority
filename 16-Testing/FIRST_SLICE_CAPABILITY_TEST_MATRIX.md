---
document_id: PDA-TST-013
title: First Slice Capability Test Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# First Slice Capability Test Matrix

## Purpose

Define the mandatory test declarations for every capability listed in `registry/first-slice.json` and the synthetic Guyana retail tenant used to exercise them.

The generated matrix is `registry/first-slice-tests.json`.

Depth-default overrides are governed in `registry/capability-metadata.json`. The generator consumes those reviewed profiles; it does not infer that every dimension is required at every depth.

## Required Dimensions

Every first-slice capability declares all thirteen dimensions:

1. Happy-path behavior
2. Validation and denial
3. Tenant isolation
4. Permission and entitlement
5. Idempotency and duplicate handling
6. Concurrency and conflict
7. Event, job, or projection behavior
8. Audit and observability
9. Privacy and data classification
10. Offline and degraded behavior
11. Accessibility and responsive UX
12. Performance and capacity
13. Recovery, replay, and reconciliation

The generated registry currently supports only `required`. For a seam, `required` means contract, failure, and integration evidence at seam depth rather than full UI or load proof. Future overrides require an approved source, reason, owner, and generator support.

## Machine-Readable Shape

Each generated record includes:

- Capability ID
- First-slice depth: `full`, `prototype`, or `seam`
- Owning namespace
- Thirteen test dimensions
- Reasons for every `not-applicable` dimension and explanatory reasons for depth deferrals
- Required golden scenarios
- Evidence status
- Responsible owner
- Blocking defects

Generated defaults are a skeleton, not proof that tests exist.

## Synthetic Tenant Fixture

### Tenant

- Tenant: `Demerara Retail Test Group`
- Legal entity: `Demerara Retail Test Inc.`
- Base currency: GYD
- Secondary currency seam: USD
- Timezone: `America/Guyana`
- Language: English

### Locations

- Georgetown Main Store
- East Bank Store
- Offline Test Store
- Central Stock Location

### Devices and Registers

- Two online registers
- One intermittently connected tablet register
- One revoked device
- One scanner-enabled inventory device

### Users and Roles

- Cashier
- Store associate
- Store manager
- Inventory clerk
- Finance reviewer
- Tenant administrator
- Privacy administrator
- Support operator

Include denied-scope users and a second isolated tenant to test cross-tenant access.

### Catalog

- 5,000 ordinary products
- Variants, barcodes, units, categories, brands, tax categories, and discontinued products
- Duplicate barcodes and malformed rows for import tests
- Zero-rated, exempt, and standard-rated prototype examples
- Products with low stock, no stock, and negative-stock prohibition

### Inventory

- Opening stock across four locations
- Reservations
- Counts and variances
- Transfers in transit
- Damaged and quarantined stock
- Offline movements

### Commerce

- Cash sale
- Mixed-tender sale
- Provider request-to-pay
- Provider uncertainty
- Return to original tender
- Return to store credit
- Exchange with price difference
- Receipt reissue
- Safe drop and bank deposit
- Register variance

### Stored Value

- Anonymous gift card
- Registered store credit
- Partially redeemed instrument
- Suspended instrument
- Offline allowance
- Duplicate redemption attempt

### Privacy and Security

- Customer who is also employee contact
- Customer-role erasure with retained employment role
- Legal hold
- Offline device privacy tombstone
- Cross-tenant identifier substitution
- Support impersonation

### Provider Simulators

- Successful wallet request
- Delayed callback
- Duplicate callback
- Timeout and uncertain state
- Refund unsupported
- Credential expiry
- Rate limit
- Provider outage

## Golden First-Slice Scenarios

1. Sign in, select tenant, and resolve role workspace.
2. Import products with corrected rejects.
3. Open register and complete cash sale.
4. Complete mixed-tender sale.
5. Disconnect, sell offline, reconnect, and deduplicate.
6. Return to original tender.
7. Issue and redeem stored value.
8. Count stock and approve variance.
9. Close register, approve variance, prepare and reconcile deposit.
10. Export accountant handoff.
11. Complete role-scoped privacy erasure.
12. Restore backup and reapply deletion journal.
13. Attempt cross-tenant access through API, search, files, jobs, events, exports, and offline sync.

## Barcode and Scanner Tests

- Exact supported barcode
- Unknown barcode
- Duplicate barcode
- Malformed barcode
- Rapid consecutive scans
- Scanner sends Enter/Tab suffix
- Manual fallback
- Disconnect during scan and sale
- Focus preservation after scan
- Accessibility with keyboard and screen reader
- Scan rate and local lookup latency against provisional budgets

## Import-Correction Tests

- Invalid required field
- Unknown tax category
- Duplicate identifier
- Custom-field proposal
- Dry-run correction
- Partial apply
- Idempotent rerun
- Row-level export of errors

## Privacy-Intake Tests

- Authenticated self-service request
- Staff-assisted intake
- Authorized agent
- Identity-verification failure
- Multi-role subject
- Legal hold
- Target failure and retry
- Offline-device non-acknowledgement

## Quality Gate

A capability cannot advance beyond its declared depth until all required dimensions have executable evidence, blocking defects are closed or waived, and the evidence is linked from the generated matrix.
