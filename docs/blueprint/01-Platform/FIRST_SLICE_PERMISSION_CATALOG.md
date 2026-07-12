---
document_id: PDA-PLT-027
title: First Slice Permission Catalog
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016, ADR-0017]
---

# First Slice Permission Catalog

## Purpose

Define the canonical first-slice permission vocabulary, scope behavior, segregation of duties, and endpoint coverage for the Guyana retail foundation slice.

## Permission Pattern

`<namespace>.<resource>.<action>`

Permissions are actor-level authority and remain separate from tenant entitlements. Capability references used by entitlements resolve to canonical IDs in `registry/capabilities.json`. Every permission in this catalog appears in `registry/permissions.json` after generation.

## Platform Administration

- `platform.organization.read`
- `platform.organization.update`
- `platform.user.read`
- `platform.user.invite`
- `platform.user.suspend`
- `platform.role.read`
- `platform.role.assign`
- `platform.entitlement.read`
- `platform.device.read`
- `platform.device.enroll`
- `platform.device.revoke`
- `platform.offline-lease.issue`
- `platform.sync-batch.submit`
- `platform.sync-batch.read`
- `platform.audit.read`
- `platform.import.create`
- `platform.export.create`
- `platform.export.read`
- `platform.support-access.approve`
- `platform.branding.configure`
- `platform.jurisdiction-profile.configure`

## Party and CRM

- `party.record.read`
- `party.record.create`
- `party.record.update`
- `party.record.merge`
- `party.identifier.read-restricted`
- `crm.customer.read`
- `crm.customer.create`
- `crm.customer.update`
- `crm.consent.update`

## Catalog

- `catalog.product.read`
- `catalog.product.create`
- `catalog.product.update`
- `catalog.product.activate`
- `catalog.product.archive`
- `catalog.import.create`
- `catalog.import.approve`

## Inventory

- `inventory.balance.read`
- `inventory.adjustment.create`
- `inventory.adjustment.approve`
- `inventory.count.create`
- `inventory.count.submit`
- `inventory.count.approve`
- `inventory.transfer.create`
- `inventory.transfer.receive`
- `inventory.import.create`

## Commerce and Registers

- `commerce.sale.create`
- `commerce.sale.hold`
- `commerce.sale.complete`
- `commerce.price-override.request`
- `commerce.price-override.approve`
- `commerce.return.create`
- `commerce.return.approve`
- `commerce.refund.create`
- `commerce.refund.approve`
- `commerce.register.open`
- `commerce.register.close`
- `commerce.cash-movement.create`
- `commerce.cash-variance.approve`
- `commerce.deposit.create`
- `commerce.deposit.confirm`
- `commerce.receipt.read`
- `commerce.receipt.reissue`
- `commerce.receipt.void`

## Stored Value

- `commerce.stored-value.read`
- `commerce.stored-value.issue`
- `commerce.stored-value.load`
- `commerce.stored-value.reserve`
- `commerce.stored-value.redeem`
- `commerce.stored-value.adjust`
- `commerce.stored-value.suspend`
- `commerce.stored-value.reconcile`

## Payment

- `payment.intent.create`
- `payment.intent.read`
- `payment.intent.confirm`
- `payment.intent.refund`
- `payment.intent.reverse`
- `payment.reconciliation.create`
- `payment.provider-adapter.configure`

## Finance Handoff

- `finance.posting-batch.read`
- `finance.bank-reconciliation.create`
- `finance.cash-management.read`

## Developer Platform

- `developer.webhook.read`
- `developer.webhook.create`
- `developer.webhook.update`
- `developer.webhook.replay`

## Security and Privacy

- `security.risk-case.read`
- `security.risk-case.review`
- `security.protective-action.apply`
- `security.privacy-request.create`
- `security.privacy-request.read`
- `security.privacy-request.verify`
- `security.privacy-action.approve`
- `security.privacy-hold.apply`

## Scope

Assignments may be scoped by tenant, organization, legal entity, branch, store, location, register, team, or record set. A permission without a valid scope grants nothing.

## Endpoint Coverage

Every endpoint listed in `docs/blueprint/02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md` references one permission in this catalog or explicitly states that an authenticated session or membership is sufficient.

The documentation validator fails when an endpoint references an unknown permission.

## Segregation of Duties

Examples requiring separation or heightened approval:

- User invitation versus role assignment
- Stored-value adjustment versus reconciliation
- Cash count versus variance approval
- Deposit preparation versus confirmation
- Inventory adjustment creation versus approval
- Refund creation versus high-value approval
- Privacy request handling versus legal-hold approval
- Payment-provider configuration versus reconciliation

## High-Risk Controls

High-risk actions may require fresh authentication, manager approval, dual control, reason, threshold, location restriction, device trust, and stronger audit.

## Role Templates

- Cashier
- Store Associate
- Store Manager
- Inventory Clerk
- Finance Reviewer
- Tenant Administrator
- Privacy Administrator
- Support Operator

Templates are starting points. Effective authority remains explicit and inspectable.

## Quality Gates

- No cross-tenant grant
- Entitlement absence still denies use
- UI hiding is not enforcement
- Jobs, exports, webhooks, offline leases, and AI tools use the same policy
- Permission changes are audited and revocable
- Role templates pass segregation-of-duties review
- API-to-permission coverage is machine-checked
- No detailed Payment permission uses the generic `engine` namespace

## Fiscalization Permission Exemption

The first slice includes only a fiscalization seam and no statutory-submission operation, so no fiscalization mutation permission is registered. Adding one requires a permission, OpenAPI operation, endpoint manifest, jurisdiction evidence, and ADR-0010 controls together.
