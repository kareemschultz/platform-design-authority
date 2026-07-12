---
document_id: PDA-COM-005
title: Billing Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0015]
---

# Billing Architecture

## Purpose

Define the internal platform-subscription billing domain and its integration with external payment, tax, invoicing, and subscription providers.

## Architectural Position

The platform owns commercial contracts, offers, entitlement intent, customer context, usage records, partner rules, and reconciliation. An external billing provider may calculate invoices, collect platform-subscription payments, manage payment methods, and provide tax or customer-portal features.

This architecture governs the platform company's billing of tenant customers. It does not govern a tenant's sale to its own customers.

## Core Entities

Commercial Account, Offer Version, Contract, Platform Subscription, Subscription Item, Billing Schedule, Invoice Mirror, Credit, Payment Status, Usage Summary, Partner Share, and Billing Adjustment.

## Rules

1. External provider IDs are references, not primary business identities.
2. Webhooks are authenticated, deduplicated, ordered defensively, and reconciled.
3. Subscription changes are represented internally before or atomically with provider changes.
4. Runtime entitlements do not depend on synchronous provider calls.
5. Billing, entitlement, and payment states remain distinct.
6. Invoice previews are required before consequential plan changes.
7. Provider failures create visible, retryable operational states.
8. Financial postings flow to Finance through approved contracts.
9. Tenant customer payments, stored value, cash, partner shares, and publisher earnings remain separate money contexts.
10. A provider feature is not required merely because a possible future commercial phase could use it.

## Baseline Provider Adapter

Required for ordinary platform-subscription billing:

- Products and prices
- Subscriptions and schedules
- Trials and coupons where offered
- Usage meters
- Invoice preview, creation, payment, credit, and refund
- Customer billing portal or equivalent platform-built APIs
- Tax calculation hooks where selected
- Webhook verification and event replay
- Reconciliation exports

## Conditional Provider Capabilities

The following are optional capability declarations and are disabled until an approved commercial phase requires them:

- Partner commission payout
- Marketplace publisher settlement
- Connected or managed accounts
- Split settlement
- Reserves and negative balances
- Marketplace-of-record or merchant-of-record services

Marketplace settlement cannot become a baseline billing-adapter requirement before the decisions and gates in `docs/blueprint/08-Marketplace/MARKETPLACE_COMMERCIAL_PHASING.md` are satisfied.

Use of connected-account or settlement functionality requires a new ADR, founder decision, provider and legal review, Finance controls, and explicit protection against accidental payment facilitation or custody.

## Reconciliation

Reconcile commercial account, subscription item, price, entitlement intent, meter totals, invoice lines, payment state, credits, partner-share calculations, provider fees, and accounting entries.

Publisher and partner earnings remain proposed internal balances until approved execution and Finance reconciliation.

## Portability

Provider-specific behavior remains behind adapters. The data model preserves enough internal context to migrate providers or support regional alternatives without recreating commercial history.

## Quality Gates

- Provider capability declaration
- Idempotency and webhook tests
- Invoice and entitlement reconciliation
- Credit and refund tests
- Currency and tax review
- Provider exit plan
- No marketplace settlement enabled in an unapproved phase
