---
document_id: PDA-DOM-001
title: Commerce Domain
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0012, ADR-0013, ADR-0015, ADR-0016]
---

# Commerce Domain

## Purpose

Own the customer-facing sale lifecycle across POS, assisted sales, quotes, orders, returns, exchanges, receipts, customer stored value, channel coordination, storefront checkout, and tenant-facing recurring agreements.

## Core Capabilities

- Point of sale and register operations
- Quotes, sales orders, backorders, and fulfillment requests
- Returns, exchanges, cancellations, and refunds
- Receipts, gift receipts, layaway, and deposits
- Cash drawer, shifts, till counts, safe drops, deposits, and end-of-day close
- Customer stored value, gift cards, refund credits, and store credit
- Sales channels, order sources, and omnichannel coordination
- Storefront cart, checkout, and order capture through headless contracts
- Recurring Agreements and memberships sold by tenants to their customers
- Order status, holds, collaboration, attachments, and audit history

## Authoritative Entities

Sale, Quote, Sales Order, Return, Exchange, Register, Shift, Till, Cash Movement, Deposit, Receipt, Sales Channel, Commerce Transaction, Stored Value Program, Stored Value Instrument, Stored Value Ledger Entry, Cart, Checkout Session, and Recurring Agreement.

The Party service owns shared identity. CRM owns customer relationship context. Commerce owns transaction-specific customer snapshots and customer stored-value obligations.

## Shared Engines and Services Used

Pricing, Promotions, Tax, Payments, Loyalty, Fiscalization, Documents, Workflow, Approvals, Notifications, Collaboration, Reporting, Risk, and AI Orchestration.

## Domain Boundaries

- Product Catalog owns product definitions and channel-publication facts.
- Inventory owns stock quantities, reservations, and movements.
- Warehouse owns fulfillment execution.
- Finance owns accounting entries, receivables, and stored-value accounting interpretation.
- Party owns canonical people, organizations, addresses, and shared contact points.
- CRM owns customer/prospect relationship profiles and sales pipeline.
- Payment Engine owns tender orchestration and provider state, not stored-value balances.
- Loyalty owns non-cash points and benefits.
- Marketing owns landing pages, campaign content, and merchandising copy.
- Documents and Knowledge owns controlled policies, terms, and legal notices.
- Fiscalization owns statutory packaging, signing, submission, and acknowledgements.
- Security Risk owns correlated fraud assessments and risk cases.

## Events

- `commerce.sale.completed.v1`
- `commerce.sale.held.v1`
- `commerce.return.completed.v1`
- `commerce.refund.requested.v1`
- `commerce.exchange.completed.v1`
- `commerce.register.opened.v1`
- `commerce.register.closed.v1`
- `commerce.cash-movement.posted.v1`
- `commerce.deposit.prepared.v1`
- `commerce.deposit.reconciled.v1`
- `commerce.receipt.issued.v1`

These are canonical Commerce facts. First-slice contracts and external webhook subscriptions reference these definitions rather than redefining them.

## First-Slice Sequence

1. POS sale, cash and direct-provider tender seams, receipt, register open and close
2. Catalog and inventory integration, returns, refunds, stored value, and offline continuity
3. Cash deposit and accountant handoff, risk controls, privacy, backup, and recovery
4. Quotes, orders, customer accounts, broader channel ingestion, and fulfillment seams
5. Connector-first external commerce integration
6. Bounded native reference storefront
7. Tenant Recurring Agreements when a named pilot and verified collection rail justify them
8. Advanced promotions, loyalty, distributed fulfillment, and AI-assisted selling

The first Guyana retail pilot does not require a production storefront or recurring collection.