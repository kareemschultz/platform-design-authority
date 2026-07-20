---
document_id: PDA-CIR-034
title: Manufacturing Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Manufacturing Workflow Reference

## Plan-to-produce

1. Demand and planning projections propose a production requirement with freshness and assumptions.
2. Manufacturing selects an effective BOM and routing version for organization/location and date.
3. A production order records target quantity, unit, dates, work center, source, and expected version.
4. Inventory reservations are requested; shortages become proposals, not silent negative stock.
5. Release checks materials, capacity, quality gates, permissions, entitlements, and approvals.
6. Operators issue or consume materials with scan, lot/serial, unit, quantity, device, and time evidence.
7. Work operations record actual start/stop, labor or machine evidence, yield, scrap, rework, and exceptions.
8. Finished output is received through Inventory; traceability links input lots to output lots.
9. Close confirms remaining material, WIP, variances, quality disposition, and cost handoff.
10. Finance consumes governed facts; it does not read Manufacturing tables.

## Substitution and quality exception

An operator proposes a substitute against a shortage. The owner checks approved alternative, effectivity, quantity conversion, quality/regulatory restrictions, cost consequence, and approval policy. Acceptance updates only the order's authorized component plan and preserves the original requirement. A quality hold prevents release/consumption/shipment as configured and records a disposition; it is not a generic status toggle.

## Correction and reversal

Correct material issue with linked Inventory reversal; correct output with linked reversal and rework/scrap outcome; correct time through amended evidence; correct closed production through a governed reopen or compensation policy. Preserve original facts and downstream correlation. Never delete lots, movements, cost evidence, or audit.

## Offline and device behavior

Bound offline scope to released orders and assigned operations. Cache approved BOM/routing version and scan reference data. Reject expired leases and policy changes at reconciliation. Display local sequence, unsynced quantity, and conflicts. Essential execution must remain deterministic with AI disabled.

## Prototype evidence

Partial production, excess consumption, scrap, substitute approval, lot genealogy, two operators on the same order, equipment outage, offline duplicate, output reversal, closed-period financial handoff, and projection rebuild conservation.

## Sources and confidence

Confidence: Medium. [Odoo three-step manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html), [Odoo lot/serial and BOM setup](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/configure_manufacturing_product.html), and [ERPNext manufacturing settings](https://docs.frappe.io/erpnext/manufacturing-settings), retrieved 2026-07-16.

