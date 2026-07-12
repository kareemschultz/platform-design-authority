---
document_id: PDA-ARC-011
title: TanStack Decision Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0005]
---

# TanStack Decision Matrix

## Purpose

Define which TanStack projects should be adopted, evaluated, deferred, or avoided for the first platform release when Next.js remains the primary web framework and Expo remains the native mobile framework.

## Decision Summary

| Project | Initial Decision | Primary Use |
|---|---|---|
| TanStack Query | Adopt | Server-state fetching, caching, invalidation, mutations, optimistic workflows |
| TanStack Table | Adopt | Headless enterprise tables and data grids |
| TanStack Virtual | Adopt | Large lists, tables, product catalogs, ledgers, and queues |
| TanStack Form | Controlled adoption after vertical-slice validation | Complex typed forms and validation orchestration |
| TanStack Router | Adopt only for standalone React applications not using Next.js routing | Embedded tools, isolated apps, future shells |
| TanStack Start | Release Candidate; Platform Labs evaluation, not first-release default | Potential future full-stack React framework |
| TanStack Store | Selective evaluation | Fine-grained local client state where React state is insufficient |
| TanStack DB | Research and prototype only | Reactive client data and local-first possibilities |
| TanStack Pacer | Evaluate when rate, debounce, throttle, or queue behavior becomes repetitive | Client interaction pacing |
| TanStack Devtools | Development only | Unified local debugging where stable and safe |

## TanStack Query

### Decision

Adopt as the standard web client library for server state that requires interactive caching or mutation behavior.

### Use It For

- Search results and list pages
- Infinite and paginated queries
- Dashboards and operational queues
- Mutations with cache invalidation
- Optimistic UI where rollback is safe
- Prefetching and background refresh
- Dependent queries and stale-time control
- Hydration around Next.js-rendered experiences where justified

### Do Not Use It For

- Authoritative backend caching
- Long-term offline business storage
- Hiding poor API boundaries
- Global client state unrelated to server data
- Sensitive permission decisions based only on stale cached data

### Next.js Integration

Next.js may render initial data on the server and hydrate TanStack Query where rich client interaction is needed. Not every page requires a Query client. Simple server-rendered pages should remain simple.

## TanStack Table

### Decision

Adopt as the headless standard for advanced web tables.

### Use It For

- Inventory, products, orders, customers, suppliers, employees, ledger views, jobs, and audit records
- Sorting, filtering, grouping, selection, pinning, column visibility, and controlled pagination
- Server-driven tables using API query contracts
- Reusable saved views and role-specific column presets

### Required Platform Layer

Build an internal Data Grid system around TanStack Table that provides:

- Accessibility and keyboard navigation
- Permission-aware fields and actions
- Saved filters and views
- Bulk actions with confirmation and audit
- Export policies
- Loading, empty, error, stale, and offline states
- Responsive alternatives for mobile
- Integration with TanStack Virtual for large datasets

TanStack Table provides state and behavior, not the finished user experience.

## TanStack Virtual

### Decision

Adopt for rendering large visible collections where normal DOM or React Native rendering would create measurable cost.

### Use It For

- Large product and customer lists
- Warehouse task queues
- Audit and activity streams
- Ledger and report previews
- Selectors with thousands of records
- Dense administrative data grids

### Guardrails

- Preserve keyboard and screen-reader usability
- Do not virtualize small lists unnecessarily
- Define stable item measurement and scrolling restoration
- Ensure print and export paths do not depend on the virtualized view

For native applications, use a native-appropriate virtualized list such as FlashList instead of trying to share web rendering code.

## TanStack Form

### Decision

Evaluate through real platform forms, then adopt for new complex forms if the evaluation succeeds.

### Evaluation Forms

- Product with variants and packaging
- Purchase order with line items and tax
- Employee onboarding with effective-dated sections
- Approval-policy builder
- White-label branding editor
- Offline mobile stock count or service form

### Acceptance Criteria

