---
document_id: PDA-COM-013
title: Cash Collection and Disbursement Boundaries
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0015, ADR-0017]
---

# Cash Collection and Disbursement Boundaries

## Purpose

Define cash collection, customer receivables, collection agents, deposits, supplier or customer disbursements, and the boundary among Commerce, Finance, Payment, Workforce, partners, and regulated providers.

## Cash Collection

Commerce owns operational cash receipt, register, shift, drawer, safe drop, deposit preparation, and customer receipt evidence.

Finance owns accounting interpretation, receivables application, bank reconciliation, deposit clearing, and cash-position reporting.

The Payment Engine does not own physical cash or tenant bank accounts.

## Customer Receivables

A future on-account sale requires:

- Commerce order or sale reference
- Finance-owned receivable and customer account
- Credit policy and limit
- Due date and collection status
- Payment application and adjustment
- Permissions, approvals, and audit
- Jurisdiction and consumer review

The first retail slice does not include a production customer-account tender.

## Collection Agents

A tenant may authorize an employee, contractor, partner, or field agent to collect cash only through an explicit tenant workflow.

Required controls:

- Canonical Party and role
- Tenant and location scope
- Collection assignment
- Receipt numbering
- Amount and currency limits
- Device and offline policy
- Custody transitions
- Deposit deadline
- Variance and loss handling
- Segregation of duties
- Audit and reconciliation

The platform does not become principal, custodian, or collection agent merely by recording a tenant's agent workflow.

## Disbursements

### Tenant Business Disbursement

Finance owns the payable, approved disbursement instruction, accounting, and reconciliation. Payment owns provider execution and provider evidence where an electronic rail is used.

Examples include supplier payment, customer refund, payroll disbursement, expense reimbursement, and intercompany transfer.

### Platform Commercial Disbursement

Commercial Control Plane owns the contractual earning or credit calculation. Finance owns platform accounting and reconciliation. Payment or an external payout provider executes approved movement.

Examples include partner commission and future marketplace publisher payout.

## Prohibited Assumptions

- The platform does not pool tenant cash or provider settlement.
- A software-recorded balance is not a bank account or regulated wallet.
- Partner or publisher earnings are not paid until execution and reconciliation confirm them.
- Tenant customer refunds are distinct from platform subscription refunds.
- Cash collection does not authorize lending or credit decisions.

## Events

- `commerce.deposit.prepared.v1`
- `commerce.deposit.reconciled.v1`
- `finance.receivable-payment.applied.v1`
- `finance.disbursement.approved.v1`
- `finance.disbursement.reconciled.v1`
- `payment.settlement.reconciled.v1`
- `commercial.partner-settlement.created.v1`

## Quality Gates

- Custody and legal-entity clarity
- Source-to-deposit reconciliation
- Receivable application tests
- Disbursement approval and segregation of duties
- Provider capability verification
- Direct tenant-provider boundary
- No pooled funds or hidden custody
- Customer, supplier, partner, and platform money contexts remain distinguishable
