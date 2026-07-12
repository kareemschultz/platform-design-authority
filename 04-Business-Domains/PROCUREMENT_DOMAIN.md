---
document_id: PDA-DOM-005
title: Procurement Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0007]
---

# Procurement Domain

## Purpose

Own supplier sourcing, purchasing, commitments, receiving expectations, supplier returns, purchasing policy, and supplier performance.

## Core Capabilities

- Supplier commercial profiles, terms, catalogs, and agreements linked to canonical Parties
- Requisitions, requests for quotation, bids, and sourcing events
- Purchase orders, blanket orders, releases, and change orders
- Approval thresholds, budgets, and purchasing policies
- Expected receipts, partial receipts, over-receipt, and tolerance rules
- Supplier returns, debit notes, disputes, and claims
- Lead times, minimum quantities, pack constraints, and landed-cost inputs
- Supplier scorecards, delivery performance, quality, and spend analysis

## Authoritative Entities

Supplier Commercial Profile, Requisition, Sourcing Event, Bid, Purchase Order, Purchase Commitment, Supplier Return, and Procurement Policy.

A Supplier Commercial Profile is a procurement role attached to a canonical Party. Procurement does not create a second authoritative company, person, address, or contact record when the Party already exists.

## Boundaries

Party and Relationship Management owns shared real-world identity, identifiers, addresses, contact points, duplicate resolution, and cross-role links. Procurement owns supplier-specific commercial status, purchasing terms, catalog relationships, sourcing history, scorecards, and purchasing commitments.

Product Catalog owns product definitions. Inventory owns stock receipt effects. Warehouse owns physical receiving. Finance owns payables, accounting, and payment. Procurement owns commercial purchasing intent and commitments.

## Quality Requirements

- Versioned orders and change history
- Separation of request, approval, receipt, and payment duties
- Currency, unit, tax, and tolerance precision
- Duplicate supplier-role detection through Party services
- Invoice-risk signals without taking invoice ownership from Finance
- Contract and price compliance reporting