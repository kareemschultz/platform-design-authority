---
document_id: PDA-CIR-055
title: Field Service Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010]
---

# Field Service Workflow Reference

## Reference workflow

Create a service request and governed work order; match skill, territory, availability, parts, duration, and priority; propose/confirm appointment; dispatch with reasoned override; issue a bounded mobile work package; record travel/arrival/work only to policy; consume parts through Inventory commands; capture evidence and signature with consent; complete with exception review; hand billing or warranty outcomes to owning domains.

## Offline and correction

The mobile package declares expiry, device/operator, allowed commands, attachment limits, numbering, idempotency, tombstones, and merge policy. Late or conflicting status, part use, signature, and time records enter review. Corrections append reasoned facts; they do not rewrite payroll, inventory, billing, or audit history.

## Never copy

Do not copy continuous location surveillance by default, technician-shared sessions, offline “sync successful” without record-level outcome, signature without disclosure, or field-service ownership of customer identity and stock ledgers.

## Confidence and evidence

Medium-low. Required evidence includes route feasibility, rescheduling, expired lease, duplicate media upload, part substitution, privacy controls, accessible mobile forms, and deterministic AI-disabled dispatch.

## Sources

- [Dynamics 365 Field Service work orders](https://learn.microsoft.com/en-us/dynamics365/field-service/work-order) — official documentation, retrieved 2026-07-16.
- [Salesforce Field Service mobile](https://help.salesforce.com/s/articleView?id=service.mfs_overview.htm&type=5) — official help, retrieved 2026-07-16.

