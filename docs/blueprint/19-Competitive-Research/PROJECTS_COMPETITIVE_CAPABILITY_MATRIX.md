---
document_id: PDA-CIR-050
title: Projects Competitive Capability Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Projects Competitive Capability Matrix

## Scope

Linear, Jira, Asana, Monday.com, ClickUp, and Notion were reviewed from public documentation as of 2026-07-16. Their information architecture informs task UX; it does not create a Meridian Projects authority or expand first-slice scope.

| Capability | Strong pattern | Weak pattern | Meridian implication |
|---|---|---|---|
| task/issue | concise creation, owner, status, priority | schema overload | progressive disclosure and governed required fields |
| dependencies | blocks/blocked-by and date effects | visually hidden dependency risk | explicit direction, cycle prevention, impact view |
| views | list, board, timeline, calendar | inconsistent semantics per view | one query/state model with accessible alternatives |
| status | configurable workflows | status proliferation | versioned workflows and transition rules |
| comments/history | contextual collaboration and activity | noise mixed with audit | separate conversation, operational history, and audit evidence |
| automation | routing and status changes | surprising bulk mutation | preview, scope, permission, idempotency, and rollback strategy |

## Decisions

Adopt rapid capture, keyboard efficiency, saved views, explicit dependencies, and compact activity. Improve with accessible non-drag alternatives and permission-aware cross-domain links. Reject board-only workflows, unlimited custom fields, comment-as-authority, and hidden automation.

monday.com documents selectable dependency behavior, including no-action, flexible and strict modes with automatic date movement. ClickUp documents explicit `blocks` and `blocked by` relationships, dependency automation, a permanent clear action, and a mobile-client limitation. Meridian should therefore expose dependency direction, mode, cycle checks, affected dates and an impact preview before mutation. It must not make plan/beta-dependent behavior a core contract, hide cross-task date changes, place domain rules in generic custom-field automation, or offer irreversible bulk clearing without confirmation and recovery evidence.

## Confidence and limitations

Medium-high for documented patterns, low for large-enterprise configuration behavior and mobile/offline parity.

## Sources

- [Linear issue relations](https://linear.app/docs/issue-relations) — official documentation, retrieved 2026-07-16.
- [Jira dependencies](https://support.atlassian.com/jira-software-cloud/docs/schedule-work-using-dependencies/) — official help, retrieved 2026-07-16.
- [Asana task dependencies](https://help.asana.com/s/article/task-dependencies) — official help, retrieved 2026-07-16.
- [Notion projects and tasks](https://www.notion.com/help/guides/getting-started-with-projects-and-tasks) — official help, retrieved 2026-07-16.
- [monday.com dependencies](https://support.monday.com/hc/en-us/articles/360007402599-Dependencies-on-monday-com) and [automations](https://support.monday.com/hc/en-us/articles/360001222900-Get-started-with-monday-automations) — official help, retrieved 2026-07-16; plan, beta and configuration availability vary.
- [ClickUp task dependencies](https://help.clickup.com/hc/en-us/articles/6309943321751-Create-Dependency-Relationships-in-tasks) and [automations](https://help.clickup.com/hc/en-us/articles/6312102752791-Intro-to-Automations) — official help, retrieved 2026-07-16; configured workspace and client parity untested.
