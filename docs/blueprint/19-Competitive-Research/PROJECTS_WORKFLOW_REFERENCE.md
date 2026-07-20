---
document_id: PDA-CIR-051
title: Projects Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Projects Workflow Reference

## Reference workflow

Create a project with purpose, owner, tenant, visibility, lifecycle, and workflow version. Capture tasks quickly, then enrich with assignee, dates, priority, dependencies, labels, and domain references. Transitions validate prerequisite/dependency rules. Views are projections of the same query and permission model. Completion records outcome; reopening preserves history.

## Failure and recovery

- Dependency cycles are rejected with an explainable path.
- Bulk edits preview affected tasks and report partial failures.
- Deleted or archived containers do not orphan authoritative domain records.
- Offline edits carry version and conflict context; ambiguous conflicts require review.
- Notification failure never changes task state.

## Shared mechanics

Command palette, list/board/calendar views, saved filters, inline assignment, mentions, and activity history are reusable mechanics. Drag-and-drop must have keyboard and menu equivalents. Audit history remains distinct from comments.

## Confidence and evidence

Medium. Evidence is required for 10,000-task performance, accessible board operation, dependency cycles, permissions after sharing, offline conflicts, automation preview, and export fidelity.

## Sources

- [Linear projects](https://linear.app/docs/projects) — official documentation, retrieved 2026-07-16.
- [Jira workflows](https://support.atlassian.com/jira-cloud-administration/docs/work-with-issue-workflows/) — official help, retrieved 2026-07-16.

