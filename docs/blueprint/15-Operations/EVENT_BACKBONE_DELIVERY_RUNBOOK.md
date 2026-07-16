---
document_id: PDA-OPS-018
title: Event Backbone Delivery Runbook
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0014, ADR-0016, ADR-0027]
---

# Event Backbone Delivery Runbook

## Purpose and scope

Operate the controlled-prototype internal Event Backbone for `platform.events`, Catalog search projection delivery, and Inventory balance reconciliation. This runbook covers backlog, stale claims, consumer failure, dead-letter review, bounded replay, projection rebuild, and shutdown/recovery. It does not cover Developer Platform webhooks, production SLOs, production PostgreSQL roles/RLS, or permission to edit authoritative owner tables.

## Ownership and safety boundaries

- Platform Kernel owns Event Backbone claim, attempt, dead-letter, replay-request, and consumer-receipt state under PDA-PLT-008 and PDA-DAT-019.
- Catalog owns `catalog_product_search_projection`; Inventory owns `inventory_stock_balance` and its ledger reconciliation.
- Operators never change committed event envelopes, existing receipts, Inventory movements, or Product state to clear an incident.
- `POST /v1/event-replays` is the only HTTP replay authority boundary. It requires `platform.event.replay`, current tenant context, purpose, compatible consumer/version, a maximum 1,000-event inclusive range, idempotency, and Audit evidence.
- Diagnostics use safe aggregate counts and opaque identifiers. Never copy payloads, claim tokens, credentials, cookies, headers, SQL errors, Party PII, or unrestricted requests into logs, tickets, metrics, or Audit metadata.

## Prototype controls

| Control | Bound |
|---|---|
| Claim lease | 30 seconds, renewed every 10 seconds while a claimed event is processed |
| Retry | Full jitter; 1-second base, exponential, 5-minute cap |
| Terminal horizon | Earlier of 20 attempts or 24 hours |
| Ordering | `(tenant_id, producer_namespace, aggregate_id)` only |
| Replay range | 1–1,000 inclusive delivery-sequence positions |
| Worker pool | Maximum 5 connections; server 10; administrative reserve 10; prototype allocation 25 |
| Dead-letter review | At most 30 days; shorter source/privacy retention wins |

## Signals and triggers

Use the worker's safe aggregate health snapshot: pending, retrying, claimed, dead-lettered, attempts in the last hour, failures in the last hour, delivered in the last hour, and oldest eligible age. Tenant IDs and event names are diagnostic filters only in access-controlled investigation and never metric labels.

Investigate when:

- oldest eligible age rises across consecutive checks;
- pending or retrying grows while delivered throughput is flat;
- a claim remains beyond its renewable lease;
- failure rate rises or a dead-letter appears;
- Catalog projection source version lags its Product version;
- an Inventory balance reports `RequiresReview`;
- a replay remains `running` after its bounded events should have completed.

Production alert thresholds and SLOs remain a pilot gate under PDA-OPS-015.

## Safe diagnosis

1. Confirm worker process health and database reachability without printing connection strings.
2. Record correlation ID, opaque event/request ID, consumer ID/version, safe state/reason code, sequence range, and timestamps.
3. Read aggregate health. Do not start by selecting event payloads.
4. Check whether an earlier nonterminal event blocks the same narrow stream.
5. Check claim lease expiry and attempt reason codes. Never reveal the claim-token digest.
6. Check consumer receipt identity `(consumer_id, event_id, consumer_schema_version)`.
7. For Catalog, compare Product source version with projection source version inside the same tenant.
8. For Inventory, compare the balance against the signed movement sum; do not repair by editing movements or quantities.
9. Confirm the event's retention/privacy state before any replay or payload inspection.

## Containment and recovery

### Stale or killed worker

Stop the unhealthy replica. Do not clear its claim manually. After the 30-second lease expires, a healthy worker may claim with a new token. Verify the stale token cannot complete, renew, or release the event, then confirm one receipt per consumer/event/version.

### Tenant-scoped pause and recovery

For the controlled prototype, set the validated `WORKER_PAUSED_TENANT_IDS` comma-separated opaque tenant-ID list and restart the worker gracefully. The claim query excludes only those tenant rows; other tenants and Platform-scoped events remain eligible. Confirm the target tenant stops advancing while another tenant continues. Remove the ID and restart to resume. Record who authorized the pause, purpose, start/end time, affected tenant, backlog counts, and reconciliation result. This configuration seam is not a production control plane or customer-facing API.

### Transient database failure

Restore database reachability, retain the outbox row, and allow bounded retry. If the retry horizon is exhausted, use dead-letter review. Do not bypass owner migrations or run migrations from the worker.

### Poison or incompatible event

Keep the minimized dead-letter evidence, classify the safe reason, stop automatic retries at the governed bound, and escalate to the producer owner. Correct producer or consumer code/schema; never rewrite the committed event. Reprocessing requires a new authorized replay request.

### Catalog projection lag

Verify the source Product in the same tenant, then use the registered `catalog-search-projection@1.0.0` consumer through bounded replay. Confirm projection source event/version and timestamp. Any subsequent command must revalidate authoritative Catalog state.

### Inventory reconciliation divergence

Mark or retain `RequiresReview`, compare the balance with immutable movement sums, and escalate to Inventory ownership. Correct business facts only through governed reversal/compensation commands. Replay may re-run reconciliation; it must not manufacture or edit movements.

### Replay failure

Confirm current authority, Audit reference, tenant, consumer/version compatibility, range, and retention. Under the reviewed single-worker prototype topology, a request left `running` for 15 minutes is eligible for safe idempotent recovery; verify the bounded projection/reconciliation effect and final request state. Failed requests remain evidence. Submit a new idempotent request only after the cause is corrected; never directly queue repository rows.

## Verification and closure

An incident closes only when backlog returns to the accepted prototype baseline, affected streams advance in order, no duplicate consumer effect exists, projections are reconciled or explicitly `RequiresReview`, Audit/correlation evidence is retained, and the recovery action is reproducible. Preserve timing, counts, safe codes, commands/tests used, reviewer, and follow-up issue. Escalate privacy, security, cross-tenant, or ledger-integrity anomalies immediately.

## Open production gates

RR-007, production SLOs/alerts, multi-replica capacity, production roles/RLS, backup/PITR replay behavior, operator UI, formal privacy-deletion execution, and exercised incident communication remain open. This Draft runbook is controlled-prototype guidance only.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.1 | 2026-07-16 | Platform Design Authority | Added bounded stale-running replay recovery under the reviewed single-worker prototype topology. |
| 0.1.0 | 2026-07-15 | Platform Design Authority | Added controlled-prototype delivery, replay, projection, reconciliation, and safe recovery procedure for WS2 PR4. |
