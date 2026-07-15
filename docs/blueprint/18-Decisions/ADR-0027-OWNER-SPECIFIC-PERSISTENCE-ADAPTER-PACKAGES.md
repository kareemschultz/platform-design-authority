---
document_id: ADR-0027
title: Owner-Specific Persistence Adapter Packages with Composition-Root Injection
version: 0.3.1
status: Proposed
owner: Platform Design Authority
created: 2026-07-13
last_reviewed: 2026-07-14
supersedes: null
superseded_by: null
related_adrs: [ADR-0002, ADR-0003, ADR-0020, ADR-0024, ADR-0025]
---

# ADR-0027 — Owner-Specific Persistence Adapter Packages with Composition-Root Injection

## Status

Proposed. This decision may guide the named controlled prototypes in PDA-RDM-008 and PDA-RDM-009, but it is not production authority. The three architecture-consistency review rows required before WS1 PR2 merged — Platform Architecture, Data Platform, and Security — are **recorded as Approved at prototype scope (2026-07-13)** against PR #37's CI-green implementation; that merge gate is satisfied. These were performed by Claude Code as the reviewer designated by the repository owner (one reviewer covering all three lenses, transparently attributed), not by three independent human specialists, and they do not constitute production acceptance. The Security row carries a forward caveat: DB-level tenant-isolation controls (RLS disposition, tenant-scoped constraints per PDA-SEC-011) remain an open gate for the PRs that introduce tenancy/domain tables.

WS2 selects a second process only for the Event Backbone delivery runtime. The topology amendment below requires independent Platform Architecture, Data Platform, and Security concurrence at controlled-prototype scope before `apps/worker` implementation begins. The path is reserved by this decision as a candidate name only: until those review rows are recorded, PDA-ENGR-012 and the generated executable rules do not register `apps/worker/composition`, and the checker rejects database imports or pool lifecycle there.

## Context

WS1 introduces the first schema-owning modules beyond `platform/identity`: `platform/tenancy`, `platform/entitlements`, `platform/audit`, the minimum `platform/events` outbox, and `domains/party`. An early PDA-RDM-008 draft proposed a shared `packages/foundation/database` package exporting a process-wide `pg.Pool` singleton.

That shape conflicts with governed boundaries:

- ADR-0020 (`:63`) prohibits domain, application, contract, and authorization packages from depending on database adapters.
- PDA-ENGR-012 requires runtime-neutral core packages, limits database clients to approved persistence packages, and confines concrete binding to composition roots or approved module bootstraps.
- `foundation.may_depend_on` is empty in `registry/architecture-rules.json`; Foundation cannot own environment or database dependencies.

The current scaffold's `platform/identity/src/db.ts` constructs a pool and reads connection configuration inside a runtime-neutral Platform package. The executable ruleset records this narrowly as `platform-identity-persistence-relocation`; it is implementation debt expiring in WS1 PR2, not precedent for the remaining WS1 modules.

PDA-RDM-009 requires durable outbox delivery, bounded retries, dead-letter handling, consumer idempotency, and recovery. Running that loop inside the HTTP process would couple request shutdown and delivery backpressure. A process-global pool shared between applications is neither possible nor safe: process resources cannot be shared by service location, and connection budgets must account for every replica and process.

## Options Considered

- **A. Shared `foundation/database` singleton** — rejected: illegal Foundation dependency and global service location.
- **B. Embed concrete adapters in each runtime-neutral Platform or Domain core package** — rejected: the package would depend on Drizzle/`pg`, contradicting ADR-0020 and the runtime-neutral family rules even if imports were hidden under `src/adapter/**`.
- **C. Owner-specific packages in a registered `persistence` family, bound by the composition root** — selected.
- **D. Put every adapter and migration in `apps/server`** — rejected: application packages must not own module schemas or migrations, and deployment composition is not data ownership.

### WS2 delivery-topology options

- **E. Run delivery inside the server process** — viable fallback with one pool, but delivery backpressure, retry loops, and shutdown are coupled to HTTP availability.
- **F. Run one explicit Event Backbone worker process with its own bounded pool** — selected for the controlled WS2 prototype. It preserves the same owner ports and outbox contracts while isolating delivery lifecycle and failure injection.
- **G. Share one global pool object across server and worker processes** — rejected: a pool is process-local state, global service location hides connection ownership, and separate operating-system processes cannot share it safely.

## Decision

Adopt option C for owner-specific persistence and option F for the WS2 delivery topology.

