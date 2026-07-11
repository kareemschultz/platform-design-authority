---
document_id: PDA-ENG-016
title: Loyalty Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0009]
---

# Loyalty Engine

## Purpose

Define reusable loyalty programs, membership tiers, earn and redemption rules, points and benefits ledgers, expiration, adjustments, partner programs, and customer-facing balances across industries.

## Ownership Decision

The Loyalty Engine owns loyalty program configuration, loyalty accounts, non-cash points and benefit ledgers, tier evaluation, earn and redemption policy, expiration, and loyalty-specific adjustments.

Other owners remain authoritative for:

- Party and customer identity: Party and CRM
- Sales and returns: Commerce
- Promotions and immediate price discounts: Promotion Engine
- Gift cards, store credit, and monetary stored value: Payment and Finance domains
- Marketing journeys and communication: Marketing
- Fraud and risk decisions: Security and future risk services

## Core Entities

- Loyalty program
- Program version
- Membership
- Loyalty account
- Points or benefit currency
- Ledger entry
- Earn rule
- Redemption rule
- Tier and qualification period
- Benefit
- Expiration policy
- Adjustment and reversal
- Partner or coalition agreement

## Ledger Rules

1. Loyalty balances derive from append-oriented ledger entries.
2. Posted earn and redemption entries are reversed, not deleted.
3. Every entry records source transaction, rule version, party, tenant, currency, quantity, timestamp, and expiry where applicable.
4. Monetary value is not implied unless a governed conversion rule explicitly defines it.
5. Gift cards and store credit do not use the loyalty-points ledger.
6. Negative balances require explicit program policy.

## Program Rules

Programs may define:

- Spend-based and item-based earning
- Visits, referrals, milestones, subscriptions, and engagement earning
- Bonus periods and multipliers
- Category, channel, location, and customer-segment conditions
- Fixed, dynamic, or catalog-based redemptions
- Tier thresholds and rolling periods
- Expiration and inactivity rules
- Household or business-account pooling
- Partner earn and burn
- Jurisdiction and age restrictions

Rules must be versioned and explainable at the transaction level.

## Commerce Integration

Commerce requests a loyalty quote before completion and posts final earn or redemption commands only after the sale reaches the defined state. Returns, cancellations, and chargebacks issue reversals according to the original rule version and return policy.

Offline POS may redeem only within a signed offline allowance and cached policy. Reconnection reconciles reservations and prevents double redemption.

## Promotions Boundary

A promotion changes transaction pricing. Loyalty changes a member's loyalty ledger or benefits. A loyalty redemption may request a promotion or payment-like discount application, but the engines remain separate so tax, refund, accounting, and reporting behavior stay explicit.

## Security and Abuse

- Permissioned adjustments with reason and approval thresholds
- Velocity and unusual-redemption controls
- Account merge and transfer governance
- Strong recovery for compromised member accounts
- Employee and insider-abuse detection
- Idempotent source transaction references
- Full audit of manual changes

## Customer Experience

Customers should see available balance, pending balance, expiring value, tier progress, transaction history, program terms, and the effect of a proposed redemption before confirmation.

## Events

- `loyalty.membership.created.v1`
- `loyalty.points-earned.v1`
- `loyalty.points-redeemed.v1`
- `loyalty.entry-reversed.v1`
- `loyalty.points-expired.v1`
- `loyalty.tier-changed.v1`

## Initial Scope

- One points currency per program
- Spend and item-based earning
- Fixed points redemption
- Tiering
- Expiration
- Returns and reversals
- POS and customer-portal balance

Coalition programs, paid memberships, and advanced partner settlement are later capabilities.
