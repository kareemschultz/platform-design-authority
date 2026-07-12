---
document_id: PDA-APP-017
title: Better Auth Complete Documentation and Plugin Verification - 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0006, ADR-0007, ADR-0016, ADR-0019, ADR-0020]
---

# Better Auth Complete Documentation and Plugin Verification — 2026-07-12

## Purpose and Method

Record a reproducible, dated review of the current Better Auth release, official v1.6 documentation, plugin catalog, integrations, managed infrastructure, and project consequences. This evidence updates but does not overwrite `BETTER_AUTH_VERIFICATION-2026-07-10.md`.

Primary sources only were used: the official Better Auth website and documentation, the official `better-auth/better-auth` repository and release, and the documentation source tree. Search summaries, videos, community posts, and model memory were not treated as evidence.

“Complete” means the official documentation navigation and every official plugin page visible in the repository were inventoried and classified. It does not mean every option on every page was copied into this repository, nor does it substitute for implementation testing, a security assessment, or review of future releases.

The source-tree snapshot contained 180 MDX documents: 37 authentication pages, 13 concept pages, 9 adapter pages, 19 integration pages, 43 plugin files including nested API Key pages and indexes, 8 Infrastructure pages, 12 guides, 27 reference pages, 5 examples, 3 AI-resource pages, and the top-level introduction, comparison, installation, and basic-usage pages. Counts describe the observed source snapshot and may change independently of a stable package release.

## Release Observation

| Item | Observation | Consequence |
|---|---|---|
| Latest GitHub release | `v1.6.23`, published 2026-06-29 | Pin the implementation lock to an explicitly reviewed release; reverify at scaffold time. |
| Release change | Added Yandex social provider; fixed Drizzle affected-row counting for D1 and `postgres-js`; fixed Stripe organization subscription actions that could affect the wrong organization; fixed CLI Drizzle schema escaping | Adapter and payment plugin regressions can be security or tenant-boundary relevant. Review full changelog and run targeted regressions for every upgrade. |
| Documentation line | Official site labels v1.6 as latest | Architectural evidence is for the v1.6 family, not unreleased main-branch behavior. |
| License/product model | Framework described as free and open source; managed Infrastructure priced separately | Self-hosted framework selection does not imply managed dashboard, messaging, security detection, SSO self-service, or directory-sync service adoption. |

Official release: `https://github.com/better-auth/better-auth/releases/tag/v1.6.23`

## Documentation Coverage

The review covered these official documentation families:

| Family | Topics examined | Project consequence |
|---|---|---|
| Get started and reference | installation, basic usage, configuration, options, errors, security | Configuration is code and requires exact version, secrets, origins, cookies, proxy trust, errors, and upgrade review. |
| Concepts | API, CLI, client, cookies, database, email, hooks, OAuth, plugins, rate limiting, sessions, TypeScript, users/accounts | Better Auth is a framework and plugin host, not the platform's Party, tenancy, authorization, entitlement, audit, or communication owner. |
| Authentication | email/password, providers and social sign-in | Methods are enabled individually after account-linking, recovery, enumeration, privacy, delivery, and provider evidence. |
| Database/adapters | PostgreSQL, Drizzle, Prisma and other adapters | PostgreSQL 18 plus Drizzle is the selected prototype path; generated schema and migrations remain reviewed platform artifacts. |
| Integrations | Hono, Next.js, Expo and the broader official integration catalog | Hono/Next/Expo are supported integration shapes, but Bun runtime compatibility and platform boundary behavior still require prototype tests. |
| Infrastructure | dashboard, audit logs, Sentinel, email and SMS | Optional paid managed services; not intrinsic to the self-hosted framework and not authoritative platform services. |
| Plugins | every first-party page listed below | Availability is not approval; `PDA-PLT-028` governs adoption. |
| Guides and AI resources | migration, adapter/plugin creation, AI-readable docs | Useful implementation aids only; current official source verification remains mandatory for agents. |

Documentation root: `https://better-auth.com/docs`

The authentication catalog included email/password plus Apple, Atlassian, Amazon Cognito, Discord, Dropbox, Facebook, Figma, GitHub, GitLab, Google, Hugging Face, Kakao, Kick, LINE, Linear, LinkedIn, Microsoft, Naver, Notion, Paybin, PayPal, Polar, Railway, Reddit, Roblox, Salesforce, Slack, Spotify, TikTok, Twitch, Twitter/X, Vercel, VK, WeChat, Zoom, and the other-social-provider path. This is an availability inventory, not an adoption list; each provider remains conditional and receives its own claims, email-trust, account-linking, privacy, outage, consent, branding, callback, and recovery review.

The adapter catalog included PostgreSQL, Drizzle, Prisma, SQLite, MySQL, Microsoft SQL Server, MongoDB, other relational databases, and community adapters. The integration catalog included Astro, Convex, Electron, Elysia, Encore, Expo, Express, Fastify, Hono, Lynx, NestJS, Next.js, Nitro, Nuxt, React Router, SolidStart, SvelteKit, TanStack Start, and Waku. Only the selected PostgreSQL, Drizzle experiment, Hono, Next.js, and Expo paths were examined deeply for project consequences; catalog presence is not compatibility evidence for the chosen Bun stack.

