---
document_id: PDA-ENG-001
title: Business Engines Overview
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Business Engines Overview

## Purpose

Business engines provide reusable, domain-neutral behavior consumed across multiple business domains. They prevent duplicated logic and create consistent rules, audit, APIs, configuration, and user experiences.

## Initial Engines

- Workflow
- Approval
- Rules
- Automation
- Pricing
- Tax
- Payment
- Promotion and discount
- Loyalty
- Fiscalization and statutory reporting
- Document and template
- Scheduling and calendar
- Branding and theme
- Workspace and navigation
- Dashboard and widget
- Reporting and analytics
- AI orchestration

## Engine Rules

1. Engines expose stable contracts and avoid owning domain-specific authoritative records.
2. Domain policy enters through configuration, adapters, and governed extension points.
3. Every engine must be tenant-aware, entitlement-aware, permission-aware, auditable, observable, API-accessible, and testable.
4. Engines may publish events but must not create hidden cross-domain ownership.
5. Engine configuration must be versioned, effective-dated where relevant, and rollback-capable.
6. Extensions may add providers, rules, templates, models, prompts, or adapters only through published contracts.
7. A referenced engine must have an owning specification and registered capability family before production implementation depends on it.

## Kernel and Engine Boundary

The kernel owns primitives needed by every deployment, such as jobs, event transport, notifications, files, search indexing, tenancy, permissions, entitlements, audit, numbering, custom metadata, collaboration, quotas, and import/export orchestration.

Engines own reusable business orchestration layered on those primitives. Examples:

- The Notification primitive delivers messages; communication workflows and campaigns may orchestrate through domain or engine behavior.
- The Search primitive indexes and retrieves permission-filtered data; reporting, analytics, forecasting, and AI retrieval add higher-order behavior.
- The Jobs primitive executes work; Workflow and Automation define governed business execution.
- The Sequence primitive allocates references; Fiscalization applies jurisdiction-specific legal numbering and submission rules.
- The Party primitive identifies people and organizations; Loyalty owns program membership and non-cash benefit ledgers.

## Composition

Domains invoke engines through application contracts. Example: Commerce asks Pricing to calculate a sale, Tax to calculate tax, Payments to authorize funds, Loyalty to quote earn or redemption, Documents to render a receipt, Fiscalization to obtain statutory acceptance, Workflow to manage exceptions, and AI Orchestration to assist through approved tools.

## Delivery Principle

Build only the engine capabilities required by validated vertical slices, while preserving the long-term contracts defined here.
