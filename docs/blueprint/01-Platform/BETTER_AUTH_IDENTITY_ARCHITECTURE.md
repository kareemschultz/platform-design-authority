---
document_id: PDA-PLT-020
title: Better Auth Identity Architecture
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0006, ADR-0007, ADR-0016, ADR-0028]
---

# Better Auth Identity Architecture

## Purpose

Define how Better Auth provides authentication, sessions, account management, second-factor verification, passkeys, social sign-in, enterprise federation, provisioning, service credentials, and identity lifecycle capabilities while the platform retains ownership of tenant hierarchy, Party identity, authorization, entitlements, approvals, and business policy.

## Architectural Position

Better Auth is the platform's primary authentication and session framework.

Better Auth owns:

- User credential authentication
- Session issuance and revocation
- Email and password sign-in
- Social and OAuth sign-in
- Passkeys and WebAuthn credentials
- Two-factor enrollment and challenges
- Account linking and recovery
- Session and device-related authentication state
- SSO protocol integration
- SCIM protocol endpoints where enabled
- API keys, bearer tokens, JWTs, OIDC provider, and device authorization where approved

The platform layers own:

- Canonical tenant, partner, organization, legal-entity, branch, and location hierarchy
- Canonical people, organizations, contact points, identifiers, and relationships through Party
- Links from Better Auth identities to Party and domain-owned role records
- Business roles, permissions, resource scopes, segregation of duties, and policy evaluation
- Entitlements, plans, limits, and capability access
- Delegated administration and support access
- Risk policy, step-up requirements, and high-impact approvals
- Platform audit, security analytics, and business identity linking

CRM, Procurement, Workforce, Partners, and other domains own customer, supplier, employment, contractor, partner, and external-party role records. Platform Identity and Party link to those records; they do not own or duplicate them.

Better Auth's organization plugin may support authentication-oriented membership and active-organization context, but it must not become the sole source of truth for the full business hierarchy.

`BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md` is the mandatory deny-by-default register for Better Auth core options and plugins. Scaffold defaults, documentation availability, or a package installation do not authorize a plugin.

## Accounts and Credentials

The controlled baseline is email/password plus the explicitly selected methods in `docs/blueprint/01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`. Phone authentication and magic links are deferred by default because of SIM-swap, recovery, and email-channel takeover risks; they require a new matrix disposition and threat-model evidence before enablement. Other methods remain deny-by-default unless that matrix admits them.

Platform policy determines which methods are enabled by tenant, user type, risk, region, and application.

## Sessions

Required behavior includes database-backed sessions, expiration and refresh, revocation, multiple sessions where enabled, device visibility, active context, and fresh-session requirements for sensitive actions.

A session may reference user identity, assurance level, active tenant or organization hint, session and device identifiers, authentication methods, expiry, and delegation context.

Current permissions, entitlements, scopes, and business policy are resolved by platform services rather than trusted permanently from a session or token claim.

Cookie session caching and secondary storage are disabled until maximum revocation staleness, tenant isolation, outage behavior, cache invalidation, and sensitive-operation database revalidation are approved and tested. A cached authentication session never makes cached business authority current.

## Two-Factor Authentication

Better Auth's two-factor plugin supports TOTP, delivered OTP through approved channels, backup recovery codes, trusted-device behavior, enrollment and disable flows, lockout, and explicit passwordless-account configuration.

Platform policy determines enrollment requirements, phishing-resistant-factor requirements, trusted-device duration, recovery controls, reset governance, and step-up behavior.

Passwordless and federated sign-in methods must be reviewed explicitly because an ordinary credential 2FA flow may not automatically cover every authentication method.

## Passkeys

Passkeys are supported through the Better Auth passkey plugin.

Policy defines relying-party identifiers, approved domains, discoverable credentials, user verification, credential management, recovery, account linking, whether passkeys satisfy MFA, and administrator requirements.

## Organizations and Teams

Better Auth organization features may provide organizations, memberships, invitations, roles, teams, active context, and hooks.

Adoption rules:

1. The platform hierarchy remains authoritative.
2. Better Auth roles do not replace the platform permission catalog.
3. Hooks call platform application services rather than creating business resources directly.
4. Active organization is session context, not authorization.
5. Multi-tab workspace context must not create unsafe global session mutation.

