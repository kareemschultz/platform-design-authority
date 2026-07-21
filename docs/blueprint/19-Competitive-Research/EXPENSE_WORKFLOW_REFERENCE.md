---
document_id: PDA-CIR-067
title: Expense Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Expense Workflow Reference

## Reference workflow

Capture transaction or reimbursement claim; attach original receipt and extraction provenance; select business purpose, merchant, date/timezone, amount/currency, tax reference, project/cost dimensions, and participants; evaluate policy version; resolve duplicates/card matches; submit; route approval; create reimbursement or card-settlement handoff; export classified facts to Finance; reconcile and retain evidence.

## Exceptions and correction

Missing receipt, duplicate, personal spend, split allocation, cash expense, foreign exchange, disputed card transaction, rejected reimbursement, and post-approval correction are first-class states. Corrections preserve the approved version and create a reasoned adjustment/reversal. AI can suggest fields but cannot attest, approve, or create final Finance facts independently.

## Privacy and evidence

Receipts may reveal health, location, relationship, or card data. Apply field/attachment classification, redaction, purpose limitation, export controls, retention, and auditable access. Evidence is required for OCR correction, multi-currency precision, duplicate detection, offline capture, approval delegation, reimbursement uncertainty, and accessible receipt review.

## Confidence

Medium for workflow controls; low for tax and reimbursement policy by jurisdiction.

## Sources

- [Ramp receipt requirements](https://support.ramp.com/hc/en-us/articles/360042506754-Receipt-requirements) — official help, retrieved 2026-07-16.
- [Expensify SmartScan](https://help.expensify.com/articles/new-expensify/expenses-and-payments/SmartScan) — official help, retrieved 2026-07-16.

