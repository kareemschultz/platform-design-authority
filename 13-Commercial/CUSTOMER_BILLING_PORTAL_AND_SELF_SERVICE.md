---
document_id: PDA-COM-010
title: Customer Billing Portal and Self Service
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Customer Billing Portal and Self Service

## Purpose

Define the customer-facing experience for reviewing subscriptions, capabilities, usage, invoices, payment methods, upcoming changes, renewals, and cancellations.

## Core Capabilities

- Current edition, bundles, add-ons, entitlements, and limits
- Usage and forecast by meter
- Invoice, credit, payment, and receipt history
- Payment-method and billing-contact management
- Tax and legal-entity details
- Upgrade, add-on, and trial discovery
- Downgrade and cancellation previews
- Scheduled change and renewal visibility
- Partner, reseller, and support relationship details
- Secure downloads and billing audit history

## Rules

1. A hosted billing-provider portal may be embedded or linked for payment methods and invoices, but the platform portal remains the authoritative product and entitlement experience.
2. The customer must see the operational effect of a plan change before confirming it.
3. Self-service actions require current authorization, fresh authentication for sensitive changes, and audit.
4. Sales-assisted or contract-restricted customers receive a request or quote workflow rather than an unsupported self-service mutation.
5. Cancellation experiences may offer retention options but must not obstruct a lawful or contractually permitted cancellation.
6. White-label and partner portals show the correct commercial party, brand, support owner, and legal disclosures.
7. Portal data must remain available during ordinary grace and read-only periods.

## Change Preview

Every preview should show:

- Effective date
- Immediate charge, credit, or proration
- Next renewal amount
- Entitlements and limits added or removed
- Existing usage above the target limit
- Affected users, locations, automations, integrations, and extensions
- Data and export consequences
- Approval or contract requirements

## Security

Billing administration is a distinct permission set. Payment instruments remain tokenized by the payment provider, and sensitive actions require step-up authentication where policy requires.
