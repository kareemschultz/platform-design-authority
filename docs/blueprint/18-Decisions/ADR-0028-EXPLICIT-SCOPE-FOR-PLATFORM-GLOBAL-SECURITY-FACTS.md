---
document_id: ADR-0028
title: Explicit Scope for Platform-Global Security Facts
version: 0.1.1
status: Proposed
owner: Platform Design Authority
created: 2026-07-13
last_reviewed: 2026-07-14
supersedes: null
superseded_by: null
related_adrs: [ADR-0003, ADR-0006, ADR-0014, ADR-0016, ADR-0027]
---

# ADR-0028 — Explicit Scope for Platform-Global Security Facts

## Status

Proposed. This decision may guide WS1 PR7, the named Technical Prototype 1 slice in PDA-RDM-008. It is not production authority. Architecture, Security, and Privacy review remain required before production acceptance.

## Context

Most business and platform facts are tenant-scoped. The canonical event envelope, Audit contract, and transactional outbox therefore require `tenantId`. Authentication accounts and Better Auth sessions are different: they are owned by Platform Identity, may grant entry to several tenant memberships, and exist before or after any active tenant context is selected.

WS1 exposes account-owned `GET /v1/sessions` and `DELETE /v1/sessions/{sessionId}` operations under authenticated-session authority. Revoking one Better Auth session invalidates that session for every tenant it could enter. Recording the active tenant as the owner of that revocation would be false, while duplicating the same fact once per membership would create partial and contradictory evidence. A fabricated “system tenant” would also weaken tenant-isolation controls.

The platform still requires durable, privacy-safe audit and `platform.session.revoked.v1` evidence. The contracts need to represent the fact honestly without making tenant scope optional for ordinary tenant data.

## Decision Drivers

- Preserve tenant isolation and prohibit fabricated tenant identifiers.
- Represent account/session security facts at their real Platform Identity ownership boundary.
- Keep tenant scope mandatory for tenant-owned facts.
- Make exceptional scope machine-checkable in events, outbox storage, audit storage, APIs, and tests.
- Minimize identity data and support ADR-0014 privacy transformation.

## Options Considered

### A. Attribute account-session revocation to the request's active tenant

Rejected. The operation is deliberately account-owned and does not require active tenant context. One tenant cannot truthfully own a session shared across memberships.

### B. Emit one tenant event and audit record per current membership

Rejected. Memberships can change, may not cover pre-membership sessions, and create duplicate facts with inconsistent delivery and retention.

### C. Introduce a synthetic platform or system tenant

Rejected. Synthetic tenancy obscures ownership and risks bypassing controls that assume every tenant identifier names a real isolation boundary.

### D. Add an explicit scope discriminator with a narrow Platform-global case

Selected. Every event and audit record declares `scopeType: "Tenant" | "Platform"`. Tenant facts retain a non-null `tenantId`; Platform facts prohibit tenant, organization, legal-entity, and location scope.

### E. Omit audit and event evidence for account-global actions

Rejected. Session revocation is security-sensitive and must remain durable, correlated, and reviewable.

## Decision

1. Canonical event and audit contracts carry an explicit `scopeType` discriminator.
2. `scopeType: "Tenant"` requires a real `tenantId`. Organization, legal-entity, and location scope may appear only within that tenant.
3. `scopeType: "Platform"` requires `tenantId` and all subordinate tenant fields to be absent or null. It is permitted only for facts whose authoritative aggregate is genuinely platform-global and whose owning specification registers that scope.
4. `platform.session.revoked.v1` is registered as Platform-scoped. Its payload contains the revoked opaque session identifier, authenticated account identifier, whether it was the current session, revocation time, and reason category. It never contains a session token, cookie, raw IP address, user-agent string, credential, factor, or tenant-membership list.
5. Platform Identity commits session revocation, command receipt, and the Platform-scoped outbox event in one owner transaction. Audit consumes that durable fact idempotently; the outbox satisfies the fail-closed durable-evidence boundary when the Audit projection is asynchronous.
6. Tenant-scoped audit-query APIs return only records for the authorized active tenant. Platform-scoped security evidence is not exposed by `GET /v1/audit-records`; a future platform-security query surface requires its own permission, step-up policy, and review.
7. Audit storage separates `scopeType` from a nullable `tenantId`, uses a scope key for ordering and idempotency, and maintains an append-oriented integrity chain per scope. Privacy transformations append evidence and apply an irreversible pseudonym overlay without changing the historical action, time, target class, or outcome.
8. Adapters and schema validators reject mixed or ambiguous scope. No producer may use Platform scope to avoid tenant isolation.

## Rationale

An explicit discriminator makes the exceptional global case visible and testable while retaining the strong invariant for tenant facts. It follows ADR-0003 ownership, ADR-0006's Platform Identity boundary, ADR-0014 privacy minimization, ADR-0016 event discipline, and ADR-0027 owner-specific persistence.

## Consequences

### Positive

