---
document_id: PDA-REV-015
title: Fable 5 Fifth Audit Project Completion Roadmap
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# Project Completion Roadmap (post-fifth-audit)

Derived strictly from PDA-RDM-004/007, the Founder Decision Register, and the risk register — no scope invented. This document does not supersede PDA-RDM-007; it adds the sequencing corrections the audit found missing (external-evidence track, entry clearances, decision freeze points). Where it conflicts with PDA-RDM-007, PDA-RDM-007 wins and this document must be amended.

**Founder decision record (2026-07-17):** issue #81, comment `5008157609`, approves WSX, the WS3 customer-evidence and repository-disclosure gates, FDR-004 ratification, and M3 entry clearance for P4–P7. These approvals authorize only the controlled-prototype sequence described here. They do not promote Draft documents or authorize pilot or production use.

## Critical path

```
W1 decisions ─→ WS2 closeout recorded ─→ WS3 (POS cash) ─→ WS4 (stored value) ─→ WS5 (offline sync) ─→ WS7 (recovery/ops) ─→ pilot gates
                        │                     ▲                    ▲                      ▲
External track:  customer discovery ──────────┘  FDR-003 decision ─┘   key-mgmt ADR ──────┘
                 (after P-W1 merge; gates WS3)   (before WS4 PR1)      (before WS5 PR1)
Provider-neutral P6 analysis and contract design may run in parallel after WS1; P6 implementation waits for the recorded M3 charter checkpoint, and real-provider work remains externally gated (FDR-002/007 and WSX #84/#85).
```

Parallel-safe: W2 governance PRs; W3 UX PRs; P6 provider-neutral analysis and contract design; RLS topology **design** (RR-007); external-evidence engagements. Not parallel-safe: WS3 implementation before its evidence and disclosure gates; P4–P7 implementation before the M3 charter checkpoint; WS4 schema before FDR-003; WS5 signing contract before the key-management ADR.

## Workstreams (remaining)

### WSX — External evidence (new; closes F-L-001)

**Status:** approved by the Founder on 2026-07-17. WSX runs in parallel with implementation, but a milestone cannot be entered when its applicable WSX finish gate is unmet. Each accountable role must maintain a tracking issue and cite the resulting evidence; an unfilled role, planned engagement, or agent-generated substitute is not external evidence.

