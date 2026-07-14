---
document_id: PDA-DAT-017
title: Party Prototype Schema Classification and Isolation
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0003, ADR-0007, ADR-0014, ADR-0027]
review_evidence: []
---

# Party Prototype Schema Classification and Isolation

## Purpose and Authority

This record satisfies the pre-migration declaration required by PDA-RDM-008 §3 G7 for WS1 PR4. It governs only the named Technical Prototype 1 implementation of `party.records` and `party.identity-links`. ADR-0007 and ADR-0014 remain Proposed; this prototype exercises them and does not ratify them or authorize pilot/production use.

The authoritative owner is Party and Relationships. Better Auth remains the owner of authentication accounts and sessions, and Platform Tenancy remains the owner of memberships and tenant hierarchy. `PlatformIdentityLink` stores opaque references and does not transfer either owner's data or behavior to Party.

## Table Declarations

| Table | Tenant scope and owner | Default classification | Retention and erasure | Offline | Audit implications |
|---|---|---|---|---|---|
| `party_record` | Party; composite `(tenant_id, id)` primary key | Confidential | `party-profile`; delete or irreversibly pseudonymize direct identity under an approved ADR-0014 workflow; legal hold may restrict instead | No direct offline store in PR4 | Create and state-changing commands require actor/correlation evidence; PR7 supplies the governed audit store |
| `party_person_detail` | Party; composite tenant-preserving FK to `party_record` | Confidential | Follows `party-profile` and the parent privacy transformation | Denied in PR4 | Access is covered by Party record permission/audit policy |
| `party_organization_detail` | Party; composite tenant-preserving FK to `party_record` | Confidential | Follows `party-profile`; retained organization identity still requires a declared purpose | Denied in PR4 | Access is covered by Party record permission/audit policy |
| `party_contact_point` | Party; composite tenant-preserving FK to `party_record` | Confidential; Restricted is required before future government/regulated identifiers are added | `party-profile`; contact values are mutable PII and are erased or pseudonymized when no retained purpose remains | Denied in PR4 | Raw contact values are prohibited from events, idempotency receipts, logs, and ordinary audit summaries |
| `party_identity_link` | Party; composite tenant-preserving FK to `party_record`; membership and auth IDs are opaque cross-owner references without database FKs | Confidential | Retain while the governed identity relationship is active; end/restrict rather than silently deleting the Party; privacy workflow evaluates each owner separately | Denied in PR4 | Link creation publishes a privacy-safe canonical event and requires active-membership reconciliation |
| `party_command_receipt` | Party; composite `(tenant_id, operation, idempotency_key)` primary key | Confidential | Short operational deduplication window to be finalized before production; result contains only response DTOs and request fingerprint is SHA-256, never raw PII | Denied | Provides retry/recovery evidence; it is not a substitute for the PR7 audit record |

Unknown Party fields inherit Confidential under PDA-DAT-010. No Restricted identifier, birth date, credential, secret, consent inference, address, relationship, merge, or cross-tenant correlation is introduced by PR4.

## Isolation Controls

- Every Party table carries non-null `tenant_id`.
- Party-owned parent/child references use tenant-preserving composite keys and foreign keys.
- Repository reads and writes require tenant scope; API tenant scope is derived from a session-bound active context and is revalidated inside the Party application boundary.
- `domains/party` receives active-context and membership authority as injected interfaces. It does not import Platform Tenancy persistence, Better Auth schema, or another owner's implementation.
- The identity-link table intentionally has no database foreign key to Platform Tenancy or Better Auth. Composition validates an active membership before the Party transaction creates the link.
- State mutation and its canonical event append share one database transaction. Create-command receipts are claimed before mutation so concurrent retries cannot create unreferenced duplicate rows.
- Event payloads carry opaque IDs and classification only; contact values and registered names are excluded.

## PostgreSQL RLS Disposition

PostgreSQL row-level security is **deferred for this controlled prototype**, not rejected. The process currently uses one composition-owned database role and has no reviewed transaction-local tenant context or connection-pool reset protocol. Enabling policies without that protocol would create false assurance or pooled-context leakage risk.

Compensating controls at prototype depth are mandatory tenant parameters, composite tenant keys/FKs, server-derived active context, two-tenant negative tests, cross-tenant write-constraint tests, and architecture enforcement. Pilot and production remain blocked until Security and Data Platform review a database-role model, tenant-context set/reset behavior, migration/owner privileges, bypass policy, background-job behavior, restore behavior, and executable RLS denial tests.

## Executable Evidence

WS1 PR4 must keep these checks green:

- Party domain tests for idempotency binding, optimistic concurrency, privacy-safe event payloads, active-context revalidation, and membership reconciliation.
- PostgreSQL 18 integration tests for empty/repeat migration, tenant-isolated reads, composite FKs, state/outbox rollback, command replay, and identity-link ownership.
- Bun and approved Node fallback migration/runtime checks from the same commit.
- Architecture, OpenAPI/contract, documentation, registry, lint, type, unit, build, migration-freshness, and secret/PII scans.

## Explicit Deferrals

Addresses, identifiers, relationships, duplicate detection, merge, role-scoped erasure execution, deletion-journal delivery, offline Party writes, search projections, and global/cross-tenant identities remain outside PR4. Their canonical capability registrations are not evidence that they were implemented.
