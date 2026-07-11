---
document_id: PDA-COM-012
title: Billing Provider and Regional Payment Rails
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0011]
---

# Billing Provider and Regional Payment Rails

## Purpose

Define how the platform bills its own subscribers and how tenant businesses accept and disburse money across global and regional payment rails without confusing the two commercial layers.

## Two Payment Contexts

### Platform Billing

The platform charges tenants, partners, or resellers for subscriptions, usage, services, marketplace items, and implementation work.

### Tenant-Facing Payments

Tenant businesses collect from their customers, issue refunds, pay suppliers, disburse payroll or incentives, and settle marketplace or partner funds.

These contexts may use different providers, legal entities, merchant accounts, currencies, settlement locations, risk models, and tax treatment.

## Current Regional Finding

As verified on 2026-07-10, Stripe's published global-availability list does not include Guyana as a supported country for opening a standard local Stripe account. Stripe can still be relevant through a supported foreign legal entity, a merchant-of-record arrangement, or future regional expansion, but none of those should be assumed without legal, banking, tax, settlement, and commercial review.

MMG's official Guyana business offering currently describes:

- Merchant services with settlement to a bank or MMG account
- Biller collection services
- Disbursement services for salaries, supplier fees, reimbursements, and incentives
- A developer API
- Redirect-based merchant checkout
- Merchant-initiated payment flows intended for in-store or POS use

This makes MMG a serious candidate adapter for Guyana tenant-facing payments, but not automatically the platform's global subscription-billing provider.

## Strategy

Use a provider-neutral Payment and Billing adapter architecture with separate provider selections by use case and region.

### Platform Billing Adapter

Must support:

- Product and price synchronization
- Subscriptions, schedules, trials, usage, invoices, credits, refunds, tax, and dunning
- Customer portal or secure payment-method management
- Webhook verification and replay
- Multi-currency settlement
- Revenue recognition and accounting exports where needed

### Tenant Payment Adapter

Must support relevant subsets of:

- Online checkout
- POS and merchant-initiated payments
- Authorization, capture, void, refund, and reversal
- Wallet and bank settlement
- Payment status and reconciliation
- Payouts and disbursements
- Chargebacks or disputes
- Tokenization and saved payment methods where legally supported

## Provider Selection Matrix

Evaluate each provider by:

- Merchant and platform country availability
- Supported legal entities and onboarding
- Settlement currencies, banks, and payout timing
- Recurring billing and usage support
- Marketplace or connected-account support
- Online, mobile, wallet, and in-person methods
- Refunds, disputes, reconciliation, and reporting
- API maturity, webhooks, sandbox, idempotency, and status visibility
- PCI scope and tokenization
- Fraud controls
- Tax and invoicing compatibility
- Pricing, reserves, minimums, foreign-exchange costs, and support
- Data portability and exit path

## Initial Recommendation

1. Keep platform commercial state, entitlements, usage, and invoices provider-neutral.
2. Run a formal provider evaluation after confirming the platform's operating legal entity and bank accounts.
3. Prototype Stripe Billing only if the chosen legal entity is supported and settlement is commercially workable.
4. Prototype MMG for Guyana merchant checkout and POS payment requests.
5. Support bank transfer and manual payment reconciliation from the first commercial release.
6. Do not make Stripe Connect or any single marketplace payout product a constitutional dependency.

## Reconciliation

Every provider integration must reconcile:

- Internal payment or invoice identifier
- Provider transaction and settlement identifiers
- Gross amount, fees, tax, net amount, and currency
- Authorization, capture, refund, reversal, dispute, and payout states
- Bank or wallet settlement
- Accounting postings
- Exceptions and manual adjustments

## Security and Compliance

- Prefer hosted checkout, provider components, or tokenization to reduce card-data exposure.
- Never store CVV or unprotected primary account numbers.
- Protect API keys and signing secrets through the platform secrets service.
- Require idempotency for financial commands.
- Verify every webhook and reconcile independently.
- Separate tenant merchant credentials from platform merchant credentials.

## Open Decisions

- Platform legal entity and settlement jurisdiction
- Primary global subscription-billing provider
- Merchant-of-record versus direct seller model
- Guyana and Caribbean provider coverage beyond MMG
- Marketplace payout and KYC model
- In-person card acquiring and terminal strategy

## Source References

- Stripe global availability: https://stripe.com/global
- MMG Business: https://mmg.gy/business/
- MMG Developer API: https://mmg.gy/developer/
