---
document_id: PDA-ARC-009
title: Recommended Technology Stack
version: 0.6.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0004, ADR-0005, ADR-0006, ADR-0020, ADR-0021, ADR-0022, ADR-0023, ADR-0024]
---

# Recommended Technology Stack

## Purpose

Define the initial technology direction for a modular, multi-tenant, white-label, AI-native Business Operating Platform that begins as a modular monolith and evolves toward independently deployed services only where evidence justifies the change.

## Authority and Precedence

This document is a stack summary. Where a technology is governed by an ADR, the ADR is authoritative. Later ADRs supersede conflicting recommendations here and this document must be revised promptly.

Current governing decisions:

- ADR-0004: TypeScript, PostgreSQL, modular application stack
- ADR-0005: Next.js, selective TanStack adoption, Expo client architecture
- ADR-0006: Better Auth as the authentication and session foundation
- ADR-0020: Bun, Hono, and oRPC preferred for controlled prototypes with a Node fallback

## Stack Principles

- Prefer proven, well-supported technology for business-critical paths.
- Keep one primary language across web, API, jobs, tooling, and SDKs where practical.
- Preserve self-hosting and cloud portability.
- Optimize for AI-assisted development, type safety, testability, observability, and maintainability.
- Do not couple core business logic to Vercel, a single cloud provider, billing provider, identity provider, or AI provider.
- Use managed infrastructure where it accelerates delivery without becoming the only deployment path.
- Keep exact dependency versions in an implementation compatibility record rather than treating this architectural document as a lockfile.

## Recommended Baseline

### Primary Language

Use **TypeScript** across frontend, backend, shared contracts, SDKs, workers, scripts, and most extension tooling.

Use Python selectively for data science, model evaluation, optimization, document intelligence, and specialized machine-learning workloads—not as a second general backend stack.

### Monorepo

- Bun workspaces and package manager for the preferred prototype; Node-compatible manifests remain required
- Turborepo for build orchestration and caching

Suggested structure:

```text
apps/
  web/
  api/
  worker/
  scheduler/
  storefront/
  admin/
  mobile/
packages/
  domain-*/
  engine-*/
  platform-*/
  design-tokens/
  ui-web/
  ui-native/
  contracts/
  sdk/
  testing/
  config/
```

### Web Applications

- Next.js App Router on the current approved stable major
- React on the current approved stable major
- TypeScript
- Tailwind CSS
- Base UI-backed source-owned shadcn/ui primitives for new components, with Radix supported for proven existing components
- TanStack Query for interactive server-state workflows
- TanStack Table and TanStack Virtual for advanced data experiences
- One approved web-form standard after the TanStack Form versus React Hook Form evaluation

Next.js is the default for administration, portals, storefronts, onboarding, and public pages. Authoritative domain behavior remains in backend application services rather than React components, route handlers, or Server Actions.

The form standard is **not yet decided**. `02-Architecture/TANSTACK_DECISION_MATRIX.md` owns the evaluation criteria and result.

### Backend Application

- Bun on the exact approved prototype release, with active Node.js LTS as the supported fallback
- Hono as the thin HTTP shell
- oRPC for typed transport and OpenAPI-compatible handling
- REST-first public APIs with OpenAPI
- Internal command and query application contracts
- Webhooks and versioned events

Bun/Hono/oRPC is the preferred Technical Prototypes 1–3 path under ADR-0020, not a production ratification. Critical packages remain runtime-neutral, critical suites run on Bun and Node where portable, and the Node image stays buildable. NestJS/Fastify remains a structured alternative if Hono fails architecture or operability gates. `02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md` owns the comparison.

### Primary Database

Use PostgreSQL 18 on the current approved security patch as the authoritative transactional database under ADR-0024. PostgreSQL 18.4 was current at the 2026-07-12 verification date; implementation pins the approved patch and immutable image/package digest.

Database rules:

- Domain-owned schemas or clearly enforced table ownership
- UUID or time-sortable opaque internal identifiers
- Human-readable business references stored separately
- Append-oriented ledgers for finance, inventory, payroll, usage, and audit
- Transactional outbox for reliable event publication
- Read replicas, partitioning, and specialized extensions only when justified by evidence

Extension baseline:

- `pg_stat_statements` as the only always-preloaded module
- `pg_trgm` only when an approved fuzzy-search index is implemented
- Native PostgreSQL `uuidv7()` instead of UUID-generation extensions
- pgvector, `pg_durable`, PostGIS, pgAudit, scheduling, partition-management, time-series, distributed, and replication extensions only after their named admission trigger

See `02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md`.

### Database Access

Recommended baseline:

- Kysely for type-safe SQL and explicit control
- node-postgres as the PostgreSQL driver
- Controlled SQL migrations with rollback and compatibility policy

