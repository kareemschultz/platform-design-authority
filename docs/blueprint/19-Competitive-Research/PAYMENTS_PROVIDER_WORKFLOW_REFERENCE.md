---
document_id: PDA-CIR-042
title: Payments Provider Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0017, ADR-0025]
---

# Payments Provider Workflow Reference

## Canonical workflow

1. Validate tenant, permission, entitlement, currency, amount, order/sale reference, and selected provider capability.
2. Persist one payment operation and idempotency identity before provider invocation.
3. Submit through an adapter with mapped provider request/reference; record sanitized evidence.
4. Classify response as authorized, captured, declined, cancelled, pending, or unknown—never flatten unknown to failure.
5. Accept signed provider callbacks through Developer Platform; deduplicate and correlate without trusting arrival order.
6. Capture, void, or refund only when the provider capability and present lifecycle allow it.
7. Reconcile operational state with settlement/report evidence; Finance owns accounting classification and exceptions.

## Retry and uncertainty rules

- Reuse the same platform operation and provider idempotency/reference where permitted.
- Query before retry after timeout whenever the provider exposes status lookup.
- Escalate unresolved amount/state/device combinations to a bounded review queue.
- Store no prohibited credentials; tokenize through selected provider contracts.
- Treat terminal state, network transport, payment authorization, and settlement as distinct.

## Rejected shortcuts

Do not accept provider success text as settlement, create a fresh operation on every retry, receive webhooks directly in a business domain, assume partial capture/refund parity, or embed provider names in canonical business event identifiers.

## Confidence and required evidence

Confidence is high for the control model, not for any unselected provider. Prototype and certification evidence are required for idempotency retention, timeout lookup, webhook signature/replay, terminal recovery, refunds, settlement ingestion, and regional availability.

## Sources

- [Stripe webhook handling](https://docs.stripe.com/webhooks) — official developer documentation, retrieved 2026-07-16.
- [Adyen refund](https://docs.adyen.com/online-payments/refund/) — official developer documentation, retrieved 2026-07-16.
- [Braintree webhooks](https://developer.paypal.com/braintree/docs/guides/webhooks/overview) — official developer documentation, retrieved 2026-07-16.

