# GitHub Projects Operating Guide

This directory's status is [`README.md`](./README.md): lightweight, non-authoritative program-control documents. This guide follows the same posture. It does not replace the blueprint, ADRs, registries, the Architecture Risk Register, GitHub Issues, or pull requests.

## Current state (as of this document's authoring)

**No GitHub Projects (v2) board exists for this repository.** This was verified two ways: `gh project list --owner kareemschultz` fails with `your authentication token is missing required scopes [read:project]`, and a live, authenticated browser session against `https://github.com/kareemschultz/platform-design-authority/projects` returned "No projects found... There are no projects linked to this repository." Both checks agree; this is a verified absence, not an unchecked assumption.

What **is** configured and live today:

- Labels: workstream (`ws0`–`ws7`), work-type (`backend`, `frontend`, `native`, `contracts`, `data`, `security`, `ux`, `infrastructure`, `testing`, `research`, `operations`, plus the pre-existing `documentation`), state/attention (`blocked`, `risk`, `technical-debt`, `external-gate`, `production-readiness`, `controlled-prototype`), and the pre-existing `risk-register`, `workstream`, `founder-decision`, `bug`, `enhancement`, `question`, `wontfix`, `duplicate`, `invalid`, `good first issue`, `help wanted`.
- Milestones: `Prototype 1 — Identity and Tenancy` through `Prototype 7 — Recovery and Operations`, plus `First Slice Closeout`. No due dates — none are founder-approved yet.
- Issue forms under `.github/ISSUE_TEMPLATE/`: Workstream implementation, Bug report, Architecture or governance change, UX/component candidate, Risk or technical debt.
- A pull request template at `.github/PULL_REQUEST_TEMPLATE.md`.
- Closing keywords (`Closes #N`) are already in active use and work today with zero additional configuration — GitHub auto-closes the linked issue when the PR merges.
- GitHub's native sub-issue relationships are available on this repository (confirmed via the API) but unused; consider using them for future workstream/sub-task hierarchies instead of a text "Blocked By" field.

What is **not** configured: any GitHub Projects (v2) board, its fields/views/charts, or any issue-to-project/PR-to-project automation. This guide records the target design below so a future session (once granted `project` scope) or a human with board-creation access can stand it up without re-deriving the schema, and so no automation is built against a board that does not exist.

## Target board design (not yet created)

Board name: **Meridian Delivery Program**.

### Fields

| Field | Type | Options |
|---|---|---|
| Status | single-select | Backlog, Ready, In Progress, In Review, Blocked, Done, Deferred, Cancelled |
| Phase | single-select | Phase 0 — Vision and Research, Phase 1 — Blueprint, Phase 2 — Platform Foundation, Phase 3 — Platform Services, Phase 4 — Business Domains, Phase 5 — Experience and Clients, Phase 6 — AI Platform, Phase 7 — Operations, Phase 8 — Production Readiness |
| Workstream | single-select | WS0–WS7, Cross-cutting, Post-first-slice |
| Prototype | single-select | P1–P7, None |
| Work Type | single-select | Governance, Contract, Architecture, Backend, Frontend, Native, UX, Data, Security, Infrastructure, Testing, Documentation, Research, Operations, Release |
| Priority | single-select | P0 Critical, P1 High, P2 Normal, P3 Low |
| Risk | single-select | Critical, High, Medium, Low, None |
| Lifecycle | single-select | Research, Draft, Controlled Prototype, Prototype Approved, Pilot, Production Candidate, Production, Deprecated |
| Evidence State | single-select | Not Started, Partial, Complete, Blocked, Not Applicable |
| Target | milestone (native) | Use the milestones already created; do not add a parallel iteration field until an approved calendar exists |
| Progress Weight | number | Used only by the governed progress formula in `PROGRESS_MEASUREMENT_STANDARD.md` — never a substitute for it |
| Blocked By | text, or native issue dependency once available | Free text until GitHub's dependency feature is adopted here |

### Views

