---
document_id: PDA-FND-014
title: Platform Glossary
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0007, ADR-0013, ADR-0014, ADR-0015]
---

# Platform Glossary

## Purpose

This glossary establishes canonical meanings for platform-wide terms. Domain specifications may add specialized vocabulary but may not redefine these terms without an approved decision.

## Core Platform Terms

### Platform

The complete shared system of kernel services, business engines, domains, experience layers, AI, data, extensions, deployment, and operations.

### Domain

A bounded area of business responsibility that owns authoritative behavior and data for a coherent set of concepts.

### Capability

A discrete ability the platform provides to a user, organization, integration, or administrator. Capabilities may be entitled, permissioned, measured, documented, and matured independently.

### Module

A commercially or operationally packaged grouping of related capabilities. A module is not automatically an independently deployed service. Use “domain,” “capability,” “engine,” “extension,” or “bundle” when more precise.

### Engine

Reusable domain-neutral business logic consumed by multiple domains, such as pricing, tax, workflow, approvals, loyalty, fiscalization, documents, or AI orchestration. An engine must not silently become the authoritative owner of domain transactions.

### Platform Service

A shared technical or operational service required across the platform, such as identity, Party, audit, search, jobs, configuration, files, privacy, quotas, or observability.

### Industry Pack

A governed assembly of capabilities, workflows, terminology, reports, templates, integrations, dashboards, permissions, jurisdiction controls, and defaults tailored to an industry without creating an avoidable source-code fork.

### Workspace

A role- and task-focused experience composed of navigation, queues, dashboards, widgets, and actions. A workspace is not a security boundary.

### Extension

An independently installed addition that uses published platform contracts. Extensions include plugins, themes, widgets, reports, workflow packs, integrations, and AI skills.

### Integration

A governed connection between the platform and an external system, device, service, or data source.

## Party and Organization Terms

### Party

A stable tenant-scoped representation of a real-world person or organization. Party owns shared identity and relationships, while business domains own role-specific behavior.

### Domain Role

A domain-owned record that links to a Party and adds context such as Customer Relationship Profile, Supplier Commercial Profile, Employment, or Partner Account.

### Tenant

The highest runtime isolation boundary for customer or partner data, configuration, identity context, and operations.

### Organization

A governed business or institutional grouping inside a tenant. Depending on the commercial model, a tenant may contain one or more organizations.

### Legal Entity

A company, corporation, nonprofit, government body, or other juridical unit with its own legal, tax, accounting, payroll, or reporting obligations.

### Business Unit

An internal organizational division used for management, reporting, responsibility, or access without necessarily being a separate legal entity.

### Branch

An organizational operating unit associated with management, reporting, and often a physical or commercial presence.

### Location

A generalized place where operations occur. A location may be physical, virtual, mobile, or logical.

### Store

A customer-facing sales location, physical or virtual, configured for commerce workflows.

### Warehouse

A location configured for storage, receiving, picking, packing, transfers, and inventory control.

### Site

A broad physical operational place that may contain multiple branches, stores, warehouses, departments, or facilities.

### Partner or Reseller

An authorized intermediary that may brand, sell, configure, support, and administer customer tenants under delegated platform authority.

## Access and Commercial Terms

### Entitlement

The organization-level right to use a capability, usually derived from a Platform Subscription, contract, trial, grant, or partner policy.

### Permission

The actor-level right to perform a specific action on a resource or capability.

### Role

A named collection of permissions and policies assigned to users or service identities.

### Policy

A rule that evaluates context to allow, deny, require approval, or constrain an action.

### Scope

The boundary within which access applies, such as tenant, organization, legal entity, branch, location, department, record set, or data classification.

### Feature Flag

An operational control used to release, test, or disable implementation behavior. A feature flag is not a substitute for an entitlement or permission.

### Plan

A commercial bundle of entitlements, limits, support, and service terms.

### Platform Subscription

The commercial contract through which a tenant, partner, or reseller buys access to the Business Operating Platform. Use this qualified term when confusion with tenant-sold recurring services is possible.

### Recurring Agreement

