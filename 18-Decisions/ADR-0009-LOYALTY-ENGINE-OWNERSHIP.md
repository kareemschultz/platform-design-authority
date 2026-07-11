---
document_id: ADR-0009
title: Assign Loyalty to a Shared Loyalty Engine
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0009 — Assign Loyalty to a Shared Loyalty Engine

## Context

Loyalty was referenced by the Platform Manifest, Promotion Engine, and Retail industry pack without an authoritative owner or capability family. Loyalty spans Commerce transactions, CRM parties, Marketing communication, promotion application, customer portals, and append-oriented balances.

Leaving ownership implicit would cause duplicated points balances, inconsistent reversals, and confusion between non-cash loyalty value, promotions, gift cards, and store credit.

## Options Considered

### Commerce owns loyalty

Keeps POS integration close, but couples loyalty to selling and makes non-Commerce earn sources, partner programs, and cross-industry use awkward.

### CRM or Marketing owns loyalty

Fits member segmentation and communication, but neither should own transactional balance integrity or redemption reservation.

### Promotion Engine owns loyalty

Fits discounts but incorrectly treats a durable member ledger as only a price-calculation concern.

### A shared Loyalty Engine owns program and ledger behavior

Provides one reusable owner while domains remain authoritative for their own transactions and records.

## Decision

Create a shared Loyalty Engine.

It owns:

- Program and rule versions
- Memberships and loyalty accounts
- Non-cash points and benefit ledgers
- Earn, redemption, reversal, expiration, and tier policy
- Loyalty balance and history contracts

It does not own:

- Customer or party master data
- Sales orders, payments, returns, or marketing campaigns
- Gift cards or monetary store credit
- Generic promotions

## Consequences

### Positive

- One ledger and rule owner across industries and channels
- Clean separation from monetary stored value
- Consistent returns, reversals, expiration, and offline controls
- Reusable integrations for Commerce, CRM, Marketing, and partners

### Negative

- Adds another engine boundary and integration contract
- Offline redemption requires reservations and bounded leases
- Accounting and tax treatment still require jurisdiction-specific review

## Required Controls

- Append-oriented ledger
- Idempotent source references
- Explicit rule versions
- Permissioned adjustments
- Signed offline allowances
- Party linkage without duplicating customer master data
- Distinct capability and event namespaces

## Validation

Validate with a retail vertical slice supporting earn, redemption, return reversal, expiration, tier change, offline POS allowance, and customer-visible history.
