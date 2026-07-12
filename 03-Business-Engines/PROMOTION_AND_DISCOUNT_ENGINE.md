---
document_id: PDA-ENG-009
title: Promotion and Discount Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Promotion and Discount Engine

## Purpose

Provide consistent qualification, calculation, stacking, redemption, funding, and audit behavior for promotions and discounts across sales channels.

## Core Capabilities

- Percentage, fixed, bundle, buy-get, threshold, coupon, employee, loyalty, and negotiated discounts
- Product, category, customer, channel, location, time, quantity, and tender conditions
- Stacking, exclusivity, priority, caps, budgets, and usage limits
- Coupon and promotion-code lifecycle
- Vendor-funded and shared-funded promotions
- Simulation and expected-margin impact

## Rules

1. Every applied adjustment must record promotion, rule version, qualification, funding, and calculation provenance.
2. Pricing establishes a price; promotions adjust it through explicit composition rules.
3. Stacking and exclusivity must be deterministic.
4. Manual discounts require permissions, limits, reason, and audit.
5. Refunds and returns must reverse or prorate promotional value consistently.
6. Offline redemption uses signed snapshots and reconciles duplicate or exhausted usage.
7. Promotion abuse controls must support per-customer, device, order, location, and period limits.

## Quality Gates

- Stacking and priority tests
- Return and proration tests
- Coupon concurrency tests
- Offline redemption tests
- Margin-protection and approval tests
- Cross-channel consistency tests
