---
document_id: PDA-ENGR-012
title: Architecture Dependency Rules
version: 1.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0002, ADR-0003, ADR-0020, ADR-0027, ADR-0028]
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
packages/persistence/*
packages/ui-web/*
packages/ui-native/*
packages/design-tokens/*
packages/integrations/*
packages/tooling/*
```

Exact package names are finalized during implementation scaffolding, but the dependency direction is normative.

## Allowed Dependency Direction

### Applications

May depend on application contracts, platform client adapters, UI packages, and composition roots. Ordinary application paths do not import domain repositories, persistence adapters, or database schemas. Registered composition-root paths may import approved implementations and owner-specific persistence adapters only to construct and bind them.

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

### Persistence Adapters

`packages/persistence/*` contains owner-specific database adapters and migrations selected under ADR-0027. Each package maps to one authoritative Platform, Engine, or Domain owner and may import only that owner's published ports and schemas. Persistence packages do not read environment configuration, create pools, expose database types through contracts, or import another owner's repositories, tables, or migrations.

### Registered Composition Roots

Composition authority is exact, not a wildcard grant to every application. Each authorized application process owns at most one bounded pool. The server alone executes migrations. ADR-0027 selects `apps/worker/composition` as the candidate Event Backbone root, but it is deliberately absent from this registered table and therefore rejected by the executable checker until all three named controlled-prototype review rows are recorded.

| Composition root | Process owner | Allowed process resources | Prohibited responsibility |
|---|---|---|---|
| `apps/server/composition` | API server | one bounded process-local PostgreSQL pool; HTTP adapters; deterministic migration runner | background event-delivery loop or another process's pool |
| `packages/tooling/composition/*` | Platform Tooling | one explicitly governed infrastructure connection for the named tool | application business processing or an unregistered long-running service |

PR4 may add `apps/worker/composition` to this table and regenerate the rules only after ADR-0027's Platform Architecture, Data Platform, and Security rows are dated and record concurrence. The registration change, worker implementation, and proof that the worker cannot run migrations remain reviewable in that PR; PR1 grants no executable exception in advance.

### Registered Persistence Owners

The executable registry maps every concrete package, table, and migration stream to exactly one logical owner. Package location does not transfer accountability.

| Persistence package | Logical owner | Published owner package | Owned tables | Migration directory |
|---|---|---|---|---|
| `packages/persistence/platform-identity-postgres` | `platform.identity` | `@meridian/platform-identity` | `account`, `invitation`, `member`, `organization`, `passkey`, `session`, `two_factor`, `user`, `verification`, `platform_identity_session_command_receipt` | `packages/persistence/platform-identity-postgres/src/migrations` |
| `packages/persistence/platform-tenancy-postgres` | `platform.tenancy` | `@meridian/platform-tenancy` | `platform_active_context`, `platform_delegation`, `platform_location`, `platform_membership`, `platform_membership_invitation`, `platform_organization`, `platform_role`, `platform_role_assignment`, `platform_tenant`, `platform_tenancy_command_receipt` | `packages/persistence/platform-tenancy-postgres/src/migrations` |
| `packages/persistence/platform-entitlements-postgres` | `platform.entitlements` | `@meridian/platform-entitlements` | `platform_entitlement`, `platform_entitlement_change`, `platform_entitlement_command_receipt` | `packages/persistence/platform-entitlements-postgres/src/migrations` |
| `packages/persistence/platform-audit-postgres` | `platform.audit` | `@meridian/platform-audit` | `platform_audit_record`, `platform_audit_privacy_overlay` | `packages/persistence/platform-audit-postgres/src/migrations` |
| `packages/persistence/platform-events-postgres` | `platform.events` | `@meridian/platform-events` | `platform_event_outbox` | `packages/persistence/platform-events-postgres/src/migrations` |
| `packages/persistence/party-postgres` | `party.records` | `@meridian/domain-party` | `party_command_receipt`, `party_contact_point`, `party_identity_link`, `party_organization_detail`, `party_person_detail`, `party_record` | `packages/persistence/party-postgres/src/migrations` |
| `packages/persistence/catalog-postgres` | `catalog` | `@meridian/domain-catalog` | `catalog_product`, `catalog_variant`, `catalog_identifier`, `catalog_product_command_receipt` | `packages/persistence/catalog-postgres/src/migrations` |
| `packages/persistence/inventory-postgres` | `inventory` | `@meridian/domain-inventory` | None in PR1; PDA-DAT-019 classifies the proposed PR3 table set | `packages/persistence/inventory-postgres/src/migrations` |
| `packages/persistence/platform-numbering-postgres` | `platform.numbering` | `@meridian/platform-numbering` | None in PR1; PDA-DAT-019 classifies the proposed PR5 table set | `packages/persistence/platform-numbering-postgres/src/migrations` |

### UI Packages

May depend on design tokens, UI utilities, generated client contracts, and application-facing types. They may not contain authoritative business rules or server persistence.

### Integrations

Provider adapters depend on stable platform-facing adapter interfaces. Provider SDK types do not cross into authoritative domain models.

## Prohibited Imports

- `domains/<A>/...repository` from domain B
- `domains/<A>/...persistence` from any other domain
- Database client imports outside registered Persistence packages and composition-root pool factories
- Better Auth database tables from business domains
- Provider SDK models inside domain entities
- Commercial plan names inside authorization logic
- Feature-flag keys inside entitlement policy
- AI prompt or tool packages importing repositories directly
- Self-hosted or cloud-specific infrastructure code from domain packages
- Bun globals or Bun-only APIs from Foundation, Contracts, Platform application logic, Shared Engine logic, or Domain logic
- Hono request/context objects outside application transport adapters and composition roots
- oRPC transport objects outside application transport adapters and generated-client boundaries
- Database adapters from runtime-neutral Platform, Engine, Domain, application-contract, or authorization-policy packages
- Another owner's repository, private schema, tables, or migrations from a Persistence package

## Persistence Rules

- Every table has one owning module.
- Cross-domain foreign keys are avoided unless explicitly reviewed; stable identifiers and application contracts are preferred.
- Read projections may join governed data but remain non-authoritative.
- Database migrations are owned by the module whose data changes.
- Concrete migration artifacts live in that owner's registered Persistence package; folder location does not transfer ownership.
- Shared database deployment does not permit shared-table mutation.
- A module may atomically append through the Event Backbone outbox port, but it may not use a shared transaction to mutate another module's business tables.

## Cross-Domain Interaction

Use one of:

- Synchronous query contract for current information
- Synchronous command contract when the target owner must decide the mutation
- Versioned event for completed facts and eventual reaction
- Governed analytical projection for reporting
- Workflow orchestration for multi-step cross-domain behavior

Circular synchronous dependencies are prohibited. A cycle requires workflow redesign, owner consolidation, or explicit ADR.

## Composition Root

Dependency injection and concrete adapter binding occur only in the exact registered composition roots above or approved module bootstrap packages. Composition roots may create process resources and bind adapters, but application commands and workflows own business transaction boundaries. Domain code receives interfaces and does not locate services globally. Registering the selected worker candidate, adding a third application root or pool, or proposing a worker-side migration path requires the applicable ADR review and registry propagation.

## Architecture Tests

The implementation must include tests that:

- Build an import graph
- Classify every package by family and owner
- Fail prohibited family-to-family imports
- Fail cross-domain repository and persistence imports
- Fail direct database imports outside approved persistence packages
- Fail owner-specific Persistence packages that import another owner's private schema, repository, table, or migration
- Fail pool creation, shutdown, or connection-configuration reads outside registered composition roots
- Fail an unregistered `apps/*/composition` path even when its directory name is `composition`
- Fail pool construction in the unregistered `apps/worker/composition` candidate until ADR-0027's three review rows are recorded; after registration, prove the worker may construct only its process-local pool and may not invoke migration streams
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

## Executable Ruleset

`registry/architecture-rules.json` carries the machine-readable package globs, dependency grants, composition roots, persistence-owner mappings, and governed exceptions derived from this document. `scripts/check_architecture.py` enforces the rules in CI and `scripts/test_architecture_checker.py` proves composition-root, owner-import, pool-lifecycle, and table-ownership behavior. This document remains authoritative; the registry and checker must be updated together when it changes.

The temporary `platform-identity-persistence-relocation` exception was removed by WS1 PR2 when the Identity schema and migrations moved to the registered owner-specific adapter and pool lifecycle moved to the server composition root.

### Registered Rule Allowances

These paths are part of the rule definition, not temporary risk exceptions. They are narrow cases where the matched token is required to declare or compose the controlled resource. They do not permit connection creation or use outside the stated scope.

| Rule | Allowed path | Reason |
|---|---|---|
| `database-outside-persistence` | `apps/server/composition` | The API server composition root may construct and inject its single process-local connection. |
| `database-outside-persistence` | `packages/tooling/composition/*` | Approved Tooling composition packages may construct a governed infrastructure connection. |
| `connection-lifecycle-outside-composition` | `packages/tooling/env/src/server.ts` | The validated environment schema must declare `DATABASE_URL`; it exports validated configuration and may not import a database client, construct a pool, or close a connection. |

The generator derives each executable pattern's `except` list from this table. A broader allowance, an expiring waiver, or permission to construct/use a connection requires a governed source change and the normal ADR/risk process.

## Quality Gates

- Architecture tests run in CI
- Package ownership is complete
- Dependency cycles are zero or formally excepted
- New package families require architecture review and machine-rules propagation
- Extraction to services preserves the same ownership contracts
- Generated scaffolds comply by default

## Change Log

- 2026-07-14 — v1.1.0 registered the four concrete Catalog-owned PR2 tables and retained their isolated migration stream.

- 2026-07-14 — v1.0.1 withheld the selected worker candidate from executable composition authority until ADR-0027's three named review rows are recorded; added literal denial requirements for the candidate and an unknown application root.

- 2026-07-14 — v1.0.0 narrowed application composition authority to exact server and worker roots, registered the ADR-0027 WS2 worker topology, and registered Catalog, Inventory, and Platform Numbering persistence owners and proposed tables.

- 2026-07-14 — v0.9.1 registered the validated Tooling environment-schema allowance in the authoritative source and removed the checker's hidden family-level carve-out.

- 2026-07-14 — v0.8.0 registered the Platform Entitlements owner package, its current-state, append-only change-history, and command-receipt tables, and its serial migration stream for WS1 PR6.

- 2026-07-14 — v0.7.0 registered the three Platform Tenancy-owned authorization tables while preserving the persistence-free `platform.authorization` evaluator boundary for WS1 PR5.

- 2026-07-14 — v0.6.0 registered the Party owner package, its six tenant-scoped tables, and its serial migration stream for WS1 PR4.
- 2026-07-13 — v0.5.0 registered the first owner/table/migration mappings, removed the Identity relocation exception, and made ownership plus pool-lifecycle denials executable.
- 2026-07-13 — v0.4.0 made the path-aware rules executable in CI, added positive/negative regression probes, closed TD-007, and recorded the expiring Platform Identity persistence-relocation exception for PR2.
- 2026-07-13 — v0.3.0 registered owner-specific Persistence packages under ADR-0027 and separated composition binding from business transaction ownership.