- Strong TypeScript inference
- Accessible field composition
- Synchronous and asynchronous validation
- Server validation mapping
- Arrays, nested records, conditional sections, and wizards
- Draft persistence and recovery
- Performance on large dynamic forms
- Clear error summary and focus management
- Reusable field adapters across the design system

### Comparison

Compare TanStack Form against React Hook Form using the same production-grade forms. Standardize on one default for web rather than allowing every module to choose independently.

## TanStack Router

### Decision

Do not use TanStack Router inside the main Next.js application because Next.js App Router already owns routing, layouts, loading boundaries, metadata, and server integration.

Use TanStack Router for:

- Standalone React applications
- Embedded partner or extension applications
- Internal tools that do not require Next.js
- Experimental future application shells
- Electron or desktop web shells where appropriate

### Route Contract Rule

The platform should define canonical destination identifiers and navigation metadata independently of either Next.js or TanStack Router. This prevents business navigation from becoming permanently coupled to one framework.

## TanStack Start

### Decision

Evaluate in Platform Labs but do not make it the first-release production standard.

Official documentation identified TanStack Start as Release Candidate on 2026-07-12. Its React Server Components implementation is separately experimental and expected to remain so into early v1. Conventional Start and experimental RSC receive separate evidence tracks.

### Evaluation Scope

Build the same small administrative application in Next.js and TanStack Start and compare:

- Server rendering and streaming
- Type-safe routing and data loading
- Middleware and authentication integration
- Better Auth support
- Deployment to containers and edge environments
- Error handling and observability
- Bundle size and performance
- Developer and AI-agent productivity
- Long-term release maturity
- Conventional SSR/server functions without RSC
- Experimental `renderServerComponent` and one Composite Component only after the conventional path passes
- Canonical Hono/oRPC boundary preservation; no direct domain persistence from Start server functions or RSC

### Adoption Trigger

Reconsider the conventional framework after stable v1 and successful vertical-slice evidence. Reconsider RSC only after its experimental label is removed and its Flight serialization, caching, streaming, security, accessibility, observability, and upgrade behavior pass the technique catalog gates.

Detailed technique dispositions live in `docs/blueprint/14-Engineering/ADVANCED_FRONTEND_TECHNIQUE_CATALOG.md`.

## TanStack Store

### Decision

Use only when a clear fine-grained local-state problem cannot be solved cleanly with React state, URL state, TanStack Query, or a small purpose-built store.

Potential uses:

- Complex workspace layout state
- POS interaction state
- Workflow or form-builder state
- Multi-panel operational screens

Do not duplicate server state inside TanStack Store.

## TanStack DB

### Decision

Research only until its maturity and operating model are validated against the platform's offline, synchronization, tenant-isolation, and data-integrity requirements.

Potential future value:

- Reactive client collections
- Optimistic local-first views
- Synchronization abstractions
- Derived client queries

It must not replace the authoritative PostgreSQL domain model or bypass the approved offline synchronization protocol.

## Routing by Application

| Application | Router |
|---|---|
| Main administration web app | Next.js App Router |
| E-commerce storefront | Next.js App Router |
| Customer, supplier, employee, and partner portals | Next.js App Router by default |
| Marketing and public website | Next.js App Router |
| Expo native mobile apps | Expo Router |
| Standalone embedded React extension | TanStack Router |
| Platform Labs full-stack experiment | TanStack Start |

## Shared State Ownership

| State Type | Owner |
|---|---|
| Authoritative business state | Backend domain services and PostgreSQL |
| Interactive web server state | TanStack Query where needed |
| Route and URL state | Next.js App Router or TanStack Router for standalone apps |
| Complex form state | Chosen form standard after evaluation |
| Local ephemeral component state | React |
| Native offline operational state | SQLite and synchronization SDK |
| Theme and user-preference state | Platform configuration with a small client adapter |

## Governance

Every additional TanStack package requires:

- Named use case
- Package owner
- Maturity and maintenance assessment
- Bundle and performance impact
- Accessibility impact
- Security review where data or execution boundaries are affected
- Upgrade and fallback strategy
