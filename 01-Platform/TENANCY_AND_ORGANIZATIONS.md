---
document_id: PDA-PLT-002
title: Tenancy and Organization Model
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Tenancy and Organization Model

## Purpose

Define the isolation, ownership, hierarchy, delegation, and scope model that allows the same platform to serve direct customers, multi-company groups, white-label customers, and resellers.

## Canonical Hierarchy

```text
Platform Owner
└── Partner or Direct Commercial Account
    └── Tenant
        ├── Organization
        │   ├── Legal Entity
        │   │   ├── Business Unit
        │   │   ├── Branch
        │   │   └── Location
        │   └── Shared Services
        └── Additional Organizations
```

The exact hierarchy may be configured within approved constraints, but the tenant remains the primary runtime isolation boundary.

## Core Entities

### Tenant

Owns isolated data, configuration, entitlements, identities, extensions, audit history, and operational context.

### Organization

Represents a governed operating group inside a tenant. An organization may contain one or more legal entities and shared capabilities.

### Legal Entity

Represents a juridical unit with its own legal, tax, accounting, payroll, or regulatory obligations.

### Business Unit

Represents an internal management division without necessarily having separate legal standing.

### Branch

Represents an operating unit used for management, reporting, access, and local workflows.

### Location

Represents a physical, virtual, mobile, or logical place. A location can be configured as a store, warehouse, office, kitchen, site, clinic, or other operational type.

### Partner

Represents a reseller or managed-service operator with delegated administration over customer tenants under approved policies.

## Rules

1. Data must never cross tenant boundaries without an explicit approved cross-tenant process.
2. Partner administrators may access customer tenants only through delegated, auditable, revocable authority.
3. Legal-entity boundaries must be preserved for finance, tax, payroll, contracts, and compliance.
4. Branch and location scopes may affect permissions, pricing, inventory, reporting, scheduling, and workspaces.
5. Shared master data across legal entities must define ownership, allowed reuse, and local overrides.
6. Tenant transfer, merger, split, export, and deletion require governed workflows.
7. Every entity must have status, lifecycle, timezone, locale, addresses, contact points, identifiers, and effective dates where relevant.

## Isolation Requirements

Tenant context must be enforced in:

- Databases and object storage
- Caches and search indexes
- Queues, events, and jobs
- Analytics and exports
- Files and backups
- Logs and support tooling
- AI retrieval, prompts, memory, and tool calls
- Extensions and integrations

## Administrative Delegation

Delegation must support:

- Platform administrators
- Partner administrators
- Tenant owners
- Organization administrators
- Legal-entity administrators
- Branch and location administrators
- Time-bound support access
- Emergency break-glass access with enhanced audit

## Lifecycle

Required tenant states include:

- Provisioning
- Trial
- Active
- Grace period
- Suspended
- Read-only
- Export pending
- Terminating
- Archived
- Deleted according to retention policy

## Events

Initial event family:

- `platform.tenant.created.v1`
- `platform.tenant.suspended.v1`
- `platform.organization.created.v1`
- `platform.legal-entity.created.v1`
- `platform.branch.created.v1`
- `platform.location.created.v1`
- `platform.partner.delegation-granted.v1`

## Open Decisions

- Whether one commercial account may own multiple independent tenants
- How shared identities operate across partner-managed tenants
- Regional data-residency partitioning
- Tenant merge and split mechanics
