---
document_id: ADR-0027
title: Owner-Specific Persistence Adapter Packages with Composition-Root Injection
version: 0.2.2
status: Proposed
owner: Platform Design Authority
created: 2026-07-13
last_reviewed: 2026-07-13
supersedes: null
superseded_by: null
related_adrs: [ADR-0002, ADR-0003, ADR-0020, ADR-0024, ADR-0025]
---

# ADR-0027 — Owner-Specific Persistence Adapter Packages with Composition-Root Injection

## Status

Proposed. This decision may guide the named Technical Prototype 1 work in PDA-RDM-008, but it is not production authority. Its Platform Architecture, Data Platform, and Security review rows must be complete before WS1 PR2 merges.

## Context

WS1 introduces the first schema-owning modules beyond `platform/identity`: `platform/tenancy`, `platform/entitlements`, `platform/audit`, the minimum `platform/events` outbox, and `domains/party`. An early PDA-RDM-008 draft proposed a shared `packages/foundation/database` package exporting a process-wide `pg.Pool` singleton.

That shape conflicts with governed boundaries:

- ADR-0020 (`:63`) prohibits domain, application, contract, and authorization packages from depending on database adapters.
- PDA-ENGR-012 requires runtime-neutral core packages, limits database clients to approved persistence packages, and confines concrete binding to composition roots or approved module bootstraps.
- `foundation.may_depend_on` is empty in `registry/architecture-rules.json`; Foundation cannot own environment or database dependencies.

The current scaffold's `platform/identity/src/db.ts` constructs a pool and reads connection configuration inside a runtime-neutral Platform package. That is recorded implementation debt, not precedent for the remaining WS1 modules.

## Options Considered

- **A. Shared `foundation/database` singleton** — rejected: illegal Foundation dependency and global service location.
- **B. Embed concrete adapters in each runtime-neutral Platform or Domain core package** — rejected: the package would depend on Drizzle/`pg`, contradicting ADR-0020 and the runtime-neutral family rules even if imports were hidden under `src/adapter/**`.
- **C. Owner-specific packages in a registered `persistence` family, bound by the composition root** — selected.
- **D. Put every adapter and migration in `apps/server`** — rejected: application packages must not own module schemas or migrations, and deployment composition is not data ownership.

## Decision

Adopt option C for WS1 and retrofit `platform/identity`.

1. **Runtime-neutral owner cores publish ports.** Platform and Domain core packages expose repository, unit-of-work, and outbox-append interfaces using governed contracts. They do not import `pg`, Drizzle, connection configuration, migrations, or concrete adapters.
2. **Concrete adapters use owner-specific persistence packages.** Packages live under `packages/persistence/*`, with one package per owner and backend, for example `platform-identity-postgres`, `platform-tenancy-postgres`, `platform-events-postgres`, and `domain-party-postgres`. They may import only the owning module's published ports and schemas plus approved persistence dependencies. They may not import another owner's repository, migrations, or private tables.
3. **Ownership is logical, not inferred from the folder family.** The authoritative module remains accountable for its tables, schema policy, migration stream, compatibility, and rollback even though concrete artifacts live in its owner-specific persistence package. Ownership metadata and architecture tests map every adapter, table, and migration to exactly one module.
4. **One pool is created at the composition root.** `apps/server/composition/**` reads validated configuration, creates the process `pg.Pool`, constructs approved persistence adapters over it, injects them through published ports, and owns graceful shutdown. No persistence package reads `process.env` or `@meridian/tooling-env`, creates a pool, or locates a global connection.
5. **Application services own transaction boundaries.** A command or workflow defines the unit of work. The composition root only binds an injected transaction coordinator; it does not contain business orchestration. A transaction handle is adapter-internal and never appears in a domain, application, OpenAPI, event, or authorization contract.
6. **Atomicity is narrow.** An authoritative module may atomically commit its own state and an outbox record through the published outbox port. It may not use the shared handle to mutate another module's business tables. Cross-domain completion uses orchestration, idempotency, events, and compensation per PDA-ARC-005.
7. **Migrations are deterministic and serial.** A composition-owned runner invokes owner-specific migration streams in a fixed dependency-respecting order. A bare unfiltered `turbo run db:migrate` is insufficient.

