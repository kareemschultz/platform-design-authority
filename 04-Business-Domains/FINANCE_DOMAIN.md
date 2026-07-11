---
document_id: PDA-DOM-006
title: Finance Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Finance Domain

## Purpose

Own accounting policy, financial ledgers, receivables, payables, cash, banking, expenses, assets, budgeting, consolidation, and financial reporting.

## Core Capabilities

- Chart of accounts, journals, periods, dimensions, and posting rules
- General ledger and subledger reconciliation
- Accounts receivable, invoices, credit notes, collections, and statements
- Accounts payable, bills, supplier credits, and payment runs
- Banking, cash management, bank feeds, and reconciliation
- Expenses, reimbursements, corporate cards, and approvals
- Fixed assets, depreciation, disposals, and asset accounting
- Budgets, forecasts, allocations, consolidation, and intercompany
- Tax reporting, audit support, close management, and statutory outputs

## Authoritative Entities

Ledger Entry, Journal, Account, Accounting Period, Receivable, Payable, Bank Account, Reconciliation, Expense, Budget, and Financial Statement Definition.

## Rules

- Posted financial entries are append-oriented and corrected through reversal or adjustment.
- Every posting records legal entity, currency, period, source, dimensions, and provenance.
- Period close and reopen require governed permissions and audit.
- Operational domains provide source events; Finance owns accounting interpretation and ledger posting.
- Segregation of duties applies to entry, approval, posting, payment, and reconciliation.

## Shared Engines Used

Tax, Payments, Workflow, Approvals, Documents, Rules, Reporting, Scheduling, and AI.
