---
document_id: PDA-COM-006
title: Subscription Lifecycle
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Subscription Lifecycle

## Purpose

Define the commercial and runtime states from prospect through activation, renewal, change, suspension, cancellation, retention, export, and reactivation.

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

1. Subscription, invoice, payment, and entitlement states remain distinct.
2. State transitions are event-driven, idempotent, auditable, and reversible where practical.
3. Grace and suspension policies vary by offer, risk, jurisdiction, and customer contract.
4. Suspension should preserve administrative access, billing access, export rights, and support contact unless law or security requires otherwise.
5. Cancellation must define final billing, entitlement end, data retention, automations, integrations, devices, and marketplace items.
6. Reactivation must restore access safely without duplicating historical billing or usage.
7. Annual commitments, minimum terms, renewals, and notice windows require effective-dated schedules.

## Dunning

Dunning must support payment retries, notifications, payment-method update, grace periods, collections escalation, sales or partner intervention, and eventual suspension. Customer communication must clearly distinguish a payment problem from permanent deletion.

## Data After Cancellation

The customer must receive an understandable schedule for read-only access, export, retention, backup expiry, deletion, and legal holds. Commercial cancellation does not override statutory retention or investigation requirements.

## Events

- `commercial.subscription.activated.v1`
- `commercial.subscription.change-scheduled.v1`
- `commercial.subscription.grace-started.v1`
- `commercial.subscription.suspended.v1`
- `commercial.subscription.cancelled.v1`
- `commercial.subscription.reactivated.v1`
