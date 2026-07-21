# Decision Closure and Ratification Program Plan

**Lifecycle:** Program-control plan (non-authoritative)

**Approved:** 2026-07-21 (founder-approved session plan, Fable 5 synthesis)

**Plan baseline:** `main` at `df87fe5`

**Codex concurrence:** pending — phase execution does not begin until the independent Codex review of this plan concurs and its findings are dispositioned (the "both agree" rule).

This is a lightweight program-control document per `README.md` in this directory. It is subordinate to the authority order in `AGENTS.md`; where it conflicts with a governed source, the source wins. Executing agents follow full repo discipline: one issue + branch + PR per change, `bun run gates` green, PR-governance-validated bodies, Codex bot review checked after every push.

## Why this program exists

A nine-agent discovery sweep plus direct primary-source verification (npm registry, postgresql.org, Microsoft's pg_durable repository, shadcn/Base UI/React Aria/Studio official documentation) audited every open decision surface: all 28 ADRs, the ratification-wave machinery, the Founder Decision Register, the Architecture Risk Register, the 445 Draft documents, every decision matrix, and the competitive-intelligence corpus.

**Headline: this is a promotion-mechanism problem plus an enforcement-gap problem, not a content problem.** 445 of 476 governed documents are publication-quality prose stuck at Draft because the ratification process (PDA-RDM-010) has never executed once — RW-00 sits in `preparation` solely because no independent reviewer has ever been assigned, and the standard deliberately forbids author/AI self-approval. Twelve of 28 Proposed ADRs (and the Draft Constitution itself) are cited in CLAUDE.md as settled law, seven without naming the ADR. Three cross-document contradictions live in the 09-UX component-governance cluster. The acquisition policy contradicts both the founder's stated Studio-primary direction and the `component-intake` skill. One CI generator contradicts the specification it implements (audit finding FA4-010). Confirmed smaller enforcement gaps: no OpenTofu version pin despite ADR-0018 requiring one, `MAX_MCP_OUTPUT_TOKENS` undocumented despite being hit in live intake work, and `registry/ratification-waves.json` carrying a blocker ("FDR-004 is open") three days stale against the FDR register.

Intended outcome: every decidable decision decided and recorded, every affected document updated to honest current state, enforcement automated instead of prose-only, founder-only items batched into one sitting, and the ratification machine actually started.

## Part 1 — Decisions recorded by this program (agent authority, Draft/prototype depth)

None of these promotes a lifecycle status; all are ordinary governed edits with evidence cited in the ledger where time-sensitive.

- [ ] **D1 — Studio Pro primary for composed artifacts.** Reorder `docs/blueprint/09-UX/COMPONENT_ACQUISITION_POLICY.md` Source Priority: platform-owned and app-local graduation stay 1–2; **shadcn/studio Pro (MCP/CLI) becomes priority 3 for blocks, sections, pages, and composed patterns**; official shadcn/ui remains the source for single primitives entering `packages/ui-web/core` (the layer Studio itself builds on, per ADR-0022). Reconcile `.claude/skills/component-intake/SKILL.md` (+ `.agents` mirror) and `docs/blueprint/09-UX/COMPONENT_INTAKE_FAST_PATH.md` to state the identical order. Verified no technical conflict: Studio documents Base UI implementations (TECH-LESSON-051; Studio Select/Autocomplete docs). Founder direction given in-session 2026-07-21; countersignature recorded in Phase R4 as an FDR-013 amendment.
- [ ] **D2 — pg_durable evaluation-only until GA.** Update `docs/blueprint/02-Architecture/WORKFLOW_RUNTIME_DECISION_MATRIX.md` with the dated disposition: Microsoft's own README declares "Preview" and its image warns "do not use it in production" (verified 2026-07-21). Reconcile the version-identity ambiguity (matrix cites 0.2.3 release tags; confirm same project as `microsoft/pg_durable` and record). Confirm the implemented `apps/worker` composition (ADR-0027) as the first-slice runtime; Temporal stays preferred general-purpose candidate with its prototype exit criteria honestly retained as unexecuted.
- [ ] **D3 — TanStack Form is the controlled-prototype form standard.** `@tanstack/react-form` is already cataloged in root `package.json` and in use — the matrix's "not yet decided" lags implemented reality. Record at prototype depth in `docs/blueprint/02-Architecture/TANSTACK_DECISION_MATRIX.md` and the corresponding line in `docs/blueprint/02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`; retire the React-Hook-Form comparison unless a defect triggers it. TanStack Start stays Labs (re-verify RC-vs-stable at execution); TanStack DB stays research-only.
- [ ] **D4 — Authority-status honesty without weakening enforcement.** Add one clarifying sentence to CLAUDE.md §1 (Authority Order ranks documents at their eventual ratified state; until then listed rules bind as controlled-prototype working rules under §2). Add the seven missing by-number ADR citations (ADR-0006, 0007, 0009, 0013, 0015, 0016, 0022) where content is restated as flat law. Fix `docs/blueprint/00-Foundation/DOCUMENT_GOVERNANCE.md` tier-1 wording ("Ratified Constitution" → the Constitution, ratification pending via RW-01). CLAUDE.md/AGENTS.md byte-identity preserved.
- [ ] **D5 — DECISION_FRAMEWORK meta-amendment.** Add to `docs/blueprint/00-Foundation/DECISION_FRAMEWORK.md`: ADR authorship/amendment is Class B; document promotion/ratification is governed by PDA-RDM-010 with per-wave approval authority; ordinary specification authorship is Class D traceable to its owning decision. Add symmetric citations from `docs/blueprint/17-Roadmap/RATIFICATION_WAVE_MANIFEST_AND_REVIEW_STANDARD.md` and `docs/blueprint/00-Foundation/DOCUMENT_GOVERNANCE.md` back to PDA-FND-004, whose taxonomy they already operationalize uncredited.
- [ ] **D6 — 09-UX contradiction and staleness repairs.** Dated delta section in `docs/blueprint/09-UX/COMPONENT_SOURCE_MATRIX.md` (per the PDA-UX-035 delta precedent): sync `empty-state-01` to Prototype Approved, add the missing `statistics-card-03`/MetricCard row, correct Onboarding Feed 05 to Restricted (matrix is the outlier against catalog + evaluation). Cross-reference `docs/blueprint/20-Strategy/COMPETITIVE_INTELLIGENCE_AND_BENCHMARKING.md` and `docs/blueprint/20-Strategy/COMPETITOR_BENCHMARK_SCORECARD.md` with the 19-Competitive-Research corpus (currently zero links either way). Add `docs/blueprint/19-Competitive-Research/PATTERN_DECISION_REGISTER.md` to CLAUDE.md §4 beside the AIR register, with the "decided ≠ ship-ready; Prototype Required needs first-party validation" caveat.
- [ ] **D7 — Enforcement additions.** (i) New validator script validate_authority_claims (scripts directory, with tests, CI step, run_gates registration): v1 pins the confirmed status-overclaim citations as a regression list checked against `registry/documents.json` statuses — not a general claim-scanner. (ii) Fix FA4-010: `scripts/generate_registries.py` `build_first_slice_tests_registry` honors capability-metadata depth overrides instead of hardcoding required×13 for all capabilities; adversarial test proven to fail pre-fix; regenerate and reconcile dependent counts. (iii) OpenTofu pin file under `ops/` plus tech-ledger row (ADR-0018 control; CI assertion activates with first IaC). (iv) Fix the stale "FDR-004 is open" blocker in `registry/ratification-waves.json`; extend `scripts/validate_ratification_waves.py` to cross-check FDR statuses named in wave blockers against the register. (v) Refresh-due dates in `docs/blueprint/19-Competitive-Research/RESEARCH_REFRESH_SCHEDULE.md` + validator warning when the Class A window (30–90 days from 2026-07-15) lapses. (vi) Document `MAX_MCP_OUTPUT_TOKENS` in `docs/blueprint/09-UX/COMPONENT_INTAKE_FAST_PATH.md` and the frontend-implementation skill (hit live: a 139k-character Studio block against the 25k default); name `/cui`/`/iui` in that skill's acquisition step (currently only `/rui` appears, in the refine step).
- [ ] **D8 — ADR Review Record backfill.** Add the missing Review Record sections to ADR-0002 through ADR-0016 (14 ADRs; table convention per ADR-0001/0017+). All rows Pending or explicitly AI-lens-labeled; no approval claimed.
- [ ] **D9 — React Aria plan remainder.** Merge open PR #190 after Codex concurrence on this program; execute its approved follow-ups: catalog Primitive-source field + date/tree row updates + TanStack Virtual complementarity note in `docs/blueprint/09-UX/ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`; CLAUDE.md §8 bullet + skill routing lines.
- [ ] **D10 — Cheap implementation closures.** RR-003/TD-003 (apps/native Biome exclusion), RR-004/TD-004 (design-token→CSS pipeline per PDA-UX-023), RR-002 (PWA manifest theme-color via tokens, retiring the manifest hex allowlist entry). Each its own issue/PR.

## Part 2 — Founder decision batch (one sitting; agents prepare everything first)

Zero-new-evidence items: FDR-001 (ratify direct tenant-provider payment model), FDR-005 (license/visibility/contribution choice — PDA-REV-019 done), FDR-009 (premium-asset purchaser/seats confirmation), FDR-008a (free-listings-first), FDR-010a (cash-acceptance threshold), RR-001 (Expo auth plugin), RR-002 (token approach nod), FDR-013 amendment (countersign D1). Agent-prepared evidence feeding founder choice: FDR-011 name/trademark/npm/domain availability searches.

## Part 3 — People-gates (nothing ratifies without these)

- [ ] **G1 — Independent reviewer for RW-00** (blocks promotion of all 476 documents). Dual-track recommendation: (a) founder amends PDA-RDM-010 to define a bounded alternative for technical waves RW-00–RW-03 — independent review by a different-vendor AI (not the authoring model) **plus founder countersignature as the named human authority** — formalizing the author-model ≠ reviewer-model ≠ approving-human pattern already operating in this repository while preserving the no-self-approval invariant; (b) recruit a genuine second human for Class A ratification (Constitution, RW-01). Agents draft the amendment in R3; adopting it is a founder decision in R4.
- [ ] **G2 — Issue #84 → #82 chain** (blocks WS3 → M3 → WS4/5/6/7). Agent deliverable in R0: the Guyana-counsel engagement brief compiled from the scope questions already enumerated in the evidence-collection kit. Founder actions: engage counsel, then run fieldwork. Not agent-substitutable; tracked, not faked.

## Part 4 — Execution phases

| Phase | Content | Shape |
|---|---|---|
| R0 Hygiene | D4, D6, D7(iv) staleness fix, D7(vi) docs, G2 brief | ~4 small PRs |
| R1 Matrix closures | D1, D2, D3, D9 | ~4 PRs |
| R2 Enforcement | D7(i)(ii)(iii)(v) validators and fixes | ~3 PRs |
| R3 Ratification prep | D8, D5, RW-00 frozen manifest, DCA-006 packet, PDA-RDM-010 amendment draft | ~3 PRs |
| R4 Founder batch | Part 2 + G1 mechanism adoption; outcomes recorded in registers same day | one founder session |
| R5 First ratifications | RW-00 under adopted mechanism → RW-01 → RW-02/03; first promotions: ADR-0024, ADR-0006, `docs/blueprint/04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md` (audited content-complete) | per wave standard |
| R6 Implementation closures | D10 | parallel-safe |
| External | G2 engagement/fieldwork; WS3 PR #187 (own FDR-012 track, dependency only) | founder/world |

## Part 5 — Codex handshake

Execution step 1 (before any phase PR): this plan lands as a PR; the proven WSL `codex exec` review runs against the exact head with adversarial framing — challenge every D-decision, the G1 mechanism, and the phase ordering. Findings are dispositioned; iteration continues until Codex concurs. Then phases begin. Standing merge authorization covers the program's doc-PRs after concurrence; R4/R5 outcomes carry founder sign-off by construction.

## Verification

- Every PR: full `bun run gates`; new validators self-register via the run_gates parity test or the gate fails.
- Each D7 validator adversarially verified (fails on seeded violation before the fix, passes after).
- R5 success is objective: `registry/documents.json` shows the repository's first non-Draft/non-Proposed statuses with real `review_evidence`, and `scripts/validate_ratification_waves.py` passes against recorded wave artifacts.
- End-state: authority-claims validator green; zero known 09-UX cross-document contradictions; acquisition policy, intake skill, and fast path state one identical source order.

## Maintenance

Check items off only on merged evidence (PR numbers), per the `PROGRAM_STATUS.md` convention. On completion, record closure in `PROGRAM_STATUS.md` context and retire this plan to completed state rather than deleting it.
