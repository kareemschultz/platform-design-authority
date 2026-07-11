---
document_id: ADR-0011
title: Use Provider Neutral Billing and Regional Payment Rails
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0011 — Use Provider-Neutral Billing and Regional Payment Rails

## Context

The platform needs subscription billing for its own customers and payment processing for tenant businesses. These are different legal and operational contexts.

The founder's initial market includes Guyana and the Caribbean. As verified on 2026-07-10, Guyana is not listed on Stripe's published supported-country page for standard local account availability. MMG provides Guyana merchant, biller, disbursement, and developer-API capabilities, including merchant checkout and merchant-initiated payments.

Choosing one provider as the universal platform and tenant payment architecture would create regional exclusion and unnecessary vendor coupling.

## Options Considered

### Stripe-only architecture

Provides strong billing and developer tooling where available, but cannot be assumed for Guyana-local onboarding and settlement and would make tenant payment coverage dependent on one provider.

### Regional-provider-only architecture

Fits local payment rails but may not provide mature global SaaS billing, usage metering, marketplace settlement, tax, and international payment coverage.

### Build payment processing internally

Unacceptable regulatory, security, fraud, banking, and operational burden.

### Provider-neutral core with adapters selected by use case and jurisdiction

Preserves a stable internal model while allowing global and regional providers to coexist.

## Decision

Adopt a provider-neutral Billing and Payment architecture.

- The platform owns contracts, subscriptions, entitlement intent, usage, invoice mirrors, payment references, reconciliation, and accounting integration.
- External providers own payment instruments, payment execution, provider invoices where used, settlement, and regulated payment operations.
- Platform billing and tenant-facing payments may use different providers.
- Stripe is an evaluation candidate, not a universal dependency.
- MMG is an evaluation candidate for Guyana tenant-facing merchant checkout, POS payment requests, bill collection, and disbursement.
- Bank transfer and manual reconciliation remain supported rails.

## Consequences

### Positive

- Supports Guyana and future regional markets
- Prevents provider IDs from becoming business identities
- Allows best-fit billing and payment providers
- Preserves migration and self-hosting flexibility
- Separates platform revenue from tenant merchant funds

### Negative

- Requires multiple adapters and reconciliation paths
- Feature parity varies by provider and jurisdiction
- Commercial onboarding and support become more complex
- Marketplace payouts may require a separate strategic decision

## Required Controls

- Confirm legal entity and settlement jurisdiction before provider selection
- Complete provider due diligence and sandbox prototypes
- Tokenize payment instruments and minimize PCI scope
- Verify webhooks and use idempotency
- Maintain internal payment and invoice state
- Reconcile provider, bank, wallet, and accounting records
- Isolate tenant and platform credentials
- Define provider outage and exit procedures

## Deferred Decisions

- Primary platform subscription-billing provider
- Merchant-of-record model
- Primary Caribbean gateway coverage
- In-person terminal provider
- Marketplace KYC and payout provider

## Validation

Validate with:

1. A platform subscription and usage invoice through a supported billing-provider prototype.
2. An MMG Guyana merchant checkout or merchant-initiated POS prototype.
3. Refund and reconciliation workflows.
4. A bank-transfer invoice with manual matching.
5. Provider outage and webhook replay testing.

## Source References

- https://stripe.com/global
- https://mmg.gy/business/
- https://mmg.gy/developer/
