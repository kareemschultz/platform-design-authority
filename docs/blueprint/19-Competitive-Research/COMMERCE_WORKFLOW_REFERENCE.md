---
document_id: PDA-CIR-040
title: Commerce Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0017]
---

# Commerce Workflow Reference

## Reference workflow

1. Resolve storefront, tenant, market, currency, catalog projection, and customer context.
2. Add a sellable reference to a durable cart; recalculate with explicit price, tax, promotion, and availability provenance.
3. Capture addresses and delivery choice with accessible validation and saved-progress rules.
4. Establish an order attempt and payment operation identity before external calls.
5. Confirm only after authoritative order creation; expose payment or inventory uncertainty separately.
6. Fulfill partially or fully with shipment, pickup, cancellation, and backorder states.
7. Return or exchange against original lines; compensate Inventory, Payment, Commerce, stored value, tax, and Finance through their contracts.

## Failure and recovery

| Failure | Recovery contract |
|---|---|
| stale availability | revalidate before commitment; explain changed quantity |
| price/tax change | show diff and require reconfirmation |
| duplicate submit | return prior result by idempotency key |
| payment unknown | hold order in explicit review state; reconcile via provider evidence |
| fulfillment split | preserve line-level quantities and independent shipment state |
| webhook replay | deduplicate, order safely, and retain raw evidence through Developer Platform |

## Authority and deferral

Commerce owns customer order behavior; Catalog, Inventory, Payment, Party, Finance, and Developer Platform retain their stated authorities. Production storefront, customer recurring commerce, and broad marketplace execution remain deferred.

## Confidence and revalidation

Confidence is medium-high for the generalized workflow and low for vendor parity. Revalidate when first-slice depth changes or when a provider, tax, fraud, subscription, or fulfillment contract is selected.

## Sources

- [Shopify fulfillment](https://help.shopify.com/en/manual/fulfillment) — official help, retrieved 2026-07-16.
- [WooCommerce shipping](https://woocommerce.com/documentation/woocommerce/getting-started/shipping/) — official documentation, retrieved 2026-07-16.
- [Saleor order lifecycle](https://docs.saleor.io/developer/order/order-management) — official documentation, retrieved 2026-07-16.

