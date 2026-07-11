---
document_id: PDA-ARC-010
title: Better-T-Stack and Client Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0004, ADR-0005, ADR-0006]
---

# Better-T-Stack and Client Architecture

## Purpose

Clarify how Better-T-Stack, Next.js, the TanStack ecosystem, React, React Native, Expo Router, Expo UI, and Better Auth fit into the recommended platform stack.

## Position

Better-T-Stack is an excellent **scaffolding and composition tool**, but it is not the platform architecture itself. It can generate a valid starting workspace and help AI agents reproduce the approved stack, while the Platform Design Authority remains authoritative for boundaries, domain ownership, security, tenancy, entitlements, data integrity, and deployment.

## Recommended Client Stack

### Primary Web Platform

Use:

- React on the current approved stable major
- Next.js App Router on the current approved stable major
- TypeScript
- Tailwind CSS
- Radix UI primitives
- A private platform design system and design-token package
- TanStack Query
- TanStack Table
- TanStack Virtual
- One approved form library after the TanStack Form versus React Hook Form evaluation
- TanStack Store only where local client state genuinely requires it

Next.js remains the primary web framework because the platform needs mature server rendering, routing, metadata, portals, storefronts, public pages, self-hosting, and a large ecosystem.

Do not place authoritative business logic in Next.js route handlers, Server Actions, or React components. The web application calls the backend application layer through generated contracts.

### TanStack Start

TanStack Start is strategically interesting and should be evaluated in Platform Labs, especially for highly interactive internal applications and future deployment targets. It is not the primary web framework for the first production release while its release maturity remains below the approved production baseline.

TanStack Start and Next.js are alternatives at the full-stack framework and routing layer. They should not be mixed inside the same application shell without a specific approved reason.

### TanStack Libraries

Adopt the TanStack ecosystem selectively:

- **Query** for client-side server-state caching, invalidation, mutations, retries, and optimistic workflows
- **Table** for enterprise data grids, headless table state, sorting, filtering, grouping, and controlled rendering
- **Virtual** for high-volume lists, product catalogs, ledger views, warehouse queues, and large administrative tables
- **Form** only after production validation against accessibility, complex field arrays, server validation, draft recovery, and offline needs
- **Router** for standalone React or embedded applications that are not built with Next.js
- **Start** as an evaluated alternative framework, not a dependency of the Next.js application
- **Store** only for a named local-state problem that React and Query do not solve cleanly
- **DB** as research only until its local-first and synchronization model is validated

Avoid adopting every TanStack package merely because it belongs to the same ecosystem. Each package must have an owned use case and upgrade policy.

## Mobile Platform

Use:

- React Native
- Expo on the current approved stable SDK
- Expo Router for file-based native and web routing
- EAS Build, Submit, Update, and device distribution where commercially appropriate
- Expo SQLite for offline operational data
- Expo SecureStore for device secrets and protected session material
- React Native Reanimated, Gesture Handler, Screens, Safe Area Context, and FlashList where appropriate
- Shared TypeScript contracts, validation schemas, design tokens, and synchronization SDKs

### Expo UI

Use `@expo/ui` selectively for platform-native SwiftUI and Jetpack Compose controls where native fidelity materially improves the experience.

Do not make Expo UI the only mobile component foundation initially. The platform still needs a stable cross-platform component layer for shared workflows.

Expo UI may be used for:

- Native date and time selection
- Platform-native settings and forms
- Context menus, sheets, menus, toggles, and controls
- iOS- or Android-specific experiences
- White-label shells that benefit from platform-native styling

Every Expo UI adoption must define platform parity, accessibility, fallback behavior, testing, and upgrade risk.

## Mobile Design System

Create:

- `packages/design-tokens` for semantic color, typography, spacing, radius, motion, status, and brand tokens
- `packages/ui-web` for web primitives and composed business components
- `packages/ui-native` for React Native components
- Optional native adapters that wrap Expo UI
- Shared interaction and accessibility specifications rather than attempting to share every rendered component

Business components such as Money, Quantity, Product Picker, Party Picker, Approval Status, Audit Timeline, and Sync Status should share contracts and behavior across web and native while allowing platform-appropriate rendering.

## Better Auth Integration

Better Auth is selected under ADR-0006 for authentication, accounts, sessions, 2FA, passkeys, and approved protocol plugins.

Better-T-Stack may scaffold Better Auth integration, but generated code must still use the platform identity adapter and must not make Better Auth the owner of:

- Tenant hierarchy
- Canonical Parties
- Business roles and permissions
- Entitlements
- Segregation of duties
- Workforce, customer, or supplier records

## Better-T-Stack Usage

Better-T-Stack may be used to:

- Scaffold the initial monorepo
- Reproduce approved application shells for AI agents
- Create prototypes and isolated technical spikes
- Generate Expo applications
- Configure Turborepo, linting, formatting, Git hooks, documentation, and supported tooling
- Compare Hono, Fastify, Drizzle, Kysely, and other options in controlled experiments
- Scaffold the selected Better Auth foundation through the approved adapter boundary

Better-T-Stack must not:

- Decide domain architecture
- Generate unrestricted shared database access
- Become the source of truth for dependency versions
- Replace repository templates, ADRs, threat models, or quality gates
- Cause generated demo patterns to enter critical financial, inventory, payroll, authorization, identity, or offline code without review

## Initial Scaffold Recommendation

Use Better-T-Stack for an initial experimental scaffold with approximately this shape:

```text
Frontend: Next.js
Native: Expo with Expo Router
Runtime: active Node.js LTS
Backend: Fastify-compatible application shell
Database: PostgreSQL
Database access: evaluate generated Drizzle scaffold, then apply the approved Kysely or explicit SQL standard
Authentication: Better Auth behind the platform identity adapter
Monorepo: Turborepo with pnpm
API: REST and OpenAPI as the authoritative public contract
Internal RPC: prototype only unless separately approved
Add-ons: approved formatter, linter, Git hooks, documentation tooling, and agent skills
```

Because Better-T-Stack may generate Fastify but not the selected NestJS structure directly, two controlled paths exist:

1. Generate client and workspace shells, then add the preferred NestJS/Fastify backend manually.
2. Use a plain Fastify or Hono comparison prototype as part of ADR-0004's conditional validation.

The scaffold cannot decide the production framework. ADR-0004 remains authoritative and must be amended if benchmark evidence changes the decision.

## Shared-Code Rules

Share:

- Canonical API and event contracts
- Validation schemas
- Permission and capability identifiers
- Design tokens
- Formatting and localization utilities
- Offline synchronization protocol
- Domain-safe value objects with no framework dependency

Do not share:

- Web DOM components with native screens
- Database repositories with clients
- Server secrets or provider SDKs
- Framework-specific navigation code
- Business logic that can execute differently on untrusted clients

## Evaluation Gates

Before ratifying the client and application stack, build one end-to-end vertical slice containing:

- Better Auth sign-in and session management through the platform adapter
- Tenant and workspace selection
- Product search using TanStack Query and Table or Virtual
- One complex form implemented in both candidate form libraries
- POS or inventory transaction
- Offline Expo client using SQLite
- Synchronization and conflict handling
- Permission and entitlement enforcement
- White-label theme application
- Audit and OpenTelemetry traces
- Playwright and native integration tests
- Backend framework benchmark evidence required by ADR-0004

Measure development speed, accessibility, bundle size, runtime performance, offline reliability, self-hosting, dependency maturity, security, and AI-agent code quality.
