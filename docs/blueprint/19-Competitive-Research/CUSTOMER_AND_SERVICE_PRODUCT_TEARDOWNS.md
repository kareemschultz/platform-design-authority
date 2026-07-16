---
document_id: PDA-CIR-058
title: Customer and Service Product Teardowns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Customer and Service Product Teardowns

## Method

Public official sources were reviewed through 2026-07-16. Findings describe documented behavior, not private architecture, prevalence, or complete product parity.

## Synthesis by product family

**Salesforce, Dynamics, HubSpot, Zoho, Pipedrive:** configurable pipeline and relationship timelines are powerful, but duplicate identities and customization can make authority unclear. Meridian should preserve Party linkage, provenance, and a smaller governed workflow vocabulary.

**Linear, Jira, Asana, Monday, ClickUp, Notion:** fast capture, saved views, dependencies, and keyboard interaction are reusable. Status/custom-field sprawl, board-only accessibility, and automation surprise are patterns to reject.

**ServiceNow, Zendesk, Freshdesk, Intercom:** queues, SLAs, routing, knowledge, and cross-channel context are table stakes. A support case must request domain commands rather than claim ownership of the underlying order, payment, or customer fact.

**Jobber, Housecall Pro, Salesforce/Dynamics Field Service:** dispatch and technician workflows demonstrate the need for bounded mobile work packages, evidence policy, and inventory seams. Tenant access limitations reduce confidence.

**Booqable, Checkfront, Odoo Rental:** availability holds and condition evidence are strong; deposits and damage create unresolved legal/accounting boundaries.

## Cross-product failure patterns

Duplicate people, excessive configuration, ambiguous ownership, hidden automation, status inflation, stale mobile context, noisy activity feeds, and irreversible merges recur. These are candidate research findings, not claims of universal prevalence.

## Sources

- [HubSpot CRM records](https://knowledge.hubspot.com/records) — official help, retrieved 2026-07-16.
- [Linear documentation](https://linear.app/docs) — official documentation, retrieved 2026-07-16.
- [Zendesk documentation](https://support.zendesk.com/hc/en-us) — official help, retrieved 2026-07-16.
- [Dynamics 365 Field Service](https://learn.microsoft.com/en-us/dynamics365/field-service/) — official documentation, retrieved 2026-07-16.

