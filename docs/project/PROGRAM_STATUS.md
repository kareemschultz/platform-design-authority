# Meridian Program Status

**Lifecycle:** Controlled prototype

**Status basis:** provisional reporting convention in `PROGRESS_MEASUREMENT_STANDARD.md`

**Evidence cutoff:** `main` at `15417950925b78ad267e54fe6b3550010a46f60d`, which includes WS2 PR7 merged as `81e903b27bf41785106775afb33f9f88738e39b9`, the independent exact-`main` whole-project audit PDA-REV-013, PR #80's audited remediation, PR #89's founder-decision recording, and PR #91's independently concurred P-W2a closeout synchronization

**Last updated:** 2026-07-17

This dashboard is a non-authoritative program-control summary. It is subordinate to the authority order in `AGENTS.md`, and it cannot ratify a document, close a risk, or replace evidence in an ADR, approved specification, registry, review disposition, issue, or pull request.

## Executive view

| Measure | Current result | Interpretation |
|---|---:|---|
| Blueprint baseline completeness | **100% for controlled-prototype implementation commencement** | The bounded documentation baseline needed to continue the named prototypes exists. FA4-032, ratification waves, and production gates remain open. |
| First-slice implementation | **42.0% provisional weighted completion** | WS0, WS1, and WS2 are complete at controlled-prototype depth. PDA-REV-019 records the controlled-prototype repository disclosure review, subject to exact-head concurrence and merge; WS3 remains blocked on restricted evidence handling and retained real-world customer evidence. WS4–WS7 have not begun implementation. |
| WS1 progress | **100% stage-weighted** | PR1–PR9 implement contracts, persistence, identity/tenancy/Party, authorization, entitlements, Audit/revocation, the real shell, and governed closeout evidence. This is not pilot or production readiness. |
| WS2 progress | **100% stage-weighted** | PR1–PR7 implement and evidence Catalog, Inventory, durable event delivery, bounded import/numbering, and the Product/Inventory experience at controlled-prototype depth. The historical PR #79 review-sequence deviation is retained below. |
| Capability evidence coverage | **25/103 capabilities; 325/1,294 required cells** | The generated registry computes evidence coverage. All 11 WS1 and 14 WS2 capabilities are evidenced at their registered first-slice depth; this is not pilot or production evidence. |
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
| WS2 — Catalog and inventory ledger | 17% | complete | 100% | 17.0% | PR #79 merged the PR1–PR7 closeout evidence as `81e903b`; PDA-REV-013 independently reproduced the exact merged `main`, and issue #81 accepted that audit as the superseding WS2 review while retaining the missed pre-merge concurrence as a governance deviation. |
| WS3 — POS cash | 17% | blocked | 0% | 0% | PDA-REV-019 records issue #83's disclosure review, subject to exact-head concurrence and merge. Entry remains blocked until issue #94 establishes restricted raw-evidence handling and issue #82 records 8 interviews and 3 workflow observations across at least 3 businesses. |
| WS4 — Stored value | 11% | planned | 0% | 0% | Requires WS3, the recorded M3 P4–P7 charter checkpoint, and FDR-003 before the first schema freeze. |
| WS5 — Offline sync | 12% | planned | 0% | 0% | Requires WS3, the recorded M3 checkpoint, and the device-trust/key-management ADR; preparatory client-sync design may run earlier but does not advance progress. |
| WS6 — Provider adapter | 9% | planned | 0% | 0% | Provider-neutral analysis may run before M3; implementation waits for the recorded M3 checkpoint, and real-provider work remains gated by FDR-002/FDR-007 and issues #84/#85. |
| WS7 — Recovery and operations | 9% | planned | 0% | 0% | Requires the recorded M3 checkpoint and closes after WS4/WS5; production-readiness evidence must use the selected production-relevant topology. |
| **Total** | **100%** |  |  | **42.0%** | Provisional weighted implementation completion at the merged-`main` cutoff: WS0 contributes 8.0%, WS1 contributes 17.0%, and WS2 contributes 17.0%. Prototype completion does not advance any production-readiness gate. |

**WS2 closeout provenance and deviation:** PR #79 final head `22a3a38369d458d065d5fb2bc2216d09aec410de` merged as `81e903b27bf41785106775afb33f9f88738e39b9` without the governed pre-merge independent exact-head concurrence. PDA-REV-013 subsequently reviewed and reproduced the exact merged `main` at `81e903b`; its concurrence confirmed the WS2 implementation evidence while recording the sequence defect as F-A-001. The Founder accepted PDA-REV-013 as the superseding WS2 review in issue #81, comment `5008157609`. This disposition closes the controlled-prototype reporting gate without rewriting history or claiming that PR #79 followed the required sequence.

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
| PR7 verification and controlled-prototype closeout | complete with recorded sequence deviation | issue #73 / PR #79 final head `22a3a383` merged as `81e903b`; PDA-IMPL-007 and the machine-readable source evidence 14 WS2 capabilities / 182 executable cells; PDA-REV-013 independently reproduced exact merged `main`; issue #81 accepted that audit as the superseding review and retained the missed pre-merge concurrence as F-A-001 |

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

- WS3–WS7 business-domain implementation;
- WS3 restricted raw-evidence handling and retained real-world customer-discovery evidence;
- production-grade RLS topology and evidence;
- production OTP/provider path and other external readiness gates.

