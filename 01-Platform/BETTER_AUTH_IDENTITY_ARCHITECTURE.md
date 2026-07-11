---
document_id: PDA-PLT-020
title: Better Auth Identity Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0006, ADR-0007, ADR-0016]
---

# Better Auth Identity Architecture

## Purpose

Define how Better Auth provides authentication, sessions, account management, second-factor verification, passkeys, social sign-in, enterprise federation, service credentials, and identity lifecycle capabilities while the platform retains ownership of tenant hierarchy, Party identity, authorization, entitlements, approvals, and business policy.

## Architectural Position

Better Auth is the platform's primary authentication and session framework.

It owns:

- User credential authentication
- Session issuance and revocation
- Email and password sign-in
- Social and OAuth sign-in
- Passkeys and WebAuthn credentials
- Two-factor enrollment and challenge workflows
- Account linking and recovery
- Session and device-related authentication state
- SSO protocol integration
- SCIM protocol endpoints where enabled
- API keys, bearer tokens, JWTs, OIDC provider, and device authorization where approved

The Platform Identity, Party, and Authorization layers own:

- Canonical tenant, partner, organization, legal-entity, branch, and location hierarchy
- Canonical people, organizations, contact points, and domain-role links
- Workforce, customer, supplier, and external-party role records
- Business roles, permissions, resource scopes, segregation of duties, and policy evaluation
- Entitlements, plans, limits, and capability access
- Delegated administration and support access
- Risk policy, step-up requirements, and high-impact action approvals
- Platform audit, security analytics, and business identity linking

Better Auth's organization plugin may support authentication-oriented membership and active-organization context, but it must not become the sole source of truth for the platform's full business hierarchy.

## Core Better Auth Capabilities

### Accounts and Credentials

- Email and password
- Username sign-in where enabled
- Phone-number sign-in where justified
- Email OTP
- Magic links
- Social providers
- Account linking
- Email verification
- Password reset and recovery

### Sessions

- Database-backed sessions
- Session expiration and refresh
- Session caching
- Session revocation
- Multiple sessions per user where enabled
- Session listing and device visibility
- Current active authentication context
- Fresh-session requirements for sensitive actions

### Two-Factor Authentication

The Better Auth two-factor plugin supports:

- TOTP applications
- Delivered OTP through a configured email, phone, or approved channel
- Backup recovery codes
- Trusted-device behavior
- Enrollment and disable flows
- Temporary lockout after repeated failed verification
- Passwordless-account compatibility through explicit configuration

Platform policy determines:

- Which users must enroll
- Which roles require phishing-resistant factors
- Whether trusted-device behavior is allowed
- Trust duration and risk-based revocation
- Which sign-in methods require an additional challenge
- Recovery and administrator reset controls
- Step-up requirements for sensitive actions

A critical implementation detail is that Better Auth does not automatically place every passwordless or federated sign-in method behind its ordinary credential 2FA challenge. Platform hooks and risk policy must enforce extra verification where required.

### Passkeys

Passkeys are supported through Better Auth's passkey plugin.

Platform policy defines:

- Discoverable versus non-discoverable credentials
- User-verification requirements
- Approved relying-party identifiers and domains
- Credential naming and management
- Recovery and account-linking behavior
- Whether passkeys satisfy MFA or step-up policy
- High-risk administrator requirements

Passkeys are the preferred long-term user experience for strong phishing-resistant authentication, while TOTP and recovery methods remain available according to tenant and role policy.

### Organizations and Teams

Better Auth's organization plugin provides:

- Organizations
- Membership
- Invitations
- Roles and permissions within the plugin
- Teams
- Active-organization session context
- Lifecycle hooks

Adoption rules:

1. Better Auth organization records may map one-to-one to platform tenants or selected platform organizations during the first implementation.
2. The platform's canonical hierarchy remains authoritative.
3. Better Auth roles must not replace the platform permission catalog.
4. Organization hooks must call platform application services rather than directly creating business resources.
5. Active organization in a session is context, not authorization.
6. Multiple browser tabs may require different workspace context, so client-local organization selection may be preferable to globally mutating the authentication session in some workflows.

### Enterprise SSO

Better Auth's SSO plugin supports OIDC, OAuth 2.0 providers, and SAML 2.0.

The platform must support:

- Tenant- or organization-specific identity providers
- Domain and organization-based discovery
- OIDC discovery and validation
- SAML service-provider metadata
- Identity attribute mapping
- Just-in-time provisioning
- Optional profile synchronization on login
- Organization assignment
- Default role mapping with mandatory platform-policy validation
- Provider suspension, certificate rotation, and emergency fallback

Self-service enterprise SSO configuration may require a Better Auth enterprise offering or separate implementation review. Commercial, licensing, and portability implications must be reviewed before commitment.

### SCIM

SCIM may be enabled for enterprise lifecycle provisioning.

Required platform behavior:

- Map SCIM users and groups to Better Auth identities and platform memberships
- Preserve source-provider identifiers
- Support create, update, suspend, reactivate, and deprovision
- Avoid destructive deletion when retention or audit policy requires suspension
- Apply role and group mappings through governed policy
- Audit all provisioning activity
- Reconcile drift and failed operations
- Scope SCIM tokens to one tenant or organization

### Administrative Operations

Better Auth's admin plugin may support identity administration such as user management, banning, session revocation, and impersonation-related workflows.

Platform rules:

- Platform administration remains the user-facing control plane.
- Better Auth administrative endpoints are wrapped by platform permissions and audit.
- Support impersonation includes reason, approval, scope, banner, expiry, and original-actor evidence.
- Identity administration must not silently alter Party, workforce, or other business-role records.

