---
document_id: PDA-PLT-001
title: Platform Kernel Overview
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0006, ADR-0007, ADR-0008, ADR-0014]
---

# Platform Kernel Overview

## Purpose

The platform kernel contains the minimum shared capabilities required by every domain, industry pack, deployment mode, extension, and workspace. It is the technical and governance foundation of the Business Operating Platform.

## Kernel Responsibilities

The kernel owns:

- Tenant isolation and organization hierarchy
- Identity, authentication, sessions, and service identities
- Canonical Party and relationship primitives used by domain roles
- Authorization, policies, scopes, and delegated administration
- Entitlements, limits, meters, trials, and feature controls
- Shared configuration and settings
- Extensible metadata, custom fields, layouts, and governed projections
- Sequence and human-readable numbering allocation
- Audit, activity history, and administrative traceability
- Domain event transport and internal integration hooks
- Background jobs, queues, retries, and schedules
- In-app, email, SMS, push, and user-directed notification primitives
- Files, media, attachments, and document primitives
- Search indexing and permission-filtered discovery
- Collaboration primitives including comments, mentions, follows, and record links
- Import, export, migration, validation, and reconciliation orchestration
- Rate limits, quotas, capacity protection, and abuse controls
- Localization, languages, currencies, units, calendars, and time zones
- Device registration, offline leases, synchronization, and privacy tombstones
- Secrets, keys, platform metadata, and environment-aware configuration
- Health, diagnostics, telemetry, and administrative controls

## Kernel Boundary

The kernel must not own domain-specific business records such as orders, employees, invoices, inventory movements, pay runs, customer stored-value balances, or projects. It provides shared primitives and policies used by domains.

The boundary between primitives and higher-order orchestration is explicit:

- Notification primitives deliver user-facing messages; marketing journeys and domain communication workflows remain outside the kernel.
- Search primitives index and retrieve authorized projections; reporting, analytics, and AI answer generation remain engine or data-platform concerns.
- Jobs execute work; Workflow and Automation define governed business execution.
- The Event Backbone transports internal events; the Developer Platform owns external webhook subscriptions and delivery.
- Party owns shared real-world identity and relationships; CRM, Procurement, Workforce, Commerce, and other domains own their role-specific profiles and transactions.
- Import and export coordinate safe movement; domains validate and mutate their own records through published commands.

## Architectural Rules

1. Every kernel capability must be tenant-aware.
2. Every privileged operation must be authorized and auditable.
3. Domain modules may depend on kernel contracts; the kernel must not depend on business domains.
4. Kernel interfaces must remain stable and versioned.
5. Commercial plans must be translated into entitlements rather than referenced directly by domain code.
6. Shared platform capabilities must support cloud, dedicated, self-hosted, hybrid, and edge-aware deployment where applicable.
7. Kernel failures must degrade predictably and expose operational health.
8. Direct identifiers must be minimized in immutable records and follow ADR-0014.
9. External webhook delivery is not a kernel responsibility.
10. A capability named in the kernel charter must have an owning specification before production use.

## Logical Components

```text
Tenant and Organization Service
Identity and Better Auth Adapter
Party and Relationship Service
Authorization and Policy Engine
Entitlement and Licensing Service
Configuration and Settings Service
Extensible Metadata Service
Sequence and Numbering Service
Audit and Activity Service
Event Backbone
Jobs and Scheduling Service
Notification and Communication Service
Files and Document Primitives
Search and Indexing Service
Collaboration Service
Import, Export, and Migration Service
Rate Limits, Quotas, and Abuse Controls
Localization and Reference Data Service
Device, Edge, and Offline Synchronization
Secrets and Key Management
Platform Administration and Observability
```

## Cross-Cutting Context

Every request, job, event, audit record, AI tool call, import, export, webhook intent, and extension invocation should carry the appropriate context:

- Tenant identifier
- Organization and legal-entity scope
- User or service identity
- Effective roles and permissions
- Effective entitlements and limits
- Delegation or impersonation context
- Correlation, causation, and idempotency identifiers
- Locale, currency, time zone, and device context
- Data classification and purpose
- Source channel such as web, mobile, API, automation, integration, or AI

## Initial Delivery Order

1. Tenant, organization, and Party model
2. Better Auth identity adapter and authentication
3. Authorization and policy
4. Entitlements and licensing
5. Configuration, extensible metadata, and numbering
6. Audit, data classification, and privacy transformation foundation
7. Events, jobs, and scheduling
8. Devices, offline leases, and synchronization
9. Notifications and collaboration
10. Files, search, localization, and reference data
11. Import, export, quotas, and external developer seams
12. Administration, diagnostics, backup, restore, and operational hardening

## Exit Criteria

The kernel baseline is ready for the first business slice when:

- Tenant isolation is tested end to end
- Party and role-specific profiles do not duplicate authoritative identity
- Entitlement and permission checks work consistently across UI, API, jobs, exports, webhooks, and AI tools
- Audit records capture consequential actions
- Events and jobs support idempotency and retries
- Configuration and custom metadata inherit predictably across the organization hierarchy
- Offline leases, privacy tombstones, numbering ranges, and synchronization are recoverable
- Import and export cannot bypass domain invariants
- A role-based workspace can be assembled from kernel metadata
- Backup restore re-applies privacy transformations before traffic resumes
- Operational health and support diagnostics are available