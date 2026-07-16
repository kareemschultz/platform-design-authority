---
document_id: PDA-FND-010
title: Naming Standards
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0016, ADR-0026]
---

# Naming Standards

## Purpose

Consistent language is essential for a platform that spans many domains. This document defines naming rules for product terminology, capabilities, records, APIs, events, code, identifiers, and documents.

## General Rules

- Use one canonical term for one concept.
- Prefer business language over implementation jargon.
- Avoid abbreviations unless widely understood and documented.
- Avoid names tied to one industry when the capability is broader.
- Use names that remain valid if deployment or technology changes.
- Do not use marketing names inside core domain models.
- Record approved synonyms in the glossary rather than creating duplicate concepts.
- Query `registry/domains.json` before inventing an identifier prefix.

## Internal Codename and Public Brand Boundary

“Meridian” is an internal engineering codename under ADR-0026, not the commercial product name. It may identify the private workspace, internal `@meridian/*` packages, service and database labels, CI workflows, internal prototype slugs/schemes and private prototype bundle identifiers. It must not appear in:

- capability, event, permission, schema, endpoint, operation or other canonical public identifiers;
- tenant-visible application strings, installed-app display names, receipts, documents, notifications, sender identities or support presentation;
- release-preview or published product documentation, public API descriptions, public package names/scopes, product domains, app-store listings or commercial claims;
- default white-label fallbacks that a tenant, partner, customer or external developer could see.

Customer-visible surfaces use configured platform, partner or tenant branding, or a neutral description such as “Platform” or “Platform Prototype” until FDR-011 is decided. A generic description is not a commercial name and grants no trademark or publishing authority.

All internal `meridian` and `@meridian/*` packages set `private: true`. Public package, domain, app-store, sender or documentation publication requires FDR-002 ownership, FDR-005 publication/licensing posture, FDR-011 founder selection, qualified clearance and channel-specific ownership evidence. A commercial-name decision never renames canonical capability, event or permission identifiers.

`scripts/validate_codename_boundary.py` enforces the machine-verifiable subset: canonical registries and public contracts remain codename-neutral; visible application source and installed-app display name do not embed the codename; release-preview/published product docs remain neutral; internal packages remain private; and the FDR-011 register/packet gate remains present. Review is still required for rendered assets, images, compiled dependencies, externally configured domains/senders, app-store metadata and semantic brand implication.

## Platform Hierarchy Terms

- **Platform** — the complete shared system
- **Domain** — an area of business ownership and authoritative behavior
- **Capability** — a discrete business or platform ability
- **Module** — a commercially or operationally packaged grouping of capabilities; not automatically a deployment unit
- **Engine** — reusable cross-domain business logic
- **Platform Service** — a shared technical or operational primitive
- **Industry Pack** — configuration and content that assembles capabilities for an industry
- **Workspace** — a role- and task-focused user experience
- **Extension** — an independently installed addition using published contracts
- **Integration** — a connection to an external system
- **Entitlement** — an organization's right to use a capability
- **Permission** — an actor's right to perform an action

## Canonical Commercial Terms

- **Platform Subscription** — the SaaS commercial agreement sold by the platform to a tenant, partner, or reseller
- **Recurring Agreement** — the Commerce agreement through which a tenant sells recurring services or benefits to its customer
- **Stored Value** — Commerce-owned monetary value such as gift cards or store credit
- **Loyalty Value** — non-cash points or benefits owned by Loyalty

Do not use the unqualified word `Subscription` in schemas, APIs, or events where both commercial layers could be confused.

## Record Naming

Business records use singular nouns in domain models and plural nouns for collections.

Examples:

- `Order` and `Orders`
- `Party` and `Parties`
- `SupplierCommercialProfile` and `SupplierCommercialProfiles`
- `PlatformSubscription` and `PlatformSubscriptions`
- `RecurringAgreement` and `RecurringAgreements`
- `StoredValueInstrument` and `StoredValueInstruments`

Avoid ambiguous generic terms such as `Item`, `Entry`, `Object`, `Profile`, or `Data` unless their meaning is formally constrained.

## API Naming

