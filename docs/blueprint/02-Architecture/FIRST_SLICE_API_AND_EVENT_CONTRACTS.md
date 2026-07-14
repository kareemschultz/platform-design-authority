---
document_id: PDA-ARC-014
title: First Slice API and Event Contracts
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0006, ADR-0007, ADR-0016, ADR-0017, ADR-0020]
---

# First Slice API and Event Contracts

## Purpose

Define the minimum public and first-party contracts required for the Guyana retail foundation slice while preserving domain ownership, tenant isolation, idempotency, and compatibility.

## API Conventions

- REST under `/v1`
- Opaque identifiers
- Tenant context derived from trusted authentication
- Idempotency keys for consequential commands
- Structured validation errors
- Cursor pagination
- ISO 8601 timestamps with explicit timezone semantics
- Explicit currency and unit fields
- ETags or version tokens for optimistic concurrency where appropriate
- OpenAPI as the generated-client contract once implementation begins
- Active context selected by a server-issued `X-Active-Context-Id`; tenant identifiers in request bodies never establish authority

## Contract Families

### Identity and Context

| Method and path | Permission |
|---|---|
| `GET /v1/me` | authenticated session |
| `GET /v1/organizations` | `platform.organization.read` |
| `GET /v1/organizations/{organizationId}` | `platform.organization.read` |
| `PATCH /v1/organizations/{organizationId}` | `platform.organization.update` |
| `GET /v1/locations` | `platform.organization.read` |
| `POST /v1/session/active-context` | authenticated membership |
| `GET /v1/sessions` | authenticated session |
| `DELETE /v1/sessions/{sessionId}` | authenticated session |
| `GET /v1/entitlements` | `platform.entitlement.read` |

### Users, Roles, and Administration

| Method and path | Permission |
|---|---|
| `GET /v1/users` | `platform.user.read` |
| `POST /v1/users/invitations` | `platform.user.invite` |
| `POST /v1/users/{userId}/suspend` | `platform.user.suspend` |
| `GET /v1/roles` | `platform.role.read` |
| `POST /v1/role-assignments` | `platform.role.assign` |
| `GET /v1/audit-records` | `platform.audit.read` |

### Parties and Customers

| Method and path | Permission |
|---|---|
| `GET /v1/parties` | `party.record.read` |
| `GET /v1/parties/{partyId}` | `party.record.read` |
| `POST /v1/parties/persons` | `party.record.create` |
| `POST /v1/parties/organizations` | `party.record.create` |
| `PATCH /v1/parties/{partyId}` | `party.record.update` |
| `POST /v1/party-identity-links` | `party.record.update` |
| `GET /v1/customers` | `crm.customer.read` |
| `POST /v1/customers` | `crm.customer.create` |
| `PATCH /v1/customers/{customerId}` | `crm.customer.update` |

### Catalog and Imports

| Method and path | Permission |
|---|---|
| `GET /v1/products` | `catalog.product.read` |
| `GET /v1/products/{productId}` | `catalog.product.read` |
| `POST /v1/products` | `catalog.product.create` |
| `PATCH /v1/products/{productId}` | `catalog.product.update` |
| `POST /v1/products/{productId}/activate` | `catalog.product.activate` |
| `POST /v1/products/{productId}/archive` | `catalog.product.archive` |
| `POST /v1/product-imports` | `catalog.import.create` |
| `POST /v1/product-imports/{importId}/approve` | `catalog.import.approve` |
| `POST /v1/customer-imports` | `platform.import.create` |
| `POST /v1/opening-stock-imports` | `inventory.import.create` |

### Inventory

| Method and path | Permission |
|---|---|
| `GET /v1/stock-balances` | `inventory.balance.read` |
| `GET /v1/inventory-adjustments` | `inventory.adjustment.read` |
| `GET /v1/inventory-adjustments/{id}` | `inventory.adjustment.read` |
| `POST /v1/inventory-adjustments` | `inventory.adjustment.create` |
| `POST /v1/inventory-adjustments/{id}/approve` | `inventory.adjustment.approve` |
| `GET /v1/stock-counts` | `inventory.count.read` |
| `GET /v1/stock-counts/{id}` | `inventory.count.read` |
| `POST /v1/stock-counts` | `inventory.count.create` |
| `POST /v1/stock-counts/{id}/submit` | `inventory.count.submit` |
| `POST /v1/stock-counts/{id}/approve` | `inventory.count.approve` |
| `GET /v1/stock-transfers` | `inventory.transfer.read` |
| `GET /v1/stock-transfers/{id}` | `inventory.transfer.read` |
| `POST /v1/stock-transfers` | `inventory.transfer.create` |
| `POST /v1/stock-transfers/{id}/dispatch` | `inventory.transfer.dispatch` |
| `POST /v1/stock-transfers/{id}/receive` | `inventory.transfer.receive` |

