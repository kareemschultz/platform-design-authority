---
document_id: PDA-REV-014
title: Fable 5 Fifth Audit Disposition and Remediation Plan
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# Fable 5 Fifth Audit — Disposition and Remediation Plan

Accepted dispositions for PDA-REV-013 findings. Normative finding fields (actual/expected, repro, closure tests) live in `evidence/audit/fable5-whole-project-findings.yaml`; this plan adds accept/reject, wave assignment, sequencing, and status pointers. **Nothing here alone closes a finding — closure requires the named closure test plus independent verification.** Founder-owned rows are decisions, not tasks; they stop the wave until decided.

## Wave plan

| Wave | Theme | Contents | Gate to start | Exit |
|---|---|---|---|---|
| **W1 — Decisions** | Founder dispositions that unblock everything else | F-A-001 (PDA-REV-013 supersedes the missed pre-merge WS2 review, with the deviation retained); F-L-001 (approve the external-evidence track); F-L-002 (set the customer-evidence bar and WS3 gate); F-L-003 (ratify FDR-004); F-L-004 (state P4–P7 entry clearance); F-L-006 (create the naming FDR); F-L-007 (FDR-005 trigger and disclosure policy) | Founder approval recorded in issue #81 | Decisions present in the Founder Decision Register and named governing plans, then independently reviewed and merged; tracking/risk propagation follows in P-W2a |
| **W2 — Governance & guard integrity** | One PR per item, mechanical, no product behavior change | F-A-002 (tracking sync, gated on F-A-001 outcome); F-A-003 (agent-contract parity + parity check; record FA4-015/030 reopen-and-reclose); F-B-001 (packages/ stray-source guard + probe); F-B-002 (migrator-import guard + probes); F-B-003 (probe cleanup + delete residue dirs); F-B-004 (document test-source exemption); F-B-005 (pool-export restriction or checker rule); F-L-005 (11-gate readiness table in PROGRAM_STATUS); F-I-001 (unittest-main guards or doc fix; wire ws2 script-test into CI) | W1 decided (only F-A-002 truly depends on it; the rest may start immediately) | All checker probes green; validate_docs/registries green; risk register updated |
| **W3 — UX & hygiene** | Small frontend fixes, one PR (or two) | F-H-001 (QueryFailure section-aware return); F-H-002 (loader status role); F-H-004 (delete dead dashboard component); F-H-005 (single error container id); F-H-006 (Operations nav overflow guard); F-H-003, F-H-007, F-H-008 (record decisions/exceptions); F-B-006 (§11 test carve-out); F-A-004 (README authority pointer); F-L-008 (PDA-RDM-001 Phase 1 amendment) | None | Closure tests in YAML register pass; e2e/a11y lanes green |
| **W4 — Pre-WS4 flags** | Deferred decisions with named latest-safe points | F-L-009 (FDR-003 before WS4 PR1 schema freeze); F-L-010 (commercial offer/cost item on the external track); offline key-management ADR before WS5 PR1 (Unknowns register row 20) | Reaching the named workstream | Decision recorded before the freeze point |

## P-W1 founder decision record (2026-07-17)

The Founder approved all seven P-W1 recommendations in GitHub issue #81, comment `5008157609`. Before that decision, PR #80 received independent exact-head concurrence for `9da2c217858270ec0fc1222921e8944f48a3307e` in comment `5008076728` and merged at `24d28e68cd7766a50523bee871efa3d2582b88c3`. The P-W1 record then received independent exact-head concurrence for `43c1519a9c9c097733b397f8cbf96c1928a4b281` in PR #89 comment `5008646684` and merged at `7de0688d11a80de950f0e0639ade84b23e790e59`. The issue comment is the dated approval source; this section and the named governing documents are the repository record. Recording a decision is not by itself closure of every related finding: each YAML closure test and the required independent exact-head review still apply.

