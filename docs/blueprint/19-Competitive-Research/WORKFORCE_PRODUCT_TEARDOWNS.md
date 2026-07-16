---
document_id: PDA-CIR-068
title: Workforce Product Teardowns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Workforce Product Teardowns

## Method and access

Official public documentation was reviewed through 2026-07-16. No payroll production account, statutory filing, benefit enrollment, card account, or authenticated enterprise configuration was tested.

## Product-family synthesis

**Rippling, BambooHR, HiBob, Personio:** employee lifecycle and self-service demonstrate value in effective-dated worker facts and staged onboarding. Suite breadth can blur identity, device, permission, payroll, and benefits ownership.

**Workday, SAP SuccessFactors, ADP, UKG:** configurable enterprise HR/payroll controls show the need for rule versions, approval, retroactivity, and integration governance. Depth also creates implementation and consultant dependency; Meridian should not copy configuration breadth without validated need.

**Deel and Gusto:** accessible payroll/employment experiences are useful patterns, but marketed country coverage cannot substitute for qualified jurisdictional evidence.

**7shifts, Deputy, When I Work:** scheduling, swaps, acknowledgement, and mobile time are strong; surveillance, offline certainty, and payroll handoff need explicit controls.

**Ramp, Brex, Expensify, Concur:** mobile receipt capture and policy-at-spend reduce friction. AI extraction and card integrations remain suggestions/seams requiring provenance and reconciliation.

## Repeated failures

Current-state overwrite, hidden retro impact, excessive sensitive-data access, unexplainable scheduling, manager edits without worker visibility, and payroll/expense status disconnected from settlement recur as risks. Prevalence is not claimed.

## Sources

- [Workday HCM](https://www.workday.com/en-us/products/human-capital-management/overview.html) — official, retrieved 2026-07-16.
- [SAP SuccessFactors](https://www.sap.com/products/hcm.html) — official, retrieved 2026-07-16.
- [Deputy](https://www.deputy.com/) — official, retrieved 2026-07-16.
- [Ramp expenses](https://support.ramp.com/hc/en-us/categories/360002063012-Expenses) — official, retrieved 2026-07-16.

