---
document_id: PDA-ENG-020
title: Technology Lifecycle Compatibility and Lessons Ledger
version: 0.3.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0004, ADR-0005, ADR-0006, ADR-0020, ADR-0021, ADR-0022, ADR-0023, ADR-0024]
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
| PostgreSQL | 18.4 current patch observed | Selected major; authoritative database | Patch evolves; extension/provider compatibility and AIO behavior require exact evidence | Restore, PITR, failover, migrations, decimals, isolation, performance, upgrades | Another supported PG18 deployment | Every PostgreSQL patch and environment lock |
| pg_stat_statements | PostgreSQL 18 supplied | Required baseline extension/preload | Shared memory, restart, query-text privacy, overhead | Privileges, overhead, retention/reset, dashboards, failover/restore | Provider query insights/logs with reduced portability | Every PostgreSQL patch |
| pg_trgm | PostgreSQL 18 supplied | Conditional approved search extension | Index write/storage cost and collation/search behavior | Relevance, GIN/GiST, size, write, locale and fallback tests | Core full-text/prefix search or external projection | Before first trigram index and PG patch |
| Drizzle | Verify at implementation lock | Scaffold/evaluate | Complex ledger suitability unproven | Query, migration, ownership, transaction, decimal tests | Kysely or explicit SQL | Persistence work |
| Node.js | Record active approved LTS | Runtime fallback | Exact line must match ecosystem support | Same critical suite and container build | Requires ADR to replace | Fallback build |
| Fumadocs Core/UI | 16.11.3 | Preferred docs prototype | Package family versions differ and must be tested together | Bun/Node build, OpenAPI, search, accessibility, static/container preview | Nextra or Starlight | Before docs scaffold/upgrade |
| Fumadocs MDX/OpenAPI | 15.1.0 / 11.1.1 | Preferred content/API tooling | Executable MDX and API proxy require security controls | Restricted components, canonical contract freshness, proxy deny-by-default | Plain MDX plus generated static reference | Before docs scaffold/upgrade |
| Base UI | 1.6.0 | Preferred new web primitive | API differs from Radix; source ownership retains test burden | Component/accessibility matrix and incremental migration | Radix for proven existing components | Every primitive upgrade |
| TanStack Start | Release Candidate observed | Platform Labs | Not stable v1; RSC is separately experimental | Same vertical slice on Next and Start; Bun/Node/container/auth/trace evidence | Next.js | Stable v1 and each prototype |
| Nextra | 4.6.1 | Documentation fallback | Weaker verified first-party OpenAPI path | Docs build/search/i18n/API comparison | Fumadocs | If Fumadocs gates fail |
| Astro Starlight | 0.41.3 | Static docs fallback | Introduces Astro | Static build, integration and authoring comparison | Fumadocs/Nextra | If independent static portal required |
| Docusaurus | 3.10.2 | Multi-version docs fallback | Version copies and second framework increase maintenance | Multi-supported-release need and build budget | Fumadocs current docs + migrations | When multiple release lines coexist |
| Changesets CLI | 2.31.0 | Proposed implementation release metadata | Requires PR/release discipline; not user docs or architecture authority | Release PR, package dependency, changelog, rollback tests | Manual reviewed release process | Before implementation repository release setup |
| pg_durable | 0.2.3 | Platform Labs only | Pre-1.0, evaluation images, preload/extension, AMD64, database failure-domain coupling | Isolation, HA/PITR, load, upgrade, security, compensation/versioning comparison | Application worker, pg_cron, Temporal | Each release and prototype |

## Verified Sources

