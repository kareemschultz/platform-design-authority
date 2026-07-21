---
document_id: PDA-CIR-066
title: Expense Management Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Expense Management Competitive Capability Matrix

## Scope

Expensify, Ramp, Brex, SAP Concur, and corporate-card expense patterns were reviewed from public documentation available 2026-07-16. Card issuing, reimbursement rails, tax deductibility, and country support were not assumed.

| Capability | Market pattern | Meridian implication |
|---|---|---|
| capture | mobile receipt, email, card feed, manual | preserve original, hash, source, currency, merchant and confidence |
| extraction | OCR/AI categorization | suggestions need provenance, diff, correction and deterministic entry |
| policy | limits, required fields, merchant/category rules | versioned policy evaluated at spend and submission where possible |
| approval | manager/accounting review and routing | explicit authority, delegation, SLA and segregation |
| cards | virtual/physical controls and matching | provider seam; no card credential storage or capability inference |
| reimbursement | batch/payment handoff | stable payable identity, idempotency and reconciliation |
| accounting export | categories, tax, dimensions, attachments | manifest, mapping version, hashes and exception queue |

## Decisions and confidence

Adopt early policy feedback, mobile capture, missing-receipt queues, and explainable suggestions. Reject AI auto-approval, mutable receipt evidence, reimbursement-as-paid without rail evidence, and manager visibility broader than purpose. Confidence is medium.

## Sources

- [Ramp expense management](https://support.ramp.com/hc/en-us/categories/360002063012-Expenses) — official help, retrieved 2026-07-16.
- [Expensify expenses](https://help.expensify.com/articles/new-expensify/expenses-and-payments/Expenses) — official help, retrieved 2026-07-16.
- [Brex expense management](https://www.brex.com/product/expense-management) — official product documentation, retrieved 2026-07-16.
- [SAP Concur Expense](https://www.concur.com/expense-management) — official product documentation, retrieved 2026-07-16.

