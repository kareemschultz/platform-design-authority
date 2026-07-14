---
document_id: PDA-IMPL-002
title: WS1 PR3 Tenancy Security, Data, and Authentication Disposition
version: 0.2.2
status: Draft
owner: Platform Tenancy
last_reviewed: 2026-07-14
related_adrs: [ADR-0002, ADR-0003, ADR-0006, ADR-0020, ADR-0027]
review_evidence: []
---

# WS1 PR3 Tenancy Security, Data, and Authentication Disposition

## Purpose and lifecycle

Record the pre-migration ownership, tenant-scope, classification, retention, erasure, offline, audit, threat, and PostgreSQL row-level-security disposition required by PDA-RDM-008 G4, G5, and G7 for the named controlled prototype. This evidence does not promote any Draft or Proposed source, authorize production, or close the independent security and penetration-test gates.

Canonical capability IDs are `platform.authentication`, `platform.identity`, `platform.tenancy`, and `platform.organizations`. Platform Identity owns authentication accounts, credentials, factors, sessions, and minimum Better Auth Organization projections. Platform Tenancy owns tenant hierarchy, organizations, locations, memberships, invitations, active context, and their lifecycle. Better Auth roles and projection rows never grant `platform.organization.*` or `platform.user.*` permissions.

## Authentication composition

PR3 enables only the exact PDA-IMPL-001 baseline on `better-auth@1.6.23` and `@better-auth/passkey@1.6.23`: database sessions, email/password, Two-Factor, Passkey, constrained Admin, constrained Organization, and a separately imported test-only Test Utils composition. The installed Test Utils depends on Node `node:sqlite` and Vitest lifecycle hooks, so `vitest@4.1.10` executes that isolated test lane while Bun continues to execute production identity security tests; see TECH-LESSON-035. Native Admin routes and authority-changing Organization routes remain intercepted by `isBlockedNativeAuthHttpRoute`.

Two-Factor uses verified enrollment, encrypted OTP storage, encrypted backup codes, a five-attempt OTP limit, account-wide lockout after ten failed factor checks for fifteen minutes, a ten-minute challenge cookie, and a seven-day trusted-device maximum. OTP delivery is an injected port. FDR-007 has not selected an email or SMS provider, so the production composition fails closed without logging or returning the OTP; deterministic delivery is supplied only by test composition until Communications/provider evidence exists.

Passkey RP ID and origin derive from the exact configured authentication origin; the RP display name is required configuration and never the internal codename. The locked Passkey plugin asks for user verification during registration but internally calls SimpleWebAuthn verification with `requireUserVerification: false` for both ceremonies. PR3 therefore adds an `afterVerification` guard that rejects registration or authentication unless the verified ceremony reports `userVerified: true`, before the credential or session is created. Until a session records and preserves the verified method, `/v1/me` reports `aal1`; PR3 does not falsely map every passkey-enabled account to phishing-resistant assurance.

## Authoritative table controls

