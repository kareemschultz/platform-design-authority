---
document_id: PDA-APP-013
title: Bun Hono oRPC and Better-T Verification 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
---

# Bun, Hono, oRPC, and Better-T Verification — 2026-07-12

## Purpose

Record primary-source research and reproducible CLI observations supporting ADR-0020. This is dated evidence, not production approval.

## Release Snapshot

| Component | Stable release observed | Source evidence |
|---|---:|---|
| Bun | 1.3.14 | Official homepage and GitHub release |
| Hono | 4.12.29 | Official release published 2026-07-10 |
| oRPC | 1.14.8 | Official release published 2026-07-12 |
| Better-T-Stack | 3.36.3 | Official release published 2026-07-08 |

oRPC 2 beta tags were visible but are not stable-version evidence.

## Findings

### Bun

Bun is incrementally adoptable and aims for Node compatibility. Its current official compatibility page still marks parts of `node:test`, `node:worker_threads`, `node:inspector`, `node:v8`, and `process` partial, and `node:trace_events`, `node:repl`, and `node:sqlite` missing. It also documents buffered outgoing Node HTTP bodies and incomplete Node-API coverage. Because Bun uses JavaScriptCore, V8-specific profiling, serialization, and native assumptions need targeted proof.

**Inference:** Bun is credible for prototypes and potentially production, but the exact dependency graph and operational paths require tests. Node fallback is a control, not a rejection of Bun.

### Hono

Hono uses Web Standards and officially supports Bun and Node. Its small surface improves portability but does not supply NestJS-style module and dependency-injection structure.

**Inference:** the platform must enforce its own composition root, boundaries, authorization order, transactions, and architecture tests.

### oRPC

oRPC supports Bun and Node, typed contracts, OpenAPI handlers, OpenTelemetry, and Hono. Its OpenAPI-to-contract Hey API path is marked beta/unstable. The Hono adapter warns that earlier middleware body reads can fail and documents a proxy mitigation.

**Inference:** oRPC fits typed transport, but canonical OpenAPI parity and middleware-order tests are mandatory.

## Better-T-Stack CLI Verification

Local Bun reported `1.3.14`. Better-T-Stack `3.36.3` help confirmed the requested options. The original set failed dry-run because Next + Tauri switches to static export, incompatible with Docker web deployment. This revision passed without writing project files:

```powershell
bun create better-t-stack@3.36.3 platform-prototype `
  --frontend next native-bare `
  --backend hono `
  --runtime bun `
  --api orpc `
  --auth better-auth `
  --payments none `
  --database postgres `
  --orm drizzle `
  --db-setup docker `
  --package-manager bun `
  --git `
  --web-deploy docker `
  --server-deploy docker `
  --install `
  --addons pwa turborepo ultracite `
  --examples none `
  --disable-analytics `
  --directory-conflict error `
  --dry-run `
  --verbose
```

Remove `--dry-run` only in a disposable prototype workspace after re-verification.

## Addon Disposition

| Addon | Disposition | Reason |
|---|---|---|
| PWA | Include | Bounded continuity, not authoritative offline sync |
| Turborepo | Include | Approved orchestration |
| Ultracite | Include provisionally | One lint/format preset; generated rules need review |
| Biome | Exclude with Ultracite | Redundant layer |
| Tauri | Exclude | Verified Next + Docker incompatibility; desktop needs separate review |
| MCP and skills | Add after review | Must not override tracked repository governance |

## Unknowns Requiring Prototype Evidence

- Exact Better Auth, PostgreSQL driver, workflow/job, provider SDK, and native-addon compatibility
- Async context propagation, crypto/customer requirements, diagnostics, memory, files, streaming, webhooks, and large bodies
- Canonical OpenAPI semantic parity
- Windows development, Linux containers, x64, and arm64 consistency

## Official Sources

- `https://bun.sh/`
- `https://bun.sh/docs/runtime/nodejs-compat`
- `https://bun.sh/docs/runtime/node-api`
- `https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14`
- `https://hono.dev/`
- `https://github.com/honojs/hono/releases/tag/v4.12.29`
- `https://orpc.dev/docs/getting-started`
- `https://orpc.dev/docs/openapi/openapi-handler`
- `https://orpc.dev/docs/openapi/openapi-to-contract`
- `https://orpc.dev/docs/adapters/hono`
- `https://github.com/middleapi/orpc/releases/tag/v1.14.8`
- `https://www.better-t-stack.dev/new`
- `https://better-t-stack.dev/docs`
- `https://github.com/AmanVarshney01/create-better-t-stack/releases/tag/v3.36.3`
