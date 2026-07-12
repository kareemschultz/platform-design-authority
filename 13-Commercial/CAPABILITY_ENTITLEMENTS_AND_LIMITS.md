---
document_id: PDA-COM-003
title: Capability Entitlements and Limits
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Capability Entitlements and Limits

## Purpose

Define the commercial-to-runtime contract that grants or revokes platform capabilities independently of plan names and user permissions.

## Entitlement Record

Every entitlement must include:

- Capability identifier
- Tenant or organization scope
- Source offer, contract, add-on, trial, grant, or partner policy
- State and effective dates
- Included quantitative limits
- Meter references
- Dependencies and exclusions
- Grace and offline-lease policy
- Version and audit history

## Entitlement States

Pending, Trial, Active, Grace, Suspended, Expired, Revoked, and Archived.

## Limit Types

- Soft warning
- Hard block
- Overage allowed
- Approval required
- Read-only after threshold
- Contract review required

## Enforcement

The same capability decision must govern:

- Navigation and workspaces
- API and application operations
- Background jobs and automations
- Reports, exports, integrations, and extensions
- AI tools and agents
- Mobile and offline leases

## Rules

1. Billing events may propose entitlement changes, but the Entitlement Service is authoritative at runtime.
2. A failed payment must follow the configured grace and suspension policy rather than instantly deleting access.
3. Downgrades must preview affected data, workflows, automations, users, and integrations.
4. Disabling a capability must not delete customer data automatically.
5. Dependencies must be explicit and explainable.
6. Manual grants and overrides require reason, expiry, owner, and audit.
7. Entitlement snapshots used offline must be signed, scoped, and expiring.

## Customer Experience

Customers and partners must be able to inspect current capabilities, limits, consumption, source bundle, renewal dates, and consequences of changing the offer.
