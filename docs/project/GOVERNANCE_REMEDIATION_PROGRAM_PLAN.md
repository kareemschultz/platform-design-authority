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

- [x] Delete local `chore/project-tracking-and-status-automation` (upstream gone; content superseded by main via PR #58+). Done 2026-07-20.
- [x] Remove `err.log`; establish a green gate baseline on `main` (`check-types`, `test`, `check`, `validate_docs.py`, `generate_registries.py --check`, `validate_program_status.py`). Done 2026-07-20; the lint baseline was red until PR #114 (see PR-1).

### Phase 1 — Repo hygiene: everything lands on `main`

- [x] **PR-1** `chore(hygiene)`: gitignore `.codex/` and `.claude/worktrees/` (not all of `.claude/` — skills and settings stay tracked). Merged as PR #114; it also fixed the then-broken local `bun run check` (nested worktree `biome.json` roots).
- [ ] **Sweep** (checklist in PR-1's issue): classify every branch/worktree (`git branch --merged origin/main`, `gh pr list --state all --head`); remove worktrees and local branches confirmed merged; delete confirmed-merged remote branches. **Keep live WS3 work**: `claude/ws3-integration` and the `ws3-entry-authorization` worktree are governed by FDR-012 and are not debris.

### Phase 2 — Land PR #75 (competitive-intelligence corpus)

- [x] **PR-2**: merged 2026-07-20 as PR #75 after a full `main` merge-reconciliation: 29 conflicts resolved, eight duplicate `document_id` allocations reassigned above their family maxima (the direct motivation for PR-C), one delivery-state-coupled regression test decoupled onto controlled fixtures, and the richer program-status row format retained with `main`'s current numbers. Original scope for the record: determine why #75 stalled (`gh pr checks 75`); rebase onto `main` keeping CLAUDE.md and AGENTS.md byte-identical; reconcile with `docs/blueprint/20-Strategy/COMPETITIVE_INTELLIGENCE_AND_BENCHMARKING.md` and `docs/blueprint/20-Strategy/COMPETITOR_BENCHMARK_SCORECARD.md` (framework in 20-Strategy, corpus in 19-Competitive-Research, one operating register); regenerate registries; merge. If the rebase is unmanageable, split corpus-only from instruction/workflow edits.

### Phase 3 — Tracking automation completion

- [ ] **PR-3** `docs(tracking)`: refresh `PROGRAM_STATUS.md` to the post-#134 cutoff; re-verify current-work references (done: all 15 cited issue numbers checked live — every closed/open state matches the document's claims, no drift found). **Correction to original scope**: issue #59's acceptance criteria include 3 of 8 items (the 9 views, 8 charts, and native automatic-add/status workflows) that `GITHUB_PROJECTS_OPERATING_GUIDE.md` itself documents as founder-only manual web-UI actions with no API/CLI path — closing it outright would be an unsupported readiness claim. PR-3 instead updates the issue's checklist to reflect the live board state (project, fields, and repository link are done) and leaves it open, scoped to the founder-only remainder.
- [x] **PR-4** (merged as PR #132) `chore(tracking)`: add `schedule:` cron + `workflow_dispatch` to `program-status-freshness.yml` with `GH_TOKEN` for closed-issue checks; auto-open/update a labeled issue on scheduled failure; add "Last updated" age gate to `validate_program_status.py` (warn >7 days, fail >14) with unit tests.
- [x] **PR-5** (merged as PR #134) `chore(governance)`: `.github/CODEOWNERS`; `.github/labels.yml` exported from live labels + `scripts/sync_labels.py` + sync workflow. Building it caught a real bug (Windows `subprocess` decoding gh's UTF-8 output via the console codepage, mangling an em dash into mojibake and producing false drift). Branch-protection ruleset recommendation remains deferred to the founder (issue #61).

### Phase 3.5 — Developer-experience and correctness fixes

Added 2026-07-20 after the Phase 2 merge surfaced three instances of one defect class and two avoidable integration costs. These make every later phase cheaper and touch no application code, so they are safe to land alongside live workstream branches.

- [x] **PR-A** (merged as PR #118) `feat(tooling)`: `scripts/run_gates.py` (`bun run gates`) runs the CI gate set in one command with a pass/fail table, plus `scripts/test_run_gates.py`, which derives the command set from `.github/workflows/` and fails when a CI gate is neither declared nor recorded as deliberately skipped. Reconstructing the gate list by hand cost two failed CI rounds on PR #75; `validate_docs.py` passing is not the same as a green branch.
- [x] **PR-B** `fix(tooling)`: audit the remaining tree-walking scripts for the filesystem-versus-git-index defect. Outcome (PRs #116 and #120): the audit of all nine tree-walking scripts found **no further live instances** — `validate_document_indexes.py` was fixed in #116, and the other two root-walking scripts were protected only by accidental dot-directory pruning. #120 therefore records the exclusion as a named invariant with `scripts/test_repository_scanning.py`, adversarially verified (stripping a prune makes the guard fail naming the file) and self-retiring (it fails with removal instructions if no script walks the root any more).
- [x] **PR-C** (merged as PR #128) `feat(governance)`: fail a branch when a `document_id` it adds collides with one already on `origin/main`. Parallel branches each allocating the next free identifier produced eight collisions in the PR #75 merge, every one of which had to be reassigned by hand at integration time.
- [x] **PR-D** (merged as PR #130) `feat(tooling)`: add a `--body-file` mode to `validate_pr_governance.py` so a pull-request body can be checked locally without fabricating a GitHub event payload with base and head SHAs.
- [ ] **PR-E** `chore(tracking)`: report branches whose upstream is gone, and merged branches older than a threshold, on the Phase 3 schedule. A dead branch with a deleted upstream produced several audit findings that evaporated on re-verification against `origin/main`. Delivered on `feat/report-stale-branches`; check off with that PR's number on merge. Building it found a second, more consequential defect than the one it was written for: a squash or rebase merge (this repository's norm) does not make the source branch an ancestor of the merge commit, so an ancestor-only "is this merged" check silently misses the common case. `classify()` checks the pull request's own merge record first, falling back to ancestry only for merges that didn't go through a PR. Live-validated by finding and deleting 19 already-fully-merged remote branches this pass, including several from this very session that `gh pr merge --auto --delete-branch` had failed to clean up.

Also worth a deliberate decision rather than a change: the per-cell partial-evidence feature now has **zero** live subjects, since no capability is `Partially Evidenced` after the WS2 closeout. That is why its regression test had drifted into asserting delivery progress. Confirm the feature still earns its complexity before extending it.

### Phase 4 — Instruction layer (after PR #75)

- [ ] **PR-6** `docs(instructions)`: enforce CLAUDE.md ≡ AGENTS.md byte-identity in `validate_docs.py` ("one document, two filenames"); fix "agents" → "skills" terminology; replace the unsupported "lint-visible defects" claim with the real CI gate reference (PR-8); add a §8 paid-asset inventory bullet (shadcn Studio Pro and Mobbin Pro are owned subscriptions that must be searched before hand-building UI).

### Phase 5 — UI/UX enforcement (link to issue #110)

- [ ] **PR-7** `ci(ui)`: extend the prohibited-surface grep in `meridian-prototype.yml` with premium-license/private-URL patterns (tuned against false positives, scope unchanged); add a required "UI changes" checklist to the PR template (ui-pattern-audit run, accessibility-review run, provenance recorded, no raw palette values).
- [ ] **PR-8** `feat(governance)`: new `scripts/validate_ui_governance.py` + tests + `evidence/ui-provenance/` contract — (1) provenance JSON conformance to the registry template, (2) catalog "Platform Approved" entries must cite provenance + acceptance evidence, (3) raw-palette grep over `apps/**` and `packages/**` with an honestly seeded allowlist burned down under #110. Wire into both workflows, and register each new workflow step in `scripts/run_gates.py` or the parity gate fails (proved on PR #120).
  - **Seed evidence, audited 2026-07-20 on `main`:** zero Tailwind palette utility classes (`bg-red-500` style) anywhere in `apps/` or `packages/`; hex literals only in `apps/native/lib/constants.ts`, `apps/web/src/app/manifest.ts`, and `packages/ui-web/core/src/styles/globals.css`. Those three files are the entire initial allowlist — they are token/config sources, not components. The validator can therefore start strict with no burn-down debt.
- [x] **PR-8b** (merged as PR #122) `docs(skill)`: harden the `frontend-architecture` skill (both `.claude/skills/` and `.agents/skills/` mirrors) with the visual-token/palette discipline, the audited baseline above, and the paid-asset component-acquisition order (platform-owned → shadcn Studio Pro MCP → Mobbin Pro → hand-build, with provenance).
- [x] **PR-8c** (merged as PR #124) `docs(skill)`: new mandatory `frontend-implementation` skill (both mirrors) — the single build-time entry point routing any implementing agent through the governed 09-UX documents by surface, the acquisition order, the token/palette hard rules, canonical states, and the pre-PR verification list — plus a §8 bullet in CLAUDE.md/AGENTS.md making its use mandatory for all frontend/UI-UX implementation. Codex review returned no findings.

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

## Implementation-agent briefing (updated 2026-07-20, post PR #134)

Resume state for any agent continuing this program. Verify against live `origin/main` before acting — do not trust a session checkout (see the 2026-07-20 Engineering Notebook entry).

**Merged so far:** #112 (this plan + lessons), #114 (PR-1), #75 (PR-2), #118 (PR-A), #116 + #120 (PR-B), #122 (PR-8b), #124 (PR-8c), #126 (bookkeeping), #128 (PR-C), #130 (PR-D), #132 (PR-4), #134 (PR-5). CLAUDE.md and AGENTS.md are byte-identical on `main`. All 15 issue numbers cited in `PROGRAM_STATUS.md` were checked live on 2026-07-20 and every closed/open state matches the document's claims — no drift found; the document did not need a content refresh beyond the resolution below.

**Resolved this pass:** issue #59 is not closable outright — `GITHUB_PROJECTS_OPERATING_GUIDE.md` documents (with citations to the GitHub GraphQL schema) that 3 of its 8 acceptance items (the 9 views, 8 charts, native automatic-add/status workflows) have no API/CLI path and are founder-only manual web-UI actions. The remaining PR-3 work is to update the issue's checklist to reflect the live board state and leave it open, scoped to that founder-only remainder — not to close it.

**Next work, in order:**

1. **Phase 1 sweep** — in progress (background job, ~10 of 13 worktrees removed as of this writing; Windows deletion of `node_modules`-heavy trees is slow, not stuck). Cautions: `claude/ws3-integration` and `ws3-entry-authorization` are live FDR-012 work (an active agent session pushed to ws3-integration as recently as 2026-07-20) — never remove or edit them; the two `ws3-*-review` detached-HEAD worktrees under `Documents/worktrees/` are historical WS3 review snapshots, left untouched for the same reason; `git worktree remove` needs `--force` for `node_modules` leftovers, and on Windows a `git worktree remove` that times out mid-directory-deletion has usually already dropped the `.git` worktree link — `rm -rf` the leftover directory rather than retrying the git command. `codex/issue-93-third-party-baseline` held staged WIP that was verified byte-for-byte superseded by already-merged PR #98 content (main's version is strictly more precise) before being stashed (not discarded) and the worktree removed.
2. **PR-3** (Phase 3, the one item not yet merged) — update issue #59's checklist per the resolution above; nothing else in `PROGRAM_STATUS.md` needs changing.
3. **PR-E** (Phase 3.5 remainder) — now depends on PR-4's merged `schedule:` trigger existing in `program-status-freshness.yml`; add the stale/gone-upstream branch report as a step in that same workflow rather than a new one.
4. **PR-6** (Phase 4 parity gate + terminology fixes).
5. **PR-7/PR-8** (Phase 5) — the palette allowlist is already audited and seeded above; PR-8 needs no discovery work, only implementation.
6. **PR-9 onward** as planned.

**A pattern worth repeating:** every PR this session was built on a fresh branch off `origin/main` (never the plan-editing branch, never a branch with other unrelated changes stacked on it) via `git stash` → `git checkout -b <name> origin/main` → `git stash pop`, specifically to avoid two failure modes hit earlier: (a) a shell `cd` prefix silently operating on the wrong checkout (this repo vs. this worktree) while file edits land in the intended one, producing a "nothing to commit" surprise; (b) a branch name collision when the same branch name is already checked out in a sibling worktree sharing this repo's `.git`. Verify `git branch --show-current` and `pwd` actually agree with intent before trusting either.

**Operating rules for implementers:** follow §12 discipline (one issue + branch + PR per change; `bun run gates` before every PR; Codex bot review checked, verified, and resolved after every push). New CI workflow steps must be registered in `scripts/run_gates.py` in the same PR. Standing founder authorization covers merging this program's PRs on green CI; readiness-state changes, WS3 actions, and application behaviour still require an explicit ask. The WS3 remediation running on `claude/ws3-integration` is a separate program with its own review gates — do not fold its items into this plan or vice versa. Known residue: `biome.json` on `main` still sets `vcs.useIgnoreFile: false`, so gitignored generated artifacts (Playwright reports) fail `bun run check` when present on disk; the config fix rides the WS3 branch — until it lands, delete `apps/web/playwright-report` and `apps/web/test-results` before running the lint gate.

## Verification standard (every PR)

`bun run check-types && bun run test && bun run check`; `python scripts/validate_docs.py`; `python scripts/generate_registries.py` then `--check`; `python scripts/validate_program_status.py` when tracking files change; `validate_ui_governance.py` from PR-8 onward; CI green including the live Docker stack and health probes; Codex review checked, verified, and resolved after each push. No readiness claims beyond evidence.

## Maintenance

Check items off only on merged evidence (PR numbers), mirroring the `PROGRAM_STATUS.md` convention. When all phases close, record the completion in `PROGRAM_STATUS.md` open-risk/major-change context and retire this plan to a completed state rather than deleting it.
