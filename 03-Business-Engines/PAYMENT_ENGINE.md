---
document_id: PDA-ENG-008
title: Payment Engine
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0013, ADR-0015, ADR-0017]
---

# Payment Engine

## Purpose

Provide a provider-neutral engine for tender orchestration, payment methods, authorization, capture, settlement status, refunds, reversals, disputes, reconciliation, and tokenized instruments.

## Capability Family

- `payment.intents`
- `payment.methods`
- `payment.provider-adapters`
- `payment.authorization`
- `payment.capture`
- `payment.refunds`
- `payment.reversals`
- `payment.disputes`
- `payment.settlement`
- `payment.reconciliation`
- `payment.terminals`
- `payment.offline-policy`

`engine.payments` remains the top-level shared-engine registration. Detailed contracts use `payment.*` under ADR-0017.

## Core Capabilities

- Cash, card, bank, wallet, stored-value, and mixed tender
- Authorization, capture, void, refund, reversal, and chargeback
- Payment intents and idempotent provider operations
- Terminal and online payment adapters
- Tokenization and saved-method references
- Settlement, fees, payout evidence, and reconciliation records
- Cash drawer, deposit, and variance integration contracts
- Offline and deferred payment policy hooks

Customer-account or accounts-receivable tender is a future Finance and Commerce integration. It is not included in the first retail slice merely because the Payment Engine can model a tender class.

## Ownership Boundary

The Payment Engine orchestrates tender behavior and external provider state. It does not own orders, invoices, customer stored value, general-ledger entries, provider-held settlement funds, or tenant bank accounts.

Commerce owns customer stored-value instruments and balances under ADR-0013. The Payment Engine calls Commerce to reserve, capture, release, or reverse stored value as a tender. Finance owns accounting and reconciliation interpretation.

Under ADR-0015, initial tenants contract directly with providers. Provider credentials and settlement relationships are tenant-scoped.

## Provider Capability Declaration

Every adapter declares support for:

- Rail class
- Interactive checkout
- Request-to-pay
- Tokenization
- Unattended or recurring collection
- Authorization and capture
- Void, reversal, refund, and partial refund
- Dispute and chargeback
- Settlement timing and currencies
- Fees, reserves, and payout reporting
- Webhook or polling model
- Offline or deferred acceptance

A workflow cannot assume a capability merely because another provider supports it.

## Refund and Rail Asymmetry

Refund behavior is defined per rail:

- Refund to original tender where supported and required
- Void before settlement where supported
- Reversal after uncertain provider outcome
- Store credit only under approved customer policy and law
- Manual bank or cash refund with stronger approval and evidence
- Mixed-tender proportional or configured allocation

The platform shows destination and timing before confirmation. Chargeback semantics apply only to rails that support them.

## Rules

1. Payment credentials and sensitive card data must not enter ordinary domain storage.
2. Every external operation requires idempotency and provider correlation.
3. Payment state is distinct from order, stored-value, invoice, and accounting state.
4. Refund and void permissions, limits, approvals, and reason codes are explicit.
5. Partial, split, over-, and under-payment behavior is defined by the consuming domain.
6. Provider webhooks require authentication, deduplication, ordering tolerance, and reconciliation.
7. Offline acceptance requires tenant-configured risk limits and visible pending status.
8. Cash is a first-class tender with drawer, count, deposit, and variance evidence.
9. Provider success is not represented before authoritative confirmation or a defined provisional state.

## Events

- `payment.intent.created.v1`
- `payment.intent.customer-action-required.v1`
- `payment.intent.authorized.v1`
- `payment.intent.captured.v1`
- `payment.intent.failed.v1`
- `payment.intent.uncertain.v1`
- `payment.refund.completed.v1`
- `payment.reversal.completed.v1`
- `payment.settlement.received.v1`
- `payment.settlement.reconciled.v1`
- `payment.reconciliation.exception-detected.v1`

## Quality Gates

- Duplicate and delayed webhook tests
- Partial capture and refund tests
- Rail capability mismatch tests
- Provider outage and timeout tests
- Settlement and cash-deposit reconciliation
- Stored-value reservation and capture tests
- Terminal disconnect tests
- Multi-currency and mixed-tender tests
- Sensitive-data and audit review
