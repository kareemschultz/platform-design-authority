---
document_id: PDA-COM-004
title: Usage Metering and Overages
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Usage Metering and Overages

## Purpose

Define trustworthy measurement for billing, limits, capacity planning, partner settlement, customer visibility, and internal cost control.

## Candidate Meters

- Active, named, and concurrent users
- Legal entities, branches, stores, warehouses, registers, and devices
- Orders, invoices, shipments, payroll employees, and transactions
- API requests, webhook deliveries, messages, OCR pages, and storage
- AI tokens, model calls, tool executions, agents, and generated documents
- Marketplace extension seats or usage

## Meter Event Requirements

- Globally unique event or idempotency identifier
- Tenant, customer, meter, value, unit, timestamp, and source
- Capability, dimensions, and billing-period context
- Correlation to the originating business event
- Validation, acceptance, correction, and processing status

## Rules

1. Meter ingestion is append-oriented and idempotent.
2. Raw usage and billable aggregation remain distinguishable.
3. Late, duplicate, corrected, and backfilled events require explicit policy.
4. Provider submission is asynchronous and reconciled against the internal usage ledger.
5. High-cardinality dimensions require controlled allow-lists and pre-aggregation.
6. Customers receive near-real-time usage visibility, thresholds, forecasts, and alerts.
7. Overage behavior must be defined before the limit is reached.
8. Meter corrections require audit and must flow into invoice or credit adjustments.

## Overage Policies

- Included allowance then unit overage
- Graduated or volume tiers
- Prepaid credit pool
- Hard cap
- Soft cap with alert
- Temporary grace
- Automatic add-on purchase with prior consent
- Sales review for enterprise thresholds

## AI Usage

AI usage must expose provider cost, model, token or unit basis, tenant allocation, included credits, overage price, budget policy, and approval for high-cost actions.

## Reconciliation

Daily and billing-period reconciliation must compare platform usage, billing-provider usage, invoice quantities, credits, and customer-visible summaries.
