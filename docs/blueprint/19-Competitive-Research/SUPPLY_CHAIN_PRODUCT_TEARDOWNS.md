---
document_id: PDA-CIR-035
title: Supply Chain Product Teardown Synthesis
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Supply Chain Product Teardown Synthesis

## Method

Original analysis of public official documentation at 2026-07-16. No screenshots, authenticated data, copied assets, or private architecture claims.

## Ecommerce administration: Shopify

Strong: approachable product/variant administration, multi-location quantities, adjustment history, purchase orders, transfers, scanner receiving, and connection to POS. Limit: the surface optimizes commerce administration; it does not by itself prove warehouse execution, manufacturing, cost-ledger, or offline inventory correctness. Adopt task clarity; reject using consumer availability as the entire inventory model.

## Inventory specialists: Cin7 Core and Unleashed

Strong: practical purchasing, receiving, warehouse/mobile scans, shipment, batches/serials, landed cost, and transaction history. Unleashed explicitly documents that received purchase orders cannot be deleted and later costs produce recosting. Cin7 documents authorized PO dependencies and WMS receive/putaway/transfer. Improve with clearer cross-domain authority and deterministic correction; validate real concurrency and offline behavior.

## Modular ERP: Odoo and ERPNext

Strong: integrated stock ledger, purchasing, BOM, production, lots/serials, work orders, and configuration. Risk: adjacent modules can encourage boundary shortcuts and configuration density. Meridian should reuse contracts and shared engines while retaining owners.

## Enterprise/mid-market suites: SAP, Dynamics, NetSuite

Strong: depth in company/location context, approvals, picking, supply planning, costing, and traceability. Risk: edition and implementation specificity. Meridian should use these as exception-taxonomy evidence, not first-slice feature counts.

## Manufacturing specialists: Fishbowl, Katana, MRPeasy

Strong research value: focused BOM/work-order/planning terminology and approachable operator workflows. Publicly accessible evidence was insufficient for uniform claims about reversal, concurrency, jurisdiction, and enterprise controls; confidence remains Low to Medium.

## Adopt/improve/reject

Adopt explicit partial states, scanner-first tasks, immutable posted evidence, and traceable cost inputs. Improve exception queues, correction, formula/freshness display, and offline uncertainty. Reject direct balance editing, silent substitutions, one-step transfers, universal backflush, and a single product record owning catalog, stock, supplier, price, and manufacturing truth.

## Sources

See PDA-CIR-029 through PDA-CIR-034. Confidence is Medium overall; usability and operational outcomes require direct testing.

