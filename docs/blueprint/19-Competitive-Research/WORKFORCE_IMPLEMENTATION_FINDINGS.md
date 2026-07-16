---
document_id: PDA-CIR-069
title: Workforce Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Workforce Implementation Findings

## Supported findings

1. Worker identity, authentication, HR role, employment, scheduling, payroll, and expense facts require separate owners and links.
2. Effective dating and reproducible snapshots are table stakes for workforce and payroll correction.
3. Payroll and expense finalization require immutable runs/approvals and compensating correction.
4. Workforce mobile features introduce privacy, surveillance, offline, and employee-visibility obligations.
5. AI can extract or suggest; it cannot supply legal completeness, attestation, approval, or final financial authority.

## Proposed Governed Follow-Up Changes

| Affected authority | Issue and suggested change | Evidence/confidence | Urgency/review |
|---|---|---|---|
| Party/HR boundary | define worker-role linkage and mistaken-link recovery | HR suites; high | before HR depth; Party/privacy/PDA |
| Payroll authority/ADR | require jurisdiction package, effective dating, snapshot, correction run and golden fixtures | payroll suites; high | before payroll prototype | qualified Guyana/Finance/legal/PDA |
| Workforce/offline/privacy | define clock evidence, lease, worker visibility and surveillance alternatives | scheduling tools; medium-high | before time capture | privacy/security/legal/PDA |
| Expense/Finance handoff | define evidence classification, approval version, reimbursement identity and export manifest | expense suites; high | before expense depth | Finance/privacy/security |
| Founder Decision Register | decide jurisdiction and provider scope before claiming payroll/benefit/card completeness | access gaps; high | gating | founder/legal/commercial |

## Required evidence and exclusions

Required: effective-date replay, retro payroll, golden gross-to-net, offboarding, overtime/DST, offline clock conflict, receipt sensitivity, reimbursement reconciliation, accessibility, tenant isolation, backup/restore, and penetration tests. Excluded: global payroll claim, unreviewed benefits, default biometric/geolocation surveillance, autonomous payroll/expense approval, and card issuing assumptions.

## Confidence and revalidation

High for control implications; low for country/provider completeness. Revalidate after qualified jurisdiction review and provider selection.

## Sources

- [SAP SuccessFactors payroll](https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL_PAYROLL) — official, retrieved 2026-07-16.
- [When I Work scheduling](https://help.wheniwork.com/articles/create-a-schedule/) — official, retrieved 2026-07-16.
- [Ramp expenses](https://support.ramp.com/hc/en-us/categories/360002063012-Expenses) — official, retrieved 2026-07-16.
