---
document_id: PDA-IND-090
title: Guyana Retail Prototype Tax Pack
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Guyana Retail Prototype Tax Pack

## Purpose

Provide fixed, testable, explicitly non-statutory values for technical prototypes while authoritative Guyana tax, invoice, receipt, filing, and fiscal requirements continue through qualified verification.

This pack is **not legal or tax advice**, does not authorize production use, and must not be presented as certified compliance.

## Prototype Profile

- Jurisdiction code: `GY`
- Currency: `GYD`
- Prototype standard VAT rate: `14%`
- Prototype zero rate: `0%`
- Prototype exempt treatment: no output VAT, exemption reason required
- Prototype registration threshold reference: `GYD 15,000,000` in a rolling 12-month period
- Prototype return cadence reference: monthly
- Prototype return due reference: within 15 working days after the period
- Prototype records-retention reference: 6 years

These values reflect the dated evidence available on 2026-07-11 and must be reverified before pilot or production.

## Prototype Calculation Rules

### Exclusive Pricing

`tax = round(taxable_base × rate)`

`total = taxable_base + tax`

### Inclusive Pricing

`taxable_base = round(total ÷ (1 + rate))`

`tax = total - taxable_base`

### Rounding

- Calculate line-level tax using decimal arithmetic.
- Round monetary outputs to the currency minor-unit policy configured by the Money library.
- Preserve unrounded intermediate values for audit.
- Sum posted line taxes to the transaction tax total.
- Record any explicit rounding adjustment separately.
- Do not use binary floating point.

Until the GYD minor-unit policy is formally ratified, prototypes use two-decimal internal monetary precision and configurable receipt display. Cash rounding is disabled unless a named pilot requires and validates it.

## Prototype Tax Categories

- `GY_STANDARD_14`
- `GY_ZERO_RATED`
- `GY_EXEMPT`
- `GY_OUT_OF_SCOPE`

Every non-standard treatment requires a reason and source reference in test data.

## Prototype Tax Snapshot

A completed sale stores:

- Jurisdiction and profile version
- Legal entity and registration identifier where configured
- Line tax category
- Taxable base
- Rate
- Tax amount
- Inclusive or exclusive flag
- Rounding method and adjustment
- Currency
- Exemption or zero-rate reason
- Calculation timestamp
- Source rule identifier

The snapshot is immutable after sale completion and corrected through return, credit, or reversal behavior.

## Prototype Receipt Fields

The rendered prototype receipt includes:

- Seller legal or trading name
- Store name and address
- Tax registration identifier when configured
- Receipt number
- Date and local time
- Register and cashier reference
- Item description, quantity, unit price, discount, and line total
- Tax category, taxable subtotal, tax, and total
- Tender summary
- Change due where applicable
- Return or refund reference where applicable
- Offline or contingency marker when relevant
- Duplicate or reissue marker

These fields are a prototype completeness baseline, not a claim that the list exactly equals current mandatory Guyana invoice fields.

## Sequential Numbering

- Use the Platform Numbering service.
- Scope by tenant, legal entity, store, document type, and fiscal year where configured.
- Offline devices receive controlled ranges.
- Voids and gaps remain explainable.
- A duplicate reprint retains the original number and is marked as a copy.

## Fiscalization Position

No current Guyana real-time fiscalization or mandatory e-invoicing requirement is assumed by this pack. The Fiscalization Engine remains a future-jurisdiction and export-market seam.

## Test Examples

### Exclusive Standard Rate

- Net: GYD 1,000.00
- VAT 14%: GYD 140.00
- Total: GYD 1,140.00

### Inclusive Standard Rate

- Total: GYD 1,140.00
- Taxable base: GYD 1,000.00
- VAT: GYD 140.00

### Mixed Basket

- Standard-rated net: GYD 2,000.00
- Zero-rated net: GYD 500.00
- VAT: GYD 280.00
- Total: GYD 2,780.00

### Return

A full return reverses the original taxable base and VAT using the original profile version and line snapshot.

## Promotion Gates

Before pilot:

1. Verify rates, threshold, invoice fields, filing deadlines, retention, rounding, exemptions, and receipt rules through official GRA sources and qualified review.
2. Identify the pilot legal entity's registration status.
3. Replace prototype-only assumptions with effective-dated approved rules.
4. Run golden calculations and receipt examples with a qualified accountant or tax adviser.
5. Record discrepancies and migration behavior.

## Source References

Dated sources and limitations are maintained in `19-Appendices/GUYANA_REGULATORY_VERIFICATION-2026-07-11.md`.