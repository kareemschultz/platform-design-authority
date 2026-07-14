---
document_id: PDA-PLT-005
title: Entitlements and Licensing
version: 0.2.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Entitlements and Licensing

## Purpose

Define the runtime system that converts contracts, plans, trials, grants, add-ons, partner agreements, and usage limits into explicit organization capabilities.

## Core Principle

Commercial plans are packaging constructs. Runtime access is governed by versioned entitlements, limits, meters, and policies.

## Canonical Capability Identity

Every entitlement references a canonical capability ID from `registry/capabilities.json`. Plan labels, bundle names, feature-flag keys, permission IDs, implementation package names, and provider product names are prohibited as entitlement identities.

A capability must exist in an approved canonical source before it can be sold, granted, trialed, metered, or denied through entitlement policy.

## Entitlement Model

An entitlement defines:

- Canonical capability identifier
- Tenant or organization scope
- Source: plan, add-on, trial, contract, grant, or partner policy
- Effective and expiry dates
- State: Pending, Trial, Active, Grace, Suspended, Expired, Revoked, or Archived
- Quantitative limits
- Usage meters
- Dependencies and exclusions
- Offline lease behavior
- Audit and change history

## Packaging Composition

A Platform Subscription may be assembled as:

`Base Platform + Domain Bundles + Capability Add-ons + Industry Pack + Usage + Service Tier`

Possible dimensions include users, legal entities, locations, registers, devices, warehouses, transactions, storage, API calls, messages, OCR, and AI usage.

## Rules

1. Entitlements and permissions are evaluated separately.
2. Domain code queries canonical capability policy, not plan names.
3. A disabled capability is denied across UI, API, exports, reports, jobs, automation, integrations, extensions, devices, and AI tools.
4. Dependencies are explicit; hidden commercial coupling is prohibited.
5. Grace, downgrade, cancellation, and suspension define read, export, write, retention, and reactivation behavior.
6. Usage measurement is idempotent, auditable, explainable, and correctable.
7. Partner overrides remain within platform-authorized commercial boundaries.
8. Offline clients use signed, expiring entitlement leases and reconcile after reconnect.
9. A feature flag cannot create commercial access.
10. Removing a registry capability requires consumer, entitlement, customer, and data-impact review.

## Trials

Trials define included canonical capability IDs, limits, start, expiry, conversion, data retention, notifications, abuse controls, and interaction with paid add-ons.

## Enforcement Layers

- Navigation and workspace composition
- Route and API authorization
- Application-service operations
- Background jobs and automations
- Reports, exports, and analytics
- Integration and extension scopes
- AI tool availability
- Device and offline leases

## Administrative Capabilities

Administrators need effective-entitlement inspection, source and dependency explanation, usage and limit dashboards, trial and grant management, upgrade and downgrade preview, audited meter corrections, partner controls, and customer-facing capability summaries.

## Events

- `platform.entitlement.activated.v1`
- `platform.entitlement.changed.v1`
- `platform.entitlement.expired.v1`
- `platform.usage.limit-approaching.v1`
- `platform.usage.limit-reached.v1`

Platform Subscription lifecycle events remain defined by the Commercial Control Plane rather than this platform service.

## Change Log

- 2026-07-14 — v0.2.1 aligned the entitlement state list with PDA-COM-003 and PDA-RDM-008 by making Trial and Archived explicit.
