---
document_id: PDA-ENGR-016
title: Engineering Notebook
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Engineering Notebook

An append-only engineering notebook: patterns, mistakes, discoveries, trade-offs, benchmarks, performance experiments, and migration notes that are **not load-bearing enough for an ADR and not a technology-version fact for the lifecycle ledger, but too valuable to lose**.

## Rules

1. Append-only; entries are never rewritten. Corrections are new entries referencing the old one.
2. Every entry: date, author (human or agent), context, observation, and — where applicable — evidence paths.
3. Nothing here is authority. When a note becomes load-bearing, it graduates: technology/version facts to `TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`, decisions to an ADR, defects/risks to the Architecture Risk Register. The graduating PR records the promotion here.
4. Notes must not restate specifications; link instead.

## Entries

### 2026-07-12 — Notebook established
Created as part of the program-plan batch (PDA-RDM-007). Seed observations from the audit/remediation cycles worth keeping visible:

- **Windows contributor friction:** deep checkout paths break Turbopack builds (MAX_PATH); `core.autocrlf` without `.gitattributes` produced 93 phantom lint errors until LF enforcement landed. Linux CI is authoritative; local Windows failures should be reproduced in CI before debugging locally.
- **tsc incremental caches trip CI content scans:** `tsc --noEmit` with Next's `incremental: true` writes `tsconfig.tsbuildinfo` whose `node_modules` path lists false-positive naive greps. Scans must exclude build artifacts by class, not by name.
- **`import.meta.main` dies under tsdown bundling** (module moves into a shared chunk); gate Bun-serve entry points on `"bun" in process.versions` instead.
- **Registry-first governance works:** the generated-registry + freshness-check pattern (documents, capabilities, events, permissions, endpoint-permissions, first-slice, tests) caught real drift repeatedly across four audits; extend the same pattern to any new machine-readable artifact rather than inventing bespoke checks.
- **Line-length between prose and machine artifacts is where drift lives:** every recurring audit-finding class was a prose claim without a machine mirror (chart tokens, endpoint tables, environment names). Default to giving normative claims a lintable home.

### 2026-07-16 — Multi-agent independent review discipline
Observed and repeated across the WS1 closeout and WS2 PR1-PR4 review cycles (issue #56/PR #57 RR-011; PR #65, #67, #69, #74; issue #70). Recorded here so any agent picking up this repo — a fresh session, a different host, a different model — can reproduce the same discipline instead of re-deriving it. Not a mandate; graduates to an ADR or the risk register if it ever becomes load-bearing rather than a working habit.

Pattern, when one agent (author) hands a governance document, a documentation-only remediation, or a real implementation PR to another agent (reviewer) for independent audit:

- **Isolated checkout, not the working tree in use for other tasks.** Review in a fresh clone or worktree so the audit can't be contaminated by uncommitted state from unrelated work, and so a `git diff`/`git log` against remote refs is unambiguous.
- **Diff against the exact previously-reviewed commit SHA**, not "the PR" as a moving target. Record that SHA in the review comment. A second review round diffs against the first round's reviewed head, not against the PR's base branch — this is what makes "re-review only what changed" possible instead of re-litigating already-cleared work.
- **Fan out parallel verification agents across independent lenses** for large diffs (correctness, architecture-rule/registry compliance, test-dimension coverage, security/tenant-isolation) rather than one linear read. Each lens reports findings independently; merge and de-duplicate before writing the review.
- **Personally re-verify the single highest-stakes claim directly** — actually run the migration, actually hit the endpoint, actually diff the generated registry — rather than trusting a delegated agent's or the author's narrative summary of it.
- **Run live gates, not narrative.** `bun run check-types`, `bun test`, `bun run check`, `python scripts/validate_docs.py`, `python scripts/generate_registries.py --check` (and any workstream-specific validator, e.g. `validate_program_status.py`) get executed by the reviewer, not accepted on the author's say-so that "all green."
- **Post evidence, not a vibe.** Either concrete inline findings tied to file:line, or explicit concurrence that names the exact head SHA reviewed and what was checked. Never a bare "LGTM."
- **Comment via a JSON-payload file, not inline shell quoting.** On Windows/Git-Bash, `gh api ... -f body="..."` silently drops content on unescaped backticks, and `VAR=value cmd` leaks into argv. Build the comment body as a file and pass it with `--input`/`-F body=@file`.
- **Pair every doc patch with an issue/RR-###/TD-### reference.** A silent edit to a governance document, even a correct one, loses the "why" that later review depends on.
- **After every push, check for `chatgpt-codex-connector` bot review comments and act on legitimate findings without being asked**, then reply and resolve the thread.
- **The reviewer never merges.** Findings and concurrence are posted for the human or the PR owner to act on.

### 2026-07-20 — Whole-repo governance audit: stale-state and enforcement-drift lessons
Author: Claude (Fable 5 planning session). Context: the audit behind `docs/project/GOVERNANCE_REMEDIATION_PROGRAM_PLAN.md`. Observations worth keeping visible:

- **Audit from `origin/main`, never from the session's checkout.** A three-agent audit initially "found" CLAUDE/AGENTS drift, stale PROGRAM_STATUS rows, and an unclosed risk row — all artifacts of auditing a dead branch that had forked a week earlier. Every finding was re-verified against `origin/main` before planning; roughly a third evaporated. First step of any repo audit: `git fetch` and diff the checkout against `origin/main`; treat a branch whose upstream reads `[gone]` (`git for-each-ref --format='%(upstream:track)'`) as dead until proven otherwise.
- **Unmerged research effectively does not exist.** The entire competitive-intelligence corpus (~100 files, PR #75) sat unmerged for four days, and the founder's working belief became "that research was never done." Research and audit output must merge promptly — its value decays to zero while stranded, and later sessions re-plan work that already exists.
- **Worktree sprawl has a concrete failure mode:** a scratch worktree holding `main` checked out blocks `git checkout main` in the primary tree, and `git worktree remove` refuses on untracked leftovers (`node_modules`). Workaround: branch new work directly off `origin/main` (`git checkout -b <branch> origin/main`) without touching local `main`; keep agent scratch-worktree directories gitignored so they never look like repo content.
- **Path-triggered freshness checks cannot catch externally-induced staleness.** A status validator that only runs when the status file changes goes blind when the world changes instead (an issue closes, a board is created). Freshness gates need a `schedule:` trigger and an explicit last-updated age bound, and scheduled failures need to open an issue — a red run on `main` that nobody watches is not a gate.
- **Prose that claims enforcement is a defect class of its own.** "Raw palette values are lint-visible defects" was written while no lint rule existed; "agents" named as reviewers were actually optional Skills that no gate requires. Extends the 2026-07-12 registry-first lesson: when a normative sentence says "is enforced/lint-visible/required," CI must be able to point at the enforcing step, or the sentence must say "should be."
- **The `docs/project` link validator treats backticked path-like strings as internal references.** Naming a planned-but-not-yet-created document with a backticked path ending in ".md" fails `validate_docs.py` (this very entry originally did so); name future documents in prose (directory in backticks, filename bare) until they exist.
