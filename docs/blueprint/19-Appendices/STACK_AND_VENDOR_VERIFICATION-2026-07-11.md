---
document_id: PDA-APP-011
title: Stack and Vendor Verification 2026-07-11
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
verified_as_of: 2026-07-11
---

# Stack and Vendor Verification — 2026-07-11

## Purpose

Record current official-source observations that materially affect technology, licensing, implementation, and product claims. Versions and commercial terms remain time-sensitive and must be reverified before implementation or contracting.

## Better Auth

### Verified

- Better Auth provides a first-party SCIM plugin distributed as `@better-auth/scim`.
- The plugin exposes SCIM 2.0 server endpoints and supports organization-scoped provider connections and bearer tokens.
- Better Auth Infrastructure adds an optional self-service directory-sync dashboard; this managed dashboard is distinct from the open protocol plugin.
- The SSO plugin supports OIDC, OAuth 2.0 providers, and SAML 2.0.
- Protocol capability must not be confused with paid managed self-service onboarding.

### Platform Implication

The platform may self-host the protocol plugins while implementing its own governed administration UX. Managed infrastructure remains a build-versus-buy decision, not an architectural prerequisite.

### Official Sources

- `https://better-auth.com/docs/plugins/scim`
- `https://better-auth.com/docs/plugins/sso`
- `https://better-auth.com/pricing`

## TanStack Start

### Verified Position

TanStack Start remains suitable for evaluation, but the primary web architecture must not assume it is the production-standard replacement for Next.js until the project reaches a stable release and passes the platform's vertical-slice evaluation.

### Official Source

- `https://tanstack.com/start/latest/docs/framework/react/overview`

## Expo UI

### Verified

Expo documentation for SDK 56 and later documents `@expo/ui` as available native SwiftUI and Jetpack Compose components, including universal and platform-specific component families. The platform should no longer describe the entire Expo UI package as merely alpha.

Individual Expo Router and SDK components may still carry ALPHA or BETA labels and must be evaluated separately.

### Official Sources

- `https://docs.expo.dev/versions/v56.0.0/sdk/ui/`
- `https://docs.expo.dev/versions/latest/sdk/ui/`

## Tailwind CSS

### Verified

Tailwind CSS current official documentation is on the v4 line and provides theme variables, responsive design, dark mode, container and layout utilities, state variants, and Vite integration.

The repository policy therefore specifies the latest approved stable Tailwind release rather than hard-coding a perpetual version number. Dependency upgrades remain pinned and tested.

### Official Source

- `https://tailwindcss.com/docs/installation/using-vite`

## shadcn/ui and Recharts

### Verified

The current shadcn chart component uses Recharts and intentionally exposes composition close to the underlying chart library. It is a source-owned component pattern, not an opaque hosted chart service.

### Platform Implication

Use shadcn chart composition plus Recharts for ordinary operational visualizations. Introduce specialized libraries only when a defined requirement cannot be met cleanly and after accessibility, performance, licensing, and portability review.

### Official Source

- `https://ui.shadcn.com/docs/components/chart`

## Runtime and Infrastructure Watch List

The following must be reverified when implementation begins:

- Active Node.js LTS line
- Current supported PostgreSQL major version
- Redis licensing and the Valkey alternative
- Temporal server and SDK compatibility
- NATS JetStream release and licensing
- OpenSearch compatibility
- Better-T-Stack release and generated dependency choices

Architecture documents describe roles and boundaries; implementation lockfiles and compatibility matrices will record exact versions.

## Verification Classification

- **Verified fact:** supported directly by official source at the verification date.
- **Inference:** architectural consequence drawn from verified facts.
- **Recommendation:** selected platform direction subject to ADR and prototypes.
- **Unknown:** requires provider, legal, commercial, or implementation evidence.

## Reverification Triggers

- Before starting the corresponding technical prototype
- Before a major dependency or framework upgrade
- Before customer pricing or enterprise-feature commitments
- Before self-hosted support promises
- When an official release changes maturity, license, or commercial terms
