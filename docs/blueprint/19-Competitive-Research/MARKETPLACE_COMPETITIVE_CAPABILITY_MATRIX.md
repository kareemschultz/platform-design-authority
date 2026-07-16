---
document_id: PDA-CIR-045
title: Marketplace Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0017, ADR-0019, ADR-0025]
---

# Marketplace Competitive Capability Matrix

## Scope and explicit deferral

This research uses public Adyen for Platforms, Stripe Connect, Shopify marketplace/app, and open commerce documentation. Meridian marketplace paid billing, publisher payout, split settlement, custody, payment facilitation, aggregation, and merchant-of-record behavior remain disabled pending founder and external gates.

| Concern | Documented platform pattern | Meridian decision |
|---|---|---|
| seller onboarding | KYC/KYB, terms, capability status, accounts | seam only; no claim of jurisdictional completeness |
| listings/moderation | seller submission plus platform review | domain-owned listing facts and explicit moderation authority |
| commissions | pricing/rule calculation | defer paid marketplace economics and payout |
| split settlement | provider-specific split instructions and balance accounts | reject for initial tenant payments |
| disputes/refunds | platform, seller, and provider responsibilities vary | cannot implement before liability/authority decision |
| extensions | apps, APIs, webhooks, isolated runtimes | follow ADR-0019; no third-party code in core process |

## Findings and rejected patterns

Marketplace UX hides substantial regulated and operational responsibility. Meridian must not interpret a provider API as permission to facilitate payments, onboard sub-merchants, hold funds, or pay publishers. It must also reject unreviewed listings, unclear data access, undisclosed commissions, and extension authority broader than the installing tenant grants.

## Confidence and limitations

Confidence is high that these are distinct gated capabilities, low on commercial/regulatory feasibility. No seller account, legal agreement, payout corridor, or production marketplace was tested.

## Sources

- [Stripe Connect](https://docs.stripe.com/connect) — official developer documentation, retrieved 2026-07-16.
- [Adyen for Platforms](https://docs.adyen.com/platforms/) — official developer documentation, retrieved 2026-07-16.
- [Adyen split transactions](https://docs.adyen.com/platforms/split-transactions/) — official developer documentation, retrieved 2026-07-16.
- [Shopify app review](https://shopify.dev/docs/apps/launch/app-store-review) — official developer documentation, retrieved 2026-07-16.

