---
document_id: PDA-DOM-026
title: First Slice Finance Handoff Contract
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0013, ADR-0015]
---

# First Slice Finance Handoff Contract

## Purpose

Define the bounded accounting and reconciliation output produced by the Guyana retail foundation slice without claiming delivery of a complete production general ledger or financial-reporting system.

## Scope

The first slice produces accountant-ready posting batches, reconciliation summaries, source references, and export packages for:

- Completed sales
- Returns and refunds
- Cash movements and register close
- Bank deposits
- Electronic payment settlement and fees
- Stored-value issuance, redemption, expiry, and reversal
- Inventory movement and provisional valuation inputs
- Tax-calculation snapshots
- Approved manual adjustments

## Non-Scope

The first slice does not promise:

- Complete general-ledger administration
- Accounts payable or receivable depth
- Bank-feed automation
- Full financial statements
- Consolidation
- Statutory tax filing
- Production revenue-recognition automation
- Complete fixed-asset accounting

These remain future Finance capabilities.

## Posting Batch

A Posting Batch records:

- Tenant and legal entity
- Source period and timezone
- Currency
- Source capability and event range
- Batch identifier and idempotency key
- Posting-rule version
- Debit and credit lines or a neutral journal proposal format
- Dimensions such as store, location, register, channel, product category, and tax class
- Source transaction references
- Control totals
- Exception and reconciliation status
- Created, reviewed, exported, and accepted timestamps

## Posting Rules

Posting rules map approved source facts to accountant-reviewed account and dimension proposals.

Initial rule families:

- Cash sale
- Electronic-tender sale
- Mixed-tender sale
- Refund to original tender
- Refund to store credit
- Stored-value issuance
- Stored-value redemption
- Stored-value breakage or expiry seam
- Cash variance
- Deposit handoff
- Provider fee and settlement difference
- Inventory issue, return, and adjustment valuation input
- Tax control amount

Rules are effective-dated and versioned. Changing a rule does not rewrite prior source transactions or previously accepted batches.

## Reconciliation Controls

Every batch includes:

- Gross sales
- Discounts
- Tax
- Net sales
- Cash received
- Electronic tender
- Stored value issued and redeemed
- Refunds
- Fees
- Cash variance
- Deposit totals
- Inventory quantity and provisional valuation totals
- Unreconciled and uncertain items

The sum of source transactions must reconcile to batch control totals. Provider uncertainty, missing deposits, unresolved cash variance, and stored-value mismatch remain explicit exceptions.

## Accountant Export Package

The package contains:

- Manifest with tenant, legal entity, period, currency, generation time, and schema version
- Posting batch CSV or JSON
- Source transaction summary
- Tender and settlement reconciliation
- Cash and deposit reconciliation
- Stored-value liability movement
- Inventory movement and valuation input
- Tax summary and calculation evidence references
- Exceptions and unresolved items
- File hashes
- Human-readable review summary

The export is permissioned, encrypted in transit and at rest, time-limited, auditable, and reproducible from authoritative records.

## Acceptance and Feedback

The accept, reject, and correction workflow below is design intent only. It has no first-slice mutation endpoint or permission until OpenAPI, the permission catalog, and the endpoint manifest add them together.

An accounting reviewer may:

- Accept the batch
- Reject with reason
- Request correction
- Map or amend account configuration for future batches
- Mark external-system posting reference
- Reconcile an exception through an approved source-domain workflow

The reviewer cannot edit a posted Commerce, Inventory, Cash, Payment, or Stored Value fact through the export.

## API Contracts

- `GET /v1/finance-handoff/posting-batches`
- `POST /v1/exports/accountant-handoff`
- `GET /v1/exports/{exportId}`
- `POST /v1/deposit-reconciliations`

Permissions are defined in `01-Platform/FIRST_SLICE_PERMISSION_CATALOG.md`.

## Events

- `finance.posting-batch.created.v1`
- `finance.posting-batch.accepted.v1`
- `finance.posting-batch.rejected.v1`
- `finance.reconciliation.completed.v1`
- `finance.reconciliation.exception-detected.v1`

## Quality Gates

- Source-to-control-total reconciliation
- Double-entry balance when journal format is used
- Currency and rounding tests
- Idempotent regeneration
- Historical rule-version replay
- Tenant and legal-entity isolation
- Permissioned export
- Stored-value liability reconciliation
- Cash and deposit reconciliation
- Provider uncertainty preservation
- Accountant usability review

## Promotion Gate

This contract may guide the prototype and first implementation. It does not become a production accounting claim until reviewed by qualified accounting and tax professionals and tested against a named pilot customer's chart of accounts and workflows.
