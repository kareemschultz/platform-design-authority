---
document_id: PDA-CIR-043
title: Stored Value Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0017]
---

# Stored Value Competitive Capability Matrix

## Authority boundary

This matrix considers public gift-card and store-credit patterns from Shopify, Square, Toast, and major commerce/payment ecosystems. Commerce owns customer stored value. It is not a payment credential, loyalty account, bank deposit, or receivable. Provider gift-card services may be rails or integrations, not canonical authority.

| Capability | Observed market pattern | Risk | Meridian implication |
|---|---|---|---|
| issue/sell | code or account balance created from sale/admin grant | unearned liability ambiguity | record source, currency, owner/bearer rules, and liability handoff |
| reserve/redeem | checkout/POS applies partial or full balance | double spend and concurrency | atomic reservation/commit/release with idempotency |
| reload | supported selectively | fraud and tender laundering | explicit entitlement, tender policy, limits, and review |
| expiry | jurisdiction/product dependent | consumer-law and breakage risk | no default without qualified legal and accounting policy |
| transfer | uncommon or constrained | identity and fraud | deferred unless explicitly authorized and evidenced |
| correction | refund to card, gift card, or store credit varies | hidden value creation | reversal/compensation with original operation link |

## Adopt, improve, reject

Adopt visible balance history, partial redemption, and safe code handling. Improve with reservation semantics, cross-channel certainty, and liability reconciliation. Reject mutable balances without an append-only history, unscoped admin grants, default expiry, payment-credential treatment, and conflation with loyalty points.

## Confidence and limitations

Confidence is medium for documented consumer flows and low for accounting, breakage, transferability, fraud thresholds, and Guyana legal treatment. These require Finance, legal, security, and founder review.

## Sources

- [Shopify gift cards](https://help.shopify.com/en/manual/products/gift-card-products) — official help, retrieved 2026-07-16.
- [Square gift cards](https://squareup.com/help/us/en/article/6000-square-gift-cards) — official help, retrieved 2026-07-16.
- [Toast gift cards](https://doc.toasttab.com/doc/platformguide/adminGiftCards.html) — official documentation, retrieved 2026-07-16.

