---
document_id: PDA-CIR-063
title: Payroll Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Payroll Workflow Reference

## Reference workflow

Select tenant, legal employer, jurisdiction, pay group, period, cutoff, currency, and rule-package version. Freeze a reproducible input snapshot; validate missing, duplicate, late, and outlier inputs; calculate deterministically; review employee and aggregate diffs; approve with separation of duties; finalize immutable results; create payment/filing/Finance handoffs with manifests and hashes; reconcile; publish accessible statements.

## Corrections

Late time, retroactive pay, benefit changes, reversals, failed disbursement, and filing corrections create linked adjustment runs or compensating entries. They never overwrite a finalized payroll run. The worker receives a clear explanation and corrected statement subject to legal policy.

## Disabled and degraded states

Payroll must remain deterministic with AI disabled. Provider or bank failure leaves explicit handoff status and review ownership. Offline payroll finalization is prohibited unless a future authority explicitly proves it safe.

## Confidence and required evidence

High for control design, low for jurisdiction implementation. Evidence requires qualified Guyana payroll review, golden calculations, statutory filing formats, privacy/penetration tests, dual control, reconciliation, backup/restore, and correction exercises.

## Sources

- [SAP SuccessFactors payroll](https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL_PAYROLL) — official documentation, retrieved 2026-07-16.
- [Workday payroll](https://www.workday.com/en-us/products/payroll-workforce-management/payroll.html) — official product documentation, retrieved 2026-07-16.

