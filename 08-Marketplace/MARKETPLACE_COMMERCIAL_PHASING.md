---
document_id: PDA-MKT-012
title: Marketplace Commercial Phasing
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0015, ADR-0019]
---

# Marketplace Commercial Phasing

## Purpose

Define how the marketplace launches without prematurely creating payment-facilitator, custody, marketplace-of-record, tax, settlement, or publisher-payout obligations.

## Phase 0 — Private Catalog

- First-party and invited partner listings
- No public purchase flow
- Manual commercial agreements outside the platform
- Installation, permissions, review, compatibility, support, and uninstall are exercised

## Phase 1 — Free Listings

- Public or tenant-visible free listings
- No platform collection of publisher revenue
- No publisher payout, reserve, negative balance, or tax settlement
- Publishers may offer external professional services under separate contracts
- Platform records installation and support responsibility

## Phase 2 — Direct Publisher Billing

A publisher may bill the customer directly under a separate agreement while the platform provides discovery and installation.

Required disclosures:

- Seller and contracting party
- Price and tax responsibility
- Refund and dispute process
- Support owner
- Data-processing roles
- Termination and uninstall consequences

The platform does not collect or settle publisher funds in this phase.

## Phase 3 — Platform-Billed Marketplace

This phase is disabled until the Founder and qualified advisers decide:

- Platform legal entity and tax residence
- Whether the platform is marketplace of record, merchant of record, agent, reseller, or technology provider
- Supported currencies and countries
- Payment and payout provider
- Customer invoicing and tax collection
- Publisher tax documentation
- Refunds, chargebacks, reserves, fraud losses, negative balances, and abandoned earnings
- Sanctions, identity verification, and regulatory obligations
- Accounting and reconciliation ownership

A new ADR and founder decision are required before Phase 3.

## Computation and Execution Ownership

- Commercial Control Plane computes listing price, contractual fee, platform commission, taxes configured for platform billing, refunds, and publisher earning proposals.
- Finance owns accounting interpretation, settlement reconciliation, liabilities, and financial reporting.
- Payment Engine owns provider orchestration and evidence.
- The external payout provider executes money movement where approved.
- Marketplace owns publisher-facing statements, disputes, listing suspension, and lifecycle status.

No internal computed earning is considered paid until provider and Finance reconciliation confirm it.

## Free-Listings-First Gate

The marketplace may reach pilot with free listings only when security, permission, AI, upgrade, uninstall, support, and data-portability controls pass. Paid listings are not required for the first retail slice.

## Quality Gates

- Commercial phase visible to customers and publishers
- No paid-listing endpoint enabled before Phase 3 approval
- Contracting party and support owner disclosed
- Installation independent from payment state for free listings
- Publisher suspension stops new installations and governed runtime access
- Refund, dispute, and removal process tested for each enabled phase
- Finance and provider reconciliation before any payout claim
