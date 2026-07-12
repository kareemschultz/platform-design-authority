---
document_id: ADR-0006
title: Adopt Better Auth as the Authentication and Session Foundation
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
---

# ADR-0006 — Adopt Better Auth as the Authentication and Session Foundation

## Context

The platform needs first-party authentication, session management, two-factor authentication, passkeys, social sign-in, organization-aware identity context, enterprise SSO, SCIM, API credentials, device flows, and future identity-provider capabilities. The founder has selected Better Auth as the desired authentication foundation.

The platform also has a deeper business hierarchy, authorization model, entitlement model, and delegated administration requirements that exceed ordinary authentication-library responsibilities.

## Decision Drivers

- TypeScript-native and framework-agnostic architecture
- First-party control over identity data and deployment
- Strong session and account-management support
- TOTP, OTP, backup codes, trusted devices, and lockout
- Passkeys and passwordless authentication
- Organization, team, invitation, and membership support
- OIDC, OAuth, SAML, SCIM, API keys, JWT, device authorization, and OIDC provider options
- Compatibility with Next.js, backend services, Expo, custom domains, and self-hosting
- Good support for AI-assisted engineering and locally owned configuration

## Options Considered

### Better Auth

A TypeScript authentication framework with core account and session management and a broad plugin system.

### Fully managed identity provider

Fast enterprise launch and mature operations, but creates recurring cost, stronger vendor coupling, and self-hosting complications.

### Keycloak as the primary first-party identity system

Mature enterprise federation and self-hosting, but heavier operationally and less integrated with the TypeScript application-development workflow.

### Build authentication internally

Maximum control but unacceptable security, maintenance, and time cost.

## Decision

Adopt Better Auth as the default authentication, session, account, and authentication-protocol foundation.

The first-slice plugin baseline is deliberately small: database-backed sessions, email/password and account lifecycle, Two-Factor Authentication, Passkey, constrained Admin operations, constrained Organization context, and test-only Test Utils. Last Login Method and i18n may be included in the controlled prototype behind platform adapters. SSO, SCIM, API Key, and Device Authorization are seams or later prototypes, not production promises.

All other core options, official plugins, managed-infrastructure plugins, partner plugins, and community plugins are deny-by-default under `PDA-PLT-028`. A plugin appearing in official documentation or scaffold output is not approval to enable it.

Use Better Auth for:

- Primary sign-in and registration
- Account and session lifecycle
- Two-factor authentication
- Passkeys
- Social sign-in and account linking
- Organization-oriented authentication context where useful
- Enterprise SSO and SCIM after protocol, security, commercial, and operational review
- API keys and selected token flows
- Device authorization and authorization-server capabilities where approved

Do not use Better Auth as the sole source of truth for:

- Platform tenant and partner hierarchy
- Legal entities, branches, locations, or workspaces
- Business roles and permissions
- Entitlements and plan access
- Segregation of duties
- Workforce, customer, supplier, or party records
- High-impact business approval policy

These remain owned by platform services.

Better Auth payment/subscription plugins do not own Platform Subscription, tenant customer Recurring Agreements, payment orchestration, stored value, or entitlements. Agent Auth and MCP integrations do not bypass canonical application commands, permissions, entitlements, approvals, tenant scope, or AI governance.

## Consequences

### Positive

- Strong TypeScript alignment
- Faster delivery of broad authentication capabilities
- Greater deployment control than a managed-only identity provider
- Consistent integration across first-party applications
- Plugin path for enterprise and device scenarios
- Reduced need to build security-sensitive authentication features from scratch

### Negative

- Better Auth becomes a critical security dependency requiring careful upgrades and review
- Optional managed infrastructure and third-party plugins may have pricing, processing, retention, residency, and product-tier implications
- Platform and Better Auth organization models must be mapped without duplicate ownership
- Expo and custom-domain behavior require dedicated validation
- The team remains responsible for operating the identity data and security configuration

## Required Controls

- Pin and review Better Auth versions
- Maintain a platform adapter rather than allowing domains to call Better Auth directly
- Separate authentication from business authorization and entitlements
- Encrypt factor secrets, provider credentials, and API-key material appropriately
- Implement platform audit events from Better Auth lifecycle hooks
- Threat-model account linking, recovery, custom domains, SSO, SCIM, impersonation, and API keys
- Test horizontal scaling, session revocation, cookie policy, and mobile storage
- Maintain an emergency migration and export path
- Review Better Auth enterprise licensing before promising self-service SSO or SCIM commercially
- Keep production CSRF and origin checks enabled; explicitly configure trusted origins, secure cookies, and trusted proxy/IP headers
- Review schema, endpoint, secret, hook, data-flow, and package changes for every enabled plugin and upgrade
- Keep session caching disabled until revocation-staleness and sensitive-operation revalidation have passed policy review
- Apply `01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md` before enabling any plugin

## Validation

The decision is validated when a production-like vertical slice demonstrates:

- Email/password and social sign-in
- Secure database-backed sessions
- TOTP, backup codes, lockout, and trusted-device policy
- Passkey registration and sign-in
- Session listing and remote revocation
- Next.js and Expo clients
- Tenant-aware authentication context
- Platform authorization and entitlements evaluated separately
- One OIDC or SAML SSO connection
- SCIM provisioning proof of concept
- Scoped API key and device authorization flow
- Complete audit and security-event coverage

The dated release, documentation, security, adapter, plugin, and pricing evidence is `PDA-APP-017`. Lifecycle approval remains Proposed until the validation evidence above exists.
