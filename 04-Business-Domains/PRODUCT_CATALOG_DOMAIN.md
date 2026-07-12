---
document_id: PDA-DOM-002
title: Product Catalog Domain
version: 0.2.0
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

## Events

- `catalog.product.created.v1`
- `catalog.product.changed.v1`
- `catalog.product.activated.v1`
- `catalog.product.discontinued.v1`
- `catalog.variant.created.v1`
- `catalog.identifier.assigned.v1`
- `catalog.publication.changed.v1`

Catalog events publish stable identifiers and changed facts without copying unrestricted source records.