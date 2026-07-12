---
document_id: PDA-ARC-015
title: First Slice Sequence Diagrams
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# First Slice Sequence Diagrams

## Purpose

Provide implementation-review sequence diagrams for the eleven load-bearing flows named by `FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md`.

Every diagram highlights trusted context, authorization, authoritative owner, event publication, audit, provider uncertainty, and recovery behavior.

## 1. Better Auth Login and Tenant Selection

```mermaid
sequenceDiagram
    actor User
    participant Web
    participant Auth as Better Auth
    participant Identity as Platform Identity
    participant Policy as Authorization
    participant Audit

    User->>Web: Sign in
    Web->>Auth: Authenticate credential/passkey/SSO
    Auth-->>Web: Session + assurance context
    Web->>Identity: Resolve PlatformIdentityLink and memberships
    Identity-->>Web: Party and tenant memberships
    User->>Web: Select tenant/workspace
    Web->>Policy: Validate membership, permission, entitlement
    Policy-->>Web: Effective context
    Web->>Audit: Record session/context change
    Web-->>User: Open authorized workspace
```

## 2. Online Cash Sale

```mermaid
sequenceDiagram
    actor Cashier
    participant POS
    participant Commerce
    participant Pricing
    participant Tax
    participant Inventory
    participant Numbering
    participant Outbox
    participant Documents

    Cashier->>POS: Scan items and choose cash
    POS->>Commerce: Create/complete sale with idempotency key
    Commerce->>Pricing: Quote price
    Commerce->>Tax: Calculate prototype tax snapshot
    Commerce->>Inventory: Check availability
    Commerce->>Numbering: Allocate receipt reference
    Commerce->>Commerce: Commit sale, cash movement, receipt intent
    Commerce->>Outbox: Persist canonical events atomically
    Outbox-->>Inventory: commerce.sale.completed.v1
    Inventory->>Inventory: Post stock ledger entries
    Outbox-->>Documents: Receipt render request
    Commerce-->>POS: Completed sale + change due + receipt status
    POS-->>Cashier: Show authoritative completion
```

## 3. Electronic Tender with Uncertain Provider Result

```mermaid
sequenceDiagram
    actor Cashier
    actor Customer
    participant POS
    participant Commerce
    participant Payments
    participant Provider
    participant Reconcile

    Cashier->>POS: Select electronic tender
    POS->>Commerce: Prepare sale
    Commerce->>Payments: Create payment intent
    Payments->>Provider: Start provider operation with idempotency
    Provider-->>Customer: Interactive approval/request-to-pay
    alt Confirmed synchronously
        Provider-->>Payments: Success
        Payments-->>Commerce: Captured/authorized
        Commerce->>Commerce: Complete sale
    else Timeout or unknown
        Provider--xPayments: No definitive response
        Payments-->>Commerce: Uncertain
        Commerce-->>POS: Payment uncertain; do not retry as new charge
        Provider-->>Payments: Later webhook/status
        Payments->>Reconcile: Compare provider and internal state
        Reconcile-->>Commerce: Confirm, reverse, or require review
    end
```

## 4. Offline Lease, Sale, and Synchronization

```mermaid
sequenceDiagram
    actor Cashier
    participant Device
    participant API
    participant Auth
    participant Policy
    participant Sync
    participant Commerce

    Device->>Auth: Authenticate while online
    Device->>Policy: Request offline authority
    Policy-->>Device: Signed lease, limits, numbering range
    Note over Device: Network unavailable
    Cashier->>Device: Complete permitted offline sale
    Device->>Device: Atomic local sale, cash, receipt, stock intent, audit
    Note over Device: Network restored
    Device->>Sync: Submit signed batch
    Sync->>Auth: Revalidate device/user/session
    Sync->>Policy: Revalidate lease and capabilities
    Sync->>Commerce: Apply idempotent queued commands
    Commerce-->>Sync: Accepted, duplicate, conflict, or review
    Sync-->>Device: Results + privacy tombstones + new watermark
```

## 5. Stored-Value Reservation and Capture

```mermaid
sequenceDiagram
    actor Cashier
    participant POS
    participant Payments
    participant StoredValue as Commerce Stored Value
    participant Risk
    participant Commerce
    participant Finance

    POS->>Payments: Select stored-value tender
    Payments->>StoredValue: Reserve amount with idempotency key
    StoredValue->>Risk: Evaluate velocity and anomaly policy
    Risk-->>StoredValue: Allow/challenge/hold
    StoredValue->>StoredValue: Append reservation entry
    StoredValue-->>Payments: Reservation approved
    Payments-->>Commerce: Tender reserved
    Commerce->>Commerce: Complete sale
    Commerce->>StoredValue: Capture reservation
    StoredValue->>StoredValue: Append redemption entry
    StoredValue-->>Finance: Liability movement event
```

## 6. Return, Refund, and Exchange

```mermaid
sequenceDiagram
    actor Staff
    participant UI
    participant Commerce
    participant Risk
    participant Inventory
    participant Payments
    participant StoredValue

    Staff->>UI: Select original lines and reason
    UI->>Commerce: Create return/exchange draft
    Commerce->>Risk: Evaluate return/refund policy
    Risk-->>Commerce: Allow/approval/review
    Commerce-->>UI: Preview destination, inventory effect, difference
    Staff->>UI: Confirm
    Commerce->>Inventory: Restock/quarantine/write-off command
    alt Original rail refund
        Commerce->>Payments: Refund/reverse original tender
    else Store credit permitted
        Commerce->>StoredValue: Issue refund credit
    else Exchange
        Commerce->>Commerce: Create linked replacement sale
    end
    Commerce->>Commerce: Complete return/exchange
```

