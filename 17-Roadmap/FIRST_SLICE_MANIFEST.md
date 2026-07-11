---
document_id: PDA-RDM-003
title: First Slice Capability Manifest
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# First Slice Capability Manifest

## Purpose

Define the bounded capability set for the first controlled Guyana retail vertical slice. This document prevents the phrase “first slice” from expanding informally and provides the human-readable source for `registry/first-slice.json`.

## Outcome

A Guyana-based retailer can configure one or more stores, sign in, open a register, sell catalog items for cash or a directly contracted electronic rail, issue a receipt, adjust inventory through an append-oriented stock ledger, perform returns, issue and redeem store credit or gift value, continue selected operations offline, close and reconcile the register, export an accountant-ready handoff, and restore the system without violating tenant isolation or privacy transformations.

## Included Platform Capabilities

- Tenancy and organizations
- Party and role linkage
- Better Auth identity and sessions
- Authorization and entitlements
- Configuration and extensible metadata
- Audit and internal events
- Jobs and user-directed notifications
- Files and bounded search
- Localization, GYD, USD support seams, units, and reference data
- Sequence and offline numbering
- Rate limits and abuse controls
- Device registration, offline leases, and synchronization
- Secrets and diagnostics
- Data classification
- Privacy requests, pseudonymization, deletion journal, and offline tombstones
- Import/export for products, customers, opening stock, and accountant handoff

## Included Engine Capabilities

- Pricing baseline
- Tax calculation seam with Guyana jurisdiction profile in Draft
- Payment orchestration for cash and direct tenant-provider adapters
- Promotions baseline
- Document and receipt rendering
- Workflow and approvals for overrides, refunds, cash variance, and stock adjustment
- Rules baseline
- Branding and role workspaces
- Dashboards and bounded reporting
- Fiscalization interface and contingency state, with production jurisdiction behavior blocked pending verification

AI, broad automation, advanced loyalty, forecasting, and general-purpose report building are not required for slice acceptance.

## Included Business Capabilities

### Commerce

- POS
- Register and shift management
- Cash management, safe drops, deposits, and variance
- Sales and order completion
- Returns, exchanges, and refunds
- Receipts and gift receipts
- Stored-value ledger, gift cards, and store credit
- Offline sales
- Mobile or tablet POS layout seam

### Product Catalog

- Products, variants, categories, brands, identifiers, and barcodes
- Units, packaging, price inputs, media, and lifecycle
- CSV import and validation

### Inventory

- Stock ledger and balances
- Availability and reservations
- Adjustments, transfers, and counts
- Bounded lot or serial seams
- Offline movements and reconciliation

### Party and CRM

- Person and organization Parties
- Customer role/profile
- Contact points, addresses, consent, and duplicate candidates
- Privacy export and customer-role erasure

### Finance Handoff

- Posting-rule contract
- Sales, tax, tender, stored-value, cash-variance, and inventory-valuation inputs
- Cash and bank-deposit reconciliation seam
- Export package for accountant review

The first slice does not promise a complete production general ledger or statutory filing system unless separately promoted through review.

## Included Security and Operations

- Threat model and tenant-isolation test matrix
- Cross-tenant denial tests for API, files, search, jobs, events, exports, devices, and support access
- Risk rules for sign-in, refund, cash, stored-value, and unusual stock adjustment
- Backup, point-in-time restore, deletion-journal reapplication, and projection rebuild
- Structured logs, traces, metrics, and operational health

## Explicitly Deferred

- Native production storefront
- Broad Shopify-class content or theme builder
- Tenant recurring agreements and memberships
- Automatic recurring debit
- Full Finance, payroll, warehouse, manufacturing, projects, service, fleet, rental, and marketplace delivery
- Payment-facilitator, aggregator, custody, or platform settlement model
- Coalition loyalty and advanced customer rewards
- Advanced fraud models and cross-tenant reputation
- Production fiscal submission until Guyana requirements are verified
- Autonomous AI actions

## Technical Prototype Versus Production Claim

The first slice may prototype tax, MMG, card, bank, and fiscalization adapters. A prototype is not a legal, certified, or production-ready claim. Provider contracts, statutory sources, sandbox evidence, security review, and jurisdiction approval remain mandatory.

## Acceptance Scenarios

1. Create two isolated tenants and prove no cross-tenant access.
2. Configure a store, register, cashier role, catalog, prices, tax seam, and opening stock.
3. Open a register and complete GYD cash and mixed-tender sales.
4. Issue a receipt using offline-safe numbering.
5. Disconnect, complete permitted sales, reconnect, and reconcile without duplicates.
6. Return a sale to original tender or Commerce-owned store credit.
7. Issue, reserve, redeem, reverse, and reconcile stored value.
8. Count stock and post a governed variance.
9. Close the register, count cash, prepare a deposit, and explain variance.
10. Export an accountant handoff with source references.
11. Complete a customer-role privacy action without changing economic facts.
12. Restore a backup and reapply privacy transformations before traffic.

## Change Control

Adding a capability to the first slice requires:

- Named customer or architectural reason
- Dependency and security review
- Estimate of implementation and test impact
- Explicit update to this document and `registry/first-slice.json`
- Founder approval when the addition changes commercial, regulatory, or launch scope

The machine-readable registry is an index. This document remains the human-readable source of intent.