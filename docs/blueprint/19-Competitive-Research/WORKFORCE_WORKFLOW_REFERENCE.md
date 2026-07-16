---
document_id: PDA-CIR-065
title: Workforce Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Workforce Workflow Reference

## Scheduling workflow

Load effective-dated worker role, qualifications, location, availability, approved leave, policy, demand, and existing commitments. Generate a draft with explainable conflicts; an authorized scheduler reviews and publishes a version. Workers acknowledge, decline where policy permits, or request swaps. Every accepted change creates a new schedule fact and recalculates rule impacts.

## Time workflow

Clock events bind worker, tenant/location, device/source, timezone, local legal date, and confidence. Missing/duplicate/out-of-bound events enter review. Edits preserve original, reason, actor, employee acknowledgement where required, and downstream payroll handoff version.

## Offline, privacy, and correction

Offline clocking requires signed, bounded device policy, idempotency, visible sync status, and conflict review. Geolocation, biometrics, and surveillance are disabled unless a qualified authority approves purpose, minimization, retention, access, and alternatives. Payroll-impacting corrections compensate downstream facts.

## Confidence and evidence

Medium. Prototype DST/timezone, overnight shifts, swaps, overtime conflicts, offline duplicate clock, schedule acknowledgement, privacy alternatives, and accessible mobile/desktop parity.

## Sources

- [When I Work shift trades](https://help.wheniwork.com/articles/trade-and-drop-shifts/) — official help, retrieved 2026-07-16.
- [Deputy timesheets](https://help.deputy.com/hc/en-au/categories/4698041987855-Timesheets) — official help, retrieved 2026-07-16.

