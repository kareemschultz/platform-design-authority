---
document_id: PDA-CIR-029
title: Catalog and Inventory Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Catalog and Inventory Competitive Capability Matrix

## Purpose, boundary, and cutoff

Compare catalog and inventory patterns as of 2026-07-16. Product Catalog owns definitions; Inventory owns stock facts and projections; Commerce owns sellable transaction context; Warehouse owns bin/task execution; Manufacturing owns bills of material and production. Research does not merge these owners or enlarge first-slice depth.

## Products and evidence access

Public official documentation was reviewed for Shopify Admin, Cin7 Core, Unleashed, Odoo 19, ERPNext, SAP Business One, NetSuite, and Dynamics 365 Supply Chain Management. Fishbowl, Katana, MRPeasy, and Zoho Inventory were retained as segment comparators where public documentation was thinner. Plan, add-on, geography, and integration availability vary; no authenticated workflow was tested.

## Capability matrix

| Area | Table stakes | Strong market pattern | Failure risk | Meridian disposition |
|---|---|---|---|---|
| Product/variant | Stable product with sellable variants | Variant options plus channel publication | One mutable record mixes definition, price, stock, and merchandising | Adopt typed ownership and lifecycle |
| SKU/barcode | Unique typed identifiers and exact lookup | Multiple aliases and scanner-first lookup | Treating all identifiers as interchangeable | Preserve typed identifiers and normalization policy |
| Units/packs | Explicit base and alternate units | Purchase/sale/warehouse packaging | Silent conversion and precision loss | Require unit and conversion provenance |
| Bundles/kits | Definition separated from stock effect | Assemble/disassemble or virtual bundles | Double-counting components and parents | Owner contract must declare inventory behavior |
| Media/content | Channel-ready descriptions and media | Publication workflows and localized content | Catalog media mistaken for inventory truth | Keep publication in Catalog |
| Bulk edit/import | Preview, validation, partial error report | Versioned templates and batch status | Irreversible mass change | Add scope preview, expected versions, reconciliation |
| On hand | Ledger-derived physical quantity | Location-level stock and movement history | Direct balance editing | Inventory ledger remains authoritative |
| Committed/available | Separate demand and projection concepts | Reservation-aware availability | UI quantity treated as current authority | Expose formula, freshness, and owner |
| Adjustments/counts | Reasoned, approved correction | Blind counts and variance workflow | Destructive correction or hidden negative stock | Reversal/adjustment with audit |
| Transfers | Dispatch, transit, partial receipt, exception | Shipment/receipt separation | One-step move hides custody and loss | Preserve transfer state and idempotency |
| Lots/serials/expiry | Traceability through movements | Scan capture and forward/back trace | Retrofitted trace IDs | Validate at owner command boundary |
| Valuation | Cost inputs and traceable recost | Landed-cost distribution and history | One global average generalized to all policies | Finance owns accounting interpretation |
| Rebuild/concurrency | Rebuildable projection and serialized posting | Movement history and immutable documents | Race-created oversell or drift | Lock by governed balance key and test conservation |

## Directly documented examples

Shopify documents inventory adjustments/history, transfers, purchase orders, and scanner receiving, but its ecommerce administration surface is not evidence of a manufacturing or warehouse ledger. Cin7 Core documents mobile WMS receiving, putaway, and transfers. Unleashed documents purchase receipt, immutable received cost inputs, recosting, batches/serials, and average landed cost. ERPNext documents stock-ledger entries per maintained item. Odoo documents lot/serial-aware manufacturing and staged stock movements.

## Never copy

Never copy a single quantity labelled stock without formula and freshness; direct balance edits; implicit unit conversion; untyped barcode fields; destructive posted movement edits; or ecommerce availability presented as proof of physical, warehouse, and manufacturing truth.

## Confidence and limitations

High confidence for cited documented features; Medium for table-stakes synthesis; Low for usability, latency, and concurrency behavior without reproduction. Revalidate after direct trials, provider/plan changes, WS2 prototype evidence, and any change to Catalog or Inventory contracts.

## Sources

- [Shopify inventory management](https://help.shopify.com/en/manual/products/inventory), retrieved 2026-07-16.
- [Shopify scanner transfers and receiving](https://help.shopify.com/en/manual/products/inventory/inventory-transfers/barcode-scanner), retrieved 2026-07-16.
- [Cin7 Core WMS](https://help.core.cin7.com/hc/en-us/articles/9034570508687-Using-the-Cin7-Core-Warehouse-Management-System-WMS), retrieved 2026-07-16.
- [Unleashed product records](https://support.unleashedsoftware.com/hc/en-us/articles/4402301062681-Create-Products) and [average landed cost](https://support.unleashedsoftware.com/hc/en-us/articles/6829971343129-Average-Landed-Costs), retrieved 2026-07-16.
- [ERPNext Item](https://docs.frappe.io/erpnext/item), retrieved 2026-07-16.

