---
document_id: PDA-CIR-039
title: Commerce Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0017]
---

# Commerce Competitive Capability Matrix

## Purpose and scope

This document compares Shopify, BigCommerce, WooCommerce, Medusa, and Saleor using public product and developer documentation available 2026-07-16. Storefront and recurring customer commerce remain deferred by Meridian first-slice authority.

| Area | Hosted suites | Extensible platforms | Headless/open-source products | Meridian implication |
|---|---|---|---|---|
| Catalog/storefront | integrated merchandising and themes | extension-heavy administration | API-first composition | Catalog authority must not be duplicated by storefront projections |
| Cart/checkout | optimized hosted checkout, plan-dependent customization | plugin and gateway variability | composable flows require integration ownership | stable cart/order identity and validated price/tax snapshots |
| Orders | edits, cancellation, fulfillment and returns vary | extension interactions increase ambiguity | state machines are implementer-visible | explicit order transition and compensating-operation policy |
| Omnichannel | strongest inside one vendor ecosystem | connector-dependent | deliberate integration required | inventory projections disclose freshness and reservation state |
| Fraud/review | first-party or partner services | gateway/plugin-specific | external seam | review decisions are governed, explainable, and auditable |

## Findings

Table stakes are resilient cart state, accessible checkout, partial fulfillment, cancellation rules, returns, customer notifications, and idempotent order submission. Durable value comes from transparent cross-domain provenance and recovery, not from copying a theme editor or app marketplace.

## Never copy

Meridian must not copy plugin-driven authority fragmentation, mutate historical price/tax facts without compensation, treat a storefront session as Party identity, promise real-time inventory from a stale projection, or infer POS suitability from consumer checkout.

## Confidence and limitations

Confidence is medium. Checkout customization, subscriptions, fraud products, pricing, and plan entitlements are volatile. No authenticated enterprise edition was tested.

## Sources

- [Shopify order management](https://help.shopify.com/en/manual/fulfillment/managing-orders) — official help, retrieved 2026-07-16.
- [BigCommerce orders API](https://developer.bigcommerce.com/docs/rest-management/orders) — official developer documentation, retrieved 2026-07-16.
- [WooCommerce order management](https://woocommerce.com/document/managing-orders/) — official documentation, retrieved 2026-07-16.
- [Medusa order module](https://docs.medusajs.com/resources/commerce-modules/order) — official documentation, retrieved 2026-07-16.
- [Saleor checkout](https://docs.saleor.io/developer/checkout/overview) — official documentation, retrieved 2026-07-16.

