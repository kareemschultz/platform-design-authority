# Meridian Program Status

**Lifecycle:** Controlled prototype  
**Status basis:** `PROGRESS_MEASUREMENT_STANDARD.md`  
**Evidence cutoff:** `main` at `d30ec1cd4125e87c446fecf649a1dcd46b85289d`  
**Last updated:** 2026-07-14

## Executive view

| Measure | Current result | Interpretation |
|---|---:|---|
| Blueprint baseline completeness | **100%** | The governed baseline required to implement the first slice is complete. This is not a claim that documentation will never evolve. |
| First-slice implementation | **18% provisional weighted completion** | WS0 is complete; WS1 backend/platform stages are merged, while its experience, complete evidence matrix, and closeout remain. WS2–WS7 have not begun implementation. |
| WS1 progress | **60% stage-weighted** | Plan/contracts, core behavior, and persistence/event foundations are complete; thin shell, full dimension/budget evidence, and closeout remain. |
| Capability evidence coverage | **Not yet centrally computed** | Evidence exists across PRs and tests, but a generated capability-by-dimension rollup is still required before a trustworthy percentage can be published. |
| Production readiness | **Not claimed** | Founder, legal, customer, provider, security, accessibility, operational, pilot, and other external gates remain authoritative. |

## Blueprint baseline

**Status: complete for implementation commencement.**

The baseline includes governed foundation principles, architecture and ADRs, capability/domain boundaries, security and privacy, UX and component governance, AI governance, testing, deployment and operations, commercial strategy, first-slice scope and deferrals, quality budgets, implementation workstreams, generated contracts, and living review/risk governance.

Completion is bounded by `BLUEPRINT_BASELINE_COMPLETION_CHECKLIST.md`. Future implementation findings may amend or supersede documents; they do not reopen the entire blueprint unless new evidence invalidates a baseline decision.

## First-slice workstreams

| Workstream | Weight | Status | Stage completion | Weighted contribution | Current evidence / next gate |
|---|---:|---|---:|---:|---|
| WS0 — Scaffold alignment and contracts | 8% | complete | 100% | 8.0% | Package families, foundation types, generated contracts, contract parity, and executable architecture gates are merged. |
| WS1 — Identity, tenancy, Party, authorization | 17% | in-progress | 60% | 10.2% | PR1–PR7 merged through audit evidence and session revocation. Next: thin experience shell, then complete evidence/closeout. |
| WS2 — Catalog and inventory ledger | 17% | planned | 0% | 0% | Blocked on WS1 exit. A governed implementation plan may be prepared without starting code. |
| WS3 — POS cash | 17% | planned | 0% | 0% | Blocked on WS2. |
| WS4 — Stored value | 11% | planned | 0% | 0% | Blocked on WS3. |
| WS5 — Offline sync | 12% | planned | 0% | 0% | Full workstream blocked on WS3; bounded client-engine research may begin after WS1 under the parallelism rule. |
| WS6 — Provider adapter | 9% | planned / externally gated | 0% | 0% | Engine work may follow WS1; provider sandbox and pilot path remain gated by founder/provider decisions. |
| WS7 — Recovery and operations | 9% | planned | 0% | 0% | Starts after WS2 provides real ledgers/outbox; closes last. |
| **Total** | **100%** |  |  | **18.2%** | Rounded executive display: **18%**. |

## WS1 delivery detail

| Increment | State | Evidence |
|---|---|---|
| WS1 plan and governance | complete | PR #33 |
| PR1 canonical contracts and architecture gates | complete | PR #35; TD-007 closed |
| PR2 owner-specific persistence and minimum outbox | complete | PR #37 |
| PR3 authentication, tenancy, memberships, and active context | complete | PR #39 |
| PR4 Party and identity linkage | complete | PR #41 |
| PR5 scoped authorization, roles, and assignments | complete | PR #43 |
| PR6 tenant entitlements and limits | complete | PR #45 |
| PR7 audit evidence and session revocation | complete | PR #47 |
| Thin experience shell | next | Must prove login, context visibility/switching, Party linkage, roles, entitlements, sessions, audit, denial states, responsive navigation, keyboard and screen-reader behavior. |
| WS1 evidence and closeout | pending | Must complete the capability-by-13-dimension matrix, numeric budgets, Bun/Node critical-path proof, risk/roadmap updates, and exact-head CI. |

## Current implementation assets

Implemented and merged:

- runtime-neutral foundation types and generated contract packages;
- contract-first oRPC platform API surface;
- executable package dependency and composition-root rules;
- composition-owned PostgreSQL pool and deterministic owner migration runner;
- owner-specific persistence adapters and minimum transactional outbox;
- Better Auth controlled-prototype boundary with database sessions, two-factor and passkey baseline;
- tenants, organizations, locations, memberships, invitations, suspensions, and active context;
- tenant-scoped Party records and Platform Identity linkage;
- scoped authorization, roles, assignments, and deny-by-default enforcement;
- tenant entitlements and limits separate from permissions;
- audit evidence and session revocation.

Not yet complete:

- the real WS1 application shell and administration experience;
- WS1 capability-dimension evidence rollup and closeout;
- durable outbox delivery worker, retries, dead-letter handling, consumers, and projections beyond the minimum outbox;
- WS2–WS7 business-domain implementation;
- production-grade RLS topology and evidence;
- production OTP/provider path and other external readiness gates.

## Immediate priorities

1. Deliver the WS1 thin experience shell using `@meridian/ui-web`, accepted official shadcn primitives, and only normalized Studio composition evidence.
2. Run WS1 closeout: two-tenant proof, permission-versus-entitlement semantics, revocation budget, audit completeness, accessibility, responsive navigation, Bun/Node critical suites, and the 13-dimension capability evidence matrix.
3. Prepare and review the WS2 Catalog and Inventory implementation plan (to be authored under `docs/blueprint/17-Roadmap/`) without starting WS2 code before WS1 exits.
4. Generate a machine-readable program-status input or evidence rollup so the dashboard can be freshness-checked rather than maintained only by prose.

## Open risk summary

The Architecture Risk Register remains authoritative. The most important current categories are:

- controlled-prototype database isolation versus future production RLS topology;
- incomplete user-facing validation of identity, context, authorization, entitlements, audit, and revocation;
- outbox persistence existing without complete event delivery operations;
- provider, legal, customer, founder, security, accessibility, operational, and pilot evidence still open;
- risk of generated contracts, implementation, Fumadocs, and this dashboard drifting apart.

## Update rule

A PR may advance a percentage only when it closes a stage defined in `PROGRESS_MEASUREMENT_STANDARD.md` with merged evidence. Commit count, issue count, lines of code, elapsed time, and optimistic estimates do not advance progress.
