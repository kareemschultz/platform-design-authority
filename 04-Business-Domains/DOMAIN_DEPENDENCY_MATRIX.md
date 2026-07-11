---
document_id: PDA-DOM-022
title: Domain Dependency Matrix
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0003, ADR-0007, ADR-0009, ADR-0010, ADR-0012, ADR-0013, ADR-0014, ADR-0015]
---

# Domain Dependency Matrix

## Purpose

Define the approved dependency direction between business domains, shared engines, platform services, security services, developer services, and commercial control planes. This matrix prevents circular coupling, duplicated ownership, and hidden cross-domain writes.

## Dependency Rules

- Business domains may depend on the Platform Kernel and approved Shared Engines.
- A domain may consume another domain only through a published query, command, event, or governed projection.
- The consumer may not depend on the producer's private schema or implementation.
- Circular synchronous dependencies are prohibited.
- Cross-domain workflows identify an orchestrator and compensation behavior.
- Party identifies people and organizations; domains own role-specific profiles and transactions.
- Security Risk may recommend or apply approved protective controls but does not become the source-record owner.
- External webhooks are a Developer Platform projection of committed internal events.

## High-Level Matrix

| Consumer Domain or Area | Primary Upstream Dependencies | Typical Contract |
|---|---|---|
| Commerce | Product Catalog, Party, CRM projections, Inventory, Pricing, Tax, Payments, Loyalty, Risk, Fiscalization | Query, command, reservation, event |
| Stored Value within Commerce | Party, Commerce orders and returns, Payments, Risk, Finance projections | Reservation, ledger command, event, reconciliation |
| Storefront and Digital Commerce | Commerce, Product Catalog, Party/CRM, Pricing, Tax, Payments, Branding, Search | API, query, command, webhook |
| Recurring Commerce | Party/CRM, Product Catalog, Pricing, Tax, Payments, Finance, Jobs, Scheduling, Workflow, Loyalty | Schedule, command, event, provider capability |
| Product Catalog | Reference Data, Files, Documents, Extensible Metadata | Query and file contracts |
| Inventory | Product Catalog, Organizations and Locations, Units, Numbering | Query and command |
| Warehouse | Inventory, Product Catalog, Procurement, Commerce | Command, event, projection |
| Procurement | Party, Product Catalog, Inventory, Finance | Query, command, event |
| Finance | All operational domains, Party, Tax, Payments, Fiscalization results | Events, posting commands, reconciliations |
| CRM | Party, Commerce, Service, Marketing, Finance projections | Event and read projection |
| Workforce | Party, Identity, Scheduling, Documents, Assets | Query, command, workflow |
| Payroll | Workforce snapshots, Time, Tax, Payments, Finance | Snapshot, command, event |
| Supply Chain | Commerce, Procurement, Warehouse, Inventory, Fleet, Party | Command, event, provider adapter |
| Manufacturing | Product Catalog, Inventory, Warehouse, Procurement, Assets | Command, event, projection |
| Projects | Party, CRM, Workforce, Finance, Commerce, Service | Query, event, billing input |
| Service | Party, CRM, Product Catalog, Assets, Inventory, Scheduling | Query, command, workflow |
| Assets and Maintenance | Product Catalog, Inventory, Workforce, Finance | Query, command, event |
| Fleet | Assets, Workforce, Maintenance, Finance, Logistics | Query, event, adapter |
| Rental | Party, Product Catalog, Assets, Inventory, Commerce, Finance | Reservation, command, event |
| Marketing | Party, CRM, Commerce, Promotions, Loyalty, Notifications | Projection, command, delivery contract |
| Documents and Knowledge | Files, Identity, Workflow, Search, Collaboration, Extensible Metadata | File, workflow, index contract |
| Governance and Compliance | Audit, Documents, Party, Workforce, Security, Finance | Event, evidence, workflow |
| Planning and Analytics | All domains through governed analytical models | Projection and batch feed |
| Security Risk | Identity, Payments, Commerce, Stored Value, Inventory, Payroll, APIs, Audit | Authorized signal, assessment, protective command |
| Privacy Rights | Party, all personal-data domains, Search, AI, Devices, Webhooks, Backups | Discovery, deletion journal, acknowledgement |
| Developer Webhooks | Event Backbone, Authorization, Quotas, Secrets | Event projection, signed delivery, replay |

## Core Data Ownership

