---
document_id: PDA-DOM-025
title: Stored Value and Customer Balances
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0013, ADR-0014, ADR-0016]
---

# Stored Value and Customer Balances

## Purpose

Define Commerce-owned monetary value issued by a tenant business to customers, including gift cards, store credit, refund credits, and prepaid customer balances.

## Boundary

This specification covers monetary obligations denominated in a currency or explicitly convertible to money.

It does not cover loyalty points, bank deposits, accounts receivable, platform SaaS credits, payment credentials, regulated wallets, or marketplace publisher balances.

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

Anonymous or registered gift card, customer store credit, refund credit, promotional monetary credit, and prepaid service or merchandise balance.

## Ledger Model

Balances derive from append-oriented Issue, Activate, Load, Reserve, Release, Redeem, Refund, Reverse, Expire, Reinstate, Adjust, Transfer Out, and Transfer In entries.

Every entry records tenant, legal entity, program, instrument or account, currency, value, source transaction, channel, operator, timestamps, idempotency key, rule version, and correlation identifiers.

Posted entries are corrected through linked reversal and replacement entries.

## Currency and Legal Entity

A monetary instrument has one issued currency unless a jurisdiction-approved conversion model exists. Liability belongs to a named tenant legal entity. Cross-entity redemption requires settlement rules.

The Guyana-first slice supports GYD and a path for USD or other currencies without assuming free interchangeability.

## Issuance and Redemption

Issuance may originate from POS, customer service, return, promotion, storefront, bulk program, or migration.

Payment Engine treats stored value as a tender and requests authorization from Commerce. Commerce validates instrument state, balance, tenant, legal entity, restrictions, currency, expiry, risk, customer requirements, entitlement, and operational availability.

Successful authorization creates an idempotent reservation or immediate redemption. Capture and release remain explicit.

## Returns and Refunds

Refund policy distinguishes original external tender, stored-value tender, new store credit, mixed tender, gift receipt, no-receipt return, and provider limitations.

The customer sees the proposed destination before confirmation. Store credit is not used to avoid an otherwise required original-tender refund.

## Offline Operation

Offline POS may use a signed device allowance, pre-reserved value, locally restricted instrument, or online-only authorization. It must not treat a stale global balance as authoritative.

Offline entries use client-generated identifiers and reconcile against duplicate-use controls. Conflicts enter an operational queue.

## Expiry, Dormancy, and Breakage

Expiry, fees, dormancy, breakage, cash-out, and unclaimed-property behavior are jurisdiction-specific. Finance owns accounting interpretation; Commerce applies the operational rule and retains evidence.

## Security and Fraud Controls

- Protected activation data
- Velocity limits
- Employee and manager override monitoring
- Recovery and transfer controls
- Anomaly review
- Duplicate and replay protection
- Separation of administration, adjustment, and reconciliation

## Privacy

Anonymous instruments remain minimally identifiable. Registered accounts link to Party through a scoped reference. Financial facts may be retained while direct identifiers are pseudonymized under ADR-0014.

## Finance Integration

Finance owns liability mapping, cash and tender clearing, breakage accounting, intercompany settlement, unclaimed-property treatment, and financial presentation.

## Events

- `commerce.stored-value-instrument.issued.v1`
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

Coalition programs, cash-equivalent withdrawals, cross-tenant instruments, and regulated wallets are deferred.