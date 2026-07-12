---
document_id: PDA-COM-007
title: Trials Upgrades and Downgrades
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Trials, Upgrades, and Downgrades

## Purpose

Define safe commercial changes that preserve customer understanding, billing accuracy, entitlement consistency, and data integrity.

## Trial Types

- Full-platform trial
- Domain-bundle trial
- Capability or add-on trial
- Usage-credit trial
- Paid introductory period
- Upgrade trial for an existing customer
- Partner-provisioned demonstration tenant

## Trial Rules

1. Trials define included capabilities, limits, end behavior, conversion, abuse controls, and data retention.
2. Trial access is represented through explicit entitlements.
3. Customers receive reminders before conversion or loss of access.
4. Automatic paid conversion requires clear consent and price disclosure.
5. Trial extensions require reason, owner, and audit.
6. Trial data must remain exportable and subject to ordinary privacy controls.

## Upgrades

Upgrades may apply immediately or on a scheduled date. Before confirmation, show:

- New capabilities and limits
- Immediate charge or proration
- Renewal amount
- Required setup or migration
- Newly enabled users, automations, and integrations
- Effective date

High-value immediate changes may use pending updates so runtime entitlements change only after successful payment or approved credit terms.

## Downgrades

Downgrades should normally take effect at period end unless the contract says otherwise. Preview:

- Capabilities becoming unavailable
- Limits exceeded under the target offer
- Users, locations, devices, reports, integrations, and automations affected
- Read-only or archival behavior
- Data retention and export
- Credits or proration

## Scheduled Changes

Multi-phase subscription schedules may represent future starts, introductory periods, contract ramps, upgrades, and downgrades. The platform must preserve its own schedule record and reconcile provider execution.

## Proration Policy

Each offer declares whether changes create prorations, immediate invoices, account credits, no adjustment, or negotiated manual handling. Invoice preview is mandatory before customer confirmation.
