---
document_id: PDA-DEV-001
title: Webhooks and Event Delivery
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Webhooks and Event Delivery

## Purpose

Define the externally consumable event-delivery service for customers, partners, integrations, extensions, and marketplace applications.

## Architectural Position

The platform event backbone owns internal event publication. The Developer Platform owns external webhook subscriptions, filtering, delivery, signing, retry, replay, observability, and customer administration.

External delivery is an asynchronous projection of committed platform events. It must never become the only record of a business event or a synchronous dependency for committing a domain transaction.

## Core Entities

- Webhook endpoint
- Subscription
- Event selection and filter
- Signing secret and key version
- Delivery attempt
- Delivery result
- Replay request
- Dead-letter record
- Consumer health record

## Endpoint Configuration

Each endpoint defines:

- Tenant, application, and environment
- HTTPS destination
- Selected event types and optional filters
- API or event schema version
- Signing method and active key version
- Delivery timeout
- Retry policy
- Rate and concurrency limits
- Suspension policy
- Owner and support contact

## Delivery Contract

Every delivery includes:

- Globally unique event identifier
- Event type and schema version
- Event occurrence time
- Tenant and organization scope appropriate to the consumer
- Correlation and causation identifiers
- Delivery-attempt identifier
- Signed timestamp and payload digest
- Minimal authorized event data or a resource reference

The platform may use a CloudEvents-compatible envelope where it improves interoperability, but platform event naming and authorization remain authoritative.

## Security

- HTTPS only in production
- HMAC or asymmetric signatures with timestamp and replay protection
- Secret display only at creation, with rotation support
- Destination verification and SSRF protections
- Controlled redirects
- Tenant-scoped event filtering
- No authorization based solely on possession of an event payload
- Redaction and minimization of protected fields
- Optional allow-listed destinations or mutual TLS for regulated customers

## Delivery Behavior

1. Persist delivery intent before dispatch.
2. Deliver at least once.
3. Require consumers to deduplicate by event identifier.
4. Use exponential backoff with jitter.
5. Stop retrying after the configured horizon and move to a visible dead-letter state.
6. Do not guarantee delivery order across independent event streams.
7. Preserve per-resource or per-aggregate ordering only when explicitly contracted.
8. Allow authorized replay by event, time range, or failed-delivery group.

## Consumer Administration

Customers must be able to:

- Create, test, rotate, pause, and delete endpoints
- Inspect recent deliveries and sanitized responses
- Filter by status and event type
- Replay failed deliveries
- Download verification examples
- View schema and compatibility notices
- Receive endpoint-health alerts

## Rate and Abuse Controls

Delivery must respect tenant, endpoint, and destination limits. Repeated failures, DNS changes, suspicious redirects, or excessive latency may automatically pause an endpoint and alert its owners.

## Versioning

- Event types use explicit major versions.
- Compatible additive changes follow the event-standards policy.
- Breaking changes require a new major event type and migration window.
- Consumers may pin supported versions during the published support period.

## Observability

Track queue delay, attempt latency, success rate, status-code distribution, retry depth, dead letters, endpoint suspensions, payload size, and replay activity without logging secrets or protected payloads.

## Initial Scope

The first vertical slice must support:

- Subscription creation
- Signed delivery
- Idempotent retries
- Delivery dashboard
- Manual replay
- Secret rotation
- At least one Commerce and one Inventory event

## Source References

- CloudEvents Specification 1.0.2: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
