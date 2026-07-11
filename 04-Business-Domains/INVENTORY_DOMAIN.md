---
document_id: PDA-DOM-003
title: Inventory Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
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
