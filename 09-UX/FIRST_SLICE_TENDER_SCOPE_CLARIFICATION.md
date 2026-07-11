---
document_id: PDA-UX-027
title: First Slice Tender Scope Clarification
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0015, ADR-0017]
---

# First Slice Tender Scope Clarification

## Purpose

Clarify and supersede the provisional tender list in `FIRST_SLICE_UX_AND_ACCESSIBILITY.md` where it includes “Customer account, when entitled.”

## Decision

The Guyana Retail Foundation Slice supports:

- Cash
- Certified card, bank, wallet, or request-to-pay provider seams when available
- Commerce-owned stored value
- Split tender among enabled and compatible rails

It does **not** include production customer-account or on-account sales.

## Reason

Customer-account tender requires capabilities outside the bounded slice:

- Finance-owned receivable
- Credit policy and limit
- Due date and aging
- Collection workflow
- Payment application
- Bad-debt and adjustment handling
- Customer statements
- Jurisdiction and consumer-credit review
- Stronger permissions and reporting

The future capability is registered as `commerce.customer-account-sales` and explicitly deferred in `registry/first-slice.json`.

## UX Rule

The POS must not display customer-account tender merely because a tenant has a broad Commerce or Finance entitlement. It appears only after the future capability, contracts, permissions, workflows, and legal review are approved.

## Acceptance Test

For the first slice, API, UI, role, entitlement, search, command palette, offline policy, and training fixtures contain no executable customer-account tender path.
