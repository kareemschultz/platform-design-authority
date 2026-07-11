---
document_id: PDA-DOM-025
title: Stored Value and Customer Balances
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0013]
---

# Stored Value and Customer Balances

## Purpose

Define Commerce-owned monetary value issued by a tenant business to customers, including gift cards, store credit, refund credits, and prepaid customer balances.

## Boundary

This specification covers monetary obligations denominated in a currency or explicitly convertible to money.

It does not cover:

- Loyalty points, tiers, or non-cash benefits
- Bank deposits or regulated customer accounts
- Accounts receivable balances
- Platform SaaS credits
- Payment credentials or wallet private keys
- Marketplace publisher balances

## Core Entities

- Stored Value Program
- Program Version
- Stored Value Instrument
- Customer Balance Account
- Stored Value Ledger Entry
- Reservation
- Redemption
- Expiry Schedule
- Manual Adjustment
- Transfer or Merge
- Suspension
- Terms and Disclosure Version

## Instrument Types

- Anonymous or bearer gift card, where lawful
- Registered gift card
- Customer store-credit account
- Refund credit
- Promotional monetary credit
- Prepaid service or merchandise balance

Each type declares transferability, reloadability, expiry, dormancy, refundability, cash-out, identification, jurisdiction, channel, and offline policy.

## Ledger Model

Balances derive from append-oriented entries:

- Issue
- Activate
- Load
- Reserve
- Release reservation
- Redeem
- Refund
- Reverse
- Expire
- Reinstate
- Adjust
- Transfer out
- Transfer in

Every entry records tenant, legal entity, program, instrument or account, currency, value, source transaction, channel, operator, effective timestamp, posting timestamp, idempotency key, rule version, and correlation identifiers.

Posted entries are not edited or deleted. Corrections use linked reversal and replacement entries.

## Currency and Legal Entity

A monetary instrument has one issued currency unless a jurisdiction-approved conversion model is explicitly configured. Liability ownership belongs to a named tenant legal entity. Cross-entity redemption requires settlement and accounting rules rather than silently moving liability.

The Guyana-first retail slice must support GYD and preserve a path for USD or other currencies without assuming that one instrument can be redeemed interchangeably across currencies.

## Issuance

Issuance may occur through:

- POS sale
- Customer-service adjustment
- Return or refund
- Promotion or goodwill grant
- Storefront purchase
- Bulk corporate program
- Migration from a legacy system

Issuance and activation may be separate to reduce theft and distribution risk.

## Redemption

The Payment Engine treats stored value as a tender type and requests authorization from Commerce. Commerce verifies:

- Instrument status
- Available and pending balance
- Tenant, legal entity, brand, location, channel, and product restrictions
- Currency
- Expiry or dormancy rules
- Customer or bearer requirements
- Risk and velocity controls
- Entitlement and operational availability

Successful authorization creates a reservation or immediate redemption according to transaction semantics. Final capture and release are idempotent.

## Returns and Refunds

Refund policy must distinguish:

- Original external tender
- Original stored-value tender
- New store credit
- Mixed-tender proportional refund
- Gift receipt or no-receipt return
- Provider rail that does not support reversal or refund

The customer sees the proposed refund destination before confirmation. Store credit is not used to avoid an otherwise required refund-to-original-tender rule.

## Offline Operation

Offline POS must not rely on a stale global balance as if it were authoritative.

Allowed models include:

- Signed per-device redemption allowance
- Pre-reserved value
- Locally issued instruments restricted to the issuing device or location until synchronized
- Read-only balance display with online authorization required

Offline entries use client-generated identifiers and reconcile against reservations and duplicate-use controls. Conflicts enter an operational queue and never silently create negative liability.

## Expiry, Dormancy, and Breakage

Expiry, fees, dormancy, breakage, cash-out, and unclaimed-property behavior are jurisdiction-specific. Program configuration cannot override mandatory law. Finance determines accounting recognition; Commerce applies the operational rule and retains the evidence version used.

## Security and Fraud Controls

- High-entropy identifiers and protected activation data
- No sensitive secret printed in full
- Velocity limits for lookup, issuance, reload, redemption, and transfer
- Employee and manager override monitoring
- Account recovery and transfer controls
- Suspicious-balance and unusual-redemption review
- Duplicate and replay protection
- Separation of program administration, adjustment, and reconciliation

## Privacy

Anonymous instruments should remain minimally identifiable. Registered accounts link to Party through a scoped reference. Financial facts may require retention after valid erasure; direct identifiers are isolated and pseudonymized according to ADR-0014.

## Finance Integration

Commerce publishes stored-value events and reconciliation snapshots. Finance owns:

- Liability-account mapping
- Cash and tender clearing
- Breakage and expiry accounting
- Intercompany or cross-brand settlement
- Unclaimed-property accounting
- Financial statement presentation

## Events

- `commerce.stored-value-issued.created.v1`
- `commerce.stored-value-load.posted.v1`
- `commerce.stored-value-redemption.reserved.v1`
- `commerce.stored-value-redemption.captured.v1`
- `commerce.stored-value-entry.reversed.v1`
- `commerce.stored-value-balance.expired.v1`
- `commerce.stored-value-instrument.suspended.v1`

## Initial Scope

- Gift cards and registered store credit
- One currency per instrument
- POS issuance and redemption
- Return to store credit
- Reservations and idempotent capture
- Offline allowance prototype
- Customer balance history
- Finance reconciliation export

Coalition programs, cash-equivalent withdrawals, cross-tenant instruments, and regulated wallets are explicitly deferred.