---
document_id: PDA-DOM-024
title: Recurring Commerce and Memberships
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0015]
---

# Recurring Commerce and Memberships

## Purpose

Define tenant-facing recurring agreements, memberships, retainers, recurring donations, tuition plans, service plans, replenishment programs, and recurring invoices sold by platform customers to their own customers.

## Architectural Position

Recurring Commerce is a Commerce capability. It is distinct from the platform's own SaaS subscription billing in `13-Commercial`.

To prevent terminology collision, tenant-facing records use **Recurring Agreement** and **Agreement Item**. The bare term Subscription is reserved for platform commercial subscriptions unless a domain-qualified phrase is used.

Recurring Commerce coordinates:

- Party and CRM for customer identity and relationship
- Product Catalog for plans and sellable offerings
- Pricing for recurring price calculation
- Tax for jurisdictional treatment
- Payment Engine for supported collection behavior
- Finance for invoices, receivables, revenue, and reconciliation
- Jobs, Scheduling, and Workflow for future actions and exceptions
- Loyalty for benefits and Marketing for communication

## Core Entities

- Recurring Offer
- Offer Version
- Recurring Agreement
- Agreement Item
- Billing and Service Schedule
- Commitment Term
- Usage or Allowance Bucket
- Pause and Resume Record
- Renewal
- Change Order
- Cancellation
- Collection Request or Attempt
- Benefit Grant

## Use Cases

- Salon and gym memberships
- Professional-service retainers
- Field-service maintenance plans
- Rental recurring agreements
- Education tuition and installment plans
- Nonprofit recurring donations
- Product replenishment agreements
- Restaurant or retail clubs
- Warranty and service contracts

## Agreement Lifecycle

Draft, Pending Acceptance, Active, Change Scheduled, Paused, Grace, Past Due, Suspended, Cancellation Scheduled, Cancelled, Completed, and Reactivated.

## Rules

1. Offer versions are immutable after sale; future changes create new versions.
2. Recurring Agreement state, invoice state, payment state, benefit grant, and fulfillment state remain distinct.
3. Every change previews timing, charges, credits, benefits, inventory, service obligations, and cancellation consequences.
4. Collection requires customer consent and a provider capability verified for the tenant's contract and jurisdiction.
5. Failed payment follows configurable dunning and service-grace policy.
6. Cancellation does not erase invoices, fulfilled services, or ledger history.
7. Usage and allowance consumption is idempotent and reconcilable.
8. Pausing billing does not automatically pause every service obligation.
9. The system must not promise automatic collection when only interactive request-to-pay or invoice payment is available.

## Collection Rail Capability

A Recurring Agreement declares one collection mode:

- Automatic provider-initiated collection using a verified token or mandate
- Customer-approved request-to-pay
- Generated invoice with customer-initiated payment
- Bank standing order or direct-debit file
- Cash collection with receipt and agent controls
- No collection; benefits or service are funded externally

The Payment Engine checks the selected provider's capability declaration from ADR-0015. Tokenization does not automatically imply unattended collection. A wallet that supports merchant requests but requires customer approval is modeled as request-to-pay, not auto-debit.

For the Guyana-first slice, automatic recurring collection remains unverified. Request-to-pay, invoice plus manual payment, bank transfer, and cash collection may be piloted only after provider and policy validation.

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

Recurring Agreements may generate:

- Invoices
- Orders and shipments
- Appointments or service work orders
- Project allocations
- Membership benefits
- Access or booking rights
- Notifications and renewal tasks

Generation is scheduled, idempotent, and linked to the agreement and offer version.

## Payment and Finance

The Payment Engine stores only provider references or protected tokens and executes a collection mode supported by the provider. Finance owns invoices, receivables, cash application, credits, write-offs, and accounting. Commerce owns the Recurring Agreement and service promise.

Paid membership billing belongs to Recurring Commerce. Loyalty may grant or evaluate loyalty-specific benefits after receiving the agreement state; Loyalty does not own the contract or collection.

## Customer Experience

Customers can view offer, price, next request or invoice, commitment, benefits, usage, payment arrangement, history, pause/change/cancel options, and support contacts. The UI must distinguish an automatic charge from a payment request or invoice. Cancellation must be clear and not intentionally obstructive.

## Offline

Agreement creation, acceptance, and payment-method changes require online validation. Offline service delivery may consume signed allowances or cached membership status with expiry and later reconciliation.

## Roadmap Position

Recurring Commerce is not required for the first POS and inventory pilot unless a named customer and verified collection rail justify it. The initial retail slice implements only the architectural seams needed to add it later.

## Initial Delivery Scope

When scheduled after the first slice:

- Fixed-price recurring offers
- Monthly and annual schedules
- Request-to-pay and invoice collection modes
- Pause, resume, change, and cancel
- Invoice and payment integration
- Membership benefit grant
- Basic dunning and customer portal

Automatic unattended collection, usage billing, complex proration, coalition benefits, and regulated installment credit require later validation.