## 7. Register Close, Cash Variance, and Deposit

```mermaid
sequenceDiagram
    actor Cashier
    actor Manager
    participant POS
    participant Commerce
    participant FinanceHandoff as Finance Handoff

    Cashier->>POS: Start register close
    POS->>Commerce: Request expected cash summary
    Commerce-->>POS: Float, receipts, change, paid in/out, refunds, drops
    Cashier->>POS: Enter blind count
    POS->>Commerce: Submit count
    Commerce->>Commerce: Calculate variance
    alt Variance over threshold
        Commerce-->>Manager: Approval/recount required
        Manager->>Commerce: Approve with reason
    end
    Commerce->>Commerce: Close shift and prepare deposit
    Commerce-->>FinanceHandoff: Cash and deposit control totals
    Manager->>Commerce: Confirm custody/bank handoff
    Commerce->>Commerce: Reconcile deposit
```

## 8. Product and Opening-Stock Import

```mermaid
sequenceDiagram
    actor Admin
    participant UI
    participant Importer
    participant Catalog
    participant Inventory
    participant Audit

    Admin->>UI: Upload source file
    UI->>Importer: Create import job
    Importer->>Importer: Scan, classify, profile, map
    Importer->>Catalog: Validate product rows
    Importer->>Inventory: Validate opening-stock rows
    Importer-->>UI: Dry-run creates, updates, rejects, warnings
    Admin->>UI: Approve plan
    UI->>Importer: Apply with idempotency
    Importer->>Catalog: Domain commands
    Importer->>Inventory: Domain commands
    Importer->>Audit: Record batch and row outcomes
    Importer-->>UI: Completed/partial/reconciliation required
```

## 9. Privacy Request and Erasure

```mermaid
sequenceDiagram
    actor Subject
    participant Portal
    participant Privacy
    participant Party
    participant Domains
    participant Projections
    participant Devices
    participant Audit

    Subject->>Portal: Submit request
    Portal->>Privacy: Create privacy case
    Privacy->>Party: Verify subject and role scope
    Privacy->>Domains: Discover records and retention bases
    Domains-->>Privacy: Deletion/restriction/pseudonymization plan
    Privacy->>Privacy: Approve action or record exemption/hold
    Privacy->>Domains: Publish deletion-journal tasks
    Privacy->>Projections: Purge search, vectors, analytics, webhooks, AI
    Privacy->>Devices: Send tombstones and purge deadline
    Domains-->>Privacy: Target acknowledgements
    Projections-->>Privacy: Target acknowledgements
    Devices-->>Privacy: Purge acknowledgement or lease expiry
    Privacy->>Audit: Record privacy-safe completion evidence
```

## 10. Backup Restore and Reconciliation

```mermaid
sequenceDiagram
    actor IncidentCommander as Incident Commander
    participant Recovery
    participant Backup
    participant PrivacyJournal
    participant Providers
    participant Projections
    participant Tests

    IncidentCommander->>Recovery: Select recovery point
    Recovery->>Backup: Restore authoritative stores in isolation
    Backup-->>Recovery: Restored data + deletion watermark
    Recovery->>PrivacyJournal: Load actions newer than watermark
    PrivacyJournal-->>Recovery: Reapply deletion/restriction/pseudonymization
    Recovery->>Providers: Reconcile payments, webhooks, submissions
    Recovery->>Projections: Rebuild search, analytics, caches
    Recovery->>Tests: Run tenant-isolation, ledger, privacy, acceptance tests
    Tests-->>IncidentCommander: Pass/fail + reconciliation evidence
    IncidentCommander->>Recovery: Approve traffic only after pass
```

## 11. Support Impersonation Approval and Expiry

```mermaid
sequenceDiagram
    actor Agent as Support Agent
    actor Approver
    actor TenantAdmin as Tenant Administrator
    participant Support
    participant Policy
    participant Session
    participant Audit
    Agent->>Support: Request tenant-scoped elevation with reason and ticket
    Support->>Policy: Verify ordinary support permission and tenant policy
    Policy-->>Support: Approval required; no elevated session
    Support->>Approver: Request bounded scope and expiry
    Approver-->>Support: Approve or reject
    Support->>Audit: Record requester, approver, tenant, reason, scope, expiry
    Support-->>TenantAdmin: Publish tenant-visible access notice
    Support->>Session: Mint time-boxed tenant-bound session
    Agent->>Support: Perform permitted action
    Support->>Policy: Re-evaluate scope, permission, entitlement, expiry
    Support->>Audit: Record action and outcome
    Session->>Session: Auto-expire or revoke
    Session->>Audit: Record termination
    Session-->>TenantAdmin: Publish completion and audit reference
```

## Review Checklist

Each implementation diagram derived from these sequences must identify:

- Trusted tenant and actor context
- Authorization and entitlement point
- Authoritative state owner
- Transaction boundary
- Idempotency key
- Canonical event publication
- Audit point
- Data classification
- Failure, uncertainty, retry, and compensation
- Offline and recovery behavior where applicable
