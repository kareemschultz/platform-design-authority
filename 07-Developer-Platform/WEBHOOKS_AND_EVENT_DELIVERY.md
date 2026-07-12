---
document_id: PDA-DEV-002
title: Webhooks and Event Delivery
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
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

Each endpoint defines tenant, application, environment, HTTPS destination, event types, filters, schema version, signing method, key version, timeout, retry, rate limits, suspension policy, and owner.

## Delivery Contract

Every delivery includes event identifier, event type, schema version, occurrence time, tenant scope, correlation, causation, delivery-attempt identifier, signed timestamp, digest, and minimal authorized payload or resource reference.

The platform may use a CloudEvents-compatible envelope where useful, but platform naming and authorization remain authoritative.

## Security

- HTTPS only in production
- HMAC or asymmetric signatures with timestamp and replay protection
- Secret rotation
- Destination verification and SSRF protection
- Controlled redirects
- Tenant-scoped event filtering
- Data minimization
- Optional destination allowlists or mutual TLS

## Delivery Behavior

1. Persist intent before dispatch.
2. Deliver at least once.
3. Require consumer deduplication.
4. Retry with bounded exponential backoff and jitter.
5. Move exhausted deliveries to visible dead-letter state.
6. Do not guarantee global ordering.
7. Allow authorized replay.

## Consumer Administration

Customers can create, test, rotate, pause, and delete endpoints; inspect deliveries; filter results; replay failures; download verification examples; view schema notices; and receive health alerts.

## Rate and Abuse Controls

Delivery respects tenant, endpoint, and destination limits. Repeated failures, suspicious redirects, DNS changes, or excessive latency may pause an endpoint.

## Versioning

Event types use explicit major versions. Breaking changes require a new major event type and migration window.

## Observability

Track queue delay, latency, success, status codes, retries, dead letters, suspensions, payload size, and replay without logging secrets or protected payloads.

## Events

- `developer.webhook-subscription.created.v1`
- `developer.webhook-subscription.changed.v1`
- `developer.webhook-subscription.suspended.v1`
- `developer.webhook-delivery.succeeded.v1`
- `developer.webhook-delivery.failed.v1`
- `developer.webhook-delivery.dead-lettered.v1`
- `developer.webhook-replay.requested.v1`

## Initial Scope

Subscription creation, signed delivery, retries, dashboard, manual replay, secret rotation, and at least one Commerce and one Inventory event.