1. **Runtime-neutral owner cores publish ports.** Platform and Domain core packages expose repository, unit-of-work, and outbox-append interfaces using governed contracts. They do not import `pg`, Drizzle, connection configuration, migrations, or concrete adapters.
2. **Concrete adapters use owner-specific persistence packages.** Packages live under `packages/persistence/*`, with one package per owner and backend, for example `platform-identity-postgres`, `platform-tenancy-postgres`, `platform-events-postgres`, and `domain-party-postgres`. They may import only the owning module's published ports and schemas plus approved persistence dependencies. They may not import another owner's repository, migrations, or private tables.
3. **Ownership is logical, not inferred from the folder family.** The authoritative module remains accountable for its tables, schema policy, migration stream, compatibility, and rollback even though concrete artifacts live in its owner-specific persistence package. Ownership metadata and architecture tests map every adapter, table, and migration to exactly one module.
4. **Each authorized process has one composition-owned pool.** `apps/server/composition/**` reads validated configuration, creates the HTTP process `pg.Pool`, constructs approved persistence adapters over it, injects them through published ports, runs deterministic migrations, and owns graceful shutdown. After the WS2 prototype review gate is satisfied, `apps/worker/composition/**` may create one separately configured, process-local `pg.Pool` for Event Backbone delivery and registered consumers. The worker never runs migrations. No persistence package reads `process.env` or `@meridian/tooling-env`, creates a pool, or locates a global connection.
5. **Application services own transaction boundaries.** A command or workflow defines the unit of work. The composition root only binds an injected transaction coordinator; it does not contain business orchestration. The binding function may receive a concrete `PoolClient` and construct a scope containing only the selected owner ports plus the outbox-append port; the application callback never receives that client. A transaction handle is adapter/composition-internal and never appears in a domain, application, OpenAPI, event, or authorization contract.
6. **Atomicity is narrow.** An authoritative module may atomically commit its own state and an outbox record through the published outbox port. It may not use the shared handle to mutate another module's business tables. Cross-domain completion uses orchestration, idempotency, events, and compensation per PDA-ARC-005.
7. **Migrations are deterministic and serial.** A composition-owned runner invokes owner-specific migration streams in a fixed dependency-respecting order. A bare unfiltered `turbo run db:migrate` is insufficient.
8. **Connection budgets cover the deployment topology.** Server and worker pool maxima are explicit, bounded, independently observable, and included with replica counts in the PostgreSQL connection budget. A worker drains claims, releases checked-out clients, and closes its own pool on shutdown. Neither process reaches into the other's lifecycle.
9. **Worker authority remains narrow.** An event envelope supplies scope and causation for delivery, not current user authority. A consumer mutates authoritative state only through the target owner's published application command or an explicitly owned projection adapter. External webhooks remain Developer Platform ownership.

`packages/foundation/database` and embedded persistence subpaths inside runtime-neutral core packages are prohibited.

## Required Rules Propagation

PDA-ENGR-012 and `registry/architecture-rules.json` register the `persistence` family and currently authorized exact composition roots. The selected worker candidate is added only after the three pending review rows are recorded. Architecture tests must enforce:

- ordinary application paths cannot import Persistence, Platform, Engine, or Domain implementations;
- registered composition roots may import owner-specific persistence adapters only for construction and binding;
- a persistence adapter imports only its owner's published ports/schemas and approved dependencies;
- only the explicitly registered server and Tooling composition roots create or close a pool or read connection configuration before the worker gate; the unregistered worker candidate and an unknown application root must fail;
- no runtime-neutral package imports a database client or adapter;
- every table and migration resolves to one authoritative module owner.

The `database-outside-persistence` forbidden pattern in `registry/architecture-rules.json` carries an explicit `except` for the exact registered `composition_roots` paths so pool factories are registry-sanctioned allowances rather than tests that ignore the registry. Wildcard `apps/*/composition` authority is prohibited. Persistence packages and registered composition-root pool factories are the only database-client import sites.

## Consequences

### Positive

- Runtime-neutral core packages remain portable and directly testable.
- One pool, configuration path, and shutdown owner per process keep connection limits coherent.
- HTTP and delivery failure, retry, and shutdown lifecycles can be exercised independently.
- Concrete persistence dependencies are visible to package-graph enforcement.
- Module ownership survives without permitting shared-table mutation.
- State-plus-outbox atomicity has an explicit port and transaction boundary.

### Negative

- Each schema owner needs a core package plus an owner-specific persistence package.
- The architecture rules and tests need path-aware ownership metadata rather than relying only on family names.
- `platform/identity` must be split out of its current self-constructed database shape.
- A serial migration orchestrator and representative recovery fixtures must be maintained.
- Two process-local pools consume a larger connection budget than the server-only topology and require coordinated limits, metrics, shutdown, and deployment evidence.