- Session evidence reflects its real account-global effect.
- Tenant records remain unambiguously tenant-bound.
- Synthetic or request-context tenant attribution is prohibited.
- Persistence can enforce scope combinations and isolate query paths.
- Privacy transformation can treat global account identifiers separately from tenant Party identifiers.

### Negative

- Event-envelope v1 and Audit contracts change before production acceptance.
- Existing tenant event producers must add `scopeType: "Tenant"`.
- The outbox schema requires a migration from a non-null tenant key to a discriminated scope key.
- Platform-global audit evidence needs a future separately authorized investigation surface.

### Risks

- Producers may misuse Platform scope. Mitigation: schema conditionals, a registered allowlist, architecture tests, and negative integration tests.
- A global scope could become a data lake for PII. Mitigation: payload allowlists, Restricted/Confidential classification, redaction at write, retention classes, and ADR-0014 transformation tests.
- Asynchronous Audit projection may lag. Mitigation: session invalidation is database-current, the outbox is committed atomically, consumers are idempotent, and propagation plus projection lag are measured separately.

## Platform Impact

- Domains affected: none; Platform Identity and Platform Audit only.
- Shared engines affected: Event Backbone envelope and outbox.
- APIs and events: Audit record schema gains scope; `platform.session.revoked.v1` gains its first payload schema.
- Data ownership: Better Auth through Platform Identity owns sessions; Platform Audit owns audit evidence; Event Backbone owns outbox transport.
- Security and privacy: no tenant fabrication; global identity identifiers are minimized, restricted, retained, and transformable.
- Entitlements and billing: none.
- UX and accessibility: session-management clients receive safe summaries only.
- Mobile and offline behavior: revocation is online-only; offline authority remains a separately expiring signed lease.
- AI behavior: no AI authority or bypass.
- Operations and observability: measure database-current revocation propagation and Audit projection lag; alert on invalid-scope rejection.

## Migration and Rollback

WS1 is pre-production. Migrate the outbox to `scope_type`, nullable `tenant_id`, and non-null `scope_key`; backfill existing rows as Tenant-scoped with `scope_key = tenant_id`; then enforce discriminator constraints and new idempotency indexes. Existing producers add explicit Tenant scope before the migration gate passes.

Rollback restores the prior outbox only while no Platform-scoped event exists. After a Platform-scoped fact is committed, rollback must preserve it in a quarantine export and stop session-revocation writes rather than inventing a tenant.

## Validation

- Contract tests accept valid Tenant and Platform cases and reject missing, mixed, synthetic, or subordinate Platform scope.
- Every existing producer emits explicit Tenant scope.
- A session revoke atomically removes the owned session, records the command receipt, and appends one Platform-scoped event under retries and concurrency.
- Another account cannot list or revoke the session.
- Database-current authorization rejects the revoked session immediately; measured p95 is at most 60 seconds under the prototype load profile.
- Tenant Audit queries never return Platform records or another tenant's records.
- Redaction, integrity-chain tamper detection, retention/legal-hold behavior, privacy pseudonym overlays, and audit-of-audit-access tests pass.
- Bun and Node critical-path checks, PostgreSQL integration tests, documentation validation, registries, and generated contracts are green.

## References

- PDA-FND-002 — Platform Constitution, Articles III, VII, IX, and X
- PDA-PLT-003 — Identity and Authentication
- PDA-PLT-007 — Audit and Activity
- PDA-PLT-008 — Event Backbone
- PDA-PLT-020 — Better Auth Identity Architecture
- PDA-ARC-005 — Event Standards
- PDA-SEC-002 — Privacy Rights and Retention
- PDA-RDM-008 — WS1 Implementation Plan
- `openapi/first-slice-v1.yaml`
- `schemas/events/event-envelope-v1.schema.json`

## WS1 Prototype Evidence

PDA-IMPL-005 records explicit Tenant versus Platform discriminator constraints, account-owned session listing/revocation, atomic session deletion plus command receipt plus one Platform-scoped outbox fact, retry idempotency, cross-account denial, tenant Audit exclusion of Platform records, redaction, integrity-chain checks, legal hold/privacy overlays, and Bun/Node/PostgreSQL verification. The 40-sample independent HTTP run recorded a 7.779 ms commit-to-401 p95 against the 60-second prototype budget.

Independent Claude Code review remains intentionally deferred to the exact merged WS1 PR1-PR9 audit under RR-011. Architecture, Security, and Privacy production acceptance therefore remain open and the ADR remains Proposed.

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Codex | Architecture, security, privacy consistency | Proposed for controlled prototype | 2026-07-13 | Identified the forced-tenant contradiction while implementing WS1 PR7 and selected explicit discriminated scope after repository-wide audit. Independent Claude Code review is deferred to the consolidated WS1 review requested by the repository owner. |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.1 | 2026-07-14 | Platform Design Authority | Linked WS1 scope, Audit, idempotency, and measured revocation evidence; lifecycle and independent/production review gates remain open. |
| 0.1.0 | 2026-07-13 | Platform Design Authority | Initial proposal for explicit Tenant versus Platform scope and account-session revocation evidence. |