A Commerce-owned agreement through which a tenant sells a membership, retainer, service plan, recurring donation, replenishment program, tuition plan, or other recurring promise to its own customer.

### Add-on

An optional commercially packaged capability or service attached to a base plan or domain bundle.

### Meter

A measured dimension used for limits, analytics, or billing, such as active users, transactions, storage, AI tokens, or warehouse locations.

### Limit

A maximum or threshold applied by entitlement or policy.

## Payment and Value Terms

### Payment Rail

A method or provider network used to transfer or evidence value, such as cash, bank transfer, card, wallet, direct debit, or request-to-pay.

### Stored Value

A monetary obligation issued by a tenant to a customer, including gift cards, store credit, refund credit, or prepaid balances. Commerce owns the operational stored-value ledger.

### Loyalty Value

Non-cash points or benefits governed by a loyalty program. Loyalty value is not automatically money, stored value, or an account receivable.

### Payment Facilitator or Aggregator

An operating model in which a platform or sponsor onboards sub-merchants and may control merchant processing, settlement, KYC, reserves, or related regulated obligations. The platform does not assume this role in the initial architecture.

### Direct Tenant Merchant Contract

The initial payment model in which each tenant contracts directly with its bank, wallet, or acquiring provider while the platform supplies software, protected credentials, orchestration, and reconciliation.

## Data and Architecture Terms

### Authoritative Source

The domain or system responsible for the official current state and rules of a record or concept.

### Projection

A derived, non-authoritative representation optimized for reading, search, reporting, analytics, integration, webhook delivery, or offline use.

### Command

A request to perform an action or change state.

### Event

A versioned statement that a completed business or platform fact occurred.

### Ledger

An append-oriented record of consequential entries whose economic or evidentiary history remains trustworthy, typically corrected by reversal or adjustment rather than deletion.

### Privacy Transformation

A governed deletion, restriction, generalization, redaction, or irreversible pseudonymization of identity attributes that preserves required business and evidentiary facts under ADR-0014.

### Deletion Journal

An append-oriented record of privacy-transformation tasks, targets, retries, acknowledgements, exceptions, and evidence.

### Master Data

Shared, relatively stable business entities such as products, Parties, locations, units, currencies, and accounts that require governance and consistent identity.

### Transaction Data

Records created by business activity, such as orders, receipts, stock movements, invoices, pay runs, or journal entries.

### Reference Data

Controlled values used to classify or configure records, such as status codes, tax categories, country codes, and units of measure.

### Idempotency

The property that repeated execution of the same operation does not create unintended duplicate business effects.

### Consistency Boundary

The set of state changes that must succeed or fail together under one authoritative transaction or controlled workflow.

## Experience Terms

### Progressive Disclosure

The practice of showing essential information first and revealing advanced complexity only when relevant.

### Design Token

A governed value for color, typography, spacing, elevation, motion, shape, or other visual semantics used by the design system and branding engine.

### Theme

A configured set of approved design tokens and assets that changes presentation without changing business behavior.

### White Label

A governed configuration in which the platform is presented under a customer or partner identity while remaining on the shared platform architecture.

### Terminology Mapping

A controlled presentation-layer substitution that lets a business use preferred labels without changing canonical internal meanings.

## AI Terms

### AI Assistant

A user-facing AI capability that explains, summarizes, recommends, drafts, or acts through governed platform tools.

### AI Agent

An AI process that plans or executes multi-step work within explicit goals, tools, permissions, budgets, approvals, and audit requirements.

### AI Tool

A permissioned platform operation that an AI model may invoke.

### AI Skill

A packaged capability containing prompts, tools, policies, evaluations, and presentation behavior for a defined task.

### Human-in-the-Loop

A control requiring human review, confirmation, correction, or approval before or during AI-assisted work.

### Provenance

The traceable origin of information, model outputs, tool calls, evidence, and resulting actions.

## Lifecycle Terms

### Draft

Content under active development and not yet authoritative for implementation.

### Approved

Reviewed content authorized to guide implementation within its scope.

### Ratified

A highest-authority approved state reserved for foundational governance documents.

### Deprecated

Still available for history but no longer recommended for new use.

### Superseded

Replaced by a newer document, contract, or decision.