---
document_id: PDA-REV-014
title: Fable 5 Fifth Audit Disposition and Remediation Plan
version: 0.2.2
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# Fable 5 Fifth Audit — Disposition and Remediation Plan

Proposed dispositions for PDA-REV-013 findings. Normative finding fields (actual/expected, repro, closure tests) live in `evidence/audit/fable5-whole-project-findings.yaml`; this plan adds accept/reject, wave assignment, and sequencing. **Nothing here closes a finding — closure requires the named closure test plus independent verification.** Founder-owned rows are decisions, not tasks; they stop the wave until decided.

## Wave plan

| Wave | Theme | Contents | Gate to start | Exit |
|---|---|---|---|---|
| **W1 — Decisions** | Founder dispositions that unblock everything else | F-A-001 (register this audit as the superseding exact-main WS2 review, or order a dedicated one); F-L-001 (approve the external-evidence track); F-L-002 (set the customer-evidence bar and WS3 gate); F-L-003 (ratify FDR-004 or amend PDA-RDM-001); F-L-004 (state P4–P7 entry clearance); F-L-006 (create the naming FDR); F-L-007 (FDR-005 trigger line) | None — founder review of this plan | Each decision recorded in FDR/roadmap/risk register |
| **W2 — Governance & guard integrity** | One PR per item, mechanical, no product behavior change | F-A-002 (tracking sync, gated on F-A-001 outcome); F-A-003 (agent-contract parity + parity check; record FA4-015/030 reopen-and-reclose); F-B-001 (packages/ stray-source guard + probe); F-B-002 (migrator-import guard + probes); F-B-003 (probe cleanup + delete residue dirs); F-B-004 (document test-source exemption); F-B-005 (pool-export restriction or checker rule); F-L-005 (11-gate readiness table in PROGRAM_STATUS); F-I-001 (unittest-main guards or doc fix; wire ws2 script-test into CI) | W1 decided (only F-A-002 truly depends on it; the rest may start immediately) | All checker probes green; validate_docs/registries green; risk register updated |
| **W3 — UX & hygiene** | Small frontend fixes, one PR (or two) | F-H-001 (QueryFailure section-aware return); F-H-002 (loader status role); F-H-004 (delete dead dashboard component); F-H-005 (single error container id); F-H-006 (Operations nav overflow guard); F-H-003, F-H-007, F-H-008 (record decisions/exceptions); F-B-006 (§11 test carve-out); F-A-004 (README authority pointer); F-L-008 (PDA-RDM-001 Phase 1 amendment) | None | Closure tests in YAML register pass; e2e/a11y lanes green |
| **W4 — Pre-WS4 flags** | Deferred decisions with named latest-safe points | F-L-009 (FDR-003 before WS4 PR1 schema freeze); F-L-010 (commercial offer/cost item on the external track); offline key-management ADR before WS5 PR1 (Unknowns register row 20) | Reaching the named workstream | Decision recorded before the freeze point |

## Per-finding disposition (proposed)

All 29 findings (third-review correction: this line previously said "27" and its own disposition breakdown summed to 28, omitting F-A-003 entirely; both are fixed here — the register has always had 29 entries, see the finding-count-drift correction below): **accept** as stated in the YAML register, with dispositions `decide` (F-A-001, F-L-001/002/003/004/006/007/009/010 — founder), `fix` (F-A-002, F-A-003, F-B-001/002/003/005, F-H-001/002/004/005/006, F-L-005/008, F-A-004, F-I-001), `document` (F-B-004/006, F-H-003/007/008). No finding is rejected; no false positive identified. Severity accepted as assessed (no inflation found on lead re-verification of every P1/P2).

## Contradiction-resolution matrix

| Contradiction | Sources (authority) | Resolution owner | Proposed resolution |
|---|---|---|---|
| 25/103 vs 11/103 evidence headline | registry/first-slice-tests.json (generated) vs PROGRAM_STATUS (dashboard) | Founder via F-A-001 | If this audit is registered as the superseding review: adopt 25/103 in the tracking sync. Otherwise revert the registry claim path. |
| AGENTS.md vs CLAUDE.md | Both tier-7 agent contracts | PDA | Make AGENTS.md the normative superset; CLAUDE.md becomes AGENTS.md content + Claude-specific additions, with a parity check |
| PDA-RDM-001 Phase 0/1 vs PDA-RDM-004/007 execution | Roadmap (Draft) vs plans (Draft, self-subordinated) | Founder (Phase 0), PDA (Phase 1) | Amend PDA-RDM-001 to match FDR-004 wording and reference the WS decomposition |
| README authority list vs AGENTS.md §1 | README (exempt summary) vs AGENTS.md | PDA | README defers to AGENTS.md §1 |

