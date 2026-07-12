---
document_id: ADR-0020
title: Prefer Bun Hono and oRPC for Backend Prototypes with a Node Fallback
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006]
---

# ADR-0020 — Prefer Bun, Hono, and oRPC for Backend Prototypes with a Node Fallback

## Status

Proposed. This authorizes a controlled prototype direction, not a production runtime ratification.

## Context

The founder prefers Bun, Hono, and oRPC for their cohesive TypeScript toolchain, low framework overhead, Web Standards portability, end-to-end types, and OpenAPI support. Better-T-Stack 3.36.3 can scaffold this combination with Next.js, an Expo bare client, PostgreSQL, Drizzle, Better Auth, Docker, Turborepo, and Bun.

Bun aims for Node.js compatibility but its official compatibility documentation still records incomplete or absent behavior in APIs material to background work, telemetry, profiling, provider SDKs, security, and operations. oRPC supports contract-first OpenAPI handlers, but its current OpenAPI-to-contract generator is beta. The governed first-slice OpenAPI must not be displaced by an unreviewed second authority.

## Decision Drivers

- Founder preference and implementation productivity
- One TypeScript toolchain across clients, API, tests, and automation
- Public OpenAPI compatibility and internal end-to-end type safety
- Modular-monolith and data-ownership enforcement
- Containerized self-hosting and a credible runtime escape path
- Compatibility with authentication, PostgreSQL, telemetry, jobs, and provider SDKs
- Fast feedback without hiding production-operability risk

## Options Considered

### Option A — Node, NestJS/Fastify, and OpenAPI-first clients

Broad compatibility and built-in application structure, but more framework ceremony and a weaker fit with the preferred scaffold.

### Option B — Bun, Hono, and oRPC without a fallback

Maximum simplicity, but unverified runtime compatibility becomes a single point of failure. Rejected.

### Option C — Bun, Hono, and oRPC with portability controls and a Node fallback

Uses the preferred stack first, keeps core code runtime-neutral, tests critical paths on both runtimes, and permits isolated Node workers or a full Node deployment when evidence requires it.

### Option D — Bun package manager with Node production runtime

Captures some Bun benefits with less runtime risk. This remains the immediate fallback if Bun runtime gates fail.

## Decision

Select Option C for Technical Prototypes 1–3.

- Bun is the primary prototype runtime and package manager.
- Hono is the thin HTTP composition shell.
- oRPC is the typed application transport and may expose REST through its OpenAPI handler.
- PostgreSQL remains authoritative. Drizzle may scaffold straightforward access, while ledger and complex persistence still require comparison with Kysely or explicit SQL.
- Better Auth remains behind the platform identity adapter and owns authentication and sessions only.
- Domain, application, contract, and authorization packages must not depend on Bun globals, Hono contexts, oRPC transport objects, or database adapters.
- An active approved Node LTS is the fallback runtime. Runtime-specific infrastructure belongs behind adapters or in a separately deployed worker connected through explicit contracts and the transactional outbox.
- Canonical OpenAPI and JSON Schemas remain authoritative. Prototype code must deterministically implement them or pass semantic parity tests. The beta OpenAPI-to-oRPC generator is evaluation-only.
- Production selection remains conditional on validation and an ADR-0004 acceptance or amendment.

## Required Compatibility Controls

1. Pin runtime, scaffold, frameworks, direct dependencies, container bases, and tested image digests.
2. Run critical contract, domain, authorization, tenancy, migration, outbox, and provider-adapter suites on Bun and Node where portable.
3. Inventory native addons, Node built-ins, install scripts, module formats, streams, TLS, crypto, signals, worker threads, and test-runner assumptions.
4. Test OpenTelemetry context, logging, errors, shutdown, health, memory, profiling, and heap diagnostics under Bun.
5. Test Better Auth, PostgreSQL drivers, workflows/jobs, provider SDKs, files, streaming, webhooks, and native networking on exact versions.
6. Keep a Node container buildable from the same commit. Node-only workers may not bypass application contracts or domain ownership.
7. Prefer Web Standards APIs and isolate necessary Bun APIs in infrastructure adapters enforced by architecture tests.
8. Record compatibility failures, workarounds, upstream issues, alternatives, expiry conditions, and regression tests in `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`.

## Consequences

### Positive

- Starts with the founder's preferred stack.
- Preserves a low-change path to Node because Hono and oRPC support both runtimes.
- Gains Bun's integrated package manager, runtime, test tooling, and fast feedback.
- Uses oRPC type safety without surrendering governed OpenAPI authority.
- Converts compatibility knowledge into repository evidence rather than agent memory.

### Negative

- Dual-runtime gates add CI time and adapter discipline.
- Hono supplies less structure than NestJS; the platform must provide composition, authorization, transaction, and architecture conventions.
- Some dependencies may require Node workers or runtime fallback.
- Contract parity and permission metadata require dedicated validation.

### Risks and Mitigations

- Hidden Node dependency: inventory and execute the same critical vectors on both runtimes.
- Telemetry context loss: add concurrent request and background-job propagation tests.
- Contract drift: fail CI when the exposed contract differs semantically from `openapi/first-slice-v1.yaml`.
- Framework leakage: enforce thin adapters and dependency rules.
- Runtime-specific incident tooling: prove debugger, profiler, heap, signal, and crash procedures.
- Generator churn: pin Better-T-Stack and treat output as reviewed source, never authority.

## Platform Impact

- Domains, data ownership, capabilities, events, permissions, entitlements, privacy, and offline authority are unchanged.
- PWA is continuity only; it does not replace Expo/SQLite governed offline sync.
- Both runtime images require health, telemetry, shutdown, recovery, rollback, and tenant-isolation evidence.
- Agents must use current primary sources and the technology evidence skill for version and compatibility claims.

## Migration and Rollback

Start in a disposable prototype workspace. Move only reviewed packages into implementation. For incompatibility, try in order: supported pin or upgrade, standards-based alternative, compatible dependency, infrastructure adapter, Node worker via contract/outbox, full Hono/oRPC application on Node, then NestJS/Fastify if Hono itself fails structural or operational gates.

No fallback may create cross-domain persistence or a second contract authority.

## Validation

Production candidacy requires exact environment records; Bun/Node portability suites; OpenAPI parity and response validation; permission, tenant, idempotency, transaction, outbox, and reversal tests; Better Auth integration; telemetry and diagnostics; load, memory, shutdown, restore, and failure injection; documented rollback time; and security, operations, and independent architecture review.

## References

- `02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md`
- `02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md`
- `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `19-Appendices/BUN_HONO_ORPC_AND_BETTER_T_VERIFICATION-2026-07-12.md`
- `17-Roadmap/TECHNICAL_PROTOTYPE_PLAN.md`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Founder | Stack preference | Proposed direction | 2026-07-12 | Prefers Bun and oRPC; compatibility mitigations required |
| Architecture | Boundaries and portability | Pending | | Prototype evidence required |
| Security | Runtime and supply chain | Pending | | |
| Operations | Diagnostics and fallback | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial proposal |
