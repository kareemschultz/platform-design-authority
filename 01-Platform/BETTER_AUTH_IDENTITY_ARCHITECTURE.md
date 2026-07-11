---
document_id: PDA-PLT-020
title: Better Auth Identity Architecture
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0006, ADR-0007, ADR-0016]
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

## Accounts and Credentials

Supported foundations may include email and password, username, phone where justified, email OTP, magic links, social providers, account linking, email verification, password reset, and recovery.

Platform policy determines which methods are enabled by tenant, user type, risk, region, and application.

## Sessions

Required behavior includes database-backed sessions, expiration and refresh, revocation, multiple sessions where enabled, device visibility, active context, and fresh-session requirements for sensitive actions.

A session may reference user identity, assurance level, active tenant or organization hint, session and device identifiers, authentication methods, expiry, and delegation context.

Current permissions, entitlements, scopes, and business policy are resolved by platform services rather than trusted permanently from a session or token claim.

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

## API Keys and Machine Authentication

API keys may support approved customer, integration, developer, and extension scenarios.

Each key defines tenant, application, owner, scopes, environment, expiration, limits, rotation, revocation, and last use. Secret material is displayed only at creation.

Internal services may use workload identity, OAuth client credentials, signed JWTs, or mutual TLS. API keys are not the universal internal-service mechanism.

## Bearer Tokens and JWT

Browser applications prefer secure cookies over long-lived bearer tokens in general client storage.

JWTs are short-lived, audience- and issuer-bound, minimally scoped, and never treated as permanently current business authorization. Sensitive operations re-evaluate policy server-side.

## OIDC Provider

Exposing the platform as an OIDC provider requires governed client registration, redirect validation, consent, scopes, signing-key rotation, discovery, JWKS, token revocation, tenant-aware claims, and external security review.

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

## Event Integration

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

## Source References

Dated verification and official URLs are maintained in the Better Auth evidence appendices under `19-Appendices/`.