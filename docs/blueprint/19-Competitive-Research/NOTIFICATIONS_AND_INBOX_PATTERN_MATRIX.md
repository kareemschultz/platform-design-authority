---
document_id: PDA-CIR-075
title: Notifications and Inbox Pattern Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Notifications and Inbox Pattern Matrix

## Scope and authority

Linear, Slack, GitHub, Intercom, Zendesk, and enterprise inbox patterns were reviewed through 2026-07-16. A notification is delivery evidence, not proof that an assignment or domain command was completed. A cross-domain inbox aggregates references without stealing authority.

| Concern | Strong pattern | Meridian requirement |
|---|---|---|
| urgency | priority and due context | governed severity, source owner and escalation policy |
| assignment | explicit accountable owner | acceptance/delegation and no permission expansion |
| read state | seen/unseen | private per-user presentation, not business completion |
| snooze | time/context deferral | return condition, owner and SLA effect disclosed |
| dedupe/batch | digest related events | preserve material state transitions and correlation |
| preferences | channel, topic, schedule | mandatory safety/audit categories remain governed |
| delivery | in-app, email, push, webhook | per-channel sensitivity, retry, bounce and redaction |
| review queue | actionable exceptions | source-domain command, outcome and audit link |

## Rejected patterns and confidence

Reject unread count as operational status, notification-only assignment, cross-domain copied records, alert floods, sensitive content on lock screens, and snooze that secretly pauses a legal SLA. Confidence is high for the pattern implications.

## Sources

- [Linear inbox](https://linear.app/docs/inbox) — official documentation, retrieved 2026-07-16.
- [Slack notification settings](https://slack.com/help/articles/201355156-Configure-your-Slack-notifications) — official help, retrieved 2026-07-16.
- [GitHub notifications](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github) — official documentation, retrieved 2026-07-16.

