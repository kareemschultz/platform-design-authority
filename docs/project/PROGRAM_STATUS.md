# Meridian Program Status

**Lifecycle:** Controlled prototype

**Status basis:** provisional reporting convention in `PROGRESS_MEASUREMENT_STANDARD.md`

**Evidence cutoff:** `main` at `7202fc819b70982c013e1ca11a4fcc136e01e2de`, which includes WS2 PR1–PR4 through durable Event Backbone delivery and projections; PR5–PR7 remain open under issues #71–#73

**Last updated:** 2026-07-16

This dashboard is a non-authoritative program-control summary. It is subordinate to the authority order in `AGENTS.md`, and it cannot ratify a document, close a risk, or replace evidence in an ADR, approved specification, registry, review disposition, issue, or pull request.

## Executive view

| Measure | Current result | Interpretation |
|---|---:|---|
| Blueprint baseline | **Controlled-prototype authority outline present; enterprise depth not complete** | The bounded baseline supports named prototypes. PDA-REV-013/014 records lifecycle, depth, navigation, product-documentation, operations, research, and evidence gaps; FA4-032 and ratification remain open. |
| First-slice implementation | **25% credited weighted completion; WS2 active** | WS0 and WS1 are complete at controlled-prototype depth. WS2 PR1–PR4 are merged, but no additional stage credit is claimed before the governed workstream evidence gate. WS3–WS7 have not begun implementation. |
| WS1 progress | **100% stage-weighted** | PR1–PR9 implement contracts, persistence, identity/tenancy/Party, authorization, entitlements, Audit/revocation, the real shell, and governed closeout evidence. This is not pilot or production readiness. |
| Capability evidence coverage | **11 fully evidenced + 13 partially evidenced / 103 capabilities; 223/1,294 required cells** | The generated registry computes evidence coverage. WS1 retains 11 complete rows/143 cells. Interim WS2 registration adds 80 linked merged-head cells: 13 WS2 rows are `Partially Evidenced`, `catalog.bulk-import` remains wholly `Planned`, and 88 other first-slice rows remain `Planned`. |
| Production readiness | **Not claimed** | Founder, legal, customer, provider, security, accessibility, operational, pilot, and other external gates remain authoritative. |

## Blueprint baseline

**Status: sufficient to continue the named controlled prototypes; not documentation-complete or production-directing.**

The baseline includes governed foundation principles, architecture and ADRs, capability/domain boundaries, security and privacy, UX and component governance, AI governance, testing, deployment and operations, commercial strategy, first-slice scope and deferrals, quality budgets, implementation workstreams, generated contracts, and living review/risk governance.

The prior baseline claim is bounded by `BLUEPRINT_BASELINE_COMPLETION_CHECKLIST.md` and applies only to the controlled-prototype exception named in PDA-RDM-007. PDA-REV-013/014 invalidates any broader interpretation: file/subject coverage is not implementation-ready depth, operational evidence, or ratified authority. FA4-032 remains open because the Constitution is Draft and the ADR ratification waves are incomplete.

## First-slice workstreams

| Workstream | Weight | Status | Stage completion | Weighted contribution | Current evidence / next gate |
|---|---:|---|---:|---:|---|
| WS0 — Scaffold alignment and contracts | 8% | complete | 100% | 8.0% | PR #23, #31, #32; package families, foundation types, generated contracts, contract parity, and executable architecture gates are merged. |
| WS1 — Identity, tenancy, Party, authorization | 17% | complete | 100% | 17.0% | PR #54 merged the PR1–PR9 controlled-prototype closeout; PDA-IMPL-005 and the generated matrix record evidence and residual gates. |
| WS2 — Catalog and inventory ledger | 17% | in-progress | 0% | 0% | Interim evidence is registered without stage credit: 13 rows are partial, bulk import is planned, and none is complete. PR #63 plan, PR #65 contracts, PR #67 Catalog Product, PR #69 Inventory ledger/workflows, and PR #74 durable delivery/projections are merged. PR5–PR7 remain sequenced under issues #71–#73. |
| WS3 — POS cash | 17% | planned | 0% | 0% | Blocked on WS2. |
| WS4 — Stored value | 11% | planned | 0% | 0% | Blocked on WS3. |
| WS5 — Offline sync | 12% | planned | 0% | 0% | Full workstream blocked on WS3; bounded client-engine research may begin after WS1 under the parallelism rule. |
| WS6 — Provider adapter | 9% | planned | 0% | 0% | Engine work may follow WS1; provider sandbox and pilot path remain externally gated by founder/provider decisions. |
| WS7 — Recovery and operations | 9% | planned | 0% | 0% | Starts after WS2 provides real ledgers/outbox; closes last. |
| **Total** | **100%** |  |  | **25.0%** | Provisional weighted implementation completion: **25%**. |

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
| PR8 thin experience shell | complete | PR #50; PDA-UX-038; authenticated administration shell with real context, Party, role, entitlement, session, and audit queries plus responsive and accessibility evidence. |
| PR9 WS1 evidence and closeout | complete and merged | PR #54; merge `8f9d93f`; PDA-IMPL-005; 11 capabilities/143 required cells; 40-sample database and independent-HTTP revocation evidence; Bun/Node, architecture, accessibility, roadmap, ADR, risk, and lifecycle propagation. |
| RR-011 independent audit disposition | complete | PDA-REV-011/012; issue #56 (closed) / PR #57 (merged); 0 P0, 1 P1, 5 P2, and 4 P3 accepted and remediated on exact-head-green merge. |

