---
document_id: PDA-ARC-013
title: First Slice Entity and State Model
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# First Slice Entity and State Model

## Purpose

Define the minimum authoritative entities, ownership, identifiers, lifecycle states, and core invariants required for the Guyana retail foundation slice.

## Platform Entities

### Tenant

States: Provisioning, Active, Grace, Suspended, Read Only, Archived.

### Organization and Legal Entity

States: Draft, Active, Suspended, Closed.

### Location and Store

States: Draft, Active, Temporarily Closed, Inactive.

### User Identity Link

States: Pending, Active, Suspended, Revoked.

### Membership and Role Assignment

States: Invited, Active, Suspended, Ended.

### Device

States: Pending Enrollment, Active, Offline Lease Valid, Lease Expiring, Revoked, Retired.

### Offline Lease

States: Issued, Active, Expired, Revoked, Reconciled.

## Party and CRM Entities

### Party

Types: Person, Organization.

States: Active, Duplicate Candidate, Merge Pending, Merged, Restricted, Pseudonymized, Archived.

### Customer Relationship Profile

States: Prospect, Active Customer, Inactive, Restricted, Closed.

## Catalog Entities

### Product

States: Draft, Active, Suspended, Discontinued, Archived.

### Variant

States: Draft, Active, Suspended, Discontinued.

### Price Definition

States: Draft, Scheduled, Active, Expired, Superseded.

## Inventory Entities

### Stock Ledger Entry

Facts: Receipt, Sale, Return, Adjustment, Transfer Out, Transfer In, Count Variance, Reservation, Release.

Posted entries are immutable and corrected by linked reversal or adjustment.

### Stock Reservation

States: Pending, Active, Partially Consumed, Consumed, Released, Expired.

### Stock Count

States: Draft, In Progress, Submitted, Review Required, Approved, Posted, Cancelled.

## Commerce Entities

### Register

States: Configured, Open, Closing, Closed, Suspended.

### Register Shift

States: Opening, Open, Closing Count, Variance Review, Closed.

### Sale

States: Draft, Held, Payment Pending, Completed, Partially Returned, Fully Returned, Voided, Reconciliation Required.

### Sale Line

States: Active, Cancelled, Partially Returned, Fully Returned.

### Return

States: Draft, Review Required, Approved, Refund Pending, Completed, Rejected, Cancelled.

### Receipt

States: Pending Number, Issued, Reissued, Voided, Statutory Rejection, Archived.

### Cash Movement

Types: Opening Float, Sale Receipt, Change, Paid In, Paid Out, Refund, Safe Drop, Transfer, Deposit Handoff, Variance.

States: Draft, Posted, Reversed, Reconciled.

## Payment Entities

### Payment Intent

States: Created, Customer Action Required, Processing, Authorized, Captured, Failed, Cancelled, Uncertain, Reconciliation Required, Refunded, Partially Refunded, Reversed.

### Provider Transaction Reference

States mirror provider evidence but never replace internal order or accounting state.

## Stored Value Entities

### Stored Value Program

States: Draft, Active, Suspended, Closed.

### Stored Value Instrument

States: Created, Inactive, Active, Suspended, Expired, Closed.

### Stored Value Reservation

States: Active, Captured, Released, Expired, Reconciliation Required.

### Stored Value Ledger Entry

Facts: Issue, Activate, Load, Reserve, Release, Redeem, Refund, Reverse, Expire, Reinstate, Adjust, Transfer Out, Transfer In.

## Import Entities

### Import Job

States: Uploaded, Scanning, Profiling, Mapping, Dry Run, Awaiting Approval, Applying, Partially Applied, Completed, Failed, Cancelled, Reconciliation Required.

### Import Row Result

States: Proposed, Valid, Warning, Rejected, Applied, Skipped, Reversed.

## Privacy Entities

### Privacy Case

States: Received, Verification Required, Verified, Discovery, Review, Awaiting Approval, Applying, Awaiting Targets, Completed, Denied, Cancelled.

### Deletion Journal Entry

States: Pending, In Progress, Completed, Failed, Exempted, Held.

## Invariants

1. Every tenant-owned entity carries tenant scope.
2. Business transactions identify legal entity, location, actor, currency, and source.
3. Financial, inventory, cash, stored-value, and audit facts are append-oriented.
4. State transitions are explicit and audited.
5. Provider uncertainty cannot be collapsed into failure.
6. Offline-created entities use globally unique client identifiers and reconcile idempotently.
7. Privacy transformation may remove identity attributes without changing economic facts.
8. Human-readable references are separate from primary identifiers.
9. Cross-domain references use stable identifiers and application contracts.
10. Archived does not mean deleted.

## Open Schema Decisions

- Exact PostgreSQL table boundaries
- Aggregate sizes and transaction boundaries
- Party/address snapshot representation
- Store and legal-entity relationship cardinality
- Tax and fiscal evidence schema after Guyana verification
- Exact currency minor-unit and rounding library

These require prototype evidence and cannot be ratified solely from prose.