---
document_id: ADR-0011
title: Use Provider Neutral Billing and Regional Payment Rails
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
related_adrs: [ADR-0013, ADR-0015]
---

# ADR-0011 — Use Provider-Neutral Billing and Regional Payment Rails

## Context

The platform needs subscription billing for its own customers and payment processing for tenant businesses. These are different legal and operational contexts.

The founder's initial market includes Guyana and the Caribbean. As verified on 2026-07-10, Guyana was not listed on Stripe's published supported-country page for standard local account availability. MMG publishes Guyana merchant, biller, disbursement, and developer-API capabilities, including redirect checkout and merchant-initiated payment requests.

Cash, bank transfer, wallet, card, stored value, platform billing, tenant payments, disbursements, and marketplace settlement have different lifecycles. Choosing one provider as the universal architecture would create regional exclusion and vendor coupling.

## Options Considered

### Stripe-only architecture

Provides strong billing and developer tooling where available, but cannot be assumed for Guyana-local onboarding and settlement and would make tenant payment coverage dependent on one provider.

### Regional-provider-only architecture

Fits local payment rails but may not provide mature global SaaS billing, usage metering, marketplace settlement, tax, and international payment coverage.

### Build payment processing internally

Rejected because of regulatory, security, fraud, banking, safeguarding, and operational burden.

### Provider-neutral core with adapters selected by use case and jurisdiction

Preserves stable internal models while allowing global, regional, bank, wallet, and cash workflows to coexist.

## Decision

Adopt provider-neutral Billing and Payment architecture.

- The platform owns contracts, platform subscriptions, entitlement intent, usage, invoice mirrors, payment references, reconciliation, and accounting integration.
- External providers own payment instruments, provider execution, provider settlement, and regulated payment operations.
- Platform billing and tenant-facing payments may use different providers.
- Stripe is an evaluation candidate, not a universal dependency.
- MMG is an evaluation candidate for Guyana tenant-facing merchant checkout and customer-approved payment requests.
- Cash and bank transfer are first-class rails with explicit deposit, matching, and variance workflows.
- Customer stored value is owned by Commerce under ADR-0013, not by a payment provider or engine.
- The initial tenant merchant operating model is decided separately by ADR-0015: direct tenant-provider contracts first.

## Provider Capability Rule

Each adapter declares support for interactive checkout, request-to-pay, tokenization, unattended collection, authorization, capture, void, reversal, refund, partial refund, dispute, settlement, payout, currencies, sandbox, and status delivery.

A consuming workflow cannot infer unattended recurring collection from tokenization or merchant-initiated payment support.

## Consequences

### Positive

- Supports Guyana and future regional markets
- Prevents provider IDs from becoming business identities
- Allows best-fit billing and payment providers
- Preserves migration and self-hosting flexibility
- Separates platform revenue from tenant merchant funds
- Treats cash-heavy operations explicitly

### Negative

- Requires multiple adapters and reconciliation paths
- Feature parity varies by provider and jurisdiction
- Commercial onboarding and support become more complex
- Marketplace payouts require a separate strategic decision
- Direct tenant contracts create more onboarding friction than a facilitator model

## Required Controls

- Confirm platform legal entity, billing currency, and settlement jurisdiction before provider selection
- Apply ADR-0015 to tenant merchant onboarding
- Complete provider due diligence and sandbox prototypes
- Tokenize payment instruments and minimize PCI scope
- Verify webhooks and use idempotency
- Maintain internal payment and invoice state
- Reconcile provider, bank, wallet, cash deposit, stored value, and accounting records
- Isolate tenant and platform credentials
- Define provider outage and exit procedures
- Obtain legal review before custody, pooling, sub-merchant, or facilitator behavior

## Deferred Decisions

- Primary platform subscription-billing provider
- Platform operating legal entity and billing currency
- Primary Caribbean gateway coverage
- In-person terminal provider
- Marketplace KYC and payout provider
- Any future payment-facilitator, aggregator, or merchant-of-record model

## Validation

Validate with:

1. A platform subscription and usage invoice through a supported billing-provider prototype.
2. A tenant directly contracted to MMG, a bank, or another provider.
3. Cash sale, register close, deposit, and reconciliation.
4. Refund, reversal, and rail-capability mismatch workflows.
5. Bank-transfer invoice with manual matching.
6. Provider outage and webhook replay testing.

## Source References

- https://stripe.com/global
- https://mmg.gy/business/
- https://mmg.gy/developer/
- `18-Decisions/ADR-0015-DIRECT-TENANT-MERCHANT-CONTRACTS-FIRST.md`
- `20-Strategy/FOUNDER_DECISION_REGISTER.md`