`packages/foundation/database` and embedded persistence subpaths inside runtime-neutral core packages are prohibited.

## Required Rules Propagation

PDA-ENGR-012 and `registry/architecture-rules.json` register the `persistence` family and its composition-root exception. Before PR2 implementation begins, architecture tests must enforce:

- ordinary application paths cannot import Persistence, Platform, Engine, or Domain implementations;
- registered composition roots may import owner-specific persistence adapters only for construction and binding;
- a persistence adapter imports only its owner's published ports/schemas and approved dependencies;
- only the composition root creates or closes a pool or reads connection configuration;
- no runtime-neutral package imports a database client or adapter;
- every table and migration resolves to one authoritative module owner.

The `database-outside-persistence` forbidden pattern in `registry/architecture-rules.json` carries an explicit `except` for the registered `composition_roots` paths so the composition-root pool factory is a registry-sanctioned allowance rather than a test that ignores the registry. Persistence packages and the composition-root pool factory are the only database-client import sites.

## Consequences

### Positive

- Runtime-neutral core packages remain portable and directly testable.
- One pool, configuration path, and shutdown owner keep connection limits coherent.
- Concrete persistence dependencies are visible to package-graph enforcement.
- Module ownership survives without permitting shared-table mutation.
- State-plus-outbox atomicity has an explicit port and transaction boundary.

### Negative

- Each schema owner needs a core package plus an owner-specific persistence package.
- The architecture rules and tests need path-aware ownership metadata rather than relying only on family names.
- `platform/identity` must be split out of its current self-constructed database shape.
- A serial migration orchestrator and representative recovery fixtures must be maintained.

## Required Prototype Controls

- Prove only `apps/server/composition/**` creates/closes `pg.Pool` and reads connection-bearing configuration.
- Prove database imports exist only in registered owner-specific persistence packages and the composition pool factory.
- Prove a module state change and its outbox record commit or roll back together without another module's business-table mutation.
- Prove cross-domain completion does not share an unrestricted transaction.
- Prove empty-database migration, representative upgrade, repeat run, failed-migration recovery, and freshness on the exact pinned Drizzle/`pg`/PostgreSQL locks recorded in PDA-ENGR-013.

## Revisit Triggers

- A module needs a separate database or pool.
- A persistence package needs another owner's private schema or migration.
- Cross-module transactional needs exceed state-plus-outbox atomicity.
- Managed-provider constraints change pooling or migration execution.

## References

- `docs/blueprint/18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`
- `docs/blueprint/17-Roadmap/WS1_IDENTITY_TENANCY_PARTY_AUTHORIZATION_PLAN.md` §3 G3
- `docs/blueprint/01-Platform/EVENT_BACKBONE.md`
- `docs/blueprint/02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md` §Domain Transaction Boundaries
- `registry/architecture-rules.json`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Codex | Independent architecture consistency | Changes required on v0.1.0 | 2026-07-13 | Embedded adapters and the Drizzle-import control contradicted ADR-0020/PDA-ENGR-012; v0.2.0 separates owner-specific persistence packages and narrows transaction scope. |
| Claude Code | Independent architecture consistency | Concurred with v0.2.0 | 2026-07-13 | Independently verified the registered Persistence family, open G3 lifecycle, transaction limits, and complete Two-Factor/Passkey baseline; evidence: PR #33 comment `4962106902`. |
| Platform Architecture | Dependency boundaries, composition root | Pending | | |
| Data Platform | Pooling, transactions, migration orchestration | Pending | | |
| Security | Env/secret handling, tenant-safe connections | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.2 | 2026-07-13 | Platform Design Authority | Codex review: added an explicit composition-root `except` to the `database-outside-persistence` registry pattern so the ADR's composition-root pool factory is registry-sanctioned, not a test that ignores the registry. |
| 0.2.1 | 2026-07-13 | Platform Design Authority | Recorded Claude Code's independent concurrence with v0.2.0; lifecycle and specialist review gates remain unchanged. |
| 0.2.0 | 2026-07-13 | Platform Design Authority | Replaced contradictory embedded adapters with owner-specific persistence packages; narrowed composition and transaction responsibilities. |
| 0.1.0 | 2026-07-13 | Platform Design Authority | Initial persistence-boundary proposal. |