## Core Security Findings

The official v1.6 security and session documentation states or demonstrates:

- Passwords use `scrypt` by default and hashing is configurable.
- Versioned secret rotation supports current and prior keys, with lazy re-encryption behavior for legacy encrypted data.
- Database or secondary-storage sessions default to seven-day expiry and one-day update age unless configured otherwise.
- CSRF defenses include non-simple requests, origin checks, Fetch Metadata for first-login cases, secure cookie behavior, and OAuth state/PKCE.
- `disableCSRFCheck` removes CSRF protection. In v1.6, `disableOriginCheck` removes redirect/callback validation and also disables CSRF protection for backward compatibility.
- Cookies are HTTP-only and `SameSite=Lax` by default; secure behavior follows HTTPS. Cross-domain and cross-subdomain changes alter the threat model.
- Rate limiting exists, but correct client IP depends on explicitly trusted proxy/header configuration.
- Trusted origins support exact, wildcard, custom-scheme, and dynamic entries. Broad patterns and per-request lookup increase review burden.
- OAuth/OIDC outbound token, refresh, introspection, and JWKS requests refuse redirects, reducing one SSRF path.
- Cookie session caching trades database reads for revocation staleness: a revoked session can remain accepted on another device until cache expiry unless forced revalidation is used.

Project disposition: use explicit production origin/proxy/cookie configuration; never disable security checks; use database-backed sessions; keep cache off until staleness is accepted and tested; force current session and platform authority evaluation for sensitive operations.

Sources:

- `https://better-auth.com/docs/reference/security`
- `https://better-auth.com/docs/concepts/session-management`
- `https://better-auth.com/docs/concepts/rate-limit`
- `https://better-auth.com/docs/concepts/cookies`

## Database and Runtime Findings

The official Drizzle adapter supports PostgreSQL dialect configuration and Better Auth CLI schema generation. It is the selected scaffold experiment, not yet the ratified persistence library. Generated output is an input to review, not permission to bypass platform migration ownership. v1.6.23 included a Drizzle-related fix, so exact adapter regressions matter.

The official Hono integration mounts the raw Better Auth handler for `GET` and `POST`, requires CORS middleware ordering before routes, and describes credentialed cross-origin and cross-domain cookie behavior. The integration example uses a Node server, so it does not by itself prove every path on Bun. ADR-0020 therefore keeps Bun preferred for prototypes with a Node LTS fallback.

The official Expo integration requires the separate Expo client integration and platform-aware cookie/deep-link handling. Native secure storage, link ownership, custom schemes, device loss, and revocation remain platform test obligations.

Sources:

- `https://better-auth.com/docs/adapters/drizzle`
- `https://better-auth.com/docs/adapters/postgresql`
- `https://better-auth.com/docs/integrations/hono`
- `https://better-auth.com/docs/integrations/next`
- `https://better-auth.com/docs/integrations/expo`

## Official Plugin Inventory

The published v1.6 plugin navigation and official documentation source were compared. The repository contained a Chargebee page not present in the observed published navigation; it is recorded rather than silently omitted. The detailed project decision and controls for every row are in `PDA-PLT-028`.

| Family | Official pages inventoried | Project summary |
|---|---|---|
| Authentication | Two-Factor Authentication, Passkey, Magic Link, Email OTP, Phone Number, Anonymous, Username, One Tap, Sign In With Ethereum, Generic OAuth | Adopt 2FA and passkeys; conditional username/Email OTP/Generic OAuth; defer or avoid the rest until a requirement and threat model exist. |
| Context and administration | Multi Session, Last Login Method, Admin, Organization | Only behind the platform adapter. Better Auth roles and organization data are not canonical business authority. |
| Enterprise | SSO, SCIM | Preserve enterprise seams and prototype later; keep protocol support separate from paid self-service/managed service. |
| Agent/developer protocols | Agent Auth, API Key, JWT, Bearer, One-Time Token, OAuth Proxy, OAuth 2.1 Provider, OIDC Provider, MCP, Device Authorization | Agent Auth and OIDC Provider carry explicit stability cautions; developer protocols remain deferred/conditional seams under Developer Platform authority. |
| Security and utility | CAPTCHA, Have I Been Pwned, i18n, Open API, Test Utils, Dub | Conditional security/privacy review; i18n constrained; OpenAPI development-only; Test Utils test-only; avoid auth-coupled referral tracking. |
| Payment/subscription | Stripe, Polar, Autumn, Creem, Dodo Payments, Chargebee, Commet | Avoid for platform and tenant business billing because they violate existing Payment, Commerce, Commercial, and Entitlement ownership. |
| Managed Infrastructure | Dash/dashboard, audit logs, Sentinel, email/SMS | Optional vendor services, not core plugins or authoritative platform systems. |
| Community | Community plugin catalog | Deny-by-default pending provenance, license, maintainer, data-flow, security, compatibility, rollback, and ownership review. |