## Enterprise SSO

The Better Auth SSO plugin supports OIDC, OAuth 2.0 providers, and SAML 2.0.

The platform supports tenant-specific providers, discovery, metadata, attribute mapping, just-in-time provisioning, optional profile synchronization, organization assignment, governed role mapping, suspension, certificate rotation, and fallback.

Protocol support and managed self-service infrastructure are separate commercial concerns. The platform must not describe SAML protocol support as requiring a paid managed dashboard when the open plugin provides the protocol capability.

## SCIM

Better Auth now provides a first-party SCIM plugin for enterprise lifecycle provisioning.

Required platform behavior:

- Map SCIM users and groups to Better Auth identities and platform memberships
- Preserve source-provider identifiers
- Support create, update, suspend, reactivate, and deprovision
- Avoid destructive deletion where retention requires suspension
- Apply group and role mapping through platform policy
- Audit provisioning activity
- Reconcile drift and failed operations
- Scope SCIM credentials to one tenant or organization
- Keep domain role lifecycle in the owning domain

SCIM provisioning may create or suspend platform membership, but it must not silently create, terminate, or rewrite Employment, Customer, Supplier, or other domain role records without an explicit domain workflow.

## Administrative Operations

Better Auth administrative capabilities may support identity management, banning, session revocation, and impersonation-related mechanics.

The platform administration layer remains the user-facing control plane. Administrative endpoints are wrapped by platform permissions, step-up policy, reason, approval, duration, visible support context, and audit.

Identity administration must not silently alter Party or domain-owned role records.

The Better Auth Admin plugin's `admin` role and built-in access-control model are internal mechanics only. They do not satisfy platform permission checks. User deletion, password/email changes, role changes, bans, session revocation, and impersonation are exposed only through platform commands with tenant scope, recent authentication, reason, approval where required, visible delegated context, and audit.

## API Keys and Machine Authentication

API keys may support approved customer, integration, developer, and extension scenarios.

Each key defines tenant, application, owner, scopes, environment, expiration, limits, rotation, revocation, and last use. Secret material is displayed only at creation.

Internal services may use workload identity, OAuth client credentials, signed JWTs, or mutual TLS. API keys are not the universal internal-service mechanism.

## Bearer Tokens and JWT

Browser applications prefer secure cookies over long-lived bearer tokens in general client storage.

JWTs are short-lived, audience- and issuer-bound, minimally scoped, and never treated as permanently current business authorization. Sensitive operations re-evaluate policy server-side.

## OIDC Provider

Exposing the platform as an OIDC provider requires governed client registration, redirect validation, consent, scopes, signing-key rotation, discovery, JWKS, token revocation, tenant-aware claims, and external security review.

The documented OIDC Provider plugin is active-development and Labs-only as of the evidence date. The broader OAuth 2.1 Provider remains deferred until a Developer Platform ADR and real relying-party requirement define the authorization-server and resource-server boundaries.

## Device Authorization

Device authorization may support kiosks, terminals, scanners, command-line tools, and limited-input devices.

It integrates with tenant and location binding, expiring codes, rate and polling limits, permissions, entitlements, revocation, health, and audit.

## Browser, Mobile, and Offline Sessions

### Browser

Use secure HTTP-only cookies, production Secure flag, appropriate SameSite policy, trusted origins, CSRF protection, rotation, and shorter high-risk administrator duration.

### Mobile

Expo clients use the approved Better Auth client integration or a thin platform adapter. Session and refresh material use SecureStore or platform keychain facilities.

### Offline

Offline authority is a signed, expiring platform lease with tenant, device, operator, capability, and policy scope. It is not an offline Better Auth session.

Queued work is accepted only after reconnect authentication, lease validation, authorization, entitlement, and business-state checks.

## White Label and Custom Domains

Required controls include verified domains, exact trusted origins, cookie isolation, passkey relying-party constraints, OAuth callbacks, SSO metadata, tenant-aware recovery links, stable security semantics, anti-phishing indicators, and canonical support identity.

Custom-domain behavior requires a dedicated threat model.

## Data Model Integration

