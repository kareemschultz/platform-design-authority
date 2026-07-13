---
document_id: PDA-RDM-008
title: "WS1 Implementation Plan: Identity, Tenancy, Party, Authorization"
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0007, ADR-0020]
---

# WS1 Implementation Plan: Identity, Tenancy, Party, Authorization

## 1. Purpose and Position

This document expands `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) §5 "WS1 — Identity, Tenancy, Party, Authorization (P1)" into a decision-complete implementation plan: package boundaries, data model, contract surface, PR sequence, seed data, and exit gate. It sits under PDA-RDM-007 and does not override it; where the two conflict, PDA-RDM-007 wins. It is written against the verified repository state as of `4f7a08e` (WS0 complete, main green on five gates).

**WS1 is the first real end-to-end platform prototype, not "add auth."** Its purpose is to prove the platform can safely and verifiably answer: *who is this person, which tenant and organization are they acting in, what are they allowed to do, what are they entitled to access, and can every decision be audited?* Every subsequent workstream (WS2 onward) is allowed to assume tenant context, identity, permissions, entitlements, Party linkage, audit, and navigation already work — WS1 is where that assumption is earned, not asserted.

## 2. Standing precondition: close TD-007 before domain work begins

`registry/architecture-rules.json`'s `exceptions[]` entry `platform-clients-api-client-server-type-import` records that `packages/platform-clients/api-client` currently re-exports `AppRouterClient` directly from `apps/server/src/router.ts` — a type-only import that crosses the `applications` → `platform-clients` boundary in the wrong direction. Its own expiry condition is "closes when WS1 lands a contract-first oRPC setup; must close before WS2 begins." **This is WS1's first PR (WS1.0 / PR1), not its last** — deferring it to the end of WS1 (as an earlier draft of this plan did) risks every subsequent WS1 package being built against the router-coupled client shape, making the eventual fix a rewrite instead of a clean extraction.

WS1.0 scope:
- Extract transport-neutral procedure contracts (input/output schemas, not handler implementations) out of `apps/server` into a new package. Candidate name — confirm against `registry/architecture-rules.json`'s registered families before creating it: `packages/contracts/platform-api` (family `contracts`, matching the existing `packages/contracts/{api,permissions}` pattern) is preferred over `packages/platform/contracts` because the `platform` family's `may_depend_on` (`foundation`, `contracts`, `tooling`) does not include itself — a `platform/contracts` package would be an immediate sibling-import trap for every other `platform/*` package that needs it.
- Derive `packages/platform-clients/api-client`'s exported client type from the new contracts package instead of from `apps/server/src/router.ts`.
- Remove the direct `apps/server` type import from `platform-clients/api-client`.
- Delete the `exceptions[]` entry once the import is gone (do not leave a stale exception on the books).
- Add an architecture-rules regression check (see §9, DoD item) so this specific violation class cannot silently reappear.

## 3. Verified package architecture (WS1.1–WS1.6)

**Constraint governing every package below:** `registry/architecture-rules.json` gives `platform`'s `may_depend_on` as `["foundation","contracts","tooling"]` — not `platform` itself. `platform/tenancy`, `platform/authorization`, `platform/entitlements`, `platform/audit`, and the existing `platform/identity` are siblings that must never import one another. `domains`'s grant includes the whole `platform` family, so `domains/party` is the only package below allowed a direct import of `platform/tenancy`. `applications`'s grant does **not** currently include `platform` even though `apps/server/src/{index.ts,node.ts,context.ts}` already import `@meridian/platform-identity` today (grep-confirmed) — this gap has no enforcement yet (`validate_docs.py`'s `validate_architecture_rules()` only checks the registry file's internal consistency, not real imports). **Action in WS1.0/WS1.1:** add `platform` and `domains` to `applications`'s `may_depend_on`, and introduce `apps/server/composition/` (matching the registered `composition_roots` glob) as the *only* module allowed to import all five new packages plus `platform/identity` — ordinary `apps/server/src/procedures.ts` code only ever sees `context.services.*`.

| Package | Owns (Postgres schema) | Depends on |
|---|---|---|
| `platform/tenancy` | `tenant`, `organization`, `legal_entity`, `business_unit`, `branch`, `location`, `tenant_membership`, `role`, `role_assignment`, `delegation` — schema `tenancy` | `foundation`, `contracts`, `tooling` |
| `platform/identity` (existing) | Better Auth core tables — schema `public`; ACL barrel exports only `auth`/`closeDb` (verified: `packages/platform/identity/src/index.ts`) | `foundation`, `tooling` |
| `platform/authorization` | none — pure decision function, no DB adapter | `foundation`, `contracts` |
| `platform/entitlements` | `entitlement` — schema `entitlements` | `foundation`, `contracts`, `tooling` |
| `platform/audit` | `audit_record` (append-only) — schema `audit` | `foundation`, `contracts`, `tooling` |
| `domains/party` | `party`, `person`, `organization_party`, `contact_point`, `address`, `party_identifier`, `party_relationship`, `duplicate_candidate`, `merge_record`, `platform_identity_link` — schema `party` | `foundation`, `contracts`, `platform` (whole family), `tooling` |

**Shared DB pool without a sibling import:** new `packages/foundation/database` (`@meridian/foundation-database`) exports a lazy process-wide `pg.Pool` singleton (`getSharedPgPool`/`closeSharedPgPool`); every schema-owning package — including a small refactor of `platform/identity/src/db.ts`, which today constructs its own pool — calls this instead. `foundation` may depend on nothing and everything may depend on `foundation`, so this is a legal edge everywhere it's needed.

**Migration ownership:** one Postgres database (`meridian`), one logical schema and one independent Drizzle migration stream per owning package (never a new database), following `platform/identity/drizzle.config.ts`'s existing pattern plus two additions every new package's config needs: `schemaFilter: ["<its-schema>"]` and a distinct `migrations: { schema: "<its-schema>", table: "__drizzle_migrations" }`, so six packages sharing one physical database never collide on migration-tracking tables. Root `db:*` turbo scripts move from `-F @meridian/platform-identity` to unfiltered `turbo run db:generate`/`db:migrate` so one command drives all six streams.

**Open item, not silently worked around:** `docker-compose.yml`'s `postgres` service has no host port mapping (only `server`/`web` do, confirmed by reading the file). Any host-run `drizzle-kit` command, or a two-tenant-isolation test harness run outside the compose network, cannot reach it as-is. Decide before migration tooling starts in WS1.1: add a `127.0.0.1:5432:5432` mapping (recommended — simplest for solo-founder + agent workflows, Postgres stays localhost-only), or require all migration/test tooling to run via `docker compose run --rm server ...`.

**Better Auth Organization plugin — recommend NOT enabling it in WS1.** Build tenancy/org/membership/role as custom tables in `platform/tenancy` behind the ACL. `BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md` marks Organization as "Prototype/seam" depth while `registry/first-slice-tests.json` requires `platform.tenancy`/`platform.organizations` at **full** depth with all 13 test dimensions — the plugin's depth doesn't match what's needed, and enabling it creates a second, overlapping membership representation to reconcile against `platform/tenancy`'s own tables. **This is a "Constrained adopt" plugin decision — flag for founder sign-off before implementation.** Alternative: enable the plugin purely for its invitation-email UX, treating its tables as non-authoritative convenience state reconciled against `platform/tenancy`. Either way, Better Auth continues to own only authentication/session state; it never becomes the source of truth for tenancy, roles, or Party.

## 4. Core types (shared vocabulary across WS1.1–WS1.6)

```ts
// platform/tenancy — resolved once per request from the authenticated session + memberships,
// never trusted from client-supplied values.
type ActiveContext = {
  tenantId: Id<"Tenant">;
  organizationId?: Id<"Organization">;
  locationId?: Id<"Location">;
  userId: Id<"AuthUser">;   // Better Auth's user id, opaque outside platform/identity
  partyId: Id<"Party">;
};

// platform/identity's public surface — the input to authorization, never raw cookies
// or Better Auth records directly.
type AuthenticatedPrincipal = {
  authUserId: Id<"AuthUser">;
  partyId: Id<"Party">;
  sessionId: Id<"Session">;
  activeContext: ActiveContext;
};

// platform/authorization — explainable, never a bare boolean.
type AuthorizationDecision =
  | { allowed: true; permission: PermissionId; matchedAssignments: Id<"RoleAssignment">[] }
  | { allowed: false; reason: "not_authenticated" | "wrong_tenant" | "no_assignment" | "scope_mismatch" | "assignment_inactive" };

// platform/audit
type AuditRecord = {
  id: Id<"AuditRecord">;
  tenantId: Id<"Tenant">;
  actorPartyId?: Id<"Party">;
  actorUserId?: Id<"AuthUser">;
  action: string;
  targetType: string;
  targetId?: string;
  organizationId?: Id<"Organization">;
  locationId?: Id<"Location">;
  outcome: "success" | "denied" | "failure";
  reasonCode?: string;
  correlationId: string;
  occurredAt: Instant;       // packages/foundation/core time semantics
  metadata: Record<string, unknown>;
};
```

`Id<TBrand>` is `packages/foundation/core/src/id.ts`'s existing branded-UUIDv7 type — reused as-is, not reinvented. `AuthorizationDecision`'s `allowed: false` branch never carries `matchedAssignments` or role names into an ordinary user-facing error; sensitive detail stays server-side (see §8's error bridge).

`AuthorizationDecision` and entitlement checks are evaluated **independently** — "a permission does not create an entitlement, and an entitlement does not grant an actor permission" (`AUTHORIZATION_AND_POLICY.md` rule 9). Example: a user with `inventory.transfer.create` whose tenant lacks the `inventory.transfers` entitlement gets "entitlement unavailable," not "permission denied" — and the reverse (entitled tenant, unpermitted user) gets the opposite message. These are visually and semantically distinct states per `COMPONENT_CATALOG_AND_STATE_MATRIX.md`.

## 5. Contract surface (verified against the registries — do not invent ids not listed here)

**14 endpoints currently registered** in `registry/endpoint-permissions.json` that WS1 must implement for real:

| Method | Path | Authorization |
|---|---|---|
| GET | `/v1/me` | `authenticated_session` |
| POST | `/v1/session/active-context` | `authenticated_membership` |
| GET | `/v1/organizations` | `platform.organization.read` |
| GET | `/v1/entitlements` | `platform.entitlement.read` |
| GET | `/v1/users` | `platform.user.read` |
| POST | `/v1/users/invitations` | `platform.user.invite` |
| POST | `/v1/users/{userId}/suspend` | `platform.user.suspend` |
| GET | `/v1/roles` | `platform.role.read` |
| POST | `/v1/role-assignments` | `platform.role.assign` |
| GET | `/v1/audit-records` | `platform.audit.read` |
| GET | `/v1/parties` | `party.record.read` |
| POST | `/v1/parties/persons` | `party.record.create` |
| POST | `/v1/parties/organizations` | `party.record.create` |
| PATCH | `/v1/parties/{partyId}` | `party.record.update` |

**14 permission ids** in scope (`registry/permissions.json`): the 9 `platform.*`/`party.*` ids above plus `party.record.merge`, `party.identifier.read-restricted`, `platform.organization.update`. There is no dedicated `tenant.*`/`legal-entity.*`/`branch.*`/`location.*` permission id yet — only organization-level enforcement is registered, matching Prototype-1 scope.

**Gap vs. a broader session/tenancy API surface (e.g. session revocation endpoints, `GET /organizations/{id}`, a `/locations` list, `GET /parties/{id}`, a `/parties/{id}/identity-links` sub-resource, a session-list/revoke set of endpoints):** none of these are currently registered in `openapi/first-slice-v1.yaml` or `registry/endpoint-permissions.json`. WS1.1/WS1.2 need to decide, before building them, whether to add these to the registries (regenerating via `scripts/generate_registries.py` and passing `validate_docs.py`) or to fold their behavior into the existing 14 endpoints (e.g. session list/revoke as fields on `/v1/me`'s response plus new dedicated endpoints registered explicitly). **Do not implement an endpoint that isn't in the registry** — that's exactly the "contract conformance: zero undeclared drift" rule in PDA-RDM-007 §6 DoD item 3.

**Event registry:** `platform.tenant.created.v1`, `platform.tenant.suspended.v1`, `platform.organization.created.v1` already exist (`registry/events.json`, owner `TENANCY_AND_ORGANIZATIONS.md`). All ten `party.*` lifecycle events (person/organization/contact-point/address/relationship/duplicate/merge/identity-link/privacy-state) are fully registered already. **Genuinely missing and needed:** membership lifecycle events (`platform.membership.invited.v1`, `.activated.v1`, `.suspended.v1`, `.ended.v1`) and role-assignment-specific events (`platform.role-assignment.granted.v1`, `.revoked.v1` — the existing generic `platform.assignment.created.v1`, owned by `COLLABORATION_PRIMITIVES.md`, doesn't cover revocation or role-scoping). Register these in `TENANCY_AND_ORGANIZATIONS.md`'s Events section and regenerate before `platform/tenancy` emits them.

## 6. Error-taxonomy bridge and authorization/entitlement middleware

New `apps/server/composition/errors.ts`, `toORPCError(error: PlatformError): ORPCError`, mapping each of `packages/foundation/core`'s `PlatformErrorCode`s to an oRPC code/status (`validation`→400, `authentication`→401, `authorization`→403, `entitlement`→403 with a distinct custom code `ENTITLEMENT_REQUIRED` so clients can special-case "upgrade" UX vs. plain denial, `not-found`→404, `conflict`→409, `idempotency-replay`→409 with a distinct custom code, `rate-limited`→429, `provider-uncertain`→502 custom code, `internal`→500). `error.details` is never forwarded to the client — logged server-side only, extending the existing `onError` interceptor in `apps/server/src/index.ts`.

Two independently-composable oRPC middlewares in `apps/server/composition/middleware.ts`, both built on a shared `requireMembership` base that resolves and re-verifies the actor's active tenant membership on every request (the session's cached `activeTenantId` hint is never trusted standalone):

```ts
export const requirePermission = (permissionId: PermissionId) => /* ... */;
export const requireEntitlement = (capabilityId: CapabilityId) => /* ... */;
```

A procedure declares both independently where applicable — neither informs the other. Enforcement is layered, not single-point: procedure middleware, application-command boundary, repository tenant filter, and direct-API-call tests all independently reject an unauthorized action; the UI may additionally hide unavailable actions, but hiding is never the only enforcement (§7's exit gate makes this a hard requirement, not an aspiration).

## 7. Thin application shell (Prototype-1 depth, not full UX)

Current state (confirmed by prior exploration): no `middleware.ts`, no dashboard layout/sidebar, native app has zero auth code. WS1's shell proves the backend works for a real user — it is not a polished ERP UI. Minimum scope:

- Login (already exists) → tenant-context resolution via `POST /v1/session/active-context`.
- Application shell with a visible tenant/organization switcher (functionally changes context, not just a UI toggle).
- Primary navigation: `Home`, `Administration` (with `Users`, `Roles`, `Entitlements`, `Sessions`, `Audit` underneath) — start small; do not expose empty future workspaces merely because they appear in the capability registry.
- Party identity summary on the user's profile.
- Distinct, non-conflatable "Permission denied" vs. "Entitlement unavailable" states per `COMPONENT_CATALOG_AND_STATE_MATRIX.md`.
- Session revocation produces a clear, non-alarming re-authentication path, not a silent failure.
- Responsive (narrow mobile through wide desktop), basic keyboard/screen-reader navigation, ≤2 persistent navigation levels, predictable URLs and back behavior, per `FIRST_SLICE_UX_AND_ACCESSIBILITY.md` and `NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`.
- Native app stays out of WS1 scope (zero auth code today; native auth remains behind RR-001).

**Component sourcing:** official shadcn primitives (Button, Input, Form, Dialog, Dropdown, Tabs, Alert, Table, Pagination, Sheet, Skeleton, empty-state) per `COMPONENT_ACQUISITION_POLICY.md`'s source priority. At most one Shadcn Studio application-shell candidate as layout inspiration only — decomposed and normalized per `COMPONENT_NORMALIZATION_STANDARD.md` (replace primitives with `@meridian/ui-web`, strip example nav/branding, wire real tenant context and permission behavior) — never imported as a whole block.

## 8. PR sequence

Each PR gate-green before the next starts, per `WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md` (one issue, one branch, one worktree, one PR).

1. **PR1 — Contract-first API boundary, close TD-007** (§2). `feat(ws1): establish contract-first platform API boundary`. Includes: new contracts package, generated-client update, `applications`/`domains` architecture-rules fix, removed server type import, `exceptions[]` entry deleted, `foundation/database` shared-pool package (and `platform/identity`'s refactor to use it), missing membership/role-assignment event registrations.
2. **PR2 — Tenancy and active context.** `feat(ws1): add tenant organization and active-context foundation`. `platform/tenancy` schema + migration stream, `resolveActiveMembership`/`listEffectivePermissionIds`, `ActiveContext` resolution, `GET /v1/me` + `POST /v1/session/active-context` + `GET /v1/organizations`, two-tenant-isolation fixtures and tests.
3. **PR3 — Party and identity linkage.** `feat(ws1): add Party identity linkage boundary`. `domains/party` schema, `PlatformIdentityLink`, the four party endpoints, provisioning flow, events.
4. **PR4 — Authorization.** `feat(ws1): enforce scoped role-based authorization`. `platform/authorization`, `GET /v1/roles` + `POST /v1/role-assignments`, the `requirePermission` middleware, direct-API-call denial tests, tenant/organization scoping.
5. **PR5 — Entitlements.** `feat(ws1): add capability entitlement evaluation`. `platform/entitlements`, `GET /v1/entitlements`, the `requireEntitlement` middleware, authorization/entitlement-separation tests (§4), prototype seed grants — no billing implementation.
6. **PR6 — Audit and session revocation.** `feat(ws1): add audit records and session revocation`. `platform/audit`, `GET /v1/audit-records`, session list/revoke on `platform/identity`, deny-outcome auto-recording wired into PR4/PR5's middleware, revocation-propagation measurement against the ≤60s p95 budget (`FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md` line 159).
7. **PR7 — Thin experience shell.** `feat(ws1): deliver identity and tenant context experience shell` (§7).
8. **PR8 — WS1 verification closeout.** `test(ws1): complete prototype one isolation and fallback evidence`. Two-tenant acceptance scenario, Bun + Node fallback critical suites, contract-conformance diff, accessibility checks, performance evidence, Architecture Risk Register + `FIRST_SLICE_IMPLEMENTATION_PLAN.md` status updates, `TECHNOLOGY_LIFECYCLE_AND_LESSONS.md` entry.

## 9. Seed data and required test scenarios

Two synthetic tenants, matching the existing `"Demerara Retail Test Group"`-style fixture pattern:

```text
Tenant A: Georgetown Retail Demo
  Organization: Georgetown Retail Ltd.
  Locations: Main Street Store, Warehouse
  Users: Owner A, Administrator A, Cashier A, Inventory Clerk A

