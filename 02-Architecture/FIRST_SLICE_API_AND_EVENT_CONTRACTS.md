---
document_id: PDA-ARC-014
title: First Slice API and Event Contracts
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# First Slice API and Event Contracts

## Purpose

Define the minimum public and first-party contracts required for the first retail slice while preserving domain ownership and compatibility.

## API Conventions

- REST under `/v1`
- Opaque identifiers
- Explicit tenant context from trusted authentication
- Idempotency keys for consequential commands
- Structured validation errors
- Cursor pagination
- ISO 8601 timestamps with timezone semantics
- Explicit currency and unit fields
- ETags or version tokens for optimistic concurrency where appropriate

## Representative Resources

### Identity and Context

- `GET /v1/me`
- `GET /v1/organizations`
- `POST /v1/session/active-context`

### Catalog

- `GET /v1/products`
- `GET /v1/products/{productId}`
- `POST /v1/products`
- `POST /v1/product-imports`

### Inventory

- `GET /v1/stock-balances`
- `POST /v1/inventory-adjustments`
- `POST /v1/stock-counts`
- `POST /v1/stock-transfers`

### Commerce

- `POST /v1/sales`
- `POST /v1/sales/{saleId}/hold`
- `POST /v1/sales/{saleId}/complete`
- `POST /v1/returns`
- `POST /v1/registers/{registerId}/open`
- `POST /v1/registers/{registerId}/close`

### Payments

- `POST /v1/payment-intents`
- `POST /v1/payment-intents/{id}/confirm`
- `POST /v1/payment-intents/{id}/refund`
- `GET /v1/payment-intents/{id}`

### Stored Value

- `POST /v1/stored-value-instruments`
- `POST /v1/stored-value-instruments/{id}/load`
- `POST /v1/stored-value-instruments/{id}/reserve`
- `POST /v1/stored-value-reservations/{id}/capture`
- `POST /v1/stored-value-reservations/{id}/release`

### Devices and Offline

- `POST /v1/devices/enroll`
- `POST /v1/offline-leases`
- `POST /v1/sync/batches`
- `GET /v1/sync/status/{batchId}`

### Privacy

- `POST /v1/privacy-requests`
- `GET /v1/privacy-requests/{id}`

## Command Semantics

Every consequential command declares idempotency, authorization, entitlement, state preconditions, concurrency, audit, event output, retry safety, and provider uncertainty.

## Initial Event Families

- `platform.session.created.v1`
- `platform.device.enrolled.v1`
- `party.person.created.v1`
- `catalog.product.created.v1`
- `inventory.stock.adjusted.v1`
- `inventory.stock-count.posted.v1`
- `commerce.sale.completed.v1`
- `commerce.return.completed.v1`
- `commerce.register.opened.v1`
- `commerce.register.closed.v1`
- `commerce.stored-value-issued.created.v1`
- `commerce.stored-value-redemption.captured.v1`
- `security.privacy-request.received.v1`
- `security.privacy-case.closed.v1`

Canonical event definitions remain in owning specifications and `registry/events.json`.

## Error Model

Errors include code, safe message, field details, correlation ID, retryability, and optional next action. Categories include validation, authentication, authorization, entitlement, conflict, state transition, rate limit, provider uncertainty, dependency unavailable, and internal failure.

## Compatibility

Additive changes are preferred. Breaking changes require a new major version. Offline clients and webhooks have explicit compatibility windows.

## Security

- No tenant ID accepted as authority from request bodies
- No secrets in responses
- Step-up authentication for sensitive changes
- Rate limits by tenant, actor, device, and operation
- Export and privacy endpoints receive stronger controls

## Quality Gates

- OpenAPI validation
- SDK generation
- Contract tests
- Tenant-isolation tests
- Idempotency tests
- Event registry checks
- Offline multi-version tests
- Error and accessibility review
