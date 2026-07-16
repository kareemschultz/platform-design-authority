---
document_id: PDA-APP-023
title: WS2 PR4 Event Delivery and Projection Evidence
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0014, ADR-0016, ADR-0027]
---

# WS2 PR4 Event Delivery and Projection Evidence

## Evidence boundary

This record covers issue #70 and PR #74 at controlled-prototype depth: internal Event Backbone delivery, replay, safe health observability, Catalog search projection, and Inventory balance reconciliation. It does not claim external webhook delivery, production readiness, production SLOs, production RLS/roles, multi-region or multi-replica capacity, production privacy-erasure execution, or WS2 completion.

The ADR-0027 pre-worker gate was independently satisfied at exact head `771cb493fce4040dc1edb501fed1005aec585d63` in PR #74 comment `4987122519` before `apps/worker/composition` was registered or implemented.

## Implemented evidence

| Requirement | Executable evidence |
|---|---|
| Worker boundary | Exact `apps/worker/composition` registration; architecture probes permit only that literal root, reject adjacent/unregistered roots, reject worker migrations, and reject direct owner persistence imports outside composition |
| Pool topology | Worker owns one validated pool capped at 5; server remains 10; Compose preserves the reviewed 10+5+10=25 prototype allocation; worker exposes no migration command |
| Claims and recovery | `FOR UPDATE SKIP LOCKED`, opaque SHA-256 claim-token digest, 30-second lease, 10-second renewal, compare-and-set renew/retry/complete, expired-lease recovery, stale-token rejection, and validated tenant-scoped pause/resume configuration that does not block other tenants |
| Ordering | Later events in the same tenant/producer/aggregate stream are ineligible while an earlier event is nonterminal; independent streams claim concurrently |
| Retry and terminal state | Runtime-neutral injected clock/jitter; full jitter, 1-second base, 5-minute cap, 20-attempt/24-hour terminal bounds, append-only safe attempts, minimized dead-letter evidence |
| Consumer idempotency | Unique `(consumer_id, event_id, consumer_schema_version)` receipt; sibling success persists while another consumer retries; cross-tenant receipt FK denial |
| Replay authority | `POST /v1/event-replays`; transport and direct application permission checks; current active tenant; event, producer-schema, consumer-version, and retention-class compatibility allowlists; 1,000-event inclusive bound; purpose; idempotency; append-only Audit before queue; tenant-scoped range load; ordered execution; stale-running recovery after 15 minutes |
| Catalog projection | Catalog-owned `catalog_product_search_projection`; generated owner migration; tenant-preserving Product FK; authoritative Product/Variant/identifier rebuild; source event/version/time; foreign-tenant source denial |
| Inventory reconciliation | Inventory-owned adapter rebuilds a missing non-negative balance projection from immutable movement facts, compares every existing tenant balance with the ledger sum, marks divergence `RequiresReview`, and never rewrites ledger facts |
| Observability | Payload-free aggregate pending/retrying/claimed/dead-lettered, attempt/failure/delivery throughput, and oldest-eligible-age snapshot; no tenant or payload metric labels |
| Runtime compatibility | Worker production bundle plus Bun and approved Node critical-path checks |

## Live PostgreSQL 18 evidence

The disposable live suite applies Platform Events, Catalog, and Inventory owner migrations, then proves:

- repeat migration;
- narrow stream ordering and independent-stream concurrent claims;
- expired-lease recovery and stale-token CAS denial;
- successful lease renewal plus post-recovery stale-token rejection;
- receipt deduplication and SQLSTATE `23503` cross-tenant denial;
- safe aggregate health shape;
- replay idempotency/conflict behavior, foreign-tenant non-disclosure, bounded tenant claim/load/completion, and stale-running recovery;
- minimized persisted terminal dead-letter state;
- Catalog projection rebuild and foreign-tenant non-disclosure;
- Inventory ledger/balance divergence detection and missing-projection rebuild.

The current targeted live result is **11 passed, 0 failed, 40 expectations**. The runtime-neutral Event Backbone plus server transport/application replay suite is **36 passed, 0 failed, 90 expectations**. Final PR exact-head CI remains the authoritative aggregate and must be green before concurrence or merge.

## Privacy and safety

PDA-DAT-019 classifies every Event Backbone table/field and the Catalog projection fields used here. Committed envelopes are immutable. Attempts and health omit payload and exception text. Dead-letter summaries are minimized. Replay derives tenant and approver from current identity, does not reveal foreign existence, and does not mutate the source event or existing receipt. Audit metadata is allowlisted; replay purpose is Confidential change evidence.

## RR-006 disposition

The implementation now supplies the code and live evidence needed to remedy RR-006 at controlled-prototype depth. The register remains Open in this PR until the exact implementation head receives independent concurrence, all required CI is green, and PR #74 merges, because PDA-RDM-009 G6 requires merged exact-head evidence. After merge, the next governed housekeeping change may mark RR-006 Closed with this document, the concurrence comment, merge SHA, and CI links. RR-007 and every pilot/production gate remain open.

## Known limits

- No external webhooks are implemented; Developer Platform retains that ownership.
- Replay is a bounded internal projection/reconciliation operation, not a general event-store product.
- Catalog lexical projection is a controlled prototype, not global Search.
- Inventory reconciliation detects divergence and requires governed repair; it never silently edits ledger facts.
- Multi-replica capacity, production roles/RLS, production alerts/SLOs, restore/PITR exercises, and deletion-journal execution remain later evidence.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-15 | Platform Design Authority | Added WS2 PR4 implementation, live PostgreSQL, authorization, replay, projection, recovery, and observability evidence with conditional RR-006 disposition. |
| 0.1.1 | 2026-07-16 | Platform Design Authority | Strengthened producer-schema and retention-compatible replay, lease renewal, idempotency conflict/non-disclosure, persisted dead-letter, missing Inventory projection rebuild, stale-running replay recovery, and updated live PostgreSQL evidence without closing RR-006. |
