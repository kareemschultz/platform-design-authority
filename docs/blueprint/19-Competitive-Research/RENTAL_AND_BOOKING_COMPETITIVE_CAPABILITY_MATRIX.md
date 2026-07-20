---
document_id: PDA-CIR-056
title: Rental and Booking Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Rental and Booking Competitive Capability Matrix

## Scope

Public patterns from Booqable, Checkfront, FareHarbor, Odoo Rental, and mainstream appointment systems were reviewed as of 2026-07-16. Product depth and regional payment/deposit rules were not directly tested.

| Capability | Market pattern | Meridian implication |
|---|---|---|
| availability | resource, quantity, time window, buffers | reservation is a timed claim with concurrency control |
| booking | quote/hold/confirm | expose hold expiry, price, tax, and policy version |
| deposits | payment, authorization, or recorded security deposit | distinguish tender, liability, receivable, and authorization |
| pickup/checkout | identity, condition, accessories, signature | governed custody and evidence |
| return | condition, lateness, missing/damage assessment | append inspection and proposed charges; approval before posting |
| reschedule/cancel | policy-based fees and availability | show diff, require consent, compensate prior facts |

## Decisions and limitations

Adopt availability holds, policy-aware change previews, and condition evidence. Reject calendar-only availability, mutable condition notes, deposits conflated with revenue, and automatic damage charges without review. Confidence is medium-low; authenticated operations and jurisdictional contracts were inaccessible.

## Sources

- [Booqable inventory management](https://booqable.com/features/inventory-management/) — official product documentation, retrieved 2026-07-16.
- [Checkfront booking management](https://www.checkfront.com/features/booking-management/) — official product documentation, retrieved 2026-07-16.
- [Odoo Rental](https://www.odoo.com/documentation/19.0/applications/sales/rental.html) — official documentation, retrieved 2026-07-16.