| Technology | Primary sources | Verified on |
|---|---|---|
| Bun | `https://bun.sh/`; `https://bun.sh/docs/runtime/nodejs-compat`; `https://bun.sh/docs/runtime/node-api`; `https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14` | 2026-07-12 |
| Hono | `https://hono.dev/`; `https://github.com/honojs/hono/releases/tag/v4.12.29` | 2026-07-12 |
| oRPC | `https://orpc.dev/docs/getting-started`; `https://orpc.dev/docs/adapters/hono`; `https://orpc.dev/docs/openapi/openapi-to-contract`; `https://github.com/middleapi/orpc/releases/tag/v1.14.8` | 2026-07-12 |
| Better-T-Stack | `https://www.better-t-stack.dev/new`; `https://better-t-stack.dev/docs`; `https://github.com/AmanVarshney01/create-better-t-stack/releases/tag/v3.36.3` | 2026-07-12 |
| Fumadocs | `https://www.fumadocs.dev/docs`; `https://www.fumadocs.dev/docs/integrations/openapi`; `https://www.fumadocs.dev/docs/ui/component-library` | 2026-07-12 |
| Base UI and shadcn/ui | `https://base-ui.com/react/overview/releases`; `https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default` | 2026-07-12 |
| TanStack Start | `https://tanstack.com/start/latest/docs/framework/react/overview`; `https://tanstack.com/start/latest/docs/framework/react/guide/server-components` | 2026-07-12 |
| Documentation alternatives | `https://nextra.site/docs`; `https://docusaurus.io/docs/versioning`; `https://astro.build/themes/details/starlight/` | 2026-07-12 |
| Changesets | `https://github.com/changesets/changesets`; `https://github.com/changesets/action` | 2026-07-12 |
| pg_durable | `https://microsoft.github.io/pg_durable/`; `https://github.com/microsoft/pg_durable/releases/tag/v0.2.3`; `https://github.com/microsoft/pg_durable/blob/main/USER_GUIDE.md` | 2026-07-12 |
| PostgreSQL 18 | `https://www.postgresql.org/docs/18/`; `https://www.postgresql.org/docs/18/release-18-4.html`; `https://www.postgresql.org/docs/18/functions-uuid.html` | 2026-07-12 |
| PostgreSQL supplied extensions | `https://www.postgresql.org/docs/18/pgstatstatements.html`; `https://www.postgresql.org/docs/18/pgtrgm.html`; `https://www.postgresql.org/docs/18/pgcrypto.html` | 2026-07-12 |

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
| TECH-LESSON-007 | 2026-07-12 | Active | A hand-built Next/MDX portal transfers search, navigation, OpenAPI, accessibility, redirects, and authoring maintenance to the project | Prototype Fumadocs while keeping Markdown/OpenAPI portable | Documentation matrix; prototype pending | Developer Platform | Fumadocs gates fail or maintenance changes materially |
| TECH-LESSON-008 | 2026-07-12 | Active | shadcn/ui and Fumadocs now default new work to Base UI while Radix remains supported | Prefer Base UI for new source-owned components; do not rewrite proven Radix components | Component matrix pending | Frontend Platform | Primitive or accessibility evidence changes |
| TECH-LESSON-009 | 2026-07-12 | Active | TanStack Start is RC but its RSC/Composite Component implementation remains experimental | Separate conventional Start evaluation from RSC Labs work | Comparative prototype pending | Frontend Platform | Stable Start v1 and non-experimental RSC |
| TECH-LESSON-010 | 2026-07-12 | Active | Worktrees isolate files but do not communicate ownership or synchronize contents | GitHub Project/issue is live authority; one issue/branch/worktree/PR; structured handoffs | Process trial pending | Platform Engineering | Coordination tooling changes |
| TECH-LESSON-011 | 2026-07-12 | Active | pg_durable 0.2.3 can durably orchestrate SQL but published images are evaluation-only and compensation is a proposal | Labs-only database-local comparison; retain Temporal/outbox boundaries | ADR-0023 prototype pending | Data Platform | Stable production evidence and passed gates |
| TECH-LESSON-012 | 2026-07-12 | Active | Video summary named a nonexistent `df.weight` scheduler | Use official `df.wait_for_schedule()` and verify video claims against primary docs | Primary-source verification recorded | Data Platform | API changes |
| TECH-LESSON-013 | 2026-07-12 | Active | PostgreSQL 18 natively supplies UUIDv7, so UUID helper extensions add no baseline value | Use core `uuidv7()` where approved; omit `uuid-ossp` and UUID-only `pgcrypto` use | ADR-0024 tests pending | Data Platform | PostgreSQL UUID policy changes |
| TECH-LESSON-014 | 2026-07-12 | Active | Every preload/background-worker extension expands startup, failure, upgrade, restore, and provider constraints | Preload only `pg_stat_statements`; isolate conditional/Labs extensions | Extension matrix and recovery tests pending | Data Platform | Accepted extension admission |

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
