---
document_id: PDA-PLT-003
title: Identity and Authentication
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0006, ADR-0007]
---

# Identity and Authentication

## Purpose

Define how people, services, devices, partners, and external systems prove identity and establish trusted sessions across the platform without confusing authentication accounts with canonical Parties or domain-owned business roles.

## Identity Types

- Human authentication account
- Service identity
- Integration identity
- Device identity
- Temporary support or delegated identity
- AI execution identity

Employee, customer, supplier, contractor, partner, and other business identities are represented by canonical Party plus domain-owned role records. They are not separate authentication identity types merely because they use a portal.

## Ownership Model

Better Auth owns authentication mechanics and session state behind the Platform Identity boundary.

Party owns canonical person and organization identity, names, contact points, addresses, identifiers, relationships, duplicate resolution, and merge.

Domains own role records such as Employment, Customer Relationship Profile, Supplier Commercial Profile, and Partner Account.

`PlatformIdentityLink` connects a Better Auth user to a tenant membership, Party, and optional domain-owned role. It does not transfer ownership of those role records to Identity.

## Core Capabilities

- Email, username, phone, and federated sign-in
- Passwordless and passkey authentication
- Multi-factor authentication
- SAML and OpenID Connect SSO
- SCIM identity provisioning
- Session and device management
- Recovery and account protection
- Service accounts and scoped credentials
- API keys, OAuth applications, and token rotation
- Risk-based and step-up authentication
- Governed links from authentication account to Party and domain roles

## Rules

1. Authentication proves identity; it never grants business authorization by itself.
2. A Better Auth user is not the canonical Party, employee, customer, supplier, or partner record.
3. Credentials are revocable, rotated, and protected according to risk.
4. Sensitive actions may require recent or stronger authentication.
5. Shared user accounts are prohibited except for governed device or kiosk identities.
6. Support impersonation is time-limited, approved, prominently visible, and fully audited.
7. AI agents use explicit service or delegated identities rather than hidden privilege.
8. Tenant policy cannot weaken platform minimums.
9. Authentication lifecycle cannot silently create, merge, suspend, or terminate a domain role.
10. Party merge and privacy transformation preserve identity links and domain-role references through governed workflows.
11. Better Auth plugins are deny-by-default and require an entry in `BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`; catalog or scaffold availability is not approval.
12. Better Auth Organization and Admin roles never replace platform permissions, entitlements, tenant scope, segregation of duties, or approvals.
13. Payment, subscription, referral, managed-audit, agent, and MCP plugins do not transfer ownership from their canonical platform areas.

## Session Requirements

Sessions track authentication identity, tenant or organization hint, assurance level, timestamps, device and client context, revocation, step-up state, and original/delegated actor.

Current Party, role, permission, entitlement, and business-policy context is resolved by platform services and is not permanently trusted from the session alone.

## Recovery

Recovery workflows defend against account takeover and include rate limits, notifications, recovery codes, administrator controls, factor reset governance, Party/role mismatch detection, and audit.

## Canonical Events

Detailed event definitions are owned by `BETTER_AUTH_IDENTITY_ARCHITECTURE.md`. This umbrella document does not define a duplicate event family.

## Availability

Authentication is a critical dependency. Offline POS uses signed, expiring platform authority rather than pretending a cached online session remains current. Identity-provider outage, recovery, and emergency-access behavior must preserve security and tenant isolation.

## Related Specifications

- `docs/blueprint/01-Platform/BETTER_AUTH_IDENTITY_ARCHITECTURE.md`
- `docs/blueprint/01-Platform/PARTY_AND_RELATIONSHIP_MODEL.md`
- `docs/blueprint/01-Platform/AUTHORIZATION_AND_POLICY.md`
- `docs/blueprint/01-Platform/FIRST_SLICE_PERMISSION_CATALOG.md`
- `docs/blueprint/01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`
