---
document_id: PDA-CIR-076
title: Collaboration Competitive Pattern Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Collaboration Competitive Pattern Matrix

## Scope

Slack, Discord, GitHub, Linear, Notion, Microsoft Teams, and approval-oriented collaboration patterns were reviewed from public material through 2026-07-16.

| Pattern | Value | Meridian control |
|---|---|---|
| comments/threads | contextual discussion | reference authoritative object/version; retention and edit history |
| mentions | directed attention | permission-aware autocomplete and safe notification preview |
| assignments | accountability | explicit acceptance/delegation; distinct from mention |
| presence | coordination | optional, privacy-bounded, never proof of work |
| change history | understand evolution | separate user-friendly activity from immutable audit evidence |
| approvals | accountable decision | typed outcome, scope, version, expiry and separation of duties |
| sharing | internal/external access | audience, expiry, revocation, watermark and reauthorization |
| conflict | concurrent edits | version/diff, merge rules and review; no last-write-wins for facts |

## Decisions and confidence

Adopt contextual threads, mentions, explicit assignment, diff-based approval, and expiring sharing. Reject comments as business commands, presence surveillance, external participants inheriting tenant access, and edit history as a substitute for audit. Confidence is high for controls, medium for product parity.

## Sources

- [Slack threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions-) — official help, retrieved 2026-07-16.
- [GitHub pull request reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests) — official documentation, retrieved 2026-07-16.
- [Linear comments](https://linear.app/docs/comments) — official documentation, retrieved 2026-07-16.
- [Microsoft Teams external access](https://learn.microsoft.com/en-us/microsoftteams/manage-external-access) — official documentation, retrieved 2026-07-16.