| Finding | Recorded founder decision | Governed repository propagation | Remaining closure work |
|---|---|---|---|
| F-A-001 | Accept PDA-REV-013 as the superseding exact-`main` WS2 review; retain the missed pre-merge PR #79 concurrence as a documented governance deviation rather than ordering another WS2 review. | This plan and P-W2a issue #90 | P-W2a implements the PDA-IMPL-007, PDA-RDM-009, PROGRAM_STATUS, release-note, and risk-register updates; those updates remain pending independent exact-head review and merge. |
| F-L-001 | Approve WSX as the parallel external-evidence track with real accountable owners and milestone gates. | PDA-REV-015 and PDA-RDM-007 | Maintain issues #82–#88 and their evidence pointers; no placeholder person or unsourced external conclusion counts as evidence. |
| F-L-002 | Gate WS3 entry on at least 8 structured retailer interviews plus 3 direct workflow observations across at least 3 distinct businesses. | PDA-REV-015 and PDA-RDM-007 | Issue #82 must contain or cite real customer evidence; agents may not fabricate, simulate, infer, or waive it. |
| F-L-003 | Ratify FDR-004's first retail beachhead scope, preserving every stated production deferral; record that M0 proceeded under provisional adoption before formal ratification. | FDR-004 and PDA-RDM-001 | P-W2a records the historical M0 sequence in the risk/tracking records. |
| F-L-004 | Use the M3 charter checkpoint as the general P4–P7 clearance, with each prototype's stricter decision/evidence gates still binding. | PDA-RDM-004, PDA-RDM-007, and PDA-REV-015 | The M3 review and workstream-specific gates must be evidenced before the applicable prototype begins. |
| F-L-006 | Keep Meridian internal-only; create FDR-011 and require product-name, trademark, domain, npm-scope, and publication checks before any public or tenant-visible use. | FDR-011, ADR-0026, and the dated naming-availability appendix | Availability remains unverified until dated external checks are attached; no public package or commercial-name claim is authorized meanwhile. |
| F-L-007 | Keep the repository public provisionally, require immediate disclosure/redaction review and ratification before WS3, and define allowed/prohibited disclosure classes. | FDR-005, WSX, and PDA-RDM-007 | Complete issue #83 and retain the review; secrets, customer data, private negotiations, exploit-ready production security detail, and protected premium material remain prohibited regardless of visibility. |

WSX tracking is explicit and non-duplicative: #82 customer discovery, #83 repository disclosure/redaction, #84 Guyana counsel, #85 provider capability/certification, #86 independent accessibility, #87 penetration testing, and #88 commercial offer/cost worksheet. Each issue records its accountable role, start-by and finish gate, and the evidence that an agent cannot supply.

### PR boundaries and current P-W2a status

PR #89 recorded P-W1 founder authority and its named governing sources only; it did not change product code, claim external evidence, or perform the tracking sync. That deliberate boundary was independently verified before PR #89 merged. P-W2a is now implemented separately under issue #90: PROGRAM_STATUS, the WS2 closeout ledger/plan, release-note language, Architecture Risk Register, and status pointers are synchronized without product/runtime changes. P-W2a is **implemented-pending-independent-review**, not closed; its exact head must receive independent concurrence and merge green before F-A-001/F-A-002 tracking closure is recorded.

## Per-finding disposition

All 29 findings (third-review correction: this line previously said "27" and its own disposition breakdown summed to 28, omitting F-A-003 entirely; both are fixed here — the register has always had 29 entries, see the finding-count-drift correction below): **accept** as stated in the YAML register, with dispositions `decide` (F-A-001, F-L-001/002/003/004/006/007/009/010 — founder), `fix` (F-A-002, F-A-003, F-B-001/002/003/005, F-H-001/002/004/005/006, F-L-005/008, F-A-004, F-I-001), `document` (F-B-004/006, F-H-003/007/008). No finding is rejected; the F-I-001 partial-false-positive correction is retained below. Severity accepted as assessed (no inflation found on lead re-verification of every P1/P2).

## Contradiction-resolution matrix

| Contradiction | Sources (authority) | Resolution owner | Recorded resolution |
|---|---|---|---|
| 25/103 vs 11/103 evidence headline | registry/first-slice-tests.json (generated) vs PROGRAM_STATUS (dashboard) | Founder via F-A-001 | Founder selected PDA-REV-013 as the superseding review; P-W2a adopts 25/103 in the tracking sync and records the actual review sequence. |
| AGENTS.md vs CLAUDE.md | Both tier-7 agent contracts | PDA | PR #80 restored byte-for-byte parity and added executable `validate_agent_contract_parity` enforcement. |
| PDA-RDM-001 Phase 0/1 vs PDA-RDM-004/007 execution | Roadmap (Draft) vs plans (Draft, self-subordinated) | Founder (Phase 0), PDA (Phase 1) | FDR-004 is ratified; retain the recorded fact that M0 used provisional adoption, and keep PDA-RDM-001 aligned with the WS decomposition. |
| README authority list vs AGENTS.md §1 | README (exempt summary) vs AGENTS.md | PDA | README defers to AGENTS.md §1 |

## Risk-register propagation

- FA4-015/FA4-030 already carry their fifth-audit reopen-and-reclose history in the Fourth Audit table; P-W2a does not duplicate those rows.
- P-W2a adds concise status pointers for F-A-001 and F-A-002 and synchronizes the W2/W3 status pointers to PR #80's independently concurred merge. F-A-001/F-A-002 remain implemented pending P-W2a independent review and merge; the W2/W3 findings are closed only at their finding-specific closure-test depth, with no founder, external, pilot, or production claim.
- P-W1 records the external-evidence track (F-L-001), customer-evidence gate (F-L-002), P4–P7 clearance (F-L-004), naming FDR (F-L-006), and FDR-005 trigger (F-L-007). Their external or later-workstream evidence gates remain open where stated.
- RR-006/RR-007/RR-009/RR-011 remain as recorded — this audit re-verified their closure/openness claims as accurate.

