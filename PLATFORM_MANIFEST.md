---
document_id: PDA-MAN-001
title: Platform Manifest
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0001, ADR-0007, ADR-0013, ADR-0014, ADR-0015, ADR-0016, ADR-0017, ADR-0018, ADR-0019]
---

# Platform Manifest

## Executive Definition

The platform is a modular Business Operating Platform that lets organizations run commerce, inventory, warehouse, procurement, finance, customer relationships, workforce, payroll, manufacturing, projects, assets, service, analytics, and future operations within one governed ecosystem.

Customers experience one platform. Internally, independently owned capabilities interoperate through explicit contracts.

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

The kernel provides tenancy, organizations, Better Auth integration, canonical Party links, permissions, entitlements, configuration, metadata, audit, events, jobs, files, search, localization, reference data, numbering, import/export, quotas, devices, offline leases and synchronization, secrets, diagnostics, telemetry, and administration.

The kernel does not own external webhooks, domain transactions, customer stored value, platform billing contracts, marketplace commercial settlement, or higher-order AI and business orchestration.

## Shared Business Engines

The shared-engine registry contains:

- Workflow
- Approvals
- Rules
- Automation
- Pricing
- Tax
- Payment
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
- Business DNA

Detailed Payment, AI, Loyalty, and Fiscalization contracts use dedicated registered namespaces where defined.

## Business DNA

The Business DNA Engine owns governed profiles, evidence, explainable recommendations, readiness gaps, and implementation paths. It does not become the authoritative owner of operational domain data or silently purchase, grant, or apply capabilities.

## Security and Privacy Platform

Security provides tenant-isolation assurance, data classification, privacy rights and deletion journals, risk and fraud controls, cryptography, provider assessment, supply-chain controls, legal-hold behavior, incident response, forensics, control evidence, and customer assurance inputs.

Governance and Compliance owns enterprise risk and control management; Security owns transaction-level and technical risk decisions.

## Developer Platform and Extension Model

The Developer Platform owns public APIs, applications, credentials, SDKs, CLI, webhooks, provider simulators, compatibility, extension manifests, developer sandboxes, and application-facing contracts.

ADR-0019 permits declarative extensions and externally hosted applications first. Platform-hosted sandboxed code requires later security prototypes. Arbitrary third-party code is prohibited inside the core application process.

## Marketplace

Marketplace owns publisher, listing, review, installation, license, compatibility, rating, suspension, removal, and publisher-facing statement lifecycles.

The launch path is private and free-listings-first. Paid platform billing and publisher payout remain disabled until founder, legal, tax, provider, Finance, and Payment gates are complete.

Publisher AI assets enter the same AI registries, evaluations, budgets, memory, incident, and provider-exit controls as first-party assets.

## Commercial Control Plane

The Commercial Control Plane owns offers, contracts, platform subscriptions, trials, usage rating, billing, customer self-service, partner commercial relationships, and future approved marketplace revenue allocation.

Platform Subscriptions remain distinct from tenant Recurring Agreements, tenant customer payments, Commerce stored value, loyalty value, physical cash, and publisher or partner earnings.

## Business Domains

The initial domains include Commerce, Product Catalog, Inventory, Warehouse, Procurement, Logistics, Finance, CRM, Workforce, Payroll, Manufacturing, Projects, Service, Assets, Fleet, Rental, Marketing, Documents and Knowledge, Governance and Compliance, and Planning and Analytics.

Canonical Party is shared master data; domains own customer, supplier, employee, contractor, partner, and other business-role records.

## Experience Model

Navigation and task workspaces are composed from entitlements, permissions, industry and jurisdiction configuration, workspace assignment, device, preferences, context, connectivity, and offline authority.

The web foundation is approved stable Tailwind CSS with source-owned shadcn/ui. Ordinary operational charts use shadcn composition with Recharts. Premium Magic UI Pro and shadcn/studio sources may accelerate marketing and selected product compositions under license and provenance controls.

## White-Label Model

The experience supports Platform Brand, Customer Brand, White Label, and Platform Partner modes while preserving security semantics, accessibility, legal identity, support identity, and one upgradeable codebase.

## Payment Operating Model

Tenants initially contract directly with banks, wallets, and acquirers. The platform provides software, protected credentials, Payment orchestration, cash controls, and reconciliation. It does not initially pool or custody tenant funds or act as payment facilitator, aggregator, or merchant of record.

Payment uses the dedicated `payment` namespace for detailed contracts. Commerce owns physical cash workflows and customer stored value. Finance owns accounting, receivables, disbursement instructions, and reconciliation interpretation.

## Deployment Model

Strategic modes are multi-tenant SaaS, dedicated cloud, self-hosted enterprise, hybrid, edge nodes, and offline-capable clients.

OpenTofu is the default infrastructure-as-code engine. Initial regional architecture uses one authoritative write region plus isolated recovery; active-active financial writes are not assumed.

## First Beachhead

The provisional first slice is Guyana-first SMB retail:

- Identity, tenancy, permissions, entitlements, devices, and audit
- Party/customer basics
- Catalog, barcode, pricing, and prototype tax
- Inventory ledger, counts, adjustments, and transfer seam
- POS, registers, cash, deposits, returns, exchanges, and receipts
- Payment provider seam and uncertainty handling
- Commerce-owned stored value
- Offline continuity and synchronization
- Privacy and deletion-journal prototype
- Webhook prototype
- Bounded Finance accountant handoff

Capability depth is explicitly `full`, `prototype`, or `seam` in `registry/first-slice.json`.

Deferred: production storefront, tenant recurring commerce, memberships, advanced loyalty, full General Ledger, financial reporting, self-checkout, customer-account tender, production fiscal submission, broad autonomous AI, and unverified terminal coverage.

## Quality and Contract Model

The blueprint now includes:

- Provisional UX, latency, capacity, SLO, RPO, and RTO budgets
- Draft OpenAPI 3.1 contract
- JSON Schemas for events, offline sync, providers, import/export, Finance handoff, webhooks, and AI registries
- Endpoint-permission manifest
- Capability metadata and test matrix
- Architecture dependency rules
- Read-only CI validation and deterministic registry generation

These are implementation-review contracts, not production evidence.

## Source-of-Truth Links

- Constitution: `00-Foundation/CONSTITUTION.md`
- Glossary: `00-Foundation/GLOSSARY.md`
- Kernel: `01-Platform/PLATFORM_KERNEL_OVERVIEW.md`
- Capability map: `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`
- Capability amendment: `04-Business-Domains/CAPABILITY_MAP_AMENDMENT-2026-07-11.md`
- First slice: `17-Roadmap/FIRST_SLICE_MANIFEST.md`
- Founder decisions: `20-Strategy/FOUNDER_DECISION_REGISTER.md`
- ADRs: `18-Decisions/`
- Contracts: `openapi/` and `schemas/`
- Registries: `registry/`
- Third audit and disposition: `reviews/`
