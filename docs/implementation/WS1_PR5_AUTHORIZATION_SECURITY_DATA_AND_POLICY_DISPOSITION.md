---
document_id: PDA-IMPL-003
title: WS1 PR5 Authorization Security, Data, and Policy Disposition
version: 0.1.2
status: Draft
owner: Platform Tenancy and Platform Authorization
last_reviewed: 2026-07-14
related_adrs: [ADR-0002, ADR-0003, ADR-0016, ADR-0020, ADR-0027]
review_evidence: []
---

# WS1 PR5 Authorization Security, Data, and Policy Disposition

## Purpose and lifecycle

Record the ownership, scope, policy, security, persistence, migration, privacy, and evidence disposition for the PDA-RDM-008 PR5 controlled prototype. This document does not promote PDA-PLT-004 or PDA-PLT-027 beyond Draft, accept ADR-0027 for production, or claim pilot or production readiness.

Canonical capability `platform.authorization` is implemented by the runtime-neutral `@meridian/platform-authorization` evaluator. Platform Tenancy remains the authoritative owner of roles, role assignments, delegations, memberships, and active context. Better Auth authenticates the principal and session but its Admin or Organization roles grant no canonical permission.

## Decision and enforcement model

Each decision reloads the session-bound active context, current membership state, role, assignment, and selected delegation through an injected current-authority port. Durable session claims, UI state, Better Auth roles, cached projections, events, and prior decisions never grant current business authority.

The evaluator is deny-by-default and returns the governed `AuthorizationDecision` union. It distinguishes missing authority, inactive assignment or membership, scope mismatch, and tenant/context substitution. Injected policy rules can preserve `require_approval`, `require_step_up`, `allow_masked`, `allow_with_limit`, `allow_read_only`, and policy denial without flattening them to a boolean. The PR5 live composition has no invented stored policy-rule table: role and delegation grants produce ordinary allow/deny decisions; later risk, approval, and field-policy implementations bind through the published policy seam.

Enforcement is layered:

- oRPC procedures require the authenticated session, revalidated active context, and canonical permission before dispatch;
- Platform Tenancy and Party application services independently call the permission port, so direct application calls cannot bypass policy;
- tenant-scoped repositories require the authoritative tenant key and expose no unrestricted role, assignment, or delegation query;
- conditional outcomes fail closed until a handler implements the required approval, assurance, masking, limit, or read-only behavior.

`GET /v1/organizations` was registered as permissioned but lacked the active-context input needed for scoped evaluation. PR5 corrects the canonical OpenAPI and executable contract to require `X-Active-Context-Id`; tenant authority is never accepted as a body or ad hoc tenant-header claim.

## Authoritative table controls

| Table | Owner | Tenant scope | Classification | Retention and erasure | Offline | Audit/event implication |
|---|---|---|---|---|---|---|
| `platform_role` | Platform Tenancy | `tenant_id NOT NULL`; tenant/id and tenant/name uniqueness | Confidential | retain role versions through the tenant security-evidence period; deactivate instead of identifier reuse | signed read-only projection may be considered by WS5 | role-definition mutation is not exposed in PR5 and no unregistered event is invented |
| `platform_role_assignment` | Platform Tenancy | `tenant_id NOT NULL`; composite tenant FKs to membership and role | Confidential | retain grant/revoke/expiry history as access-control evidence; user privacy transformation preserves the security fact while pseudonymizing governed actor links | no authoritative offline mutation | grant emits `platform.role-assignment.granted.v1`; revoke remains a registered future command |
| `platform_delegation` | Platform Tenancy | `tenant_id NOT NULL`; composite tenant FKs to delegator and delegate memberships | Confidential; reason may contain sensitive administrative context | retain through expiry/revocation plus the governed security-evidence period; do not cascade-delete with a Party request | no authoritative offline mutation; a future signed lease may carry a bounded projection | PR5 is a read/evaluation seam only; creation, revocation, break-glass, and their audit/event commands remain deferred |
| `platform_tenancy_command_receipt` extension | Platform Tenancy | existing tenant/operation/idempotency primary key | Confidential | role-assignment receipts follow the retry and security-evidence retention policy and contain identifiers plus a request fingerprint, not permission lists or delegation reasons | online only | makes assignment grant and its outbox fact atomic and replay-safe |

Every new child table has tenant-preserving composite constraints. The active-context delegation reference also uses tenant plus delegation ID, preventing a context from selecting another tenant's delegation.

