---
document_id: PDA-RDM-008
title: "WS1 Implementation Plan: Identity, Tenancy, Party, Authorization"
version: 0.7.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0002, ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0016, ADR-0020, ADR-0027, ADR-0028]
---

# WS1 Implementation Plan: Identity, Tenancy, Party, Authorization

## 1. Purpose, Authority, and Lifecycle

This document expands `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) §5 "WS1 — Identity, Tenancy, Party, Authorization (P1)" into an implementation-control plan. It maps owners, capability depth, contracts, packages, pull requests, evidence, and unresolved architecture gates. It does not override higher-authority material. Where this document conflicts with the Constitution, an ADR, PDA-RDM-003, PDA-RDM-004, PDA-RDM-007, or another governing specification, the higher-authority source wins and WS1 stops until the conflict is dispositioned.

This is a **Draft plan for a controlled prototype**, not production authority. It must not be described as decision-complete while any gate in §3 remains open. Closing WS1 demonstrates Technical Prototype 1 and its declared evidence; it does not promote a capability, ADR, or specification beyond its recorded lifecycle. In particular, ADR-0007 (Party and Relationship model) is `Proposed`, not `Accepted`: WS1 *exercises* it at prototype depth and surfaces implementation evidence for its eventual ratification review, but building `domains/party` here does not ratify ADR-0007.

### 1.1 Governing sources

| Concern | Governing source |
|---|---|
| First-slice scope and depth | PDA-RDM-003, `registry/first-slice.json`, PDA-RDM-004, PDA-RDM-007 |
| Modular boundaries and persistence | ADR-0002, ADR-0003, ADR-0027, PDA-ENGR-012, `registry/architecture-rules.json` |
| Runtime and contract authority | ADR-0020, `openapi/first-slice-v1.yaml`, JSON Schemas |
| Identity and plugin composition | ADR-0006, PDA-PLT-003, PDA-PLT-020, PDA-PLT-028 |
| Party and identity links | ADR-0007, PDA-PLT-021 |
| Authorization and entitlements | PDA-PLT-004, PDA-PLT-005, permission and capability registries |
| Audit, privacy, and classification | ADR-0014, PDA-PLT-007, PDA-DAT-010 |
| Events and reliable publication | ADR-0016, PDA-ARC-005, PDA-PLT-008 |
| Tenant isolation and threat model | PDA-SEC-011 |
| Test evidence | PDA-TST-013, `registry/first-slice-tests.json`, PDA-RDM-006 |
| Technology evidence | PDA-ENGR-013 and the exact implementation lock |
| Work and release coordination | PDA-ENGR-014 |
| Founder scope authority | FDR-004; first-slice ratification remains open |

### 1.2 Capability disposition

| Capability | First-slice depth | WS1 responsibility |
|---|---:|---|
| `platform.tenancy` | full | tenant membership and governed context resolution |
| `platform.organizations` | full | organization and location context required by Prototype 1 |
| `platform.authentication` | full | Better Auth boundary, account/session lifecycle, and the adopted Two-Factor and Passkey baseline |
| `platform.identity` | full | principal resolution, Party linkage, user administration, and session revocation |
| `platform.authorization` | full | current scoped policy decision and canonical permission enforcement |
| `platform.entitlements` | full | effective capability evaluation independent of permissions |
| `platform.audit` | full | tamper-resistant, privacy-safe access and identity evidence |
| `platform.events` | full | minimum transactional outbox required by WS1 state changes |
| `platform.administration` | full | real tenant-administration contract and thin-shell proof across WS1 owners |
| `party.records` | prototype | Person/Organization Party and authentication identity-link proof |
| `security.tenant-isolation` | full | cross-tenant denial across current context, persistence, events, Audit, and UI state |

All thirteen test dimensions remain required at the depth recorded in `registry/first-slice-tests.json`. A pull request may prove only part of a capability, but WS1 may not claim that capability's depth is complete until all required evidence is linked.

## 2. Review Disposition

The 2026-07-13 independent consistency review was verified against the current branch and is accepted as follows.

| Finding | Disposition | Severity | Required closure | Owner | Timing |
|---|---|---:|---|---|---|
| Global `foundation/database` singleton conflicts with runtime-neutral and composition-root rules | Accepted → **Proposed resolution in ADR-0027 v0.2.1** | Critical | Owner-specific Persistence packages; no embedded adapter in runtime-neutral core; composition-root injection; serial migrations; required ADR reviews complete | Platform Architecture | Before PR2 |
| Whole-family `applications -> platform/domains` grant is broader than the composition-root rule | Accepted | Critical | Keep family grant narrow; add path-aware composition-root enforcement and negative import tests | Platform Architecture | PR1 |
| Canonical OpenAPI payloads and session operations are incomplete | Accepted | Critical | Complete request, response, error, pagination, idempotency, and session contracts before handlers | API Platform | PR1 |
| User invitation and suspension lifecycle is ambiguous across Identity, Tenancy, and Party | Accepted | Critical | Define command owner, tenant/global scope, state machine, idempotency, failure recovery, session effects, audit, and events | Identity/Tenancy/Party | PR1 |
| New events have no payload schemas or WS1 outbox | Accepted | Critical | Add schemas and minimum transactional outbox before any producer emits them | Event Backbone | PR1–PR2 |
| "Full DoD" was claimed without a capability-by-dimension evidence map | Accepted | High | Add §11 matrix and retain evidence status until executable proof exists | Test Engineering | Before WS1 close |
| `AuthorizationDecision`, `AuthenticatedPrincipal`, and `AuditRecord` were under-specified | Accepted | High | Align shared contracts with governing specifications and OpenAPI nullability | Authorization/Audit/Identity | PR1 |
| Tenant isolation lacked schema, threat-model, and classification controls | Accepted | High | Add data-flow/abuse review, tenant constraints, RLS disposition, and classification evidence | Security/Data | Before migrations |
| Migration streams lacked ordering, rollback, and exact-version evidence | Accepted | High | Serialize migration execution and prove clean, upgrade, failure, and recovery paths | Platform Engineering | PR2 |
| Better Auth Organization choice was routed as informal founder sign-off | Accepted → **Selection recorded; implementation closure remains in PR1** | High | Adopt the complete ADR-0006 baseline behind Platform Identity; exact routes/options/schema/evidence recorded in PR1; Platform Tenancy remains mutation authority | Platform Identity/PDA | PR1 |

Architecture closure in this plan does not substitute for implementation tests. Founder, legal, provider, customer, pilot, and production evidence remains open where recorded elsewhere.

## 3. Mandatory Pre-Implementation Gates

PR1 is a governance-and-contract pull request. No schema-owning WS1 package begins implementation until every gate below is either closed or recorded as an approved, expiring exception.

### G1 — Close TD-007 without creating a second contract authority

- Complete the canonical OpenAPI request/response/error schemas for all WS1 operations before deriving procedure contracts.
- Add or explicitly defer canonical session-list and session-revoke operations; do not hide a session collection inside `/v1/me` merely to avoid registering the resource.
- Implement transport-neutral oRPC contracts in `packages/contracts/platform-api` only after the OpenAPI change is reviewed.
- Maintain a semantic-parity test from the governed OpenAPI to the oRPC surface; the beta OpenAPI-to-oRPC generator remains evaluation-only under ADR-0020.
- Derive `packages/platform-clients/api-client` from the contract package, remove the `apps/server/src/router.ts` import, and delete the TD-007 exception only after the import-graph test passes.

### G2 — Preserve composition-root-only concrete binding

- Do **not** add `platform` or `domains` to the whole `applications.may_depend_on` grant.
- Extend the architecture test to recognize only registered composition-root paths such as `apps/server/composition/**` as concrete binding locations.
- Ordinary routes, procedures, and application code receive `context.services.*` interfaces and cannot import a concrete domain, platform implementation, repository, schema, or migration.
- Update PDA-ENGR-012 and `registry/architecture-rules.json` together if the machine rule needs a narrower representation.

### G3 — Decide and govern the persistence adapter boundary

**Proposed resolution: ADR-0027 v0.2.1.** Codex and Claude Code concur on the architecture; the ADR's specialist Platform Architecture, Data Platform, and Security rows must still be complete before PR2 merges. `packages/foundation/database` and embedded adapters in runtime-neutral owner packages are prohibited. ADR-0027 adopts owner-specific Persistence packages with composition-root injection:

- domain/platform core, application, contract, and authorization code depend on repository or unit-of-work interfaces only;
- concrete PostgreSQL/Drizzle adapters and migration artifacts live under `packages/persistence/*`, one package per authoritative owner/backend; location does not transfer table or migration ownership;
- `apps/server/composition/**` reads validated environment configuration, creates the single process pool, supplies transaction-capable adapters, and owns graceful shutdown;
- application commands own transaction boundaries; the composition root binds the coordinator, and state-plus-outbox atomicity cannot become unrestricted cross-module table mutation;
- no Persistence or core package creates a pool, locates a global connection, or reads `process.env`/`@meridian/tooling-env` for a connection — this includes retrofitting today's self-constructed pool in `platform/identity/src/db.ts` (WS1 PR2);
- migrations run through a deterministic serial orchestrator, not a bare `turbo run db:migrate`.

### G4 — Resolve exact Better Auth composition

PDA-PLT-028 remains deny-by-default. PR1 records the exact Better Auth package/version composition, schema and endpoint diff, secrets, hooks, data flows, rollback, and Bun/Node tests.

**Architecture selection recorded; PR1 evidence gate remains open.** WS1 adopts the complete ADR-0006 (`:56`) baseline without amending it: database-backed sessions, email/password + account lifecycle, Two-Factor, Passkey, constrained Admin, constrained Organization, and test-only Test Utils. ADR-0006 and PDA-PLT-028 are both pre-acceptance material, so they guide this named controlled prototype but do not authorize production. PR1 must turn this selection into an exact implementation manifest rather than treating the table below as closure.

| Baseline feature | WS1 posture | Authoritative-state rule |
|---|---|---|
| Email/password + account lifecycle | already enabled; extend with lifecycle hooks | Platform Identity owns auth accounts/sessions |
| Database-backed sessions | already enabled | session revocation ≤60s p95 (§11) |
| Two-Factor Authentication | enable for the full-prototype baseline | prove enrollment verification, encrypted secrets, backup-code lifecycle, lockout, trusted-device/recovery policy, and step-up mapping |
| Passkey | enable for the full-prototype baseline | prove RP ID/origin policy, user verification, inventory/revocation, recovery, account linking, and assurance mapping |
| Constrained Admin | enable only through platform policy wrappers | Better Auth default roles grant no canonical authority; enumerate and disable or intercept every native mutation route that lacks platform permission, scope, recent-authentication, reason, approval, impersonation visibility, and audit controls |
| Constrained Organization | enable only as an authentication projection and active-context aid | **Platform Tenancy is the mutation authority**; Platform commands commit authoritative organization/membership/invitation state first, then an idempotent adapter/outbox flow projects the minimum authentication state into Better Auth. Native plugin mutation routes are disabled or intercepted. Better Auth roles and `activeOrganizationId` never grant canonical authority, and drift is reconciled visibly. |
| Test Utils | test builds only | excluded from production bundles |

The current catalog pin is `better-auth` 1.6.23. PR1 must reverify that exact lock against official documentation, list every enabled server/client plugin, option, schema field/table, route (including `disabledPaths` or equivalent interception), hook, secret, data flow, rollback step, and Bun/Node regression test in PDA-ENGR-013. Full-depth `platform.authentication` evidence remains incomplete until both adopted factors and all required test dimensions pass.

### G5 — Define identity lifecycle orchestration

The application contract must distinguish:

- authentication-account suspension owned by Platform Identity;
- tenant-membership suspension owned by Platform Tenancy;
- session revocation owned by Platform Identity;
- Party status and identity-link lifecycle owned by Party.

`POST /v1/users/{userId}/suspend` must name which operation it performs. A tenant administrator cannot disable an authentication account across unrelated tenants without separately governed authority. Invitation and provisioning define an orchestrator, idempotency key, partial-failure states, retry/compensation, delivery behavior, audit, and transactional event publication.

### G6 — Introduce reliable event publication in WS1

- Add payload schemas for the six new membership and role-assignment events.
- Use the standard event envelope with tenant, organization, actor, source, correlation, causation, idempotency, classification, retention, and schema reference.
- Introduce the minimum `platform/events` transactional outbox in PR2; WS2 extends it rather than creating it.
- Prove state change plus outbox atomicity, duplicate delivery, consumer idempotency, tenant isolation, redaction, and recovery.

### G7 — Record security, privacy, and migration evidence

Before a migration is generated, each table declares owner, tenant scope, classification/default, retention, erasure behavior, offline eligibility, and audit implications. Tenant-owned rows use tenant-preserving uniqueness and foreign-key constraints where practical. Database roles and PostgreSQL RLS are explicitly adopted, rejected, or deferred with rationale and tests.

Migration commands execute deterministically and serially; a bare unfiltered `turbo run db:migrate` is insufficient. PR2 records exact Drizzle, `pg`, Bun, Node, and PostgreSQL locks and proves empty-database migration, representative upgrade, repeat run, failed migration recovery, rollback/forward-fix, and freshness.

## 4. Package and Ownership Plan

ADR-0027 selects owner-specific `packages/persistence/*` adapters; exact package manifests and the ADR's named reviews remain gated by G3. Core ownership is fixed:

| Core package | Authoritative behavior/data | Allowed direct dependencies |
|---|---|---|
| `platform/tenancy` | tenant hierarchy, memberships, roles, role assignments, delegations, context resolution | Foundation and published Contracts |
| `platform/identity` | Better Auth ACL, authentication accounts, sessions, factors, principal resolution | Foundation and published Contracts |
| `platform/authorization` | runtime-neutral policy evaluation; no persistence adapter | Foundation and published Contracts |
| `platform/entitlements` | effective entitlement grants, limits, state, source, dates, and change history | Foundation and published Contracts |
| `platform/audit` | append-oriented audit evidence, redaction, retention, privacy transformation | Foundation and published Contracts |
| `platform/events` | transactional outbox contract; owner-specific concrete adapter under G3 | Foundation and published Contracts |
| `domains/party` | Party, Person/Organization details, contact/address/identifier records, relationships, duplicate/merge evidence, `PlatformIdentityLink` | Foundation, published Contracts, and injected Platform contracts |

No sibling Platform implementation imports another sibling. Party consumes published tenancy/identity contracts only. Concrete adapters are bound in `apps/server/composition/**`.

## 5. Shared Contract Vocabulary

These shapes are requirements for the PR1 contract review, not permission to bypass OpenAPI or JSON Schema.

```ts
type ActiveContext = {
  contextId: Id<"ActiveContext">;
  tenantId: Id<"Tenant">;
  organizationId?: Id<"Organization">;
  legalEntityId?: Id<"LegalEntity">;
  branchId?: Id<"Branch">;
  locationId?: Id<"Location">;
  authUserId: Id<"AuthUser">;
  partyId?: Id<"Party">;
  delegationId?: Id<"Delegation">;
};

type AuthenticatedPrincipal = {
  authUserId: Id<"AuthUser">;
  sessionId: Id<"Session">;
  partyId?: Id<"Party">;
  assuranceLevel: string;
  activeContext?: ActiveContext;
};

type AuthorizationDecision =
  | { outcome: "allow"; permission: PermissionId; matchedAssignments: Id<"RoleAssignment">[] }
  | { outcome: "deny"; reason: "not_authenticated" | "wrong_tenant" | "no_assignment" | "scope_mismatch" | "assignment_inactive" | "policy_denied" }
  | { outcome: "require_approval"; policyId: string }
  | { outcome: "require_step_up"; assuranceLevel: string }
  | { outcome: "allow_masked"; permission: PermissionId; fieldPolicyId: string }
  | { outcome: "allow_with_limit"; permission: PermissionId; limitPolicyId: string }
  | { outcome: "allow_read_only"; permission: PermissionId; policyId: string };

type AuditRecord = {
  id: Id<"AuditRecord">;
  scopeType: "Tenant" | "Platform";
  tenantId?: Id<"Tenant">;
  organizationId?: Id<"Organization">;
  locationId?: Id<"Location">;
  actorType: "human" | "service" | "device" | "integration" | "automation" | "ai" | "support";
  actorPartyId?: Id<"Party">;
  actorUserId?: Id<"AuthUser">;
  originalActorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  sourceChannel: string;
  outcome: "success" | "denied" | "failure";
  reasonCode?: string;
  correlationId: string;
  causationId?: string;
  approvalId?: string;
  delegationId?: Id<"Delegation">;
  changeSummary?: Readonly<Record<string, unknown>>;
  classification: "Internal" | "Confidential" | "Restricted";
  retentionClass: string;
  privacyCaseId?: string;
  privacyTransformationVersion?: string;
  occurredAt: Instant;
  metadata: Readonly<Record<string, unknown>>;
};
```

ADR-0028 governs the narrow Platform-scoped case for account/session security evidence. Tenant APIs still require active context and return only Tenant-scoped Audit records; Platform-scoped records are not exposed through `GET /v1/audit-records`.

Authentication may exist before a Party link is provisioned, matching `CurrentIdentity.partyId` nullability. Business commands that require a Party use a separate `requirePartyLink` guard. Active context is a server-verified reference, never authority merely because the client presents it. PR1 must choose a multi-tab-safe context design; a session-global organization mutation that silently changes another tab is prohibited by PDA-PLT-020.

Permissions and entitlements remain independent. Policy outcomes are not flattened to a boolean. Audit metadata and change summaries pass classification/redaction rules before persistence.

## 6. Canonical Contract Surface

The following registered operations are mandatory. PR1 completes their schemas; later PRs implement them.

| Operation | Authority | Implementation PR |
|---|---|---:|
| `GET /v1/me` | authenticated session | PR3 |
| `POST /v1/session/active-context` | authenticated membership | PR3 |
| `GET /v1/organizations` | `platform.organization.read` | PR3 |
| `GET /v1/organizations/{organizationId}` | `platform.organization.read` | PR3 |
| `PATCH /v1/organizations/{organizationId}` | `platform.organization.update` | PR3 |
| `GET /v1/locations` | `platform.organization.read` | PR3 |
| `GET /v1/sessions` | authenticated session | PR7 |
| `DELETE /v1/sessions/{sessionId}` | authenticated session | PR7 |
| `GET /v1/users` | `platform.user.read` | PR3 |
| `POST /v1/users/invitations` | `platform.user.invite` | PR3 |
| `POST /v1/users/{userId}/suspend` | `platform.user.suspend` | PR3, after G5 |
| `GET /v1/roles` | `platform.role.read` | PR5 |
| `POST /v1/role-assignments` | `platform.role.assign` | PR5 |
| `GET /v1/entitlements` | `platform.entitlement.read` | PR6 |
| `GET /v1/audit-records` | `platform.audit.read` | PR7 |
| `GET /v1/parties` | `party.record.read` | PR4 |
| `GET /v1/parties/{partyId}` | `party.record.read` | PR4 |
| `POST /v1/parties/persons` | `party.record.create` | PR4 |
| `POST /v1/parties/organizations` | `party.record.create` | PR4 |
| `PATCH /v1/parties/{partyId}` | `party.record.update` | PR4 |
| `POST /v1/party-identity-links` | `party.record.update` | PR4 |

PR1 disposition: `platform.organization.update` is implemented by the governed `PATCH /v1/organizations/{organizationId}` contract. `party.record.merge` is deferred from WS1 because the prototype Party depth does not yet carry the duplicate-evidence, survivorship, reversal, and privacy review required for an irreversible merge command. `party.identifier.read-restricted` is deferred because WS1 adds no restricted-identifier read representation or qualified purpose policy. Both permissions remain canonical and registered; neither is granted or implied by a broader Party permission. These are permission-level deferrals and therefore do not alter capability-grained `registry/first-slice.json`.

Session list/revoke, organization detail, location list, Party detail, and identity-link operations require canonical OpenAPI registration, authorization metadata, schemas, and tests before implementation. Better Auth-native endpoints do not become public Platform API contracts automatically.

## 7. Authorization, Entitlement, Audit, and Error Enforcement

- `requireAuthentication`, `requireActiveContext`, `requirePartyLink`, `requirePermission`, and `requireEntitlement` remain independently composable.
- Current membership, role assignment, delegation, session, permission, policy, and entitlement state is re-evaluated for consequential operations.
- Enforcement exists at procedure, application-command, and tenant-scoped repository boundaries; UI visibility is advisory.
- Sensitive denial detail remains server-side. Client errors use the canonical OpenAPI error contract and safe message keys.
- Successful and denied consequential actions use a published Audit contract. Other packages never write the Audit table directly.
- Audit failure policy is declared per action class: high-risk actions fail closed unless a same-transaction durable audit/outbox record exists.
- Audit access is itself permissioned and audited; append orientation is supplemented by tamper, retention, redaction, privacy-transformation, and export tests.
- Entitlement changes use governed internal commands even when no public write endpoint exists; tests do not mutate entitlement tables directly.

## 8. Thin Experience Shell

The shell proves the platform boundary for a real user without pretending to be a complete administration product.

- Login uses the owned Platform Identity boundary.
- Tenant/organization context shows only authorized memberships and uses the multi-tab-safe design accepted in PR1.
- `Home` and `Administration` expose only implemented routes: Users, Roles, Entitlements, Sessions, and Audit.
- Party linkage is visible, including a safe onboarding state when no Party link exists.
- Permission denial, entitlement unavailability, approval required, step-up required, and revoked-session states are semantically distinct.
- Revocation produces a clear re-authentication path.
- The shell covers loading, empty, error, stale, offline/degraded, responsive, keyboard, screen-reader, zoom, and reduced-motion behavior required by the governed UX/test sources.
- Native implementation remains outside WS1; this does not waive API, mobile-session, or offline-authority seams assigned elsewhere.

## 9. Pull Request Sequence

Each pull request uses one issue, branch, worktree, owner, migration/API/security disposition, and handoff record under PDA-ENGR-014. Each is green before its dependent begins.

1. **PR1 — Governance, canonical contracts, and architecture enforcement.** Close TD-007; complete WS1 OpenAPI/error/session contracts; map every endpoint and permission; expand shared types; record identity lifecycle; resolve Better Auth composition; add event schemas; update the persistence ADR/spec; implement path-aware architecture tests. No business schema migration.
2. **PR2 — Persistence adapters, serial migration runner, and minimum outbox.** Implement the G3 boundary, process pool/composition lifecycle, module-owned migration streams, deterministic serial migration orchestration, minimum `platform/events` outbox, technology evidence, and clean/upgrade/recovery tests.
3. **PR3 — Authentication, tenancy, active context, and user administration.** Implement the governed Better Auth boundary, Two-Factor and Passkey baseline, tenancy schema, memberships, active context, the nine Identity/Tenancy administration operations assigned to PR3 in §6, invitation/suspension state machine, two-tenant tests, and events/audit.
4. **PR4 — Party and identity linkage.** Implement Party prototype schema, `PlatformIdentityLink`, six Party endpoints, onboarding/reconciliation, privacy/classification defaults, events, and tests.
5. **PR5 — Authorization.** Implement scoped policy outcomes, roles/assignments, delegation seam, permission middleware, direct-call denial tests, and current-authority invalidation.
6. **PR6 — Entitlements.** Implement grants, states, sources, dates, limits/dependencies needed by the slice, read API, internal change command, entitlement middleware, change events/audit, and permission/entitlement independence tests. No billing implementation.
7. **PR7 — Audit and session revocation.** Implement the Audit contract/storage boundary, query API, redaction/tamper/retention/privacy tests, session list/revoke contract selected in PR1, audit-of-audit-access, and measured revocation propagation.
8. **PR8 — Thin experience shell.** Implement §8 with canonical states, responsive/accessibility evidence, authorized context switching, and real API enforcement.
9. **PR9 — WS1 evidence closeout.** Run the complete §11 matrix, Bun/Node critical suites, OpenAPI parity, migration/outbox recovery, performance and accessibility checks; link evidence; update risks, technology lessons, registry evidence, and PDA-RDM-007 without overstating lifecycle.

Completion record (2026-07-14): PR1-PR9 are merged through PR #54 at `8f9d93f5d5f80b9c11a8a5c30b956bdac638a284`. PDA-IMPL-005 records the generated 11-capability/143-cell evidence result, 40-sample database and independent-HTTP revocation measurements, formal prototype accessibility disposition, runtime checks, explicit deferrals, and lifecycle boundary. PDA-REV-011/012 register and remediate the post-merge RR-011 audit under issue #56 / PR #57; exact-head-green PR #57 merge is the remaining audit-closure gate.

## 10. Canonical Synthetic Fixtures and Scenarios

Use the fixture defined by PDA-TST-013 rather than replacing it.

```text
Tenant A: Demerara Retail Test Group
  Legal entity: Demerara Retail Test Inc.
  Locations: Georgetown Main Store, East Bank Store, Offline Test Store, Central Stock Location
  Users/roles: Tenant Administrator, Privacy Administrator, Store Manager, Cashier,
               Store Associate, Inventory Clerk, Finance Reviewer, Support Operator

Tenant B: Essequibo Isolation Test Tenant
  Organization: Essequibo Isolation Test Inc.
  Location: Anna Regina Test Store
  Users: Tenant B Administrator
```

Required WS1 scenarios include:

- same-tenant happy path plus cross-tenant read/write/list/count/identifier-substitution denial;
- server derivation of tenant scope from an authenticated membership, never a trusted body/header tenant ID;
- organization/location membership validation and tenant-preserving identifiers;
- disabled membership, suspended authentication account, revoked session, expired delegation, and inactive assignment as distinct states;
- invitation retries and partial failures without duplicate user, Party, membership, link, audit, or event effects;
- tenant-scoped suspension that does not disable unrelated tenant memberships;
- active context surviving valid refresh but not revocation, with multi-tab behavior proven;
- current role, membership, delegation, policy, and entitlement changes affecting access without re-login;
- permission and entitlement independence;
- audit redaction, tamper resistance, retention, privacy transformation, tenant isolation, and audit-of-access;
- outbox atomicity, duplicate delivery, replay, recovery, and privacy-safe payloads;
- Two-Factor and Passkey enrollment/sign-in/recovery/abuse denial, assurance mapping, and Bun/Node compatibility;
- thin-shell keyboard, screen-reader, zoom, responsive, loading, empty, error, denial, and re-authentication states.

An authorized cross-tenant identity fixture may be added only after the shared-identity decision in PDA-PLT-002 is resolved. Until then, organization switching is demonstrated within Tenant A and cross-tenant selection is denied.

## 11. Evidence Matrix and Exit Gate

PR9 attaches executable evidence for every `required` cell in `registry/first-slice-tests.json` for the capabilities in §1.2:

1. happy path;
2. validation and denial;
3. tenant isolation;
4. permission and entitlement;
5. idempotency and duplicate handling;
6. concurrency and conflict;
7. events, jobs, and projections;
8. audit and observability;
9. privacy and classification;
10. offline and degraded behavior;
11. accessibility and responsive behavior;
12. performance and capacity;
13. recovery, replay, and reconciliation.

WS1 closes only when:

- G1–G7 are closed or governed exceptions remain valid and do not contradict the prototype exit;
- all operations in §6 have complete canonical contracts and assigned implementation/evidence;
- all in-scope permissions are implemented or explicitly deferred;
- Better Auth remains behind Platform Identity and domain code cannot import its persistence;
- auth accounts, Parties, memberships, domain roles, and identity links retain separate ownership and lifecycle;
- current tenant, organization, Party, permission, policy, entitlement, delegation, and session authority is enforced server-side;
- session and membership revocation meet the ≤60-second p95 budget with sensitive operations revalidated immediately where policy requires;
- every consequential identity/access action has privacy-safe, tamper-resistant audit evidence;
- the minimum outbox prevents lost or phantom events and passes replay/recovery tests;
- the shell is real, accessible, responsive, and semantically distinguishes governed states;
- Bun and the approved Node LTS run the declared critical contract, authorization, tenancy, migration, outbox, and identity suites;
- evidence paths, exact versions, unresolved risks, rollback time, and lifecycle claims are recorded;
- documentation, generated contracts, registries, migrations, tests, and all repository gates are green.

Only after those criteria are met may PDA-RDM-007 record WS1 as complete. Pilot and production readiness remain blocked by their separately named founder, customer, jurisdiction, security, accessibility, provider, and operational gates.

**PR9 disposition:** the criteria above are satisfied for the controlled prototype by PDA-IMPL-005, `evidence/first-slice/ws1-capability-evidence.json`, and the generated `registry/first-slice-tests.json`. This is a prototype workstream exit, not lifecycle promotion. The durable-delivery worker, production RLS topology, production OTP/provider path, deeper Party behavior, formal assistive-technology conformance, penetration testing, operational exercises, external evidence, and founder/ratification gates remain open exactly as recorded in PDA-IMPL-005 and the Architecture Risk Register.
