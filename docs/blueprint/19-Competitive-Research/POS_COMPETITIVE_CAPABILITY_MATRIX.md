---
document_id: PDA-CIR-037
title: POS Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0010, ADR-0017]
---

# POS Competitive Capability Matrix

## Purpose and boundary

This matrix compares documented point-of-sale behavior as of 2026-07-16. It informs, but does not amend, the Commerce, Inventory, Payment, Finance, Device, Audit, or Offline authorities. Consumer ecommerce checkout is excluded as POS evidence.

## Evidence method and access

Square, Toast, Shopify POS, and Lightspeed were assessed from public help documentation. Clover, Revel, and NCR were used only where public workflow evidence was accessible. No production merchant account or certified payment terminal was tested; plan, geography, hardware, and processor differences remain material.

| Capability | Square | Toast | Shopify POS | Lightspeed | Meridian implication |
|---|---|---|---|---|---|
| Register/session | shift and cash controls vary by product | restaurant closeout and cash drawer flows | tracking sessions and cash summaries | register open/close | explicit register lifecycle, operator, location, and device |
| Find/add items | search, favorites, barcode | menus, modifiers, barcode-dependent retail | search, smart grid, scan | search and scan | fast keyboard/touch/scan paths share one authoritative cart |
| Tender | cash, card, split and other tenders vary | cash, card, tips, split payments | cash, card, gift card and custom tenders by setup | cash/card/mixed workflows | tender availability is capability- and provider-derived, never assumed |
| Returns/refunds | linked and unlinked paths vary | refunds depend on order and settlement state | returns/exchanges have POS-specific constraints | sales history-driven | preserve original operation, reason, authorization, and compensating facts |
| Offline | offline payments have eligibility, limits, deadlines, and risk | offline mode queues operations with recovery constraints | offline behavior depends on connectivity and payment configuration | product/hardware specific | surface certainty and deadlines; never display queued as settled |
| Closeout | drawer reports and cash management | end-of-day and shift closeout | cash tracking summary | register closure and counts | expected versus counted, variance, safe drops, and approval are auditable |

## Strong, weak, and rejected patterns

Strong patterns are sales-history recovery, scan-first entry, explicit cash counts, and linked return context. Weak patterns include hidden offline eligibility, terminal-specific surprises, and destructive correction. Meridian should reject silent retry, generic “paid” states, broad manager overrides, and register navigation organized as an ERP module maze.

## Confidence and limitations

Confidence is medium for documented flows and low for cross-hardware parity. Pricing, processor eligibility, local tax, and offline thresholds are volatile and require implementation-time revalidation.

## Sources

- [Square offline payments](https://squareup.com/help/us/en/article/7777-process-card-payments-with-offline-payments) — official help, retrieved 2026-07-16.
- [Toast offline mode](https://doc.toasttab.com/doc/platformguide/adminOfflineModeOverview.html) — official documentation, retrieved 2026-07-16.
- [Shopify POS offline behavior](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/selling-offline) — official help, retrieved 2026-07-16.
- [Shopify POS exchanges](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/order-management/exchange-item) — official help, retrieved 2026-07-16.

