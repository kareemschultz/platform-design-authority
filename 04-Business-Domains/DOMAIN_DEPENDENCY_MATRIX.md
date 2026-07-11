---
document_id: PDA-DOM-022
title: Domain Dependency Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Domain Dependency Matrix

## Purpose

Define the approved dependency direction between business domains, shared engines, and platform services. This matrix is used to prevent circular coupling, duplicated ownership, and hidden cross-domain writes.

## Dependency Rules

- Business domains may depend on the Platform Kernel and approved Shared Engines.
- A domain may consume another domain only through a published query, command, event, or governed projection.
- The consumer may not depend on the producer’s private schema or implementation.
- Circular synchronous dependencies are prohibited.
- Cross-domain workflows must identify an orchestrator and compensation behavior.

## High-Level Matrix

| Consumer Domain | Primary Upstream Dependencies | Typical Contract |
|---|---|---|
| Commerce | Product Catalog, CRM, Inventory, Pricing, Tax, Payments | Query, command, reservation, event |
| Product Catalog | Reference Data, Files, Documents | Query and file contracts |
| Inventory | Product Catalog, Locations, Units | Query and command |
| Warehouse | Inventory, Product Catalog, Procurement, Commerce | Command, event, projection |
| Procurement | Product Catalog, CRM or Party, Inventory, Finance | Query, command, event |
| Finance | All operational domains, Tax, Payments | Events, posting commands, reconciliations |
| CRM | Commerce, Service, Marketing, Finance projections | Event and read projection |
| Workforce | Identity, Scheduling, Documents, Assets | Query, command, workflow |
| Payroll | Workforce, Time, Tax, Payments, Finance | Snapshot, command, event |
| Supply Chain | Commerce, Procurement, Warehouse, Inventory, Fleet | Command, event, provider adapter |
| Manufacturing | Product Catalog, Inventory, Warehouse, Procurement, Assets | Command, event, projection |
| Projects | CRM, Workforce, Finance, Commerce, Service | Query, event, billing input |
| Service | CRM, Product Catalog, Assets, Inventory, Scheduling | Query, command, workflow |
| Assets and Maintenance | Product Catalog, Inventory, Workforce, Finance | Query, command, event |
| Fleet | Assets, Workforce, Maintenance, Finance, Logistics | Query, event, adapter |
| Rental | Product Catalog, Assets, Inventory, Commerce, Finance | Reservation, command, event |
| Marketing | CRM, Commerce, Promotions, Notifications | Projection, command, delivery contract |
| Documents and Knowledge | Files, Identity, Workflow, Search | File, workflow, index contract |
| Governance and Compliance | Audit, Documents, Workforce, Security, Finance | Event, evidence, workflow |
| Planning and Analytics | All domains through governed analytical models | Projection and batch feed |

## Core Data Ownership

| Concept | Authoritative Owner |
|---|---|
| Product definition | Product Catalog |
| Price calculation | Pricing Engine |
| Tax determination | Tax Engine |
| Customer relationship | CRM |
| Sales order | Commerce |
| Stock ledger | Inventory |
| Warehouse task | Warehouse |
| Purchase order | Procurement |
| Shipment | Supply Chain and Logistics |
| Ledger entry | Finance |
| Worker and employment | Workforce |
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
| Documents | All document-producing domains |
| Scheduling | Workforce, Service, Projects, Assets, Fleet, Rental, Logistics |
| Branding | All experience and communication surfaces |
| Workspaces | All user-facing domains |
| Dashboards | All domains |
| Reporting | All domains |

## Prohibited Dependencies

- Commerce writing Inventory tables
- Warehouse changing purchase-order state directly
- Payroll changing employment records directly
- Finance rewriting operational source transactions
- Marketing bypassing consent or notification policy
- Analytics becoming the operational source of truth
- Industry packs depending on private module implementation
- AI agents bypassing domain contracts

## Review Requirement

Any new dependency not represented here requires an architecture review and an update to this matrix before implementation.
