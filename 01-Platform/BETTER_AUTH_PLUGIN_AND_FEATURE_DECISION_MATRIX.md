---
document_id: PDA-PLT-028
title: Better Auth Plugin and Feature Decision Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0006, ADR-0007, ADR-0016, ADR-0019]
---

# Better Auth Plugin and Feature Decision Matrix

## Purpose

Govern which Better Auth core features, official plugins, managed-infrastructure plugins, and community plugins the platform may use. Availability in the Better Auth catalog is not architectural approval.

This matrix is based on Better Auth v1.6.23 and the official v1.6 documentation verified on 2026-07-12 in `19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`.

## Decision Vocabulary

| Decision | Meaning |
|---|---|
| Adopt | Include in the controlled first-slice prototype and prove the named controls. |
| Constrained adopt | Use only behind the Platform Identity adapter with the limitations in this matrix. |
| Seam | Preserve a contract and test seam without promising production depth. |
| Conditional | Enable only after a named use case, risk review, and implementation evidence. |
| Labs | Research or isolated prototype only; no production dependency. |
| Defer | Do not implement in the first slice. Re-evaluate when the named trigger exists. |
| Avoid | Do not use for the described platform responsibility. A new ADR is required to reverse this position. |

## Non-Negotiable Boundary

Better Auth owns authentication accounts, credentials, authentication protocols, and session mechanics behind the Platform Identity boundary. It does not own canonical Party identity, tenant hierarchy, domain roles, business permissions, entitlements, segregation of duties, approvals, AI authority, payment orchestration, Platform Subscription billing, or tenant customer commerce.

Every enabled plugin must be registered in the implementation dependency manifest with exact version, package, schema changes, secrets, endpoints, hooks, data classification, owner, rollback, and regression tests. Plugins are deny-by-default until present in this matrix and enabled by the Platform Identity composition root.

## Core Foundation

| Feature | Decision | First-slice depth | Platform rule and required proof |
|---|---|---:|---|
| Email/password, verification, reset, account linking | Adopt | Full | Enumeration resistance, delivery abuse controls, link expiry, provider-account collision tests, recovery audit, and session revocation. |
| PostgreSQL storage | Adopt | Full | Better Auth tables remain Platform Identity-owned and are tested on the exact PostgreSQL 18 lock. |
| Drizzle adapter | Prototype/evaluate | Prototype | Generated schema is reviewed and migrated by the platform migration system. Ratification depends on adapter, transaction, migration, ownership, and fallback evidence; it does not select Drizzle for business-domain persistence. |
| Database-backed cookie sessions | Adopt | Full | Revocation, expiry, refresh, fresh-session checks, horizontal scale, and outage behavior. Do not place current business permissions or entitlements in durable session claims. |
| Cookie cache or secondary session storage | Conditional | Prototype | Default off until revocation-staleness, sensitive-operation bypass, tenant context, cache isolation, and outage tests set an acceptable maximum staleness. |
| Social providers | Conditional | Prototype | Enable providers individually after account-linking, email-verification, provider outage, consent, privacy, custom-domain, and recovery tests. |
| Hooks and additional fields | Constrained adopt | Full | Hooks call platform application services or transactional-outbox writers. Additional user/session fields contain authentication context only, not authoritative Party or authorization state. |
| Built-in rate limiting | Constrained adopt | Full | Defense in depth only. Platform edge and application abuse controls remain authoritative; trusted client-IP headers and proxy chain are configured explicitly. |

## Official Plugin Catalog

