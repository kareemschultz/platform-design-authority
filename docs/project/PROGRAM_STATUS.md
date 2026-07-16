# Meridian Program Status

**Lifecycle:** Controlled prototype

**Status basis:** provisional reporting convention in `PROGRESS_MEASUREMENT_STANDARD.md`

**Evidence cutoff:** `main` at `f7d2a6bbd7ad6df20a08820ba4a65299017b4db5`, which includes the RR-011 remediation and re-verification, WS1 closeout, project-tracking records, and WS2 PR1-PR5 (governance/contracts, Catalog core, Inventory ledger, durable event delivery, bounded imports and online numbering), each independently audited across one or more remediation rounds before merge

**Last updated:** 2026-07-16

This dashboard is a non-authoritative program-control summary. It is subordinate to the authority order in `AGENTS.md`, and it cannot ratify a document, close a risk, or replace evidence in an ADR, approved specification, registry, review disposition, issue, or pull request.

## Executive view

| Measure | Current result | Interpretation |
|---|---:|---|
| Blueprint baseline completeness | **100% for controlled-prototype implementation commencement** | The bounded documentation baseline needed to continue the named prototypes exists. FA4-032, ratification waves, and production gates remain open. |
| First-slice implementation | **35.2% provisional weighted completion** | WS0 and WS1 are complete at controlled-prototype depth. WS2 is in progress: governed plan/contracts, Core/domain implementation, and Persistence/events/migrations/integrations are all stage-complete now that Catalog, Inventory, and Import/Numbering cores plus event delivery are merged, but User experience, Automated test dimensions, and Independent closeout remain (see WS2 delivery detail). WS3–WS7 have not begun implementation. |
| WS1 progress | **100% stage-weighted** | PR1–PR9 implement contracts, persistence, identity/tenancy/Party, authorization, entitlements, Audit/revocation, the real shell, and governed closeout evidence. This is not pilot or production readiness. |
| Capability evidence coverage | **11/103 capabilities; 143/1,294 required cells** | The generated registry now computes evidence coverage. The 11 WS1 capabilities are evidenced at registered first-slice depth; remaining workstreams stay Planned. |
| Production readiness | **Not claimed** | Founder, legal, customer, provider, security, accessibility, operational, pilot, and other external gates remain authoritative. |

## Blueprint baseline

**Status: complete for implementation commencement.**

The baseline includes governed foundation principles, architecture and ADRs, capability/domain boundaries, security and privacy, UX and component governance, AI governance, testing, deployment and operations, commercial strategy, first-slice scope and deferrals, quality budgets, implementation workstreams, generated contracts, and living review/risk governance.

Completion is bounded by `BLUEPRINT_BASELINE_COMPLETION_CHECKLIST.md` and applies only to the controlled-prototype exception named in PDA-RDM-007. Future implementation findings may amend or supersede documents; they do not reopen the entire blueprint unless new evidence invalidates a baseline decision. FA4-032 remains open: the Constitution is Draft and the ADR ratification waves are not complete.

## First-slice workstreams

| Workstream | Weight | Status | Stage completion | Weighted contribution | Current evidence / next gate |
|---|---:|---|---:|---:|---|
| WS0 — Scaffold alignment and contracts | 8% | complete | 100% | 8.0% | PR #23, #31, #32; package families, foundation types, generated contracts, contract parity, and executable architecture gates are merged. |
| WS1 — Identity, tenancy, Party, authorization | 17% | complete | 100% | 17.0% | PR #54 merged the PR1–PR9 controlled-prototype closeout; PDA-IMPL-005 and the generated matrix record evidence and residual gates. |
| WS2 — Catalog and inventory ledger | 17% | in-progress | 60% | 10.2% | PR #63 (plan), #65 (PR1), #67 (PR2 Catalog core), #69 (PR3 Inventory ledger), #74 (PR4 durable event delivery), #76 (PR5 bounded imports and online numbering) are merged and independently audited. Governed-plan-and-contracts, Core/domain implementation, and Persistence/events/migrations/integrations stages are now all counted closed — every WS2 domain (Catalog, Inventory, Import/Export, Numbering) has a merged, audited core, persistence adapter, and event integration. User experience (PR6, issue #72) and Automated test dimensions / Independent closeout (PR7, issue #73) remain. See WS2 delivery detail. |
| WS3 — POS cash | 17% | planned | 0% | 0% | Blocked on WS2. |
| WS4 — Stored value | 11% | planned | 0% | 0% | Blocked on WS3. |
| WS5 — Offline sync | 12% | planned | 0% | 0% | Full workstream blocked on WS3; bounded client-engine research may begin after WS1 under the parallelism rule. |
| WS6 — Provider adapter | 9% | planned | 0% | 0% | Engine work may follow WS1; provider sandbox and pilot path remain externally gated by founder/provider decisions. |
| WS7 — Recovery and operations | 9% | planned | 0% | 0% | Starts after WS2 provides real ledgers/outbox; closes last. |
| **Total** | **100%** |  |  | **35.2%** | Provisional weighted implementation completion: **35.2%**. |

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

