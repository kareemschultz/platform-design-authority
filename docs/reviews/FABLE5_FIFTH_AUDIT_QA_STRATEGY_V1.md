---
document_id: PDA-REV-016
title: Fable 5 Fifth Audit QA and Verification Strategy
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# QA and Verification Strategy (post-fifth-audit)

Codifies the verification stack the audit reproduced as effective, plus the additions it found missing. Every roadmap phase (PDA-REV-015) maps to these layers; a phase may not claim exit without its mapped layers green and retained.

## Layers (existing — keep; audit-verified effective)

1. **Unit** — colocated `*.test.ts`, bun:test, real assertions (no placeholders found).
2. **Contract/transport** — server contract suite proving denial-before-dispatch, substitution rejection, non-disclosing errors, projection-uncertainty semantics.
3. **Live PostgreSQL integration** — `db:test` lanes against real PG 18; owner transactions, outbox atomicity, lease recovery, replay.
4. **Concurrency** — genuine multi-connection tests (numbering 10-way, dual-worker contention). Required for every new ledger (WS4 mandatory).
5. **Node fallback lanes** — `db:test:node` / `test:node`; worker lane requires an isolated event database (guard verified).
6. **Migration** — CI freshness + fresh-empty apply + idempotent re-run (both reproduced by this audit; keep as an explicit CI assertion, not just convention).
7. **Browser E2E** — Playwright on clean seeded data; capability-specific workflows (blind counts, barcode focus, offline fail-closed, import keyboard/history).
8. **Accessibility** — three separately-labeled evidence types, never conflated: automated axe (supporting only), manual keyboard/focus/semantics/contrast inspection, assistive-technology testing (external, pilot gate). Contrast verified against rendered tokens once F-H-003's token mapping is recorded.
9. **Governance gates** — validate_docs, registry/contract `--check`, architecture checker + probes, evidence checkers, program-status validator.
10. **Security controls in CI** — secret-surface grep, least-privilege workflows, SHA-pinned actions.

## Additions (audit-mandated)

11. **Checker negative probes for the W2 guard fixes** — packages/ stray source, lowercase/aliased migrator import, pool re-export (closure tests in the finding register).
12. **Dependency audit lane** — scheduled `bun audit` (or equivalent) + lockfile-diff review on dependency PRs; currently absent.
13. **Fault injection** (WS4/WS5/WS7) — crash after owner write before checkpoint, crash during delivery/replay, container restart, stale-lease recovery at scale. Some exist as tests; promote to a named lane with retained evidence.
14. **Load/soak/stress** (WS7, production topology only) — never converted from local samples; perf JSONs keep their limitation fields (pattern already exemplary).
15. **Backup/restore/PITR exercises** (WS7) — executed, timed, retained; deletion-journal replay included.
16. **Flake policy** — any intermittent failure gets an issue + quarantine tag within one day; a quarantined test cannot satisfy an evidence cell; re-admission requires 20 consecutive green runs.
17. **Post-merge exact-main check** — after every merge, re-run the required gates on the exact main SHA and record it (the F-A-001 lesson institutionalized).
18. **Evidence retention** — every evidence cell cites file+assertion; checker-verified (WS1/WS2 pattern extended per workstream); performance and exercise evidence retained as JSON artifacts with environment+limitation fields mandatory.

## Phase mapping

| Phase | Required layers |
|---|---|
| W2/W3 remediation PRs | 1, 2, 9, 11 (+7/8 for W3 UX items) |
| WS3 | 1–10, 13 (crash-boundary for cash), 17, 18 |
| WS4 | 1–10, **4 mandatory**, 13, 17, 18 |
| WS5 | 1–10, 13 (sync crash/conflict), device-matrix E2E, 17, 18 |
| WS6 | 1–3, 9; provider-sandbox certification evidence external |
| WS7 | 13–15 executed with retained evidence; 12 standing |
| Pilot gate | All above + external evaluations (a11y, pen test) |