1. **Program Board** — board grouped by Status; exclude Cancelled and Deferred by default; show Phase, Workstream, Prototype, Priority, Risk, Assignee.
2. **Workstream Board** — board grouped by Workstream, sorted/grouped secondarily by Status.
3. **Current Work** — table filtered to Ready/In Progress/In Review/Blocked, sorted by Priority then Workstream then Updated.
4. **Roadmap** — grouped by Phase or Workstream. Do not add iteration dates until approved dates exist (`FOUNDER_DECISION_REGISTER.md`).
5. **Risks and Blockers** — table filtered to Status=Blocked or Risk=Critical/High; show owner, dependency, linked RR-###/TD-### entry, next action.
6. **First Slice** — filtered to Workstream WS0–WS7, grouped by Workstream; show Prototype, Status, Evidence State, Progress Weight.
7. **Production Readiness** — filtered to Phase=Phase 8, or Work Type in {Security, Operations, Release}, or Lifecycle in {Pilot, Production Candidate}. Keep this view visually and namely separate from implementation-completion views — a full "Current Work" board must never be read as production readiness.
8. **Recently Completed** — Status=Done, updated within the recent reporting period.
9. **By Domain or Capability** — table grouped by capability/domain, only where that metadata can be derived reliably from `registry/capabilities.json`. Do not hand-duplicate the capability registry into issues; link to the registry entry instead.

### Charts

Issues by Status, by Workstream, by Phase, by Work Type; Blocked items by Workstream; Completed items over time; Current work by Priority; First-slice issue completion by Workstream.

**Issue-count charts measure throughput, not evidence or effort.** The authoritative first-slice implementation percentage is, and remains, the one computed by `PROGRESS_MEASUREMENT_STANDARD.md` — never a chart's issue-completion ratio.

## Status transitions (for whoever builds the automation)

| Trigger | Status |
|---|---|
| Issue created | Backlog |
| Draft PR opened | In Progress |
| PR marked ready for review | In Review |
| PR merged | linked issue → Done (already true today via closing keywords, without a board) |
| Issue closed as completed | Done |
| Issue reopened | Backlog or In Progress — whichever is determinable, never silently forced to one value |
| `blocked` label added | Blocked |
| `blocked` label removed | restore prior state only when determinable, otherwise Ready |

Prefer native GitHub Project workflows (configured in the board's own Workflows tab) over a stored personal-access token with `project` write scope. If native workflows cannot express a transition, leave it manual rather than storing a broad PAT as a repository secret.

## Labels versus fields

Labels answer "what kind of work, permanently" (workstream, work type, and durable attention markers like `blocked`/`risk`/`external-gate`). Project fields answer "where is this right now" (Status, Evidence State) and "how should this be sliced today" (Priority, Risk, Phase) — the same underlying fact can be true in a label and stale in a board field, or vice versa, so do not assume one is a substitute for the other. Do not create a label that only duplicates a single-select field's options with no standalone use outside the board (e.g. do not add a `status-in-review` label).

## Progress percentage rules

Never derive a project or workstream completion percentage from: issue count, PR count, commit count, lines of code, or elapsed time. The only authoritative first-slice percentage is the one in `PROGRAM_STATUS.md`, computed per `PROGRESS_MEASUREMENT_STANDARD.md`'s weighted-stage formula from merged evidence. A board or chart may display issue-count-based throughput, but it must be labeled as throughput, never as "progress" or "% complete" without that qualifier.

## What agents must update

- `docs/project/PROGRAM_STATUS.md`, following `STATUS_UPDATE_TEMPLATE.md`, whenever a workstream stage closes on merged evidence.
- Labels/milestones on an issue or PR they open or materially move.
- This guide, if the target board design changes before the board is actually created.

## What agents must not update

- Board fields directly via API using a broad personal-access token stored as a secret — this guide's automation section explicitly steers away from that pattern.
- `PROGRAM_STATUS.md`'s percentages based on anything other than merged evidence — see the update rule already stated in that document.
- Any percentage or status based on open PRs, draft PRs, local branches, or planned-but-unmerged issues.

## Weekly or milestone status-review procedure

At each workstream closeout PR: update `PROGRAM_STATUS.md` per `STATUS_UPDATE_TEMPLATE.md`, close the corresponding milestone issue(s), verify the Architecture Risk Register reflects any status change, and confirm `python scripts/generate_registries.py --check` and `python scripts/validate_docs.py` are green on the exact merged head before considering the stage closed.
