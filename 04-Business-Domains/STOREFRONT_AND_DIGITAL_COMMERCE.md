---
document_id: PDA-DOM-023
title: Storefront and Digital Commerce
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0012]
---

# Storefront and Digital Commerce

## Purpose

Define the native digital storefront capability and its relationship to Commerce, Product Catalog, Pricing, Inventory, Payments, Marketing, Content, and external commerce channels.

## Architectural Position

The native storefront is a first-party experience built on platform APIs and shared capabilities. It does not own authoritative products, prices, stock, customers, orders, payments, promotions, or tax.

The first production release should be connector-first for complex existing stores while also delivering a bounded native reference storefront for new small-business customers.

## Core Experiences

- Home, landing, category, collection, search, and product pages
- Variant and bundle selection
- Availability and fulfillment promises
- Cart and saved cart
- Guest and account checkout
- Delivery, pickup, and shipping choices
- Payment and confirmation
- Customer account, order history, returns, and reorder
- Content pages, navigation, announcements, and legal content
- Search-engine metadata, structured data, and sitemaps
- Localization, currency, market, and tax display

## Ownership Boundaries

| Concern | Owner |
|---|---|
| Product and variant master | Product Catalog |
| Price calculation | Pricing Engine |
| Promotion application | Promotion Engine |
| Availability and reservation | Inventory |
| Cart and checkout session | Commerce |
| Order | Commerce |
| Customer identity and relationships | Party, Identity, and CRM |
| Tax determination | Tax Engine |
| Payment execution | Payment Engine |
| Content and controlled pages | Documents/Knowledge or Marketing content contracts |
| Theme and brand | Branding Engine |
| Search index and retrieval | Search Platform |

## Headless Contract

The storefront consumes versioned APIs for catalog publication, pricing quote, availability, cart, checkout, identity, payment, order status, content, and search. The same APIs should support partner storefronts and mobile commerce experiences.

## Native Storefront Scope

The initial reference storefront supports:

- Configurable theme and custom domain
- Product, category, search, cart, checkout, account, order, and return-request pages
- Delivery and pickup
- One market and currency per storefront initially
- Accessibility and core web performance budgets
- Server rendering and search-engine discoverability
- Consent, analytics, and privacy controls

Advanced page builders, multi-market merchandising, subscriptions, marketplace selling, and complex B2B portals are separate maturity steps.

## External Channel Strategy

Connectors for Shopify, WooCommerce, marketplaces, and social channels may synchronize or federate:

- Catalog and media
- Prices and promotions
- Inventory availability
- Orders and fulfillment
- Customers and consent subject to policy
- Returns and refunds

Every connector declares authoritative direction, conflict policy, latency, replay, and reconciliation.

## Checkout Integrity

- Recalculate price, tax, inventory, and entitlement-sensitive offers server-side.
- Use expiring quotes and idempotent order creation.
- Reserve inventory with explicit expiry.
- Never trust client totals.
- Protect guest checkout against enumeration and abuse.
- Make payment status and order status separate.

## Performance and Reliability

Set measurable budgets for server response, largest-content rendering, interaction latency, image weight, cache effectiveness, and checkout availability. Degrade gracefully when recommendations, reviews, or marketing services fail; do not fail checkout because an optional dependency is unavailable.

## White Label

Themes use semantic design tokens and approved templates. Custom code injection is prohibited by default. Custom domains, scripts, analytics, and consent integrations require security and privacy policy.

## AI

AI may assist merchandising, product copy, search, recommendations, support, and guided shopping. Generated content requires provenance and approval rules. Recommendations must not bypass availability, pricing, consent, or product restrictions.

## First-Slice Decision

Build one simple Next.js reference storefront and prioritize connectors for customers already operating mature external stores. This proves the headless contracts without delaying the retail POS and inventory beachhead for a full Shopify-class page-building product.
