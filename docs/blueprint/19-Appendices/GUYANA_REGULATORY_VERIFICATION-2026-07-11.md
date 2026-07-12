---
document_id: PDA-APP-012
title: Guyana Regulatory Verification 2026-07-11
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
verified_as_of: 2026-07-11
---

# Guyana Regulatory Verification — 2026-07-11

## Purpose

Record dated, source-qualified findings for the Guyana-first retail architecture. This document separates verified facts, source limitations, inferences, and questions requiring qualified professional advice.

It is not legal, tax, accounting, banking, privacy, or regulatory advice.

## Tax and VAT

### Verified from available GRA material

- Standard VAT rate reference: 14%.
- VAT registration threshold reference: GYD 15,000,000 in a rolling twelve-month period.
- VAT returns are generally monthly and due within the stated working-day deadline after the period.
- Business and tax records are subject to multi-year retention requirements; the architecture uses a six-year prototype reference pending final professional confirmation.
- Tax invoices require seller, registration, date, sequence, supply, amount, and tax information appropriate to the transaction.

### Architecture Consequence

The prototype tax pack fixes testable values, but production tax configuration remains blocked on legal-entity-specific verification, current official forms, invoice rules, exemptions, rounding, filing, and retention review.

### Sources

- Guyana Revenue Authority: `https://www.gra.gov.gy/`
- Dated prototype interpretation: `docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_PROTOTYPE_TAX_PACK.md`

## Data Protection

### Verified Position and Limitation

Guyana enacted the Data Protection Act 2023. At the audit date, no verified commencement order establishing full operative effect was located in the reviewed public sources. Public reporting indicates institutional implementation continued into 2026.

### Architecture Consequence

The platform should design to strong privacy-rights and data-governance standards now, but must not claim that every provision of the Act is currently in force without an authoritative commencement source and qualified legal confirmation.

### Required Follow-up

- Obtain the Act and any commencement orders from an authoritative legal source.
- Confirm regulator establishment, registration duties, cross-border transfer rules, breach notification, data-subject rights, exemptions, and enforcement dates.
- Review pilot contracts and controller/processor roles with Guyana counsel.

## Payments and Bank of Guyana

### Verified

- The National Payments System Act 2018 establishes the statutory payments framework.
- Bank of Guyana has published payment-service-provider guidance.
- Mobile Money Guyana has been publicly identified as a licensed payment service provider.

### Source Limitation

No reviewed public guidance conclusively resolves whether the planned software model would require licensing if it later pooled funds, onboarded sub-merchants, controlled settlement, acted as aggregator, or performed payment-facilitator functions.

### Architecture Consequence

ADR-0015 remains correct: tenants contract directly with providers first; the platform does not initially custody, pool, settle, or act as merchant of record or payment facilitator.

### Sources

- Bank of Guyana: `https://bankofguyana.org.gy/`
- MMG business and developer information: `https://mmg.gy/business/`, `https://mmg.gy/developer/`

## MMG Capability Status

### Publicly Verified

- Merchant payment capability
- Hosted or redirected e-commerce flow
- Merchant-initiated payment request capability
- Business and developer-facing materials

### Publicly Undocumented or Insufficiently Documented

- Automatic recurring debit
- Server-to-server webhook contract and retry semantics
- API refund and partial-refund behavior
- Reversal and dispute APIs
- Public sandbox terms
- Settlement service levels
- Production certification process

The Payment Engine must not infer these capabilities. A provider sandbox and signed capability matrix are required before pilot.

## Foreign Exchange and USD Settlement

### Verified Risk

Guyana foreign-exchange controls and bank practices changed materially in 2025. USD invoice verification, cash access, bank approval, and conversion assumptions can affect platform billing and tenant settlement.

### Architecture Consequence

- GYD remains the first operational currency.
- USD support remains explicit and configurable.
- The platform must not promise unrestricted USD collection or settlement.
- FDR-002 and FDR-003 remain blocking founder and professional decisions.

## Fiscalization and Electronic Invoicing

### Verified Position and Limitation

No authoritative reviewed source established a current Guyana-wide mandatory real-time fiscalization or structured e-invoicing regime comparable to jurisdictions with tax-authority clearance models.

### Architecture Consequence

The Fiscalization Engine remains justified for export markets, future jurisdictions, and future-proofing. The Guyana-first slice uses a seam and prototype contingency state, not a production local-mandate claim.

## NIS and Payroll Reference

Public NIS material provides contribution-rate and insurable-earnings references, but some published figures may not be current. Payroll is outside the first retail slice and requires a fresh jurisdiction pack, professional review, and effective-dated rules before implementation.

## Consumer and Electronic Transactions

Before pilot, qualified review must confirm:

- Consumer disclosure and refund obligations
- Electronic records and signatures
- Receipt and warranty requirements
- Gift card and store-credit rules
- Unclaimed property and expiry
- Distance selling and digital communications
- Accessibility and language obligations

## Required Professional Reviews Before Pilot

1. Guyana corporate and contracting counsel
2. Tax adviser or accountant
3. Payments and Bank of Guyana regulatory counsel
4. Privacy counsel
5. Banking and foreign-exchange review
6. Pilot-provider contract and sandbox certification

## Evidence Status

| Topic | Status |
|---|---|
| VAT prototype values | Verified enough for non-production prototype; reverify for pilot |
| Data Protection Act commencement | Unresolved authoritative commencement evidence |
| Direct tenant-provider model | Architecturally selected; legal review pending |
| MMG basic merchant/request-to-pay | Publicly supported |
| MMG recurring/refunds/webhooks/sandbox | Publicly undocumented |
| Guyana fiscalization mandate | No mandate verified |
| USD settlement | Material operational uncertainty |
| Payroll/NIS | Outside slice; stale-source risk |

## Reverification Trigger

Reverify immediately before any pilot contract, provider integration, customer-facing compliance claim, cross-border billing, stored-value launch, payroll work, or production jurisdiction-pack approval.