| Plugin | Decision | Depth or trigger | Platform-specific rationale and controls |
|---|---|---|---|
| Two-Factor Authentication | Adopt | Full prototype | Prove TOTP enrollment verification, encrypted secrets, backup-code lifecycle, lockout, trusted-device policy, recovery, passwordless/federated coverage, and step-up mapping. |
| Passkey | Adopt | Full prototype | Prove RP ID/origin policy, WebAuthn user verification, credential inventory/revocation, lost-device recovery, account linking, Expo/native behavior, and whether a ceremony satisfies the required assurance level. |
| Username | Conditional | Named customer need | Avoid duplicate identities and enumeration. Normalize, reserve, rename, recover, and link usernames to the same Better Auth user. |
| Magic Link | Defer | Passwordless UX decision | Adds email-channel takeover, forwarding, replay, expiry, and link-scanner risks; do not enable merely because available. |
| Email OTP | Conditional | Approved recovery/sign-in policy | Requires delivery, rate limit, replay, expiry, enumeration, and recovery evidence. It is not automatically a phishing-resistant factor. |
| Phone Number | Defer | Verified regional/provider need | Requires SMS provider, SIM-swap, number recycling, cost, privacy, deliverability, and recovery controls. A phone number is not canonical Party identity. |
| Anonymous | Avoid | New product ADR | Guest-to-account merging and anonymous business actions conflict with the governed tenant and Party model unless a bounded use case is designed. |
| One Tap | Defer | Approved Google acquisition flow | Provider-specific UX must not bypass account-linking, consent, tenant-selection, or white-label policy. |
| Sign In With Ethereum | Avoid | New product ADR | No first-slice business requirement; adds wallet identity and recovery semantics outside the selected identity model. |
| Generic OAuth | Conditional | Provider not supported natively | Each provider needs discovery/endpoint, PKCE/state, claims, email trust, account-linking, outage, and security review. |
| Multi Session | Defer | Multi-account switching requirement | Account switching is not tenant switching. Prove visible active identity, tab behavior, delegated context, audit, and destructive-action confirmation first. |
| Last Login Method | Constrained adopt | Prototype UX | Treat as a local UX hint only; never disclose sensitive provider information or use it as current authentication assurance. |
| Admin | Constrained adopt | Full prototype | Never expose the plugin's default `admin` role as platform authority. Wrap all operations in platform permissions, tenant scope, recent authentication, reason, approval where required, duration, visible impersonation state, and audit. |
| Organization | Constrained adopt | Prototype/seam | May provide authentication membership and active-context mechanics. Platform Tenancy remains authoritative; Better Auth roles never replace canonical permissions or entitlements. Deletion and invitation endpoints require platform policy wrappers. |
| SSO | Seam | Enterprise prototype | Support OIDC/SAML proof after provider metadata, domain discovery, certificate rotation, JIT mapping, account linking, fallback, audit, and tenant-scoped administration are tested. Protocol plugin and paid self-service infrastructure are separate decisions. |
| SCIM | Seam | Enterprise prototype | Scope tokens and connections to one governed tenant; platform permissions wrap connection management. Provision membership only through mapping policy and never silently create or terminate domain role records. |
| Agent Auth | Labs | Stable protocol and ADR review | Official docs say the protocol implementation is under heavy development and not stable. It also overlaps platform AI capabilities and authorization; no derived OpenAPI operation becomes an agent capability by default. |
| API Key | Seam | Developer Platform prototype | Platform Developer APIs own scopes, tenant binding, issuance policy, hashing, prefixes, expiry, rotation, last-used metadata, revocation, quotas, and audit. Do not equate Better Auth key metadata with business permissions. |
| JWT | Conditional | External verifier requirement | Prefer opaque revocable sessions internally. Define issuer, audience, algorithm, JWKS rotation, expiry, revocation/staleness, claims minimization, and permission re-evaluation before use. |
| Bearer | Conditional | Cookie-incompatible client only | Official docs warn to use cautiously. Never convert a browser session cookie into a broadly reusable bearer credential without a bounded audience and threat model. |
| One-Time Token | Conditional | Bounded secure handoff | Purpose-bind, hash/encrypt as appropriate, set short expiry, single use, audience, replay protection, redaction, and audit. Do not invent business approval tokens. |
| OAuth Proxy | Conditional | Preview/custom-domain OAuth proof | Use only for a documented callback-domain constraint; validate state, redirect allowlists, proxy trust, availability, and production exit path. |
| OAuth 2.1 Provider | Defer | Developer Platform authorization-server ADR | Broad protocol and consent surface. Scope-to-permission mapping must preserve platform authorization and resource-server enforcement. |
| OIDC Provider | Labs | Stable production evidence | Official docs mark it active development and potentially unsuitable for production. Prefer evaluating the OAuth 2.1 Provider when a real provider use case exists. |
| MCP | Defer | Governed Developer Platform MCP design | Authentication is only one layer. Tool discovery and execution still require canonical application commands, permissions, entitlements, approvals, tenant scope, audit, and AI safety policy. |
| Device Authorization | Seam | CLI/limited-input prototype | Validate client IDs, HTTPS, polling limits, code expiry, user confirmation, audience, scopes, revocation, and device audit. This is not the POS offline-authority mechanism. |
| CAPTCHA | Conditional | Abuse evidence | Use through a provider adapter after accessibility, privacy, regional availability, outage, bot-efficacy, and fallback review. CAPTCHA does not replace rate limiting or risk controls. |
| Have I Been Pwned | Conditional | Password-policy prototype | Review k-anonymity/network behavior, failure mode, privacy, latency, rate limits, false assurance, and user messaging. It supplements rather than replaces password controls. |
| i18n | Constrained adopt | Prototype | Platform localization owns approved user-facing messages. Map safe Better Auth errors to platform message keys; never expose internal error details. |
| Open API | Conditional | Development/docs only | Generated Better Auth endpoint documentation may support review, but it does not replace the canonical platform OpenAPI contract or endpoint-permission registry. Prevent accidental public exposure. |
| Test Utils | Adopt | Test only | Use only in a separate test auth composition. Never include privileged helpers in the production auth configuration. |
| Dub | Avoid | Marketing attribution ADR | Authentication hooks must not silently introduce referral tracking, cross-context identifiers, or a new processor. |

## Payment and Subscription Plugins

