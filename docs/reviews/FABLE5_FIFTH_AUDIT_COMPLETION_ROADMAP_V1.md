---
document_id: PDA-REV-015
title: Fable 5 Fifth Audit Project Completion Roadmap
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# Project Completion Roadmap (post-fifth-audit)

Derived strictly from PDA-RDM-004/007, the Founder Decision Register, and the risk register — no scope invented. This document does not supersede PDA-RDM-007; it adds the sequencing corrections the audit found missing (external-evidence track, entry clearances, decision freeze points). Where it conflicts with PDA-RDM-007, PDA-RDM-007 wins and this document must be amended.

## Critical path

```
W1 decisions ─→ WS2 closeout recorded ─→ WS3 (POS cash) ─→ WS4 (stored value) ─→ WS5 (offline sync) ─→ WS7 (recovery/ops) ─→ pilot gates
                        │                     ▲                    ▲                      ▲
External track:  customer discovery ──────────┘  FDR-003 decision ─┘   key-mgmt ADR ──────┘
                 (starts NOW, gates WS3)         (before WS4 PR1)      (before WS5 PR1)
WS6 (provider adapter engine) runs parallel after WS1; real-provider work externally gated (FDR-002/007).
```

Parallel-safe: W2 governance PRs; W3 UX PRs; WS6 simulator-side engine work; RLS topology **design** (RR-007); external-evidence engagements. Not parallel-safe: WS3 implementation before W1 gate decisions; WS4 schema before FDR-003; WS5 signing contract before the key-management ADR.

## Workstreams (remaining)

### WSX — External evidence (new; closes F-L-001)
- **Purpose:** give every external gate an owner, a start-by milestone, and a tracking issue.
- **Items:** customer discovery (owner: Founder; start immediately; ≥N structured interviews + workflow observations before WS3 exit — N set in W1); Guyana counsel engagement (before WS6 real-sandbox work; tax/VAT + DPA commencement before pilot); provider capability matrix + sandbox certification (FDR-002/007 first); independent accessibility evaluation and penetration test (schedule at WS7 entry; both after RLS topology); commercial offer + populated cost worksheet (before pilot recruitment; depends on production-topology decision); repository-visibility decision (FDR-005).
- **Exit evidence:** per-gate rows in the PROGRAM_STATUS readiness table (F-L-005) flipping from "no artifact" to cited artifacts.

### WS3 — POS cash (17%)
- **Entry gates:** WS2 closeout recorded (F-A-001 disposition); customer-evidence bar met or founder explicitly waives with a recorded exception; P4–P7 clearance statement covers it (F-L-004).
- Scope, capabilities, depth, PR sequence: per PDA-RDM-007 §WS3 (registers, cash sessions, sales, returns, receipts, deposits at declared depths). Contracts through the generated pipeline; owner packages `domains/pos`(name per registry), persistence sibling; events via outbox; deterministic with AI disabled.
- **Exit evidence:** WS3 evidence checker (extend the WS1/WS2 machine-readable pattern), live-PG + worker lanes, browser e2e for the sale workflow, whole-workstream independent audit.

### WS4 — Stored value (11%)
- **Entry gates:** WS3 done; **FDR-003 dispositioned before PR1 schema freeze** (F-L-009); 99.99% ledger quality budget restated as a design target, not an evidence claim.
- Reversal/compensation only; DB-enforced conservation like the inventory ledger; concurrency tests are mandatory exit evidence.

### WS5 — Offline sync (12%)
- **Entry gates:** WS3 done; **offline device-trust/key-management ADR before PR1** (signing format is the hardest-to-reverse surface in the program); device/browser support matrix decided.
- Leases, limits, idempotency (receipts pattern already proven in WS2), numbering, conflicts, tombstones, reconciliation — all declared per AGENTS.md §5.

### WS6 — Provider adapter engine (9%)
- Simulator-side engine may proceed post-WS1 (already cleared); any real provider integration blocked on FDR-002 (legal entity) + FDR-007 (provider evidence). Never infer capability across providers.

### WS7 — Recovery and operations (9%)
- **Purpose shift the audit demands:** convert Draft runbooks into **executed exercises** — measured restore meeting RPO/RTO budgets, deletion-journal replay, container/lease-recovery drills, capacity/noisy-neighbor tests on the chosen production topology; readiness/liveness beyond the current cheap probes; log/metric/trace correlation.
- **Exit:** each exercise produces retained evidence; SLOs remain unclaimed until then.

### Pilot gate (after WS7 + WSX)
Customer evidence, qualified Guyana review, provider certification, accessibility evaluation, penetration test, RLS topology evidence, executed restore, support model, commercial offer, FDR ratification waves. Pilot claims remain forbidden until every row cites evidence.

## Deferral confirmation

Unchanged deferrals (re-verified none is silently violated by code): production storefront, advanced loyalty, full GL, customer-account tender, production fiscal submission, self-checkout, unverified terminals, payment facilitation/custody, broad autonomous AI, arbitrary marketplace code execution.
