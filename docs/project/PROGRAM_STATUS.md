# Meridian Program Status

**Lifecycle:** Controlled prototype

**Status basis:** provisional reporting convention in `PROGRESS_MEASUREMENT_STANDARD.md`

**Evidence cutoff:** `main` at `635fa3f1618d5c880585fdd3e86de7a16d0993ac`, which includes the RR-011 remediation and re-verification, WS1 closeout, project-tracking records, and WS2 PR1-PR6 (governance/contracts, Catalog core, Inventory ledger, durable event delivery, bounded imports/online numbering, and the Product/Inventory web experience), each independently audited across one or more remediation rounds before merge

**Last updated:** 2026-07-16

This dashboard is a non-authoritative program-control summary. It is subordinate to the authority order in `AGENTS.md`, and it cannot ratify a document, close a risk, or replace evidence in an ADR, approved specification, registry, review disposition, issue, or pull request.

## Executive view

| Measure | Current result | Interpretation |
|---|---:|---|
| Blueprint baseline completeness | **100% for controlled-prototype implementation commencement** | The bounded documentation baseline needed to continue the named prototypes exists. FA4-032, ratification waves, and production gates remain open. |
| First-slice implementation | **37.8% provisional weighted completion** | WS0 and WS1 are complete at controlled-prototype depth. WS2 has four of six weighted stages merged (75%); automated test/quality-budget evidence and independent closeout remain open on merged `main`. WS3–WS7 have not begun implementation. |
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
| WS2 — Catalog and inventory ledger | 17% | in-progress | 75% | 12.8% | PR #63 (plan), #65 (PR1), #67 (PR2), #69 (PR3), #74 (PR4), #76 (PR5), and #78 (PR6 web experience) complete the plan, core, persistence/integration, and UI stages. Issue #73 owns the remaining 15% automated evidence/quality-budget stage and 10% independent closeout stage. |
| WS3 — POS cash | 17% | planned | 0% | 0% | Blocked on WS2. |
| WS4 — Stored value | 11% | planned | 0% | 0% | Blocked on WS3. |
| WS5 — Offline sync | 12% | planned | 0% | 0% | Full workstream blocked on WS3; bounded client-engine research may begin after WS1 under the parallelism rule. |
| WS6 — Provider adapter | 9% | planned | 0% | 0% | Engine work may follow WS1; provider sandbox and pilot path remain externally gated by founder/provider decisions. |
| WS7 — Recovery and operations | 9% | planned | 0% | 0% | Starts after WS2 provides real ledgers/outbox; closes last. |
| **Total** | **100%** |  |  | **37.8%** | Provisional weighted implementation completion at the merged-main cutoff: exact arithmetic is **37.75%**, rounded to one decimal by the reporting standard. WS2 reaches 100% / 17.0% contribution and the program reaches 42.0% only after PR7 merge plus the required final whole-workstream audit. |

