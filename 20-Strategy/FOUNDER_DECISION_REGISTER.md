---
document_id: PDA-STR-002
title: Founder Decision Register
version: 0.2.0
status: Draft
owner: Founder
last_reviewed: 2026-07-11
---

# Founder Decision Register

## Purpose

Record business decisions architecture cannot safely infer. Recommendations remain provisional until explicit founder ratification and required professional review.

## FDR-001 — Initial Tenant Payment Operating Model

**Status:** Open — recommended and provisionally adopted.

Recommended: direct tenant-provider merchant contracts under ADR-0015. The platform supplies software and adapters. Each tenant contracts directly with its bank, wallet, or acquiring provider. The platform does not initially pool, custody, settle tenant funds, act as payment facilitator, or act as merchant of record.

**Ratification required before:** production provider selection, contracts, or public payment-service claims.

## FDR-002 — Platform Operating Legal Entity

**Status:** Open — critical path.

Decide:

- Legal entity name and jurisdiction
- Source-code and trademark ownership
- Customer contracting and invoicing entity
- Tax registration and banking
- Staff and contractor engagement
- Data-controller and support obligations
- Caribbean and international expansion structure

**Block:** billing provider, marketplace paid phase, merchant-of-record, platform payout, and several provider contracts cannot be ratified before qualified legal and tax review.

## FDR-003 — Platform Billing and Settlement Currency

**Status:** Open with operating assumptions.

Known requirements:

- GYD is first-class.
- USD and additional currencies are supported.
- Tenant transactions may use multiple currencies and split tenders.

Decide platform invoice currencies, bank and settlement currencies, FX source, rounding, gains/losses, tax-invoice presentation, and refund policy.

## FDR-004 — First Retail Beachhead Scope

**Status:** Open — recommended and provisionally adopted.

Recommended first slice: POS, catalog, inventory, cash/register control, Party/customer basics, stored value, prototype tax pack, payment adapter seam, audit, entitlements, permissions, offline continuity, and Finance handoff.

The production native storefront, customer recurring agreements, memberships, advanced loyalty, full General Ledger, financial statements, self-checkout, and autonomous AI are outside the first slice.

**Ratification required before:** the first-slice package is marked In Review or implementation scope is contractually committed.

## FDR-005 — Repository Visibility and Documentation License

**Status:** Open — repository currently public.

Decide:

- Public thought leadership versus private competitive asset
- Paths safe for public disclosure
- Temporary reviewer access
- Documentation license
- Contribution policy
- Security and roadmap redaction

No secrets, customer identities, private premium-source code, license keys, or production security details may be committed regardless of visibility.

## FDR-006 — Platform Payment Terminal Strategy

**Status:** Open.

Decide whether the first paid pilot supports:

- Cash only plus wallet/request-to-pay
- Customer-owned standalone terminals with manual reference entry
- Semi-integrated terminals
- Fully integrated terminals
- No card-terminal commitment until a certified provider exists

Required evidence: named pilot need, provider support, certification, settlement, refund/reversal behavior, offline behavior, device support, cost, and legal review.

## FDR-007 — Initial Provider Coverage Beyond MMG

**Status:** Open.

Decide which provider categories are required before pilot:

- MMG or another wallet/request-to-pay provider
- Card/acquiring provider
- Bank transfer or payment-link provider
- Email and SMS providers
- Identity enterprise provider
- Tax or fiscal provider

A category may be represented by a simulator until the pilot requires production certification.

## FDR-008 — Marketplace Paid Phase

**Status:** Open; free-listings-first is recommended.

Decide whether and when the platform may bill for publisher listings or execute publisher payouts. Phase 3 requires the legal entity, tax model, contracting role, payout provider, accounting, refunds, chargebacks, reserves, sanctions, and regulatory review.

Until ratified, the marketplace supports private and free listings or direct publisher billing only.

## FDR-009 — Premium UI and Marketing Asset Governance

**Status:** Operating direction accepted; license scope verification remains required.

Direction:

- Tailwind and source-owned shadcn/ui form the web UI foundation.
- Magic UI Pro and shadcn/studio premium assets may accelerate marketing and selected product surfaces.
- Private credentials, license keys, and prohibited redistributable bundles remain outside the public repository.

Before implementation, confirm the purchasing person or entity, permitted products, seats, redistribution, and renewal terms.

## Governance

A decision closes only when:

1. Selected option, owner, effective date, and status are recorded.
2. Affected ADRs and specifications are updated.
3. Required legal, tax, regulatory, security, accounting, and commercial evidence is attached.
4. Contradictory assumptions are removed.
5. The decision is represented in implementation and customer claims.

Architecture documents reference this register rather than inventing business facts.
