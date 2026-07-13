---
document_id: PDA-IMPL-001
title: WS1 PR1 Identity Lifecycle and Better Auth Composition Manifest
version: 0.1.0
status: Draft
owner: Platform Identity
last_reviewed: 2026-07-13
related_adrs: [ADR-0006, ADR-0007, ADR-0020, ADR-0027]
review_evidence: []
---

# WS1 PR1 Identity Lifecycle and Better Auth Composition Manifest

## Scope and authority

This manifest closes the design-evidence portion of PDA-RDM-008 G4 for a named controlled prototype. It does not promote ADR-0006, ADR-0007, ADR-0027, PDA-PLT-028, or this document to production authority. Canonical capabilities are `platform.authentication`, `platform.identity`, `platform.organizations`, `platform.authorization`, `platform.entitlements`, `platform.audit`, and prototype-depth `party.records`. Platform Identity owns authentication accounts, factors, credentials, and sessions. Platform Tenancy owns organizations, memberships, invitations, and tenant-role assignments. Party owns canonical real-world identities and `PlatformIdentityLink`.

## Exact lock and selected composition

| Surface | Exact package | WS1 selection | Activation |
|---|---|---|---|
| Core authentication/session | `better-auth@1.6.23` | email/password, account lifecycle, database sessions | email/password already enabled; lifecycle work PR3 |
| Two-Factor | `better-auth@1.6.23` | TOTP, OTP, backup codes; assurance mapped by Platform Identity | PR3 |
| Passkey | `@better-auth/passkey@1.6.23` | WebAuthn enrollment and authentication | package locked in PR1; plugin enabled in PR3 |
| Admin | `better-auth@1.6.23` | server-side mechanics only behind platform policy wrappers | PR3; native HTTP authority routes intercepted |
| Organization | `better-auth@1.6.23` | minimum authentication projection only; never tenancy authority | PR3; native mutation and `set-active` routes intercepted |
| Test Utils | `better-auth@1.6.23` | deterministic test-only composition | test builds only; prohibited from production composition |
| Contract-first API | `@orpc/contract@1.14.7` | transport-neutral contract derived from canonical OpenAPI metadata | PR1 |

No community, payment, billing, tracking, AI, managed-infrastructure, OAuth-provider, OIDC-provider, Agent Auth, MCP, SSO, SCIM, anonymous, username, phone-number, magic-link, or Expo plugin is enabled by this selection. Expo remains separately gated by PDA-PLT-028.

## Runtime endpoint and schema inventory

The inventories below were produced from the installed exact packages on 2026-07-13. They are a change detector, not a grant of public API authority.

- Two-Factor exposes native HTTP operations for enable/disable, TOTP URI and verification, OTP send/verify, backup-code generation/verification, plus server-only TOTP generation and backup-code viewing. It adds `user.twoFactorEnabled` and a two-factor record containing secret, backup codes, user reference, verification state, failure count, and lock time. Secret and backup-code values are restricted authentication data and never enter Platform events, audit change summaries, or Party.
- Passkey exposes seven native plugin operations and adds passkey name, public key, user reference, credential identifier, counter, device type, backup state, transports, creation time, and AAGUID. Public API representations expose only safe metadata needed for user factor management.
- Admin exposes fifteen `/admin/*` operations and adds user role/banned/ban reason/ban expiry plus session impersonator metadata. Better Auth role fields grant no canonical Platform permission.
- Organization exposes twenty-two operations covering organization reads/mutations, active organization, membership, and invitation behavior. It adds organization, member, invitation, and `session.activeOrganizationId` storage. These records are authentication projections only; Platform Tenancy remains authoritative.
- Test Utils exposes no public runtime endpoint and is composed only in tests.

Every version or plugin change must repeat this inventory and review the diff under PDA-PLT-028 and TECH-LESSON-032.

## Native-route policy

The Better Auth handler is mounted only through `apps/server/composition/identity.ts`. `isBlockedNativeAuthHttpRoute` fails closed with an indistinguishable 404 for all `/admin` routes and for Organization create, update, delete, set-active, invite/cancel/accept/reject invitation, remove/update/leave membership mutations. Canonical Platform commands perform tenant scoping, permissions, recent-authentication or approval policy, reason capture, audit, and event publication before a server-side adapter invokes minimum Better Auth mechanics.

Read-only plugin behavior is not automatically a canonical Platform contract. The governed `/v1` OpenAPI and `packages/contracts/platform-api` remain the only WS1 application API authority.

## Lifecycle and failure semantics

Invitation is a Platform Tenancy command keyed by idempotency key. It records a tenant-scoped pending invitation, publishes `platform.membership.invited.v1` transactionally, and requests delivery without treating message delivery as membership activation. Acceptance provisions or links the Better Auth account, creates the tenant membership, optionally requests Party linkage, and publishes `platform.membership.activated.v1`; retries must not duplicate any account, Party, link, membership, audit, or event effect.

`POST /v1/users/{userId}/suspend` suspends only the active-tenant membership and publishes `platform.membership.suspended.v1`. It does not globally disable the auth account. Ending a membership publishes `platform.membership.ended.v1`. Role assignment grant/revoke publishes `platform.role-assignment.granted.v1` or `.revoked.v1`. Global account protection, credential reset, factor recovery, session revoke, tenant membership state, Party status, and identity-link state remain separate commands and audit facts.

Authentication may precede Party linkage. Commands that require a real-world actor call `requirePartyLink`; authentication alone never synthesizes a Party. Partial failures are visible, retryable where safe, and reconciled by owner-specific adapters rather than cross-owner table mutation.

## Multi-tab active context

The client requests an organization context without submitting tenant authority. Platform Tenancy validates a current membership and returns an opaque server-issued `activeContextId` bound to the authenticated session and selected organization/location. Context-bound calls send `X-Active-Context-Id`; the server reloads or revalidates current membership and policy. The design deliberately does not mutate Better Auth's session-global `activeOrganizationId`, so two browser tabs may hold different authorized contexts without silently changing each other.

## Secrets, data flow, and rollback

Only `@meridian/tooling-env` supplies `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `CORS_ORIGIN`, and `DATABASE_URL`. This manifest records names, never values. Secrets have no development default and do not enter logs, errors, events, client bundles, or repository fixtures.

The browser sends credentials/factor assertions to the composition-mounted identity handler. Platform Identity validates authentication and returns session state. `/v1` commands resolve the session, active context, Party link when required, current permissions, policy outcome, and entitlements independently. Owner commands persist only their own state and append canonical events/audit through published ports.

Rollback disables the newly selected plugin in composition, restores the prior reviewed exact package lock, retains compatible authentication data for forward repair, and runs an explicit migration/downstream-projection plan rather than deleting credential or membership facts. Native route interception remains in place during rollback. A package rollback is not complete until Bun and Node fallback authentication/session tests, migration compatibility, and session revocation pass.

## PR1 evidence and remaining gates

PR1 evidence consists of canonical OpenAPI/endpoint parity, generated contract freshness, contract semantic-parity tests, native-route denial tests, path-aware architecture positive/negative tests, exact dependency locks, event-envelope/schema validation, full repository typecheck/test/lint/build, and Bun/Node health probes. PR3 supplies factor enrollment/recovery, invitation/suspension, two-tenant isolation, drift reconciliation, security abuse, and authentication integration evidence. PR7 supplies measured session-revocation propagation. ADR-0027 specialist review remains a hard prerequisite to PR2 merge.