| Table | Owner | Tenant scope | Classification | Retention and erasure | Offline | Audit/event implication |
|---|---|---|---|---|---|---|
| `platform_tenant` | Platform Tenancy | row is the isolation root | Confidential | retain through tenant lifecycle; archive/export/delete only through future governed tenant lifecycle | online only | creation/suspension events when those commands are implemented |
| `platform_organization` | Platform Tenancy | `tenant_id` required; composite tenant/id key available to child FKs | Confidential | retained with tenant; mutable descriptive fields follow tenant retention | read-limited projection may follow later offline policy | update is audit-relevant; no unregistered event is invented |
| `platform_location` | Platform Tenancy | `tenant_id` required; composite FK to organization | Confidential | retained with organization; archival instead of identifier reuse | read-limited projection only | context selection and changes are audit-relevant |
| `platform_membership` | Platform Tenancy | `tenant_id` required; composite FK to organization and tenant-scoped uniqueness | Confidential | lifecycle states are retained as security evidence; Party erasure does not delete auth-user reference without an Identity workflow | online only | canonical invited/activated/suspended/ended events; suspension reason excluded from event payload |
| `platform_membership_invitation` | Platform Tenancy | `tenant_id` required; composite organization FK; tenant-scoped idempotency | Confidential | expire and later purge contact address under retention policy while retaining opaque event/audit reference | online only | `platform.membership.invited.v1`; event carries opaque `inviteeReference`, never email |
| `platform_active_context` | Platform Tenancy | tenant derived from active membership; composite organization/location FKs | Confidential | short-lived and deletable after session/context expiry; no durable authority claim | online only | selection is audit-relevant; context is revalidated on every use |
| `platform_tenancy_command_receipt` | Platform Tenancy | `tenant_id` required; tenant + operation + idempotency key is the primary key | Confidential | retained for the governed retry window, then purged under the future Platform Tenancy retention job; stores no credential or invitation contact data | online only | binds organization-update and membership-suspension retries to one request fingerprint and prior safe result |
| `user`, `session`, `account`, `verification` | Platform Identity | authentication-global; tenant authority is resolved separately | Restricted for credentials/tokens, otherwise Confidential | Better Auth lifecycle plus governed export/recovery; credentials and tokens never enter Party, events, or logs | online only | session/account lifecycle is PR7 audit and revocation evidence |
| `two_factor`, `passkey` | Platform Identity | authentication-global; no tenant permission content | Restricted | factor inventory/revocation and recovery policy; secrets, public-key material, counters, backup codes, and challenges never enter business events | online only | enrollment, use, recovery, and revocation require privacy-safe audit facts |
| `organization`, `member`, `invitation` | Platform Identity | non-authoritative authentication projection; canonical IDs map to Platform Tenancy | Confidential | rebuilt/reconciled from Platform Tenancy; never used as a business source of truth | online only | projection drift/failure is operational evidence, not a canonical membership fact |

`party_id`, role assignment IDs, legal entity IDs, and branch IDs remain nullable seams where their owning PR has not yet landed. No table in this PR mutates Party or Authorization storage.

## Tenant isolation and RLS disposition

PostgreSQL RLS is **deferred for this controlled prototype, not rejected**. PDA-SEC-011 treats it as defense in depth rather than the only control. The repository has not selected a production login-role topology, managed-provider privilege model, or separate migration/application credentials. The local and CI stack currently connects as the PostgreSQL owner/superuser, which bypasses ordinary RLS and would make a policy-only test misleading.

The deferral is bounded by these mandatory controls:

- every tenant-owned row has `tenant_id NOT NULL`;
- child identifiers use tenant-preserving composite foreign keys where practical;
- unique constraints for membership and idempotency include tenant scope;
- repository methods require derived tenant criteria and expose no unrestricted list/update/delete path;
- active context is opaque, session-bound, expiring, and revalidates current active membership;
- request bodies and ad hoc headers never establish tenant authority;
- tests cover same-tenant behavior, cross-tenant read/write/list denial, organization/location substitution, mismatched user/membership identifiers, and atomic state-plus-outbox behavior; no unscoped count operation is exposed by the repository or PR3 API;
- the application permission seam was fail-closed at PR3 merge; PR5 now binds the canonical evaluator recorded in PDA-IMPL-003, and Better Auth Admin/Organization roles remain prohibited as a fallback.

RLS becomes a blocking production gate when application and migration roles, provider capabilities, operational break-glass access, pooling/session-variable behavior, backup/restore, and policy migration ownership are selected. At that point tests must run through the non-owner application role and prove policy behavior, not merely inspect policy text.

## Lifecycle, idempotency, and projection failure

Invitation is keyed by tenant plus `Idempotency-Key`. The authoritative invitation and privacy-safe outbox event commit atomically. A retry with the same key and the same email, organization, Party seam, roles, and explicit expiry returns the original invitation; reuse for different command content conflicts. The Event Backbone also enforces tenant + event-name + non-null idempotency-key uniqueness so concurrent retries cannot publish two logical facts with different generated event IDs. Identity projection happens after the authoritative commit. A projection failure returns a retryable `503 dependency_unavailable` problem with committed-state uncertainty; retry is safe and re-attempts the idempotent projection without duplicating the invitation or event. Delivery is not membership activation.

Organization update and membership suspension persist tenant-owned command receipts in the same transaction as authoritative state. A retry with the same operation/key and request fingerprint returns the stored safe result; reuse for another resource or request conflicts. This preserves retry recovery after the authoritative commit when the downstream Better Auth projection is unavailable.

