---
document_id: PDA-DOM-002
title: Product Catalog Domain
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# Product Catalog Domain

## Purpose

Own product, service, variant, category, attribute, barcode, bundle, packaging, merchandising, and channel-publication definitions.

## Core Capabilities

- Products, services, variants, options, and attributes
- Categories, collections, brands, tags, and merchandising
- SKUs, barcodes, aliases, manufacturer codes, and supplier codes
- Units, packs, cases, dimensions, weights, and packaging hierarchies
- Bundles, kits, configurable products, and service packages
- Images, media, descriptions, translations, and SEO content
- Product status, lifecycle, approvals, and publication
- Channel assortment, availability rules, and catalog syndication

## Authoritative Entities

Product, Variant, Category, Brand, Attribute, Identifier, Package, Bundle Definition, Assortment, and Catalog Publication.

## Boundaries

Inventory owns stock. Pricing owns price calculation. Procurement owns supplier commercial relationships. Manufacturing owns bills of material and production definitions. Commerce consumes sellable catalog projections.

## Quality Requirements

- Duplicate detection and identifier uniqueness
- Bulk import and safe merge
- Variant and bundle integrity
- Localized content
- Channel publication history
- Permissioned cost and supplier data

## WS2 Controlled-Prototype Contract

- Product is the first-slice aggregate root for Variant and Identifier lifecycle and optimistic concurrency. PR2 may split only a measured hot-write sub-boundary without changing published Product commands.
- Product states are Draft, Active, Suspended, Discontinued, and Archived. Activation and archive are explicit commands; a generic update cannot perform either transition.
- Archive is a retained terminal operational state, not deletion and not Discontinued. It is externally meaningful to Inventory, Commerce, Search, import reconciliation, and Audit consumers, so it publishes its own fact.
- Tenant-scoped SKU, barcode, and alias normalization uses a versioned normalization policy. GS1 check-digit validation is applied when the identifier declares a GS1 format; tenant-defined aliases remain typed identifiers and never masquerade as a verified GS1 code.
- Exact barcode lookup precedes lexical Product search. Global Search remains `platform.search` ownership.
- Commands require current tenant context, permission, entitlement, idempotency, expected version, stable conflict semantics, audit evidence, and state-plus-outbox atomicity.

## Events

- `catalog.product.created.v1`
- `catalog.product.changed.v1`
- `catalog.product.activated.v1`
- `catalog.product.archived.v1`
- `catalog.product.discontinued.v1`
- `catalog.variant.created.v1`
- `catalog.identifier.assigned.v1`
- `catalog.publication.changed.v1`

Catalog events publish stable identifiers and changed facts without copying unrestricted source records.