Drizzle may be evaluated in generated Better-T-Stack prototypes. Prisma may be used in isolated prototypes or simple tooling, but no ORM may become mandatory for complex accounting, inventory, payroll, authorization, or reporting without query and migration evidence.

### Cache, Coordination, and Short Jobs

- Redis or a compatible approved implementation for cache, rate limits, ephemeral coordination, and short-lived locks where unavoidable
- BullMQ for lightweight background jobs during early implementation

Redis is never an authoritative business-data store.

### Durable Workflows

Use Temporal when the first workflow requires durable timers, retries, compensation, long-running execution, or reliable multi-step orchestration.

PostgreSQL domain records remain authoritative for business state. Temporal owns workflow execution state, not domain truth.

Evaluate `pg_durable` 0.2.x only in Platform Labs for bounded database-local maintenance, ETL, and projection workflows under ADR-0023. It does not replace Temporal, application workers, or the transactional outbox and may not directly mutate cross-domain state.

### Events and Messaging

Initial phase:

- PostgreSQL transactional outbox
- Worker-based event dispatcher
- In-process contracts for approved synchronous calls

Growth phase:

- NATS JetStream as the preferred event and messaging backbone when extraction, fan-out, replay, or independent scaling requires it

Do not introduce Kafka before measured volume, retention, stream-processing, or ecosystem needs justify its operating cost.

### Search

Initial phase:

- PostgreSQL full-text search and trigram indexes for bounded domain search

Growth phase:

- OpenSearch for global search, faceting, large-scale indexing, audit search, and advanced relevance

Search indexes are non-authoritative projections. Semantic search ownership must be defined jointly by Search and the AI architecture.

### Object Storage

- S3-compatible object storage
- AWS S3 for the initial managed-cloud path
- A compatible self-hosted implementation for controlled deployments

All object access passes through platform authorization and signed, expiring access.

### Mobile and Offline

- React Native with Expo
- Expo Router
- Expo SQLite for local operational data
- Expo SecureStore or native keychain facilities for secrets and session material
- A shared TypeScript synchronization SDK
- Selective PWA continuity workflows
- Selective Expo UI adapters for SwiftUI and Jetpack Compose controls

Offline is declared per capability. Initial candidates include POS, warehouse scanning, mobile inventory, field service, and attendance.

### Identity and Authentication

**Better Auth is the selected authentication, account, and session foundation under ADR-0006.**

Use Better Auth for approved combinations of:

- Email/password and passwordless sign-in
- Sessions and account lifecycle
- Two-factor authentication
- Passkeys
- Social sign-in and account linking
- Organization-aware authentication context
- OIDC, OAuth, SAML, SCIM, API keys, device authorization, and OIDC-provider scenarios after validation

The first-slice composition is intentionally minimal and deny-by-default. Use `01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md` before adding any official, managed-infrastructure, partner, or community plugin. Payment/subscription plugins do not own platform or tenant business billing; Agent Auth and MCP do not own platform AI authority; Better Auth Organization/Admin roles do not own business authorization.

Better Auth v1.6.23 was the current stable release observed on 2026-07-12. Exact core and separate plugin package versions are pinned together and tested across Bun, Node fallback, Hono, Next.js, Expo, Drizzle, and PostgreSQL 18. The official Hono integration proves a Web `Request`/`Response` mounting shape, not complete Bun runtime compatibility.

The platform retains ownership of tenant hierarchy, canonical parties, business roles, permissions, scopes, entitlements, segregation of duties, approvals, and risk policy.

Better Auth managed infrastructure is optional. The framework remains self-hosted in the application architecture. Self-service SSO, directory sync, managed audit, security detection, and vendor support may create variable recurring costs and must be represented in commercial cost models rather than assumed free.

Keycloak is not the default strategic identity system. It may be evaluated later as an interoperability, migration, or customer-mandated integration—not as a competing primary identity foundation without a new ADR.

### Observability

- OpenTelemetry for traces, metrics, and log correlation
- Prometheus-compatible metrics
- Grafana dashboards
- Loki-compatible logs
- Tempo-compatible tracing
- Sentry or equivalent application error monitoring during early phases

Telemetry must include tenant and correlation context while excluding protected or secret data.

### Testing

- Bun test for Bun-specific and fast unit coverage, plus portable contract/domain suites that also run on the approved Node test path
- Playwright for browser journeys
- Testcontainers for PostgreSQL, Redis, NATS, and integration dependencies
- Pact or an equivalent where independently deployed consumers appear
- k6 for load and performance testing
- Accessibility automation plus manual assistive-technology review
- Tenant-isolation, entitlement, permission, and offline-reconciliation test suites

