---
document_id: PDA-COM-005
title: Billing Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Billing Architecture

## Purpose

Define the internal billing domain and its integration with external payment, tax, invoicing, and subscription providers.

## Architectural Position

The platform owns commercial contracts, offers, entitlement intent, customer context, usage records, partner rules, and reconciliation. An external billing provider may calculate invoices, collect payments, manage payment methods, and provide tax or customer-portal features.

## Core Entities

Commercial Account, Offer Version, Contract, Subscription, Subscription Item, Billing Schedule, Invoice Mirror, Credit, Payment Status, Usage Summary, Partner Share, and Billing Adjustment.

## Rules

1. External provider IDs are references, not primary business identities.
2. Webhooks are authenticated, deduplicated, ordered defensively, and reconciled.
3. Subscription changes are represented internally before or atomically with provider changes.
4. Runtime entitlements do not depend on live synchronous provider calls.
5. Billing, entitlement, and payment states remain distinct.
6. Invoice previews are required before consequential plan changes.
7. Provider failures must create visible, retryable operational states.
8. Financial postings flow into the Finance domain through approved contracts.

## Provider Adapter

The adapter must support:

- Products and prices
- Subscriptions and schedules
- Trials and coupons
- Usage meters
- Invoice preview, creation, payment, credit, and refund
- Customer billing portal
- Tax calculation hooks
- Marketplace and connected-account settlements
- Webhook verification and event replay

## Reconciliation

Reconcile customer, subscription item, price, entitlement intent, meter totals, invoice lines, payment state, credits, partner shares, and accounting entries.

## Portability

Provider-specific behavior must remain behind adapters. The data model must preserve enough internal context to migrate providers or support regional alternatives without recreating commercial history.
