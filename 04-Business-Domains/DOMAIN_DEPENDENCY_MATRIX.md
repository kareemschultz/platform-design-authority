---
document_id: PDA-DOM-022
title: Domain Dependency Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0003, ADR-0007, ADR-0009, ADR-0010]
---

# Domain Dependency Matrix

## Purpose

Define the approved dependency direction between business domains, shared engines, and platform services. This matrix is used to prevent circular coupling, duplicated ownership, and hidden cross-domain writes.

## Dependency Rules

- Business domains may depend on the Platform Kernel and approved Shared Engines.
- A domain may consume another domain only through a published query, command, event, or governed projection.
- The consumer may not depend on the producer's private schema or implementation.
- Circular synchronous dependencies are prohibited.
- Cross-domain workflows must identify an orchestrator and compensation behavior.
- The Party service identifies people and organizations; domains own role-specific relationships and transactions.

## High-Level Matrix

| Consumer Domain | Primary Upstream Dependencies | Typical Contract |
|---|---|---|
| Commerce | Product Catalog, Party, CRM projections, Inventory, Pricing, Tax, Payments, Loyalty, Fiscalization | Query, command, reservation, event |
| Product Catalog | Reference Data, Files, Documents, Extensible Metadata | Query and file contracts |
| Inventory | Product Catalog, Organizations and Locations, Units, Numbering | Query and command |
| Warehouse | Inventory, Product Catalog, Procurement, Commerce | Command, event, projection |
| Procurement | Party, Product Catalog, Inventory, Finance | Query, command, event |
| Finance | All operational domains, Party, Tax, Payments, Fiscalization | Events, posting commands, reconciliations |
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
| Documents and Knowledge | Files, Identity, Workflow, Search, Extensible Metadata | File, workflow, index contract |
| Governance and Compliance | Audit, Documents, Party, Workforce, Security, Finance | Event, evidence, workflow |
| Planning and Analytics | All domains through governed analytical models | Projection and batch feed |

## Core Data Ownership

| Concept | Authoritative Owner |
|---|---|
| Canonical person or organization identity | Platform Party Service |
| Authentication account and session | Better Auth through Platform Identity adapter |
| Customer relationship and sales context | CRM |
| Supplier relationship and procurement context | Procurement |
| Worker and employment relationship | Workforce |
| Product definition | Product Catalog |
| Price calculation | Pricing Engine |
| Tax determination | Tax Engine |
| Loyalty program and non-cash benefit ledger | Loyalty Engine |
| Statutory submission and acknowledgement | Fiscalization Engine |
| Sales order | Commerce |
| Stock ledger | Inventory |
| Warehouse task | Warehouse |
| Purchase order | Procurement |
| Shipment | Supply Chain and Logistics |
| Ledger entry | Finance |
| Payroll result | Payroll |
| Production order | Manufacturing |
| Project | Projects |
| Service case | Service and Help Desk |
| Operational asset | Assets and Maintenance |
| Vehicle operations | Fleet |
| Rental agreement | Rental |
| Campaign | Marketing |
| Controlled document | Documents and Knowledge |
| Risk and control | Governance and Compliance |
| Plan and forecast | Planning and Analytics |

## Shared Engine Usage

| Engine | Principal Consumers |
|---|---|
| Workflow | All domains |
| Approvals | Finance, Procurement, Inventory, Workforce, Payroll, Governance |
| Rules | All domains |
| Automation | All domains |
| Pricing | Commerce, Rental, Service, Procurement |
| Tax | Commerce, Procurement, Finance, Payroll |
| Payments | Commerce, Finance, Payroll, Rental |
| Promotions | Commerce and Marketing |
| Loyalty | Commerce, CRM, Marketing, Service, Rental |
| Fiscalization | Commerce, Finance, Tax, Documents, Procurement where required |
| Documents | All document-producing domains |
| Scheduling | Workforce, Service, Projects, Assets, Fleet, Rental, Logistics |
| Branding | All experience and communication surfaces |
| Workspaces | All user-facing domains |
| Dashboards | All domains |
| Reporting | All domains |
| AI Orchestration | All approved tool-consuming domains |

## Platform Primitive Usage

| Primitive | Principal Consumers |
|---|---|
| Party | CRM, Procurement, Workforce, Commerce, Service, Projects, Rental, Governance |
| Extensible Metadata | All extensible records and industry packs |
| Numbering | Commerce, Procurement, Finance, Inventory, Payroll, Fiscalization |
| Import, Export, and Migration | All domains through domain-owned commands and exports |
| Webhooks | External integrations and marketplace applications |
| Quotas and Abuse Controls | APIs, identity, jobs, reports, AI, imports, exports, and webhooks |
| Collaboration | Domains that enable comments, mentions, followers, and assignments |
| Privacy Rights | All domains that contain personal data |

## Prohibited Dependencies

- Commerce writing Inventory tables
- Warehouse changing purchase-order state directly
- Payroll changing employment records directly
- Finance rewriting operational source transactions
- CRM, Procurement, or Workforce creating independent duplicate Party identities without governed matching
- Marketing bypassing consent or notification policy
- Loyalty treating gift cards or monetary store credit as points
- Fiscalization recalculating authoritative taxes or rewriting source sales
- Analytics becoming the operational source of truth
- Industry packs depending on private module implementation
- AI agents bypassing domain contracts

## Review Requirement

Any new dependency not represented here requires an architecture review and an update to this matrix before implementation.
