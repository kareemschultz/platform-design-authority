---
document_id: PDA-CIR-062
title: Payroll Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Payroll Competitive Capability Matrix

## Scope and non-claim

ADP, UKG, Workday, SAP SuccessFactors, Gusto, Deel, and Rippling were reviewed for public workflow patterns through 2026-07-16. This document makes no claim of global or Guyana payroll completeness, certification, tax advice, or provider availability.

| Capability | Common pattern | Meridian requirement |
|---|---|---|
| inputs | worker, earnings, deductions, benefits, time, leave | source provenance, effective date, jurisdiction and cutoff |
| calculation | gross-to-net rules and statutory tables | versioned rule package with qualified authority and test fixtures |
| pre-payroll | validation, variance, exceptions, approval | explainable diffs and unresolved-blocker queue |
| finalization | lock/commit, payment and filing outputs | immutable run identity and balanced control totals |
| correction | off-cycle, reversal, adjustment, retro | compensate original facts and disclose downstream effects |
| statements | employee pay statement and history | privacy-safe, accessible, reproducible version |
| integration | time, HR, bank/payment, finance, government | explicit contracts, manifests, reconciliation and failure ownership |

## Rejected patterns and confidence

Reject a single mutable “current pay,” silent retro recalculation, floating-point money, provider UI as legal authority, and country support inferred from marketing. Confidence is high for control patterns, low for jurisdictional rule coverage.

## Sources

- [SAP SuccessFactors Employee Central Payroll](https://www.sap.com/products/hcm/employee-central-payroll.html) — official product documentation, retrieved 2026-07-16.
- [Workday payroll](https://www.workday.com/en-us/products/payroll-workforce-management/payroll.html) — official product documentation, retrieved 2026-07-16.
- [ADP payroll](https://www.adp.com/what-we-offer/payroll.aspx) — official product documentation, retrieved 2026-07-16.
- [UKG payroll](https://www.ukg.com/solutions/payroll) — official product documentation, retrieved 2026-07-16.

