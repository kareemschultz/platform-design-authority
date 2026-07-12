---
document_id: PDA-ENGR-012
title: Architecture Dependency Rules
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0002, ADR-0003, ADR-0020]
---

# Architecture Dependency Rules

## Purpose

Define machine-enforceable package, module, import, persistence, and contract rules that preserve the modular-monolith boundaries.

## Package Families

```text
apps/*
packages/foundation/*
packages/platform/*
packages/engines/*
packages/domains/*
packages/contracts/*
packages/ui-web/*
packages/ui-native/*
packages/design-tokens/*
packages/integrations/*
packages/tooling/*
```

Exact package names are finalized during implementation scaffolding, but the dependency direction is normative.

## Allowed Dependency Direction

### Applications

May depend on application contracts, platform client adapters, UI packages, and composition roots. Applications do not import domain repositories or database schemas.

### Foundation

Contains dependency-light value objects and utilities such as identifiers, money, quantity, time, result types, validation primitives, and telemetry contracts.

Foundation may not depend on platform services, engines, domains, UI, providers, or applications.

### Platform Services

May depend on Foundation and their own contracts. A platform service may expose contracts consumed by engines and domains. It may not import a business-domain repository.

### Shared Engines

May depend on Foundation, approved Platform contracts, their own implementation, and explicitly published domain-neutral contracts. Engines may not write domain-owned persistence directly.

### Business Domains

May depend on Foundation, approved Platform contracts, Shared Engine contracts, and published contracts from other domains. A domain may not import another domain's repositories, private entities, migrations, or tables.

### Contracts

Contain versioned commands, queries, events, DTOs, schemas, and capability identifiers. Contracts may depend only on Foundation and schema libraries approved for boundary use.

Family-level entries in `registry/architecture-rules.json` are a conservative graph envelope, not permission to import implementations. A reference to Platform, Shared Engine, or another Domain means its published contract package only unless a narrower adapter family is explicitly registered.

### UI Packages

May depend on design tokens, UI utilities, generated client contracts, and application-facing types. They may not contain authoritative business rules or server persistence.

### Integrations

Provider adapters depend on stable platform-facing adapter interfaces. Provider SDK types do not cross into authoritative domain models.

## Prohibited Imports

- `domains/<A>/...repository` from domain B
- `domains/<A>/...persistence` from any other domain
- Database client imports from route, UI, or provider-adapter packages
- Better Auth database tables from business domains
- Provider SDK models inside domain entities
- Commercial plan names inside authorization logic
- Feature-flag keys inside entitlement policy
- AI prompt or tool packages importing repositories directly
- Self-hosted or cloud-specific infrastructure code from domain packages
- Bun globals or Bun-only APIs from Foundation, Contracts, Platform application logic, Shared Engine logic, or Domain logic
- Hono request/context objects outside application transport adapters and composition roots
- oRPC transport objects outside application transport adapters and generated-client boundaries
- Database adapters from domain/application contracts or authorization-policy packages

## Persistence Rules

- Every table has one owning module.
- Cross-domain foreign keys are avoided unless explicitly reviewed; stable identifiers and application contracts are preferred.
- Read projections may join governed data but remain non-authoritative.
- Database migrations are owned by the module whose data changes.
- Shared database deployment does not permit shared-table mutation.

## Cross-Domain Interaction

Use one of:

- Synchronous query contract for current information
- Synchronous command contract when the target owner must decide the mutation
- Versioned event for completed facts and eventual reaction
- Governed analytical projection for reporting
- Workflow orchestration for multi-step cross-domain behavior

Circular synchronous dependencies are prohibited. A cycle requires workflow redesign, owner consolidation, or explicit ADR.

## Composition Root

Dependency injection and concrete adapter binding occur only in application composition roots or approved module bootstrap packages. Domain code receives interfaces and does not locate services globally.

## Architecture Tests

The implementation must include tests that:

- Build an import graph
- Classify every package by family and owner
- Fail prohibited family-to-family imports
- Fail cross-domain repository and persistence imports
- Fail direct database imports outside approved persistence packages
- Fail provider SDK leakage into domain contracts
- Fail unregistered capability, event, and permission constants
- Fail application packages that contain migrations
- Detect circular dependencies
- Verify each table and migration has one owner
- Fail Bun-, Hono-, oRPC-, or database-adapter leakage into runtime-neutral packages
- Build and run the critical server suite on Bun and the approved Node LTS fallback from the same commit

## Temporary Exceptions

An exception records:

- Rule violated
- Reason
- Owner
- Affected packages
- Risk
- Compensating control
- Expiry date
- Removal plan
- Approval

Expired exceptions fail CI.

## Reference Ruleset

A machine-readable ruleset should eventually define package globs, allowed dependencies, forbidden dependencies, owners, exception file, and ADR links. Until code packages exist, this document is the normative source.

## Quality Gates

- Architecture tests run in CI
- Package ownership is complete
- Dependency cycles are zero or formally excepted
- New package families require architecture review
- Extraction to services preserves the same ownership contracts
- Generated scaffolds comply by default
