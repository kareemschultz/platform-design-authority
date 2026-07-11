---
document_id: ADR-0016
title: Use Registered Namespaces and Uniform Event Conventions
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0016 — Use Registered Namespaces and Uniform Event Conventions

## Context

The blueprint defines one event pattern, but documents introduced unregistered prefixes such as `identity`, `security`, `loyalty`, and `commercial`, while AI events used `engine.ai.*`. Some names collapsed the entity and fact into one segment. This made event ownership ambiguous and impossible to validate automatically.

The platform requires stable namespaces for capabilities, permissions, schemas, APIs, events, registries, and generated code.

## Decision

Every capability, event, permission, and schema identifier begins with a prefix registered in `registry/domains.json`.

### Event Pattern

Events use exactly:

`<namespace>.<entity>.<past-tense-fact>.v<major>`

Examples:

- `commerce.order.created.v1`
- `platform.session.revoked.v1`
- `party.duplicate.detected.v1`
- `loyalty.points-earned.posted.v1`
- `security.risk-assessment.created.v1`
- `commercial.subscription.activated.v1`
- `developer.webhook-delivery.failed.v1`
- `ai.tool-invocation.completed.v1`
- `fiscalization.submission.accepted.v1`

The entity segment may contain hyphens. The fact segment may contain hyphens only when a single past-tense phrase genuinely requires it. Commands, requests for future action, and workflow intentions are not published as completed-fact events.

### Namespace Types

Registered namespaces may represent:

- Business domain
- Platform kernel area
- Shared engine family
- Security or data platform area
- Developer platform area
- Commercial control plane
- Shared master-data capability

A directory name, product plan, provider, or implementation framework does not automatically become a namespace.

### Engine Convention

`engine.<engine-name>` remains the top-level capability identifier used to register a shared engine in the capability map.

An engine with a substantial capability and event family receives a dedicated namespace. Initial dedicated engine namespaces are:

- `ai`
- `loyalty`
- `fiscalization`

Thus `engine.ai-orchestration` registers the engine, while detailed capabilities and events use identifiers such as `ai.tool-registry` and `ai.tool-invocation.completed.v1`.

### Platform Identity Events

Better Auth is an implementation foundation behind the Platform Identity boundary. Authentication and session events therefore use the `platform` namespace rather than inventing an `identity` namespace.

### Ownership

The namespace record names an authoritative document. The producer named by that document owns semantics, schema compatibility, classification, and deprecation.

A new prefix requires an ADR or an amendment to this ADR, an authoritative document, registry update, and CI validation.

## Consequences

### Positive

- Event and capability ownership becomes machine-checkable
- AI agents cannot silently invent prefixes
- Engine families have consistent detailed naming
- Provider and framework names stay out of business contracts
- Event registries and SDK generation become deterministic

### Negative

- Existing event examples must be renamed before implementation
- Registry changes become required for new platform areas
- Some broad `engine.*` identifiers coexist with dedicated family namespaces by design

## Required Controls

- CI validates event shape and registered prefix
- CI rejects duplicate event names
- `registry/events.json` is generated from governed documents
- Event examples in Draft documents may change, but implemented names require compatibility and deprecation policy
- Public contracts must never rename an event silently

## Validation

The decision is validated when every governed event example passes the same validator, all event prefixes resolve to an authoritative owner, and the generated event registry contains no duplicates.