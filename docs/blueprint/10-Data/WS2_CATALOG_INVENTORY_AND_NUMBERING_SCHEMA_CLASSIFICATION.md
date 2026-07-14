---
document_id: PDA-DAT-019
title: WS2 Catalog Inventory and Numbering Schema Classification
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0003, ADR-0014, ADR-0027]
review_evidence: []
---

# WS2 Catalog Inventory and Numbering Schema Classification

## Purpose and Authority

This pre-migration record satisfies PDA-RDM-009 G5 for the WS2 controlled prototype. It classifies the proposed Catalog, Inventory, and Platform Numbering tables before PR2, PR3, or PR5 generates a business migration. Registering a table here and in PDA-ENGR-012 establishes ownership and required controls; it is not evidence that the table, behavior, RLS, retention automation, or production deployment exists.

Catalog owns Product definitions. Inventory owns ledger facts and stock workflow state. Platform Numbering owns sequence policy and allocations but never the lifecycle of a numbered business record. All cross-owner references are opaque IDs validated through published contracts; no cross-owner database foreign key or write is authorized.

## Proposed Table Declarations

| Table | Owner and scope | Authority | Classification and retention | Offline/search/export | Audit and erasure effect |
|---|---|---|---|---|---|
| `catalog_product` | Catalog; tenant, optional organization | Authoritative Product aggregate root | Confidential; retain while operational plus governed archive window | Eligible for bounded Catalog offline projection, exact/lexical search, and permissioned export | Create/change/activate/archive require decision, correlation, reason where applicable; privacy actions minimize Product text but do not silently erase referenced operational facts |
| `catalog_variant` | Catalog; tenant; tenant-preserving parent key | Authoritative Product child | Confidential; follows Product lifecycle | Eligible only through versioned Product projection/export | Variant changes share Product version/audit boundary; erasure follows Product purpose and references |
| `catalog_identifier` | Catalog; tenant; typed Product/Variant reference | Authoritative SKU/barcode/alias assignment | Confidential; normalization version retained with assignment history | Exact lookup and permissioned export allowed; raw scans are request data, not stored authority | Assignment/collision denials are audited without leaking another tenant's value; removal retains safe history where referenced |
| `catalog_product_command_receipt` | Catalog; tenant, operation, idempotency key | Operational deduplication evidence | Confidential; short bounded operational retention, finalized before pilot | Not searchable, offline, or ordinarily exportable | Stores request hash and safe result only; never unrestricted Product input |
| `catalog_product_search_projection` | Catalog; tenant | Non-authoritative, rebuildable projection | Confidential; replaceable and purged when source purpose ends | Catalog-local lexical/exact search only; global Search remains `platform.search` | Carries source version and projection timestamp; stale or purged projection never authorizes a command |
| `inventory_stock_movement` | Inventory; tenant, organization, location, Product/Variant ID, unit | Authoritative append-only ledger fact | Confidential; long operational/integrity retention, production schedule pending | Offline-origin commands may create facts after validation; permissioned export allowed; not a search authority | Never updated/deleted for correction; linked reversal and actor/decision/correlation evidence required; privacy action pseudonymizes optional actor references without breaking conservation |
| `inventory_stock_balance` | Inventory; tenant, location, Product/Variant ID, unit | Non-authoritative rebuildable projection | Confidential; retained while source facts are retained | Bounded offline/read projection and export allowed with `asOf`/reconciliation state | Must reconcile exactly to ledger facts; erasure follows source facts and projection rebuild/purge |
| `inventory_reservation` | Inventory; tenant, location, Product/Variant ID | Authoritative reservation state, not physical movement | Confidential; bounded expiry plus diagnostic window | Bounded offline read only; permissioned operational export | Create/release/expiry evidence required; privacy references minimized |
| `inventory_adjustment` | Inventory; tenant, organization, location | Authoritative workflow record; posting creates ledger facts | Confidential; retain reason, approval, and reversal links with ledger evidence | Offline draft seam only; no offline approval; permissioned export | Creation/approval/post/reversal and denial require segregation-of-duties and decision evidence |
| `inventory_count` | Inventory; tenant, organization, location | Authoritative count workflow header | Confidential; retain with posted variance evidence | Offline capture eligible under WS5 transport; permissioned export | Submit/review/approve/post evidence required; blind expected values are not exposed to counters |
| `inventory_count_line` | Inventory; tenant-preserving Count parent, Product/Variant ID, unit | Authoritative observed quantity and variance input | Confidential; follows Count retention | Offline capture eligible; no global search; permissioned export | Exact decimal quantity and observation provenance required; posting links resulting movements |
| `inventory_transfer` | Inventory; tenant, source and destination locations | Authoritative transfer workflow header | Confidential; retain with dispatch/receipt/exception evidence | Offline draft only; dispatch/receipt require current authority; permissioned export | Create/dispatch/partial receive/receive/exception evidence required; no implicit custody transition |
| `inventory_transfer_line` | Inventory; tenant-preserving Transfer parent, Product/Variant ID, unit | Authoritative requested/dispatched/received quantities | Confidential; follows Transfer retention | Offline draft line eligible; permissioned export | Exact decimal quantities and remaining/exception facts required; over-receipt denied |
| `inventory_command_receipt` | Inventory; tenant, operation, idempotency key | Operational deduplication and offline reconciliation evidence | Confidential; bounded operational retention, finalized before pilot | Offline command reconciliation only; not searchable or ordinarily exportable | Stores request hash and safe outcome/reference, never the unrestricted device request |
| `platform_number_sequence` | Platform Numbering; tenant and sequence purpose | Authoritative sequence definition | Confidential; retain while allocations or dependent records remain | No general offline store; definition export is administrative only | Configuration/change evidence required; sequence never grants permission to create a business record |
| `platform_number_allocation` | Platform Numbering; tenant, sequence, idempotency key | Authoritative allocation fact | Confidential; retain with referenced business/audit requirements | Online allocation in WS2; WS5 owns offline range transport/lease evidence | Immutable allocation/idempotency evidence; voided or unused values are retained, never silently reused |

