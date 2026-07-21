---
document_id: PDA-CIR-036
title: Supply Chain Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Supply Chain Implementation Findings

## Findings

1. Catalog definitions, Inventory facts, Warehouse tasks, Procurement commitments, Manufacturing execution, Commerce demand, and Finance interpretation must remain separate owners connected by contracts.
2. Every quantity needs unit, location, owner, formula, and freshness; on hand, committed, available, in transit, quarantined, and projected are not synonyms.
3. Scanner speed must not bypass idempotency, expected version, authorization, or audit.
4. Partial, exception, uncertain, reversed, and reconciliation states are table stakes for real operations.
5. Inventory projections must rebuild from append-only movements and conserve under reversal.
6. Procurement receipt, Warehouse custody, Inventory movement, supplier return, payable match, and financial posting are separate consequences.
7. BOM/routing configuration is not shop-floor execution; plans are not authority.
8. Offline behavior must be command-specific and lease-bounded.
9. AI may suggest counts, replenishment, matches, or substitutions but essential flows remain deterministic and reviewable.
10. First-slice Catalog and Inventory depth must not absorb full WMS, Procurement, or Manufacturing scope.

## Proposed Governed Follow-Up Changes

| Authority | Issue | Suggested change | Evidence/confidence | Urgency/review |
|---|---|---|---|---|
| PDA-DOM-002 Product Catalog | Bundle/kit versus manufacturing BOM consequence needs explicit cross-reference | Clarify bundle inventory behavior contract and Manufacturing ownership | Cross-product evidence; Medium | Before bundle implementation; PDA review |
| PDA-DOM-003 Inventory | Availability formula/freshness presentation is not fully standardized | Add a governed projection metadata contract | Shopify/specialist evidence; Medium | Before omnichannel availability; PDA/UX review |
| PDA-DOM-004 Warehouse | Offline scan uncertainty and duplicate reconciliation need implementation detail | Define lease, device sequence, command whitelist, and conflict outcomes | WMS evidence; Medium | Before warehouse mobile prototype; security/offline review |
| PDA-DOM-005 Procurement | Receipt exceptions and Finance match handoff need exact owner contracts | Specify short/over/damage/return outcomes and evidence | Procurement sources; Medium | Before Procurement planning; Finance/PDA review |
| PDA-DOM-010 Manufacturing | Correction and substitution policies require explicit state models | Add linked reversal/compensation and alternative approval requirements | Manufacturing sources; Medium | Before Manufacturing prototype; PDA/quality review |
| First-slice manifest | Competitive breadth could be mistaken for scope | Retain full Catalog/Inventory only at declared depth; keep WMS/Manufacturing broader features deferred | Existing authority; High | Immediate documentation discipline |

No canonical capability, event, or permission identifier is created here.

## Required evidence

WS2 conservation/rebuild tests; barcode and unit collision fixtures; two-worker concurrency; count and transfer reversal; partial receipt and exception prototype; scan usability/accessibility; offline replay; manufacturing genealogy; and Finance reconciliation handoff.

## Confidence and revalidation

Confidence: High for existing Catalog/Inventory boundary reinforcement and Medium for future seams. Revalidate after WS2 closure, direct specialist-product tests, target-customer warehouse/manufacturing evidence, and any governed scope change.