Official catalog sources:

- `https://better-auth.com/docs/plugins`
- `https://github.com/better-auth/better-auth/tree/main/docs/content/docs/plugins`

Every official page is addressable as `https://better-auth.com/docs/plugins/<slug>` using these verified slugs:

`2fa`, `passkey`, `magic-link`, `email-otp`, `phone-number`, `anonymous`, `username`, `one-tap`, `siwe`, `generic-oauth`, `multi-session`, `last-login-method`, `admin`, `organization`, `sso`, `scim`, `agent-auth`, `api-key`, `jwt`, `bearer`, `one-time-token`, `oauth-proxy`, `oauth-provider`, `oidc-provider`, `mcp`, `device-authorization`, `stripe`, `polar`, `autumn`, `creem`, `dodopayments`, `chargebee`, `commet`, `captcha`, `have-i-been-pwned`, `i18n`, `open-api`, `test-utils`, and `dub`.

## High-Risk Plugin Findings

### Organization and Admin

Both plugins include roles/permissions and powerful lifecycle operations. Organization can manage invitations, membership, roles, teams, and deletion; Admin can manage users, roles, bans, sessions, passwords, email, deletion, and impersonation. Their default roles cannot be trusted as the platform's business authorization model. All powerful operations require platform permission, tenant scope, recent authentication, approval/reason where required, and audit wrappers.

### SSO and SCIM

The first-party SSO plugin covers SAML and OIDC integration, while SCIM provides provisioning. Plugin protocol capability is distinct from Better Auth Infrastructure's paid self-service SSO and Directory Sync connection management. SCIM's built-in organization-role checks do not replace platform permissions; personal-connection behavior and provider ownership need explicit restriction.

### Agent Auth, MCP, and Provider Plugins

Agent Auth is described by its own documentation as an implementation of a protocol under heavy development and not yet stable. It can derive capabilities from OpenAPI and proxy execution, which is incompatible with the platform rule that AI uses explicitly registered application commands and ordinary authority controls unless a governed adapter filters every operation. Keep it in isolated labs.

The OIDC Provider page says the plugin is in active development and may be unsuitable for production. The broader OAuth 2.1 Provider has a large authorization-server, client, consent, token, claims, and resource-server surface; it remains deferred until a Developer Platform ADR and real relying-party requirement.

### Payment Plugins

Auth-triggered subscription convenience does not justify moving ownership. The v1.6.23 Stripe fix for actions involving the wrong organization is a concrete reminder that billing context and tenant authority are high-impact. Existing ADRs and specifications keep payment rails, Platform Subscription, tenant recurring commerce, and entitlements outside Better Auth.

## Managed Infrastructure and Pricing Observation

On 2026-07-12 the official pricing page described the framework as free/open source and the managed Infrastructure tiers as Starter free, Pro USD 20/month, and Enterprise custom. It also showed usage/connection charges and add-ons, including managed audit/security usage, transactional email/SMS, self-service SSO and Directory Sync connections, custom dashboard domain, and log drain.

These figures are volatile evidence, not a quote or architecture guarantee. Reverify pricing, currency, taxes, contract, DPA, data residency, retention, support, service levels, export, deletion, and exit before commercial modeling or procurement.

Sources:

- `https://better-auth.com/pricing`
- `https://better-auth.com/docs/infrastructure/introduction`

## Decisions Propagated

- Created `PDA-PLT-028`, the deny-by-default plugin and feature matrix.
- Amended ADR-0006 to select a minimal first-slice plugin set and make catalog availability non-authoritative.
- Amended Better Auth and umbrella identity specifications with exact security, runtime, plugin, and ownership controls.
- Added Better Auth v1.6.23 and upgrade lessons to the technology lifecycle ledger.
- Added the matrix to mandatory agent lookups so future agents cannot enable a plugin from memory or scaffold defaults.

## Evidence Gaps and Recheck Triggers

- Exact implementation lockfile and compatibility across Better Auth, separate plugin packages, Drizzle, PostgreSQL 18, Bun, Hono, Next.js, Expo, and native storage.
- Production schema and endpoint diff for the selected plugin set.
- Independent threat model, penetration test, dependency/advisory scan, and recovery exercise.
- Provider-specific OAuth/OIDC/SAML/SCIM interoperability, certificates, claims, logout, suspension, and drift reconciliation.
- Email/SMS provider, deliverability, privacy, and abuse controls.
- Commercial/legal review for optional Better Auth Infrastructure and external plugin providers.
- Accessibility and usability evidence for enrollment, challenge, recovery, passkeys, device approval, and impersonation UX.

Recheck when Better Auth publishes a new stable release, a selected plugin changes package or maturity, an advisory affects authentication, the implementation lock changes, a new authentication method/provider is requested, or any managed service is proposed.
