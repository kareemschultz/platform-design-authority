---
document_id: PDA-DOM-003
title: Inventory Domain
version: 0.3.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# Inventory Domain

## Purpose

Own stock state, inventory movements, availability, valuation inputs, traceability, replenishment signals, and inventory integrity across locations.

## Core Capabilities

- On-hand, available, reserved, committed, in-transit, damaged, and quarantined stock
- Receipts, issues, adjustments, transfers, returns, and write-offs
- Lots, batches, serial numbers, expiry dates, and traceability
- Cycle counts, full counts, blind counts, and variance approval
- Reorder points, safety stock, min-max, and replenishment recommendations
- Inventory status, ownership, consignment, and quality holds
- Cost layers and valuation inputs for Finance
- Stock snapshots, aging, turnover, and availability projections

## Authoritative Entities

Stock Ledger Entry, Stock Balance Projection, Reservation, Transfer, Count, Lot, Serial, Inventory Status, and Replenishment Policy.

## Rules

- Stock history is ledger-based and corrected through adjustment or reversal.
- Reservations do not equal physical movement.
- Negative stock policy is explicit by item, location, and workflow.
- Units, precision, and conversion context are mandatory.
- Offline movements require idempotency and reconciliation.

## Boundaries

Warehouse owns execution tasks and bin operations. Procurement owns purchase commitments. Commerce owns sales demand. Manufacturing owns production consumption and output. Finance owns financial valuation and ledger posting.

## WS2 Controlled-Prototype Contract

- Authoritative quantities use signed decimal strings at the API/event boundary and PostgreSQL `numeric(38,6)` in the spike. Binary floating point is prohibited. Every fact preserves its unit; a conversion also records the governed conversion source/version.
- Directional command lines such as Transfer and Return quantities are strictly greater than zero because source/destination and command type carry direction. Signed quantities remain confined to adjustment, variance, movement, and reversal facts where the sign is semantically meaningful.
- The initial negative-stock default is deny. A separately authorized, reasoned, location-and-item policy hook may permit a bounded exception; no caller-supplied boolean creates the override.
- Posting serializes per tenant, location, Product/Variant, and unit balance key. Ledger facts are append-only; corrections create linked reversal facts and never update or delete the original movement.
- Adjustment, Count, and Transfer expose tenant-scoped list and detail queries under distinct read permissions. Mutation permission never implies read permission and balance read does not reveal workflow evidence.
- Transfer states are Draft, Dispatched, PartiallyReceived, Received, Exception, and Cancelled. Dispatch is an explicit command. Partial receipt records received quantities and remaining quantities; over-receipt is denied and a variance requires an explicit exception outcome.
- Count posting emits one variance movement per accepted line through the same ledger boundary. Reservations never alter physical on-hand quantity.
- Commands require current context, permission, entitlement, idempotency, locking/state preconditions, audit evidence, and state-plus-outbox atomicity.

## Events

- `inventory.stock.adjusted.v1`
- `inventory.stock-count.posted.v1`
- `inventory.stock-transfer.created.v1`
- `inventory.stock-transfer.dispatched.v1`
- `inventory.stock-transfer.received.v1`
- `inventory.reservation.created.v1`
- `inventory.reservation.released.v1`
- `inventory.stock-movement.reversed.v1`

Each event preserves tenant, location, item, unit, quantity, source, correlation, causation, and authoritative ledger references.