| Concept | Authoritative Owner |
|---|---|
| Canonical person or organization identity | Platform Party Service |
| Authentication account and session | Better Auth through Platform Identity adapter |
| Customer relationship and sales context | CRM |
| Supplier commercial relationship | Procurement |
| Worker and employment relationship | Workforce |
| Product definition | Product Catalog |
| Price calculation | Pricing Engine |
| Tax determination and return data | Tax Engine |
| Statutory packaging, submission, and acknowledgement | Fiscalization Engine |
| Loyalty program and non-cash benefit ledger | Loyalty Engine |
| Gift card, store credit, refund credit, and customer stored-value ledger | Commerce Stored Value |
| Tender orchestration and provider payment state | Payment Engine |
| Platform commercial subscription and billing contract | Commercial Control Plane |
| Tenant customer recurring agreement | Commerce Recurring Commerce |
| Sales order | Commerce |
| Storefront presentation and checkout orchestration | Commerce Storefront capability |
| Stock ledger | Inventory |
| Warehouse task | Warehouse |
| Purchase order | Procurement |
| Shipment | Supply Chain and Logistics |
| General-ledger entry | Finance |
| Payroll result | Payroll |
| Production order | Manufacturing |
| Project | Projects |
| Service case | Service and Help Desk |
| Operational asset | Assets and Maintenance |
| Vehicle operations | Fleet |
| Rental agreement | Rental |
| Campaign and landing-page content | Marketing |
| Controlled document and knowledge article | Documents and Knowledge |
| Enterprise risk, obligation, and control | Governance and Compliance |
| Transactional risk assessment and risk case | Security Risk Service |
| Privacy case and deletion journal | Security Privacy Service |
| External webhook subscription and delivery attempt | Developer Platform |
| Plan and forecast | Planning and Analytics |

## Shared Engine Usage

| Engine | Principal Consumers |
|---|---|
| Workflow | All domains |
| Approvals | Finance, Procurement, Inventory, Workforce, Payroll, Governance, Risk |
| Rules | All domains |
| Automation | All domains |
| Pricing | Commerce, Rental, Service, Procurement, Recurring Commerce |
| Tax | Commerce, Procurement, Finance, Payroll, Recurring Commerce; provides calculation and return data to Fiscalization |
| Payments | Commerce, Finance, Payroll, Rental, Stored Value, Recurring Commerce |
| Promotions | Commerce and Marketing |
| Loyalty | Commerce, CRM, Marketing, Service, Rental; consumes recurring-agreement state for benefits |
| Fiscalization | Consumes Tax results, Numbering, Documents, and source-domain snapshots; serves Commerce and Finance with statutory status |
| Documents | All document-producing domains and Fiscalization |
| Scheduling | Workforce, Service, Projects, Assets, Fleet, Rental, Logistics, Recurring Commerce |
| Branding | All experience and communication surfaces |
| Workspaces | All user-facing domains |
| Dashboards | All domains |
| Reporting | All domains |
| AI Orchestration | All approved tool-consuming domains |

## Platform and Control-Plane Usage

| Capability | Principal Consumers |
|---|---|
| Party | CRM, Procurement, Workforce, Commerce, Service, Projects, Rental, Governance |
| Extensible Metadata | All extensible records and industry packs |
| Numbering | Commerce, Procurement, Finance, Inventory, Payroll, Stored Value, Fiscalization |
| Import, Export, and Migration | All domains through domain-owned commands and exports |
| Developer Webhooks | External integrations and marketplace applications |
| Quotas and Abuse Controls | APIs, identity, jobs, reports, AI, imports, exports, and webhooks |
| Collaboration | Domains that enable comments, mentions, followers, and assignments |
| Privacy Rights and Erasure | All domains and projections containing personal data |
| Data Classification | Every schema, field, log, export, offline store, search index, and AI contract |
| Security Risk | Identity, Commerce, Stored Value, Payments, Inventory, Payroll, APIs, AI, and administration |
| Commercial Control Plane | Platform entitlements, billing, trials, usage rating, partners, and customer portal |

## Prohibited Dependencies

- Commerce writing Inventory tables
- Warehouse changing purchase-order state directly
- Payroll changing employment records directly
- Finance rewriting operational source transactions or the Commerce stored-value ledger
- Payment Engine owning customer stored-value balances
- CRM, Procurement, or Workforce creating independent duplicate Party identities without governed matching
- Marketing bypassing consent or notification policy
- Loyalty treating gift cards or monetary store credit as points
- Fiscalization recalculating authoritative taxes or rewriting source sales
- Security Risk silently rewriting source-domain state without an approved protective command
- Governance and Compliance replacing transaction-level Risk assessments
- Notifications implementing external webhook subscriptions
- Developer Webhooks becoming the only record of an internal event
- Analytics becoming the operational source of truth
- Industry packs depending on private module implementation
- AI agents bypassing domain contracts

## Review Requirement

Any new dependency not represented here requires architecture review and an update to this matrix before implementation.