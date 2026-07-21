---
document_id: PDA-CIR-057
title: Rental and Booking Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Rental and Booking Workflow Reference

## Reference workflow

Search availability using resource, quantity, location, time, buffers, maintenance blocks, and permission-aware customer context. Create an expiring hold; quote price/policy/deposit with provenance; confirm through an idempotent command; prepare and record custody/condition; extend or reschedule with a visible diff; return and inspect; propose damage/late charges for authorized review; release resource and reconcile deposit/refund through owning domains.

## Failure and recovery

Concurrent holds require atomic allocation. Expired holds cannot be resurrected silently. Partial pickup/return keeps line-level custody. Offline check-out needs a bounded resource lease. Disputed damage preserves original media, inspection, reviewer, and decision. Cancellation compensates prior reservation and financial facts.

## Authority boundary and evidence

Party owns identity; Catalog describes rentable references; Inventory or the future governed rental authority owns availability/custody as decided; Payment and Finance retain their boundaries. This research does not create that ownership decision. Prototype holds, overlapping resources, offline custody, deposit classification, evidence privacy, and accessible rescheduling.

## Confidence

Medium for the workflow pattern, low for legal/deposit and vertical-specific depth.

## Sources

- [Odoo rental orders](https://www.odoo.com/documentation/19.0/applications/sales/rental.html) — official documentation, retrieved 2026-07-16.
- [Checkfront inventory](https://www.checkfront.com/features/inventory-management/) — official product documentation, retrieved 2026-07-16.