## WS2 delivery detail

| Increment | State | Evidence / remaining gate |
|---|---|---|
| Plan and independent review | merged | PR #63; PDA-RDM-009 |
| PR1 canonical Catalog/Inventory contracts | merged | PR #65; permissions, endpoints, schemas, events, ownership, and offline seam |
| PR2 Catalog Product aggregate | merged | PR #67; Product/Variant/Identifier invariants, persistence, API, and tests |
| PR3 Inventory ledger and workflows | merged | PR #69; exact quantities, adjustment/count/transfer/reservation/reversal, owner persistence, API, and audit/outbox behavior |
| PR4 durable event delivery and projections | merged | PR #74 / closed issue #70 / PDA-APP-023; exact-head independent concurrence, green CI, worker, claims, retry/dead-letter/replay, consumer receipts, projections, safe health, and runbook |
| PR5 imports and online numbering | next governed increment | issue #71 |
| PR6 Product/Inventory web experience | blocked on PR5 merge | issue #72; formal UI-pattern and accessibility evidence required |
| PR7 controlled-prototype closeout | blocked on PR6 merge | issue #73; promote all applicable WS2 cells from planned to reviewed evidence, disposition any depth deferrals, and complete the final independent audit |

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
- audit evidence and session revocation;
- a real responsive administration shell with visible active context, Party linkage, roles, entitlements, sessions, audit, denial states, and reauthentication handling.
- governed Catalog and Inventory contracts, permissions, events, OpenAPI schemas, and owner boundaries;
- Catalog Product/Variant/Identifier aggregate behavior and PostgreSQL persistence;
- Inventory adjustment, count, transfer, reservation, and linked-reversal ledger behavior with exact quantity, concurrency, conservation, API, Audit, and transactional-outbox evidence.
- Event Backbone worker delivery with bounded claim/lease/retry/dead-letter handling, authorized replay, replay-scoped consumer receipts, Catalog and Inventory projections, safe health telemetry, and a controlled-prototype runbook.

Not yet complete:

- WS2 imports/numbering, web experience, complete capability evidence, and whole-workstream closeout; interim PR2/PR3 evidence is registered but does not satisfy PR7, and PDA-APP-023 does not independently advance those capability cells;
- WS3–WS7 business-domain implementation;
- production-grade RLS topology and evidence;
- production OTP/provider path and other external readiness gates.

## Immediate priorities

1. Execute issues #71–#73 sequentially from fresh `main` worktrees, beginning with bounded imports and online numbering under issue #71.
2. Extend the registered WS2 evidence source only when PR4–PR7 behavior is mapped to reviewed capability-dimension evidence; keep planned cells visible and leave this dashboard non-authoritative until a governed program-status source is introduced.

## Open risk summary

The Architecture Risk Register remains authoritative. The most important current categories are:

- controlled-prototype database isolation versus future production RLS topology;
- controlled-prototype Event Backbone evidence existing without production capacity, SLO, tested alert, multi-replica, restore/failover, or exercise evidence;
- provider, legal, customer, founder, security, accessibility, operational, and pilot evidence still open;
- risk of generated contracts, implementation, Fumadocs, and this dashboard drifting apart.

## Machine-readable status (deferred)

A generated `registry/program-status.json` was evaluated as part of the project-tracking audit that produced `GITHUB_PROJECTS_OPERATING_GUIDE.md`. It is deferred rather than added: evidence-cell counts are now machine-readable and checked against this dashboard, but no deterministic source yet derives workstream status and stage completion from merged PR evidence plus `PROGRESS_MEASUREMENT_STANDARD.md` without a human transcribing prose into JSON. A hand-maintained duplicate would drift exactly as this dashboard's PR9 row once did. GitHub issue-count metadata must never become that source's sole input. Revisit when workstream-stage evidence has its own governed machine-readable source.

## Update rule

A PR may advance a percentage only when it closes a stage defined in `PROGRESS_MEASUREMENT_STANDARD.md` with merged evidence. Commit count, issue count, lines of code, elapsed time, and optimistic estimates do not advance progress.
