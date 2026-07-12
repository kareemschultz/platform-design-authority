---
document_id: PDA-COM-006
title: Platform Subscription Lifecycle
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0016]
---

# Platform Subscription Lifecycle

## Purpose

Define the platform's own commercial and runtime states from prospect through activation, renewal, change, suspension, cancellation, retention, export, and reactivation.

This document governs SaaS subscriptions sold by the platform. Tenant businesses selling memberships, retainers, or recurring services use Commerce Recurring Agreements and must not reuse this entity model without qualification.

## States

- Prospect
- Quote or Checkout Pending
- Trial
- Pending Activation
- Active
- Change Scheduled
- Grace
- Past Due
- Suspended
- Read Only
- Cancellation Scheduled
- Cancelled
- Retention
- Export Pending
- Archived
- Reactivated

## Rules

1. Platform Subscription, invoice, payment, and entitlement states remain distinct.
2. State transitions are event-driven, idempotent, auditable, and reversible where practical.
3. Grace and suspension policies vary by offer, risk, jurisdiction, and customer contract.
4. Suspension should preserve administrative access, billing access, export rights, and support contact unless law or security requires otherwise.
5. Cancellation defines final billing, entitlement end, data retention, automations, integrations, devices, and marketplace items.
6. Reactivation restores access safely without duplicating historical billing or usage.
7. Annual commitments, minimum terms, renewals, and notice windows require effective-dated schedules.

## Dunning

Dunning supports payment retries, notifications, payment-method update, grace periods, collections escalation, sales or partner intervention, and eventual suspension. Customer communication clearly distinguishes a payment problem from permanent deletion.

## Data After Cancellation

The customer receives an understandable schedule for read-only access, export, retention, backup expiry, privacy transformation, deletion, and legal holds. Commercial cancellation does not override statutory retention or investigation requirements.

## Events

- `commercial.subscription.activated.v1`
- `commercial.subscription.change-scheduled.v1`
- `commercial.subscription.grace-started.v1`
- `commercial.subscription.suspended.v1`
- `commercial.subscription.cancelled.v1`
- `commercial.subscription.reactivated.v1`