### API Keys and Machine Authentication

Better Auth's API-key plugin may be used for customer, integration, developer, and extension credentials.

Each key defines:

- Owning tenant and application
- Name and owner
- Scopes and permitted capabilities
- Environment
- Expiration
- Rate and usage limits
- Allowed origins, networks, or resources where supported
- Rotation and revocation
- Last-use visibility
- Secret display only at creation

Service-to-service identities may also use OAuth client credentials, signed JWTs, workload identity, or mutual TLS according to deployment context. API keys are not the universal solution for internal services.

### Bearer Tokens and JWT

Bearer and JWT plugins may be used for selected API and interoperability scenarios.

Rules:

- Browser sessions prefer secure cookies rather than long-lived bearer tokens in client storage.
- JWTs are short-lived and include only necessary claims.
- Business permissions and entitlements are not treated as permanently accurate merely because they appear in a JWT.
- Token revocation, key rotation, audience, issuer, algorithm, and clock-skew policy are explicit.
- Sensitive authorization is re-evaluated server-side.

### OIDC Provider

Better Auth may expose the platform as an OIDC identity provider for approved first-party applications, partner applications, devices, and extensions.

This capability requires:

- Client registration governance
- Redirect-URI validation
- Consent and scopes
- Signing-key rotation
- Discovery and JWKS availability
- Token revocation
- Tenant-aware claims
- Security review before external general availability

### Device Authorization

The device-authorization plugin may support TVs, kiosks, terminals, scanners, command-line tools, and devices with limited input.

It must be integrated with:

- Device enrollment
- Location and tenant binding
- Expiring user codes
- Rate limiting
- Polling limits
- Permission and entitlement assignment
- Remote revocation
- Device health and audit

## Session Architecture

### Browser Sessions

Use secure, HTTP-only cookies with:

- Secure flag in production
- Appropriate SameSite policy
- Domain and subdomain policy compatible with white-label domains
- CSRF and trusted-origin controls
- Rotation or refresh according to Better Auth configuration
- Shorter duration for high-risk administrator sessions

### Mobile Sessions

React Native and Expo clients use the approved Better Auth client integration or a thin platform adapter. Session tokens and refresh material are stored using Expo SecureStore or platform keychain facilities, never unencrypted general storage.

### Edge and Offline Sessions

Offline operational authority is not the same as an online Better Auth session.

The platform issues signed, expiring offline leases containing limited tenant, device, operator, capability, and policy context. Reconnection requires session and authorization revalidation before queued operations are accepted.

### Session Context

Do not overload the authentication session with the full permission graph.

A session may contain or reference:

- User identity
- Authentication assurance level
- Active tenant or organization hint
- Session and device identifiers
- Authentication methods
- Issued, expiry, and fresh-session timestamps
- Delegation or impersonation context

Current authorization, entitlements, scopes, and business policy are resolved by platform services.

## White-Label and Custom-Domain Requirements

Authentication must support platform, partner, and customer-branded domains.

Required controls:

- Verified custom domains
- Exact trusted-origin management
- Cookie-domain isolation
- Passkey relying-party constraints
- OAuth callback registration
- SSO callback and metadata generation
- Tenant-aware email and recovery links
- Brand-specific login pages without changing security semantics
- Anti-phishing indicators and canonical support information

Custom-domain behavior requires a dedicated threat model before release.

## Data Model Integration

Keep Better Auth tables logically isolated from business-domain tables.

Recommended linkage:

```text
BetterAuthUser
  └── PlatformIdentityLink
       ├── TenantMembership
       ├── Party reference
       ├── Optional domain-role reference
       ├── Delegations
       └── Authorization assignments
```

Do not make the Better Auth user record the employee record, customer record, supplier record, or canonical Party record.

## Security Requirements

- Rate limiting on sign-in, recovery, OTP, passkey, SSO, API-key, and device flows
- Secret encryption for 2FA, SSO, API keys, and provider credentials
- Account-enumeration resistance
- Brute-force and credential-stuffing controls
- Session fixation and replay defenses
- Fresh-session and step-up policy
- Audit of authentication and administration events
- Notification for sensitive changes
- Recovery-code and factor-reset governance
- Provider and dependency security monitoring
- Version pinning and upgrade testing

## Event Integration

Better Auth lifecycle hooks map into Platform Identity events such as:

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

Hooks publish through the platform outbox or another reliable boundary where business reactions depend on them.

## Required Evaluation

Before production ratification, validate:

- Next.js web integration
- Expo mobile session integration
- Custom-domain cookies and passkeys
- TOTP, OTP, trusted devices, backup codes, and lockout
- Social sign-in and account linking
- OIDC and SAML tenant SSO
- SCIM lifecycle and group mapping
- API-key scopes and rotation
- Multi-session revocation
- Device authorization
- Horizontal scaling and session consistency
- Migration and rollback
- Tenant isolation and authorization separation

## Source References

Dated verification and official URLs are maintained in `19-Appendices/BETTER_AUTH_VERIFICATION-2026-07-10.md`.

- Better Auth Introduction
- Better Auth Session Management
- Better Auth 2FA Plugin
- Better Auth Passkey Plugin
- Better Auth Organization Plugin
- Better Auth SSO Plugin
- Better Auth SCIM Plugin
- Better Auth Admin Plugin
- Better Auth API Key, JWT, Bearer, Multi Session, OIDC Provider, and Device Authorization plugins