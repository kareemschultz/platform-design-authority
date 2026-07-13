---
document_id: ADR-0027
title: Package-Owned Persistence Adapters with Composition-Root Injection
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-13
last_reviewed: 2026-07-13
supersedes: null
superseded_by: null
related_adrs: [ADR-0002, ADR-0003, ADR-0020, ADR-0024, ADR-0025]
---

# ADR-0027 — Package-Owned Persistence Adapters with Composition-Root Injection

## Status

Proposed. Governs the WS1 persistence boundary (PDA-RDM-008 §3 G3). No production use is authorized; the decision applies first to Technical Prototype 1.

## Context

WS1 introduces the first schema-owning modules beyond `platform/identity`: `platform/tenancy`, `platform/entitlements`, `platform/audit`, the minimum `platform/events` outbox, and `domains/party`. A draft of PDA-RDM-008 proposed a shared `packages/foundation/database` package exporting a process-wide `pg.Pool` singleton that every schema-owning package would import.

That shape conflicts with governed boundaries:

- ADR-0020 (`:63`) forbids domain, application, contract, and authorization packages from depending on database adapters; runtime-neutral core code stays behind adapters (`:64`, `:48`).
- `ARCHITECTURE_DEPENDENCY_RULES.md` confines dependency injection and concrete adapter binding to composition roots (`:111`) and prohibits database adapters imported from domain/application/authorization-policy packages (`:87`).
- The `foundation` family's `may_depend_on` is empty (`registry/architecture-rules.json`), so Foundation cannot legally read `@meridian/tooling-env` or `process.env`, and it is listed in `runtime_neutral_families`. A pool singleton in Foundation is therefore both an illegal dependency and a service-location anti-pattern.

Today `platform/identity/src/db.ts` constructs its own `pg.Pool` and reads `DATABASE_URL` via `@meridian/tooling-env` directly. This is legal for a `platform`-family package under ADR-0020 (which does not name `platform`), but it hard-codes a per-package pool and per-package environment read, which does not scale to six schema owners sharing one database and contradicts the composition-root rule.

## Options Considered

- **A. Shared `foundation/database` pool singleton** — rejected: illegal Foundation dependency, global service location, no env path.
- **B. Each package constructs its own pool and reads env** (status quo for identity, extended to all six) — rejected: N independent pools against one database, N environment reads, no single shutdown owner, and a domain package (`domains/party`) owning a concrete adapter violates ADR-0020.
- **C. Package-owned adapters behind interfaces, pool injected from the composition root** — selected.

## Decision

Adopt option C for all WS1 schema-owning modules and retrofit `platform/identity` to match.

1. **Interfaces in core, adapters at the edge.** Each schema-owning module's public surface depends on repository and unit-of-work *interfaces* only. Domain and authorization core code never imports `pg`, Drizzle, or `@meridian/tooling-env`.
2. **The owning module owns its concrete adapter and migrations** in an explicitly registered adapter boundary (an internal sub-path of the owning package, e.g. `src/adapter/**` + `src/migrations/**`, not a separate cross-cutting infrastructure package). Only the owning module's migration stream touches its own schema (`single_migration_owner`).
3. **One pool, created at the composition root.** `apps/server/composition/**` reads validated environment configuration, creates the single process `pg.Pool`, constructs each module's Drizzle adapter over that pool, injects transaction-capable adapters into module services, and owns graceful shutdown. No other package constructs a pool, locates a global pool, or reads `process.env`/`@meridian/tooling-env` for a connection.
4. **`platform/authorization` and other runtime-neutral evaluators own no adapter** and receive already-resolved data.
5. **Transactions cross module boundaries only through the composition root**, which supplies a shared transaction handle so a single state change plus its outbox row commit atomically (see PDA-PLT-008 outbox requirement).
6. **Migrations run deterministically and serially.** A bare unfiltered `turbo run db:migrate` (default concurrency 10) is insufficient; a serial orchestrator applies module streams in a fixed, dependency-respecting order.

`packages/foundation/database` is prohibited. Foundation remains dependency-light and runtime-neutral.

## Rationale

Option C is the only shape that satisfies ADR-0020, the composition-root rule, and the empty Foundation dependency envelope simultaneously, while still honoring `single_migration_owner`. It keeps `domains/party` free of a concrete database adapter (ADR-0020 compliance) by moving concrete binding to the composition root, and it collapses six would-be pools and six environment reads into one owned, observable, cleanly-shut-down resource.

## Consequences

### Positive

- One pool, one env read, one shutdown owner; connection limits stay coherent.
- Domain and authorization core stay runtime-neutral and unit-testable without a database.
- Composition-root binding is enforceable by the path-aware architecture test WS1 adds (PDA-RDM-008 §3 G2).
- Cross-module atomicity (state + outbox) has an explicit, owned transaction path.

### Negative

- Retrofits `platform/identity/src/db.ts` from a self-constructed pool to an injected one (small, mechanical; scheduled in WS1 PR2).
- Every schema-owning module must define and maintain repository interfaces plus a thin adapter, rather than importing a shared handle.
- A serial migration orchestrator must be built and evidenced (clean, upgrade, repeat, failure-recovery, freshness) rather than relying on turbo defaults.

## Required Prototype Controls

- Prove no package other than `apps/server/composition/**` imports `pg`, Drizzle, or a connection-bearing environment value (path-aware architecture test).
- Prove one process pool exists and is drained exactly once on shutdown.
- Prove a module state change and its outbox row commit or roll back together.
- Prove empty-database migration, representative upgrade, repeat run, failed-migration recovery, and freshness on the exact pinned Drizzle/`pg`/PostgreSQL locks, recorded in the technology ledger (PDA-ENGR-013).

## Revisit Triggers

- A schema owner needs a genuinely separate database or connection pool (e.g. an isolated ledger) — record the exception in `registry/architecture-rules.json`.
- Cross-module transactional needs exceed what a single composition-root handle can express.
- Managed-provider constraints change the pooling or migration-execution model.

## References

- `docs/blueprint/18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`
- `docs/blueprint/17-Roadmap/WS1_IDENTITY_TENANCY_PARTY_AUTHORIZATION_PLAN.md` §3 G3
- `docs/blueprint/01-Platform/EVENT_BACKBONE.md`
- `registry/architecture-rules.json`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Platform Architecture | Dependency boundaries, composition root | Pending | | |
| Data Platform | Pooling, transactions, migration orchestration | Pending | | |
| Security | Env/secret handling, tenant-safe connections | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-13 | Platform Design Authority | Initial decision resolving PDA-RDM-008 §3 G3; prohibits `foundation/database`, adopts package-owned adapters with composition-root injection |