### Commerce, Registers, Cash, and Deposits

| Method and path | Permission |
|---|---|
| `POST /v1/sales` | `commerce.sale.create` |
| `POST /v1/sales/{saleId}/hold` | `commerce.sale.hold` |
| `POST /v1/sales/{saleId}/complete` | `commerce.sale.complete` |
| `POST /v1/returns` | `commerce.return.create` |
| `POST /v1/returns/{returnId}/approve` | `commerce.return.approve` |
| `POST /v1/refunds` | `commerce.refund.create` |
| `POST /v1/refunds/{refundId}/approve` | `commerce.refund.approve` |
| `POST /v1/registers/{registerId}/open` | `commerce.register.open` |
| `POST /v1/registers/{registerId}/close` | `commerce.register.close` |
| `POST /v1/registers/{registerId}/cash-movements` | `commerce.cash-movement.create` |
| `POST /v1/registers/{registerId}/safe-drops` | `commerce.cash-movement.create` |
| `POST /v1/deposits` | `commerce.deposit.create` |
| `POST /v1/deposits/{depositId}/confirm` | `commerce.deposit.confirm` |
| `POST /v1/cash-variances/{varianceId}/approve` | `commerce.cash-variance.approve` |

### Receipts

| Method and path | Permission |
|---|---|
| `GET /v1/receipts/{receiptId}` | `commerce.receipt.read` |
| `POST /v1/receipts/{receiptId}/reissue` | `commerce.receipt.reissue` |
| `POST /v1/receipts/{receiptId}/void` | `commerce.receipt.void` |

### Payment

| Method and path | Permission |
|---|---|
| `POST /v1/payment-intents` | `payment.intent.create` |
| `POST /v1/payment-intents/{id}/confirm` | `payment.intent.confirm` |
| `POST /v1/payment-intents/{id}/refund` | `payment.intent.refund` |
| `POST /v1/payment-intents/{id}/reverse` | `payment.intent.reverse` |
| `GET /v1/payment-intents/{id}` | `payment.intent.read` |
| `POST /v1/payment-reconciliations` | `payment.reconciliation.create` |

### Stored Value

| Method and path | Permission |
|---|---|
| `GET /v1/stored-value-instruments/{id}` | `commerce.stored-value.read` |
| `POST /v1/stored-value-instruments` | `commerce.stored-value.issue` |
| `POST /v1/stored-value-instruments/{id}/load` | `commerce.stored-value.load` |
| `POST /v1/stored-value-instruments/{id}/reserve` | `commerce.stored-value.reserve` |
| `POST /v1/stored-value-reservations/{id}/capture` | `commerce.stored-value.redeem` |
| `POST /v1/stored-value-reservations/{id}/release` | `commerce.stored-value.reserve` |
| `POST /v1/stored-value-instruments/{id}/adjust` | `commerce.stored-value.adjust` |
| `POST /v1/stored-value-instruments/{id}/suspend` | `commerce.stored-value.suspend` |
| `POST /v1/stored-value-reconciliations` | `commerce.stored-value.reconcile` |

### Devices and Offline

| Method and path | Permission |
|---|---|
| `POST /v1/devices/enroll` | `platform.device.enroll` |
| `POST /v1/devices/{deviceId}/revoke` | `platform.device.revoke` |
| `POST /v1/offline-leases` | `platform.offline-lease.issue` |
| `POST /v1/sync/batches` | `platform.sync-batch.submit` |
| `GET /v1/sync/status/{batchId}` | `platform.sync-batch.read` |

### Exports and Finance Handoff

| Method and path | Permission |
|---|---|
| `POST /v1/exports/accountant-handoff` | `platform.export.create` |
| `GET /v1/exports/{exportId}` | `platform.export.read` |
| `POST /v1/deposit-reconciliations` | `finance.bank-reconciliation.create` |
| `GET /v1/finance-handoff/posting-batches` | `finance.posting-batch.read` |

### Webhooks

