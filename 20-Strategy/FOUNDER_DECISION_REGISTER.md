---
document_id: PDA-STR-002
title: Founder Decision Register
version: 0.1.0
status: Draft
owner: Founder
last_reviewed: 2026-07-10
---

# Founder Decision Register

## Purpose

Record business decisions that architecture cannot safely infer. Technical documents may recommend an option, but these decisions require explicit founder ratification because they affect legal structure, commercial risk, financing, launch scope, and customer promises.

## Decision FDR-001 — Initial Tenant Payment Operating Model

**Recommended and provisionally adopted:** direct tenant-merchant contracts, as proposed by ADR-0015.

The platform supplies payment software and adapters. Each tenant contracts directly with its bank, wallet, or acquiring provider. The platform does not initially pool, custody, or settle tenant funds and does not act as payment facilitator or merchant of record.

**Founder ratification required before:** selecting production payment providers or publishing payment-service claims.

## Decision FDR-002 — Platform Operating Legal Entity

**Status:** Open.

Current operating context is Guyana-first, with existing Guyana-based businesses and customers. The repository does not yet identify which legal entity will own the platform intellectual property, contract with SaaS customers, employ or engage staff, receive subscription revenue, contract with cloud and payment providers, or bear data-controller and support obligations.

Required founder inputs:

- Legal entity name and jurisdiction
- Ownership of source code and trademarks
- Contracting and invoicing entity
- Tax registration and banking arrangements
- Whether customer contracts may be signed by a current business or a new platform company
- Intended Caribbean or international expansion structure

**Block:** no billing-provider or merchant-of-record decision may be ratified until this is answered and reviewed by qualified legal and tax advisers.

## Decision FDR-003 — Platform Billing and Settlement Currency

**Status:** Open with operating assumptions.

Known product requirements:

- GYD is a first-class operational and reporting currency.
- USD and additional currencies must be supported.
- Tenant transactions may use multiple currencies and split tenders.

Still to decide:

- Currency in which the platform invoices Guyana customers
- Whether international customers are billed in USD or local currency
- Bank account and settlement currencies of the platform entity
- FX source, rounding, gains and losses, tax-invoice presentation, and refund policy

The product must not hardcode a single billing currency before this decision.

## Decision FDR-004 — First Retail Beachhead Scope

**Recommended and provisionally adopted:** the controlled first slice is POS, catalog, inventory, cash/register control, Party/customer basics, stored value, tax calculation seam, payment adapter seam, audit, entitlements, permissions, offline continuity, and financial handoff.

The native reference storefront is **not** required for the first operational pilot. The first slice may include connector contracts and an online-order ingestion stub, but not a full production storefront.

Tenant recurring commerce and memberships are **after** the first slice unless a verified collection rail and a named pilot customer require them.

**Founder ratification required before:** first-slice specifications are marked In Review.

## Decision FDR-005 — Repository Visibility

**Status:** Operational decision pending.

The repository was made public to support independent review. Before returning it to private or keeping it public, decide:

- Whether the blueprint is intended to become public thought leadership or an internal competitive asset
- Which security, commercial, and roadmap details are safe to disclose
- Whether external reviewers receive temporary access instead
- Licensing and contribution terms for public content

No secrets, customer identities, or production security details may be committed regardless of visibility.

## Governance

A founder decision is closed only when:

1. The selected option and effective date are recorded.
2. Affected ADRs and specifications are updated.
3. Legal, tax, regulatory, security, and commercial reviews are attached where required.
4. Contradictory assumptions are removed.

Architecture documents must reference this register rather than silently inventing business facts.