Better Auth tables remain logically isolated from business-domain tables.

```text
BetterAuthUser
  └── PlatformIdentityLink
       ├── TenantMembership
       ├── Party reference
       ├── Optional domain-role reference
       ├── Delegations
       └── Authorization assignments
```

A Better Auth user is not an employee, customer, supplier, partner, or canonical Party.

## Security Requirements

- Rate limiting on sign-in, recovery, OTP, passkey, SSO, SCIM, API-key, and device flows
- Secret encryption
- Enumeration resistance
- Credential-stuffing controls
- Session fixation and replay defenses
- Fresh-session and step-up policy
- Audit of authentication, provisioning, and administration
- Notification for sensitive changes
- Recovery-code and factor-reset governance
- Provider and dependency monitoring
- Version pinning and upgrade testing
- Explicit production base URL, exact HTTPS trusted origins, secure host-only cookies by default, and trusted proxy/IP headers
- Production prohibition on `disableCSRFCheck` and `disableOriginCheck`
- Plugin-by-plugin schema, endpoint, secret, hook, package, and data-flow review
- No credential, cookie, token, OTP, recovery code, factor secret, or excessive provider claim in logs or events

Better Auth built-in rate limiting is defense in depth; platform edge and application abuse controls remain required. Broad wildcard origins, dynamic origin lookup, cross-subdomain cookies, cross-site cookies, and forwarded host/protocol derivation require dedicated threat modeling.

## Runtime and Client Integration

Hono mounts the owned Better Auth handler for `GET` and `POST`; narrowly scoped credentialed CORS is registered before routes. Bun compatibility is proven on the exact implementation lock across cryptography, cookies, WebAuthn, OAuth, email, database adapters, migrations, proxy behavior, telemetry, and shutdown. Node LTS remains the supported fallback under ADR-0020.

Next.js and Expo integrations are adapters only. Expo requires secure storage, deep-link and custom-scheme allowlists, app/universal links, cookie exchange, recovery, device-loss, and revocation evidence. Neither framework integration performs business authorization.

## Event Integration

Authentication accounts and sessions are Platform Identity aggregates rather than tenant aggregates. ADR-0028 registers `platform.session.revoked.v1` as Platform-scoped unless a future event describes a separate tenant-membership fact. `platform.session.created.v1` remains a registered event name, but its payload and scope contract are deferred and no producer may emit it until that contract is governed. Session-event payloads must not contain tokens, cookies, raw IP addresses, user-agent strings, credentials, factors, or tenant-membership lists.

- `platform.user.registered.v1`
- `platform.session.created.v1`
- `platform.session.revoked.v1`
- `platform.authentication-factor.enrolled.v1`
- `platform.authentication-factor.removed.v1`
- `platform.passkey.registered.v1`
- `platform.sso-session.created.v1`
- `platform.account-recovery.completed.v1`
- `platform.api-key.created.v1`
- `platform.user.suspended.v1`

Lifecycle hooks publish through the transactional outbox or another reliable boundary where business reactions depend on them.

## Required Evaluation

- Next.js web integration
- Expo mobile integration
- Custom-domain cookies and passkeys
- TOTP, OTP, trusted devices, recovery, and lockout
- Social sign-in and account linking
- OIDC and SAML tenant SSO
- First-party SCIM lifecycle and group mapping
- API-key scopes and rotation
- Session revocation
- Device authorization
- Horizontal scaling and session consistency
- Migration and rollback
- Tenant isolation and authorization separation
- Proof that identity lifecycle cannot silently mutate domain role records
- CSRF, trusted-origin, proxy-header, cookie, account-linking, recovery, enumeration, replay, and open-redirect testing
- Schema and endpoint diff for the exact selected plugin composition
- Bun and Node critical compatibility suites for the Better Auth boundary

## Source References

Dated verification and official URLs are maintained in `docs/blueprint/19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`. Plugin decisions are governed by `docs/blueprint/01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`.

## Deny-by-Default Sign-In Clarification

Email/password is the minimal first-slice method. Magic links and phone authentication are deferred by `BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`; neither is supported until takeover, SIM-swap, recovery, rate-limit, privacy, and evidence gates pass.
