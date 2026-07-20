---
document_id: PDA-CIR-033
title: Manufacturing Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Manufacturing Competitive Capability Matrix

## Scope and products

Research cutoff: 2026-07-16. Odoo 19, ERPNext, SAP Business One, NetSuite, Dynamics 365, Fishbowl Manufacturing, Katana, and MRPeasy represent modular, enterprise, and specialist segments. Public docs only; edition-specific planning, quality, maintenance, and costing were not uniformly accessible.

## Matrix

| Capability | Market baseline | Strong pattern | Integrity risk | Meridian disposition |
|---|---|---|---|---|
| Bill of materials | Versioned components, units, quantities, yield | Effective dates and alternate/substitute control | Catalog bundle confused with production BOM | Manufacturing owns BOM; Catalog references output |
| Routings/work centers | Ordered operations, capacity, calendars | Actual versus planned evidence | Configuration masquerades as execution | Separate definition, plan, and actual |
| Production order | Planned quantity, status, reservations | Material and output traceability | One-click completion hides partials | Explicit issue, consume, produce, close |
| Material issue | Lot/serial/unit and source location | Scan-confirmed consumption | Backflush without variance visibility | Backflush is policy, not universal truth |
| Yield/scrap | Good, scrap, rework, reason | Variance thresholds and approvals | Scrap edited away | Append movements and cost consequences |
| Substitution | Approved alternatives and effectivity | Shortage-driven proposal with approval | Operator silently swaps material | Explicit proposal and traceability |
| Costing | Standard/actual inputs and variance | Drill to material/labor/overhead evidence | Manufacturing owns GL | Finance owns accounting interpretation |
| Quality | Inspection plans, holds, nonconformance | Stop/release points | Passing status without evidence | Quality seam and governed disposition |
| Maintenance | Work-center/equipment availability | Capacity impact from maintenance | Manufacturing steals asset ownership | Assets/Maintenance owns equipment work |
| Planning | Demand, supply, capacity, recommendations | Explainable pegging and exceptions | Plan treated as current authority | Planning projections remain non-authoritative |
| Correction | Reopen, reverse, compensate, rework | Linked trace and conservation | Destructive finished order edit | Reversal/compensation required |

## Segmentation warning

Simple assembly, material planning, shop-floor execution, process manufacturing, and regulated manufacturing are not equivalent. Meridian must not infer global manufacturing completeness from a BOM and work-order demo.

## Sources, confidence, limits

High confidence for documented Odoo/ERPNext/SAP behaviors; Medium for synthesis; Low for specialist depth not directly tested. Sources: [Odoo manufacturing product setup](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/configure_manufacturing_product.html), [Odoo three-step manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html), [ERPNext manufacturing settings](https://docs.frappe.io/erpnext/manufacturing-settings), [SAP Business One production guide](https://help.sap.com/doc/10311afc90c643b3aaceeaa87a52bf5f/10.0/en-US/How_to_Work_with_Resources_and_Production_in_SAP_Business_One.pdf), and [Fishbowl manufacturing](https://www.fishbowlinventory.com/features/manufacturing), retrieved 2026-07-16.

