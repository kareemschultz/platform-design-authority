---
document_id: PDA-CIR-048
title: CRM Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# CRM Competitive Capability Matrix

## Scope and boundary

Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, and Dynamics 365 Sales were reviewed from public product/help material available 2026-07-16. CRM owns sales-process records and relationship context only where existing domain authority assigns them; Party remains canonical real-world identity.

| Concern | Common market pattern | Failure mode | Meridian implication |
|---|---|---|---|
| leads/contacts/accounts | separate prospect and customer objects | duplicates and premature identity creation | link domain roles to Party; preserve unresolved candidates |
| opportunities | configurable stages, probability, owner | stage inflation and unreliable forecasts | governed pipeline definitions with history and reason |
| activities | task, meeting, email, call timeline | copied communications and privacy sprawl | references, retention, sensitivity, and channel provenance |
| deduplication | exact/fuzzy match plus merge | irreversible wrong merge | explain candidates; governed merge with redirects and audit |
| automation | assignment, scoring, sequence, workflow | opaque changes and permission bypass | command-based action, simulation, approval, and audit |
| reporting | pipeline and activity dashboards | definitions vary silently | governed metrics and drill-through to authoritative records |

## Decisions and limitations

Adopt visible pipelines, structured activity history, duplicate-candidate review, and explainable assignment. Improve with Party-safe linkage and correction. Reject “contact equals person,” silent merge, email-copy authority, and AI-written commitments without review.

Confidence is medium; enterprise customization, add-ons, geography, and authenticated flows were not normalized.

## Sources

- [Salesforce lead management](https://help.salesforce.com/s/articleView?id=sales.leads.htm&type=5) — official help, retrieved 2026-07-16.
- [HubSpot duplicate management](https://knowledge.hubspot.com/records/deduplication-of-records) — official help, retrieved 2026-07-16.
- [Zoho CRM duplicate records](https://help.zoho.com/portal/en/kb/crm/data-administration/duplicate-records/articles/check-duplicate-records) — official help, retrieved 2026-07-16.
- [Pipedrive pipeline](https://support.pipedrive.com/en/article/sales-pipeline) — official help, retrieved 2026-07-16.

