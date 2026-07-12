---
document_id: ADR-0016
title: Use Registered Namespaces and Uniform Event Conventions
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-11
supersedes: null
superseded_by: null
---

# ADR-0016 — Use Registered Namespaces and Uniform Event Conventions

## Context

The blueprint defines one event pattern, but earlier documents introduced unregistered prefixes and ambiguous event shapes. This made ownership difficult to verify automatically.

The platform requires stable namespaces for capabilities, permissions, schemas, APIs, events, registries, and generated code.

## Decision

Every capability, event, permission, and schema identifier begins with a prefix registered in `registry/domains.json`.

### Event Pattern

Events use exactly:

`<namespace>.<entity>.<past-tense-fact>.v<major>`

Canonical examples:

- `commerce.sale.completed.v1`
- `platform.session.revoked.v1`
- `party.duplicate.detected.v1`
- `loyalty.points-earned.posted.v1`
- `security.risk-assessment.created.v1`
- `commercial.subscription.activated.v1`
- `developer.webhook-delivery.failed.v1`
- `ai.tool-invocation.completed.v1`
- `fiscalization.submission.accepted.v1`
- `marketplace.listing.published.v1`

The entity segment may contain hyphens. The fact segment may contain hyphens only when one past-tense phrase genuinely requires it. Commands, future intentions, and unrecorded workflow requests are not completed-fact events.

### Namespace Types

Registered namespaces may represent:

- Business domain
- Platform kernel area
- Shared engine family
- Security or data platform area
- Developer platform area
- Marketplace
- Commercial control plane
- Shared master-data capability

A directory name, product plan, provider, or framework does not automatically become a namespace.

### Engine Convention

`engine.<engine-name>` remains the top-level capability identifier used to register a shared engine.

An engine with a substantial capability and event family receives a dedicated namespace. Initial dedicated engine namespaces include `ai`, `loyalty`, and `fiscalization`.

Thus `engine.ai-orchestration` registers the engine, while detailed capabilities and events use identifiers such as `ai.tool-registry` and `ai.tool-invocation.completed.v1`.

### Platform Identity Events

Better Auth is an implementation foundation behind the Platform Identity boundary. Authentication and session events use the `platform` namespace rather than a vendor or separate `identity` namespace.

### Ownership

The namespace record names an authoritative document. The producer named by that document owns semantics, schema compatibility, classification, and deprecation.

A new prefix requires an ADR or amendment, an authoritative document, registry update, and CI validation.

Every governed event reference must resolve to exactly one canonical definition in an owning specification. Examples that are not canonically defined are prohibited because they become accidental contracts.

## Consequences

### Positive

- Event and capability ownership becomes machine-checkable
- Agents cannot silently invent prefixes or pseudo-contracts
- Engine families have consistent detailed naming
- Provider and framework names stay out of business contracts
- Event registries and SDK generation become deterministic

### Negative

- New platform areas require registry work
- Some broad `engine.*` registrations coexist with dedicated family namespaces
- Documentation examples must use real canonical events rather than hypothetical names

## Required Controls

- CI validates event shape and registered prefix
- CI rejects duplicate canonical definitions
- CI rejects event references with no canonical definition
- `registry/events.json` is generated from governed documents
- Public contracts never rename an event silently
- First-slice API and event contracts reference owning specifications instead of redefining events

## Validation

The decision is validated when every governed event reference resolves to one canonical definition, all prefixes resolve to authoritative owners, and the generated event registry contains no duplicates or orphaned references.