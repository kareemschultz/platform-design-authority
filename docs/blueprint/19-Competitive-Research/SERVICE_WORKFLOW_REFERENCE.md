---
document_id: PDA-CIR-053
title: Service Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Service Workflow Reference

## Reference workflow

1. Ingest a request with channel, consent, Party candidate/link, tenant, subject, and sensitivity.
2. Classify and deduplicate without discarding the original; route by governed skills/queue rules.
3. Start the applicable SLA version and expose due time, business calendar, pause reason, and owner.
4. Investigate using permission-aware domain references; request an authorized domain command for remediation.
5. Communicate with audience, template/version, attachment controls, and delivery evidence.
6. Resolve with outcome and customer confirmation policy; reopen without erasing the prior resolution.

## Exceptions

Misrouted, duplicate, breached, waiting-on-customer, sensitive, suspected-abuse, and AI-uncertain cases require explicit states. Escalation changes responsibility; it does not silently expand permissions. Knowledge suggestions disclose source and freshness.

## Confidence and prototype evidence

Medium. Prototype multichannel dedupe, SLA clocks, privacy-safe timeline, accessible queue triage, domain-command failure, AI-disabled operation, and deletion-journal behavior.

## Sources

- [Zendesk ticket lifecycle](https://support.zendesk.com/hc/en-us/articles/4408883757338-About-ticket-fields) — official help, retrieved 2026-07-16.
- [ServiceNow case management](https://www.servicenow.com/products/customer-service-management/what-is-case-management.html) — official product documentation, retrieved 2026-07-16.

