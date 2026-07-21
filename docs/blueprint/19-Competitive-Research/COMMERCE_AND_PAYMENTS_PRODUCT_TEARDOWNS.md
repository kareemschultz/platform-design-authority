---
document_id: PDA-CIR-046
title: Commerce and Payments Product Teardowns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0017, ADR-0019, ADR-0025]
---

# Commerce and Payments Product Teardowns

## Method and cutoff

Public documentation was synthesized on 2026-07-16; no private architecture is inferred. Product editions, processor relationships, hardware, geography, and access limitations prevent parity claims.

## Product clusters

### Square and Toast: operational POS ecosystems

Strong patterns include sales-history recovery, explicit offline guidance, operator-oriented closeout, and integrated device flows. The principal weakness for a portable design is ecosystem coupling: behavior depends on processor, hardware, product family, and configuration. Adopt recovery visibility; do not copy provider-shaped domain authority.

### Shopify and Lightspeed: omnichannel administration

Catalog, channel, order, and POS workflows benefit from shared context. The risk is treating one suite's projection as universal authority and carrying plan-dependent behavior into assumptions. Adopt cross-channel discoverability; improve freshness and ownership disclosure.

### Stripe, Adyen, and Braintree: programmable payment rails

Intent/reference identity, idempotency, asynchronous events, refund/capture operations, and settlement evidence are strong. Object models and capability coverage differ materially. Adopt explicit lifecycle and evidence; reject SDK objects as canonical business contracts.

### WooCommerce, Medusa, and Saleor: extensibility tradeoffs

Composable commerce exposes useful seams but places more integration, upgrade, plugin, and operational responsibility on implementers. Adopt explicit contracts; reject unconstrained extension execution and fragmented authority.

## Customer pain and Meridian implications

Repeated pain occurs at offline uncertainty, disconnected terminal/order states, refund eligibility, partial fulfillment, plugin conflicts, and settlement mismatch. Meridian's candidate improvement is a shared uncertainty and review-queue grammar across POS, Payment, Inventory, Commerce, and Finance—subject to prototype evidence.

## Confidence and limitations

Medium. Public docs describe intended behavior, not frequency of failures or production usability. Pricing and regional availability were not normalized.

## Sources

- [Toast offline mode](https://doc.toasttab.com/doc/platformguide/adminOfflineModeOverview.html) — official, retrieved 2026-07-16.
- [Shopify POS documentation](https://help.shopify.com/en/manual/sell-in-person) — official, retrieved 2026-07-16.
- [Stripe payment lifecycle](https://docs.stripe.com/payments/payment-intents) — official, retrieved 2026-07-16.
- [Adyen online payments](https://docs.adyen.com/online-payments/) — official, retrieved 2026-07-16.
- [WooCommerce documentation](https://woocommerce.com/documentation/) — official, retrieved 2026-07-16.

