---
document_id: PDA-ENG-017
title: Loyalty Engine
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0009, ADR-0013, ADR-0016]
---

# Loyalty Engine

## Purpose

Define reusable loyalty programs, membership tiers, earn and redemption rules, non-cash points and benefits ledgers, expiration, adjustments, partner programs, and customer-facing balances across industries.

## Ownership Decision

The Loyalty Engine owns loyalty program configuration, loyalty accounts, non-cash points and benefit ledgers, tier evaluation, earn and redemption policy, expiration, and loyalty-specific adjustments.

Other owners remain authoritative for:

- Party and customer identity: Party and CRM
- Sales and returns: Commerce
- Promotions and immediate price discounts: Promotion Engine
- Gift cards, store credit, refund credits, and monetary stored value: Commerce under ADR-0013
- Accounting interpretation: Finance
- Tender orchestration: Payment Engine
- Recurring Agreement billing and collection: Recurring Commerce
- Marketing journeys and communication: Marketing
- Cross-transaction fraud, velocity, and anomaly decisions: Security Risk service

## Core Entities

- Loyalty Program
- Program Version
- Loyalty Membership
- Loyalty Account
- Points or Benefit Currency
- Loyalty Ledger Entry
- Earn Rule
- Redemption Rule
- Tier and Qualification Period
- Benefit
- Expiration Policy
- Adjustment and Reversal
- Partner or Coalition Agreement

A paid club or membership may use Recurring Commerce for the customer agreement and collection while Loyalty grants benefits and tier status. Loyalty does not own the recurring contract.

## Ledger Rules

1. Loyalty balances derive from append-oriented ledger entries.
2. Posted earn and redemption entries are reversed, not deleted.
3. Every entry records source transaction, rule version, Party, tenant, points currency, quantity, timestamp, and expiry where applicable.
4. Monetary value is not implied unless a governed conversion rule explicitly defines a Commerce action.
5. Gift cards and store credit do not use the loyalty ledger.
6. Negative balances require explicit program policy.
7. Privacy transformation may pseudonymize Party references without changing ledger quantities under ADR-0014.

## Program Rules

Programs may define:

- Spend-based and item-based earning
- Visits, referrals, milestones, recurring-agreement status, and engagement earning
- Bonus periods and multipliers
- Category, channel, location, and customer-segment conditions
- Fixed, dynamic, or catalog-based redemptions
- Tier thresholds and rolling periods
- Expiration and inactivity rules
- Household or business-account pooling
- Partner earn and burn
- Jurisdiction and age restrictions

Rules are versioned and explainable at the transaction level.

## Commerce Integration

Commerce requests a loyalty quote before completion and posts final earn or redemption commands only after the sale reaches the defined state. Returns, cancellations, and chargebacks issue reversals according to the original rule version and return policy.

Offline POS may redeem only within a signed offline allowance and cached policy. Reconnection reconciles reservations and prevents double redemption.

## Promotions Boundary

A promotion changes transaction pricing. Loyalty changes a member's loyalty ledger or benefits. A loyalty redemption may request a promotion or Commerce adjustment, but the engines remain separate so tax, refund, accounting, and reporting behavior stay explicit.

## Security and Abuse Boundary

Loyalty enforces local correctness limits such as idempotency, one-time use, maximum offline allowance, and adjustment approvals. The Security Risk service owns cross-transaction velocity, reputation, correlated anomalies, insider-abuse analysis, and review cases.

Required controls include:

- Permissioned adjustments with reason and approval thresholds
- Account merge and transfer governance
- Strong recovery for compromised member accounts
- Employee and insider-abuse signals
- Idempotent source transaction references
- Full audit of manual changes

## Customer Experience

Customers see available balance, pending balance, expiring value, tier progress, transaction history, program terms, and the effect of a proposed redemption before confirmation.

## Events

- `loyalty.membership.created.v1`
- `loyalty.points-earned.posted.v1`
- `loyalty.points-redemption.posted.v1`
- `loyalty.ledger-entry.reversed.v1`
- `loyalty.points-balance.expired.v1`
- `loyalty.tier.changed.v1`

## Capability Family

- `loyalty.programs`
- `loyalty.memberships`
- `loyalty.accounts`
- `loyalty.ledger`
- `loyalty.earning`
- `loyalty.redemption`
- `loyalty.tiers`
- `loyalty.expiration`

## Initial Scope

- One points currency per program
- Spend and item-based earning
- Fixed points redemption
- Tiering
- Expiration
- Returns and reversals
- POS and customer-portal balance

Coalition programs and advanced partner settlement are later capabilities. Paid membership agreements remain owned by Recurring Commerce.