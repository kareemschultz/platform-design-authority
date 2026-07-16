---
document_id: PDA-ENGR-014
title: Worktree Change and Release Coordination
version: 0.2.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-16
---

# Worktree, Change, and Release Coordination

## Purpose

Keep humans and agents aware of ownership, dependencies, status, documentation impact, and release consequences without turning a frequently conflicting central status document into the live task tracker.

## Sources of Truth

- GitHub Project: portfolio status, priority, release, dependency, risk, and ownership
- Issue/sub-issue: problem, scope, acceptance criteria, decisions, and handoff history
- Branch/worktree: isolated implementation state
- Pull request: reviewable change, tests, documentation, migration, and release metadata
- Changeset: package/release impact and changelog input
- ADR/specification: durable architecture and product authority

## One-to-One Rule

One independently mergeable issue uses one branch, one worktree, and one pull request. Never assign two active agents to the same worktree or branch. Split overlapping work by owned package/file boundary or serialize it through dependent issues.

Recommended names:

```text
branch: issue-123-short-description
worktree: ../worktrees/123-short-description
```

## Required Project Fields

- Status, priority, issue type, owner, capability/domain, target release
- Parent, dependencies, blocked reason, risk, evidence/lifecycle
- Documentation, API/schema, migration, security, privacy, accessibility, offline, and operations impact

## Start Protocol

1. Confirm the issue is assigned and dependencies are ready.
2. Fetch the target branch and create a unique worktree/branch.
3. Read governing ADRs/specifications and related open pull requests.
4. Record intended files/packages and warn owners of overlap.
5. Move the Project item to In Progress.

## Sync and Handoff

Worktrees share Git object storage and refs but do not synchronize file contents. Fetch and rebase/merge the target branch deliberately before final validation. Never copy changed files between worktrees as a substitute for commits.

Every handoff records issue, PR, branch, latest SHA, completed scope, changed packages/files, validation, documentation/changeset status, blockers, conflicts, assumptions, and exact next action.

## Pull Request Contract

- Linked issue and governing document IDs
- Scope and exclusions
- Capability/domain and contract impact
- Tests and evidence
- Documentation disposition
- Changeset/release-note disposition
- Migration, rollback, security, privacy, accessibility, offline, and operations impact
- Known follow-ups and lifecycle claim

The pull-request body records two explicit machine-checked dispositions:

1. **Documentation impact disposition:** exactly one of `Updated in this PR`, `No documentation impact`, or `Blocking documentation issue`, with paths, rationale, or a numbered blocking issue in `Evidence:`.
2. **Changeset and release impact disposition:** exactly one of `Changeset included`, `No Changeset required`, or `Blocking Changeset issue`, with Changeset paths, rationale, or a numbered blocking issue in `Evidence:`.

The lifecycle statement must contain a concrete claim, and the unsupported-readiness acknowledgement must be checked. `scripts/validate_pr_governance.py` compares the `Updated in this PR` and `Changeset included` selections with the actual base-to-head path set and rejects a stale manually pinned `PR head` SHA. GitHub's event head and exact-head checks remain authoritative for a mutable pull request; prose must not present an earlier SHA as the current head.

## Change and Release Records

Require a Changeset for user-visible behavior, public/internal package contract, SDK/API, configuration, migration, deprecation, or supported integration changes. Docs-only, test-only, and behavior-neutral refactors may explicitly declare no changeset.

Changesets generate package versions/changelogs and a release pull request. User-facing release notes are curated from approved changes plus issue/PR evidence; Conventional Commits alone are not sufficient user documentation.

`changeset status` proves Changeset syntax and the calculated release plan; it does not prove that a contributor made the correct include/no-impact/blocking disposition. The PR-governance validator supplies that review contract, while reviewers still verify semantic release impact.

## Merge and Cleanup

Use CODEOWNERS, protected branches, required CI, small pull requests, dependency ordering, and a merge queue when concurrency grows. After merge, remove the clean worktree with `git worktree remove`, delete the branch under policy, and periodically inspect `git worktree list --porcelain` and dry-run prune stale metadata.

## Anti-Patterns

- A central manually edited work-status document as the live task authority
- Multiple agents on one branch
- Unlinked worktrees or detached work with no issue owner
- Architectural decisions hidden in issue comments or changelogs
- Closing an issue before documentation, migration, or release metadata is complete
- Force-pushing over another contributor's work

## Automation Candidates

- Auto-add issues/PRs to the Project and sync status
- Extend the validated PR dispositions to linked-issue and GitHub Project-field reconciliation
- Detect two open PRs changing the same governed contract
- Stale worktree/branch reporting without automatic destructive cleanup
- Release PR generation through Changesets
- Documentation freshness and preview checks
