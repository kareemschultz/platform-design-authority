---
document_id: PDA-RDM-009
title: "WS2 Implementation Plan: Catalog and Inventory Ledger"
version: 0.3.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0016, ADR-0020, ADR-0027]
---

# WS2 Implementation Plan: Catalog and Inventory Ledger

## 1. Purpose, Authority, and Lifecycle

This document expands `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) section "WS2 — Catalog and Inventory Ledger (P2)" into the implementation-control plan for Technical Prototype 2. It defines the exact capability depth, owners, package boundaries, contract corrections, pull-request sequence, evidence, and exit gates required before WS2 can close.

This is a **Draft plan for a controlled prototype**. It may guide only the named prototype under the repository lifecycle rule. It does not ratify a Draft or Proposed source, authorize a pilot or production deployment, close FDR-004, establish a contractual service level, or claim the first slice is complete. If this plan conflicts with the Constitution, a ratified or accepted ADR, or a higher-authority approved specification, the higher-authority source wins and WS2 stops for disposition.

Issue #62 owns the merged plan, issue #64 owns merged PR1 execution evidence, issue #66 owns merged PR2 Catalog execution, and issue #68 owns active PR3 Inventory execution. Issue #12 remains the parent WS2 implementation work item. Claude Code independently concurred on the corrected plan at PR #63 before PR1 began, on PR1 at PR #65 before merge, and on PR2 at PR #67 before merge. Every implementation PR still requires exact-head independent review before merge.

### 1.1 Implementation progress

| Pull request phase | Current state | Closure rule |
|---|---|---|
| PR1 — governance, contracts, schemas, and spike | Merged after exact-head Claude Code concurrence | Retain as the contract/governance baseline; it does not prove later business behavior or delivery |
| PR2 — Catalog core, persistence, API, and lifecycle | Merged as PR #67 after exact-head Claude Code concurrence | Retain Catalog domain/persistence/API, migration, atomic outbox, stable child identities, two-tenant, Bun/Node, and budget evidence |
| PR3 — Inventory ledger and workflows | In progress on issue #68 from merged PR2 head | Contract corrections, field classification, owner persistence, behavior, and evidence must pass exact-head independent review before merge |
| PR4–PR7 | Not started | Execute in order; no later phase may be pre-closed by earlier evidence |

### 1.2 Governing sources

| Concern | Governing source |
|---|---|
| Authority and lifecycle | PDA-CON-001; repository `AGENTS.md` |
| First-slice scope and depth | PDA-RDM-001, PDA-RDM-003, PDA-RDM-004, PDA-RDM-006, PDA-RDM-007, `registry/first-slice.json` |
| Catalog ownership and events | PDA-DOM-002; `registry/capabilities.json`; `registry/events.json` |
| Inventory ownership and events | PDA-DOM-003; `registry/capabilities.json`; `registry/events.json` |
| Entity states and cross-domain flows | PDA-ARC-013, PDA-ARC-014, PDA-ARC-015 |
| Modular boundaries | ADR-0002, ADR-0003, PDA-ENGR-012, `registry/architecture-rules.json` |
| Runtime and persistence | ADR-0020, ADR-0027, PDA-ENGR-013 |
| Events and transactions | ADR-0016, PDA-ARC-005, PDA-PLT-008 |
| Permissions and entitlements | PDA-PLT-004, PDA-PLT-005, PDA-PLT-027, permission and endpoint registries |
| Import, numbering, and search | PDA-PLT-012, PDA-PLT-023, PDA-PLT-024 |
| Privacy and classification | ADR-0014, PDA-DAT-010, PDA-SEC-011 |
| UX and accessibility | PDA-UX-010, PDA-UX-017, PDA-UX-020, PDA-UX-028 |
| Evidence | PDA-TST-013, `registry/first-slice-tests.json`, PDA-RDM-006 |
| Work coordination | PDA-ENGR-014 and the GitHub Project |
| Founder scope authority | FDR-004; still open and only provisionally adopted |

## 2. Verified Starting State and Review Disposition

The baseline below was independently confirmed against `main` at `6b3dabae9e8871c23a31d35582e35a51036db3aa` before this plan was authored.

| Verified fact or gap | Disposition | Closure |
|---|---|---|
| WS1 and RR-011 are closed only at controlled-prototype depth | Accepted | Reuse WS1 authority, tenancy, Party, entitlement, Audit, and outbox foundations; do not restate them as production-ready |
| PDA-RDM-007 said `domains/catalog` and `domains/inventory` own concrete schemas/migrations | Accepted contradiction with ADR-0027 | Correct PDA-RDM-007 with this plan; core packages own behavior and ports, owner-specific Persistence packages contain concrete PostgreSQL artifacts |
| The registered WS2 surface is 14 capabilities, 15 endpoints, 16 permissions, and 15 Catalog/Inventory events | Accepted baseline | Keep a current-state ledger in this plan and make every planned contract delta explicit |
| Only `inventory.stock.adjusted.v1` currently resolves to a JSON Schema | Accepted gap | PR1 supplies canonical schemas for every event intended for WS2 production and records explicit non-production deferrals |
| `catalog.product.activate` and `catalog.product.archive` have no endpoint mapping | Accepted gap | PR1 adds dedicated lifecycle command contracts and propagates OpenAPI, permission mapping, owner event sources, schemas, and generated contracts together |
| Transfer dispatch is a distinct governed state and event, but no dispatch endpoint or permission exists | Accepted gap found during reconciliation | PR1 adds a dedicated dispatch command and permission; receive cannot silently imply dispatch |
| Counts, transfers, and adjustments have mutation contracts but insufficient read contracts for reloadable workflows | Accepted gap found during reconciliation | PR1 adds the minimum tenant-scoped read permissions and list/detail operations required by PR6 UI and audit review |
| The WS1 transactional outbox has no continuously running delivery worker | Accepted as RR-006 | PR4 implements and proves claiming, delivery, bounded retry, dead-letter handling, ordering, lag/health observability, replay control, and consumer idempotency before publication is claimed |
| `inventory.offline-movements` is `full`, while the general sync engine belongs to WS5 | Accepted scope seam | WS2 proves offline-safe command and ledger semantics; WS5 owns device enrollment, lease issuance, signed batch transport, watermarks, tombstones, and general reconciliation orchestration |
| Production PostgreSQL RLS topology remains open as RR-007 | Accepted production gate | Use the controlled-prototype compensating controls in section 10; do not claim pilot or production defense in depth |

The current counts are evidence of the starting point, not immutable targets. The approved PR1 contract corrections will increase endpoint, permission, and event counts; generated registries become the new exact source after that propagation.

### 2.1 Claude Code independent review disposition

The independent review on PR #63 found four plan-precision defects. All are accepted at the submitted severity. Correcting the plan closes the review defect; it does not pre-close the architecture, registry, contract, or performance evidence assigned to PR1 and later implementation PRs.

| Finding | Classification | Priority | Remediation in v0.1.1 | Remaining implementation closure |
|---|---|---:|---|---|
| "ADR-0027 applies without exception" ignored the proposed worker process/pool revisit trigger | Accepted | P1 | G4 now makes the worker topology an explicit ADR-0027 revisit and blocks worker implementation until reviewed | PR1 amends or supersedes ADR-0027, propagates architecture rules, and records Platform Architecture, Data Platform, and Security review at controlled-prototype scope |
| Required Persistence owner registrations were implicit for Catalog, Inventory, and Numbering | Accepted | P2 | G4 and section 5 now name all three required owner registrations | PR1 updates PDA-ENGR-012 source ownership metadata, regenerates `registry/architecture-rules.json`, and passes positive/negative ownership tests |
| Transfer dispatch lacked an exact proposed permission ID | Accepted | P3 | G2 now proposes `inventory.transfer.dispatch`, subject to canonical PR1 propagation | PR1 adds it to PDA-PLT-027, OpenAPI endpoint metadata, generated registries/contracts, and authorization tests |
| WS5 budget wording conflated lease duration, synchronization performance, and queue capacity | Accepted | P3 | Section 9 separates each PDA-RDM-006 measure and assigns its correct meaning | WS5, not WS2, supplies end-to-end measurement for those transport/lease budgets |

## 3. Scope and Capability Depth

WS2 owns exactly these 14 first-slice business capabilities.

| Capability | Depth | WS2 responsibility |
|---|---:|---|
| `catalog.products` | full | tenant-owned Product aggregate, create/read/list/update, versioning, and searchable operational representation |
| `catalog.variants` | full | variants inside the governed Product aggregate boundary with stable identifiers and concurrency rules |
| `catalog.identifiers` | full | tenant-scoped SKU, alias, and external identifier uniqueness and lookup |
| `catalog.barcodes` | full | normalized barcode assignment, uniqueness, validation, and exact lookup |
| `catalog.lifecycle` | prototype | explicit activation and archive commands; no hidden lifecycle transition through a generic update |
| `catalog.bulk-import` | prototype | dry run, row findings, approval, idempotent apply, and acceptance evidence for bounded product import |
| `inventory.stock-ledger` | full | immutable, unit-aware, location-scoped movement facts with linked reversals |
| `inventory.stock-balances` | full | rebuildable balance read model and reconciliation to ledger facts |
| `inventory.availability` | full | clearly labeled availability projection with freshness and non-authority rules |
| `inventory.reservations` | prototype | internal create/release seam, expiry policy, and no conflation with physical movement |
| `inventory.adjustments` | full | create/approve/post, segregation of duties, reason/evidence, and reversal correction |
| `inventory.transfers` | prototype | create, dispatch, in-transit, receive, exception, and linked transfer-out/transfer-in facts |
| `inventory.counts` | full | draft/in-progress/submit/review/approve/post lifecycle and variance evidence |
| `inventory.offline-movements` | full | globally unique command identity, deterministic validation, idempotent application, conflict outcome, and reconciliation facts at the Inventory boundary |

### 3.1 Supporting platform work

The following work supports the 14 capabilities but does not add hidden WS2 business capabilities:

- extend `platform.events` from durable outbox storage to a governed internal delivery runtime, closing RR-006 only after PR4 evidence;
- add `platform.numbering` core and `platform-numbering-postgres` as the PDA-RDM-007-assigned sequence-service foundation for later receipt work; WS2 proves online atomic/idempotent allocation, while offline range leasing remains integrated and evidenced with WS3/WS5;
- add the bounded Product and opening-stock import orchestration needed by scenario 8 through domain commands, without permitting a generic importer to write Catalog or Inventory tables;
- implement Catalog-local exact/lexical retrieval needed by the Product workflows; global Search remains owned by `platform.search` and is not silently reimplemented in Catalog.

### 3.2 Explicit exclusions

WS2 excludes pricing calculation, supplier commercial relationships, warehouse bin execution, Commerce demand, POS sale orchestration, financial valuation, fiscalization, broad global search, arbitrary custom import scripting, full offline synchronization, production RLS, and AI-dependent essential workflows. Catalog stores price/tax references only where an approved contract requires them; it does not become Pricing or Tax authority.

## 4. Mandatory Entry Gates

### G1 — Independent plan review

Claude Code reviews this plan against the authoritative documents and live registries. Every actionable finding is verified, replied to, dispositioned, and resolved before broad WS2 implementation begins.

### G2 — Contract-first lifecycle and workflow closure

PR1 updates owner specifications, OpenAPI, permissions, endpoint mappings, JSON Schemas, examples, and generated contracts together. Selected prototype direction:

- a dedicated Product activation operation uses `catalog.product.activate` and produces `catalog.product.activated.v1`;
- a dedicated Product archive operation uses `catalog.product.archive` and transitions to Archived through an explicit preconditioned command;
- the Catalog owner specification adds a canonical past-tense archive event if PR1 confirms that the archive fact is externally meaningful; it must not misuse `catalog.product.discontinued.v1` because Discontinued and Archived are distinct PDA-ARC-013 states;
- a dedicated Stock Transfer dispatch operation uses the proposed canonical permission `inventory.transfer.dispatch` and produces `inventory.stock-transfer.dispatched.v1`; the permission becomes authoritative only when PDA-PLT-027 and generated registries are updated in PR1;
- PR1 adds minimum read permissions and list/detail operations for adjustments, counts, and transfers so PR6 can reload, link, and audit workflow state;
- every consequential command declares idempotency, optimistic concurrency or locking, authorization, entitlement, audit, event, retry, reversal/compensation, and safe error semantics.

PR1 may refine path names during canonical review, but it may not fold these transitions into generic update behavior merely to preserve the current endpoint count. Any refinement is propagated to every source and generated contract in the same PR.

### G3 — Ledger model and Drizzle suitability

Before deep migrations, PR1 creates executable spikes at the exact implementation lock for:

- append plus owner-state/outbox atomicity on one checked-out client;
- concurrent posting without lost updates or double effects;
- unit precision and conversion provenance without binary floating point;
- linked reversal and conservation queries;
- balance rebuild and reconciliation from ledger facts;
- cursor pagination, barcode exact lookup, and representative Catalog filters at the PDA-RDM-006 capacity envelope;
- empty, upgrade, repeat, failure, and recovery migration behavior for the new owner streams under PostgreSQL 18.

Drizzle remains selected only if the spike passes. A Kysely or SQL fallback requires PDA-ENGR-013 propagation and architecture review; a persistence or runtime change that crosses an ADR trigger requires an ADR. No PostgreSQL extension is introduced without the PostgreSQL 18 decision matrix and measured evidence.

### G4 — Owner-specific persistence and composition

ADR-0027's owner-specific adapter, logical ownership, transaction-scope, and runtime-neutrality rules remain binding. The proposed separate worker application and process-local pool are an **ADR-0027 revisit trigger**, not an existing allowance:

- runtime-neutral owner cores publish ports and never import Drizzle, `pg`, migrations, environment access, Hono, oRPC transports, or Bun globals;
- concrete schemas, Drizzle adapters, and owner migration streams live in `packages/persistence/catalog-postgres`, `inventory-postgres`, `platform-numbering-postgres`, and any explicitly approved supporting Platform owner package;
- logical table and migration ownership remains Catalog, Inventory, or the named Platform owner even though concrete artifacts live in the Persistence family;
- PR1 must amend or supersede ADR-0027 before `apps/worker` implementation, deciding whether delivery runs in a separate worker process with one process-local pool or remains bound through the existing server composition root; Platform Architecture, Data Platform, and Security review are required at controlled-prototype scope;
- PR1 records the selected topology in ADR-0027 but deliberately withholds `apps/worker/composition` from PDA-ENGR-012 and `registry/architecture-rules.json`; exact negative tests deny the worker candidate and a genuinely unknown application root until the three named reviews are recorded;
- PR4 begins by recording those reviews and registering the worker root in PDA-ENGR-012; only then may its implementation commits construct the second process pool, and the same PR must prove the worker cannot run migrations;
- each approved process owns at most one bounded pool and its transaction coordinator; pools are not shared through global service location, and no owner mutates another owner's private tables inside a shared transaction;
- PR1 registers `catalog-postgres` to Catalog, `inventory-postgres` to Inventory, and `platform-numbering-postgres` to Platform Numbering in the authoritative Persistence ownership source, then regenerates `registry/architecture-rules.json` and adds negative ownership probes;
- Inventory consumes published Catalog contracts and stable IDs, never Catalog repositories, tables, migrations, or implementation modules.

### G5 — Data, isolation, and classification before migration

Before `db:generate`, each table and field records owner, tenant/organization/location scope, classification/default, retention, erasure effect, offline eligibility, search/export eligibility, audit implications, and authoritative/projection status. Tenant-preserving keys, constraints, repository predicates, event scope, import staging, job claims, caches, and projection identifiers are mandatory. RLS is adopted or deferred with an explicit WS2 evidence record; a prototype deferral cannot be described as production isolation.

### G6 — Event delivery claim

The outbox remains storage, not publication, until PR4 proves section 8. No PR may say "events are published" merely because an outbox row exists. RR-006 closes only after the exact-head delivery evidence is merged and the Architecture Risk Register is updated.

## 5. Package and Ownership Plan

| Package or application | Responsibility | Prohibited responsibility |
|---|---|---|
| `packages/domains/catalog` | runtime-neutral Product/Variant/Identifier behavior, lifecycle, application ports, and domain tests | PostgreSQL, transport, global Search, Pricing, Inventory state |
| `packages/persistence/catalog-postgres` | Catalog-owned schema, migrations, repositories, and query adapters | Inventory tables or another owner's migrations |
| `packages/domains/inventory` | runtime-neutral ledger, balance, availability, reservation, adjustment, transfer, count, and offline command semantics | Catalog implementation, Commerce orchestration, PostgreSQL, transport |
| `packages/persistence/inventory-postgres` | Inventory-owned schema, migrations, repositories, posting locks, and rebuild adapters | Catalog or Finance table mutation |
| `packages/platform/numbering` | runtime-neutral sequence policy and allocation ports | receipt or domain-record lifecycle |
| `packages/persistence/platform-numbering-postgres` | sequence definition/allocation persistence and migration stream | business-record tables |
| `packages/platform/events` | delivery policy, event envelope contract, retry/dead-letter/replay ports | owner event meaning or external webhooks |
| `packages/persistence/platform-events-postgres` | outbox claim/lease state, attempts, dead-letter evidence, and consumer receipts owned by Event Backbone | business projections or external webhook delivery |
| `apps/server/composition` | bind HTTP procedures and owner adapters to the existing pool and services | business rules or cross-owner table orchestration |
| proposed `apps/worker/composition` | after the G4 ADR revisit, construct the event publisher, registered consumers, and approved process-local connection lifecycle over injected adapters | implementation before ADR/ruleset closure, domain ownership, or unbounded arbitrary code execution |
| `apps/web` and `@meridian/ui-web` | accessible Catalog/Inventory workflow UI over published clients | business authority, tenant trust, or direct database access |

PR1 must register the Catalog, Inventory, and Platform Numbering Persistence owners named in G4. If bounded import orchestration requires a new `packages/platform/import-export` owner core and matching Persistence adapter, PR1 must register that additional package and owner explicitly. The server route must not become an unowned job database.

## 6. Domain Model and Invariants

### 6.1 Catalog

- Product is the aggregate root for the first-slice Product, Variant, Identifier, Barcode, and lifecycle behavior unless the PR1 concurrency spike proves a smaller boundary is necessary.
- Product states follow PDA-ARC-013: Draft, Active, Suspended, Discontinued, Archived. Archive is not delete and cannot be confused with Discontinued.
- SKU/barcode/alias normalization rules are versioned, tenant-scoped, and collision-safe. Raw scans never establish authority.
- A barcode resolves to one permitted tenant Product/Variant at the evaluated time; cross-tenant equality reveals nothing.
- Updates use a version token or ETag and return a stable conflict result.
- Search/list results are permission-filtered and cursor-paginated. Index or query projections are never current command authority.

### 6.2 Inventory

- Stock Ledger Entry is authoritative and append-only. Posted facts are never edited or deleted.
- Corrections use a linked reversal and, where needed, a new replacement fact. A generic update endpoint for posted facts is prohibited.
- Every fact carries tenant, organization/legal entity where applicable, location, item/variant, quantity, unit, conversion provenance, source type/reference, actor, correlation, causation, command ID, and occurred/recorded instants.
- Quantity uses approved decimal/integer semantics with explicit units; binary floating point is prohibited.
- A reservation changes availability but is not a physical stock movement.
- Transfer dispatch and receipt are distinct. Dispatch posts Transfer Out/in-transit evidence; receipt posts Transfer In for the actual received quantity and records exceptions.
- Count approval posts variance facts; it does not overwrite the ledger or silently set a balance.
- Negative-stock policy is explicit by workflow and location. The default is deny unless the governed policy and permission permit otherwise.
- The ledger is authority. Balance and availability representations are rebuildable and carry projection timestamps. Command preconditions do not trust a stale asynchronous projection.
- Duplicate command IDs produce the original result and no additional ledger, balance, event, audit, or numbering effect.

## 7. API, Permission, and Entitlement Surface

The starting registry contains 15 endpoints and 16 permissions across Catalog and Inventory. PR1 retains those contracts unless superseded by the explicit corrections in G2.

### 7.1 Existing Catalog operations

| Operations | Permission | Implementation |
|---|---|---:|
| `GET /v1/products`, `GET /v1/products/{productId}` | `catalog.product.read` | PR2 |
| `POST /v1/products` | `catalog.product.create` | PR2 |
| `PATCH /v1/products/{productId}` | `catalog.product.update` | PR2 |
| `POST /v1/product-imports` | `catalog.import.create` | PR5 |
| `POST /v1/product-imports/{importId}/approve` | `catalog.import.approve` | PR5 |

PR1 adds the activation and archive commands in G2 and assigns their canonical OpenAPI paths. Product create/update schemas include only the Variant and Identifier behavior selected for the aggregate; they do not introduce unregistered provider or pricing semantics.

### 7.2 Existing Inventory operations

| Operations | Permission | Implementation |
|---|---|---:|
| `GET /v1/stock-balances` | `inventory.balance.read` | PR3 |
| `POST /v1/inventory-adjustments` | `inventory.adjustment.create` | PR3 |
| `POST /v1/inventory-adjustments/{id}/approve` | `inventory.adjustment.approve` | PR3 |
| `POST /v1/inventory-adjustments/{id}/reverse` | `inventory.adjustment.reverse` | PR3 |
| `POST /v1/stock-counts` | `inventory.count.create` | PR3 |
| `POST /v1/stock-counts/{id}/submit` | `inventory.count.submit` | PR3 |
| `POST /v1/stock-counts/{id}/approve` | `inventory.count.approve` | PR3 |
| `POST /v1/stock-transfers` | `inventory.transfer.create` | PR3 |
| `POST /v1/stock-transfers/{id}/receive` | `inventory.transfer.receive` | PR3 |
| `POST /v1/opening-stock-imports` | `inventory.import.create` | PR5 |

PR1 adds the dispatch command, its canonical OpenAPI path, and the minimum read surface described in G2. If list and detail operations use one read permission per resource, the proposed canonical IDs are `inventory.adjustment.read`, `inventory.count.read`, and `inventory.transfer.read`; they become authoritative only when added to PDA-PLT-027 and regenerated.

### 7.3 Enforcement

- Server-issued active context determines tenant and organization/location scope; request body or query tenant IDs never establish authority.
- Permission and entitlement are evaluated separately at transport and application-command boundaries. UI visibility is advisory.
- Repository predicates and tenant-preserving constraints remain mandatory after authorization succeeds.
- Create and update commands revalidate referenced Products, Variants, Locations, units, and current lifecycle state through published owner contracts.
- Count approval and adjustment approval preserve segregation of duties. Self-approval is denied unless an explicit, audited policy authorizes it.
- Denials use stable safe errors and do not leak existence, balance, identifier, or workflow state from another tenant.

## 8. Event Contracts, Delivery, and Projections

### 8.1 Event coverage ledger

PR1 creates or verifies a JSON Schema for each of the 15 currently registered events. Producer/delivery responsibility is explicit below. The proposed archive fact from G2 is not canonical until the Product Catalog owner source defines and registers it.

| Event | Schema | Producer/evidence |
|---|---:|---|
| `catalog.product.created.v1` | PR1 | PR2 create command; PR4 delivery/idempotency |
| `catalog.product.changed.v1` | PR1 | PR2 update command; PR4 delivery/idempotency |
| `catalog.product.activated.v1` | PR1 | PR2 activate command; PR4 delivery/idempotency |
| `catalog.product.discontinued.v1` | PR1 | schema compatibility in WS2; producer remains explicitly deferred unless PR1 governs a discontinuation command |
| `catalog.variant.created.v1` | PR1 | PR2 aggregate create/update behavior selected in PR1 |
| `catalog.identifier.assigned.v1` | PR1 | PR2 assignment command inside the selected aggregate boundary |
| `catalog.publication.changed.v1` | PR1 | schema compatibility only; channel publication is outside the 14-capability WS2 scope |
| Product archive fact (new canonical event required if selected) | PR1 owner-source decision | PR2 archive command if ratified in PR1 |
| `inventory.stock.adjusted.v1` | PR1 verifies current schema | PR3 adjustment posting; PR4 delivery/idempotency |
| `inventory.stock-count.posted.v1` | PR1 | PR3 count approval/post; PR4 delivery/idempotency |
| `inventory.stock-transfer.created.v1` | PR1 | PR3 transfer create; PR4 delivery/idempotency |
| `inventory.stock-transfer.dispatched.v1` | PR1 | PR3 dispatch; PR4 delivery/idempotency |
| `inventory.stock-transfer.received.v1` | PR1 | PR3 receive; PR4 delivery/idempotency |
| `inventory.reservation.created.v1` | PR1 | PR3 internal reservation seam and tests |
| `inventory.reservation.released.v1` | PR1 | PR3 internal release/expiry seam and tests |
| `inventory.stock-movement.reversed.v1` | PR1 | PR3 linked reversal behavior; PR4 delivery/idempotency |

Schema existence does not claim a producer exists. The closeout evidence distinguishes generated schema coverage, emitted events, delivered events, consumed events, and explicit non-emission deferrals.

### 8.2 Delivery runtime required to close RR-006

PR4 must prove:

1. owner state and outbox append commit or roll back atomically;
2. multiple workers claim without double-processing and recover expired claims;
3. at-least-once delivery with bounded exponential backoff and jitter;
4. narrowly declared ordering per tenant/aggregate stream, never global ordering;
5. terminal dead-letter/quarantine evidence with reason, classification, and safe diagnostics;
6. consumer receipts keyed by event ID and consumer version so retries cause zero duplicate business effects;
7. replay requires permission, purpose, tenant scope, compatibility, and audit;
8. lag, throughput, oldest-event age, retries, failures, dead letters, and consumer health are observable without payload leakage;
9. a killed worker, transient database failure, poison event, and stale claim recover predictably;
10. privacy/deletion behavior covers live outbox rows, attempts, dead letters, and projections.

The first consumers are bounded, tenant-safe projections such as Catalog search documents and Inventory availability/reconciliation views. External webhook subscriptions remain Developer Platform ownership and are not implemented by this worker.

## 9. Offline and WS5 Boundary

`inventory.offline-movements` full depth requires the Inventory owner to be correct when receiving an offline-originated command. It does not transfer general synchronization ownership into Inventory.

### WS2 owns

- a transport-neutral `OfflineInventoryCommand` contract with globally unique command ID, tenant/location/device/actor references, lease reference, occurred-at instant, unit/quantity, expected version or watermark, and integrity metadata fields;
- deterministic validation and outcomes: accepted, duplicate, rejected, conflict, or review required;
- idempotent application and zero duplicate business effects;
- explicit conflict facts and reconciliation references;
- reversal/correction behavior for an accepted movement;
- command age, state-precondition, negative-stock, and location policy hooks;
- tests with queued, duplicated, reordered, expired-policy, and cross-tenant commands.

### WS5 owns

- device enrollment and trust;
- issuance, signing, renewal, revocation, and local evaluation of offline leases;
- encrypted local SQLite stores and local atomic workflow transactions;
- signed batch upload/download transport, watermarks, resume, backpressure, and compatibility windows;
- general cross-capability conflict orchestration, privacy tombstones, and device purge acknowledgement;
- the separately governed PDA-RDM-006 transport and lease measures: a 24-hour default valid offline lease duration, first acknowledgement within 5 seconds p95 after reconnect, synchronization of 1,000 queued ordinary operations within 10 minutes p95, and a capacity envelope of up to 10,000 queued offline operations per device before mandatory intervention.

WS2 tests the Inventory boundary with synthetic verified lease facts; it must not mint a lease, trust a client assertion, or claim end-to-end offline sync. WS5 later supplies the verified transport and authority context to the same command port.

## 10. Security, Privacy, Classification, and Audit

- Catalog records default to Confidential unless an explicit public publication representation exists; cost, supplier, or restricted fields are excluded unless separately governed.
- Inventory balances, movements, counts, variances, transfers, and import files are Confidential. Credentials and signing material are Secret and never enter these contracts.
- Audit metadata is allowlisted. Raw uploads, request objects, authorization headers, cookies, unrestricted Product text, and complete event payloads are not copied into Audit.
- Tenant scope applies to owner tables, composite keys/FKs, indexes, command receipts, outbox rows, worker claims, consumer receipts, caches, search documents, imports, exports, metrics, logs, and error behavior.
- The two-tenant suite covers read, list, count, identifier substitution, location substitution, command replay, import staging, event replay, projection, cache, and timing/count leakage.
- Controlled-prototype RLS disposition must be recorded before migration. Until RR-007 closes, compensating controls are server-derived context, mandatory tenant parameters, tenant-preserving constraints, scoped repositories, architecture enforcement, and direct database negative tests.
- Erasure does not delete ledger facts required for integrity. ADR-0014 governs minimization, pseudonymization, projection purge, and deletion-journal acknowledgement.
- Consequential success and denial records include actor, active context, permission/entitlement decision IDs, resource, reason, source channel, correlation/causation, outcome, and safe change summary.

## 11. User Experience and Adoption Constraints

PR6 extends the WS1 shell with a small Catalog and Inventory workspace:

- Product list with cursor pagination, exact barcode/SKU lookup, text/filter search, empty/loading/stale/error states, and visible tenant context;
- Product record and create/edit workflow for the selected aggregate fields, optimistic-conflict recovery, activation, and archive confirmation;
- Inventory balance by location with projection timestamp and stale/unreconciled labeling;
- adjustment create/approve/reversal workflow with reason, segregation-of-duties state, and activity evidence;
- count create/scan/submit/review/approve/post workflow;
- transfer create/dispatch/in-transit/receive/exception workflow;
- import upload, dry-run summary, row findings, approval, progress, partial/reconciliation state, and downloadable correction report.

The UI uses platform-owned `@meridian/ui-web` components and the governed shadcn/Base UI configuration. Studio or Mobbin examples may inform decomposition but are not imported wholesale. Premium credentials or redistributable premium source never enter the repository. No template may introduce React Hook Form, Zustand, `react-use`, client-side XLSX parsing, raw palette values, or a second authority/data-access layer without a governed technology decision.

PR6 supplies keyboard, focus, screen-reader, zoom/reflow, touch target, reduced-motion, responsive, loading, empty, error, stale, offline/degraded, permission-denied, entitlement-unavailable, conflict, and destructive-confirmation evidence. Mobile behavior transforms dense tables into task-appropriate summaries; it does not hide required controls or create horizontal-only workflows. Essential workflows remain deterministic with AI disabled.

## 12. Pull Request Sequence

Every PR has one issue, branch, worktree, explicit owner, migration/API/security/privacy/accessibility/offline/operations disposition, validation evidence, and handoff under PDA-ENGR-014. Dependent work does not begin from an unmerged branch.

1. **PR1 — Governance, contracts, schemas, and ledger spike.** Propagate G2 contract corrections; resolve lifecycle/archive and transfer-dispatch semantics; add missing read surfaces; amend ADR-0027 to select the worker/pool topology while leaving the worker root executable-denied pending the named prototype reviews; propagate exact registered-root and negative connection rules; classify all proposed tables; create/verify all event schemas; regenerate contracts/registries; register Catalog, Inventory, Platform Numbering, and any Import/Export Persistence ownership plus migration streams; run Drizzle/ledger/query spikes; record exact locks and ADR/technology/risk consequences. No broad business migration.
2. **PR2 — Catalog core, persistence, API, and lifecycle.** Implement `catalog.products`, `catalog.variants`, `catalog.identifiers`, `catalog.barcodes`, and prototype `catalog.lifecycle`; add owner migrations, state-plus-outbox atomicity, version conflicts, tenant isolation, barcode/search budgets, Bun/Node tests, and Catalog command events.
3. **PR3 — Inventory ledger, balances, adjustments, counts, transfers, and offline command boundary.** Implement the Inventory core and owner persistence; immutable posting/reversal; reservations prototype; transfer dispatch/receipt; count variance posting; balance/availability representations; command receipts; two-tenant, concurrency, conservation, rebuild, and offline-origin tests.
4. **PR4 — Durable event delivery and projections.** First record the three ADR-0027 prototype-scope reviews and register `apps/worker/composition`; only after that gate may implementation commits add the selected worker, claim/lease/retry/dead-letter/replay/observability, consumer receipts, Catalog search projection, Inventory availability/reconciliation consumers, rebuild tools, kill/recovery tests, and RR-006 disposition. Outbox-only evidence is insufficient.
5. **PR5 — Imports and supporting numbering foundation.** Implement bounded Product and opening-stock import through domain commands with malware/file controls, dry run, row findings, approval, idempotent waves, correction report, reconciliation, and audit. Add the PDA-RDM-007-assigned Numbering core/adapter and prove atomic/idempotent online allocation without claiming WS5 offline range leasing.
6. **PR6 — Product and Inventory web experience.** Implement section 11 over generated clients and current authority. Include formal UI-pattern and accessibility reviews, responsive evidence, direct-API denial tests, projection freshness labels, and performance/bundle evidence.
7. **PR7 — WS2 verification and controlled-prototype closeout.** Execute the complete section 14 matrix for all 14 capabilities; scenarios 2 and 8; Bun and approved Node paths; migration, delivery, recovery, performance, accessibility, security, and two-tenant evidence. Update PDA-RDM-007, PDA-RDM-004, the risk register, technology lessons, evidence sources, and program status without lifecycle overclaim.

## 13. Synthetic Fixtures and Critical Scenarios

Use the PDA-TST-013 fixture, including Tenant A `Demerara Retail Test Group` and Tenant B `Essequibo Isolation Test Tenant`. Product names, identifiers, quantities, and import rows remain synthetic.

Critical WS2 scenarios include:

- create a Product with Variant, SKU, and barcode; find it by exact identifier and permitted text search;
- reject same-tenant duplicate identifiers and all cross-tenant identifier/count/timing leakage;
- activate and archive only through authorized, preconditioned commands;
- reject stale Product updates with a recoverable version conflict;
- post an adjustment exactly once under retry and concurrency;
- reverse a posted movement without editing or deleting the original and prove quantity conservation;
- run a blind count through submit, review, approve, post, and variance evidence;
- create, dispatch, and receive a transfer with explicit in-transit and partial/exception behavior;
- create/release/expire a reservation without treating it as physical movement;
- rebuild balances from ledger facts and reconcile zero unexplained divergence;
- replay delivered events and worker restarts with zero duplicate consumer effects;
- process duplicate/reordered offline-origin commands through stable outcomes without claiming WS5 transport;
- dry-run and approve a mixed Product/opening-stock import with valid, warning, rejected, duplicate, and replay rows;
- prove direct API invocation is denied when the UI hides an action or an entitlement is absent.

These scenarios cover PDA-ARC-015 scenario 8 directly and supply the Catalog/Inventory preconditions and event delivery needed by scenario 2. WS2 does not claim the full sale sequence because Commerce/POS belongs to WS3.

## 14. Evidence Matrix and Quality Budgets

Every one of the 14 capabilities keeps all 13 required dimensions from `registry/first-slice-tests.json`:

1. happy path;
2. validation and denial;
3. tenant isolation;
4. permission and entitlement;
5. idempotency and duplicate handling;
6. concurrency and conflict;
7. events, jobs, and projections;
8. audit and observability;
9. privacy and classification;
10. offline and degraded behavior;
11. accessibility and responsive behavior;
12. performance and capacity;
13. recovery, replay, and reconciliation.

PR7 may mark a cell evidenced only when a committed evidence path proves the registered depth. Dominant dimensions do not waive the other ten.

Minimum provisional budgets from PDA-RDM-006:

| Signal | WS2 target |
|---|---:|
| Product barcode lookup | 300 ms p95 or less online |
| Product text search first useful result | 800 ms p95 or less online |
| Stock-count line using scanner | 5 seconds median or less |
| Stock adjustment posting | 750 ms p95 or less |
| Catalog/barcode service objective | 99.9% monthly prototype objective |
| Inventory ledger | 99.95% correctness; no unexplained balance divergence |
| Internal event publication | 99.99% eventually published within the measured retry horizon |
| Inventory availability freshness | 5 seconds p95 online |
| Search index freshness | 60 seconds p95 |
| Duplicate business effects from replay | zero |
| Capacity | 250,000 active products/variants and 2,000,000 inventory ledger entries/year per tenant |
| Cross-tenant load | 50 representative tenants plus one 10x noisy neighbor |

Prototype measurements record environment, data size, warm/cold state, sample size, p50/p95/p99 or maximum as applicable, failures, and exact commit. Targets are not contractual SLAs.

## 15. Operations, Migration, and Recovery

- New owner migration streams are added to the deterministic serial orchestrator with unique history tables and dependency order: Event/Platform dependencies before Catalog, Catalog before Inventory references, then projections/import support.
- PRs with migrations prove clean database, repeat, representative upgrade, injected failure, recovery/forward-fix, and freshness under PostgreSQL 18.
- Worker shutdown stops claims, drains within a bound, releases leases, and does not lose committed events.
- Runbooks cover delivery lag, poison events, dead-letter review/replay, projection rebuild, balance reconciliation, import partial failure, stuck claims, and tenant-scoped pause/recovery.
- Backup/restore evidence includes owner tables, outbox/delivery state, consumer receipts, and rebuildable projections. Restored projections never outrank restored authoritative owners.
- Metrics and logs use tenant/correlation/event/consumer identifiers and safe reason codes; Product text, quantities beyond approved operational measures, raw upload rows, and restricted data are minimized.
- No `console.log`, scattered `process.env`, premium credential, or private download URL is committed.

## 16. Open Decisions, Deferrals, and Exit Gate

### 16.1 Decisions PR1 must close

- exact Product aggregate boundary for Variants and Identifiers;
- exact barcode formats/check-digit policies and whether tenant-specific aliases are permitted;
- canonical archive event addition and explicit discontinuation deferral or command;
- minimum read endpoints/permissions and cursor/filter contracts for adjustments, counts, and transfers;
- transfer partial receipt and exception transitions at prototype depth;
- unit/precision representation and approved conversion source;
- negative-stock default and override policy;
- balance concurrency mechanism and Drizzle suitability result;
- event retry horizon, claim lease, ordering key, dead-letter retention, and replay approval;
- worker-process and pool topology through the ADR-0027 revisit, including process ownership, composition paths, connection limits, shutdown, migration execution, tenant context, and recovery;
- CSV-first versus any bounded XLSX support based on server-side streaming and technology evidence.

These are technical/domain contract choices within governed ownership. A business fact that architecture cannot infer is added to the Founder Decision Register instead of being guessed.

PR1 selects the following controlled-prototype answers, subject to exact-head independent review and merge of issue #64:

| Decision | Selected answer and authority |
|---|---|
| Product aggregate | Product is the first-slice aggregate root for its Variant and Identifier behavior; PDA-DOM-002 v0.3.0 keeps richer assortment/publication depth deferred. |
| Barcode | Exact tenant-scoped identifier lookup is canonical; format and check-digit validation are identifier-scheme policy, and tenant aliases may not replace a canonical identifier or cross tenant scope. |
| Lifecycle | Archive is an externally meaningful fact with `catalog.product.archived.v1`; Discontinued remains distinct and its command producer is deferred. |
| Read surface | Adjustment, count, and transfer list/detail operations use `inventory.adjustment.read`, `inventory.count.read`, and `inventory.transfer.read`; all Catalog/Inventory operations require a currently revalidated active context. |
| Workflow posting | Adjustment approval atomically approves and posts under `inventory.adjustment.approve`; count approval atomically approves and posts under `inventory.count.approve`. No separate post permission or externally observable approved-only state is introduced. Adjustment correction uses `inventory.adjustment.reverse` and a linked inverse movement. |
| Transfers | Draft, Dispatched, PartiallyReceived, Received, Exception, and Cancelled are the prototype states; dispatch uses the separate `inventory.transfer.dispatch` permission. |
| Quantity and conversion | Contracts carry exact decimal strings with at most six fractional digits; directional Transfer/Return command lines must be greater than zero, while signed values remain available only for adjustment, variance, movement, and reversal facts; persistence uses `numeric(38,6)`; conversion provenance uses an explicit `conversionSourceId`. |
| Stock policy | Negative stock is denied by default. No generic override is introduced; a future exception needs a named permission, reason, limit, audit, and domain decision. |
| Concurrency | Same-key posting uses owner-adapter row locking and one transaction; PDA-APP-021 records exact-decimal, 20-way concurrency, reversal, rebuild, atomicity, and 250k query-shape evidence. |
| Event delivery | PDA-PLT-008 v0.3.0 selects a 30-second renewable claim lease, bounded jittered retry for at most 20 attempts/24 hours, tenant/producer/aggregate ordering, a provisional 30-day dead-letter review window, and audited `platform.event.replay`. |
| Worker topology | ADR-0027 v0.3.1 selects a separate Event Backbone worker with one process-local bounded pool and no migrations, but PDA-ENGR-012 deliberately leaves its candidate root unregistered and executable-denied until PR4 records the required prototype architecture/data/security reviews. |
| Import format | PDA-PLT-024 v0.2.0 selects server-side UTF-8 CSV for WS2; XLSX remains deferred pending streaming, formula/link, decompression, malware, resource-budget, and deterministic-type evidence. |

The selections close decision ambiguity only. They do not pre-close PR1's independent review, RR-006 delivery evidence, RR-007 production isolation, or any later WS2 exit gate.

### 16.2 Named deferrals

The following are not WS2 exit blockers unless implementation falsely claims them: rich categories/brands/assortments/media/localization, supplier catalog and costs, pricing calculation, lots/serials/expiry/quarantine depth, replenishment, financial valuation, warehouse execution, production global search, external webhooks, full offline synchronization, production RLS, production scale/failover, and contractual/pilot evidence.

### 16.3 WS2 closes only when

- G1–G6 are closed without an expired or contradictory exception;
- all 14 capabilities have committed evidence for every required dimension at registered depth;
- the final OpenAPI, permission, event, schema, and generated contract counts agree exactly;
- every emitted event has an owner schema, transactional outbox proof, delivery evidence, and idempotent consumer evidence where a consumer exists;
- RR-006 is closed by real worker evidence, not by renaming outbox storage;
- the selected delivery process/pool topology is authorized by the amended or superseding ADR and enforced by generated architecture rules;
- Catalog and Inventory cores remain runtime-neutral and concrete persistence remains owner-specific and composition-bound;
- no cross-owner repository/table/migration import exists;
- all tenant-owned state, jobs, events, projections, imports, caches, and errors pass two-tenant denial tests;
- ledger facts are append-only, corrections are linked reversals, and balance rebuild reports zero unexplained divergence;
- permissions and entitlements are independently enforced at transport and application-command boundaries;
- offline-origin Inventory commands are deterministic and idempotent while the WS5 transport/lease boundary remains explicit;
- the Product/Inventory UI is real, accessible, responsive, reloadable, and clear about authority, projection freshness, denial, conflict, and reconciliation;
- Bun and the approved Node fallback execute the declared critical contracts, domains, migrations, event delivery, and API paths;
- registry evidence, technology lessons, risk dispositions, runbooks, documentation, migrations, contracts, and all repository gates are green on the reviewed head.

WS2 completion means Technical Prototype 2 is evidenced at controlled-prototype depth. It does not close RR-007, FDR-004, broader first-slice work, or pilot/production gates.

## 17. Review and Change Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Codex | Author and cross-document reconciliation | Drafted for independent review | 2026-07-14 | Reconciled ADR-0027 ownership, current registry counts, missing lifecycle/dispatch/read contracts, RR-006, and the WS2/WS5 offline boundary. |
| Claude Code | Independent architecture and registry consistency | Changes required on v0.1.0 | 2026-07-14 | Submitted one P1, one P2, and two P3 findings on worker/pool authority, Persistence owner registration, dispatch permission naming, and offline-budget meaning; all accepted and remediated in v0.1.1, with implementation closure still assigned to PR1/WS5. |
| Claude Code | Independent plan concurrence | Concurred on PR #63 exact head | 2026-07-14 | Re-verified all four remediations in an isolated worktree, confirmed identifier non-collision and clean governance/CI, and declared G1 satisfied before PR1 began. |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.1 | 2026-07-15 | Platform Design Authority | Recorded PR2 merge/concurrence and active issue #68; selected atomic adjustment/count approve-and-post semantics and the explicit `inventory.adjustment.reverse` correction contract before PR3 persistence generation. |
| 0.3.0 | 2026-07-14 | Platform Design Authority | Recorded merged PR1 concurrence and issue #66 PR2 execution status; clarified that PR2 preserves validated Variant/Identifier identities and remains pending exact-head independent review and merge. |
| 0.2.2 | 2026-07-14 | Platform Design Authority | Made the worker gate executable by leaving its candidate composition root unregistered until PR4 records the three ADR reviews; required literal worker and unknown-app denial probes. |
| 0.2.1 | 2026-07-14 | Platform Design Authority | Preserve signed ledger facts while requiring strictly positive quantities for directional Transfer and Return command lines after PR #65 contract review. |
| 0.2.0 | 2026-07-14 | Platform Design Authority | Record PR #63 concurrence and the exact PR1 controlled-prototype decisions for lifecycle, permissions, quantity, concurrency, event delivery, worker topology, and CSV-first import. |
| 0.1.1 | 2026-07-14 | Platform Design Authority | Dispositioned Claude Code's four PR #63 findings: gated worker/pool topology on an ADR-0027 revisit, named Persistence owner registrations, proposed the dispatch permission ID, and corrected offline budget meanings. |
| 0.1.0 | 2026-07-14 | Platform Design Authority | Initial governed WS2 Catalog and Inventory implementation-control draft. |
