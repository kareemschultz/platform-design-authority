---
document_id: ADR-0004
title: Adopt a TypeScript and PostgreSQL Platform Stack
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
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

Next.js and React for web, NestJS and Node.js for backend services, PostgreSQL for transactional data, and selective supporting infrastructure.

### Separate frontend and enterprise backend languages

TypeScript frontend with Java, Kotlin, C#, or Go backend. Strong backend alternatives, but creates additional model duplication, staffing complexity, and AI-agent context switching during the first phase.

### Serverless-first full-stack framework

Use Next.js server functions and hosted database services as the entire backend. Fast for prototypes, but poorly aligned with durable workflows, self-hosting, long jobs, edge operations, and a large domain model.

## Decision

Adopt TypeScript as the primary platform language and PostgreSQL as the authoritative transactional database.

The initial implementation stack will use:

- Next.js and React for web applications
- NestJS with Fastify on Node.js LTS for backend application services
- PostgreSQL with explicit type-safe SQL access
- Redis for cache and short-lived coordination
- A transactional outbox for event reliability
- Temporal for durable workflows when the first qualifying workflows are implemented
- S3-compatible object storage
- React Native and SQLite for native offline-capable clients
- OpenTelemetry-based observability
- Containers as the standard deployment unit

Managed cloud services may accelerate the SaaS launch, but every critical component must have a portable or self-hostable path.

## Consequences

### Positive

- Shared types and tooling across most of the platform
- Strong alignment with Vercel v0, Codex, Claude Code, and modern AI coding workflows
- Relational integrity for accounting, payroll, inventory, and business records
- Lower initial operational complexity
- Clear path from modular monolith to extracted services
- Good web, mobile, API, and extension ecosystems

### Negative

- CPU-intensive optimization and data-science workloads may require Python or another specialized runtime
- TypeScript discipline and architecture tests are required to avoid weak domain models
- NestJS and Next.js upgrades require active dependency governance
- PostgreSQL scaling and tenant partitioning must be planned carefully

## Required Controls

- No critical domain logic in UI components or framework-specific route handlers
- Domain-owned schemas and explicit contracts
- Architecture dependency tests
- Database migration and rollback standards
- Runtime and framework version policy
- Containerized self-hosting path
- Performance benchmarks before introducing additional infrastructure
- ADR review before adopting a second general backend language or replacing PostgreSQL

## Validation

The decision is validated when the initial vertical slice can run locally and in a cloud environment with the same core containers, supports tenant isolation, publishes reliable events, executes background work, provides generated API contracts, and demonstrates a recoverable offline workflow.
