---
document_id: PDA-ARC-016
title: Bun Hono and oRPC Decision Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0002, ADR-0003, ADR-0004, ADR-0020]
---

# Bun, Hono, and oRPC Decision Matrix

## Outcome

Use Bun + Hono + oRPC for Technical Prototypes 1–3, with portability controls and an always-buildable Node fallback. Do not call it production-ratified until ADR-0020's gates pass.

## Weighted Evaluation

Scores use 1 (poor) through 5 (strong). Totals are directional analysis, not benchmark evidence.

| Criterion | Weight | Bun + Hono + oRPC | Node + Hono + oRPC | Node + NestJS/Fastify |
|---|---:|---:|---:|---:|
| Founder/team preference and iteration speed | 15 | 5 | 4 | 2 |
| Typed contract and client ergonomics | 15 | 5 | 5 | 4 |
| Node ecosystem compatibility | 15 | 3 | 5 | 5 |
| Architecture enforcement and structure | 15 | 3 | 3 | 5 |
| Public OpenAPI discipline | 10 | 4 | 4 | 4 |
| Operations and diagnostics | 10 | 3 | 5 | 5 |
| Runtime portability and rollback | 10 | 4 | 5 | 4 |
| Performance and resource potential | 5 | 5 | 4 | 3 |
| Scaffolding fit | 5 | 5 | 4 | 2 |
| **Weighted total / 500** | **100** | **405** | **450** | **405** |

Node + Hono + oRPC has the highest pre-prototype risk-adjusted score. Bun remains the first experiment because it best matches preference and scaffolding, while the same Hono/oRPC shell can fall back to Node if boundaries remain portable.

## Component Decisions

| Component | Prototype position | Main advantage | Main risk | Mitigation | Fallback |
|---|---|---|---|---|---|
| Bun 1.3.14 | Preferred runtime/package manager | Integrated fast TypeScript toolchain | Partial Node APIs and operational differences | Pin; dual-runtime critical suites; adapters; drills | Active Node LTS |
| Hono 4.12.29 | Preferred thin shell | Web Standards and multi-runtime | Less built-in application structure | Composition root, middleware and architecture tests | Hono on Node; NestJS/Fastify if Hono fails |
| oRPC 1.14.8 | Preferred stable transport | Typed inputs, outputs, errors, OpenAPI | Contract duplication and body-order caveat | Semantic parity, response validation, integration tests | Plain OpenAPI handlers/clients |
| oRPC 2 beta | Labs only | Emerging features | Breaking pre-release changes | Isolation only | Stable 1.x |
| Better-T-Stack 3.36.3 | Scaffold only | Reproducible compatible composition | `latest` drift and generated defaults | Pin, dry-run, diff and governance review | Manual assembly |
| Drizzle | Scaffold/evaluate | TypeScript ergonomics | Complex ledger SQL and ownership | SQL/migration evidence; compare Kysely/SQL | Kysely or explicit SQL |
| PWA | Include for continuity | Installability and bounded caching | False equivalence with offline sync | Privacy/update/stale-state rules | Standard web shell |
| Tauri | Exclude | Desktop packaging | Next + Docker selection incompatibility | Separate desktop ADR and threat model | Browser/PWA and Expo |
| Ultracite | Include provisionally | Consolidated lint/format preset | Config churn | Pin and review generated policy | Biome directly |
| Biome plus Ultracite | Exclude duplicate | None beyond preset | Redundant/conflicting configuration | Select one layer | Biome only if Ultracite rejected |
| Better-T MCP/skills | Add after review | Agent convenience | Competing instructions | Reconcile with `CLAUDE.md` and `.claude/skills` | Existing project skills |

## Compatibility Decision Tree

For each incompatibility, use the first passing option:

1. Supported stable upgrade or pin with a regression test.
2. Standards-based API with identical Bun and Node behavior.
3. Maintained compatible dependency after license and security review.
4. Infrastructure adapter.
5. Node-only worker through an explicit application contract and outbox.
6. Hono/oRPC server on Node from the same commit.
7. NestJS/Fastify only if Hono structure or operability—not Bun alone—fails.

Every workaround needs an owner, upstream link when available, regression evidence, recheck date, and removal criterion in the lessons ledger.

## Mandatory Prototype Matrix

| Area | Required Bun and Node proof | Failure response |
|---|---|---|
| Better Auth | Sessions, cookies, revocation, crypto, mobile exchange | Runtime adapter or Node service |
| PostgreSQL | Pooling, transactions, decimals, migrations, cancellation | Driver replacement or Node runtime |
| oRPC/OpenAPI | Body parsing, files, errors, streaming, response validation, semantic parity | Plain handler or Node runtime |
| Telemetry | Async context, spans, logs, metrics, exceptions | Adapter or telemetry worker |
| Jobs/workflows | Signals, timers, retries, cancellation, shutdown | Node worker behind outbox |
| Providers | Every selected SDK and webhook signature fixture | HTTP adapter or Node worker |
| Operations | Health, drain, signals, memory, profile, heap, crash | Node deployment |
| Supply chain | Frozen install, native addons, scripts, SBOM, container scan | Replace dependency or runtime |

## Selection Rules

- Scaffold success proves CLI compatibility only.
- A package's Bun-support claim still requires platform tests.
- Public operations resolve to canonical OpenAPI operations, permissions or authenticated context, and application commands/queries.
- Runtime choice never changes domain, tenant, permission, entitlement, ledger, privacy, or offline authority.

## References

- `18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `19-Appendices/BUN_HONO_ORPC_AND_BETTER_T_VERIFICATION-2026-07-12.md`
