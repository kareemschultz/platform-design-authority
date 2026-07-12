---
document_id: PDA-ENG-020
title: Technology Lifecycle Compatibility and Lessons Ledger
version: 0.1.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0004, ADR-0005, ADR-0006, ADR-0020]
---

# Technology Lifecycle, Compatibility, and Lessons Ledger

## Purpose

This mandatory living index records technology versions, compatibility evidence, breaking changes, workarounds, and reusable lessons. It prevents architecture and AI contributors from treating training knowledge, an unpinned `latest`, a successful install, or an old article as current truth.

This is not a lockfile. Implementation repositories own exact transitive versions and image digests. This ledger owns architectural status, last verified stable line, evidence date, known constraints, required tests, and fallback for material technologies.

## Mandatory Agent Rule

Before recommending, adding, upgrading, removing, or documenting a runtime, framework, library, provider SDK, database, deployment target, scaffold, or agent tool:

1. Read this ledger, governing ADR/specification, and implementation manifests.
2. Verify current facts from official docs, releases, compatibility pages, advisories, and licenses. Model memory and search snippets are discovery aids only.
3. Record version/family, date, sources, limits, affected packages, regression tests, fallback, and recheck trigger.
4. Update the affected ADR/specification when architectural position changes.
5. Append a lesson for a breaking change, failed assumption, workaround, operational issue, or reusable technique.
6. Run governance and implementation tests before claiming compatibility.

Use `.claude/skills/technology-evidence-maintainer/SKILL.md` for this workflow.

## Current Technology Register

These stable releases were observed from official sources on 2026-07-12. Reverify before scaffolding or upgrading.

| Technology | Verified stable | Status | Current constraint | Required production proof | Fallback | Recheck |
|---|---|---|---|---|---|---|
| Bun | 1.3.14 | Preferred prototype runtime/package manager | Named Node APIs and diagnostics remain partial/missing | Dual runtime, addons, telemetry, crypto/TLS, signals, diagnostics, containers | Active Node LTS or Node worker | Every prototype and upgrade |
| Hono | 4.12.29 | Preferred thin shell | Platform supplies application structure; middleware order matters | Boundaries, authorization order, request context, errors, shutdown | Hono on Node; NestJS/Fastify | Before lockfile |
| oRPC | 1.14.8 | Preferred stable transport | OpenAPI generator beta; Hono body caveat | Canonical parity, responses, bodies/files/streams/errors | Plain OpenAPI layer; Node | Before lockfile/major |
| oRPC | 2.0.0-beta.16 observed | Labs only | Pre-release | No critical-path use | Stable 1.x | Stable 2.0 |
| Better-T-Stack | 3.36.3 | Scaffold only | `latest` changes and addon constraints | Pinned dry-run and generated review | Manual assembly | Every scaffold |
| PostgreSQL | Select supported major in implementation | Authoritative database | Major/extensions unselected | Restore, migrations, decimals, isolation, performance | Supported PostgreSQL deployment | Prototype environment |
| Drizzle | Verify at implementation lock | Scaffold/evaluate | Complex ledger suitability unproven | Query, migration, ownership, transaction, decimal tests | Kysely or explicit SQL | Persistence work |
| Node.js | Record active approved LTS | Runtime fallback | Exact line must match ecosystem support | Same critical suite and container build | Requires ADR to replace | Fallback build |

## Verified Sources

| Technology | Primary sources | Verified on |
|---|---|---|
| Bun | `https://bun.sh/`; `https://bun.sh/docs/runtime/nodejs-compat`; `https://bun.sh/docs/runtime/node-api`; `https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14` | 2026-07-12 |
| Hono | `https://hono.dev/`; `https://github.com/honojs/hono/releases/tag/v4.12.29` | 2026-07-12 |
| oRPC | `https://orpc.dev/docs/getting-started`; `https://orpc.dev/docs/adapters/hono`; `https://orpc.dev/docs/openapi/openapi-to-contract`; `https://github.com/middleapi/orpc/releases/tag/v1.14.8` | 2026-07-12 |
| Better-T-Stack | `https://www.better-t-stack.dev/new`; `https://better-t-stack.dev/docs`; `https://github.com/AmanVarshney01/create-better-t-stack/releases/tag/v3.36.3` | 2026-07-12 |

## Lessons Ledger

Lessons are append-only by ID. Supersede rather than erase history. Never store secrets, protected data, credentials, private URLs, or proprietary source.

| Lesson ID | Date | Status | Observation | Decision/workaround | Regression evidence | Owner | Recheck/removal |
|---|---|---|---|---|---|---|---|
| TECH-LESSON-001 | 2026-07-12 | Active | Bun compatibility is substantial but not identical to Node | Keep core packages neutral; run critical suites on both | ADR-0020; tests pending | Platform Engineering | Each Bun upgrade |
| TECH-LESSON-002 | 2026-07-12 | Active | Better-T rejects Next + Tauri + Docker web deployment | Remove Tauri; evaluate desktop separately | 3.36.3 original dry-run failed; revised passed | Frontend Platform | Desktop ADR and supported combination |
| TECH-LESSON-003 | 2026-07-12 | Active | Biome and Ultracite duplicate lint/format selection | Select Ultracite only, then review generated rules | Review pending | Developer Platform | Toolchain prototype |
| TECH-LESSON-004 | 2026-07-12 | Active | Better-T MCP/skills can compete with repository governance | Add only after scaffold and reconcile instructions | Manual diff required | Developer Platform | Each addon update |
| TECH-LESSON-005 | 2026-07-12 | Active | oRPC OpenAPI-to-contract is beta while canonical OpenAPI exists | No dual authority; require semantic parity | Parity test pending | API Platform | Generator stable and golden tests pass |
| TECH-LESSON-006 | 2026-07-12 | Active | Hono middleware may consume a body before oRPC | Fix order or use documented proxy; test body types | Integration test pending | API Platform | Adapter removes caveat |

## Entry Templates

| Technology | Verified stable | Status | Current constraint | Required production proof | Fallback | Recheck |
|---|---|---|---|---|---|---|
| Name | Exact stable version/family | Proposed/prototype/selected/fallback/deferred | Evidence-backed limit | Named tests/review | Tested option | Date/event |

| Lesson ID | Date | Status | Observation | Decision/workaround | Regression evidence | Owner | Recheck/removal |
|---|---|---|---|---|---|---|---|
| TECH-LESSON-NNN | YYYY-MM-DD | Active | Reproducible fact | Bounded response | Test, issue, or pending | Team | Date/event |

## Evidence Quality and Cadence

- Prefer official docs, releases, source, advisories, standards, and support matrices.
- Mark unavailable or ambiguous primary evidence as unknown.
- Distinguish project support, install success, our test result, and production approval.
- Verify exact combinations and relevant OS, CPU, container, database, and deployment target.
- Link upstream workarounds and retain a local regression test.
- Do not upgrade a major merely to make this ledger current.
- Review at prototype start/closure, before scaffolds and majors, monthly during active implementation, quarterly otherwise, and immediately after material advisories, license changes, regressions, support changes, or incidents.

Material updates increment this document's version and dates. A no-change review belongs in its review issue; avoid meaningless file churn.
