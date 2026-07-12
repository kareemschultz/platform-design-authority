---
document_id: ADR-0013
title: Commerce Owns Customer Stored Value
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0013 — Commerce Owns Customer Stored Value

## Context

Gift cards, store credit, prepaid balances, refund credits, promotional value, and similar instruments represent obligations owed by a tenant business to customers. Existing documents assigned parts of this responsibility to Commerce, the Payment Engine, Finance, and Loyalty without naming one authoritative owner.

The Payment Engine is an engine and therefore must not own authoritative business ledgers. Finance must account for stored-value liabilities, but the operational instrument originates from commerce transactions and is redeemed through commerce channels. Loyalty points are non-cash benefits and require a separate ledger.

## Decision Drivers

- One authoritative balance and liability source
- Correct separation between operational ownership and accounting interpretation
- Consistent issuance, redemption, expiry, refund, transfer, and reversal behavior
- Omnichannel and offline use
- Fraud and velocity controls
- Jurisdiction-specific abandoned-property, expiry, disclosure, and consumer-protection rules
- Clear distinction from loyalty points, payment credentials, and receivables

## Decision

Commerce owns customer stored-value instruments and their append-oriented operational liability ledger.

Commerce owns:

- Gift-card programs and instruments
- Store-credit accounts
- Refund credits
- Prepaid customer balances
- Issuance, activation, reload, reservation, redemption, expiry, suspension, transfer, merge, and reversal
- Omnichannel balance and transaction history
- Operational liability balance by legal entity, brand, program, currency, and jurisdiction

The Payment Engine owns tender orchestration and provider/device adapters. It validates and applies a stored-value authorization against Commerce through a published contract, but it does not own the balance.

Finance owns accounting policy, general-ledger postings, reconciliation, breakage recognition where lawful, unclaimed-property treatment, and financial reporting derived from Commerce events and snapshots.

Loyalty owns non-cash points, tiers, and benefits. A loyalty redemption may generate a Commerce discount or stored-value issuance through an explicit command, but loyalty balances are never silently converted into monetary liabilities.

## Consequences

### Positive

- One operational source of truth
- Engines remain domain-neutral
- Accounting and transaction state remain separate
- Returns and refunds can preserve original-tender policy
- Gift cards and store credit work consistently across POS, portals, storefronts, and integrations

### Negative

- Commerce gains a financially consequential subdomain requiring stronger controls
- Jurisdiction rules can materially alter expiry, fees, breakage, and abandoned-property handling
- Cross-tenant coalition instruments remain out of scope

## Required Controls

- Append-oriented ledger with reversal rather than deletion
- Explicit currency and legal-entity ownership
- Idempotent issuance and redemption
- Offline allowance or reservation rather than unrestricted offline balance mutation
- Approval and reason for manual adjustment
- Fraud, velocity, employee-abuse, and account-takeover controls
- Finance reconciliation and posting contracts
- Customer-visible balance, pending value, expiry, and terms
- Data-retention and privacy treatment that preserves financial facts while minimizing personal data

## Validation

Validate with one retail slice covering sale issuance, redemption, partial redemption, return-to-original-tender, return-to-store-credit, offline reservation, expiry policy, reconciliation, reversal, and financial posting.