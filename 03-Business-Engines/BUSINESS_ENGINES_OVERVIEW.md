---
document_id: PDA-ENG-001
title: Business Engines Overview
version: 0.1.0
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
- Document and template
- Scheduling and calendar
- Branding and theme
- Workspace and navigation
- Dashboard and widget
- Reporting and analytics

## Engine Rules

1. Engines expose stable contracts and avoid owning domain-specific authoritative records.
2. Domain policy enters through configuration, adapters, and governed extension points.
3. Every engine must be tenant-aware, entitlement-aware, permission-aware, auditable, observable, API-accessible, and testable.
4. Engines may publish events but must not create hidden cross-domain ownership.
5. Engine configuration must be versioned, effective-dated where relevant, and rollback-capable.
6. Extensions may add providers, rules, templates, or adapters only through published contracts.

## Composition

Domains invoke engines through application contracts. Example: Commerce asks Pricing to calculate a sale, Tax to calculate tax, Payments to authorize funds, Documents to render a receipt, and Workflow to manage exceptions.

## Delivery Principle

Build only the engine capabilities required by validated vertical slices, while preserving the long-term contracts defined here.
