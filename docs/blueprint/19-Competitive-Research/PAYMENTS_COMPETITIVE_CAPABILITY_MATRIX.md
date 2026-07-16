---
document_id: PDA-CIR-041
title: Payments Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0017, ADR-0025]
---

# Payments Competitive Capability Matrix

## Scope and boundary

Stripe, Adyen, PayPal/Braintree, Checkout.com, Square, and Clover were considered from public documentation as of 2026-07-16. Payment owns orchestration of provider rails; Finance owns accounting and reconciliation policy; Developer Platform owns external webhooks. Initial tenant payments remain direct tenant-provider contracts, with no custody or payment facilitation.

| Concern | Common documented pattern | Material variation | Meridian requirement |
|---|---|---|---|
| operation identity | payment intent/request/reference | lifecycle and object names differ | provider-neutral payment operation plus provider identifiers |
| authorize/capture | immediate or delayed capture | windows, partial/multiple capture | capability-negotiated commands; never infer support |
| void/refund | pre-settlement cancellation or post-settlement refund | timing, partial rules, fees | compensating facts and explicit unknown state |
| idempotency | keys or merchant references | retention and endpoint coverage | platform idempotency independent of provider guarantees |
| webhooks | signed asynchronous events | ordering, retry, event names | Developer Platform intake, verification, dedupe, replay evidence |
| settlement | reports, balance transactions, payout data | granularity and availability | Finance reconciliation contract with manifests and unmatched queue |
| terminal/offline | device and processor specific | limits, store-and-forward risk | explicit capability, lease, amount/time bound, and uncertainty |

## Decisions

Adopt stable operation identity, async reconciliation, capability discovery, signed webhook intake, and reasoned refunds. Improve with one uncertainty vocabulary and traceable cross-domain correlation. Reject lowest-common-denominator provider abstractions, SDK types in business contracts, guessed retry safety, pooled funds, or provider objects as Finance ledgers.

## Confidence and limitations

Confidence is high for documented API mechanics and low for Guyana availability, certification, local acquiring, terminal coverage, settlement files, and commercial terms. Those remain provider/founder/external gates.

## Sources

- [Stripe Payment Intents](https://docs.stripe.com/payments/payment-intents) — official developer documentation, retrieved 2026-07-16.
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) — official developer documentation, retrieved 2026-07-16.
- [Adyen capture](https://docs.adyen.com/online-payments/capture/) — official developer documentation, retrieved 2026-07-16.
- [Adyen webhooks](https://docs.adyen.com/development-resources/webhooks/) — official developer documentation, retrieved 2026-07-16.
- [Braintree transaction lifecycle](https://developer.paypal.com/braintree/docs/reference/general/statuses) — official developer documentation, retrieved 2026-07-16.

