---
document_id: PDA-DOM-009
title: Payroll Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Payroll Domain

## Purpose

Own gross-to-net calculation, payroll periods, earnings, deductions, taxes, benefits, employer costs, payment instructions, payslips, filings, and payroll audit.

## Core Capabilities

- Pay groups, calendars, frequencies, periods, and cutoffs
- Earnings, overtime, allowances, commissions, bonuses, and retroactive pay
- Deductions, benefits, garnishments, loans, and voluntary contributions
- Tax withholding, employer liabilities, statutory contributions, and jurisdiction packs
- Time and attendance import, validation, and exception handling
- Payroll calculation, preview, variance analysis, approval, finalization, and reversal
- Payment files, direct deposit, checks, cash, and failed-payment handling
- Payslips, year-end documents, filings, and statutory reports
- Off-cycle, supplemental, termination, and correction payrolls
- Payroll costing, accounting handoff, and reconciliation

## Authoritative Entities

Pay Group, Payroll Period, Pay Run, Payroll Result, Earning, Deduction, Tax Result, Employer Liability, Payment Instruction, Payslip, and Filing Obligation.

## Rules

- Finalized payroll results are ledger-like and corrected through reversal or adjustment.
- Every calculation records rule, rate, jurisdiction, input, rounding, and version provenance.
- Payroll preparation, approval, finalization, payment, and reconciliation support separation of duties.
- Sensitive payroll data requires strict field-level access and audit.
- Workforce supplies employment and time inputs; Payroll owns pay calculation.
- Finance owns accounting entries and bank reconciliation.
- AI may explain variances or prepare corrections but cannot finalize payroll without governed approval.

## Quality Requirements

- Historical recalculation and reproducibility
- Multi-jurisdiction effective dating
- Precision and rounding tests
- Variance thresholds and approval
- Secure payslip delivery
- Payment-file integrity and reconciliation
