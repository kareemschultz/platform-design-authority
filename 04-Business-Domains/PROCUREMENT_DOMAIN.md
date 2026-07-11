---
document_id: PDA-DOM-005
title: Procurement Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Procurement Domain

## Purpose

Own supplier sourcing, purchasing, commitments, receiving expectations, supplier returns, purchasing policy, and supplier performance.

## Core Capabilities

- Suppliers, contacts, terms, catalogs, and agreements
- Requisitions, requests for quotation, bids, and sourcing events
- Purchase orders, blanket orders, releases, and change orders
- Approval thresholds, budgets, and purchasing policies
- Expected receipts, partial receipts, over-receipt, and tolerance rules
- Supplier returns, debit notes, disputes, and claims
- Lead times, minimum quantities, pack constraints, and landed-cost inputs
- Supplier scorecards, delivery performance, quality, and spend analysis

## Authoritative Entities

Supplier Commercial Profile, Requisition, Sourcing Event, Bid, Purchase Order, Purchase Commitment, Supplier Return, and Procurement Policy.

## Boundaries

CRM or Party Management owns shared party identity. Product Catalog owns product definitions. Inventory owns stock receipt effects. Warehouse owns physical receiving. Finance owns payables, accounting, and payment. Procurement owns commercial purchasing intent and commitments.

## Quality Requirements

- Versioned orders and change history
- Separation of request, approval, receipt, and payment duties
- Currency, unit, tax, and tolerance precision
- Duplicate supplier and invoice-risk signals
- Contract and price compliance reporting
