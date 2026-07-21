---
document_id: PDA-CIR-030
title: Catalog and Inventory Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016]
---

# Catalog and Inventory Workflow Reference

## Purpose

Describe reusable catalog and inventory workflows from dated competitive evidence while preserving PDA-DOM-002 and PDA-DOM-003 ownership.

## Product lifecycle

1. Create a Draft Product with tenant scope and expected version.
2. Add ordered Variants and typed identifiers; validate GS1 formats only when declared.
3. Add units, packages, attributes, media references, tax/pricing references, and channel content through owner contracts.
4. Detect identifier collisions and likely duplicates; never auto-merge without governed policy.
5. Validate prerequisites and activate through the dedicated command.
6. Publish channel projections with version and freshness.
7. Suspend, discontinue, or archive using explicit lifecycle commands; do not delete operational history.

## Adjustment and reversal

A user creates a reasoned draft against an item/location/unit. The owner shows current on hand, pending effects, and expected version. A separate approver posts under current permission, entitlement, and negative-stock policy. Posting appends a movement, updates the projection, and emits the canonical event atomically. Correction appends a linked inverse movement; the original remains.

## Count workflow

| State | Actor task | Integrity requirement |
|---|---|---|
| Draft | Select location, scope, method | Freeze or record scope version |
| Counting | Capture observations, preferably blind | Preserve counter, time, device, unit |
| Submitted | Resolve missing/duplicate scans | No client-supplied authoritative expected quantity |
| Review | Explain variance and policy breaches | Separation of duties where required |
| Posted | Append variance movements | Atomic projection and outbox |
| Corrected | Reverse and replace wrong fact | Link all corrections |

## Transfer workflow

Draft → Dispatched → Partially Received → Received, with Exception and Cancelled where governed. Dispatch proves source custody change; receipt proves destination custody. Each scan is idempotent. Over-receipt is denied unless an explicit exception command exists. Offline capture carries device, lease, sequence, signature, and uncertainty state and is reconciled on reconnect.

## Reservation and availability

Commerce or another demand owner requests an Inventory reservation through a contract. Inventory validates item, location, unit, quantity, policy, and idempotency. Reservation changes committed/available projections but not on hand. Expiry, release, fulfillment, and invalidation are explicit. UI displays the availability formula and as-of time.

## Bulk import

Use versioned schema, staging, duplicate/collision analysis, create/update/skip preview, bounded execution, row errors, and reconciliation. Identifier normalization and units are owner-validated. Importing starting stock creates traceable movements or a governed opening procedure; it never writes balance projections directly.

## Failure and recovery states

Cover stale expected version, duplicate scan, unit mismatch, unknown barcode, negative-stock denial, partial receipt, late reservation, projection drift, provider correction, device clock skew, expired offline lease, and outbox retry. Recovery must preserve the original request and produce an explicit outcome.

## UX and accessibility

Support exact barcode lookup before lexical search; keyboard and scanner input without focus traps; announced scan success/error; large touch targets; non-color variance status; accessible tables; responsive task transformation; and an offline queue with item-level uncertainty.

## Confidence and sources

Confidence: High for Meridian's governed WS2 flows, Medium for competitive synthesis. Sources: [Shopify purchase-order transfer receiving](https://help.shopify.com/en/manual/products/inventory/purchase-orders/creating-inventory-transfers), [Cin7 Core WMS](https://help.core.cin7.com/hc/en-us/articles/9034570508687-Using-the-Cin7-Core-Warehouse-Management-System-WMS), [Unleashed purchase receipt](https://support.unleashedsoftware.com/hc/en-us/articles/4402282913689-Receipt-Purchase), and [ERPNext Item](https://docs.frappe.io/erpnext/item), all retrieved 2026-07-16.