| Increment | State | Evidence |
|---|---|---|
| WS2 control plan (PDA-RDM-009) | complete | issue #62 (closed); PR #63 merged |
| PR1 governance, contracts, event schemas, and ledger spike | complete | issue #64 (closed); PR #65 merged; independently audited |
| PR2 Catalog core, persistence, API, and lifecycle | complete | issue #66 (closed); PR #67 merged; independently audited across two remediation rounds |
| PR3 Inventory ledger, balances, workflows, and offline boundary | complete | issue #68 (closed); PR #69 merged; independently audited at remediated head `48a72cd` |
| PR4 durable event delivery, worker topology, and projections | complete | issue #70 (closed pre-worker governance review) / PR #74 merged at `7202fc8`; independently audited across two rounds; addresses RR-006's delivery-worker/retry/dead-letter/consumer gap, disposition deferred to PR7 closeout below |
| PR5 bounded imports and online numbering foundation | complete | issue #71 (closed) / PR #76 merged at `f7d2a6b`; independently audited across two rounds (round 1 withheld concurrence on 4 P1 findings including numbering never reaching a production code path; round 2 recorded concurrence after all 4 were independently reproduced fixed, including a 10-way live concurrency test proving no duplicate effects under retry) |
| PR6 Product and Inventory web experience | not-started | issue #72 (open) |
| PR7 verification and controlled-prototype closeout | not-started | issue #73 (open); expected to close RR-006 and extend capability-evidence-coverage generation to WS2 |

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
- a real responsive administration shell with visible active context, Party linkage, roles, entitlements, sessions, audit, denial states, and reauthentication handling;
- WS2 governed Catalog and Inventory contracts, event schemas, and ledger spike (PR #65);
- Catalog domain core, persistence, and product lifecycle API (PR #67);
- Inventory ledger, balances, and workflow domain core with an offline boundary (PR #69);
- a durable event delivery worker, retries, dead-letter handling, consumers, and replay/projections beyond the minimum outbox (PR #74);
- bounded CSV product/opening-stock import with owner-command-mapped domain effects, a tenant-scoped reloadable API (list, findings, cancel, reconciliation, accept, audited purge), and an online Numbering service atomically wired into import creation (PR #76).

Not yet complete:

- WS2 product/inventory web experience and controlled-prototype closeout (PR6-PR7, issues #72-#73);
- WS3–WS7 business-domain implementation;
- production-grade RLS topology and evidence;
- production OTP/provider path and other external readiness gates.

## Immediate priorities

1. Continue the issue #12 WS2 sequence one issue/branch/worktree/PR at a time: issue #72 (PR6 Product and Inventory web experience) is next, followed by issue #73 (PR7 closeout, which should also disposition RR-006 and extend capability-evidence-coverage generation to WS2).
2. Extend the machine-readable evidence-source pattern per workstream; the program dashboard itself remains non-authoritative prose until a governed program-status source is introduced.

## Open risk summary

The Architecture Risk Register remains authoritative. The most important current categories are:

- controlled-prototype database isolation versus future production RLS topology;
- RR-006 (minimum outbox lacked a delivery worker, retry/dead-letter policy, and consumer idempotency) has merged, independently audited evidence against it from WS2 PR4 (PR #74), but remains open in the register pending a closure disposition — expected at WS2 PR7 closeout (issue #73), not asserted here;
- WS2 PR5 (PR #76) merged with disclosed, non-blocking residuals worth tracking into PR6/PR7: a composition-lane test-suite count that doesn't reproduce locally (root-caused to a missing test timeout override on a file outside PR5's own diff; CI itself is green), Numbering's cross-tenant test coverage is thinner than initially claimed (no dedicated Postgres-backed test), and several security/resource-proof tests (oversized-file bytes, malformed UTF-8, real EICAR-detection wiring, HTTP-layer error leakage) remain untested;
- provider, legal, customer, founder, security, accessibility, operational, and pilot evidence still open;
- risk of generated contracts, implementation, Fumadocs, and this dashboard drifting apart.

## Machine-readable status (deferred)

A generated `registry/program-status.json` was evaluated as part of the project-tracking audit that produced `GITHUB_PROJECTS_OPERATING_GUIDE.md`. It is deferred rather than added: no deterministic generator exists yet that can derive workstream status, stage completion, and evidence-cell counts purely from governed inputs (registries, merged PR evidence, `PROGRESS_MEASUREMENT_STANDARD.md`'s formula) without a human transcribing prose into JSON — and a hand-maintained JSON duplicating this file would drift from it exactly the way this dashboard's own PR9 row previously fell out of date after PR #54 merged, before this update corrected it. GitHub issue-count metadata must never become that generator's sole input, per the same rule this dashboard already enforces. Revisit once `registry/first-slice-tests.json` evidence-cell population and workstream stage evidence can both be read programmatically from merged, committed sources.

## Update rule

A PR may advance a percentage only when it closes a stage defined in `PROGRESS_MEASUREMENT_STANDARD.md` with merged evidence. Commit count, issue count, lines of code, elapsed time, and optimistic estimates do not advance progress.
