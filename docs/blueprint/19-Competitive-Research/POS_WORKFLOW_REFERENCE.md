---
document_id: PDA-CIR-038
title: POS Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0010, ADR-0017]
---

# POS Workflow Reference

## Scope and authority boundary

This reference synthesizes public POS flows through sale, recovery, and closeout. Canonical identifiers, permissions, events, and first-slice depth remain governed by existing Meridian authorities.

## Reference flow

1. **Open register:** authenticate, select tenant/location/device/register, verify opening float, and record custody.
2. **Build cart:** search or scan, resolve quantity/modifiers, show price and tax provenance, and require reasons for governed changes.
3. **Identify customer when needed:** link Party-derived presentation without making POS the Party authority.
4. **Tender:** create a stable sale/payment operation before provider interaction; distinguish cash, card, stored value, and split components.
5. **Complete or recover:** issue a receipt only from known business state. Pending, declined, unknown, and queued-offline are distinct.
6. **Correct:** return, exchange, void, and refund reference the original facts and create reversal or compensation.
7. **Close:** count cash, record drops, compare expected and actual, review variance, and hand off provider reconciliation separately.

## Exception matrix

| Exception | Required behavior |
|---|---|
| duplicate scan | reversible line edit with audit context |
| provider timeout | retain operation identity; query/reconcile before retry |
| partial approval | explicit remaining balance and permitted next tender |
| printer failure | sale remains complete; receipt delivery is recoverable |
| offline queue | bounded amount/time, signed device record, visible uncertainty |
| cash variance | reason, review threshold, and immutable count history |

## Adopt, improve, reject

- Adopt fast scan/search, linked history, explicit closeout, and recoverable receipts.
- Improve offline UX with certainty labels, deadlines, and a dedicated reconciliation queue.
- Reject deletion-based correction, implicit context switching, shared operator sessions, and retry that creates a new payment identity.

## Confidence, contradictions, and evidence needs

Confidence is medium. Vendor flows conflict across editions and processors; no cross-terminal parity is claimed. Prototype evidence is required for concurrent cart edits, terminal uncertainty, signed offline limits, split tender, and accessible keyboard/touch recovery.

## Sources

- [Toast payment processing overview](https://doc.toasttab.com/doc/platformguide/adminPaymentProcessingOverview.html) — official documentation, retrieved 2026-07-16.
- [Square refund payments](https://squareup.com/help/us/en/article/5060-refund-overview) — official help, retrieved 2026-07-16.
- [Shopify POS cash tracking](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/cash-register-management/cash-tracking) — official help, retrieved 2026-07-16.

