---
document_id: PDA-CIR-047
title: Commerce and Payments Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0010, ADR-0017, ADR-0019, ADR-0025]
---

# Commerce and Payments Implementation Findings

## Supported findings

1. One durable operation identity must survive UI retry, adapter retry, webhook arrival, provider lookup, refund, and reconciliation.
2. Offline POS is a bounded risk policy, not a boolean feature.
3. Payment authorization, capture, terminal delivery, order completion, receipt delivery, settlement, and accounting are separate states.
4. Stored value needs an append-only value history and reservation semantics; it cannot reuse loyalty or payment-credential models.
5. Marketplace money movement is a separate gated operating model, not a normal extension of checkout.

These are research findings, not implementation evidence. First-slice deferrals remain unchanged.

## Proposed Governed Follow-Up Changes

| Affected authority | Exact issue and suggested change | Evidence/confidence | Urgency and review |
|---|---|---|---|
| Payment specifications and ADR-0017 | ensure a canonical unknown/needs-reconciliation state and retry/query decision table | Stripe/Adyen/Braintree docs; high | before provider prototype; PDA/security |
| Offline and POS specifications | define amount/time/device leases and operator-visible certainty labels | Square/Toast/Shopify docs; high | prototype | PDA/security/Finance |
| Commerce stored-value authority | define reserve/commit/release, correction, liability handoff, and expiry gate | gift-card docs; medium | before stored-value implementation | Finance/legal/security/founder |
| Developer Platform webhook contract | test signature rotation, replay, ordering, quarantine, and recovery | provider docs; high | first-slice seam | PDA/security |
| Founder Decision Register | retain explicit blocks for payment facilitation, custody, marketplace billing, and payouts | platform docs; high | gating | founder/legal/commercial |

## Required prototype evidence

- Timeout recovery without double charge.
- Split tender and partial refund across cash, card, and stored value.
- Signed offline record reconciliation and cashier-visible uncertainty.
- Terminal replacement/reconnect with stable payment identity.
- Settlement import with unmatched, duplicate, and late records.
- Accessible register open/close and exception review.

## Things Meridian must never copy

Do not copy silent retry, deletion-based financial correction, unscoped overrides, provider capability inference, direct business-domain webhook endpoints, hidden offline risk, or marketplace custody implied by a UI toggle.

## Confidence, contradictions, and revalidation

Confidence is high for the control implications and low for provider selection or regional feasibility. Revalidate at provider selection, certification, first production storefront scope, and any proposal involving seller funds.

## Sources

- [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests) — official, retrieved 2026-07-16.
- [Adyen webhooks](https://docs.adyen.com/development-resources/webhooks/) — official, retrieved 2026-07-16.
- [Square offline payments](https://squareup.com/help/us/en/article/7777-process-card-payments-with-offline-payments) — official, retrieved 2026-07-16.
