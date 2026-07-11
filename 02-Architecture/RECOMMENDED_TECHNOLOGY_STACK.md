---
document_id: PDA-ARC-009
title: Recommended Technology Stack
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0004]
---

# Recommended Technology Stack

## Purpose

Define the initial technology stack for building a modular, multi-tenant, white-label, AI-native Business Operating Platform that can begin as a modular monolith and evolve toward independently deployed services only where justified.

## Stack Principles

- Prefer boring, proven, well-supported technology for business-critical systems.
- Keep one primary language across web, API, jobs, tooling, and SDKs where practical.
- Preserve self-hosting and cloud portability.
- Optimize for AI-assisted development, type safety, testability, and maintainability.
- Do not couple core business logic to Vercel, a single cloud provider, or a single AI provider.
- Use managed services initially where they accelerate delivery without blocking future portability.

## Recommended Baseline

### Primary Language

**TypeScript** across frontend, backend, shared contracts, SDKs, workers, scripts, and most extension tooling.

Why:

- One language reduces context switching and duplicated models.
- Strong typing helps protect large domain contracts.
- Excellent support from AI coding tools.
- Broad ecosystem for web, APIs, workflows, testing, and integrations.

Use Python selectively for data science, model evaluation, optimization, and specialized machine-learning workloads—not as a second general backend stack.

### Monorepo

- **pnpm** workspaces
- **Turborepo** for build orchestration and caching

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
  ui/
  contracts/
  sdk/
  testing/
  config/