- Resource names use stable canonical nouns.
- URLs use lowercase plural nouns and hyphens where needed.
- Commands use explicit verbs.
- Avoid exposing database table names.
- Version public APIs explicitly.
- Use consistent pagination, filtering, sorting, error, and idempotency conventions.

Examples:

```text
GET /v1/orders
POST /v1/orders
POST /v1/orders/{orderId}/cancel
POST /v1/inventory-adjustments
POST /v1/stored-value-instruments/{instrumentId}/reserve
```

## Namespace Registry

Every capability, event, permission, and schema prefix must be registered in `registry/domains.json`.

A prefix identifies an ownership boundary. It must not be created from a provider name, plan name, implementation framework, temporary project, or directory merely for convenience.

A new prefix requires an ADR, authoritative document, registry update, and CI validation.

## Event Naming

Events describe completed facts in past tense.

Pattern:

`<namespace>.<entity>.<past-tense-fact>.v<major>`

Examples:

```text
commerce.order.created.v1
inventory.stock.adjusted.v1
platform.session.revoked.v1
party.duplicate.detected.v1
security.risk-assessment.created.v1
loyalty.points-earned.posted.v1
commercial.subscription.activated.v1
developer.webhook-delivery.failed.v1
ai.tool-invocation.completed.v1
```

Rules:

- Use exactly four dot-separated segments including the version.
- Entity and fact may contain hyphens.
- Commands must not be named as events.
- Better Auth implementation events use the Platform Identity namespace, not a vendor namespace.
- Event names must be present in `registry/events.json` before implementation.

## Permission Naming

Pattern:

`<namespace>.<resource>.<action>`

Examples:

```text
commerce.order.read
commerce.order.create
commerce.order.cancel
commerce.stored-value.adjust
inventory.adjustment.approve
workforce.employee.compensation-read
payroll.pay-run.post
security.risk-case.review
```

Actions use a stable registered vocabulary where possible: `read`, `create`, `update`, `delete`, `approve`, `post`, `reverse`, `export`, `administer`, `impersonate`, and domain-specific verbs where necessary.

## Capability Naming

Pattern:

`<namespace>.<capability>`

Examples:

```text
commerce.pos
commerce.stored-value
inventory.lot-tracking
warehouse.wave-picking
security.tenant-isolation
ai.tool-registry
loyalty.redemption
```

Top-level shared engines may be registered as `engine.<engine-name>`. Detailed capabilities for substantial engine families use their dedicated namespace, such as `ai.*`, `loyalty.*`, or `fiscalization.*`.

Capabilities must not be named after pricing plans.

## Human-Readable Identifiers

Internal primary keys remain globally unique and opaque. Human-facing references may use configurable prefixes and sequences.

Examples:

```text
ORD-2026-000001
INV-2026-000001
PO-2026-000001
EMP-000001
WH-000001
```

Reference formats support tenant configuration, collision prevention, fiscal periods, offline range allocation, voids, migration, and reconciliation.

## Document Naming

- Foundation and policy documents use uppercase snake case.
- ADRs use `ADR-NNNN-DESCRIPTIVE-TITLE.md`.
- Domain and platform specifications use stable descriptive names.
- Avoid dates in filenames unless the document is inherently periodic evidence.
- Periodic evidence uses `DESCRIPTIVE_NAME-YYYY-MM-DD.md`.
- Version and status belong in front matter, not filenames.

Governed architecture documents use their registered `PDA-*` or `ADR-*` identifier. Product, administrator, developer, migration, troubleshooting, and release pages under `apps/docs/content/docs/` use a route-independent `PDOC-NNNN` identifier. A `PDOC-*` identifier supports contextual help, redirects, version binding, and publication controls; it does not place product content in the architecture authority plane or grant permission to a reader.

## Prohibited Patterns

- Different names for the same concept across domains without an approved terminology mapping
- Names that encode temporary vendors or frameworks into business concepts
- Plan names used as authorization rules
- The bare term `Subscription` when the commercial layer is ambiguous
- `Manager`, `Helper`, `Utility`, or `Service` without a precise responsibility
- Acronyms that are not present in the glossary
- Event prefixes absent from `registry/domains.json`
- Three- or five-segment event names that bypass the canonical event pattern
