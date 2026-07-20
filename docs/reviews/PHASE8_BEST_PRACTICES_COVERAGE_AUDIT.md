---
document_id: PDA-REV-025
title: Phase 8 Best-Practices Coverage Audit
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Phase 8 Best-Practices Coverage Audit

## Purpose

Audit whether the post-#75 competitive-research corpus (`docs/blueprint/19-Competitive-Research/`) actually landed in operational governance, across the four areas scoped by `docs/project/GOVERNANCE_REMEDIATION_PROGRAM_PLAN.md`'s PR-12: UI/UX, deployment/cost/self-host, offline, and BI/analytics. This document is audit-only — it authors no new guidance, remediates nothing, and reports a per-cell disposition of either "covered: `<document + section>`" or "gap: issue #NNN." A cell with no matching content and no filed issue does not appear; every genuine gap this audit found already has an issue number below.

Distinguishing "covered" from "gap" required checking *quality and reachability*, not file existence: a document merely existing in the same topic area does not count. Coverage requires a specific, quotable match to the finding's actual content.

## Method

Four independent research passes (one per area), each briefed to report per-anchor: the finding's source text, the destination file/section if found, a direct quote, and a verdict with reasoning. Every "covered" and "no overclaiming" verdict below was independently spot-verified against the live repository before being recorded here — see the specific quotes cited, all confirmed present in the named file at the time of this audit (2026-07-20).

## Area 1 — UI/UX

Anchors: AIR-003, AIR-006, AIR-007, AIR-008 (from `ADOPT_IMPROVE_REJECT_REGISTER.md`), plus the two broader pattern documents `CROSS_DOMAIN_WORKFLOW_PATTERNS.md` and `COMMON_FAILURES_AND_PAIN_POINTS.md`.

