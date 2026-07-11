---
document_id: PDA-PLT-027
title: First Slice Permission Catalog
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# First Slice Permission Catalog

## Purpose

Define the initial permission vocabulary, scope behavior, segregation of duties, and high-risk controls for the Guyana retail foundation slice.

## Permission Pattern

`<namespace>.<resource>.<action>`

Permissions are actor-level authority and remain separate from tenant entitlements.

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
- `platform.audit.read`
- `platform.export.create`
- `platform.support-access.approve`

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

## Stored Value

- `commerce.stored-value.read`
- `commerce.stored-value.issue`
- `commerce.stored-value.load`
- `commerce.stored-value.redeem`
- `commerce.stored-value.adjust`
- `commerce.stored-value.suspend`
- `commerce.stored-value.reconcile`

## Payments

- `engine.payment.read`
- `engine.payment.confirm`
- `engine.payment.refund`
- `engine.payment.reverse`
- `engine.payment.reconcile`
- `engine.payment-adapter.configure`

## Security and Privacy

- `security.risk-case.read`
- `security.risk-case.review`
- `security.protective-action.apply`
- `security.privacy-request.read`
- `security.privacy-request.verify`
- `security.privacy-action.approve`
- `security.privacy-hold.apply`

## Scope

Assignments may be scoped by tenant, organization, legal entity, branch, store, location, register, team, or record set. A permission without a valid scope grants nothing.

## Segregation of Duties

Examples requiring separation or heightened approval:

- User invitation versus role assignment
- Stored-value adjustment versus reconciliation
- Cash count versus variance approval
- Inventory adjustment creation versus approval
- Refund creation versus high-value approval
- Privacy request handling versus legal-hold approval
- Payment-provider configuration versus reconciliation

## High-Risk Controls

High-risk actions may require fresh authentication, manager approval, dual control, reason, threshold, location restriction, device trust, and stronger audit.

## Role Templates

Initial role templates:

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

- No permission grants cross-tenant access
- Entitlement absence still denies capability use
- UI hiding is not the only enforcement
- Jobs, exports, webhooks, offline leases, and AI tools use the same policy
- Permission changes are audited and immediately revocable
- Role templates pass segregation-of-duties review
