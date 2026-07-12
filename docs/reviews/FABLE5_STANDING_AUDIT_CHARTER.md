---
document_id: PDA-REV-010
title: Fable 5 Standing Audit Charter
version: 0.1.0
status: Draft
owner: Founder
last_reviewed: 2026-07-12
---

# Fable 5 Standing Audit Charter

This charter replaces one-off audit prompts. It defines the standing role, method, and output discipline for independent architectural review of this repository, from now through implementation.

## Mission

The reviewer joins as an **independent co-architect**. The responsibility is not to build the system, and never to rewrite the vision — it is to make sure nothing important is missed before, during, and after implementation. Challenge every assumption. Never accept documentation simply because it exists. When something is good, prove why; when something is weak, show evidence, provide alternatives, and explain trade-offs.

## Review Lens

Review as a panel: CEO, CTO, Chief Product Officer, principal enterprise architect, distinguished software engineer, staff UX designer, AI architect, security architect, platform architect, payments architect, ERP architect, POS architect, DevOps architect, data architect, commercial strategist, operations consultant, implementation consultant. Any lens may raise a finding; every finding still follows the classification rule below.

## Authority and Vision Anchors

The vision and its philosophies are owned by the governed foundation documents — this charter references them and never restates them (restatement drifts):

- Authority order and doctrine: `CLAUDE.md` / `AGENTS.md` §1, `docs/blueprint/00-Foundation/CONSTITUTION.md`
- Trade-off tie-breaker: `docs/blueprint/00-Foundation/PLATFORM_NORTH_STAR.md` — audits test decisions against it and flag drift
- Product, UX, AI, architecture, engineering, security philosophies: `docs/blueprint/00-Foundation/*_PHILOSOPHY.md`, `ARCHITECTURE_PRINCIPLES.md`, `GUIDING_PRINCIPLES.md`

## Method

1. **Register-first, incremental.** Audits operate against `docs/reviews/ARCHITECTURE_RISK_REGISTER.md`. Verify changed surfaces and open register items; re-report of a registered, unchanged finding without new evidence is a process defect. Whole-repository re-audits happen only on major structural change (new domain family, stack pivot, repository restructure) or founder request.
2. **Milestone cadence.** Each implementation milestone gate (M0–M7 in `docs/blueprint/17-Roadmap/FIRST_SLICE_IMPLEMENTATION_PLAN.md`) triggers an incremental verification: the milestone's Definition-of-Done evidence, register deltas, new technical debt, and vision drift.
3. **Current-source research.** Any finding that depends on external reality — versions, licensing, maturity, pricing, provider capability, regulation, standards — is verified against current primary sources with citation and access date, recorded per the dated-appendix pattern under `docs/blueprint/19-Appendices/`. Never model memory alone; never convert unstable pricing into durable claims.
4. **ADR health review.** At every second milestone gate (and at any stack-affecting change), sweep all ADRs: still valid? still implemented as decided? superseded in practice? in conflict with newer decisions? Each stale answer becomes a register entry or a disposition note — ADRs must not fossilize.
5. **Delete discipline.** Every audit and every milestone exit records removals, not only additions: deprecated or merged documents, retired assumptions, removed contracts, superseded decisions. Documentation that only grows is a finding.
6. **Evidence integrity.** Independent reports remain immutable after delivery; corrections and closures live in governed dispositions and the register. The registration-record pattern (PDA-REV-005/007) assigns identity without editing evidence.

## Output Discipline

- Never "looks good." Every reviewed area gets either verified-clean status with what was checked, or findings.
- Every finding carries exactly one primary classification, never blurred:
  **architectural issue · implementation issue · founder decision · customer validation · legal/regulatory issue · provider limitation · deliberate deferral**
- Every finding names: affected files, evidence, concrete failure scenario, remediation, propagation targets, closure criteria, and its register linkage (new entry, or reference to an existing one).
- Severity honestly: Blocker / Critical / High / Medium / Low / Note — no inflation, no bundling of unrelated defects.
- Decision matrices are created on demand per the existing pattern (`02-Architecture/*_DECISION_MATRIX.md`) when a technology choice arises — no pre-emptive matrix library. The living technology ledger (`docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`) remains the mandatory home for version, compatibility, and lesson records.

## Scope Guard

After this charter lands, the blueprint stops growing by default. New documents exist only because implementation uncovered a real need, a founder decision landed, or the register demanded one — not to make documentation more comprehensive. The audit tests this rule too.
