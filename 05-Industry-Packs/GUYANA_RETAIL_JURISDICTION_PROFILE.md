---
document_id: PDA-IND-018
title: Guyana Retail Jurisdiction Profile
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Guyana Retail Jurisdiction Profile

## Purpose

Define the jurisdiction-specific configuration, evidence, tests, and unresolved legal questions required for a Guyana-first retail pilot.

This profile is an architecture and implementation control document, not legal, tax, accounting, employment, or regulatory advice. No statutory behavior is Approved until verified against current official material and reviewed by qualified Guyana professionals.

## Geographic and Commercial Scope

Initial target:

- Guyana-based small and medium retailers
- Single and multi-location operations
- Cash-heavy and mixed-tender sales
- GYD as a first-class operational currency
- USD and additional currencies supported where the tenant lawfully transacts in them
- Intermittent connectivity and offline POS continuity

The platform must remain country-configurable and must not hardcode Guyana behavior into global domain models.

## Working Assumptions Requiring Verification

| Area | Working assumption | Status |
|---|---|---|
| Currency | GYD is the default operating currency for Guyana tenants | Product assumption |
| Multi-currency | USD may be encountered in pricing, payments, settlement, or reporting | Product assumption; legal/accounting treatment to verify |
| VAT | Standard VAT is commonly operated as 14% | Must be verified against current GRA law and guidance before implementation |
| PAYE | Employer withholding and periodic filing are required | Payroll profile verification required |
| NIS | Employer and employee contribution processing is required | NIS schedule and limits must be versioned from official sources |
| Payment providers | MMG and bank/card arrangements may be used through direct tenant contracts | Provider and legal due diligence required |
| Cash | Cash drawer, deposit, variance, and reconciliation are required | In first-slice scope |
| Fiscalization | No assumption that a fiscal device or real-time authority submission is legally required | Counsel and GRA verification required |
| Privacy | Personal-data rights and retention obligations require Guyana-specific analysis | Legal verification required |

A working assumption may guide prototypes but not production statutory output.

## Tax Configuration

The Guyana tax pack must define, from authoritative sources:

- Tax types and effective dates
- Standard, zero, exempt, and special-rate treatment
- Registration thresholds and taxpayer status
- Inclusive and exclusive pricing rules
- Tax invoice and receipt requirements
- Rounding
- Returns, credit notes, discounts, deposits, gift cards, and store credit
- Place-of-supply and non-resident scenarios where relevant
- Filing periods, deadlines, corrections, and evidence
- Currency and exchange-rate treatment

The Tax Engine calculates and preserves evidence. Fiscalization owns any statutory packaging or submission. Finance consumes approved tax output for accounting and returns.

## Retail Receipt and Fiscal Requirements

Before production, verify:

- Mandatory receipt fields
- Taxpayer and location registration identifiers
- Sequential numbering rules
- Whether cash registers, fiscal printers, certified devices, QR codes, or electronic reporting are required
- Cancellation, return, and credit-note procedures
- Offline or contingency requirements
- Record-retention periods

Until verified, the platform produces clearly labeled prototype receipts only.

## Payment and Tender Profile

### Cash

Required first-slice behavior:

- Opening float
- Cash sale and change
- Paid-in and paid-out
- Safe drop
- Refund and return
- End-of-shift count
- Expected-versus-counted variance
- Deposit preparation
- Deposit confirmation and bank reconciliation

### MMG and Wallets

Use direct tenant merchant contracts under ADR-0015. The adapter must declare whether it supports interactive checkout, request-to-pay, merchant-initiated payment, refund, reversal, recurring debit, settlement reporting, and sandbox testing.

No recurring auto-collection is assumed merely because a wallet supports merchant payment requests.

### Cards and Banks

Each tenant contracts directly with its acquiring bank or provider. The platform stores tenant-scoped credentials, orchestrates payment state, and reconciles settlement without pooling tenant funds.

### Split and Multi-Currency Tender

The POS architecture must support multiple tenders in one sale. Currency conversion, change, refund, and settlement require explicit tenant policy, approved FX source, rounding, and Finance treatment.

## Stored Value

Gift cards and store credit follow ADR-0013. Before production, verify consumer disclosure, expiry, dormancy, cash-out, abandoned-property, and tax treatment for Guyana.

## Party and Customer Data

- Anonymous cash sales should not require unnecessary customer identity.
- Registered customers use the Party model.
- Government identifiers and contact data are Restricted.
- Loyalty, warranty, credit, delivery, tax, and regulated-product workflows collect only necessary fields.
- Erasure and retention follow ADR-0014 and Guyana-specific legal review.

## Offline Profile

The retail slice must define:

- Offline sale limits
- Tender types allowed offline
- Stored-value reservation or allowance
- Receipt and numbering ranges
- Device and operator lease duration
- Tax and fiscal contingency behavior
- Reconnection deadline
- Duplicate and conflict resolution
- Privacy purge and device revocation

Offline capability does not imply offline legality for every tender or statutory document.

## Payroll and Workforce Seam

The first retail slice may capture workers, shifts, attendance, and payroll inputs, but production Guyana payroll requires a separate jurisdiction profile covering:

- PAYE bands, allowances, deductions, and remittance
- NIS contribution classes, ceilings, and deadlines
- Overtime, leave, termination, benefits, and statutory reports
- Effective dating and historical recalculation

No rates belong in source code; all rules are versioned jurisdiction data.

## Required Authoritative Research

Before status can move to In Review:

1. Current GRA tax legislation and published guidance
2. Current NIS contribution schedules and employer guidance
3. Bank of Guyana national-payment-system, licensing, and AML/CFT material
4. Provider contracts and technical documentation for MMG, banks, cards, and other rails
5. Consumer-protection, electronic-transactions, privacy, employment, and record-retention requirements
6. Receipt, invoice, and fiscal-device requirements
7. Qualified legal and tax review

The Bank of Guyana public website was under maintenance during the July 2026 research pass. This is a research limitation, not evidence that regulation is absent.

## First-Slice Test Matrix

- GYD cash sale and receipt
- Mixed cash and electronic tender
- Cash variance and deposit
- VAT-inclusive and VAT-exclusive prototype cases
- Tax-exempt or zero-rated product configuration seam
- Return and refund to original tender or store credit
- Offline sale and reconnect
- Stored-value issue and redemption
- Multi-location numbering
- Tenant and legal-entity isolation
- Export for accountant review
- Backup restore and privacy transformation reapplication

## Approval Gate

This profile remains Draft until each statutory claim is supported by a dated authoritative source, a responsible reviewer, test cases, and an effective-date policy.