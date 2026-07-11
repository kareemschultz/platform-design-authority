---
document_id: PDA-APP-002
title: Better Auth Capability and Commercial Verification
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
verified_as_of: 2026-07-10
---

# Better Auth Capability and Commercial Verification

## Purpose

Record dated evidence for material Better Auth assumptions used by ADR-0006, the identity architecture, the technology stack, and commercial packaging.

Vendor capabilities and pricing may change. Re-verify before implementation, contracting, or publishing customer pricing.

## Verified Findings

### Framework and Managed Infrastructure

Better Auth's pricing page states that the Better Auth framework is free and open source. Separate pricing applies to Better Auth's managed infrastructure, dashboard, audit logs, security detections, communications, self-service enterprise connections, and support.

Implication:

- The platform may self-host the authentication framework.
- Managed infrastructure is optional, not an architectural requirement.
- Managed infrastructure and support costs must appear in the commercial cost model if selected.

### SSO

The official SSO plugin documentation states support for:

- OpenID Connect
- OAuth 2.0 providers
- SAML 2.0
- Provider registration
- Organization-aware provider association
- Just-in-time provisioning hooks
- OIDC discovery and validation

The documentation separately advertises managed self-service SSO through Better Auth infrastructure.

Implication:

- The underlying SSO plugin can be integrated into the platform.
- A customer-facing self-service administration experience may be built internally or purchased through managed infrastructure.
- Managed self-service pricing and support terms must be treated as a variable vendor dependency.

### SCIM

The official SCIM plugin documentation states that the plugin exposes a SCIM 2.0 server for third-party identity providers and supports organization-scoped connections and tokens.

The documentation also states that Better Auth infrastructure provides a self-service directory-sync dashboard for organization administrators.

Implication:

- The protocol capability and the managed self-service dashboard are distinct concerns.
- The platform must not promise a particular managed onboarding experience without cost and support review.
- Platform authorization must wrap SCIM connection management even where Better Auth provides default role checks.

### Current Managed Pricing Observation

As of the verification date, the official pricing page listed:

- A free managed-infrastructure Starter tier
- A paid Pro tier
- A custom Enterprise tier
- Self-service SSO and Directory Sync on Pro with one included connection followed by a per-connection charge
- Custom Enterprise usage, retention, support, and contractual options

These values are observations, not permanent architectural constants. Do not hard-code current vendor prices into platform editions or long-term forecasts.

### Passkeys

The official passkey plugin documentation states that Better Auth uses WebAuthn/FIDO2-style public-key credentials and supports registration, authentication, platform or cross-platform authenticators, conditional UI, credential listing, naming, and WebAuthn extensions.

Implication:

- Passkeys are technically supported by the selected foundation.
- Relying-party ID, custom-domain, recovery, enrollment, and assurance policy remain platform responsibilities.

### Organizations

The official organization plugin documentation supports organizations, members, teams, roles, permissions, active organization context, and lifecycle hooks.

Implication:

- The plugin is useful for authentication-oriented membership and context.
- It does not replace the platform's canonical tenant, legal-entity, branch, location, Party, entitlement, or authorization models.

## Commercial Decision

Enterprise SSO and SCIM may remain planned platform capabilities, but public pricing and contractual commitments require:

1. A build-versus-managed self-service decision.
2. Current vendor pricing and terms.
3. Support and uptime responsibilities.
4. Data processing and residency review.
5. Migration and export strategy.
6. Customer connection-volume assumptions.

## Official Sources

Verified 2026-07-10:

- Better Auth documentation: `https://better-auth.com/docs`
- SSO plugin: `https://better-auth.com/docs/plugins/sso`
- SCIM plugin: `https://better-auth.com/docs/plugins/scim`
- Passkey plugin: `https://better-auth.com/docs/plugins/passkey`
- Organization plugin: `https://better-auth.com/docs/plugins/organization`
- Better Auth pricing: `https://better-auth.com/pricing`
- Better Auth enterprise page: `https://better-auth.com/enterprise`

## Reverification Trigger

Re-verify when:

- Better Auth releases a major version
- The platform begins an enterprise SSO or SCIM prototype
- Customer pricing is prepared
- A managed-infrastructure contract is considered
- Self-hosted enterprise support is promised
- Pricing, licensing, data processing, or support terms change
