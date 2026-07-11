---
document_id: PDA-DOM-011
title: Manufacturing Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Manufacturing Domain

## Purpose

Own production definitions, planning, execution, material consumption, output, quality, costing inputs, and manufacturing performance.

## Core Capabilities

- Bills of material, formulas, recipes, routings, operations, and work centers
- Production orders, work orders, batches, and process stages
- Material requirements planning and production scheduling hooks
- Material issue, backflush, scrap, rework, co-products, and by-products
- Labor, machine, setup, run-time, downtime, and capacity tracking
- Quality plans, inspections, nonconformance, corrective action, and release
- Subcontract manufacturing and outside processing
- Standard, actual, and variance costing inputs
- Lot, serial, genealogy, expiry, and recall traceability
- Manufacturing dashboards, OEE inputs, yield, waste, and throughput analysis

## Authoritative Entities

Bill of Material, Routing, Work Center, Production Order, Operation Execution, Material Consumption, Production Output, Quality Inspection, Nonconformance, and Manufacturing Specification.

## Boundaries

Product Catalog owns product definitions. Inventory owns stock ledgers. Warehouse owns physical material handling. Procurement owns external purchasing. Finance owns financial costing and posting. Manufacturing owns production intent and execution.

## Quality Requirements

- Versioned and effective-dated production definitions
- Genealogy and recall traceability
- Unit, yield, potency, and precision controls
- Offline shop-floor execution
- Separation of release, production, inspection, and disposition duties
- Rework and reversal integrity
