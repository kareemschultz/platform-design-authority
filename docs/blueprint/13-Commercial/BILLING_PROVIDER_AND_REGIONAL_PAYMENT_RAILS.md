---
document_id: PDA-COM-012
title: Billing Provider and Regional Payment Rails
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0011, ADR-0015]
---

# Billing Provider and Regional Payment Rails

## Purpose

Define how the platform bills its own subscribers and how tenant businesses accept, reconcile, refund, and disburse money across cash, bank, wallet, card, and regional rails without confusing the commercial layers.

## Payment Contexts

### Platform Billing

The platform charges tenants, partners, or resellers for subscriptions, usage, services, marketplace items, and implementation work.

### Tenant Customer Payments

Tenant businesses collect from their customers and issue refunds through cash, card, wallet, bank, account, and stored-value tenders.

### Tenant Disbursements

Tenant businesses pay suppliers, workers, customers, or other beneficiaries. Disbursement is distinct from customer acceptance and requires separate provider capability and authority.

### Marketplace and Partner Settlement

The platform may calculate amounts owed to publishers or partners. Actual custody, payout, and KYC depend on the approved operating model and provider.

These contexts may use different providers, legal entities, merchant accounts, currencies, settlement locations, risk models, and tax treatment.

## Initial Merchant Operating Model

ADR-0015 proposes direct tenant-merchant contracts for the initial release.

- Each tenant contracts directly with its wallet, bank, acquirer, or payment provider.
- Provider credentials and merchant identifiers are tenant-scoped.
- Settlement flows directly according to the tenant-provider agreement.
- The platform orchestrates transactions and reconciliation but does not pool or custody tenant funds.
- A payment-facilitator, aggregator, sub-merchant, or merchant-of-record model is prohibited until separately approved.

The platform legal entity and billing currency remain founder decisions in `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md`.

## Regional Findings

As verified on 2026-07-10, Stripe's published standard account-availability list did not include Guyana. Stripe may still be relevant through a supported legal entity or commercial partner, but no such structure is assumed.

MMG's official Guyana business material describes merchant services, biller collection, disbursement, a developer API, redirect checkout, and merchant-initiated payment requests. This supports evaluating MMG as a tenant payment adapter. It does not prove unattended recurring debit, partial refund, chargeback, settlement timing, multi-currency settlement, or every required POS behavior.

The Bank of Guyana website was under maintenance during the July 2026 research pass. Regulatory interpretation remains a required legal-review item.

## Cash as a First-Class Rail

Cash is not a provider fallback. It has its own lifecycle and evidence:

- Opening float
- Cash receipt and change
- Paid-in and paid-out
- Refund and return
- Safe drop and transfer
- End-of-shift count
- Expected-versus-counted variance
- Deposit preparation
- Courier or agent handoff where applicable
- Bank deposit confirmation
- Finance reconciliation

Cash collection for the platform's own SaaS invoices is disabled pending FDR-010. Any future approved receivables and agent-collection process must remain separate from tenant customer cash.

## Provider-Neutral Strategy

### Platform Billing Adapter

Must support the selected commercial requirements, potentially including:

- Product and price synchronization
- Platform subscriptions, schedules, trials, usage, invoices, credits, refunds, tax, and dunning
- Customer portal or secure payment-method management
- Webhook verification and replay
- Billing and settlement currencies
- Accounting exports

### Tenant Payment Adapter

Declares, rather than merely implying, support for:

- Interactive online checkout
- POS or merchant-initiated request-to-pay
- Authorization and capture
- Void and reversal
- Full and partial refund
- Dispute or chargeback
- Tokenization
- Unattended recurring collection
- Bank or wallet settlement
- Payout or disbursement
- Webhook or polling status
- Sandbox and certification
- Offline or deferred acceptance

A workflow may use only capabilities verified for that tenant-provider contract.

## Recurring Collection Constraint

Recurring Commerce selects a collection mode based on verified rail capability:

- Automatic provider-initiated collection
- Customer-approved request-to-pay
- Generated invoice with customer-initiated payment
- Bank standing order or direct debit
- Cash collection

MMG's documented merchant payment-request flow must not be modeled as automatic debit unless its production contract and technical certification explicitly support unattended collection.

