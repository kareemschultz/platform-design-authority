---
document_id: PDA-PLT-008
title: Event Backbone
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0014, ADR-0016, ADR-0027]
---

# Event Backbone

## Purpose

Define the shared internal infrastructure for publishing, transporting, consuming, replaying, retaining, and observing versioned business and platform events.

External webhook subscriptions and delivery attempts are owned by the Developer Platform. The Event Backbone provides committed internal facts from which authorized external deliveries may be projected.

## Event Principles

- Events describe completed facts in past tense.
- Commands request change; events report that change occurred.
- Event prefixes are registered in `registry/domains.json`.
- Events carry tenant, correlation, causation, source, timestamp, classification, and schema-version context.
- Producers own event meaning and compatibility.
- Consumers are idempotent.
- Event transport does not replace authoritative domain transactions.
- A replay does not grant current permission or entitlement.

## Event Envelope

The standard envelope includes:

- Event identifier
- Event name and major version
- Occurred-at timestamp
- Published-at timestamp
- Tenant, organization, and legal-entity scope where applicable
- Producer namespace and authoritative capability
- Actor and source channel
- Correlation, causation, idempotency, and trace identifiers
- Data classification, purpose, and retention class
- Resource or aggregate reference
- Payload and schema reference

## Publication Reliability

Authoritative state changes and event publication use a reliable transactional outbox or equivalent pattern to prevent lost or phantom events.

The outbox record is not automatically the long-term event store. Retention and replay windows are defined per event family and use case.

## Delivery Semantics

At-least-once delivery is the default. Consumers deduplicate by event identifier and make side effects idempotent. Ordering guarantees are declared narrowly per resource or stream rather than assumed globally.

### WS2 controlled-prototype delivery policy

The following parameters are the implementation contract for WS2 PR4. They authorize a bounded prototype; production values remain subject to capacity, recovery, privacy, and operational evidence.

- The Event Backbone worker claims committed outbox rows with `FOR UPDATE SKIP LOCKED` and a 30-second renewable lease. A worker that cannot renew before expiry abandons the claim; another worker may redeliver it.
- Retry begins at one second, doubles per attempt, uses full jitter, and is capped at five minutes between attempts. Delivery stops at the earlier of 20 failed attempts or 24 hours after the first claim and then moves to dead-letter review.
- Ordering is narrow: events sharing `(tenant_id, producer_namespace, aggregate_id)` are delivered in outbox sequence. No ordering is promised across tenants, aggregates, or independent producer namespaces.
- A dead-letter record retains the minimized event envelope, schema reference, failure classification, attempt summary, and encrypted payload only when the event retention class permits it. The prototype review window is 30 days; a shorter governing privacy or domain retention rule wins. This value is not a production records schedule.
- Replay is a new authorized delivery attempt, never a mutation of the original event. It requires `platform.event.replay`, an authenticated tenant scope, a recorded purpose and approver, compatible producer and consumer schema versions, an allowlisted event range, and append-only audit evidence. Cross-tenant, unbounded, or unaudited replay is prohibited.
- Consumer receipts are unique by `(consumer_id, event_id)`. A replay or expired lease may repeat transport but must not repeat a business effect.

PR4 must measure claim recovery, retry timing, poison-message isolation, tenant-scoped pause/recovery, and zero duplicate consumer effects before RR-006 can close. These parameters do not claim that the present outbox is already a delivery system.

## Failure Handling

- Bounded retries with exponential backoff and jitter
- Dead-letter handling
- Quarantine for malformed, unauthorized, or classification-incompatible messages
- Replay with permission, purpose, scope, and audit
- Consumer health and lag monitoring
- Poison-message diagnostics
- Tenant-scoped pause and recovery
- Privacy purge or payload minimization where retention no longer permits content

## Schema Evolution

- Additive compatible change is preferred.
- Breaking changes require a new major event name.
- Producers support documented compatibility windows.
- Consumers tolerate unknown optional fields.
- Schemas and examples are published through the Developer Platform.
- Classification or privacy changes may require a minimized payload or new contract.

## Security and Privacy

Events preserve tenant isolation, minimize sensitive payloads, encrypt transport, authenticate producers and consumers, and prevent unauthorized subscription or replay.

Direct identifiers and secrets are avoided. Where a privacy action applies, retained payloads, dead letters, replay stores, search projections, and external webhook payload retention follow ADR-0014 and the deletion journal.

## Registered Initial Event Families

- `platform` — tenancy, organization, identity, authorization, entitlements, configuration, audit, jobs, notifications, devices, and privacy primitives
- `party` — people, organizations, contact points, relationships, merges, and role-scoped privacy state
- `commerce` — orders, returns, registers, cash, stored value, storefront checkout, and recurring agreements
- `catalog`, `inventory`, `warehouse`, `procurement`, `finance`, `crm`, `workforce`, `payroll`, `logistics`, `manufacturing`, `projects`, `service`, `assets`, `maintenance`, `fleet`, `rental`, `marketing`, `knowledge`, `governance`, and `planning`
- `ai` — model requests, tool invocations, agents, evaluations, and budgets
- `loyalty` — memberships, earning, redemption, tiers, and expiration
- `fiscalization` — statutory documents, submissions, acknowledgements, rejections, and contingency
- `security` — privacy, risk assessments, cases, protective actions, and appeals
- `commercial` — platform contracts, subscriptions, trials, billing, usage, and partner settlement
- `developer` — application, API-key, webhook-subscription, delivery, and compatibility lifecycle

The authoritative prefix registry is `registry/domains.json`. This list is descriptive and must not drift from the registry.

## Event Registry

`registry/events.json` is generated from governed event sections and validated in CI. A duplicate definition, invalid shape, or unregistered prefix fails governance checks.

## Observability

Measure publish failures, throughput, queue delay, consumer lag, retries, dead letters, replay activity, schema violations, privacy-purge failures, tenant-scoped incidents, and end-to-end processing latency.

## Change Log

- 0.3.0 (2026-07-14): Select the bounded WS2 claim lease, retry horizon, ordering key, dead-letter review window, replay authority, and consumer-idempotency contract.
