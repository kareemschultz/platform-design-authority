---
document_id: ADR-0007
title: Adopt a Canonical Party and Relationship Model
version: 0.1.1
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-14
supersedes: null
superseded_by: null
---

# ADR-0007 — Adopt a Canonical Party and Relationship Model

## Context

The platform currently assigns customers and contacts to CRM, suppliers to Procurement, workers to Workforce, users to Better Auth, and various external participants to domain-specific records. A real person or organization may hold several roles at once: customer, supplier, employee, contractor, guarantor, partner, franchisee, shareholder, service provider, or contact.

Without a canonical cross-domain identity model, the same real-world party will be duplicated across domains. That creates inconsistent names, addresses, tax identifiers, communication preferences, sanctions status, relationships, and audit history.

The platform must solve shared identity without turning one central service into the owner of every domain-specific business rule.

## Decision Drivers

- One real-world party may have many simultaneous business roles
- Domain-specific behavior must remain domain-owned
- Shared identity, contact points, addresses, identifiers, and relationships require a canonical reference
- Tenant isolation and data minimization must remain explicit
- Merging, deduplication, privacy rights, and audit require stable cross-domain linkage
- Better Auth users must remain separate from business-party records
- Offline clients and integrations need durable identifiers
- Organizations may have branches, legal entities, beneficial owners, and contact persons

## Options Considered

### Domain-owned records with no shared party layer

Simple initially, but duplicates the same real-world person or organization and makes reconciliation, privacy, reporting, and integration unreliable.

### CRM owns all parties

Provides one customer-oriented record, but incorrectly makes CRM authoritative for suppliers, workers, government bodies, internal legal entities, and other non-customer actors.

### Canonical Party and Relationship service with domain-role projections

A shared master-data capability owns stable party identity, identifiers, contact points, addresses, consent references, and relationships. Domains own their role-specific records and lifecycle.

### Federated records with only a cross-reference registry

Less centralization, but makes shared-profile changes, deduplication, relationship traversal, and privacy workflows significantly harder.

## Decision

Adopt a canonical **Party and Relationship** platform capability.

The Party capability owns:

- Stable Party identifiers
- Person and Organization party types
- Names and aliases
- Contact points
- Addresses and address usages
- External identifiers and identifier provenance
- Party relationships and relationship types
- Duplicate candidates, merge records, and survivorship evidence
- Basic status and lifecycle independent of domain roles
- Links to authenticated identities
- Privacy and disclosure classifications for shared party attributes

Domains own role projections and domain-specific behavior, including:

- CRM: customer, prospect, lead, contact engagement, account ownership, pipeline, and customer-specific attributes
- Procurement: supplier qualification, terms, sourcing, supplier risk, and purchasing behavior
- Workforce: worker, employee, contractor, employment, compensation, and workforce lifecycle
- Commerce: buyer, recipient, bill-to, ship-to, and transaction participant roles
- Finance: account receivable/payable counterparty, credit, tax, and financial posting context
- Marketing: audience membership, campaign behavior, and marketing consent interpretation
- Partner Platform: reseller, publisher, implementation partner, and delegated-management relationships

A domain-role record references a canonical Party. The Party record does not absorb the domain's authoritative business state.

## Better Auth Boundary

A Better Auth user is an authentication account, not a Party.

A `PlatformIdentityLink` may connect one authentication user to one or more Party-role contexts subject to tenant and organization scope. Deleting, suspending, or changing an authentication account does not silently delete the Party or its business records.

## Tenant and Global Scope

The first implementation uses tenant-scoped Party records by default.

Cross-tenant global identity, network identity, shared suppliers, sanctions entities, and marketplace identities require separate privacy, consent, and governance decisions. Do not create a hidden global person database in the first release.

## Merge and Deduplication

Party merging must:

- Preserve immutable identifiers and merge history
- Avoid automatic destructive merges
- Show evidence and confidence
- Require permission and approval above configured risk thresholds
- Repoint domain-role links through governed commands
- Preserve source provenance and audit
- Support reversal where technically and legally possible

## Consequences

### Positive

- One real-world party can hold multiple roles without duplicated master data
- Cross-domain reporting and privacy workflows become possible
- Contact, address, and identifier quality improves
- Integrations gain a stable canonical reference
- Better Auth remains correctly separated from business identity

### Negative

- Introduces a shared platform capability with broad dependencies
- Requires careful field ownership and conflict-resolution rules
- Deduplication and merge behavior are operationally sensitive
- Some domains will need local snapshots for historical and legal correctness
- Cross-tenant use cases remain deliberately deferred

## Required Controls

- Field-level ownership and provenance
- Tenant isolation
- Purpose and disclosure classification
- Immutable historical snapshots where transactions require them
- Domain-role APIs rather than direct Party-table mutation
- Merge approval and audit
- Privacy-rights integration
- Search permission filtering
- Offline identity and conflict rules
- Integration mapping and external identifier governance

## Validation

The model is validated when one organization can simultaneously be:

- A customer in CRM and Commerce
- A supplier in Procurement
- A financial counterparty in Finance
- A partner in the Partner Platform

while sharing canonical identity and contact information but retaining independent domain lifecycle, permissions, and historical transaction snapshots.

## WS1 Prototype Evidence

PDA-IMPL-005 records tenant-scoped Person and Organization Party creation/read/list/update, optimistic concurrency, idempotency, privacy-safe events, `PlatformIdentityLink`, and composition-owned reconciliation from membership to Party. Better Auth users, memberships, Parties, and domain roles remain separate records and lifecycles.

The broader relationship, cross-domain role, merge/deduplication, rich identifier/address, global/shared identity, and privacy-request validation above remains open. The ADR remains Proposed and the implemented `party.records` depth remains `prototype`.

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Codex | WS1 implementation consistency | Prototype evidence recorded | 2026-07-14 | PDA-IMPL-005 proves only the registered Party prototype subset. Consolidated independent Claude Code review remains pending under RR-011. |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.1 | 2026-07-14 | Platform Design Authority | Linked bounded WS1 Party evidence; lifecycle and full-model validation remain open. |
| 0.1.0 | 2026-07-10 | Platform Design Authority | Initial proposal. |