| Method and path | Permission |
|---|---|
| `GET /v1/webhook-subscriptions` | `developer.webhook.read` |
| `POST /v1/webhook-subscriptions` | `developer.webhook.create` |
| `PATCH /v1/webhook-subscriptions/{id}` | `developer.webhook.update` |
| `POST /v1/webhook-deliveries/{id}/replay` | `developer.webhook.replay` |

### Privacy

| Method and path | Permission |
|---|---|
| `POST /v1/privacy-requests` | `security.privacy-request.create` |
| `GET /v1/privacy-requests/{id}` | `security.privacy-request.read` |
| `POST /v1/privacy-requests/{id}/verify` | `security.privacy-request.verify` |
| `POST /v1/privacy-actions/{id}/approve` | `security.privacy-action.approve` |

## Command Semantics

Every consequential command declares idempotency, authorization, entitlement, state preconditions, concurrency, audit, canonical event output, retry safety, and provider uncertainty.

WS2 Product activation/archive and Inventory dispatch commands require `Idempotency-Key` plus an expected version. Adjustment, Count, and Transfer list/detail queries use resource-specific read permissions; mutation permissions do not grant inspection, and `inventory.balance.read` does not expose workflow evidence. Quantities are decimal strings with an explicit unit and optional governed conversion provenance.

`POST /v1/users/{userId}/suspend` suspends the target user's membership in the active tenant context. It does not globally disable the Better Auth account or mutate memberships in another tenant. Global protective account action belongs to a separately governed Security/Platform Identity command.

`POST /v1/session/active-context` validates a current membership and returns a server-issued active-context identifier bound to the authenticated session. Subsequent context-bound calls present that identifier in `X-Active-Context-Id`; the server revalidates it. The operation does not mutate Better Auth's session-global `activeOrganizationId`, which would make concurrent browser tabs interfere.

## Referenced Canonical Event Contracts

| Event | Authoritative specification |
|---|---|
| `platform.session.created.v1` | Better Auth Identity Architecture |
| `platform.device.enrolled.v1` | Device and Edge Management |
| `party.person.created.v1` | Party and Relationship Model |
| `catalog.product.created.v1` | Product Catalog Domain |
| `catalog.product.activated.v1` | Product Catalog Domain |
| `catalog.product.archived.v1` | Product Catalog Domain |
| `inventory.stock.adjusted.v1` | Inventory Domain |
| `inventory.stock-count.posted.v1` | Inventory Domain |
| `inventory.stock-transfer.dispatched.v1` | Inventory Domain |
| `inventory.stock-transfer.received.v1` | Inventory Domain |
| `commerce.sale.completed.v1` | Commerce Domain |
| `commerce.return.completed.v1` | Commerce Domain |
| `commerce.register.opened.v1` | Commerce Domain |
| `commerce.register.closed.v1` | Commerce Domain |
| `payment.intent.captured.v1` | Payment Engine |
| `payment.intent.uncertain.v1` | Payment Engine |
| `commerce.stored-value-instrument.issued.v1` | Stored Value and Customer Balances |
| `commerce.stored-value-redemption.captured.v1` | Stored Value and Customer Balances |
| `developer.webhook-delivery.failed.v1` | Webhooks and Event Delivery |
| `fiscalization.submission.rejected.v1` | Fiscalization and Statutory Reporting Engine |
| `security.privacy-request.received.v1` | Privacy Rights and Retention |
| `security.privacy-case.closed.v1` | Privacy Rights and Retention |

The owning specification is the only canonical definition. This document references events and never redefines them.

## Error Model

Errors include code, safe message, field details, correlation ID, retryability, uncertainty, and optional next action. Categories include validation, authentication, authorization, entitlement, conflict, state transition, rate limit, provider uncertainty, dependency unavailable, and internal failure.

## Compatibility

Additive changes are preferred. Breaking changes require a new major version. Offline clients and webhooks have explicit compatibility windows.

## Security

- No tenant ID accepted as authority from request bodies
- No secrets in responses
- Fresh authentication for sensitive changes
- Rate limits by tenant, actor, device, and operation
- Stronger controls for export, privacy, payment, and administration

## Quality Gates

- OpenAPI coverage parity with the endpoint-permission manifest in repository CI
- Full OpenAPI semantic lint before implementation review
- Generated SDK compilation
- Endpoint-to-permission coverage check
- Contract tests
- Tenant-isolation tests
- Idempotency tests
- Event registry inclusion checks
- Offline multi-version tests
- Error and accessibility review