## Scope, assignment, and delegation behavior

Tenant scope carries no foreign scope identifier. Organization and Location scopes must resolve inside the target membership's tenant and organization. Legal-entity and Branch scopes remain explicit fail-closed seams until their authoritative records exist; PR5 does not accept unvalidated identifiers. Current time, role state, assignment state, membership state, start, expiry, active context, and selected delegation are evaluated on every call.

Administrative mutations bind authority to the affected resource rather than checking only the permission name. Role assignment requires both authority over the target membership's organization and authority over the requested grant scope; an organization-scoped administrator therefore cannot grant tenant scope or reach a sibling organization. Membership suspension evaluates `platform.user.suspend` against the target membership's organization. Organization listing carries the server-derived tenant into the repository and cannot enumerate another tenant's memberships. These controls are covered by direct-call and PostgreSQL negative tests.

A selected delegation replaces ordinary assignment authority for that context and must match the current tenant, delegate membership, canonical permission, scope, start, expiry, and active state. PR5 does not expose delegation creation or further delegation. Support access, break-glass, reason approval, and enhanced audit remain blocked on their governed commands and PR7 audit storage.

## Atomicity, idempotency, and privacy

`POST /v1/role-assignments` claims a tenant-scoped command receipt before mutation. Concurrent retries with the same key and request fingerprint serialize on that receipt, return one assignment, update the membership's assignment references once, and publish one privacy-safe outbox event in the same owner transaction. Reusing the key for different command content conflicts. The canonical event contains assignment, membership, role, scope, and dates; it omits the role permission set, user contact data, credentials, tokens, and administrative free text.

## PostgreSQL RLS disposition

RLS remains **deferred for the controlled prototype, not rejected**, under the bounded rationale in PDA-IMPL-002 and PDA-DAT-017. The local and CI application still connect with the PostgreSQL owner role; a text-only policy would be bypassed and would create false evidence. Prototype compensating controls are mandatory tenant columns, composite tenant FKs, server-derived context, tenant-filtered repositories, current-state evaluation, two-tenant negative tests, migration freshness, and architecture enforcement.

Pilot and production remain blocked until Security and Data Platform approve separate migration/application roles, pool/session tenant-context set/reset behavior, bypass and break-glass policy, background-job behavior, restore behavior, and executable RLS denial tests through the non-owner application role.

## Executable evidence and bounded gaps

- `packages/platform/authorization/src/index.test.ts` proves deny-by-default behavior, current assignment and scope matching, inactive-state denial, delegation expiry, conditional outcomes, and per-call invalidation.
- `packages/platform/tenancy/src/index.test.ts` proves role-assignment idempotency, command substitution denial, and privacy-safe canonical event output.
- `packages/domains/party/src/index.test.ts` proves direct application calls fail before Party repository dispatch.
- `apps/server/src/router.test.ts` proves role endpoint coverage and procedure denial before application dispatch.
- `apps/server/composition/persistence.integration.test.ts` proves migration/repeat behavior, two-tenant role isolation, current-state re-evaluation, concurrent assignment idempotency, owner-state/outbox atomicity, and cross-tenant identifier denial on PostgreSQL 18.4.
- The approved Node fallback verifies the expanded owner migration stream. Registry, contract, architecture, secret, dependency, image, and live-stack gates remain mandatory in CI.

PR6 is now implemented at controlled-prototype depth under PDA-IMPL-004; permission allow never implies entitlement. PR7 implements authoritative audit storage, audit-of-access, assignment/delegation administrative audit, entitlement change projection, and measured session revocation. PR8 renders conditional/denial states. PR9 owns performance, capacity, recovery, full Bun/Node critical coverage, and consolidated evidence closeout. Role definition mutation, assignment revocation API, delegation commands, segregation-of-duties workflow, stored policy administration, and database RLS remain explicit future work rather than hidden grants.

## Governing sources

- PDA-PLT-004, PDA-PLT-020, PDA-PLT-027
- PDA-RDM-008
- ADR-0002, ADR-0003, ADR-0016, ADR-0020, ADR-0027
- PDA-ENGR-012, PDA-ENGR-014
- PDA-IMPL-002, PDA-IMPL-004, PDA-DAT-017
- `registry/permissions.json`, `registry/endpoint-permissions.json`, `registry/events.json`, `registry/capabilities.json`, `registry/architecture-rules.json`
