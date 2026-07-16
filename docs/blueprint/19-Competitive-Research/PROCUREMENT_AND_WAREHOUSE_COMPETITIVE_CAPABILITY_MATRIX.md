---
document_id: PDA-CIR-031
title: Procurement and Warehouse Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Procurement and Warehouse Competitive Capability Matrix

## Boundary and sample

Procurement owns requisitions, sourcing, suppliers, purchase commitments, and commercial receipt expectations. Warehouse owns physical receiving, putaway, picking, packing, shipping, bins, zones, and tasks. Inventory owns movements and balances. Finance owns payables, matching policy, and accounting. Research cutoff is 2026-07-16; products include Cin7 Core, Unleashed, Odoo, ERPNext, NetSuite, Dynamics 365, SAP, and specialist inventory/WMS products.

## Matrix

| Workflow | Table stakes | Strong pattern | Weak pattern | Meridian implication |
|---|---|---|---|---|
| Requisition/RFQ | Need, requester, budget/approval, supplier responses | Separate request from commitment | Email-only sourcing and lost rationale | Versioned proposal and award evidence |
| Purchase order | Supplier, lines, units, price, dates, terms, approval | Amendment history and remaining quantity | Editing approved PO without consequence | Explicit amend/cancel states |
| Receipt | Full/partial/over/under and condition | Commercial PO separate from physical receipt | Receipt directly closes every line | Warehouse evidence; Procurement accepts exception |
| Supplier return | Reason, custody, authorization, credit expectation | Link return to receipt/lot | Negative receipt as shortcut | Explicit return and reversal events |
| Invoice match | PO/receipt/invoice tolerances | Exception queue with evidence | Warehouse or Procurement owns payable | Finance owns accounting/match decision |
| Landed cost | Allocable charges and basis | Trace distribution and recost | Hidden retroactive valuation | Inventory inputs plus Finance interpretation |
| Putaway | Bin/zone rules and task | Scan-confirmed source/destination | Auto-complete without physical evidence | Task does not equal movement until confirmed |
| Pick/pack/ship | Wave/batch, assignment, exceptions | Separate picked, packed, shipped evidence | One status hides shortages/substitutions | Explicit custody and exception transitions |
| Mobile/offline | Scanner task cache and reconciliation | Bounded offline queue | Pretend full warehouse works offline | Declare supported commands and uncertainty |

## Customer pain hypotheses

Public docs repeatedly devote space to partial receipt, recosting, undo constraints, authorization, and mobile exceptions, indicating operational complexity. This does not establish prevalence. Meridian should prototype exception clarity, scan recovery, and remaining-quantity visibility before claiming improvement.

## Sources and confidence

High confidence for documented functions and Medium for synthesis. [Unleashed purchases overview](https://support.unleashedsoftware.com/hc/en-us/articles/4402274936857-Purchases-Module-Overview), [Unleashed purchase orders](https://support.unleashedsoftware.com/hc/en-us/articles/4402274942745-Add-a-Purchase-Order), [Cin7 Core WMS](https://help.core.cin7.com/hc/en-us/articles/9034570508687-Using-the-Cin7-Core-Warehouse-Management-System-WMS), [NetSuite multi-subsidiary vendor transactions](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1509453911.html), and [SAP Business One pick and pack](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/ed178f7fb00848bc854cd1f92f621adc.html), retrieved 2026-07-16.

