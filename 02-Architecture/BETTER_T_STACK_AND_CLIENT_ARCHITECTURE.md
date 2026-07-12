---
document_id: PDA-ARC-010
title: Better-T-Stack and Client Architecture
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0004, ADR-0005, ADR-0006, ADR-0020]
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
- Base UI-backed source-owned shadcn/ui primitives for new components under ADR-0022; Radix remains an approved legacy/fallback primitive
- A private platform design system and design-token package
- TanStack Query
- TanStack Table
- TanStack Virtual
- One approved form library after the TanStack Form versus React Hook Form evaluation
- TanStack Store only where local client state genuinely requires it

Next.js remains the primary web framework because the platform needs mature server rendering, routing, metadata, portals, storefronts, public pages, self-hosting, and a large ecosystem.

Do not place authoritative business logic in Next.js route handlers, Server Actions, or React components. The web application calls the backend application layer through generated contracts.

### TanStack Start

TanStack Start is strategically interesting and was Release Candidate as of 2026-07-12. Evaluate its conventional SSR/server-function path in Platform Labs. Its React Server Components and Composite Components remain experimental and receive a separate Labs-only track.

TanStack Start and Next.js are alternatives at the full-stack framework and routing layer. They should not be mixed inside the same application shell without a specific approved reason.

TanStack Start examples do not authorize direct domain repository or database access from server functions or Server Components. They call the same governed Hono/oRPC application contracts as other clients.

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

The generated Better Auth option selects the framework, not every plugin or generated authorization model. Keep only the composition permitted by `01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`; record exact core and separate plugin versions; review generated schema, endpoints, secrets, hooks, cookies, origins, proxy trust, and migrations; and run the Bun/Node/Hono/Next/Expo compatibility suite.

Better-T-Stack may scaffold Better Auth integration, but generated code must still use the platform identity adapter and must not make Better Auth the owner of:

- Tenant hierarchy
- Canonical Parties
- Business roles and permissions
- Entitlements
- Segregation of duties
- Workforce, customer, or supplier records
- Payment, subscription, referral, managed-audit, or AI capability authority

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

Use the following pinned, dry-run-first scaffold for the controlled prototype:

```powershell
bun create better-t-stack@3.36.3 platform-prototype `
  --frontend next native-bare `
  --backend hono `
  --runtime bun `
  --api orpc `
  --auth better-auth `
  --payments none `
  --database postgres `
  --orm drizzle `
  --db-setup docker `
  --package-manager bun `
  --git `
  --web-deploy docker `
  --server-deploy docker `
  --install `
  --addons pwa turborepo ultracite `
  --examples none `
  --disable-analytics `
  --directory-conflict error `
  --dry-run `
  --verbose
```

Better-T-Stack 3.36.3 dry-run validation passed for this command on 2026-07-12. Remove `--dry-run` only in a disposable prototype workspace after rechecking the pinned release. Do not use `@latest` in the evidence record.

Do not include Tauri in this scaffold: Next + Tauri static export was rejected by the CLI with Docker web deployment. Do not select both Biome and Ultracite. Add Better-T MCP and skills only after generation so they can be reviewed against existing repository governance.

ADR-0020 makes Bun/Hono/oRPC the preferred prototype, with Node/Hono/oRPC as the low-change runtime fallback and NestJS/Fastify as the structured framework alternative. The scaffold still cannot decide production ratification.

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
- Bun/Node compatibility, canonical OpenAPI parity, operational diagnostics, and rollback evidence required by ADR-0020

Measure development speed, accessibility, bundle size, runtime performance, offline reliability, self-hosting, dependency maturity, security, and AI-agent code quality.
