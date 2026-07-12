---
document_id: PDA-ENG-022
title: Advanced Frontend Technique Catalog
version: 0.1.0
status: Draft
owner: Frontend Platform
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# Advanced Frontend Technique Catalog

## Purpose

Record promising frontend techniques with lifecycle, applicability, boundaries, tests, and recheck triggers so videos or examples inform prototypes without silently becoming platform rules.

## Framework Position

| Path | Maturity observed | Decision |
|---|---|---|
| Next.js App Router | Production ecosystem | Primary web shell under ADR-0005 |
| TanStack Start conventional SSR/server functions | Release Candidate | Platform Labs comparison |
| TanStack Start React Server Components | Experimental into early v1 | Labs only |

## TanStack Start RSC Technique Disposition

| Technique | Applicability | Decision and controls |
|---|---|---|
| Explicit `renderServerComponent` | Read-heavy renderables and heavy server-only formatting | Labs; call application contracts rather than repositories |
| Children slots | Simple client interaction inside server output | Labs; server cannot inspect opaque slot content |
| Render-prop slots | Server supplies serializable IDs/data to client actions | Best Composite Component prototype candidate |
| Component-prop slots | White-label or registered extension presentation | Labs with allowlisted component registry |
| Parallel server components | Independent dashboard panels | Test tracing, cancellation, partial failure, and waterfalls |
| Bundled components sharing data | Cohesive page sections with one read model | Test cache key and invalidation ownership |
| Deferred/Suspense streaming | Slow reports and analytics | Require stable layout, accessible announcements, error boundaries, and print fallback |
| Async-generator streaming | Unbounded result processing | Defer; prefer paginated/virtualized data surfaces |
| TanStack Query caching of RSC | Interactive server-renderable refresh | Labs; set `structuralSharing: false` as current docs require |
| Router invalidation | Refresh after mutation | Mutation still uses governed oRPC application command |
| Direct database access in RSC | Conflicts with modular backend boundary | Prohibited |
| Authoritative mutation in server function | Bypasses canonical Hono/oRPC and ordinary authority controls | Prohibited |

## Required Record for New Techniques

- Problem and user value
- Lifecycle: Approved, Prototype, Labs, Deferred, Rejected, or Superseded
- Applicable apps and capabilities
- Server/client/offline state ownership
- Tenant, permission, entitlement, privacy, and audit boundary
- Accessibility and responsive behavior
- Performance budget and observability
- Minimal example and anti-example
- Exact version, official sources, tests, fallback, and recheck trigger

## TanStack Start Prototype

Implement one small administrative read workflow in Next.js and TanStack Start without RSC, then optionally add one Composite Component. Use the same oRPC contract, Better Auth adapter, Base UI-backed component, Docker target, trace topology, accessibility checks, and test fixtures.

Measure build/runtime compatibility on Bun and Node, route/type ergonomics, caching, streaming, error behavior, bundle size, memory, deployment portability, security boundary clarity, and agent code consistency.

## Official Sources

- `https://tanstack.com/start/latest/docs/framework/react/overview`
- `https://tanstack.com/start/latest/docs/framework/react/guide/server-components`
- `https://tanstack.com/start/latest/docs/framework/react/comparison`
- `https://tanstack.com/start/latest/docs/framework/react/guide/server-functions`
