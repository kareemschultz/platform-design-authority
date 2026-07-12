---
document_id: ADR-0004
title: Adopt a TypeScript and PostgreSQL Platform Stack
version: 0.3.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0020]
---

# ADR-0004 — Adopt a TypeScript and PostgreSQL Platform Stack

## Context

The platform requires a technology foundation suitable for a large modular business system, multiple user experiences, offline clients, long-running workflows, APIs, integrations, AI tooling, self-hosted deployments, and extensive AI-assisted engineering.

The stack must support fast initial delivery without locking the platform into a serverless-only deployment model or creating unnecessary language and infrastructure fragmentation.

## Decision Drivers

- One primary language across web, backend, workers, SDKs, and tooling
- Strong static typing and contract generation
- Mature relational transaction support
- Modular-monolith compatibility
- Cloud and self-hosted portability
- Good developer and AI-agent ergonomics
- Strong observability, testing, and security ecosystems
- Clear path to event-driven and durable workflow architecture

## Options Considered

### TypeScript throughout, PostgreSQL as the system of record

Next.js and React for web, a Node.js backend application framework, PostgreSQL for transactional data, and selective supporting infrastructure.

### Separate frontend and enterprise backend languages

TypeScript frontend with Java, Kotlin, C#, Go, or another backend runtime. These are strong alternatives, but they create additional model duplication, staffing complexity, and AI-agent context switching during the first phase.

### Serverless-first full-stack framework

Use framework-hosted functions and managed database services as the entire backend. Fast for prototypes, but poorly aligned with durable workflows, self-hosting, long jobs, edge operations, and a large domain model.

## Decision

Adopt TypeScript as the primary platform language and PostgreSQL as the authoritative transactional database.

The preferred initial implementation stack is:

- Next.js and React for web applications
- Bun, Hono, and oRPC as the preferred controlled-prototype backend under ADR-0020, with an active Node.js LTS fallback
- PostgreSQL with explicit type-safe SQL access
- Redis-compatible infrastructure for cache and short-lived coordination
- A transactional outbox for event reliability
- Temporal for durable workflows when the first qualifying workflows are implemented
- S3-compatible object storage
- React Native, Expo, and SQLite for native offline-capable clients
- OpenTelemetry-based observability
- Containers as the standard deployment unit

Managed cloud services may accelerate the SaaS launch, but every critical component must have a portable or self-hostable path.

### Conditional Backend Ratification

The production backend remains conditional until the first vertical-slice benchmark is complete. ADR-0020 places Bun, Hono, and oRPC first in Technical Prototypes 1–3 while retaining Node with Hono/oRPC and NestJS/Fastify as comparison and fallback paths.

The benchmark must compare Bun/Hono/oRPC with the Node fallback and NestJS/Fastify where useful and measure:

- Domain-boundary enforcement
- Testability
- Startup and request performance
- Dependency and abstraction overhead
- OpenAPI and validation ergonomics
- Worker and job integration
- Observability
- Container and self-hosted deployment
- AI-agent code quality and consistency
- Long-term maintainability

Scaffolding convenience does not override architecture. Production adoption of Bun/Hono/oRPC, Node/Hono/oRPC, or NestJS/Fastify requires the recorded benchmark and an acceptance or amendment of this ADR.

## Consequences

### Positive

- Shared types and tooling across most of the platform
- Strong alignment with modern AI coding workflows
- Relational integrity for accounting, payroll, inventory, and business records
- Lower initial language and operating complexity
- Clear path from modular monolith to extracted services
- Good web, mobile, API, and extension ecosystems

### Negative

- CPU-intensive optimization and data-science workloads may require Python or another specialized runtime
- TypeScript discipline and architecture tests are required to avoid weak domain models
- Framework and runtime upgrades require active dependency governance
- PostgreSQL scaling and tenant partitioning must be planned carefully
- The preferred backend framework remains subject to benchmark evidence before ratification

## Required Controls

- No critical domain logic in UI components or framework-specific route handlers
- Domain-owned schemas and explicit contracts
- Architecture dependency tests
- Database migration and rollback standards
- Runtime and framework version policy
- Containerized self-hosting path
- Performance benchmarks before introducing additional infrastructure
- ADR review before adopting a second general backend language or replacing PostgreSQL
- ADR amendment before replacing the preferred production backend framework

## Validation

The decision is validated when the initial vertical slice:

- Runs locally and in a cloud environment with the same core containers
- Enforces tenant isolation
- Publishes reliable events through the outbox
- Executes background work
- Provides generated API contracts
- Demonstrates a recoverable offline workflow
- Produces benchmark evidence for the backend framework decision
