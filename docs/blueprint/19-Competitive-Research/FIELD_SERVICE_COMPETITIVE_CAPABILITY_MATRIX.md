---
document_id: PDA-CIR-054
title: Field Service Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010]
---

# Field Service Competitive Capability Matrix

## Scope and access

Jobber, Housecall Pro, Salesforce Field Service, Dynamics 365 Field Service, and publicly accessible ServiceTitan material were reviewed as of 2026-07-16. Authenticated dispatch and technician applications were not tested.

| Capability | Strong market pattern | Risk | Meridian implication |
|---|---|---|---|
| appointment/dispatch | calendar, map, skill/availability assignment | dispatcher override hides feasibility | show constraints, reason, travel, and ownership |
| technician mobile | job context, checklist, notes, media | stale/offline ambiguity | signed bounded package, freshness, sync and conflict state |
| parts | truck/warehouse stock and consumption | inventory shadow ledger | Inventory-owned commands and explicit transfer/issue |
| evidence | photos, signatures, readings | consent, tampering, retention | capture metadata, integrity, audience, and privacy policy |
| status | en route, arrived, working, complete | location surveillance and gaming | minimum necessary telemetry and auditable manual correction |
| billing handoff | estimate/invoice/payment links | service tool owns financial facts | explicit Commerce/Finance/Payment contracts |

## Decisions and limitations

Adopt constraint-visible dispatch and technician-centered offline capture. Reject hidden tracking, media without retention policy, inventory decrements in a service shadow table, and completion that silently posts financial facts. Confidence is medium-low due to limited tenant access and regional variability.

## Sources

- [Salesforce Field Service](https://www.salesforce.com/service/field-service-management/) — official product documentation, retrieved 2026-07-16.
- [Dynamics 365 Field Service overview](https://learn.microsoft.com/en-us/dynamics365/field-service/overview) — official documentation, retrieved 2026-07-16.
- [Jobber scheduling and dispatching](https://www.getjobber.com/features/scheduling-dispatching/) — official product documentation, retrieved 2026-07-16.
- [Housecall Pro scheduling](https://help.housecallpro.com/en/articles/2846381-scheduling-a-job) — official help, retrieved 2026-07-16.

