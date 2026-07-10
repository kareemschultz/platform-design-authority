---
document_id: PDA-ARC-005
title: Event Standards
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Event Standards

## Purpose

Define naming, envelope, schema, compatibility, security, delivery, and operational standards for business and platform events.

## Naming

Use `<domain>.<entity>.<past-tense-fact>.v<major>`.

Examples:

- `commerce.order.created.v1`
- `inventory.stock.adjusted.v1`
- `workforce.employee.hired.v1`
- `payroll.pay-run.posted.v1`

## Standard Envelope

Every event should contain:

- Event identifier
- Event name and major version
- Occurred-at and published-at timestamps
- Tenant and organization scope
- Producer domain
- Actor and source channel
- Correlation, causation, and trace identifiers
- Data classification
- Payload schema reference

## Rules

1. Events describe facts that have already occurred.
2. Events are immutable after publication.
3. Producers own event semantics and compatibility.
4. Consumers must be idempotent and tolerate duplicate delivery.
5. Payloads should contain enough context for legitimate consumers without becoming replicas of entire records.
6. Sensitive data must be minimized, masked, tokenized, or referenced.
7. Ordering guarantees must be narrow and documented.
8. Failed consumers must not block the producer’s authoritative transaction.

## Schema Evolution

- Additive optional fields are preferred
- Field meaning cannot change silently
- Removed or incompatible fields require a new major version
- Consumers must ignore unknown compatible fields
- Schemas, examples, and deprecation dates must be published

## Delivery and Replay

At-least-once delivery is the default. Replays require scoped authorization, audit, time range, consumer selection, and protection against duplicate business effects.

## Quality Gates

- Schema validation
- Producer contract tests
- Consumer compatibility tests
- Duplicate and reordering tests
- Tenant-isolation tests
- Dead-letter and replay tests
- Sensitive-payload review
