---
document_id: PDA-CIR-044
title: Stored Value Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0017]
---

# Stored Value Workflow Reference

## Reference workflows

**Issue:** authorize source transaction or governed grant; create opaque instrument/account; append issue entry; notify without exposing a reusable secret; hand liability classification to Finance.

**Redeem:** resolve instrument securely; verify tenant/currency/status/limits; reserve amount; complete the Commerce sale; commit or release the reservation; append immutable ledger entry.

**Refund/reverse:** reference the original redemption or issue; select policy-authorized destination; compensate rather than rewrite; preserve reason, approver, and correlation.

**Expire/transfer/reload:** disabled unless entitlement, legal/accounting policy, fraud controls, and explicit workflow evidence exist.

## Failure handling

Concurrent redemption requires atomic control. Network uncertainty leaves an inspectable reservation, not a guessed balance. Lost code replacement invalidates the prior secret without deleting its ledger. Cross-channel projections disclose freshness. Manual adjustments require reason, permission, dual control where configured, and audit evidence.

## Implementation impact and evidence

No direct authority change is made. Prototype evidence is required for double-spend prevention, partial redemption, offline prohibition or bounded lease, refund destination, liability export, accessible balance history, and deletion/privacy treatment.

## Confidence

Medium for the workflow model; low for jurisdictional expiry, escheatment, breakage, and transfer rules.

## Sources

- [Shopify redeeming gift cards](https://help.shopify.com/en/manual/products/gift-card-products/redeem-gift-card) — official help, retrieved 2026-07-16.
- [Square gift-card refunds](https://squareup.com/help/us/en/article/5060-refund-overview) — official help, retrieved 2026-07-16.

