---
document_id: PDA-CIR-064
title: Workforce and Scheduling Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Workforce and Scheduling Competitive Capability Matrix

## Scope

7shifts, Deputy, When I Work, UKG, Workday, and SAP SuccessFactors Time Tracking were assessed from public documentation through 2026-07-16.

| Capability | Strong pattern | Risk | Meridian implication |
|---|---|---|---|
| availability | worker-entered constraints and preferences | preference treated as entitlement | distinguish availability, preference, qualification and rule |
| scheduling | templates, demand, skills, labor targets | opaque optimization | explain constraint and preserve authorized human decision |
| open shifts/swaps | publish, claim, trade, manager approval | coverage/overtime breach | validate policy at proposal and approval |
| time/attendance | clock, break, edit, attest | surveillance and silent edits | device/location policy, reason, employee visibility and audit |
| leave | request, balance projection, approval | stale balance or payroll mismatch | effective-dated policy and payroll-impact handoff |
| notifications | publish/change/reminder | notification mistaken for acceptance | explicit acknowledgement and escalation |

## Decisions and limitations

Adopt constraint-visible scheduling, employee self-service, acknowledgement, and reasoned edits. Reject black-box scheduling, manager edits hidden from workers, unrestricted geolocation, and payroll results inferred from raw clock events. Confidence is medium; union, jurisdiction, and enterprise rules were not validated.

## Sources

- [7shifts scheduling](https://www.7shifts.com/employee-scheduling/) — official product documentation, retrieved 2026-07-16.
- [Deputy scheduling](https://www.deputy.com/features/employee-scheduling) — official product documentation, retrieved 2026-07-16.
- [When I Work scheduling](https://help.wheniwork.com/articles/create-a-schedule/) — official help, retrieved 2026-07-16.
- [SAP SuccessFactors Time Tracking](https://www.sap.com/products/hcm/time-tracking.html) — official product documentation, retrieved 2026-07-16.

