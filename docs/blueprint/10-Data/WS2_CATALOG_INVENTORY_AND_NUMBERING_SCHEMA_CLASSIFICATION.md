---
document_id: PDA-DAT-019
title: WS2 Catalog Inventory and Numbering Schema Classification
version: 0.2.0
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

## PR2 Catalog Field Classification

The following field record is the concrete pre-migration classification for the four PR2 Catalog tables. Unless a row states otherwise, the owner is Catalog, classification is Confidential, values remain tenant-scoped, retention follows the owning Product aggregate, and erasure means governed minimization or archive rather than destructive removal of referenced operational facts.

| Table and fields | Scope and authority | Retention and erasure | Search/export/offline | Audit and integrity controls |
|---|---|---|---|---|
| `catalog_product.tenant_id` | Tenant scope; authoritative partition key | Retain with Product; never erased independently | Required predicate in reads, exports, projections, and future offline envelopes | Non-null member of every primary/foreign access path; never accepted from an untrusted session body |
| `catalog_product.id` | Opaque Product identity | Retain while any operational reference exists | Exact administrative lookup/export; future offline stable ID | Tenant-composite primary key; not a human reference |
| `catalog_product.organization_id` | Opaque organization context inside the tenant | Retain with Product; reassignment is not a PR2 command | Permissioned export/projection only | Server-derived active context; no cross-owner database foreign key |
| `catalog_product.name` | Authoritative user-authored Product label | Minimize only under governed Product/privacy policy | Catalog-local lexical search, projection, permissioned export, bounded future offline projection | Validated at contract boundary; changed-field event contains the field name, not unrestricted text |
| `catalog_product.state` | Authoritative lifecycle state | Retain as operational history; archive is terminal in PR2 | Filter/export/projection eligible | Draft default; only explicit activation/archive commands transition it |
| `catalog_product.version` | Authoritative optimistic-concurrency counter | Retain with Product | Export/projection carries source version | Positive integer; every mutation checks and increments the expected version |
| `catalog_product.archive_reason`, `archived_at` | Authoritative archive evidence; reason is user-authored operational text | Retain with archived Product; minimize under approved policy without erasing the archive fact | Permissioned administrative export; excluded from ordinary search/offline payloads | Reason required by archive contract; timestamp server-generated; audit/event evidence uses allowlisted fields |
| `catalog_product.classification` | Data-handling label | Retain with Product | May accompany controlled export/projection metadata | Fixed to `Confidential` for PR2; does not grant access |
| `catalog_product.created_at`, `updated_at` | Server-generated temporal provenance | Retain with Product | Export/projection metadata eligible | Timezone-aware; never caller-authoritative |
| `catalog_variant.tenant_id`, `product_id`, `id` | Tenant-preserving Product-child identity | Retain with Product and downstream references | Exact Product assembly/export; future bounded offline projection | Composite tenant/Product foreign key and tenant-composite primary key; replacement occurs only through an expected-version Product command |
| `catalog_variant.name`, `position` | Authoritative variant label and deterministic ordering | Retain with Product; label minimization follows Product policy | Lexical Product retrieval may include name; permissioned export/projection | Contract validation; position is server-derived from command order |
| `catalog_variant.created_at`, `updated_at` | Server-generated temporal provenance | Retain with variant | Export/projection metadata eligible | Timezone-aware; never caller-authoritative |
| `catalog_identifier.tenant_id`, `product_id`, `variant_id`, `id` | Tenant-preserving identifier assignment identity | Retain while assignment or a referenced operational fact exists | Exact Catalog lookup and permissioned export; future bounded offline lookup | Tenant-preserving foreign key to Variant; opaque IDs are distinct from business identifier values |
| `catalog_identifier.type`, `scheme` | Authoritative identifier semantics | Retain with assignment | Filter/export/projection eligible | Enumerated and boundary-validated; provider names are not contract types |
| `catalog_identifier.value` | Caller-supplied display value | Retain with assignment; minimize under governed policy when no reference remains | Exact lookup is performed through normalized value; permissioned export/offline projection allowed | Raw scan/request data is not retained beyond the validated assigned value |
| `catalog_identifier.normalized_value`, `normalization_version`, `uniqueness_scope` | Authoritative derived uniqueness key, reproducibility version, and collision family | Retain with assignment and collision evidence | Exact tenant-local lookup only; not returned as a public display field | Server-derived; unique by tenant/collision-family/normalized value; GTIN, UPC, and EAN share the `Barcode` family so one physical code cannot be assigned twice under different labels; GTIN schemes require check-digit validation |
| `catalog_identifier.created_at` | Server-generated assignment time | Retain with assignment | Export/projection metadata eligible | Timezone-aware; never caller-authoritative |
| `catalog_product_command_receipt.tenant_id`, `operation`, `idempotency_key` | Tenant-scoped deduplication identity | Bounded operational retention; schedule remains a pilot gate | No search/offline/general export | Composite primary key; key is not an authentication credential |
| `catalog_product_command_receipt.request_fingerprint` | Derived SHA-256 digest of the allowlisted command shape | Bounded with receipt; irreversible digest removed with receipt | No search/export/offline | Detects idempotency-key reuse without persisting unrestricted request bodies |
| `catalog_product_command_receipt.resource_id` | Opaque Product result reference | Bounded with receipt | Diagnostic exact lookup only | Tenant-scoped index; never used as current authority |
| `catalog_product_command_receipt.result` | Safe Product command result snapshot | Bounded with receipt; purged under receipt schedule | No search/offline/ordinary export | JSON shape is restricted to the published Product result; secrets, headers, unrestricted input, and unclassified PII are prohibited |
| `catalog_product_command_receipt.created_at` | Server-generated receipt time | Bounded with receipt | Diagnostic metadata only | Timezone-aware; supports retention enforcement evidence |

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

## Change Log

- 2026-07-14 — v0.2.0 added field-level owner, scope, classification, retention, erasure, search/export/offline, audit, and integrity declarations for every PR2 Catalog migration field before generation.
- 2026-07-14 — v0.1.0 recorded the WS2 pre-migration table declarations and controlled-prototype RLS disposition.
