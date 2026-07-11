---
document_id: ADR-0005
title: Adopt Next.js TanStack and Expo for Client Applications
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0005 — Adopt Next.js, TanStack, and Expo for Client Applications

## Context

The platform requires multiple web applications, customer and partner portals, storefronts, native mobile applications, offline operational clients, white-label shells, dense enterprise tables, and reusable client contracts.

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

Provides an integrated TanStack architecture and deployment flexibility, but its current release maturity requires additional validation before becoming the primary framework for business-critical applications.

### Separate web and native technology ecosystems

Could optimize each platform independently, but increases duplicated contracts, skills, tooling, and AI-agent context.

## Decision

Adopt:

- Next.js and React for the primary web platform
- TanStack Query, Table, and Virtual as standard client libraries
- TanStack Form after a focused production evaluation
- TanStack Router only for standalone React applications not using Next.js
- TanStack Start as a Platform Labs evaluation, not the initial production standard
- React Native with Expo and Expo Router for native applications
- Expo UI selectively for native SwiftUI and Jetpack Compose controls
- Better-T-Stack as an approved scaffolding and experimentation tool, not an architecture authority

Create separate web and native component packages backed by shared design tokens, contracts, value objects, capability identifiers, and synchronization protocols.

## Consequences

### Positive

- Mature web and native foundations
- Strong enterprise data-table and client-state tooling
- Shared TypeScript contracts across clients
- Native access and offline support through Expo
- Better-T-Stack can accelerate reproducible scaffolding for humans and AI agents
- TanStack Start remains available as a future alternative without blocking delivery

### Negative

- Web and native rendered components cannot be shared completely
- Multiple client libraries require dependency governance
- Expo UI introduces platform-specific APIs and must be adopted selectively
- Next.js and Expo release cadences require controlled upgrades
- The backend must remain clearly separated from both client frameworks

## Required Controls

- No authoritative business rules in client code
- Separate `ui-web`, `ui-native`, and `design-tokens` packages
- Accessibility and parity tests for native-specific controls
- Version policy and quarterly framework review
- Offline synchronization contract tests
- Better-T-Stack generated code requires normal architecture and security review
- TanStack Start requires a successful vertical-slice evaluation before reconsideration

## Validation

Validate the decision through a vertical slice that runs on web and Expo mobile, includes a dense searchable table, a transaction, white-label theming, offline SQLite storage, synchronization, tenant and permission enforcement, observability, and automated tests.
