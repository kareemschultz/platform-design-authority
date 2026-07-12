---
document_id: PDA-DOM-006
title: Finance Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0010, ADR-0013, ADR-0014]
---

# Finance Domain

The bounded first-slice export seam is governed by `docs/blueprint/04-Business-Domains/FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md`; it does not imply a complete General Ledger or financial-statement implementation.

## Purpose

Own accounting policy, financial ledgers, receivables, payables, cash, banking, expenses, assets, budgeting, consolidation, and financial reporting.

## Core Capabilities

- Chart of accounts, journals, periods, dimensions, and posting rules
- General ledger and subledger reconciliation
- Accounts receivable, invoices, credit notes, collections, and statements
- Accounts payable, bills, supplier credits, and payment runs
- Banking, cash management, bank feeds, deposits, and reconciliation
- Expenses, reimbursements, corporate cards, and approvals
- Fixed assets, depreciation, disposals, and asset accounting
- Budgets, forecasts, allocations, consolidation, and intercompany
- Tax accounting, audit support, close management, and financial statements
- Accounting and reconciliation of Commerce-owned stored-value liabilities
- Consumption of statutory submission results from Fiscalization

## Authoritative Entities

Ledger Entry, Journal, Account, Accounting Period, Receivable, Payable, Bank Account, Reconciliation, Expense, Budget, and Financial Statement Definition.

Finance does not own customer gift-card or store-credit instruments. Commerce owns their operational liability ledger under ADR-0013; Finance owns accounting interpretation, posting, reconciliation, breakage treatment, and financial presentation.

## Rules

- Posted financial entries are append-oriented and corrected through reversal or adjustment.
- Every posting records legal entity, currency, period, source, dimensions, and provenance.
- Period close and reopen require governed permissions and audit.
- Operational domains provide source events; Finance owns accounting interpretation and ledger posting.
- Segregation of duties applies to entry, approval, posting, payment, and reconciliation.
- Privacy transformation may remove or pseudonymize identity attributes without changing amounts, accounts, dates, tax, or economic meaning under ADR-0014.

## Statutory Boundary

- Tax Engine determines tax and produces calculation and return-data outputs.
- Finance records tax accounting, reconciles control accounts, and prepares financial evidence.
- Fiscalization owns jurisdiction-specific statutory document packaging, signing, submission, acknowledgements, rejections, and return-package transmission.

Finance may initiate a statutory workflow but does not duplicate Fiscalization's submission ledger.

## Shared Engines Used

Tax, Payments, Fiscalization, Workflow, Approvals, Documents, Rules, Reporting, Scheduling, and AI.
