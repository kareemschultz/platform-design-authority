---
document_id: ADR-0012
title: Use a Connector First Strategy with a Native Reference Storefront
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0012 — Use a Connector-First Strategy with a Native Reference Storefront

## Context

The capability map previously represented e-commerce through only `commerce.ecommerce` and `commerce.checkout`, which concealed the scope of a complete storefront product. A full native storefront competes with mature specialist platforms and could delay the first retail POS and inventory vertical slice.

The platform still needs a first-party digital-commerce experience and stable headless commerce contracts.

## Options Considered

### Build a full native storefront platform before the retail release

Maximizes first-party control but creates substantial theme, content, SEO, checkout, performance, app, and channel scope before the kernel and retail operating workflows are proven.

### Integrate only with external storefronts

Reduces scope but leaves new customers without a unified first-party option and weakens the white-label platform proposition.

### Connector-first with a bounded native reference storefront

Supports existing customers through mature channels while proving first-party APIs and offering a simple unified storefront to new customers.

## Decision

Adopt a connector-first strategy while building one bounded native reference storefront.

- External storefront connectors are a first-release priority where customers already use established platforms.
- The native Next.js storefront proves catalog, pricing, availability, cart, checkout, customer, order, payment, branding, and content contracts.
- A general-purpose page builder, app ecosystem, and advanced multi-market merchandising are not first-slice requirements.
- The native storefront remains strategic and may mature after the retail operating platform is proven.

## Consequences

### Positive

- Reduces first-release scope and delivery risk
- Preserves a unified customer option
- Forces reusable headless contracts
- Allows migration and coexistence with external stores
- Keeps the retail POS and inventory beachhead central

### Negative

- Initial native storefront depth will trail specialists
- Connector reconciliation and source-of-truth policy are required
- Customers may experience feature differences across channels

## Required Controls

- Explicit ownership and synchronization direction per connector
- Server-side checkout recalculation
- Idempotent order creation
- Inventory reservation and reconciliation
- Custom-domain and script security controls
- Accessibility and performance budgets
- No connector-specific logic in core Commerce models

## Validation

Validate with:

1. A reference storefront completing product discovery through paid order.
2. One external storefront connector synchronizing products, inventory, orders, and fulfillment.
3. Reconciliation after duplicate, delayed, and conflicting events.
4. White-label custom domain and theme.
5. Accessible mobile checkout with measured performance.