Unknown fields inherit Confidential under PDA-DAT-010. Credentials, tokens, cookies, passkey/OTP material, unrestricted request objects, raw import files, and unclassified Party PII are prohibited from every table above.

## Isolation and Integrity Controls

- Every proposed table carries non-null `tenant_id`; child and unique keys preserve tenant scope.
- Organization/location references are constrained inside the same tenant. Catalog identifiers use tenant-scoped normalized uniqueness and never reveal a cross-tenant collision.
- Inventory quantities use PostgreSQL `numeric(38,6)` and decimal strings at contracts; binary floating point is prohibited.
- Ledger movement posting serializes the tenant/location/Product-or-Variant/unit balance key. Corrections append a signed linked reversal.
- Command receipts, events, jobs, projections, caches, imports, exports, metrics, and errors preserve tenant scope.
- Catalog, Inventory, and Numbering adapters import only their owner's published ports. Inventory consumes Catalog stable IDs/contracts, never Catalog tables or repositories.
- Worker consumers use event scope for routing and provenance, not as current user authorization.

## PostgreSQL RLS Disposition

RLS remains **deferred for this controlled prototype**, not rejected. The present deployment has one application database role and no approved transaction-local tenant-setting/reset protocol for both server and worker pools. Enabling a partial policy would create false assurance or pooled-context leakage.

Compensating prototype controls are server-derived context, mandatory tenant arguments, tenant-preserving constraints and indexes, scoped repositories, two-tenant direct-database and API denials, owner-specific adapters, and architecture tests. RR-007 continues to block pilot/production until Security and Data Platform approve roles, pool reset, migration/owner privileges, worker claims, backup/restore, bypass policy, and executable RLS tests.

## Pre-Migration Gates

PR2, PR3, and PR5 must not generate a business migration until the owning table subset has concrete field-level classification, tenant-preserving constraints, migration/recovery proof, and reviewed indexes. The PR1 disposable ledger spike uses `ws2_spike_*` tables in an isolated throwaway database; those are evidence fixtures, not canonical owner tables or migrations.

## Explicit Deferrals

Production retention periods, RLS, partitioning, lots/serials/expiry/quarantine depth, supplier/cost fields, global Search, production import staging, offline range leasing, financial valuation, and warehouse execution remain deferred to their named owners and gates.
