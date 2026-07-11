---
document_id: PDA-DOM-016
title: Rental Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Rental Domain

## Purpose

Own rental availability, reservations, contracts, dispatch, return, inspection, usage, deposits, charges, damage, and rental-asset utilization.

## Core Capabilities

- Rental products, serialized assets, pools, kits, and accessories
- Availability, calendars, reservations, quotations, and waitlists
- Rental agreements, terms, deposits, extensions, substitutions, and renewals
- Check-out, delivery, collection, return, and condition inspection
- Metered, hourly, daily, weekly, monthly, event, and usage-based charging
- Late fees, damage, loss, cleaning, consumables, and additional charges
- Customer eligibility, credit, identity, waivers, and signatures
- Maintenance blocks, quarantine, downtime, and replacement assets
- Utilization, yield, turnaround, overdue, and profitability analytics

## Authoritative Entities

Rental Reservation, Rental Agreement, Rental Asset Allocation, Check-Out, Return Inspection, Rental Charge, Deposit, Damage Claim, and Availability Projection.

## Boundaries

Product Catalog owns rentable definitions. Assets owns operational asset records. Inventory owns consumables and stock. Commerce owns payments and customer transaction handoff. Finance owns accounting. Rental owns reservation and contract execution.

## Quality Requirements

- Concurrency-safe availability
- Contract and price snapshot history
- Deposit and refund reconciliation
- Inspection evidence and customer acknowledgement
- Mobile and offline dispatch and return
- Damage, substitution, and overdue audit integrity
