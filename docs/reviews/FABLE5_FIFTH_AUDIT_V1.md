# Fable 5 Fifth Audit V1 — Whole-Project Architecture, Implementation, and Readiness Audit

Governance note: this report intentionally carries no YAML front matter, following the immutable-evidence pattern established by `FABLE5_THIRD_AUDIT_REGISTRATION.md` (PDA-REV-005) and `FABLE5_FOURTH_AUDIT_REGISTRATION.md` (PDA-REV-007). Registration (document-id assignment plus registry regeneration) is `FABLE5_FIFTH_AUDIT_REGISTRATION.md`. This report is immutable after delivery; corrections, disagreements, closures, and later evidence belong in the disposition or a subsequent audit.

## 1. Audit Metadata

- **Repository:** kareemschultz/platform-design-authority
- **Branch:** `main` (audited from isolated worktree branch `claude/platform-design-authority-audit-1587d8`)
- **Audited SHA:** `81e903b27bf41785106775afb33f9f88738e39b9` — verified equal to `origin/main`; this is the merge of PR #79 ("WS2 PR7: verification and controlled-prototype closeout") and includes all WS0/WS1/WS2 work. GitHub required checks on this exact commit: `meridian`, `validate-docs`, `validate-program-status` — all success.
- **Date:** 2026-07-17
- **Reviewer/model:** Fable 5 (Claude Code), independent whole-project audit mode. Twelve bounded parallel lenses (A–L) were launched; lenses A (governance), B (architecture), H (frontend/accessibility), and L (roadmap/unknowns) completed as subagents; lenses C, D, E, F, G, I, J, and K were completed by direct lead verification after their subagents were terminated by an external session limit (recorded here per the failed-subagent rule: no lens was accepted as "clean" without evidence; every lens's coverage was re-established by the lead with cited traces).
- **Audit mode:** INDEPENDENT AUDIT. No authoritative file was modified. No prior audit evidence was altered. Created artifacts: this report, its registration, the disposition-and-planning documents named in §12, and the machine-readable finding register `evidence/audit/fable5-whole-project-findings.yaml`.
- **Environment:** Windows 11 Pro 10.0.26200; Bun 1.3.14; Node v25.8.2; Python 3.14.6; Docker 29.6.1; PostgreSQL 18.4 (Debian, official container). Live database work used a dedicated `audit5` role and fresh `meridian_audit5` / `meridian_audit5_wnode` databases to avoid touching prior local state.

## 2. Executive Verdict

**Severity counts: 0 P0 · 3 P1 · 9 P2 · 15 P3** (27 findings; confidence: 5 confirmed, 15 high, 7 medium/medium-high). Charter mapping: P0≈Blocker/Critical, P1≈High, P2≈Medium, P3≈Low/Note.

**The engineering core is strong and was independently reproduced clean.** Every executable gate passes from a clean frozen-lockfile checkout; owner migrations apply to a fresh empty PostgreSQL 18.4 database and re-run idempotently; the live server and worker integration lanes and both Node fallback lanes pass; authorization re-loads current tenancy state on every decision so suspension and revocation defeat cached authority; the transactional outbox commits owner state and event append in one client transaction; the inventory ledger is append-only with balances derived by summation; critical invariants (non-negative stock, transfer conservation, reversal pairing, posted-state integrity) and all idempotency/numbering uniqueness are enforced by the database with `tenant_id` leading every unique key; CSV import blocks formula injection, control characters, oversize payloads, and path traversal; audit records redact secrets by key and value pattern; no secret is committed; accessibility evidence nowhere conflates automated scans with WCAG conformance — a model of honest evidence discipline.

**No finding is a technical-correctness defect in shipped behavior.** The three P1 findings are process and program-management defects:

1. **F-A-001** — the WS2 closeout PR (#79) merged without the recorded independent exact-head concurrence its own governed gate requires;
2. **F-L-001** — external-evidence gates (customer discovery, Guyana professional review, provider certification, penetration test, independent accessibility evaluation) have no roadmap lane, owner, or trigger;
3. **F-L-002** — implementation stands at 37.8% weighted completion against an explicitly recorded zero customer evidence, with no validation checkpoint before WS7.

**Concurrence statement:** I concur that the WS2 implementation evidence is real and reproduced at this exact merged `main`. I do **not** concur that the governed WS2 closeout sequence was followed for PR7 (F-A-001). If the owner registers this audit's disposition as the superseding exact-`main` review that PDA-IMPL-007 requires, WS2 closeout can be recorded honestly with the deviation documented; absent that, WS2 must remain "closeout candidate."

**Controlled-prototype closure:** technically valid, procedurally incomplete (above). **Pilot and production: remain blocked**, correctly, on RR-007 (production RLS topology), RR-008 (OTP/provider), RR-009 (penetration test, assistive-technology accessibility evidence), founder decisions FDR-001–010, customer evidence, qualified Guyana review, and operational exercises. **Repository restructuring: not required** — only probe-residue cleanup and optional taxonomy tidying (§10).

## 3. Scope and Exclusions

In scope: the full repository at the audited SHA — governance, architecture, implementation, persistence, identity/authorization, Catalog/Inventory/events, contracts/registries, security/privacy, web UX/accessibility (static inspection plus retained evidence), testing/CI/evidence integrity, operations/readiness, repository organization, roadmap/founder decisions/unknowns. Executable verification per §4.

Exclusions (explicitly not evaluated, no claim made): live assistive-technology testing; penetration testing; load/soak/stress at production scale; backup/restore execution; multi-replica worker topology; authenticated-browser E2E re-execution (the committed Playwright suite and its retained CI evidence were inspected and traced, not re-run in this audit environment); external legal/tax/regulatory correctness; provider capability verification. Each is listed in the Unknowns register (§9) with owner and latest safe point.

## 4. Methodology and Commands

Chain-of-evidence rule applied throughout: authoritative document → registry source → generated artifact → contract → application boundary → owner behavior → persistence/transaction → event/outbox/delivery → UI/consumer → executable test → retained evidence → lifecycle claim; absent links recorded as findings or residuals.

Executed and reproduced (all green unless noted; full outputs in Appendix A):

```
bun install --frozen-lockfile
python scripts/validate_docs.py
python scripts/generate_registries.py --check
python scripts/generate_contracts.py --check        # 116/116 endpoints; 497 cap; 109 perm; 208 events
python scripts/check_architecture.py                # 36 packages, 331 source files
python scripts/test_architecture_checker.py         # pass; leaves residue dirs (F-B-003)
python scripts/validate_program_status.py           # OK, 0 errors
python -m unittest scripts/test_validate_program_status.py   # 8 tests OK
python scripts/check_ws1_evidence.py                # 11 capabilities / 143 cells / 47 markers
python scripts/check_ws2_evidence.py                # 14 capabilities / 182 cells / 58 markers
python -m unittest scripts/test_check_ws2_evidence.py        # 5 tests OK
bun run check-types                                 # 35 tasks
bun run test                                        # 29 workspaces, 0 fail
bun run check                                       # 401 files clean
bun run build                                       # exit 0 (CI-equivalent env)
bun run db:migrate      # fresh empty DB, then re-run: idempotent
apps/server  bun run db:test        # 67 pass / 643 expect (live PG 18.4)
apps/worker  bun run db:test        # 13 pass / 132 expect (live PG 18.4)
apps/server  bun run db:test:node   # pass (tsx/Node)
apps/worker  bun run test:node      # pass on isolated event database
```

Plus: live `gh` verification of PR #79 review state; git-history immutability sweep of `docs/reviews`; repository-wide greps for runtime-neutrality, cross-owner imports, secrets, raw palette values, codename leakage, `process.env`, provider SDKs; JSON/YAML parsing of all registries, OpenAPI, and event schemas; SQL review of all 27 committed migrations across 10 owner packages.

Notes on documented-vs-actual invocation: `python scripts/test_validate_program_status.py` and `python scripts/test_check_ws2_evidence.py` fail with ImportError when invoked as plain scripts (they require `-m unittest`); CI uses the working form for the first, and the second has no direct CI step (F-I-001).

## 5. Authority and Conflict Analysis

- Authority order (AGENTS.md §1) is internally consistent and consistently applied in governed documents. All 351 registered documents are Draft (323) or Proposed (28); zero Approved/Accepted/Ratified entries exist, so no lifecycle promotion lacks `review_evidence` — no false promotion found.
- The controlled-prototype exception (PDA-RDM-007) is cited wherever Draft/Proposed material guides implementation; no production-authority claim from Draft material was found.
- Active contradictions at HEAD: (a) `registry/first-slice-tests.json` coverage (25/103 capabilities, 325/1,294 cells) vs PROGRAM_STATUS headline (11/103, 143/1,294) — both sides of a half-met condition (F-A-002); (b) AGENTS.md vs CLAUDE.md contract divergence (F-A-003, reopens FA4-015/FA4-030 by their own recorded triggers); (c) PDA-RDM-001 Phase 0/Phase 1 text vs execution reality (F-L-003, F-L-008); (d) README authority summary vs AGENTS.md §1 (F-A-004). None is silently resolved here; each names both sources and the decision owner in the register.
- Independent-evidence immutability held: every `*_AUDIT_V1.md` traces to a single content origin; post-creation changes to `docs/reviews` land only in the register, dispositions, and registrations.

## 6. Findings (ordered by severity)

The normative finding set, with full fields (actual/expected, reproduction, impact, remediation, closure tests, owners, waves), is `evidence/audit/fable5-whole-project-findings.yaml`. Summary:

### P1

- **F-A-001** (confirmed) — WS2 PR7 (#79) merged as repository HEAD without the recorded independent exact-head concurrence required by `WS2_VERIFICATION_AND_CONTROLLED_PROTOTYPE_CLOSEOUT.md:16`, the WS2 plan, and the PR1–PR6 precedent. Live PR state shows no concurrence at final head `22a3a38`; the merge commit itself says "closeout candidate." An independent PR7 audit round did occur and its findings were fixed, but no superseding concurrence at the remediated head was recorded before merge. Blocks the WS2-100%/program-42% claim path. Disposition decision belongs to the founder (see §2 concurrence statement).
- **F-L-001** (high) — customer discovery, Guyana legal/tax/privacy review, provider certification, penetration test, and independent accessibility evaluation exist only as open risk rows; no workstream, milestone, owner, or entry/exit gate initiates any of them. The M0–M7 ladder can reach 100% internal completion with zero external progress.
- **F-L-002** (high) — 37.8% weighted implementation against `MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md`'s recorded zero interviews/observations/WTP; the roadmap permits WS3–WS7 (POS, stored value, offline — the most expensive rework layers) with no customer-evidence checkpoint.

### P2

- **F-A-002** (confirmed) — merged HEAD internally contradicts itself: PROGRAM_STATUS cutoff one merge behind; 11/103 vs 25/103 split; four documents describe as pending the merge they sit in.
- **F-A-003** (confirmed) — AGENTS.md/CLAUDE.md divergence: CLAUDE-only (component-catalog gate, Better Auth deny-by-default plugin rules, bootstrap, change-process steps 5–8) vs AGENTS-only (§13 ADR Triggers, §14 Prohibited Behavior including audit-evidence immutability, §15 readiness). Fires the recorded reopen triggers of FA4-015/FA4-030.
- **F-B-001** (high) — architecture checker has no unregistered-source detection under `packages/` (only `apps/`); a stray unmanifested source file bypasses every boundary/DB/ownership rule. Latent — verified no stray sources exist today.
- **F-B-002** (high) — the "worker cannot run migrations" gate matches only `migrate[A-Z]…(`; lowercase drizzle `migrate(` import or an aliased re-export evades it. Worker runtime currently compliant.
- **F-H-001** (high) — shared `QueryFailure` hardcodes `/administration` return targets and is reused across all Operations routes; session expiry on an Operations page routes a possibly-unauthorized operator into Administration.
- **F-L-003** (high) — Phase 0 exit criterion "prototype slice founder-ratified" unmet (FDR-004 open) while M0 passed and WS0–WS2 merged, with no recorded exception.
- **F-L-004** (medium-high) — Prototypes 4–7 (stored value, offline, provider, recovery) have no recorded entry clearance analogous to FA4's clearance of P1–P3.
- **F-L-005** (high) — progress-standard measure 4 (production-readiness gate tracking across 11 gate families) is mandated but implemented nowhere; several families have no owner or artifact.
- **F-L-006** (high) — product naming/trademark/`@meridian` npm verification is "a separate founder decision" in ADR-0026/CLAUDE.md but absent from the Founder Decision Register; the promised dated availability-check appendix does not exist.
- **F-L-007** (medium) — FDR-005 (repository visibility) is the only open FDR with no ratification trigger while the public repository accretes security-gap and competitive detail each merge.

### P3

F-B-003 (confirmed; checker probes leave residue directories under `apps/` — reproduced), F-B-004 (test-source exemption to worker migration/pool rules undocumented), F-B-005 (relative `../composition` import path can expose `databasePool` to `src/` unchecked), F-B-006 (three test files read `process.env` against the letter of §11), F-H-002 (route-level loader lacks `role="status"`), F-H-003 (semantic token drift between draft registry and shipped theme, only status roles synchronized), F-H-004 (dead legacy dashboard component), F-H-005 (duplicate error-element IDs latent in auth forms), F-H-006 (Operations subnav missing the overflow guard Administration has), F-H-007 (PWA manifest hardcodes two hex colors), F-H-008 (`console.error` vs structured-logger convention, untracked deferral), F-L-008 (PDA-RDM-001 Phase 1 text superseded in practice), F-L-009 (FDR-003 single-currency assumption hardens at WS4 schema freeze — decide before WS4 PR1), F-L-010 (no producing work item for the Phase 3 commercial-offer/cost-model exit), F-A-004 (README authority summary drift), F-I-001 (script-test invocation inconsistency; `test_check_ws2_evidence.py` has no direct CI step).

## 7. Reopened Risks and Invalidated Evidence Claims

- **Reopened:** FA4-015 and FA4-030 (agent-contract parity) — their recorded reopen triggers fired (F-A-003). No other closed risk reopened; sampled closures (RR-006, RR-011, TD-001/002/007) carry evidence meeting their own acceptance criteria.
- **Invalidated evidence claims:** none of the WS1/WS2 capability-evidence claims was invalidated; both evidence checkers reproduce exactly and sampled traces held. What is invalidated is narrower: (a) any extension of "every WS2 head was independently concurred before merge" to PR7 (F-A-001); (b) any naive reading of `registry/first-slice-tests.json` coverage as governed program status while the concurrence condition is half-met (F-A-002).

## 8. Clean Areas (independently reproduced, with evidence)

1. **All gates** listed in §4 — reproduced from clean checkout.
2. **Migrations** — fresh-empty apply + idempotent re-run on live PostgreSQL 18.4.
3. **Authorization** — every protected router procedure enforces `requireActiveIdentity` → `requirePermission` before dispatch; the authorizer re-loads live tenancy state per decision; suspension/revocation/expiry/role-change all defeat cached authority; org-substitution guard verified; tenant server-derived for audit/replay.
4. **Transactional outbox** — owner repository and outbox bound to one `BEGIN…COMMIT` client (`postgres-unit-of-work.ts`); append never mislabeled as delivery.
5. **Event delivery** — `FOR UPDATE SKIP LOCKED` claim with lease expiry, bounded attempts (≤20), backoff, per-aggregate ordering guard, dead-letter with privacy states and encrypted-payload pairing.
6. **Inventory ledger** — append-only movements, derived balances, DB CHECK conservation/reversal/posted-state invariants, non-negative stock.
7. **Idempotency and numbering** — DB-enforced unique keys, all tenant-scoped; offline receipts channel-consistency CHECKed.
8. **Money/quantity** — `numeric(38,6)` everywhere; bigint minor units + explicit currency in `money.ts`; no binary floats.
9. **CSV import security** — 1 MiB cap, row/column/field caps, formula-prefix block, control-char/BOM rejection, filename sanitization, RFC-4180 parsing.
10. **Secrets** — none committed; env access confined to `@meridian/tooling-env` (+3 test files, F-B-006); audit redaction by key and value pattern; CORS origin-restricted with exact header allowlist; CI least-privilege with SHA-pinned actions and a secret-surface grep.
11. **Runtime neutrality and boundaries** — zero Bun/Hono/oRPC-server/DB imports in foundation/contracts/platform/domains; one-to-one persistence-owner map; no cross-owner FK; no provider SDK; clients don't depend on server routers.
12. **Accessibility evidence honesty** — every WCAG-adjacent claim explicitly separates automated-scan evidence from conformance; no conflation anywhere (verified sweep).
13. **Codename hygiene** — "Meridian" never tenant-visible; `@meridian/*` imports only.
14. **Frontend state discipline** — permission-denied vs entitlement-unavailable distinct; offline fail-closed with real dropped-request e2e; skip link, route-focus management, live regions, responsive tables, reduced-motion kill-switch; capability-specific e2e (blind counts, barcode focus, import keyboard/history/reflow).
15. **Perf evidence honesty** — every metric JSON self-limits ("excludes browser and network latency", "20 local samples cannot substantiate 99.99%", "does not close the 5-second scan target").

## 9. Known / Unknown / Assumed / Unknowable Register

The full 26-row register (why it matters, current assumption, decision owner, evidence required, latest safe implementation point, blocked work, seam sufficiency) is embedded in the finding register file and summarized here. Items needing **founder or external authority**: FDR-001–010 ratifications (first-slice scope FDR-004 already past its M0 checkpoint); customer discovery (unknowable without fieldwork; latest safe point WS3 workflow freeze); commercial model/pricing (before pilot recruitment); product naming/trademark/npm (before any public surface; needs the missing FDR entry); legal entity FDR-002 (before any external contract); Guyana tax/VAT and Data Protection Act commencement (qualified professionals, before pilot); fiscalization mandate; provider certification incl. MMG capability matrix (FDR-007); terminal strategy (FDR-006); independent accessibility evaluation and penetration test (external, before pilot); production RLS topology (design unblocked now, evidence before pilot); production infrastructure/hosting/residency (before cost model and WS7 realism); retention/legal-hold confirmation; backup/DR **execution** (design exists, never exercised); device/browser matrix (before WS5 device testing); offline device trust/key management (**hardest to reverse — decide by WS5 PR1** before the signing contract freezes); scale/noisy-neighbor evidence; operational staffing/support model; AI model/provider policy (deterministic-with-AI-disabled seam holds). Clean: no undocumented assumptions found in code (zero TODO/FIXME; money seeding documented with a seam).

## 10. File-Organization Assessment

**Restructuring is not required.** The 36-package family layout is clean and fully classified; docs taxonomy (blueprint 00–20 / implementation / project / reviews / templates) is discoverable; generated-vs-authored boundaries are governed; no dead packages, no committed build output, no oversized artifacts. Actual items: F-B-003 probe residue (fix the probe, delete the empty dirs); F-H-004 one dead component; optional (not urgent, after functional remediation): record the `evidence/audit/` subtree introduced by this audit in the evidence taxonomy note, and consider a one-page index distinguishing `docs/implementation` dispositions from `docs/reviews` dispositions. No move/rename recommended for aesthetics.

## 11. Readiness

- **Controlled prototype (WS0–WS2):** supported by reproduced evidence; procedurally incomplete pending the F-A-001 disposition. WS3 may enter once W1 decisions (§12) are made — the WS2 technical base is sound.
- **Pilot:** blocked — customer evidence, qualified Guyana review, provider certification, accessibility evaluation, penetration test, RLS topology evidence, restore exercise, support model, commercial offer.
- **Production:** blocked — all pilot gates plus operational exercises, capacity evidence, and the ratification waves. No document claims otherwise (verified).

## 12. Deliverables of This Audit

- This report (immutable) + `FABLE5_FIFTH_AUDIT_REGISTRATION.md`.
- `FABLE5_FIFTH_AUDIT_REMEDIATION_PLAN_V1.md` — proposed disposition per finding, wave plan W1–W4, contradiction-resolution and risk-propagation matrices.
- `FABLE5_FIFTH_AUDIT_COMPLETION_ROADMAP_V1.md` — remaining-project roadmap derived from PDA-RDM-004/007 with the external-evidence track added.
- `FABLE5_FIFTH_AUDIT_QA_STRATEGY_V1.md` — layered verification strategy mapped to every roadmap phase.
- `FABLE5_FIFTH_AUDIT_RESTRUCTURING_ASSESSMENT_V1.md` — the §10 assessment in governed form.
- `FABLE5_FIFTH_AUDIT_EXECUTION_PROMPT_PACK_V1.md` — self-contained prompts for each remediation wave and upcoming implementation PR.
- `evidence/audit/fable5-whole-project-findings.yaml` — machine-readable finding register (normative finding set).

## Appendix A — Command Outputs (abridged, verbatim key lines)

```
validate_docs.py            → Documentation governance validation passed.
generate_registries --check → exit 0
generate_contracts --check  → joined 116 endpoints (manifest 116 / openapi 116); 497 capabilities; 109 permissions; 208 events
check_architecture.py       → architecture validation passed: 36 packages, 331 source files
check_ws1_evidence.py       → WS1 evidence verified: 11 capabilities, 143 required cells, 47 source markers, no AI runtime dependency
check_ws2_evidence.py       → WS2 evidence verified: 14 capabilities, 182 required cells, 58 source markers, no AI runtime dependency across 32 workspace packages
bun run test                → Tasks: 29 successful, 29 total (server contract suite: 33 pass, 94 expect)
bun run check               → Checked 401 files in 1405ms. No fixes applied.
bun run check-types         → Tasks: 35 successful, 35 total
server db:test (live PG)    → 67 pass, 0 fail, 643 expect() calls, 8 files
worker db:test (live PG)    → 13 pass, 0 fail, 132 expect() calls, 2 files
server db:test:node         → pass (persistence + ws1-critical checks)
worker test:node            → pass (isolated event database, guard verified)
Perf JSON (server lane)     → inventory-adjustment-posting p50 23.5ms p95 80.7ms p99 169.5ms, n=20, failures=0,
                              "service-to-owner-transaction timing; excludes browser and network latency"
Perf JSON (worker lane)     → event-append-to-delivery p50 42.8ms p95 54.6ms p99 320.9ms, n=20, failures=0,
                              "20 successful local samples cannot substantiate the 99.99% retry-horizon reliability target"
```

## Appendix B — PR #79 Review-State Evidence (F-A-001)

`gh api .../commits/81e903b.../check-runs` → meridian/validate-docs/validate-program-status all success. `gh pr view 79 --json reviews,comments` → zero PR comments; reviews limited to a Codex auto-comment at intermediate head `8744c5d` and four empty owner review events at intermediate head `45b286e`; final head `22a3a38` pushed 2026-07-17 08:01:41Z, merged 08:12:46Z with no recorded concurrence in between. Merge commit message: "WS2 PR7: verification and controlled-prototype closeout (#79)" over a body describing a closeout *candidate*.
