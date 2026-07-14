---
document_id: PDA-ARC-005
title: Event Standards
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016, ADR-0028]
---

# Event Standards

## Purpose

Define naming, ownership, envelope, schema, compatibility, security, delivery, registry, and operational standards for business and platform events.

## Naming

Every event uses exactly:

`<namespace>.<entity>.<past-tense-fact>.v<major>`

Canonical examples already defined by owning specifications:

- `commerce.sale.completed.v1`
- `inventory.stock.adjusted.v1`
- `workforce.employment.activated.v1`
- `platform.session.revoked.v1`
- `party.duplicate.detected.v1`
- `security.risk-assessment.created.v1`
- `loyalty.points-earned.posted.v1`
- `developer.webhook-delivery.failed.v1`
- `commercial.subscription.activated.v1`
- `ai.tool-invocation.completed.v1`
- `fiscalization.submission.accepted.v1`
- `marketplace.listing.published.v1`

## Namespace Rules

- The prefix must exist in `registry/domains.json`.
- A namespace names an ownership boundary, not a provider or framework.
- Business domains use their canonical domain prefix.
- Platform primitives use `platform` unless a separately registered platform area owns the family.
- Engine families with substantial contracts may use a dedicated registered prefix such as `ai`, `loyalty`, or `fiscalization`.
- `engine.<engine-name>` remains a top-level capability convention and is not automatically an event prefix convention.
- Better Auth lifecycle events use `platform`, because Better Auth sits behind the Platform Identity boundary.
- A new namespace requires an ADR, an authoritative document, and registry update.

## Entity and Fact Rules

- Entity is a singular canonical noun or a precise hyphenated noun phrase.
- The fact is past tense and describes something that completed.
- Do not collapse entity and fact into one segment.
- Do not publish commands or future intentions as completed facts.
- A request may be an event only when the request itself has been durably recorded and canonically defined by its owner.
- Avoid generic facts such as `updated` when a more meaningful fact exists.
- Event names do not encode tenant, plan, provider, region, or implementation technology.

## Standard Envelope

Every event contains:

- Globally unique event identifier
- Event name and major version
- Occurred-at and published-at timestamps
- An explicit `Tenant` or `Platform` scope discriminator
- Tenant and organization scope for Tenant-scoped facts
- Producer namespace and authoritative capability
- Actor and source channel
- Correlation, causation, idempotency, and trace identifiers where applicable
- Data classification and purpose
- Payload schema reference and schema version
- Aggregate or resource identifier where ordering is defined

## Rules

1. Events describe facts that have already occurred.
2. Events are immutable after publication, subject only to privacy-safe payload handling and retention rules defined by ADR-0014.
3. Producers own event semantics and compatibility.
4. Consumers are idempotent and tolerate duplicate delivery.
5. Payloads contain enough context for legitimate consumers without copying entire authoritative records.
6. Sensitive data is minimized, masked, tokenized, pseudonymized, or referenced.
7. Ordering guarantees are narrow and documented.
8. Failed consumers do not block the producer's authoritative transaction.
9. Internal events and externally delivered webhooks are distinct contracts even when a webhook is derived from an event.
10. A cached event or replay never grants current authorization.
11. Every event reference in governed documentation must resolve to one canonical definition in an owning specification.
12. Tenant-scoped events require a real tenant identifier. Platform-scoped events prohibit tenant, organization, legal-entity, and location scope and are allowed only for explicitly registered platform-global facts under ADR-0028.
13. A request's active tenant, a membership list, or a synthetic “system tenant” must not be used to attribute a platform-global identity or security fact.

## Schema Evolution

- Additive optional fields are preferred.
- Field meaning cannot change silently.
- Removed or incompatible fields require a new major event name.
- Consumers ignore unknown compatible fields.
- Schemas, examples, support windows, and deprecation dates are published.
- Classification or privacy changes may require payload minimization or a new contract.

## Delivery and Replay

At-least-once delivery is the default. Replays require scoped authorization, audit, time range, consumer selection, and protection against duplicate business effects.

External webhook delivery is owned by the Developer Platform. Internal event transport remains owned by the Event Backbone.

## Event Registry

`registry/events.json` is generated from governed documents. It records event name, source path and line, producer namespace, entity, fact, document status, and duplicate detection.

The registry is an index; authoritative semantics remain in the owning source specification.

## Quality Gates

- Naming and namespace validation
- Canonical-definition coverage for every event reference
- Duplicate event detection
- Schema validation
- Producer contract tests
- Consumer compatibility tests
- Duplicate and reordering tests
- Tenant-isolation tests
- Dead-letter and replay tests
- Sensitive-payload and privacy review
- Registry freshness in CI
