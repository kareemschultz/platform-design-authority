---
document_id: PDA-DOM-001
title: Commerce Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Commerce Domain

## Purpose

Own the customer-facing sale lifecycle across POS, assisted sales, e-commerce, quotes, orders, returns, exchanges, receipts, and channel coordination.

## Core Capabilities

- Point of sale and register operations
- Quotes, sales orders, backorders, and fulfillment requests
- E-commerce checkout and storefront order capture
- Returns, exchanges, cancellations, and refunds
- Receipts, gift receipts, layaway, deposits, and store credit
- Cash drawer, shifts, till counts, and end-of-day close
- Sales channels, order sources, and omnichannel customer experience
- Order status, holds, notes, attachments, and audit history

## Authoritative Entities

Sale, Quote, Sales Order, Return, Exchange, Register, Shift, Till, Receipt, Sales Channel, and Commerce Transaction.

## Shared Engines Used

Pricing, Promotions, Tax, Payments, Documents, Workflow, Approvals, Notifications, Reporting, and AI.

## Domain Boundaries

- Product Catalog owns product definitions.
- Inventory owns stock quantities and movements.
- Warehouse owns fulfillment execution.
- Finance owns accounting entries and receivables.
- CRM owns customer relationship data.

## Initial Maturity Roadmap

1. POS sale, payment, receipt, shift open and close
2. Quotes, orders, returns, exchanges, and customer accounts
3. E-commerce and omnichannel order capture
4. Advanced promotions, loyalty, layaway, and distributed fulfillment
5. AI-assisted selling, fraud detection, and predictive recommendations
