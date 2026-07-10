---
document_id: PDA-PLT-005
title: Entitlements and Licensing
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Entitlements and Licensing

## Purpose

Define the runtime system that converts contracts, plans, trials, grants, add-ons, partner agreements, and usage limits into explicit organization capabilities.

## Core Principle

Commercial plans are packaging constructs. Runtime access is governed by versioned entitlements, limits, meters, and policies.

## Entitlement Model

An entitlement must define:

- Capability identifier
- Tenant or organization scope
- Source, such as plan, add-on, trial, contract, grant, or partner policy
- Effective and expiry dates
- State: pending, active, grace, suspended, expired, revoked
- Quantitative limits
- Usage meters
- Dependencies and exclusions
- Offline lease behavior where needed
- Audit and change history

## Packaging Composition

A commercial subscription may be assembled as:

`Base Platform + Domain Bundles + Capability Add-ons + Industry Pack + Usage + Service Tier`

Possible billing dimensions include:

- Active, named, or concurrent users
- Legal entities, branches, stores, or locations
- POS registers, devices, warehouses, or field workers
- Orders, invoices, transactions, shipments, or payroll employees
- Storage, messages, OCR pages, API calls, and AI usage

## Rules

1. Entitlements and permissions must be evaluated separately.
2. Domain code must query capability policy, not plan names.
3. A disabled capability must be denied across UI, API, exports, reports, jobs, automation, integrations, extensions, and AI tools.
4. Dependencies must be explicit. Enabling one capability may require another, but hidden commercial coupling is prohibited.
5. Grace periods, downgrade, cancellation, and suspension must define read, export, write, retention, and reactivation behavior.
6. Usage measurement must be idempotent, auditable, explainable, and correctable.
7. Partner overrides must stay within platform-authorized commercial boundaries.
8. Offline-capable clients may use signed, expiring entitlement leases and must reconcile when connectivity returns.

## Trials

Trials should define:

- Included capabilities and limits
- Start, expiry, and conversion policy
- Data retention after expiry
- Notification schedule
- Abuse prevention
- Whether paid add-ons may coexist

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

Administrators need:

- Effective-entitlement inspection
- Source and dependency explanation
- Usage and limit dashboards
- Trial and grant management
- Safe preview of upgrades and downgrades
- Meter corrections with audit
- Partner catalog and override controls
- Customer-facing billing and capability summaries

## Events

- `platform.entitlement.activated.v1`
- `platform.entitlement.changed.v1`
- `platform.entitlement.expired.v1`
- `platform.usage.limit-approaching.v1`
- `platform.usage.limit-reached.v1`
- `platform.subscription.grace-started.v1`
