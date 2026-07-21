---
document_id: PDA-CIR-049
title: CRM Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# CRM Workflow Reference

## Reference flow

1. Capture a lead with source, consent/provenance, tenant, owner, and minimum data.
2. Search Party and domain-role candidates before creating or linking identity.
3. Qualify with explicit outcome; conversion creates or links governed role records without rewriting Party history.
4. Create an opportunity with pipeline version, stage, value/currency, owner, and next action.
5. Record activities as appropriately retained domain evidence or references to communications.
6. Advance, reopen, win, or lose with reason and history; no destructive stage replacement.
7. Hand off orders, agreements, service, or billing through explicit application contracts.

## Duplicate and correction workflow

Candidate detection is advisory. A reviewer sees matched fields, confidence/reason, conflicts, linked records, and downstream effects. Merge retains aliases/redirects and audit; a mistaken merge requires a governed recovery path rather than database surgery.

## Adopt, improve, reject

Adopt next-action visibility and concise stage views. Improve with Party-safe conversion, provenance, and deterministic fallback when scoring is unavailable. Reject implicit conversion, universal contact tables, hidden scoring, and automation that exceeds operator permission.

## Confidence and evidence needs

Medium. Prototype duplicate review, Party linkage, pipeline-version migration, communication privacy, accessible board/list parity, and offline activity capture before implementation claims.

## Sources

- [HubSpot lifecycle stages](https://knowledge.hubspot.com/records/use-lifecycle-stages) — official help, retrieved 2026-07-16.
- [Dynamics 365 qualify leads](https://learn.microsoft.com/en-us/dynamics365/sales/qualify-lead-convert-opportunity-sales) — official documentation, retrieved 2026-07-16.