## Rollback

Every W2/W3 PR is independently revertable (no data migrations, no contract changes). W1 decisions are recorded facts and are not rolled back; they are superseded by later founder decisions if needed.

## Independent review requirement

Each wave PR requires exact-head independent concurrence before merge — including the tracking-sync PR that closes F-A-002. The fifth-audit report itself must never be edited by remediation; status changes happen in this plan and the risk register.

## Implementation status (through 2026-07-17)

The founder authorized immediate remediation of all non-founder-gated findings. W2/W3 were implemented on branch `claude/platform-design-authority-audit-1587d8`, independently reviewed, and merged through PR #80:

- **W2 implemented** (commit `7d6b05b`): F-A-003 (parity restored + executable `validate_agent_contract_parity` gate), F-A-004, F-B-001/002/003/004/005 (three new checker rules with negative probes; probe teardown fixed; residue dirs removed; shutdown-only lifecycle module), F-L-005 (11-family readiness gate table), F-L-008, F-I-001 (both invocation forms now work).
- **W3 implemented** (commit `0841136`): F-H-001 (section-aware `QueryFailure` via `sectionOverviewPath`, unit-tested), F-H-002, F-H-004, F-H-005, F-H-006 fixed; F-H-003/007/008 and F-B-006 recorded (token-doc drift note, manifest seam note, TD-008, §11 test carve-out).
- **PR #80 review and merge:** independent exact-head concurrence was recorded for `9da2c217858270ec0fc1222921e8944f48a3307e` in comment `5008076728`; the PR then merged at `24d28e68cd7766a50523bee871efa3d2582b88c3`. The concurrence explicitly closes the reviewed W2/W3 remediation evidence, so their machine-readable status pointers are synchronized to closed. Every closure remains limited to its finding-specific test; no founder, external, pilot, or production gate is implied.
- **Correction (F-I-001):** the audit's claim that `test_check_ws2_evidence.py` "has no direct CI step" is a **partial false positive** — CI runs it via `bun run ws2:evidence:check` (`meridian-prototype.yml:129`), which chains `python -m unittest scripts/test_check_ws2_evidence.py`. The invocation-inconsistency half of the finding was real and is fixed. This is the narrative record of the correction, kept here (not in the immutable report) per evidence-immutability rules. A one-line pointer to this section also lives in `evidence/audit/fable5-whole-project-findings.yaml`'s F-I-001 `status` field, since that file is the machine-readable finding index and every finding's status is expected to be discoverable there without cross-referencing this plan first; the two are not competing narratives, this plan is the authoritative prose and the YAML field is a pointer to it (second-review correction — a prior review found the YAML line restating the correction in full, which read as a second independent narrative; it now only points here).
- **Founder W1 authority:** issue #81 records approval of F-A-001 and F-L-001/002/003/004/006/007. PR #89 recorded those decisions in governed sources, received independent exact-head concurrence for `43c1519a9c9c097733b397f8cbf96c1928a4b281` in comment `5008646684`, and merged at `7de0688d11a80de950f0e0639ade84b23e790e59`. Their finding-specific external and later-workstream evidence conditions still apply. F-L-009/010 and other external/founder gates remain open at their named latest-safe points.
- **P-W2a tracking sync:** issue #90 implements the F-A-001 decision propagation and F-A-002 tracking correction. Its status is **implemented-pending-independent-review**; neither finding is closed by this draft/status update, and exact-head concurrence plus a green merge remain mandatory.
- **Correction (finding-count drift):** the immutable report's summary line (`FABLE5_FIFTH_AUDIT_V1.md:17`) states "0 P0 · 3 P1 · 9 P2 · 15 P3 (27 findings)"; the register (`evidence/audit/fable5-whole-project-findings.yaml`) has always contained 29 findings at 0 P0/3 P1/10 P2/16 P3 — the report's summary line undercounts by one P2 and one P3 finding, a drafting-time miscount not caused by any later edit (no finding was added, removed, or resevered by remediation; the id sequence F-A-001…004/F-B-001…006/F-H-001…008/F-I-001/F-L-001…010 has always been exactly 29 with no gaps). The report is not edited per evidence-immutability rules. The register's `audit.counts` field is corrected to the true 29-count and `scripts/validate_docs.py`'s `validate_audit_finding_counts()` mechanically enforces that field against the actual `findings` list going forward, so this specific drift cannot recur silently even though the report's own prose line is permanently frozen at the wrong number.

## Change Log

- **0.4.0 (2026-07-17):** Recorded the independently concurred merges of PR #80 and PR #89; marked P-W2a as implemented-pending-independent-review; distinguished F-L-005 closure from the still-pending F-A-001/F-A-002 tracking sync.
