---
document_id: PDA-CIR-032
title: Procurement and Warehouse Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Procurement and Warehouse Workflow Reference

## Source-to-receipt sequence

1. A requester creates a requisition with organization, location, need date, item/service, unit, quantity, budget reference, and evidence.
2. Procurement routes approval and, when required, issues an RFQ without exposing restricted supplier responses.
3. Supplier quotations are recorded with currency, terms, validity, and access classification.
4. Award decision records criteria and approval; a purchase order is created as the commercial commitment.
5. Amendments preserve prior versions and reapproval rules.
6. Warehouse receives against expected shipments, scanning item, lot/serial, quantity, unit, condition, and source bin/dock.
7. Inventory appends receipt movements only for accepted quantities.
8. Short, over, damaged, substituted, or unknown items enter an owner-linked exception queue.
9. Putaway tasks move accepted custody to bins through confirmed Inventory movements.
10. Procurement updates remaining commitment; Finance receives matching evidence through contracts.

## Pick-pack-ship sequence

Demand is released by its owning domain. Warehouse plans work without owning the order. A wave/batch groups eligible tasks; assignment respects skills, zones, device, priority, and workload. Picker scans source, item, lot/serial, and quantity. Short pick and substitution require explicit owner policy. Packing records container and contents. Shipping records handoff, carrier reference, time, and evidence. Inventory movement occurs at the governed custody point, not merely when a UI task is opened.

## Offline boundary

Cache only assigned tasks, bounded reference data, and signed leases. Allow configured scans and observations; do not allow arbitrary supplier, PO, bin, or policy creation. Every offline command has device sequence and idempotency. Show Pending Sync, Accepted, Rejected, Conflict, and Needs Review. Never tell the operator that stock changed authoritatively before reconciliation.

## Correction

Wrong receipt, pick, pack, or shipment evidence is corrected by the owning workflow's reversal/compensation command. Financial credit, supplier return, physical movement, and order status are separate consequences coordinated by contracts; one negative row must not impersonate all four.

## Tests required

Partial and over receipt; duplicate scanner submission; PO amended during receipt; lot mismatch; damaged goods; short pick; substitution denial; offline duplicate after reconnect; two workers picking the last unit; shipment cancellation after manifest; supplier return and credit mismatch; and tenant/location switch mid-task.

## Confidence and sources

Confidence: Medium. Official sources establish workflows but not performance or operator success. See [Shopify linked PO and transfer](https://help.shopify.com/en/manual/products/inventory/purchase-orders/creating-inventory-transfers), [Unleashed partial receipt](https://support.unleashedsoftware.com/hc/en-us/articles/4402282913689-Receipt-Purchase), and [Cin7 Core WMS](https://help.core.cin7.com/hc/en-us/articles/9034570508687-Using-the-Cin7-Core-Warehouse-Management-System-WMS), retrieved 2026-07-16.