| Anchor | Finding | Disposition |
|---|---|---|
| AIR-003 (fast search, saved views, command navigation) | Covered: `docs/blueprint/09-UX/NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md` §"Global Search" ("Search groups results by type and provides safe previews, scope, freshness, and navigation target") and Rule 12 (search/palette are accelerators, never the sole route). |
| AIR-006 (shared inbox/review-queue mechanics) | **Gap: issue #169.** No operational document outside `19-Competitive-Research/` reflects the mechanic; `CROSS_DOMAIN_REVIEW_QUEUE_STANDARD.md` exists only in the research corpus. Generic "queue" mentions in 09-UX (workspace list items, alert fields) are unrelated vocabulary, not the governed assign/accept/delegate/snooze/escalate/reauthorize mechanic. |
| AIR-007 (cross-domain suite navigation) | Covered: `NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`'s explicit "ERP maze" anti-pattern framing and the two-navigation-level cap rule. |
| AIR-008 (analytics/dashboard delivery) | Covered for the UI/UX slice (governed metric, freshness, accessible alternative) — see Area 4 for the two sub-findings this anchor still has open. |
| `CROSS_DOMAIN_WORKFLOW_PATTERNS.md` (shared mechanics: search/select, import mapping, review queue, approval, activity/history, correction, bulk action, offline work package) | Partial: 5 of 8 named mechanics have specific 09-UX counterparts (bulk action, import mapping, offline work package, correction, activity/history — see `ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`, `COMPONENT_CATALOG_AND_STATE_MATRIX.md`). The review-queue mechanic is the same gap as AIR-006 (**issue #169**); the seven-step workflow grammar itself is not reproduced as a named structure anywhere. |
| `COMMON_FAILURES_AND_PAIN_POINTS.md` (16 CFP entries, FAIL-007 cluster explicitly transferred to "proposed UX/accessibility review") | Covered for its own self-declared UX destination cluster: CFP-009/010/011 (bulk-action scope, infinite-scroll misuse, mobile task-shrinking) all have near-verbatim counterparts in `ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md` and `ADVANCED_INTERFACE_PATTERNS.md`. CFP-001 (ERP maze) also lands specifically. CFPs belonging to other domains (permission identifiers, audit-log readability) are correctly absent from 09-UX and are not claimed as gaps here. |

## Area 2 — Deployment, cost, and self-host

Documents: `SELF_HOSTED_COMPATIBILITY_MATRIX.md`, `CAPACITY_COST_AND_MULTI_REGION_STRATEGY.md`, `INFRASTRUCTURE_COST_WORKSHEET.md`, `BACKUP_RESTORE_AND_DISASTER_RECOVERY.md` (all under `docs/blueprint/12-Deployment/`).

Every unresolved cell these four documents themselves flag was enumerated and classified:

- **`INFRASTRUCTURE_COST_WORKSHEET.md`** carries the only tabular unresolved markers: every row of the Monthly Cost Categories table reads `Unresolved — evidence not yet available`. Ten rows (application compute, PostgreSQL, cache/queues, object storage, search, messaging/workflow, observability, network, backups/recovery, security tooling) are **evidence-gated** — each requires a measured workload, benchmark, or exercise (e.g., backups/recovery explicitly requires "exercise measurements") that hasn't happened, not more prose. Two rows (providers, support labor) are **founder-gated** — their own trigger text names founder/commercial approval directly.
- **`CAPACITY_COST_AND_MULTI_REGION_STRATEGY.md`**: region selection and failover-mode decisions are both **evidence-gated** — the document's own remedy is "benchmark candidate regions" and "requires measured need," empirical exercises, not authoring.
- **`SELF_HOSTED_COMPATIBILITY_MATRIX.md`** and **`BACKUP_RESTORE_AND_DISASTER_RECOVERY.md`**: no genuinely flagged unresolved markers found (both are written as standing policy/procedure, not populated matrices with placeholder cells).

**Zero writable-now gaps found in this area.** Per the plan's own instruction, this is a recordable outcome, not a failure — no PR-13 item is authored for Area 2's content itself.

**One traceability gap found**: the founder-gated cells (providers, support labor) don't cross-reference issue #88, even though `docs/project/PROGRAM_STATUS.md` already establishes #88 as owning the commercial offer/cost package — **gap: issue #171**.

## Area 3 — Offline

AIR-005 ("offline operation," Improve, destination "Offline/Device/domain specs," status **Prototype Required**) and AIR-014 ("hidden offline/provider uncertainty," Reject, destination "Offline/Operations," status **Supported**).

**Premise correction**: the plan's original framing assumed both AIR-005 and AIR-014 were "Prototype Required." Verified directly against `ADOPT_IMPROVE_REJECT_REGISTER.md`: only AIR-005 carries that status. AIR-014 is a *rejected* anti-pattern marked "Supported" — rejecting "hidden offline/provider uncertainty" as something the platform will do is a research-backed decision already, not a capability awaiting a prototype. This is internally coherent (every Improve entry is "Prototype Required"; every Reject entry is "Supported"), not a documentation inconsistency.

Checked whether offline *design* documents (`docs/blueprint/01-Platform/OFFLINE_SYNCHRONIZATION.md`, `DEVICE_AND_EDGE_MANAGEMENT.md`, ADR-0003/0010/0014, `FIRST_SLICE_IMPLEMENTATION_PLAN.md`'s WS5 scope) ever overclaim relative to what *evidence* documents (`DEVICE_OFFLINE_EVIDENCE_DISPOSITION.md`, `DIRECT_DEVICE_AND_OFFLINE_EVIDENCE_MATRIX.md`, `WS2_VERIFICATION_AND_CONTROLLED_PROTOTYPE_CLOSEOUT.md`) actually prove.

**Verdict: no overclaiming found; design claims and evidence-backed reality agree.** Every offline design document is either explicitly Draft-status rule language ("must," "required") or explicitly future/roadmap-gated (WS5 has not started; "Preparatory client-sync design may occur earlier, but P5 implementation and progress claims may not"). Every evidence document explicitly bounds its own claim (WS2: "does not issue leases, verify signatures/devices, transport batches, reconcile general sync, apply privacy tombstones, or claim end-to-end offline behavior; those remain WS5"). `PLATFORM_ADVANTAGE_REGISTER.md` and `MERIDIAN_DIFFERENTIATION_MANIFEST.md` both carry explicit anti-overclaiming rules naming "offline-first" specifically as a phrase that requires bounded definitions and independent evidence. No gap issue filed for this area.

## Area 4 — BI and analytics

`ANALYTICS_COMPETITIVE_CAPABILITY_MATRIX.md` (PDA-CIR-072) and `ANALYTICS_WORKFLOW_REFERENCE.md` (PDA-CIR-073), tied to AIR-008 (status "Prototype Required").

| Capability-matrix finding | Disposition |
|---|---|
| Governed metrics (ID, owner, version, unit, grain, filters) | Covered: `docs/blueprint/10-Data/ANALYTICS_SEMANTIC_LAYER_AND_METRIC_GOVERNANCE.md` §"Metric Record" — near 1:1 field list. |
| Freshness (watermark, lag, failed refresh, timezone) | Covered: `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` §"Real-Time and Streaming Data." |
| Filtering (chips, defaults, apply state, share semantics) | Covered: `DASHBOARD_AND_DATA_VISUALIZATION.md` §"Filters," `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` §"Cross-Filtering." |
| Comparison (disclosed window, completeness) | Covered: `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` §"Comparison Modes," near-verbatim. |
| Drill-down (preserve context + reauthorize) | Partial — context preservation covered repeatedly; **reauthorization before revealing the underlying record is absent (gap: issue #170)**. |
| Annotation (source-linked, not automatic causality) | Covered: `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` §"Annotations." |
| Delivery (export/subscription/alerts: purpose, recipient, expiration, snapshot time, audit, revocation) | **Gap: issue #170.** No analytics-specific document defines this; the closest analogue (`10-Data/DATA_CLASSIFICATION_AND_HANDLING.md`) is generic export governance, not analytics delivery, and never mentions purpose, snapshot timestamp, audit trail, or revocation. Consistent with AIR-008's own "Prototype Required" status — this is exactly the piece that never landed. |
| Accessibility (semantic table, text summary, keyboard, contrast) | Covered: `DASHBOARD_AND_DATA_VISUALIZATION.md` and `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` §"Accessibility," near-verbatim. |

**Rough count: 6 of 8 findings landed with real specificity, 1 partial, 1 shelf-ware.** No document in `09-UX/` or `10-Data/` cites `PDA-CIR-072`, `PDA-CIR-073`, or AIR-008 anywhere — the overlapping content reads as independently convergent design intent, not a documented transfer. **Traceability gap: issue #171** (shared with Area 1's traceability finding).

## Gap issues opened

- **#169** — shared review-queue/inbox mechanic (AIR-006, `CROSS_DOMAIN_WORKFLOW_PATTERNS.md`) has no operational home outside the research corpus.
- **#170** — analytics delivery/export governance is shelf-ware, and drill-down reauthorization is missing from `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`.
- **#171** — landed content in 09-UX, 10-Data, and 12-Deployment doesn't cite the AIR/`PDA-CIR`/#88 source it independently matches, so the transfer isn't traceable.

## Non-goals

This document authors no remediation. PR-13 (per the remediation plan) will only author what this matrix confirms as a writable-now gap, citing the matrix row and issue number directly — Area 2 (deployment/cost) contributed zero such items on its own content (only the traceability finding folded into #171).
