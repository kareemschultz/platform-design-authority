---
document_id: PDA-ENG-021
title: Worktree Change and Release Coordination
version: 0.1.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-12
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

## Change and Release Records

Require a Changeset for user-visible behavior, public/internal package contract, SDK/API, configuration, migration, deprecation, or supported integration changes. Docs-only, test-only, and behavior-neutral refactors may explicitly declare no changeset.

Changesets generate package versions/changelogs and a release pull request. User-facing release notes are curated from approved changes plus issue/PR evidence; Conventional Commits alone are not sufficient user documentation.

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
- Require issue, documentation, and changeset fields in PR templates
- Detect two open PRs changing the same governed contract
- Stale worktree/branch reporting without automatic destructive cleanup
- Release PR generation through Changesets
- Documentation freshness and preview checks
