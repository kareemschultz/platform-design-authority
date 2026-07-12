---
document_id: ADR-0009
title: Assign Loyalty to a Shared Loyalty Engine
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-11
supersedes: null
superseded_by: null
related_adrs: [ADR-0013]
---

# ADR-0009 — Assign Loyalty to a Shared Loyalty Engine

## Context

Loyalty was referenced by the Platform Manifest, Promotion Engine, and Retail pack without an authoritative owner. Loyalty spans Commerce transactions, CRM parties, Marketing communication, promotion application, customer portals, and append-oriented balances.

Leaving ownership implicit would cause duplicated points balances, inconsistent reversals, and confusion between non-cash loyalty value, promotions, gift cards, and store credit.

ADR-0013 separately assigns all monetary customer stored value, including gift cards, refund credits, and store credit, to Commerce. This ADR applies only to non-cash loyalty points, benefits, tiers, and program rules.

## Options Considered

### Commerce owns loyalty

Keeps POS integration close, but couples loyalty to selling and makes non-Commerce earn sources, partner programs, and cross-industry use awkward.

### CRM or Marketing owns loyalty

Fits segmentation and communication, but neither should own transactional balance integrity or redemption reservation.

### Promotion Engine owns loyalty

Fits discounts but incorrectly treats a durable member ledger as only a price-calculation concern.

### A shared Loyalty Engine owns program and ledger behavior

Provides one reusable owner while domains remain authoritative for their transactions and records.

## Decision

Create a shared Loyalty Engine.

It owns:

- Program and rule versions
- Memberships and loyalty accounts
- Non-cash points and benefit ledgers
- Earn, redemption, reversal, expiration, and tier policy
- Loyalty balance and history contracts

It does not own:

- Customer or Party master data
- Sales orders, payments, returns, or marketing campaigns
- Gift cards, refund credits, prepaid balances, or monetary store credit
- Generic promotions

Monetary instruments remain governed by ADR-0013 and `STORED_VALUE_AND_CUSTOMER_BALANCES.md`.

## Consequences

### Positive

- One non-cash loyalty ledger and rule owner
- Clean separation from monetary stored value
- Consistent returns, reversals, expiration, and offline controls
- Reusable integrations for Commerce, CRM, Marketing, and partners

### Negative

- Adds another engine boundary and integration contract
- Offline redemption requires reservations and bounded leases
- Accounting and tax treatment remains jurisdiction-specific

## Required Controls

- Append-oriented ledger
- Idempotent source references
- Explicit rule versions
- Permissioned adjustments
- Signed offline allowances
- Party linkage without duplicate customer master data
- Distinct capability and event namespaces
- Automated tests proving monetary stored value cannot enter the Loyalty ledger

## Validation

Validate with a later retail slice supporting points earn, redemption, return reversal, expiration, tier change, offline allowance, and customer-visible history while gift cards and store credit remain Commerce-owned.