## Refund, Reversal, and Dispute Matrix

Each rail class defines:

- Whether a transaction can be voided before settlement
- Whether reversal is supported after uncertain outcomes
- Full and partial refund support
- Refund destination and timing
- Chargeback or dispute semantics
- Cash refund and approval requirements
- Refund-to-store-credit rules
- Fees that are or are not recoverable
- Reconciliation evidence

Store credit may not be substituted for an otherwise required original-tender refund solely for platform convenience.

## Currency and Settlement

The product supports GYD as a first-class currency and must support USD and additional currencies. Provider selection must record:

- Transaction currency
- Price currency
- Settlement currency
- Bank-account currency
- Provider FX behavior
- Approved exchange-rate source
- Rounding and gains or losses
- Refund currency

No provider may silently convert currency without exposing the rate, fee, and settlement result.

## Provider Selection Matrix

Evaluate each provider by:

- Merchant and platform country availability
- Direct-merchant, facilitator, or connected-account operating model
- Supported legal entities and onboarding
- Settlement currencies, banks, and payout timing
- Interactive, request-to-pay, recurring, and disbursement capabilities
- Online, mobile, wallet, card, bank, cash-assist, and in-person methods
- Refunds, reversals, disputes, reconciliation, and reporting
- API maturity, webhooks, sandbox, idempotency, and status visibility
- PCI scope and tokenization
- Fraud controls
- Tax and invoicing compatibility
- Pricing, reserves, minimums, FX costs, and support
- Data portability and exit path

## Initial Recommendation

1. Keep commercial state, entitlements, usage, and invoices provider-neutral.
2. Use direct tenant-provider contracts for tenant payments.
3. Treat cash and bank transfer as first-class from the first retail and commercial releases.
4. Prototype Stripe Billing only after the platform legal entity and settlement accounts are supported.
5. Prototype MMG for Guyana tenant checkout and customer-approved payment requests.
6. Do not promise automatic recurring collection until a rail is verified.
7. Do not make Stripe Connect or another payout product a constitutional dependency.

## Reconciliation

Every provider or cash integration reconciles:

- Internal payment, order, invoice, stored-value, or deposit identifier
- Provider transaction and settlement identifiers where applicable
- Gross amount, fees, tax, net amount, and currency
- Authorization, capture, refund, reversal, dispute, and payout states
- Cash count, transfer, and bank deposit
- Bank or wallet settlement
- Accounting postings
- Exceptions and manual adjustments

## Security and Compliance

- Prefer hosted checkout, provider components, or tokenization to reduce card-data exposure.
- Never store CVV or unprotected primary account numbers.
- Protect API keys and signing secrets through the Secrets service.
- Require idempotency for financial commands.
- Verify every webhook and reconcile independently.
- Separate tenant merchant credentials from platform merchant credentials.
- Obtain legal review before any custody, pooling, sub-merchant, KYC, or facilitator model.

## Known Unknowns

### MMG

- Production onboarding and merchant-contract requirements
- Refund, reversal, partial refund, and dispute behavior
- Recurring or unattended collection
- Settlement timing, fees, reserves, and currencies
- Sandbox, certification, webhook reliability, and support service levels
- Merchant-initiated payment-request user experience and expiry

### Stripe or Other Global Billing Provider

- Supported platform legal entity
- Settlement bank and currency
- Tax, invoicing, and merchant-of-record implications
- Regional payment-method support
- Marketplace or partner payout eligibility

### Guyana Regulation

- National payment-system licensing boundaries
- Aggregator or payment-facilitator treatment
- AML/CFT, sanctions, safeguarding, complaints, and reporting
- Electronic money and stored-funds treatment
- Cross-border and foreign-currency restrictions

## Open Decisions

- Platform operating legal entity and bank accounts
- Platform subscription-billing provider
- Platform billing currency and international billing policy
- Guyana and Caribbean provider coverage beyond MMG
- Future marketplace payout and KYC model
- In-person card acquiring and terminal strategy

## Source References

- Stripe global availability: https://stripe.com/global
- MMG Business: https://mmg.gy/business/
- MMG Developer API: https://mmg.gy/developer/
- Founder decisions: `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md`
- Guyana retail profile: `docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_JURISDICTION_PROFILE.md`