## Required Prototype Controls

- Before the three WS2 review rows are recorded, prove `apps/worker/composition/**` and an unknown `apps/*/composition` path are rejected while only the registered server and Tooling roots receive their narrow allowances.
- When PR4 records those reviews and registers the worker root, prove only `apps/server/composition/**` and `apps/worker/composition/**` create/close application pools, each process creates at most one pool, and the worker cannot invoke migrations.
- Prove database imports exist only in registered owner-specific persistence packages and the composition pool factory.
- Prove a module state change and its outbox record commit or roll back together without another module's business-table mutation.
- Prove cross-domain completion does not share an unrestricted transaction.
- Prove empty-database migration, representative upgrade, repeat run, failed-migration recovery, and freshness on the exact pinned Drizzle/`pg`/PostgreSQL locks recorded in PDA-ENGR-013.

## Revisit Triggers

- A module needs a separate database or pool.
- A persistence package needs another owner's private schema or migration.
- Cross-module transactional needs exceed state-plus-outbox atomicity.
- Managed-provider constraints change pooling or migration execution.
- A third application process, another pool, worker-side migration requirement, or combined server/worker deployment is proposed.

## References

- `docs/blueprint/18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`
- `docs/blueprint/17-Roadmap/WS1_IDENTITY_TENANCY_PARTY_AUTHORIZATION_PLAN.md` §3 G3
- `docs/blueprint/17-Roadmap/WS2_CATALOG_AND_INVENTORY_IMPLEMENTATION_PLAN.md` §4 G4
- `docs/blueprint/01-Platform/EVENT_BACKBONE.md`
- `docs/blueprint/02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md` §Domain Transaction Boundaries
- `registry/architecture-rules.json`

## WS1 Prototype Evidence

PDA-IMPL-005 extends the original PR2 evidence across Tenancy, Entitlements, Audit, Party, and the session-command stream: each owner has a distinct adapter/migration history, concrete binding remains in `apps/server/composition`, transactions bind owner state and outbox on one checked-out client, and architecture tests reject cross-owner persistence and connection lifecycle violations. PostgreSQL 18.4 clean/repeat/recovery and two-tenant composite-ownership tests pass under the controlled prototype.

The prior Security caveat is partially exercised by tenant-scoped constraints, repositories, and tests; production RLS topology remains open as RR-007. The ADR remains Proposed and its prototype-scoped review decisions are not production acceptance.