`POST /v1/users/{userId}/suspend` validates that the path user matches the tenant-scoped membership in the request, changes only that membership, publishes `platform.membership.suspended.v1`, and removes only the corresponding authentication projection. It never sets Better Auth's global `banned` field. Session revocation remains a separate Platform Identity command in PR7.

Active context never mutates Better Auth's session-global `activeOrganizationId`. An opaque `X-Active-Context-Id` is bound to the current Better Auth session, user, active tenant, active organization, optional active location, issue time, and expiry. Every context-bearing request revalidates those states and the current active membership before permission evaluation. Separate tabs may hold separate context IDs. Context survives a valid refresh of the same session row but fails after session replacement/revocation or membership, tenant, organization, or location suspension. Legal-entity and branch selections fail closed until their owning records and validation ports land; PR3 never echoes unvalidated identifiers as authority.

## Threat and abuse coverage

PR3 tests must cover credential enumeration-safe errors, native Admin/Organization route denial, CSRF/origin controls inherited from the locked Better Auth composition, factor lockout, backup-code single use, OTP secrecy, passkey RP/origin and user-verification rejection, invitation replay, optimistic-version conflict, cross-tenant identifier substitution, disabled membership, and outbox redaction. Logs, errors, events, and fixtures exclude passwords, cookies, session tokens, OTPs, TOTP secrets, backup codes, passkey private material, and full invitation contact data.

## Executable evidence and bounded gaps

- `packages/platform/identity/src/security.test.ts` proves exact-origin/cookie/redirect controls, native authority-route denial, and Passkey user-verification rejection.
- `packages/platform/identity/src/test-utils.test.ts` proves the test-only Node/Vitest sign-up and database-session composition without importing Test Utils into production code.
- `packages/platform/tenancy/src/index.test.ts` proves invitation idempotency/redaction, key-conflict denial, multi-tab contexts, location substitution denial, and user/membership mismatch denial.
- `apps/server/src/router.test.ts` proves authentication, fail-closed authorization, active-context contract handling, and the complete PR3 procedure family.
- `apps/server/composition/persistence.integration.test.ts` proves empty/upgrade/repeat/recovery migrations, canonical two-tenant fixtures without an unauthorized shared cross-tenant identity, same-tenant multi-tab contexts, cross-tenant read/write/list/context denial, tenant-preserving composite constraints, privacy-safe invitation events, and transaction-bound tenancy/outbox commit and rollback.

Configuration and schema tests do not by themselves close full factor assurance. End-to-end TOTP/OTP enrollment, backup-code single use, Passkey ceremonies/inventory/revocation, recovery abuse, assurance provenance, performance, and the approved Node LTS critical matrix remain PR9 evidence. The PR3 merge deliberately left permissioned administration unusable. PR5 subsequently supplied canonical authorization under PDA-IMPL-003; authoritative audit records remain PR7 work. PR3 does not substitute an unregistered audit store or allow-all policy to make demos pass.

## Open gates

- FDR-007: production email/SMS provider and delivery abuse controls.
- PR4: Party link provisioning and privacy workflow.
- PR5: closed at controlled-prototype depth by PDA-IMPL-003; production authority and the named deferrals remain open.
- PR7: authoritative audit storage, audit-of-access, and measured session-revocation propagation.
- PR9: complete first-slice evidence matrix, performance/capacity, accessibility, recovery, and independent review.
- Production: non-owner database role topology, RLS decision/implementation, penetration testing, provider/legal review, and operational exercises.

## Governing sources

- PDA-FND-002, PDA-FND-010, PDA-FND-014
- ADR-0002, ADR-0003, ADR-0006, ADR-0020, ADR-0027
- PDA-PLT-002, PDA-PLT-020, PDA-PLT-028
- PDA-SEC-011
- PDA-RDM-003, PDA-RDM-008
- PDA-ENGR-012, PDA-ENGR-013, PDA-ENGR-014
- PDA-IMPL-001
- `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `registry/endpoint-permissions.json`, `registry/first-slice.json`, and `registry/first-slice-tests.json`