**PR7 branch candidate (not merged-main progress):** PDA-IMPL-007 and `evidence/first-slice/ws2-capability-evidence.json` generate 25/103 evidenced capabilities and 325/1,294 executable required cells, including all 14 WS2 capabilities / 182 WS2 cells. The headline remains 11/103 and 143/1,294 until exact-head concurrence and merge; the WS2 percentage remains 75% until the separate whole-workstream audit also concurs.

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
| PR4 durable event delivery, worker topology, and projections | complete | issue #70 / PR #74 merged at `7202fc8`; independently audited across two rounds; PDA-REV-009 records RR-006 closed at controlled-prototype depth |
| PR5 bounded imports and online numbering foundation | complete | issue #71 (closed) / PR #76 merged at `f7d2a6b`; independently audited across two rounds (round 1 withheld concurrence on 4 P1 findings including numbering never reaching a production code path; round 2 recorded concurrence after all 4 were independently reproduced fixed, including a 10-way live concurrency test proving no duplicate effects under retry) |
| PR6 Product and Inventory web experience | complete | issue #72 closed; PR #78 exact head `c69e5fb` concurred and merged as `635fa3f`; PDA-APP-025 |
| PR7 verification and controlled-prototype closeout | closeout candidate | issue #73; PDA-IMPL-007 plus the machine-readable source generate 14 WS2 capabilities / 182 executable cells and retain reproduced database/browser evidence plus explicit production deferrals; exact-head concurrence, merge, exact-main checks, and final whole-WS2 audit remain open |

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
- a real responsive Product, balance, Adjustment, Count, Transfer, and import web experience over generated clients and current server authority (PR #78).

Not yet complete:

- WS2 verification, exact-head/merge/exact-main closeout, and final whole-workstream audit (PR7, issue #73);
- WS3–WS7 business-domain implementation;
- production-grade RLS topology and evidence;
- production OTP/provider path and other external readiness gates.

## Immediate priorities

1. Complete issue #73 as one focused PR7: registry-derived evidence, exact-head independent concurrence, merge, exact-main verification, and the separate final whole-WS2 audit. Do not close issue #12 or start broad WS3 implementation before that audit disposition is recorded.
2. Extend the machine-readable evidence-source pattern per workstream; the program dashboard itself remains non-authoritative prose until a governed program-status source is introduced.

## Production-readiness gates (measure 4)

Per `PROGRESS_MEASUREMENT_STANDARD.md` measure 4, all eleven gate families are enumerated with owner and current artifact state. "No artifact yet" is the honest status, not a placeholder. This table records gate state only; it cannot claim readiness.

| Gate family | Status | Owner | Evidence pointer |
|---|---|---|---|
| Founder decisions | Open | Founder | `FOUNDER_DECISION_REGISTER.md` FDR-001–010 (all open; FDR-004 past its M0 checkpoint — fifth-audit F-L-003) |
| Legal/tax validation (Guyana) | Not started | Founder + counsel | `GUYANA_REGULATORY_VERIFICATION-2026-07-11.md` (prototype pack only; TA-007) |
| Customer evidence | Zero recorded | Founder | `MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md` evidence log (fifth-audit F-L-002) |
| Provider certification | Not started | Founder + provider | SA-025/SA-026; blocked on FDR-002/FDR-007 |
| Penetration testing | Not started | PDA + external firm | RR-009; after RR-007 RLS topology |
| Privacy/retention validation | Design only | Privacy counsel | ADR-0014 + deletion journal designed; DPA commencement unverified; retention periods pending professional confirmation |
| Accessibility audit | Internal evidence only | PDA + external reviewers | WS1/WS2 automated+manual evidence retained; independent assistive-technology review open (RR-009) |
| Performance/capacity | Controlled-prototype samples only | PDA | Perf JSONs carry explicit limitation fields; no artifact for production topology |
| Recovery exercises | No artifact yet | PDA/Ops | WS7 will execute the Draft runbooks (restore, deletion-journal replay) |
| Operational readiness | Design only | Founder + PDA | 15-Operations runbooks Draft; support/staffing model undecided |
| Pilot outcomes | Blocked | Founder | All above gates plus commercial offer (fifth-audit F-L-010) |

## Open risk summary

The Architecture Risk Register remains authoritative. The most important current categories are:

- controlled-prototype database isolation versus future production RLS topology;
- RR-006 is closed at controlled-prototype depth by PDA-REV-009 after PR #74 exact-head concurrence and merge; production event SLOs, capacity, multi-replica topology, retention, and restore exercises remain open under their named owners;
- RR-007 remains open: application/repository constraints and two-tenant tests are not production PostgreSQL role/RLS topology evidence;
- provider, legal, customer, founder, security, accessibility, operational, and pilot evidence still open;
- risk of generated contracts, implementation, Fumadocs, and this dashboard drifting apart.

## Machine-readable status (deferred)

A generated `registry/program-status.json` was evaluated as part of the project-tracking audit that produced `GITHUB_PROJECTS_OPERATING_GUIDE.md`. It is deferred rather than added: no deterministic generator exists yet that can derive workstream status, stage completion, and evidence-cell counts purely from governed inputs (registries, merged PR evidence, `PROGRESS_MEASUREMENT_STANDARD.md`'s formula) without a human transcribing prose into JSON — and a hand-maintained JSON duplicating this file would drift from it exactly the way this dashboard's own PR9 row previously fell out of date after PR #54 merged, before this update corrected it. GitHub issue-count metadata must never become that generator's sole input, per the same rule this dashboard already enforces. Revisit once `registry/first-slice-tests.json` evidence-cell population and workstream stage evidence can both be read programmatically from merged, committed sources.

## Update rule

A PR may advance a percentage only when it closes a stage defined in `PROGRESS_MEASUREMENT_STANDARD.md` with merged evidence. Commit count, issue count, lines of code, elapsed time, and optimistic estimates do not advance progress.