## Risk-register propagation

- Reopen-and-reclose rows for FA4-015/FA4-030 citing F-A-003 and the parity-check closure.
- New rows (or FDR annotations) for: external-evidence track (F-L-001), customer-evidence gate (F-L-002), P4–P7 clearance (F-L-004), naming FDR (F-L-006), FDR-005 trigger (F-L-007), architecture-guard gaps until W2 closes (F-B-001/002/005).
- RR-006/RR-007/RR-009/RR-011 remain as recorded — this audit re-verified their closure/openness claims as accurate.

## Rollback

Every W2/W3 PR is independently revertable (no data migrations, no contract changes). W1 decisions are recorded facts and are not rolled back; they are superseded by later founder decisions if needed.

## Independent review requirement

Each wave PR requires exact-head independent concurrence before merge — including the tracking-sync PR that closes F-A-002. The fifth-audit report itself must never be edited by remediation; status changes happen in this plan and the risk register.

## Implementation status (2026-07-17, same session as delivery)

The founder authorized immediate remediation of all non-founder-gated findings. Implemented on branch `claude/platform-design-authority-audit-1587d8`:

- **W2 implemented** (commit `7d6b05b`): F-A-003 (parity restored + executable `validate_agent_contract_parity` gate), F-A-004, F-B-001/002/003/004/005 (three new checker rules with negative probes; probe teardown fixed; residue dirs removed; shutdown-only lifecycle module), F-L-005 (11-family readiness gate table), F-L-008, F-I-001 (both invocation forms now work).
- **W3 implemented** (commit `0841136`): F-H-001 (section-aware `QueryFailure` via `sectionOverviewPath`, unit-tested), F-H-002, F-H-004, F-H-005, F-H-006 fixed; F-H-003/007/008 and F-B-006 recorded (token-doc drift note, manifest seam note, TD-008, §11 test carve-out).
- **Status:** implemented-pending-independent-review. Per this plan's review rule, none of these findings is *closed* until an independent exact-head review of the remediation PR reproduces the closure tests and records concurrence, and the PR merges green.
- **Correction (F-I-001):** the audit's claim that `test_check_ws2_evidence.py` "has no direct CI step" is a **partial false positive** — CI runs it via `bun run ws2:evidence:check` (`meridian-prototype.yml:129`), which chains `python -m unittest scripts/test_check_ws2_evidence.py`. The invocation-inconsistency half of the finding was real and is fixed. This is the narrative record of the correction, kept here (not in the immutable report) per evidence-immutability rules. A one-line pointer to this section also lives in `evidence/audit/fable5-whole-project-findings.yaml`'s F-I-001 `status` field, since that file is the machine-readable finding index and every finding's status is expected to be discoverable there without cross-referencing this plan first; the two are not competing narratives, this plan is the authoritative prose and the YAML field is a pointer to it (second-review correction — a prior review found the YAML line restating the correction in full, which read as a second independent narrative; it now only points here).
- **Still open (founder W1):** F-A-001, F-A-002 (gated on F-A-001), F-L-001/002/003/004/006/007/009/010.
- **Correction (finding-count drift):** the immutable report's summary line (`FABLE5_FIFTH_AUDIT_V1.md:17`) states "0 P0 · 3 P1 · 9 P2 · 15 P3 (27 findings)"; the register (`evidence/audit/fable5-whole-project-findings.yaml`) has always contained 29 findings at 0 P0/3 P1/10 P2/16 P3 — the report's summary line undercounts by one P2 and one P3 finding, a drafting-time miscount not caused by any later edit (no finding was added, removed, or resevered by remediation; the id sequence F-A-001…004/F-B-001…006/F-H-001…008/F-I-001/F-L-001…010 has always been exactly 29 with no gaps). The report is not edited per evidence-immutability rules. The register's `audit.counts` field is corrected to the true 29-count and `scripts/validate_docs.py`'s `validate_audit_finding_counts()` mechanically enforces that field against the actual `findings` list going forward, so this specific drift cannot recur silently even though the report's own prose line is permanently frozen at the wrong number.
