---
document_id: PDA-APP-022
title: WS2 PR3 Inventory Ledger Controlled-Prototype Evidence
version: 0.1.2
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-15
verified_as_of: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0016, ADR-0020, ADR-0027]
---

# WS2 PR3 Inventory Ledger Controlled-Prototype Evidence

## Purpose and boundary

Record the executable evidence for PDA-RDM-009 PR3 and issue #68. This evidence covers the controlled-prototype Inventory owner, its nine PostgreSQL tables, application boundary, and canonical API/event seams. It does not claim production readiness, end-to-end offline synchronization, event delivery, PostgreSQL row-level security, lots/serials, valuation, or worker completion. RR-006 remains open for PR4 and RR-007 remains open.

## Implemented owner surface

| Area | Evidence |
|---|---|
| Runtime-neutral core | `@meridian/domain-inventory` contains exact decimal arithmetic, state rules, ports, services, permission/entitlement boundary, and Bun tests without Bun, Hono, oRPC, or database imports |
| Persistence ownership | `@meridian/persistence-inventory-postgres` owns exactly the nine PDA-DAT-019 tables registered in PDA-ENGR-012 and one isolated generated migration history |
| Physical ledger | Every physical change appends `inventory_stock_movement` and applies the same balance key atomically; posted movements are never edited or deleted |
| Adjustments | Maker/checker approval atomically posts the movement; reversal requires separate authority and appends an exact linked inverse |
| Counts | Blind submission accepts observations only; expected quantity and variance are derived at independent approval/posting |
| Transfers | Stable line identities preserve requested, dispatched, received, remaining, and exception quantities across dispatch and partial/exception receipt |
| Reservations | The PDA-RDM-009 internal prototype seam creates and releases reservations without changing physical on-hand stock; it deliberately has no public application/router/OpenAPI operation or permission until a later owner contract authorizes one |
| Offline boundary | Only synthetic `VerifiedOfflineLeaseFacts` enter the runtime-neutral evaluator; accepted commands use owner receipts and stable accepted/duplicate/rejected/conflict/review-required outcomes; lease issuance and transport remain WS5 |
| Rebuild | The owner adapter can reconstruct balances from immutable movements inside one Inventory transaction |
| API boundary | Sixteen Inventory operations are implemented through the governed oRPC contracts with current context, permission, entitlement, reference, version, and tenant checks |

## Executable invariants

| Invariant | Proof |
|---|---|
| Exact quantity | Six-decimal fixed-scale arithmetic is tested beyond `Number.MAX_SAFE_INTEGER`; PostgreSQL uses `numeric(38,6)` |
| Default negative-stock denial | Domain tests and a live PostgreSQL insert-path regression prove an unseen or existing balance cannot cross below zero |
| Idempotency | API and offline command receipts bind tenant, operation, key, fingerprint, result, and offline source identity; a transaction-scoped command-identity lock is acquired before replay lookup or owner side effects, and an unexpected late receipt conflict forces rollback; live concurrent duplicate tests cover both API and offline-origin identities |
| Tenant isolation | Repository predicates include tenant scope, keys include tenant ID, and foreign-tenant detail lookup returns the same not-found result as an absent record |
| Concurrent posting | Parallel movements on one balance serialize through the PostgreSQL guarded update/upsert boundary and preserve the exact sum; separate parallel same-command tests prove only one Adjustment fact/receipt and one offline movement/receipt are committed |
| Filtered pagination | Adjustment, Count, and Transfer location/state predicates execute in the owner query before the cursor limit; live two-page evidence for all three workflow families proves matching rows are neither hidden by unrelated rows nor assigned an unrelated cursor |
| Reference lookup | Location validation uses direct tenant-scoped identity lookup plus organization comparison, so valid references are not bounded by an arbitrary list page |
| Conservation | Dispatch subtracts source stock, receipt adds only actual destination stock, and exception quantity explains the terminal in-transit remainder |
| Reversal | The original movement remains immutable and a unique linked inverse returns its balance contribution to zero |
| Atomic outbox | Injected outbox failure rolls back the movement, balance, aggregate version, and command receipt together |
| Database constraints | Raw SQL bypass tests produce SQLSTATE `23514` for invalid cumulative transfer quantities; generated checks also cover states, posting evidence, reversal linkage, source metadata, and nonnegative balances |
| Rebuild | A deliberately corrupted positive balance is restored exactly from the immutable movement sum |
| Runtime fallback | The serial migration runner and a critical Inventory create/approve/read/two-tenant-denial path run under the approved Node fallback as well as Bun |

## Contract and architecture evidence

- PDA-DOM-003 remains the Inventory semantic source and PDA-DOM-002 remains the Catalog owner.
- Inventory consumes Product/Variant and Location references through injected published-contract ports. The concrete Catalog and Tenancy bindings exist only in `apps/server/composition`.
- The API server retains one composition-owned PostgreSQL pool and remains the only migration runner under ADR-0027.
- The unreviewed `apps/worker/composition` root remains executable-denied. No delivery worker, retry, dead-letter, replay, or projection-delivery completion is claimed.
- Permission checks execute in the oRPC adapter and again in the Inventory application boundary. Entitlements are evaluated separately and repository tenant predicates remain mandatory after authorization.
- The Inventory event set is appended transactionally to the durable outbox. Publication remains PR4 work.

## Verification commands

The exact PR head must retain successful results for:

```text
bun run check-types
bun run test
bun run check
python scripts/validate_docs.py
python scripts/generate_registries.py --check
python scripts/generate_contracts.py --check
python scripts/check_architecture.py
python scripts/test_architecture_checker.py
bun run db:generate
docker compose exec -T server bun test composition/inventory.integration.test.ts
docker compose exec -T server bun run db:test:node
```

Drizzle migration freshness must report `No schema changes, nothing to migrate`. Exact final test counts and CI links belong in the pull-request evidence and independent exact-head review, not as a mutable expectation in this source document.

## Explicit deferrals and residual risk

- RR-006: event worker delivery, leases, retry, dead-letter, replay, ordering, and consumer idempotency remain open for PR4.
- RR-007: production PostgreSQL role topology and RLS evidence remain open.
- Offline command transport, device trust, signature verification, and lease issuance remain WS5; PR3 consumes only already-verified facts.
- Reservations remain the explicitly internal create/release prototype seam selected by PDA-RDM-009. They are exercised through the Inventory owner service and have canonical events, but no public application/router/OpenAPI surface or permission is claimed in PR3.
- Lots, serials, valuation, replenishment, advanced allocation, and production inventory scale are outside this PR3 depth.
- This evidence uses controlled-prototype data and local PostgreSQL 18.4. Production contention, cardinality, recovery, and availability evidence remain outstanding.

## Change Log

- 2026-07-15 — v0.1.2 added the missing Inventory migration directory to the CI freshness diff, proved concurrent offline-origin replay, added live maker/checker and two-page Count/Transfer evidence, covered offline negative-stock rejection, and made the internal-only Reservation boundary explicit.
- 2026-07-15 — v0.1.1 added executable evidence for pre-side-effect command serialization, owner-query filtering before cursor pagination, direct Location lookup, and Inventory inclusion in root `db:generate`; it did not add the Inventory directory to the CI diff-path list, which v0.1.2 corrects.
- 2026-07-15 — v0.1.0 recorded WS2 PR3 Inventory ledger, workflow, persistence, API, offline-boundary, and verification evidence without advancing production readiness.