| Plugin | Decision | Reason |
|---|---|---|
| Stripe | Avoid for platform billing and tenant commerce | Payment owns provider rails; Commercial owns Platform Subscription; Commerce owns tenant customer recurring agreements. The v1.6.23 release fixed wrong-organization subscription actions, reinforcing the need to avoid auth-owned billing. |
| Polar | Avoid for platform billing and tenant commerce | Same ownership boundary; no selected provider requirement. |
| Autumn | Avoid for platform billing and tenant commerce | Entitlements remain a platform service and are evaluated separately from authentication. |
| Creem | Avoid for platform billing and tenant commerce | Same ownership boundary; external provider adoption requires its own evidence and ADR. |
| Dodo Payments | Avoid for platform billing and tenant commerce | Same ownership boundary; provider plugins cannot define business payment contracts. |
| Chargebee | Avoid for platform billing and tenant commerce | Same ownership boundary; the page exists in the source documentation but was not in the published v1.6 plugin navigation observed on the evidence date. |
| Commet | Avoid for platform billing and tenant commerce | Same ownership boundary; no first-slice requirement. |

## Managed Infrastructure Plugins

`dash`, managed dashboard, managed audit logs, and `sentinel` are optional Better Auth Infrastructure capabilities, not requirements for the self-hosted framework.

| Capability | Decision | Rule |
|---|---|---|
| Dash/dashboard | Defer | Platform Administration remains the control plane. Evaluate only after data residency, processor, access, retention, export, SSO, pricing, incident, and exit reviews. |
| Managed audit logs | Avoid as authoritative audit | Platform Audit remains authoritative. A managed feed may be supplementary only with reconciliation and retention policy. |
| Sentinel/security detection | Conditional | May augment platform risk controls after telemetry, false-positive, privacy, regional, availability, response, and cost evaluation. It cannot be the sole authentication defense. |
| Managed email/SMS | Conditional | Communications owns delivery/provider policy. Evaluate as one adapter, not an identity-owned business communication system. |

The pricing observed on 2026-07-12 is recorded as evidence, not a durable commercial promise. Reverify before costing or contracting.

## Community Plugins

Community plugins are deny-by-default. Adoption requires an owner, source and maintainer review, license and provenance check, release cadence and advisory review, schema and endpoint inventory, secret and data-flow review, threat model, exact version pin, compatibility tests, rollback, and an ADR when they change a platform boundary. A community listing is not Better Auth support or platform approval.

## Runtime and Integration Controls

### Bun and Hono

- Mount both `GET` and `POST` Better Auth handlers under the owned authentication route.
- Register narrowly scoped CORS before routes; use exact origins and credentials only where required.
- Validate Better Auth cryptography, cookies, WebAuthn, OAuth, email, adapters, migrations, proxy headers, shutdown, and telemetry on the exact Bun lock.
- Preserve a Node LTS execution fallback under ADR-0020.

### Next.js

- Keep the Better Auth server instance in server-only code.
- Treat framework cookie helpers and server actions as adapters, not authorization enforcement.
- Revalidate current platform permissions and entitlements in the application layer.

### Expo and Native

- Use the official Expo integration only after secure storage, deep-link/custom-scheme allowlists, cookie exchange, origin behavior, app-link/universal-link, account recovery, device loss, and refresh/revocation tests.
- Never persist business permission authority merely because a native session is cached.

## Security Baseline

1. Pin Better Auth and every separate `@better-auth/*` or partner package; do not use an unreviewed `latest`.
2. Set explicit base URL, HTTPS production origins, exact trusted origins, cookie attributes, proxy/IP trust, secret handling and rotation, and route-level rate limits.
3. Never enable `disableCSRFCheck` or `disableOriginCheck` in production. The latter also disables CSRF protection in v1.6.
4. Prefer host-only `SameSite=Lax` cookies. Cross-subdomain or cross-site cookies require a dedicated threat model and test.
5. Keep cookie session cache disabled for high-risk operations or force database revalidation; cached revocation is not immediate on other devices.
6. Map safe authentication events through the transactional outbox without logging credentials, secrets, OTPs, tokens, cookies, recovery codes, or excessive provider claims.
7. Configure trusted proxy addresses/headers explicitly; never accept spoofable forwarded client IP, host, or protocol values.
8. Review schema and endpoint diffs for every plugin addition and Better Auth upgrade.
9. Run tenant isolation, account linking, recovery, revocation, concurrency, replay, enumeration, open redirect, CSRF, SSRF/provider discovery, and audit tests.

## Change Gate

Any change to this matrix requires:

1. Current official documentation and release verification.
2. Dependency, schema, endpoint, secret, data-flow, and commercial impact inventory.
3. Platform owner and boundary review.
4. Security, privacy, tenant-isolation, operational, accessibility, offline, and testing disposition as applicable.
5. Updated ADR/specification, lifecycle ledger, and dated evidence.
6. Registry generation and strict validation.

## Related Documents

- `18-Decisions/ADR-0006-BETTER-AUTH-AS-AUTHENTICATION-FOUNDATION.md`
- `01-Platform/BETTER_AUTH_IDENTITY_ARCHITECTURE.md`
- `01-Platform/IDENTITY_AND_AUTHENTICATION.md`
- `01-Platform/AUTHORIZATION_AND_POLICY.md`
- `01-Platform/TENANCY_AND_ORGANIZATIONS.md`
- `07-Developer-Platform/PUBLIC_API_AND_APPLICATION_REGISTRATION.md`
- `11-Security/THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md`
- `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`