Tenant B: Essequibo Retail Demo
  Organization: Essequibo Retail Ltd.
  Location: Anna Regina Store
  Users: Owner B
```

Required tenant-isolation tests (the `tenant_isolation` dimension, required at full depth for `platform.identity`/`tenancy`/`organizations`/`authorization`/`entitlements`/`audit` and at prototype depth for `party.records` — all 13 dimensions listed as required in `registry/first-slice-tests.json`, a large surface to plan for explicitly rather than discover at M1):

- A user from Tenant A cannot resolve a Tenant B context; client-supplied tenant-id manipulation is rejected server-side.
- Organization selection must belong to the active tenant; location selection must belong to the organization.
- A disabled/suspended membership blocks context selection.
- Active-context change is audited.
- Context survives a valid session refresh but not session revocation.
- Cashier A cannot enter Administration; Administrator A cannot access Tenant B; Owner A can switch locations only within Tenant A.
- A revoked Cashier A session loses access within the ≤60s p95 budget.
- Removing an entitlement hides a capability without rewriting permissions; removing a role denies the action even while the tenant remains entitled (proves §4's independence rule empirically, not just by code review).

This test suite needs the Postgres host-port decision (§3) resolved first, since it needs direct host-side seeding/teardown between runs unless run inside the compose network.

## 10. WS1 exit gate

Do not close WS1 (M1) until every item below is demonstrated with evidence, not asserted:

- Two-tenant isolation (§9) proven, including denial at the API layer directly, not just hidden in the UI.
- Better Auth remains behind `platform/identity`'s ACL; no domain package touches its tables.
- Auth user and Party are separate; a Party can exist without a login, and a login can be disabled without deleting Party history.
- Active context is server-resolved and re-verified per request, never trusted from a client-supplied value.
- Permissions are enforced server-side independent of UI visibility.
- Entitlements are evaluated independently of permissions (§4, §9's last bullet).
- Role and membership changes affect active access without requiring re-login.
- Session revocation reaches enforcement within the ≤60s p95 budget, measured.
- Audit records exist for every consequential identity/access change (login, logout, revocation, context change, invitation, membership grant/removal, role assignment/removal, entitlement change, identity-link change, sensitive-action denial).
- The thin shell (§7) is real, responsive, and accessible — not stubbed.
- "Permission denied" and "Entitlement unavailable" are visibly and semantically distinct states.
- Bun and Node fallback critical suites both pass (ADR-0020).
- TD-007 is closed (§2) — verified gone from `registry/architecture-rules.json`'s `exceptions[]`, not just declared closed in prose.
- All docs, contracts, registries, migrations, tests, and CI gates are green.

This satisfies `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) §5 WS1's Exit criteria and §6 Definition of Done in full; that document remains authoritative on scope and change control.