```

### Web Applications

- **Next.js 16 App Router**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI primitives** with a private platform design system
- **TanStack Query** for client-side server-state workflows where needed
- **React Hook Form** and schema validation for complex forms

Use Next.js for the administrative platform, portals, storefront, onboarding, and public pages. Keep domain behavior in backend application services rather than embedding critical rules in server actions.

### Backend Application

- **Node.js 24 LTS**
- **NestJS** using the **Fastify** adapter
- REST-first public APIs with OpenAPI
- Internal command/query application contracts
- Webhooks and versioned events

NestJS provides strong modular organization, dependency injection, guards, interceptors, validation, and testing conventions that suit the modular-monolith architecture. Fastify provides an efficient HTTP runtime.

### Primary Database

- **PostgreSQL 18**

Use PostgreSQL as the authoritative transactional database because the platform requires relational integrity, strong transactions, flexible indexing, JSON support, row-level security options, partitioning, full-text features, and mature operational tooling.

Database rules:

- Domain-owned schemas or clearly enforced table ownership
- UUID or time-sortable opaque internal identifiers
- Human-readable business references stored separately
- Append-oriented ledgers for finance, inventory, payroll, and audit
- Transactional outbox for reliable event publication
- Read replicas and partitioning only when justified by evidence

### Database Access

Recommended:

- **Kysely** for type-safe SQL and explicit control
- **node-postgres** as the underlying PostgreSQL driver
- SQL migration files managed through a controlled migration tool

Do not hide complex accounting, inventory, payroll, or reporting behavior behind an ORM that makes generated queries difficult to inspect. Prisma may still be evaluated for simpler modules, prototypes, or generated tooling, but should not become mandatory across the platform without a benchmark and migration review.

### Cache, Coordination, and Short Jobs

- **Redis** for cache, rate limiting, distributed locks where unavoidable, ephemeral sessions, and short-lived coordination
- **BullMQ** for lightweight background jobs during the earliest implementation phase

Redis must not become an authoritative business-data store.

### Durable Workflows

- **Temporal** for long-running workflows, approvals, retries, timers, compensation, and reliable multi-step orchestration

Temporal should be introduced when the first workflows require durable execution rather than recreated as a bespoke workflow runtime. Domain state remains authoritative in PostgreSQL; Temporal owns workflow execution state.

### Events and Messaging

Initial phase:

- PostgreSQL transactional outbox
- Worker-based event dispatcher
- In-process contracts where synchronous communication is appropriate

Scale phase:

- **NATS JetStream** as the preferred event and messaging backbone

Do not introduce Kafka initially unless event volume, retention, stream processing, or ecosystem requirements clearly justify its operational cost.

### Search

Initial phase:

- PostgreSQL full-text search and trigram indexes for bounded domain search

Growth phase:

- **OpenSearch** for global search, faceting, large-scale indexing, audit search, and advanced relevance

Search indexes remain non-authoritative projections.

### Object Storage

- S3-compatible object storage
- AWS S3 for managed cloud deployments
- MinIO or another compatible implementation for self-hosted environments

All access must use platform authorization and signed, expiring links.

### Mobile and Offline

- **React Native with Expo** for native mobile applications
- **SQLite** for encrypted local operational storage
- A shared TypeScript synchronization SDK
- Web PWA support for selected browser-based continuity workflows

Do not attempt to make every administrative screen offline-capable. Design offline support per capability, beginning with POS, warehouse scanning, field service, attendance, and mobile inventory.

### Identity

Build a provider-neutral identity boundary using OpenID Connect, OAuth 2.1, SAML, SCIM, passkeys, MFA, and service identities.

Recommended deployment options:

- Managed identity provider for the first SaaS release
- **Keycloak** as the strategic self-hosted option

The platform authorization and policy engine remains internal and must not be delegated entirely to the identity provider.

### Observability

- **OpenTelemetry** for traces, metrics, and logs correlation
- **Prometheus** for metrics
- **Grafana** for dashboards
- **Loki** or compatible log storage
- **Tempo** or compatible tracing backend
- **Sentry** for application error monitoring during early phases

Use tenant and correlation context while preventing protected data from entering telemetry.

### Testing

- **Vitest** for unit and module tests
- **Playwright** for end-to-end browser tests
- **Testcontainers** for PostgreSQL, Redis, NATS, and integration dependencies
- **Pact** or equivalent contract testing where independently deployed consumers appear
- **k6** for load and performance tests
- Accessibility automation plus manual assistive-technology review

### API and Schema Tooling

- OpenAPI for public REST contracts
- JSON Schema or equivalent for events and extension manifests
- Generated TypeScript SDKs
- Zod or a similar schema library at trusted application boundaries

Do not expose GraphQL as the primary public API initially. It may be added later for governed analytical or partner use cases where it produces clear value.

### Infrastructure and Deployment

Local development:

- Docker Compose
- Seeded local PostgreSQL, Redis, object storage, mail capture, and observability

Initial SaaS production:

- Containers on a managed container platform
- Managed PostgreSQL
- Managed Redis
- S3-compatible storage
- CDN and web application firewall

Growth and enterprise:

- Kubernetes where multi-region, self-hosting, workload isolation, and operational scale justify it
- Helm charts and GitOps deployment

Do not begin with Kubernetes solely for appearance. Preserve container portability from day one and adopt Kubernetes when operational needs are real.

### Cloud Strategy

Recommended initial cloud: **AWS**, because the platform will likely need mature relational databases, object storage, networking, queues, observability integrations, regional deployment options, and enterprise procurement support.

Vercel may host Next.js preview and production web surfaces, but the authoritative backend, durable jobs, workflows, databases, and event processing should remain separately deployable. The platform must also support running the Next.js application in containers for self-hosted and controlled-enterprise environments.

### CI/CD and Repository Controls

- GitHub Actions
- Changesets or an equivalent package-versioning process
- Conventional commits
- Automated formatting, linting, type checking, architecture checks, tests, migration checks, security scanning, SBOM generation, and documentation validation
- Preview environments for UI and workflow review
- Signed production artifacts and protected deployment environments

### Security Tooling

- Dependabot or Renovate
- CodeQL
- Secret scanning
- Container and dependency vulnerability scanning
- Software bill of materials
- Policy-as-code for deployment and infrastructure checks
- Regular tenant-isolation, authorization, and abuse-case test suites

### AI Platform

- Provider-neutral AI gateway and model registry
- Tool contracts implemented through normal application commands
- Retrieval over permission-filtered platform data
- Vector storage initially through **pgvector** in PostgreSQL
- Separate evaluation service and datasets
- Explicit prompt, model, tool, cost, approval, and provenance records

Avoid introducing a standalone vector database until scale or retrieval requirements exceed PostgreSQL and pgvector.

## Recommended Version Policy

- Use active LTS runtimes.
- Pin major versions and define supported upgrade windows.
- Review framework upgrades quarterly.
- Avoid canary or preview features in accounting, inventory, payroll, authorization, offline synchronization, or other critical paths.
- Record every major stack change through an ADR.

## Explicitly Avoid Initially

- Microservices for every module
- Kafka before demonstrated need
- Kubernetes before operational justification
- Multiple general-purpose backend languages
- Direct database access from Next.js UI code
- Business logic in React components
- Vendor-specific serverless functions as the only backend architecture
- GraphQL as the only public API
- Event sourcing across every domain
- A bespoke workflow engine when Temporal can satisfy the requirement
- A separate vector database without measured need

## Revisit Triggers

Review this stack when:

- A component reaches documented performance or scale limits
- Self-hosted customers require alternative deployment paths
- A module needs separate fault or security isolation
- Licensing or provider risk changes materially
- AI, offline, event, or analytical workloads exceed the chosen foundation
