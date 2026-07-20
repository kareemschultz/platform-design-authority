# Governance, Docs, and Enforcement Remediation Program Plan

**Lifecycle:** Program-control plan (non-authoritative)

**Approved:** 2026-07-20 (founder-approved session plan)

**Plan baseline:** `main` at `7ed1b4e` (PR #109)

This is a lightweight program-control document per `README.md` in this directory. It is subordinate to the authority order in `AGENTS.md`; where it conflicts with a governed source, the source wins. Any agent executing this plan follows CLAUDE.md/AGENTS.md discipline: one issue + one branch + one PR per independently mergeable change, all gates green before PR, Codex review checked and resolved after every push.

## Why this program exists

A full repository audit (three independent exploration passes verified against live `main`) found that the governance **documentation is strong but enforcement and freshness are not**:

1. **CLAUDE.md/AGENTS.md §8 UI/UX governance is entirely honor-system.** No CI step, script, or lint rule enforces provenance records (`registry/premium-ui-provenance-template.json` is an unread template), `PREFERRED_COMPONENT_CATALOG.md` promotion gates, raw-palette prohibitions (`biome.json` has no such rule despite §11's "lint-visible defects" wording), or premium-credential scanning. `ui-pattern-audit`, `accessibility-review`, and `technology-evidence-maintainer` are Skills — nothing requires them to run.
2. **Component intake is slow by fragmentation.** Compliant intake requires reading ~5 of 7 overlapping 09-UX component-governance documents with manual provenance. Owned paid sources (shadcn Studio Pro MCP, Mobbin Pro MCP) are used only in one-off audit documents, not a repeatable pipeline.
3. **Work is stranded off `main`.** Open PR #75 holds the entire competitive-intelligence corpus (~100 files under `docs/blueprint/19-Competitive-Research/`). Roughly 26 worktrees and 18 local branches exist, all but three merged; `.codex/` and `.claude/worktrees/` are not gitignored.
4. **Tracking automation gaps.** `program-status-freshness.yml` has no scheduled run and no "Last updated" age check; no `CODEOWNERS`; no labels-as-code for the 37 live labels; issue #59 remains open although the Projects board it authorizes exists.
5. **Registry gaps.** `docs/blueprint/20-Strategy/BEACHHEAD_EVIDENCE_LOG.md` lacks front matter and is therefore absent from `registry/documents.json` and its section README. A BUSINESS_DNA_ENGINE document exists under two sections (PDA-ENG-019 in 03-Business-Engines, PDA-STR-012 in 20-Strategy) with no disambiguation.

Findings that earlier session state suggested but that are **already resolved on `main`** (verified; no work items): CLAUDE.md and AGENTS.md are byte-identical; `PROGRAM_STATUS.md` is current (WS2 100% stage-weighted, 42% overall); RR-011 is closed; `err.log` is untracked and gitignored.

## Phases and work items

Ordering: Phase 0 → PR-1 + sweep → **PR-2 (#75, hard blocker for Phases 4/6/8)** → PR-3/4/5 (parallel-safe) → PR-6 → PR-7 → PR-8 → PR-9 → PR-10/11 → PR-12..14.

### Phase 0 — Retire the dead branch, baseline on `main` (local, no PR)

- [ ] Delete local `chore/project-tracking-and-status-automation` (upstream gone; content superseded by main via PR #58+).
- [ ] Remove `err.log`; establish a green gate baseline on `main` (`check-types`, `test`, `check`, `validate_docs.py`, `generate_registries.py --check`, `validate_program_status.py`).

### Phase 1 — Repo hygiene: everything lands on `main`

- [ ] **PR-1** `chore(hygiene)`: gitignore `.codex/` and `.claude/worktrees/` (not all of `.claude/` — skills and settings stay tracked).
- [ ] **Sweep** (checklist in PR-1's issue): classify every branch/worktree (`git branch --merged origin/main`, `gh pr list --state all --head`); remove worktrees and local branches confirmed merged; delete confirmed-merged remote branches. **Keep live WS3 work**: `claude/ws3-integration` and the `ws3-entry-authorization` worktree are governed by FDR-012 and are not debris.

### Phase 2 — Land PR #75 (competitive-intelligence corpus)

- [ ] **PR-2**: determine why #75 stalled (`gh pr checks 75`); rebase onto `main` keeping CLAUDE.md and AGENTS.md byte-identical; reconcile with `docs/blueprint/20-Strategy/COMPETITIVE_INTELLIGENCE_AND_BENCHMARKING.md` and `docs/blueprint/20-Strategy/COMPETITOR_BENCHMARK_SCORECARD.md` (framework in 20-Strategy, corpus in 19-Competitive-Research, one operating register); regenerate registries; merge. If the rebase is unmanageable, split corpus-only from instruction/workflow edits.

### Phase 3 — Tracking automation completion

- [ ] **PR-3** `docs(tracking)`: refresh `PROGRAM_STATUS.md` to post-#75 cutoff; re-verify current-work references; close issue #59 citing the live-board section of `GITHUB_PROJECTS_OPERATING_GUIDE.md`.
- [ ] **PR-4** `chore(tracking)`: add `schedule:` cron + `workflow_dispatch` to `program-status-freshness.yml` with `GH_TOKEN` for closed-issue checks; auto-open/update a labeled issue on scheduled failure; add "Last updated" age gate to `validate_program_status.py` (warn >7 days, fail >14) with unit tests.
- [ ] **PR-5** `chore(governance)`: `.github/CODEOWNERS`; `.github/labels.yml` exported from live labels + `scripts/sync_labels.py` + sync workflow; record the recommended branch-protection ruleset in the Projects guide (issue #61 remains a founder settings action).

### Phase 4 — Instruction layer (after PR #75)

- [ ] **PR-6** `docs(instructions)`: enforce CLAUDE.md ≡ AGENTS.md byte-identity in `validate_docs.py` ("one document, two filenames"); fix "agents" → "skills" terminology; replace the unsupported "lint-visible defects" claim with the real CI gate reference (PR-8); add a §8 paid-asset inventory bullet (shadcn Studio Pro and Mobbin Pro are owned subscriptions that must be searched before hand-building UI).

### Phase 5 — UI/UX enforcement (link to issue #110)

- [ ] **PR-7** `ci(ui)`: extend the prohibited-surface grep in `meridian-prototype.yml` with premium-license/private-URL patterns (tuned against false positives, scope unchanged); add a required "UI changes" checklist to the PR template (ui-pattern-audit run, accessibility-review run, provenance recorded, no raw palette values).
- [ ] **PR-8** `feat(governance)`: new `scripts/validate_ui_governance.py` + tests + `evidence/ui-provenance/` contract — (1) provenance JSON conformance to the registry template, (2) catalog "Platform Approved" entries must cite provenance + acceptance evidence, (3) raw-palette grep over `apps/**` and `packages/ui/**` with an honestly seeded allowlist burned down under #110. Wire into both workflows.

### Phase 6 — Component intake fast path

- [ ] **PR-9** `docs(ux)+skill`: a new COMPONENT_INTAKE_FAST_PATH document under `docs/blueprint/09-UX/` — single entry point: platform-owned first → Studio Pro block/component/page via MCP → Mobbin pattern research → hand-build last resort; six-step normalization (semantic tokens, canonical states, accessibility, responsive, offline, white-label) linking to the authoritative sections of the existing seven documents (physical consolidation deferred). New `component-intake` skill (`.claude/skills/` + `.agents/skills/` mirror) automating search → fetch → provenance JSON → checklist → catalog update → validators. End-to-end proof: one real Studio Pro block landed with provenance, catalog entry, and green validators.

### Phase 7 — 09-UX curation and registry fixes (minimal churn)

- [ ] **PR-10** `docs(ux)`: merge `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md` into `PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md` (loser → `Superseded` tombstone, file retained); scope banners + cross-links for the design-token, dashboard/analytics, and motion pairs (merges deferred); point-in-time-evidence banners on the audit/evidence docs living in 09-UX; short ADR-0025 amendment recording the conventions.
- [ ] **PR-11** `docs(strategy)`: front matter + README index entry for `BEACHHEAD_EVIDENCE_LOG.md` (enters `documents.json` on regeneration); disambiguation notes for both BUSINESS_DNA_ENGINE files (`docs/blueprint/03-Business-Engines/BUSINESS_DNA_ENGINE.md`, `docs/blueprint/20-Strategy/BUSINESS_DNA_ENGINE.md`).

### Phase 8 — Best practices and competitive-research operationalization (post-#75)

- [ ] **PR-12** `docs`: best-practices coverage audit (consistency-auditor skill) over the post-#75 corpus — UI/UX areas, deployment incl. cost-aware/self-host, offline, BI operationalization; coverage matrix in `docs/reviews/`; one follow-up issue per genuine gap. Audit first; no blind authoring.
- [ ] **PR-13..n**: author only confirmed-missing best-practice documents (likely a SELF_HOST_AND_COST_OPTIMIZED_DEPLOYMENT document under `docs/blueprint/12-Deployment/`).
- [ ] **PR-14** `docs(ux)`: make competitive research load-bearing — §4 mandatory-lookup bullet (consult the domain's competitive capability matrix and adopt/improve/reject register before designing a surface); same step in the intake skill and fast-path doc; checkbox in the workstream-implementation issue form.

### Deferred (file as issues, not PRs)

Physical doc moves to 19-Appendices; dashboard/motion doc merges; Biome GritQL raw-color plugin; issue/PR→Project auto-add (requires founder click — API cannot mutate Projects views/workflows); branch-protection ruleset (#61, founder).

## Verification standard (every PR)

`bun run check-types && bun run test && bun run check`; `python scripts/validate_docs.py`; `python scripts/generate_registries.py` then `--check`; `python scripts/validate_program_status.py` when tracking files change; `validate_ui_governance.py` from PR-8 onward; CI green including the live Docker stack and health probes; Codex review checked, verified, and resolved after each push. No readiness claims beyond evidence.

## Maintenance

Check items off only on merged evidence (PR numbers), mirroring the `PROGRAM_STATUS.md` convention. When all phases close, record the completion in `PROGRAM_STATUS.md` open-risk/major-change context and retire this plan to a completed state rather than deleting it.
