---
document_id: PDA-MAN-001
title: Platform Manifest
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0001, ADR-0007, ADR-0013, ADR-0014, ADR-0015]
---

# Platform Manifest

## Executive Definition

The platform is a modular Business Operating Platform designed to let organizations run commerce, inventory, warehouse, procurement, finance, customer relationships, workforce, payroll, manufacturing, projects, assets, service, analytics, and future operations within one governed ecosystem.

Customers experience one brand and one platform. Internally, the platform is composed of independent but interoperable capabilities.

## Structural Model

```text
Platform Kernel
  ├─ Shared platform primitives
  ├─ Shared business engines
  ├─ Business domains
  ├─ Security and privacy platform
  ├─ Experience and white-label layer
  ├─ AI and data platform
  ├─ Developer platform and marketplace
  ├─ Commercial control plane
  └─ Deployment and operations platform
```

## Platform Kernel

The kernel provides the minimum shared services required by every deployment:

- Tenant and organization hierarchy
- Better Auth identity adapter, authentication, sessions, MFA, SSO, and service identities
- Canonical Party and relationship primitives
- Roles, permissions, policies, scopes, and delegated administration
- Entitlements, limits, feature flags, metering, and commercial-state projections
- Configuration, extensible metadata, custom fields, and numbering
- Audit, jobs, schedules, and internal event backbone
- User-directed notifications and collaboration primitives
- Files, search indexing, localization, currencies, time zones, units, and reference data
- Import, export, data migration, quotas, devices, offline leases, and synchronization
- Secrets, diagnostics, telemetry, and administration

The kernel does not own external webhook subscriptions, domain transactions, customer stored value, platform billing contracts, or higher-order AI and business orchestration.

## Shared Business Engines

The initial shared-engine registry contains:

- Workflow
- Approvals
- Rules
- Automation
- Pricing
- Tax
- Payments
- Promotions and discounts
- Loyalty
- Fiscalization and statutory reporting
- Documents and templates
- Scheduling and calendar
- Branding and themes
- Workspace and navigation
- Dashboard and widgets
- Reporting and analytics
- AI orchestration

Engines expose reusable behavior and do not silently become owners of domain records. Detailed AI, Loyalty, and Fiscalization capability families use their registered namespaces.

## Security and Privacy Platform

Security provides:

- Tenant-isolation assurance and threat modeling
- Data classification and handling
- Privacy rights, deletion journal, and irreversible pseudonymization
- Transactional fraud, risk assessment, protective action, case review, and appeal
- Authentication, API, device, offline, extension, AI, and support-access controls
- Incident detection, investigation, response, and evidence

Governance and Compliance owns enterprise risk and control management; Security owns transaction-level and technical risk decisions.

## Developer Platform

The Developer Platform owns external application registration, API keys, SDKs, sandboxes, webhook subscriptions, signed event delivery, replay, compatibility, and agent-oriented registries. Internal event transport remains a kernel primitive.

## Commercial Control Plane

The Commercial Control Plane owns platform offers, contracts, platform subscriptions, trials, usage rating, billing, customer portal, partner commercial relationships, and marketplace revenue allocation.

Platform commercial subscriptions are distinct from tenant businesses' Commerce Recurring Agreements.

## Initial Business Domains

- Commerce, POS, orders, stored value, storefront integration, and recurring agreements
- Product information and catalog
- Inventory and stock control
- Warehouse management
- Procurement and supplier commercial profiles
- Supply chain, shipping, fulfillment, and logistics
- Finance and accounting
- CRM, sales, marketing, and customer service
- Workforce, HR, payroll, time, attendance, recruitment, and performance
- Manufacturing, planning, quality, and maintenance
- Projects, work management, field service, and professional services
- Assets, fleet, rental, facilities, and repairs
- Documents, knowledge, compliance, and governance
- Analytics, planning, budgeting, and executive intelligence

## Experience Model

The platform does not expose every capability to every user. Navigation and home experiences are assembled from:

- Organization entitlements
- User roles and permissions
- Industry and jurisdiction configuration
- Workspace assignment
- Device and screen size
- User preferences
- Current business context
- Connectivity and offline authority

Examples include Cashier, Store Manager, Warehouse Operator, Buyer, Accountant, HR Administrator, Payroll Officer, Technician, Project Manager, Executive, and Partner Administrator workspaces.

## White-Label Model

The experience operates in four modes:

1. Platform Brand — standard platform identity
2. Customer Brand — customer-specific styling and business documents
3. White Label — custom domain, communications, support identity, and approved app presentation
4. Platform Partner — reseller-controlled brand, customer hierarchy, catalog, billing relationship, support, and marketplace curation

All modes use one governed, upgradeable codebase.

## Commercial Model

A platform customer offer is composed from:

`Base Platform + Domain Bundles + Capability Add-ons + Industry Pack + Usage + Service Tier + Deployment Option`

Plans bundle capabilities, but runtime access is evaluated through explicit entitlements and limits.

Common meters include:

- Named, active, or concurrent users
- Legal entities, branches, stores, and locations
- Registers, devices, warehouses, and mobile workers
- Transactions, orders, invoices, payroll employees, and shipments
- Storage, API use, messages, OCR pages, and AI consumption

## Payment Operating Model

For the initial release, tenants contract directly with banks, wallets, and acquirers. The platform provides software, protected tenant credentials, payment orchestration, cash controls, and reconciliation. It does not initially pool or custody tenant funds or act as payment facilitator, aggregator, or merchant of record.

Cash is a first-class retail and receivables rail. GYD is a first-class operational currency, with USD and additional currencies supported through explicit policy.

## Industry Solution Model

Industry packs configure reusable capabilities, including:

- Retail
- Wholesale and distribution
- Restaurant and food service
- Pharmacy and healthcare operations
- Salon, spa, and personal services
- Construction and field operations
- Manufacturing
- Hospitality
- Automotive
- Agriculture
- Education
- Nonprofit
- Government and public administration

An industry pack may contain terminology, forms, workflows, dashboards, permissions, reports, templates, integrations, jurisdiction controls, and default automation. It must not create an avoidable application fork.

## Deployment Model

Strategic deployment modes are:

- Multi-tenant cloud SaaS
- Dedicated cloud environment
- Self-hosted enterprise
- Hybrid cloud and on-premises
- Edge nodes for stores, warehouses, and remote sites
- Offline-capable clients for continuity-sensitive workflows

## First Beachhead

The provisional first slice is Guyana-first SMB retail: POS, catalog, inventory, cash and register control, Party/customer basics, stored value, returns, tax and payment seams, audit, permissions, entitlements, offline continuity, and financial handoff.

The native reference storefront and tenant recurring commerce are deferred unless a named pilot and verified payment rail justify them.

## Roadmap Principle

The platform is delivered through vertical slices that prove the kernel, tenant isolation, experience, entitlements, audit, APIs, events, recovery, and observability before broad expansion. Capability quantity must not outrun architectural integrity or usability.

## Source-of-Truth Links

- Platform philosophy: `00-Foundation/PLATFORM_CANON.md`
- Supreme rules: `00-Foundation/CONSTITUTION.md`
- Kernel charter: `01-Platform/PLATFORM_KERNEL_OVERVIEW.md`
- Capability map: `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`
- Decision records: `18-Decisions/`
- Founder decisions: `20-Strategy/FOUNDER_DECISION_REGISTER.md`
- Machine-readable registries: `registry/`
- Reusable authoring formats: `templates/`