| WSX gate | Accountable role | Start by | Finish by | Required evidence or consequence |
|---|---|---|---|---|
| Customer discovery ([#82](https://github.com/kareemschultz/platform-design-authority/issues/82)) | Founder | Immediately after the P-W1 decision-recording PR merges | **Before WS3 entry** | At least **8 structured interviews** and **3 direct workflow observations** across **at least 3 distinct businesses**, logged in the governed market-evidence record with a synthesis of confirmed, contradicted, and unresolved assumptions. This is a hard gate: agents cannot substitute, simulate, infer, or waive the evidence. |
| Repository disclosure and redaction review ([#83](https://github.com/kareemschultz/platform-design-authority/issues/83); FDR-005) | Founder, with Platform Design Authority support | Immediately after the P-W1 decision-recording PR merges | **Before WS3 entry** and before FDR-005 public-visibility ratification | Retained path-level classification and redaction disposition covering knowingly disclosed content, security-control gaps, roadmap/commercial detail, customer/provider material, licensing, premium sources, privacy, and contribution policy. Until complete, WS3 is blocked and affected material stays out of public paths or moves to an approved restricted location. |
| Qualified Guyana legal, tax, and privacy engagement ([#84](https://github.com/kareemschultz/platform-design-authority/issues/84)) | Founder; qualified Guyana counsel supplies the external evidence | Begin sourcing after the P-W1 decision-recording PR merges and before a WS6 real-provider commitment | Provider-contract implications before real-provider work; dated tax/VAT and Data Protection Act evidence before pilot | Dated engagement plus scoped written advice from qualified professionals; no repository author or agent may stand in for counsel. |
| Provider capability matrix and certification ([#85](https://github.com/kareemschultz/platform-design-authority/issues/85)) | Founder; named provider representatives/certification contacts supply the external evidence | After FDR-002/FDR-007 identify the legal entity and required provider categories | Before real-provider sandbox work or any pilot claim for the selected rail | Provider-specific matrix, contract/sandbox access, certification results, and evidence dates. Simulator evidence does not establish provider capability. |
| Independent accessibility evaluation ([#86](https://github.com/kareemschultz/platform-design-authority/issues/86)) | Platform Design Authority; an independent accessibility specialist supplies the external evidence | Schedule by WS7 entry, after the relevant interaction surface and topology dependencies stabilize | Before pilot entry | Dated scope, methods, assistive-technology/browser matrix, findings, dispositions, and independent retest against the WCAG 2.2 AA goal. Internal axe or component checks do not replace it. |
| Independent penetration test ([#87](https://github.com/kareemschultz/platform-design-authority/issues/87)) | Platform Design Authority; a qualified independent provider supplies the external evidence | Schedule by WS7 entry; execute after production-relevant RLS and deployment-topology evidence | Before pilot entry | Dated assessment, sanitized evidence pointer, dispositions, and independent retest. Internal scans do not replace it. |
| Commercial offer and populated cost model ([#88](https://github.com/kareemschultz/platform-design-authority/issues/88)) | Founder | Once the production-topology decision provides a defensible cost basis | Before pilot recruitment or presentation of a commercial offer | Versioned offer, labeled pricing assumptions, support/implementation responsibilities, and populated cost worksheet; missing external quotes remain open rather than invented. |

**WSX exit evidence:** every row has a cited artifact in the PROGRAM_STATUS readiness table and its tracking issue is dispositioned. WSX does not exit merely because implementation reaches M7.

### WS3 — POS cash (17%)
- **Entry gates:** WS2 closeout recorded through the separate P-W2a tracking synchronization; the WSX customer-evidence threshold is met with retained real-world evidence; and the FDR-005 repository disclosure/redaction review is complete. FA4's P1–P3 prototype clearance still governs WS3. The M3 P4–P7 clearance occurs only after WS3 and is not a substitute for these entry gates.
- Scope, capabilities, depth, PR sequence: per PDA-RDM-007 §WS3 (registers, cash sessions, sales, returns, receipts, deposits at declared depths). Contracts through the generated pipeline; owner packages `domains/pos`(name per registry), persistence sibling; events via outbox; deterministic with AI disabled.
- **Exit evidence:** WS3 evidence checker (extend the WS1/WS2 machine-readable pattern), live-PG + worker lanes, browser e2e for the sale workflow, whole-workstream independent audit.

### WS4 — Stored value (11%)
- **Entry gates:** M3 charter checkpoint records P4–P7 clearance; WS3 done; **FDR-003 dispositioned before PR1 schema freeze** (F-L-009); 99.99% ledger quality budget restated as a design target, not an evidence claim.
- Reversal/compensation only; DB-enforced conservation like the inventory ledger; concurrency tests are mandatory exit evidence.

### WS5 — Offline sync (12%)
- **Entry gates:** M3 charter checkpoint records P4–P7 clearance; WS3 done; **offline device-trust/key-management ADR before PR1** (signing format is the hardest-to-reverse surface in the program); device/browser support matrix decided.
- Leases, limits, idempotency (receipts pattern already proven in WS2), numbering, conflicts, tombstones, reconciliation — all declared per AGENTS.md §5.

### WS6 — Provider adapter engine (9%)
- Provider-neutral analysis and contract design may proceed before M3, but P6 implementation enters only after the M3 charter checkpoint records P4–P7 clearance. Any real provider integration remains blocked on FDR-002 (legal entity), FDR-007 (provider evidence), and the applicable WSX provider/counsel gates. Never infer capability across providers.

### WS7 — Recovery and operations (9%)
- **Entry gates:** M3 charter checkpoint records P4–P7 clearance; WS2 has supplied real ledgers/outbox; exercise completion remains sequenced after WS4/WS5. Production-readiness evidence must use the selected topology rather than treating the local compose stack as production proof.
- **Purpose shift the audit demands:** convert Draft runbooks into **executed exercises** — measured restore meeting RPO/RTO budgets, deletion-journal replay, container/lease-recovery drills, capacity/noisy-neighbor tests on the chosen production topology; readiness/liveness beyond the current cheap probes; log/metric/trace correlation.
- **Exit:** each exercise produces retained evidence; SLOs remain unclaimed until then.

### Pilot gate (after WS7 + WSX)
Customer evidence, qualified Guyana review, provider certification, accessibility evaluation, penetration test, RLS topology evidence, executed restore, support model, commercial offer, FDR ratification waves. Pilot claims remain forbidden until every row cites evidence.

## Deferral confirmation

Unchanged deferrals (re-verified none is silently violated by code): production storefront, advanced loyalty, full GL, customer-account tender, production fiscal submission, self-checkout, unverified terminals, payment facilitation/custody, broad autonomous AI, arbitrary marketplace code execution.
