---
document_id: PDA-APP-023
title: WS2 PR4 Event Delivery and Projection Evidence
version: 0.2.0
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
| Worker boundary | Exact `apps/worker/composition` registration; architecture probes permit only that literal root, reject adjacent/unregistered roots, reject worker-owned migration artifacts, reject `migrate*` invocation outside `apps/server/composition`, reject worker pool creation outside composition, and reject direct owner persistence imports outside composition |
| Pool topology | Worker owns one validated pool capped at 5; server remains 10; Compose preserves the reviewed 10+5+10=25 prototype allocation; worker exposes no migration command |
| Claims and recovery | `FOR UPDATE SKIP LOCKED`, opaque SHA-256 claim-token digest, genuine same-row concurrent claim exclusion, 30-second lease, 10-second renewal with direct inside-renewed-window exclusion, compare-and-set renew/retry/complete, expired-lease recovery, stale-token rejection, and validated tenant-scoped pause/resume configuration that does not block other tenants |
| Ordering | Later events in the same tenant/producer/aggregate stream are ineligible while an earlier event is nonterminal; independent streams claim concurrently |
| Retry and terminal state | Runtime-neutral injected clock/jitter; full jitter, 1-second base, 5-minute cap, 20-attempt/24-hour terminal bounds, append-only safe attempts, minimized dead-letter evidence |
| Consumer idempotency | Ordinary receipt scope preserves unique `(consumer_id, event_id, consumer_schema_version)` delivery identity; replay scope adds the exact `replay_request_id`; sibling success persists while another consumer retries; cross-tenant receipt FK denial |
| Replay authority | `POST /v1/event-replays`; transport and direct application permission checks; current active tenant; event, producer-schema, consumer-version, and retention-class compatibility allowlists; 1,000-event inclusive bound; purpose; idempotency; append-only Audit before queue; tenant-scoped range load; ordered execution; per-event replay receipts; stale-running recovery skips completed receipt scopes after 15 minutes |
| Catalog projection | Catalog-owned `catalog_product_search_projection`; generated owner migration; tenant-preserving Product FK; authoritative Product/Variant/identifier rebuild; source event/version/time; foreign-tenant source denial |
| Inventory reconciliation | Inventory-owned adapter rebuilds a missing non-negative balance projection from immutable movement facts, compares every existing tenant balance with the ledger sum, marks divergence `RequiresReview`, and never rewrites ledger facts |
| Observability | Payload-free aggregate pending/retrying/claimed/dead-lettered, attempt/failure/delivery throughput, and oldest-eligible-age snapshot; no tenant or payload metric labels |
| Runtime compatibility | Worker production bundle plus Bun and approved Node critical-path checks |

## Live PostgreSQL 18 evidence

The disposable live suite applies Platform Events, Catalog, and Inventory owner migrations, then proves:

- repeat migration;
- narrow stream ordering, independent-stream concurrent claims, and exactly one winner for two concurrent claims of the same row;
- expired-lease recovery and stale-token CAS denial;
- successful lease renewal plus post-recovery stale-token rejection;
- receipt deduplication and SQLSTATE `23503` cross-tenant denial;
- safe aggregate health shape;
- ordinary/replay receipt coexistence and replay-receipt deduplication, replay idempotency/conflict behavior, foreign-tenant non-disclosure, bounded tenant claim/load/completion, and stale-running recovery;
- minimized persisted terminal dead-letter state;
- Catalog projection rebuild and foreign-tenant non-disclosure;
- Inventory ledger/balance divergence detection with literal `on_hand` non-overwrite and missing-projection rebuild.

The targeted live result is **12 passed, 0 failed, 48 expectations**, reproduced with `bun run --cwd apps/worker db:test` against PostgreSQL 18 after setting the validated worker `DATABASE_URL`, `NODE_ENV=test`, and `WORKER_DATABASE_POOL_MAX=5`. The runtime-neutral Event Backbone plus server transport/application replay result is **36 passed, 0 failed, 91 expectations**, reproduced with `bun test packages/platform/events/src/index.test.ts packages/platform/events/src/delivery.test.ts packages/platform/events/src/replay.test.ts apps/server/src/router.test.ts`. Claude Code independently reproduced the final lanes at exact head `8b676bc4df140acf9c0a2a40aa44cb9e94c46e26`; both required workflows were green before PR #74 merged as `7202fc819b70982c013e1ca11a4fcc136e01e2de`.

## Privacy and safety

PDA-DAT-019 classifies every Event Backbone table/field and the Catalog projection fields used here. Committed envelopes are immutable. Attempts and health omit payload and exception text. Dead-letter summaries are minimized. Replay derives tenant and approver from current identity, does not reveal foreign existence, does not mutate the source event or ordinary receipt, and appends a replay-request-scoped receipt after each idempotent consumer effect. Audit metadata is allowlisted; replay purpose is Confidential change evidence.

## RR-006 disposition

RR-006 is closed at controlled-prototype depth in PDA-REV-009. Exact implementation head `8b676bc4df140acf9c0a2a40aa44cb9e94c46e26` received independent concurrence in PR #74 comment `4991097241`, both required CI workflows were green, and PR #74 merged as `7202fc819b70982c013e1ca11a4fcc136e01e2de`. This closes only the missing bounded internal delivery runtime; RR-007, production SLO/capacity/alerting, multi-replica topology, production retention, restore exercises, and external webhook delivery remain open.

## Known limits

- No external webhooks are implemented; Developer Platform retains that ownership.
- Replay is a bounded internal projection/reconciliation operation, not a general event-store product.
- Catalog lexical projection is a controlled prototype, not global Search.
- Inventory reconciliation detects divergence and requires governed repair; it never silently edits ledger facts.
- Multi-replica capacity, production roles/RLS, production alerts/SLOs, restore/PITR exercises, and deletion-journal execution remain later evidence.
- Consumer effects remain independently idempotent by source-event identity because no receipt table can make a cross-owner effect plus receipt atomic; the scoped receipt closes completed-event recovery replay, while owner-command idempotency closes the crash window between effect and receipt.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-07-16 | Platform Design Authority | Reconciled the historical pending wording with exact-head concurrence, green CI, PR #74 merge, and the existing controlled-prototype RR-006 closure while retaining every production and RR-007 gate. |
| 0.1.2 | 2026-07-16 | Platform Design Authority | Remediated the independent audit with replay-scoped receipts, stale-recovery deduplication, same-row claim contention, executable worker-migration denial, literal optional coverage, and exact evidence commands; RR-006 remains open pending superseding concurrence and merge. |
| 0.1.1 | 2026-07-16 | Platform Design Authority | Strengthened producer-schema and retention-compatible replay, lease renewal, idempotency conflict/non-disclosure, persisted dead-letter, missing Inventory projection rebuild, stale-running replay recovery, and updated live PostgreSQL evidence without closing RR-006. |
| 0.1.0 | 2026-07-15 | Platform Design Authority | Added WS2 PR4 implementation, live PostgreSQL, authorization, replay, projection, recovery, and observability evidence with conditional RR-006 disposition. |
