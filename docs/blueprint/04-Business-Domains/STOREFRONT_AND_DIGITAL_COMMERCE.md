---
document_id: PDA-DOM-023
title: Storefront and Digital Commerce
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0012]
---

# Storefront and Digital Commerce

## Purpose

Define the native digital storefront capability and its relationship to Commerce, Product Catalog, Pricing, Inventory, Payments, Marketing, Documents, and external commerce channels.

## Architectural Position

The native storefront is a first-party experience built on platform APIs and shared capabilities. It does not own authoritative products, prices, stock, Parties, orders, payments, promotions, tax, or customer stored value.

The product strategy is connector-first, with a bounded native reference storefront after the first POS and inventory slice. The first operational pilot may implement headless contracts and an online-order ingestion stub without shipping a production storefront.

## Core Experiences

- Home, landing, category, collection, search, and product pages
- Variant and bundle selection
- Availability and fulfillment promises
- Cart and saved cart
- Guest and account checkout
- Delivery, pickup, and shipping choices
- Payment and confirmation
- Customer account, order history, returns, and reorder
- Marketing-managed content pages, navigation, announcements, and merchandising content
- Documents-managed controlled legal notices, policies, and terms where governance is required
- Search-engine metadata, structured data, and sitemaps
- Localization, currency, market, and tax display

## Ownership Boundaries

| Concern | Owner |
|---|---|
| Product and variant master | Product Catalog |
| Price calculation | Pricing Engine |
| Promotion application | Promotion Engine |
| Availability and reservation | Inventory |
| Cart, checkout session, and order | Commerce |
| Customer identity and relationships | Party, Identity, and CRM |
| Customer stored value | Commerce Stored Value |
| Tax determination | Tax Engine |
| Payment execution | Payment Engine |
| Landing pages, navigation, campaign content, SEO copy, and merchandising content | Marketing |
| Controlled legal terms, policies, and versioned notices | Documents and Knowledge |
| Theme and brand | Branding Engine |
| Search index and retrieval | Search Platform |

A page may compose Marketing content and a controlled Documents component, but one system remains authoritative for each content block and its lifecycle.

## Headless Contract

The storefront consumes versioned APIs for catalog publication, pricing quote, availability, cart, checkout, identity, payment, stored value, order status, content, and search. The same APIs support partner storefronts, connectors, and mobile commerce experiences.

## Native Reference Storefront Scope

When scheduled after the first slice, the reference storefront may support:

- Configurable theme and custom domain
- Product, category, search, cart, checkout, account, order, and return-request pages
- Delivery and pickup
- One market and currency per storefront initially
- Accessibility and core web performance budgets
- Server rendering and search-engine discoverability
- Consent, analytics, and privacy controls

Advanced page builders, multi-market merchandising, recurring agreements, marketplace selling, and complex B2B portals are separate maturity steps.

## External Channel Strategy

Connectors for Shopify, WooCommerce, marketplaces, and social channels may synchronize or federate:

- Catalog and media
- Prices and promotions
- Inventory availability
- Orders and fulfillment
- Customers and consent subject to policy
- Returns and refunds

Every connector declares authoritative direction, conflict policy, latency, replay, deletion propagation, and reconciliation.

## Checkout Integrity

- Recalculate price, tax, inventory, stored-value eligibility, and entitlement-sensitive offers server-side.
- Use expiring quotes and idempotent order creation.
- Reserve inventory and stored value with explicit expiry.
- Never trust client totals.
- Protect guest checkout against enumeration and abuse.
- Keep payment, stored-value, and order states distinct.

## Performance and Reliability

Set measurable budgets for server response, largest-content rendering, interaction latency, image weight, cache effectiveness, and checkout availability. Optional recommendations, reviews, or marketing services must not make checkout unavailable.

## White Label

Themes use semantic design tokens and approved templates. Custom code injection is prohibited by default. Custom domains, scripts, analytics, and consent integrations require security and privacy policy.

## AI

AI may assist merchandising, product copy, search, recommendations, support, and guided shopping. Generated content requires provenance and approval rules. Recommendations do not bypass availability, pricing, consent, product restrictions, or stored-value controls.

## First-Slice Decision

The Guyana retail foundation slice does not require a production native storefront. It proves connector and headless seams only. A simple Next.js reference storefront is a later bounded slice after POS, inventory, offline continuity, stored value, cash reconciliation, and tenant isolation are proven.