## Immediate priorities

1. Complete issue #94 before retaining raw customer evidence: select an access-controlled evidence store and public-safe opaque reference scheme.
2. Complete issue #82 with retained real-world evidence from at least 8 structured retailer interviews and 3 direct workflow observations across at least 3 businesses. Generated, simulated, inferred, or waived evidence does not satisfy this gate. PDA-REV-019 completes the separate repository disclosure review at controlled-prototype depth after independent concurrence and merge.
3. Continue issues #92/#93 and the parallel external-evidence track in issues #84–#88 without representing open security, licensing, legal, provider, accessibility, or commercial work as readiness.
4. Extend the machine-readable evidence-source pattern per workstream; this dashboard remains a non-authoritative summary until a governed program-status source can be derived deterministically.

## Production-readiness gates (measure 4)

Per `PROGRESS_MEASUREMENT_STANDARD.md` measure 4, all eleven gate families are enumerated with owner and current artifact state. "No artifact yet" is the honest status, not a placeholder. This table records gate state only; it cannot claim readiness.

| Gate family | Status | Owner | Evidence pointer |
|---|---|---|---|
| Founder decisions | Partially recorded; material decisions open | Founder | FDR-004 is ratified; FDR-005's controlled-prototype path review is PDA-REV-019 while final visibility/licensing/contribution decisions remain open; FDR-011 and FDR-001–003/FDR-006–010 retain their named triggers. Issue #88 owns the commercial offer/cost package. |
| Legal/tax validation (Guyana) | Not started | Founder + qualified counsel | Issue #84; `GUYANA_REGULATORY_VERIFICATION-2026-07-11.md` is a prototype research pack only, not professional advice or validation. |
| Customer evidence | Zero recorded; WS3 blocking | Founder | Issue #94 must establish restricted raw-evidence handling; issue #82 and `MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md` then require 8 interviews plus 3 observations across at least 3 businesses. |
| Provider certification | Not started | Founder + named providers | Issue #85; SA-025/SA-026 and FDR-002/FDR-007 define the unresolved provider categories and prerequisites. Simulator behavior is not provider evidence. |
| Penetration testing | Not started | PDA + qualified independent provider | Issue #87 and RR-009; execute only after production-relevant RLS and deployment topology exist, then retain sanitized report/retest pointers. |
| Privacy/retention validation | Design only | Founder + qualified privacy counsel | Issue #84; ADR-0014 and the deletion journal are designed, while Data Protection Act commencement/obligations and retention periods remain professionally unverified. |
| Accessibility audit | Internal prototype evidence only | PDA + independent accessibility specialist | Issue #86 and RR-009; WS1/WS2 automated/manual evidence does not replace assistive-technology evaluation or establish WCAG 2.2 AA conformance. |
| Performance/capacity | Controlled-prototype samples only | PDA | Perf JSONs carry explicit limitation fields; no artifact for production topology |
| Recovery exercises | No artifact yet | PDA/Ops | WS7 will execute the Draft runbooks (restore, deletion-journal replay) |
| Operational readiness | Design only | Founder + PDA | 15-Operations runbooks Draft; support/staffing model undecided |
| Pilot outcomes | Blocked | Founder | Issues #82–#88 plus the remaining RLS, recovery, operations, privacy, founder, and provider gates; no pilot has been authorized or executed. |

## Open risk summary

The Architecture Risk Register remains authoritative. The most important current categories are:

- controlled-prototype database isolation versus future production RLS topology;
- RR-006 is closed at controlled-prototype depth by PDA-REV-009 after PR #74 exact-head concurrence and merge; production event SLOs, capacity, multi-replica topology, retention, and restore exercises remain open under their named owners;
- RR-007 remains open: application/repository constraints and two-tenant tests are not production PostgreSQL role/RLS topology evidence;
- F-A-001 is dispositioned through the Founder-approved superseding exact-`main` review, but the PR #79 pre-merge concurrence failure remains recorded as a governance deviation rather than rewritten history;
- customer, repository-disclosure, provider, legal, founder, security, accessibility, commercial, operational, and pilot evidence remains open through issues #82–#88 and the Architecture Risk Register;
- risk of generated contracts, implementation, Fumadocs, and this dashboard drifting apart.

## Machine-readable status (deferred)

A generated `registry/program-status.json` was evaluated as part of the project-tracking audit that produced `GITHUB_PROJECTS_OPERATING_GUIDE.md`. It is deferred rather than added: no deterministic generator exists yet that can derive workstream status, stage completion, and evidence-cell counts purely from governed inputs (registries, merged PR evidence, `PROGRESS_MEASUREMENT_STANDARD.md`'s formula) without a human transcribing prose into JSON — and a hand-maintained JSON duplicating this file would drift from it exactly the way this dashboard's own PR9 row previously fell out of date after PR #54 merged, before this update corrected it. GitHub issue-count metadata must never become that generator's sole input, per the same rule this dashboard already enforces. Revisit once `registry/first-slice-tests.json` evidence-cell population and workstream stage evidence can both be read programmatically from merged, committed sources.

## Update rule

A PR may advance a percentage only when it closes a stage defined in `PROGRESS_MEASUREMENT_STANDARD.md` with merged evidence. Commit count, issue count, lines of code, elapsed time, and optimistic estimates do not advance progress.
