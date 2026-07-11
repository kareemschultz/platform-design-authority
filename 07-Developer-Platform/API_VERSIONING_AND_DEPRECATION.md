---
document_id: PDA-DEV-004
title: API Versioning and Deprecation
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# API Versioning and Deprecation

## Purpose

Define compatibility, lifecycle, communication, migration, and retirement rules for public APIs, internal contracts, SDKs, events, webhooks, extensions, offline protocols, and provider adapters.

## Contract Classes

### Public API

Customer, partner, marketplace, or third-party contracts with published support windows and migration obligations.

### First-Party Application API

Contracts used by web, mobile, edge, and internal applications. These may evolve faster than public APIs but still require coordinated compatibility and generated-client control.

### Internal Domain Contract

Commands, queries, and events between modules of the modular monolith. Internal does not mean ungoverned; cross-domain contracts remain explicit and tested.

### Provider Adapter Contract

The stable platform-facing interface implemented by payment, tax, identity, communication, storage, AI, fiscalization, and other providers.

### Offline Synchronization Protocol

A compatibility-sensitive contract between server and clients that may remain disconnected across multiple releases.

## Versioning Rules

- Public REST APIs use an explicit major version, normally in the path: `/v1/...`.
- Event major versions remain in the event name, for example `commerce.sale.completed.v1`.
- Webhook payloads identify event and schema versions.
- SDKs use semantic versioning.
- Offline protocol messages include protocol and schema versions.
- Internal package versions follow the monorepo release policy.
- A provider adapter exposes a platform adapter version separately from the provider's API version.

## Compatible Changes

Examples that may be compatible when documented and tested:

- Add optional response field
- Add optional request field with a safe default
- Add enum value only when consumers tolerate unknown values
- Add endpoint or event type
- Increase a documented limit without changing semantics
- Add a nullable relationship

A change is not compatible merely because the type checker accepts it. Meaning, validation, ordering, latency, authorization, classification, and billing behavior matter.

## Breaking Changes

Examples:

- Remove or rename field, endpoint, event, or permission
- Change field meaning, unit, currency, timezone, or rounding
- Make optional input required
- Narrow an accepted value set
- Change identifier stability
- Change authorization or tenant scope
- Change event ordering or delivery guarantee
- Change consequential default behavior
- Reclassify data in a way that changes visibility or retention

Breaking public changes require a new major version or a separately versioned resource.

## Deprecation Lifecycle

1. Proposed deprecation with reason and impact analysis
2. Approval and owner assignment
3. Announcement and migration guide
4. Telemetry and affected-consumer inventory
5. Dual-support period
6. Repeated notices and targeted outreach
7. Sunset readiness review
8. Disable in non-production or test environments
9. Production retirement
10. Post-retirement monitoring and archived documentation

## Support Windows

Every public contract declares general-availability date, minimum support period, security-fix policy, deprecation notice, sunset date, successor, migration owner, and emergency-retirement conditions.

Exact commercial support windows remain part of approved product policy. No document promises a duration Operations and Engineering cannot support.

## Consumer Inventory

The Developer Platform records application owner, tenant, environment, credentials, scopes, SDK and contract versions, recent use, webhook subscriptions, support contact, and migration state.

Usage telemetry is minimized and tenant-safe but sufficient to identify affected consumers.

## Events and Webhooks

- A breaking payload change creates a new event major version.
- Old and new versions may coexist during migration.
- Replay preserves the original event version unless an explicit transformation contract exists.
- A webhook endpoint may pin supported versions.
- Event retirement requires consumer telemetry and dead-letter review.
- Privacy transformation may purge retained payload data without changing the historical event name.

## Offline Clients

Offline compatibility requires minimum and maximum protocol versions, delayed-client tolerance, local-store migration, safe refusal behavior, privacy tombstone compatibility, forced-update policy for security-critical cases, and device fleet visibility.

A server release cannot silently make an offline client's queued operations uninterpretable.

## Database and Domain Changes

Database migrations are not public API versions. Domain schema evolution uses expand-and-contract patterns where practical:

1. Add new representation.
2. Write both or translate at the boundary.
3. Backfill and verify.
4. Move readers.
5. Stop old writes.
6. Remove only after compatibility and rollback windows close.

## Emergency Changes

A critical security, privacy, legal, or provider incident may require accelerated disablement. Incident command records the basis, affected consumers, mitigations, communication, fallback, and restoration or retirement plan.

## Documentation and SDKs

Every supported version provides OpenAPI or event schema, changelog, migration guide, examples, generated SDK compatibility, error and rate-limit behavior, security notes, and deprecation metadata.

## Quality Gates

- Automated compatibility diff
- Consumer contract tests
- SDK generation and compilation
- Event schema and replay tests
- Offline multi-version tests
- Authorization and classification regression tests
- Deprecation telemetry and communication evidence
- Rollback or coexistence plan

## First-Slice Scope

The first slice establishes REST `/v1`, Event v1 registry, one generated TypeScript client, webhook signature version, offline protocol version, provider-adapter capability version, and a simulated compatible and breaking migration.

No first-slice public contract is marked GA until support and deprecation ownership are operational.