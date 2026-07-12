---
document_id: ADR-0005
title: Adopt Next.js TanStack and Expo for Client Applications
version: 0.3.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0021, ADR-0022]
---

# ADR-0005 — Adopt Next.js, TanStack, and Expo for Client Applications

## Context

The platform requires multiple web applications, customer and partner portals, a future reference storefront, native mobile applications, offline operational clients, white-label shells, dense enterprise tables, and reusable client contracts.

Better-T-Stack provides a modern TypeScript scaffolding system with selectable web, backend, database, authentication, API, monorepo, and mobile options. The TanStack ecosystem provides mature headless libraries and a newer full-stack framework. Expo provides React Native tooling, file-based routing, updates, native modules, SQLite, and native UI access.

## Decision Drivers

- Production maturity for the primary web shell
- Strong support for enterprise tables and server state
- Native and offline mobile capability
- TypeScript code and contract reuse
- Vercel v0 and AI-agent compatibility
- Self-hosting and deployment portability
- White-label design-system support
- Ability to evolve without framework-driven business logic

## Options Considered

### Next.js for web, TanStack libraries selectively, Expo for mobile

Use Next.js as the stable web framework, TanStack Query, Table, and Virtual as headless libraries, and Expo with Expo Router for native applications.

### TanStack Start for all web applications

Provides an integrated TanStack architecture and deployment flexibility, but its release maturity requires additional validation before becoming the primary framework for business-critical applications.

### Separate web and native technology ecosystems

Could optimize each platform independently, but increases duplicated contracts, skills, tooling, and AI-agent context.

## Decision

Adopt:

- Next.js and React for the primary web platform
- TanStack Query, Table, and Virtual as standard client libraries
- A focused production evaluation of TanStack Form and React Hook Form before selecting the default complex-form library
- TanStack Router only for standalone React applications not using Next.js
- TanStack Start Release Candidate as a Platform Labs evaluation, not the initial production standard; its experimental RSC path is evaluated separately
- Base UI-backed source-owned shadcn components as the preferred new web primitive path under ADR-0022
- React Native with Expo and Expo Router for native applications
- Expo UI selectively for native SwiftUI and Jetpack Compose controls
- Better-T-Stack as an approved scaffolding and experimentation tool, not an architecture authority

No form library is selected by this ADR. One default is chosen only after the same production-grade forms are implemented and measured under the TanStack decision matrix.

Create separate web and native component packages backed by shared design tokens, contracts, value objects, capability identifiers, and synchronization protocols.

## Consequences

### Positive

- Mature web and native foundations
- Strong enterprise data-table and client-state tooling
- Shared TypeScript contracts across clients
- Native access and offline support through Expo
- Better-T-Stack can accelerate reproducible scaffolding for humans and AI agents
- TanStack Start remains available as a future alternative without blocking delivery
- The form choice remains evidence-driven rather than ecosystem-driven

### Negative

- Web and native rendered components cannot be shared completely
- Multiple client libraries require dependency governance
- Expo UI introduces platform-specific APIs and must be adopted selectively
- Next.js and Expo release cadences require controlled upgrades
- The backend must remain clearly separated from both client frameworks
- The form abstraction cannot be finalized before the evaluation

## Required Controls

- No authoritative business rules in client code
- Separate `ui-web`, `ui-native`, and `design-tokens` packages
- Accessibility and parity tests for native-specific controls
- Version policy and quarterly framework review
- Offline synchronization contract tests
- Better-T-Stack generated code requires normal architecture and security review
- TanStack Start requires a successful vertical-slice evaluation before reconsideration
- Experimental TanStack Start RSC and Composite Components require separate maturity, serialization, caching, streaming, security, accessibility, observability, and upgrade evidence
- Form evaluation must use product, purchase-order, onboarding, policy-builder, branding, and offline mobile scenarios
- Form choice requires an ADR amendment or a new superseding ADR

## Validation

Validate the client architecture through a vertical slice that runs on web and Expo mobile, includes a dense searchable table, a complex typed form, a transaction, white-label theming, offline SQLite storage, synchronization, tenant and permission enforcement, observability, accessibility, and automated tests.

## Amendment Record

- 2026-07-12: Recorded ADR-0020 prototype-runtime amendment without lifecycle promotion.
