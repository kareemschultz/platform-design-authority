---
document_id: PDA-CIR-059
title: Customer and Service Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Customer and Service Implementation Findings

## Supported findings

1. Every customer-facing domain needs Party-safe linking and duplicate-candidate handling.
2. Workflow configuration needs versioning, transition rules, migration, and a complexity budget.
3. Views and inboxes are projections; they cannot steal record authority.
4. Mobile field work needs signed, expiring, idempotent, privacy-bounded work packages.
5. Booking/rental availability requires hold and concurrency semantics, not a calendar alone.

## Proposed Governed Follow-Up Changes

| Affected authority | Issue and suggested change | Evidence/confidence | Urgency/review |
|---|---|---|---|
| Party and domain-role contracts | define candidate/link/merge/recovery contract for domain records | CRM docs; high | before CRM depth; Party/PDA/privacy |
| UX workflow standards | define versioned state vocabulary, board/list parity, and automation preview | project tools; high | platform pattern | UX/accessibility/PDA |
| Service domain authority | specify case-to-domain-command boundaries and SLA clock policy | support suites; medium-high | before service implementation | domain/PDA/privacy |
| Offline/field-service authority | define work-package lease, media integrity, conflict, telemetry minimization | field-service docs; medium | prototype | security/privacy/PDA |
| Rental/booking ownership ADR or founder decision | availability, custody, deposits, and damage ownership is unresolved | rental docs; medium | before scope admission | founder/PDA/legal/Finance |

## Required evidence and rejected patterns

Prototype Party-safe lead conversion, mistaken merge recovery, accessible multi-view task editing, SLA pause/escalation, domain-command failure, offline field evidence, and concurrent reservation holds. Reject universal contact tables, comments as audit, silent automation, support-owned business facts, continuous worker tracking by default, and automatic damage charges.

## Confidence and revalidation

Confidence is medium. Field-service and rental evidence is less complete than CRM/projects/support due to inaccessible tenant workflows. Revalidate on scope admission, selected vertical, privacy policy, and jurisdiction.

## Sources

- [HubSpot deduplication](https://knowledge.hubspot.com/records/deduplication-of-records) — official, retrieved 2026-07-16.
- [Linear issue relations](https://linear.app/docs/issue-relations) — official, retrieved 2026-07-16.
- [Dynamics 365 Field Service overview](https://learn.microsoft.com/en-us/dynamics365/field-service/overview) — official, retrieved 2026-07-16.