PDA-REV-011 found that the validated Tooling environment schema's necessary `DATABASE_URL` declaration was exempted by a hidden Tooling-family condition in the checker. PDA-REV-012 removes that bypass: PDA-ENGR-012 now registers the exact declaration path, registry generation derives the executable allowance, and a negative Tooling fixture proves the allowance does not broaden to other files or permit connection lifecycle.

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Codex | Independent architecture consistency | Changes required on v0.1.0 | 2026-07-13 | Embedded adapters and the Drizzle-import control contradicted ADR-0020/PDA-ENGR-012; v0.2.0 separates owner-specific persistence packages and narrows transaction scope. |
| Claude Code | Independent architecture consistency | Concurred with v0.2.0 | 2026-07-13 | Independently verified the registered Persistence family, open G3 lifecycle, transaction limits, and complete Two-Factor/Passkey baseline; evidence: PR #33 comment `4962106902`. |
| Claude Code (Platform Architecture perspective) | Dependency boundaries, composition root | Approved — prototype scope | 2026-07-13 | Verified against PR #37 (`codex/36-ws1-persistence`, CI-green). Owner cores publish ports and import no DB client (`platform/identity` removed `db.ts`; `auth.ts` takes injected persistence + secret); concrete adapters live only in `packages/persistence/{platform-identity,platform-events}-postgres`; the pool factory is the sole composition-root database-client site (`apps/server/composition/postgres.ts`). Enforcement is executable and gated in CI — `scripts/check_architecture.py` + `scripts/test_architecture_checker.py` run in `meridian-prototype.yml`. The `exceptions[]` array is now empty: TD-007 (PR1) and `platform-identity-persistence-relocation` (this PR) closed by real resolution, not waiver. |
| Claude Code (Data Platform perspective) | Pooling, transactions, migration orchestration | Approved — prototype scope | 2026-07-13 | Single process pool (`postgres.ts`); narrow unit-of-work that BEGIN/COMMIT/ROLLBACKs without leaking `PoolClient` (`postgres-unit-of-work.ts`); deterministic serial migration runner with per-stream error wrapping (`migrations.ts`); distinct per-owner migration tables (`platform_identity_migrations` / `platform_events_migrations`) preserving `single_migration_owner`. `persistence.integration.test.ts` proves empty-migrate, repeat-without-drift, representative upgrade, failed-stream recovery without partial state, atomic owner-state+outbox commit/rollback, and event-id idempotency. Exact locks recorded in PDA-APP-020 (Drizzle 0.45.2 / drizzle-kit 0.31.10 / pg 8.22.0 / PostgreSQL 18.4 / Bun 1.3.14 / Node 24). |
| Claude Code (Security perspective) | Env/secret handling, tenant-safe connections | Approved — prototype scope, with a forward caveat | 2026-07-13 | `DATABASE_URL`/pool construction confined to `apps/server/composition/**`; no persistence or runtime-neutral package reads connection env; Better Auth `secret` injected via options, never from env inside the package; no secret logging (only `error.message` on idle-client). Outbox is tenant-scoped (`tenant_id NOT NULL` + tenant index) with classification/retention/idempotency columns. Enforced by the `connection-lifecycle-outside-composition` and `database-outside-persistence` CI patterns. **Caveat:** DB-level tenant-isolation controls (RLS disposition, tenant-scoped uniqueness/FKs per PDA-SEC-011) are a separate gate that applies when tenancy/domain tables land in PR3+; PR2's schemas are Better Auth core + the outbox only, so that gate is not yet exercised and remains open for later PRs. |
| Claude Code | Consolidated WS1 architecture audit | Concurred after remediation — prototype scope | 2026-07-14 | PDA-REV-011 identified the hidden Tooling-family connection-rule carve-out; PDA-REV-012 replaces it with an authoritative, generated, exact-path allowance and negative regression proof. RR-007 remains open. |
| Claude Code (Platform Architecture perspective) | Explicit server/worker composition roots and modular-monolith boundary | Pending — WS2 prototype scope | | Required before `apps/worker` implementation. |
| Claude Code (Data Platform perspective) | Per-process pool budget, migrations, transactions, and recovery | Pending — WS2 prototype scope | | Required before `apps/worker` implementation. |
| Claude Code (Security perspective) | Worker scope, tenant context, configuration, and least privilege | Pending — WS2 prototype scope | | Required before `apps/worker` implementation. Production RLS remains RR-007. |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.1 | 2026-07-14 | Platform Design Authority | Made the pre-worker review gate executable: the selected worker path remains unregistered and denied until the three pending review rows are recorded; added literal worker-candidate and unknown-app denial requirements. |
| 0.3.0 | 2026-07-14 | Platform Design Authority | Selected an explicit Event Backbone worker with one process-local bounded pool for the WS2 controlled prototype; narrowed composition roots to exact paths, kept migrations server-only, and added required pre-worker review gates. |
| 0.2.7 | 2026-07-14 | Platform Design Authority | Replaced the hidden Tooling connection-rule bypass with a source-derived exact-path allowance under the RR-011 disposition. |
| 0.2.6 | 2026-07-14 | Platform Design Authority | Linked complete WS1 owner-adapter prototype evidence and narrowed the earlier Security caveat to the still-open production RLS topology. |
| 0.2.5 | 2026-07-13 | Platform Design Authority | Recorded the three required pre-PR2-merge architecture-consistency reviews (Platform Architecture, Data Platform, Security) as Approved at prototype scope against PR #37's CI-green implementation, by the owner-designated reviewer; Security row carries a forward tenant-isolation caveat. PR2 merge gate satisfied; production acceptance remains separate. |
| 0.2.4 | 2026-07-13 | Platform Design Authority | Clarified how the composition root binds owner and outbox adapters over one transaction while keeping the concrete client out of application contracts; lifecycle and specialist review gates remain unchanged. |
| 0.2.3 | 2026-07-13 | Platform Design Authority | Recorded the executable path-aware checker and the narrow, expiring `platform-identity-persistence-relocation` exception; specialist reviews and PR2 gate remain pending. |
| 0.2.2 | 2026-07-13 | Platform Design Authority | Codex review: added an explicit composition-root `except` to the `database-outside-persistence` registry pattern so the ADR's composition-root pool factory is registry-sanctioned, not a test that ignores the registry. |
| 0.2.1 | 2026-07-13 | Platform Design Authority | Recorded Claude Code's independent concurrence with v0.2.0; lifecycle and specialist review gates remain unchanged. |
| 0.2.0 | 2026-07-13 | Platform Design Authority | Replaced contradictory embedded adapters with owner-specific persistence packages; narrowed composition and transaction responsibilities. |
| 0.1.0 | 2026-07-13 | Platform Design Authority | Initial persistence-boundary proposal. |