### API and Schema Tooling

- OpenAPI for public REST contracts
- JSON Schema or an approved equivalent for events, registries, and extension manifests
- Generated TypeScript SDKs
- Zod or an approved schema library at trust boundaries

GraphQL is not the initial primary public API. It may be introduced later for governed analytical or partner scenarios.

### Infrastructure and Deployment

Local development:

- Docker Compose
- Seeded PostgreSQL, Redis, object storage, mail capture, and observability

Initial SaaS:

- Containers on a managed container platform
- Managed PostgreSQL
- Managed Redis-compatible service
- S3-compatible storage
- CDN and web application firewall

Growth and enterprise:

- Kubernetes only when multi-region, workload isolation, self-hosting, or operating scale justify it
- Helm and GitOps when Kubernetes is adopted

### Cloud Strategy

AWS is the preferred initial cloud candidate because of its relational, object-storage, networking, security, regional, and enterprise-procurement capabilities.

Vercel may host Next.js previews and selected production web surfaces, but backend services, durable jobs, workflows, databases, and events remain separately deployable. The Next.js application must also support container deployment.

### CI/CD and Repository Controls

- GitHub Actions
- Conventional commits
- Automated format, lint, type, architecture, migration, documentation, security, and test gates
- Software bill of materials
- Signed production artifacts
- Protected deployment environments
- Preview environments for workflow and UX review
- Machine-readable document, domain, capability, event, and permission registries
- GitHub Issues/Projects as live work authority, one branch/worktree/PR per independently mergeable issue, and Changesets for implementation-monorepo release metadata

### Documentation Platform

- Fumadocs as the preferred repository-owned documentation portal prototype
- Local Markdown/MDX for product, administrator, developer, troubleshooting, and release content
- Canonical OpenAPI-generated API reference
- Self-hosted Orama search initially
- Stable documentation IDs for contextual in-app help

### Security Tooling

- Renovate or Dependabot
- CodeQL
- Secret scanning
- Dependency and container vulnerability scanning
- SBOM generation
- Policy-as-code for infrastructure and deployment
- Continuous tenant-isolation and authorization testing

### AI Platform

- Provider-neutral AI gateway and model registry
- AI orchestration engine using ordinary application commands
- Tool authorization through normal permissions, entitlements, policy, and approvals
- Permission-filtered retrieval
- pgvector in PostgreSQL as the initial vector option
- Evaluation datasets, scoring, red-team testing, and release gates
- Explicit prompt, model, tool, cost, approval, provenance, and audit records

Do not add a separate vector database before measured retrieval or scale requirements justify it.

## Version Policy

- Use active supported runtime and framework releases.
- Maintain exact versions and compatibility status in implementation manifests and lockfiles.
- Record a `verified_as_of` date for architectural capability claims.
- Review major framework and runtime support quarterly.
- Avoid canary, alpha, preview, or release-candidate dependencies in accounting, inventory, payroll, authorization, offline synchronization, or other critical paths unless isolated in Platform Labs.
- Record major stack changes through ADRs.
- Update `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md` for every material version, compatibility, workaround, breaking-change, or fallback finding.

## Explicitly Avoid Initially

- Microservices for every domain
- Kafka before demonstrated need
- Kubernetes before operational justification
- Multiple general-purpose backend languages
- Direct domain-database access from UI applications
- Business rules in React components or framework route handlers
- Vendor-specific serverless functions as the only backend path
- GraphQL as the only public API
- Event sourcing across every domain
- A bespoke durable workflow runtime when Temporal satisfies the requirement
- A separate vector database without measured need
- Treating Better-T-Stack output as architecture authority

## Revisit Triggers

Review this stack when:

- A selected component fails its vertical-slice benchmark
- A component reaches documented performance or scale limits
- Self-hosted customers require another deployment path
- A domain needs separate fault, scaling, or security isolation
- Licensing or provider risk changes materially
- AI, offline, event, search, or analytical workloads exceed the chosen foundation

## Official References Verified 2026-07-10

- Better Auth documentation: `https://better-auth.com/docs`
- Better Auth SSO plugin: `https://better-auth.com/docs/plugins/sso`
- Better Auth SCIM plugin: `https://better-auth.com/docs/plugins/scim`
- Better Auth pricing and managed infrastructure: `https://better-auth.com/pricing`
- Better Auth complete verification: `19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`
- Better Auth plugin matrix: `01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`
- Next.js App Router documentation: `https://nextjs.org/docs/app`
- TanStack documentation: `https://tanstack.com`
- Expo Router: `https://docs.expo.dev/router/introduction/`
- Expo UI: `https://docs.expo.dev/versions/latest/sdk/ui/`
