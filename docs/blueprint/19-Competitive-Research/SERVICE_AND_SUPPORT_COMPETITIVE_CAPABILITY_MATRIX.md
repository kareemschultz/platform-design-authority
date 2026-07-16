---
document_id: PDA-CIR-052
title: Service and Support Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Service and Support Competitive Capability Matrix

## Scope

ServiceNow, Zendesk, Freshdesk, Salesforce Service, and Intercom were assessed from public documentation available 2026-07-16. Ticket/case systems may aggregate domain context but do not own Party, orders, payments, inventory, or audit facts.

| Capability | Market pattern | Meridian implication |
|---|---|---|
| intake | email, chat, portal, API, agent creation | normalize channel provenance without copying secrets or losing originals |
| assignment | queues, skills, groups, round-robin | explain rule, owner, handoff, and permission |
| SLA | response/resolution targets and calendars | versioned policy, pause reasons, breach prediction as advisory |
| escalation | time, priority, sentiment, manual | deterministic trigger plus audited override |
| knowledge | suggested/public/internal articles | source, version, audience, feedback, and stale-state handling |
| customer context | account/contact/timeline aggregation | Party-safe projection with per-domain authority labels |
| AI | summary, reply, classification, bot resolution | provenance, confidence, approval, fallback, cost, and audit |

## Rejected patterns and confidence

Reject ticket status as proof of domain resolution, copied customer records, hidden SLA pauses, notification-as-assignment, and AI closure without an authorized deterministic command. Confidence is medium; product tiers and configured implementations vary widely.

## Sources

- [ServiceNow customer service management](https://www.servicenow.com/products/customer-service-management.html) — official product documentation, retrieved 2026-07-16.
- [Zendesk SLA policies](https://support.zendesk.com/hc/en-us/articles/4408829459866-Defining-and-using-SLA-policies) — official help, retrieved 2026-07-16.
- [Freshdesk ticket assignment](https://support.freshdesk.com/support/solutions/articles/50000000075-understanding-automatic-ticket-assignment) — official help, retrieved 2026-07-16.
- [Intercom Fin AI Agent](https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-explained) — official help, retrieved 2026-07-16.

