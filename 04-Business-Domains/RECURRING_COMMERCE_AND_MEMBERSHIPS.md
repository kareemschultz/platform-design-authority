---
document_id: PDA-DOM-024
title: Recurring Commerce and Memberships
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Recurring Commerce and Memberships

## Purpose

Define tenant-facing subscriptions, memberships, retainers, recurring donations, tuition plans, service plans, replenishment programs, and recurring invoices sold by platform customers to their own customers.

## Architectural Position

Recurring Commerce is a Commerce capability. It is distinct from the platform's own SaaS subscription billing in `13-Commercial`.

It coordinates:

- Party and CRM for customer identity and relationship
- Product Catalog for plans and sellable offerings
- Pricing for recurring price calculation
- Tax for jurisdictional treatment
- Payment Engine for payment methods and collection
- Finance for invoices, receivables, revenue, and reconciliation
- Scheduling and Workflow for future actions and exceptions
- Loyalty and Marketing for benefits and communication

## Core Entities

- Recurring offer
- Plan version
- Customer agreement
- Subscription item
- Billing and service schedule
- Commitment term
- Usage or allowance bucket
- Pause and resume record
- Renewal
- Change order
- Cancellation
- Collection attempt
- Benefit or entitlement grant

## Use Cases

- Salon and gym memberships
- Professional-service retainers
- Field-service maintenance plans
- Rental subscriptions
- Education tuition and installment plans
- Nonprofit recurring donations
- Product replenishment subscriptions
- Restaurant or retail clubs
- Warranty and service contracts

## Agreement Lifecycle

Draft, Pending Acceptance, Active, Change Scheduled, Paused, Grace, Past Due, Suspended, Cancellation Scheduled, Cancelled, Completed, and Reactivated.

## Rules

1. Plan versions are immutable after sale; future changes create new versions.
2. Customer agreement state, invoice state, payment state, service entitlement, and fulfillment state remain distinct.
3. Every change previews timing, charges, credits, benefits, inventory, service obligations, and cancellation consequences.
4. Recurring collection must support customer consent and provider requirements.
5. Failed payment follows configurable dunning and service-grace policy.
6. Cancellation must not erase invoices, fulfilled services, or ledger history.
7. Usage and allowance consumption is idempotent and reconcilable.
8. Pausing billing does not automatically pause every service obligation.

## Pricing Models

- Fixed recurring amount
- Per-member or per-unit
- Tiered quantity
- Usage-based
- Minimum commitment plus usage
- Installment schedule
- Donation amount chosen by payer
- Prepaid allowance or credit pool

## Fulfillment

Recurring agreements may generate:

- Invoices
- Orders and shipments
- Appointments or service work orders
- Project allocations
- Membership benefits
- Access or booking rights
- Notifications and renewal tasks

Generation is scheduled, idempotent, and linked back to the agreement and plan version.

## Payment and Finance

The Payment Engine stores provider tokens and executes authorized collections. Finance owns invoices, receivables, cash application, credits, write-offs, and accounting. Commerce owns the agreement and service promise.

## Customer Experience

Customers can view plan, price, next charge, commitment, benefits, usage, payment method, history, pause/change/cancel options, and support contacts. Cancellation must be clear and not intentionally obstructive.

## Offline

Agreement creation and payment-method changes require online validation. Offline service delivery may consume signed allowances or cached membership status with expiry and later reconciliation.

## Initial Scope

- Fixed-price recurring plans
- Monthly and annual schedules
- Trial or introductory period
- Pause, resume, upgrade, downgrade, and cancel
- Invoice and payment integration
- Membership benefit grant
- Basic dunning and customer portal

Usage billing, complex proration, coalition benefits, and regulated installment credit require later specifications.
