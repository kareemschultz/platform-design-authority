---
document_id: PDA-ENG-006
title: Pricing Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Pricing Engine

## Purpose

Calculate explainable prices across POS, e-commerce, quotes, orders, contracts, procurement, rental, service, and future domains.

## Core Capabilities

- Price books, lists, tiers, contracts, and customer-specific pricing
- Effective dates, currencies, quantities, locations, channels, and units
- Markup, margin, formula, and cost-plus rules
- Price overrides and approval thresholds
- Bundles, kits, subscriptions, and recurring-price hooks
- Simulation, quote locking, and price provenance

## Rules

1. Every result must explain base price, rules applied, adjustments, currency, precision, and effective context.
2. Pricing and promotions remain separate concerns but compose through defined precedence.
3. Historical transactions retain the accepted price snapshot and rule provenance.
4. Manual overrides require permission, reason, limits, and audit.
5. Conflicting rules require deterministic precedence.
6. Cost and sensitive margin data must respect field-level permissions.
7. Offline clients use versioned pricing snapshots and reconcile expired or conflicting rules explicitly.

## Quality Gates

- Precedence and boundary tests
- Currency and unit conversion tests
- Historical replay
- Offline snapshot tests
- Override authorization tests
- High-volume calculation benchmarks
