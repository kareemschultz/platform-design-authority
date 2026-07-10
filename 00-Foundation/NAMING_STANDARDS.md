---
document_id: PDA-FND-010
title: Naming Standards
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Naming Standards

## Purpose

Consistent language is essential for a platform that spans many domains. This document defines naming rules for product terminology, capabilities, records, APIs, events, code, identifiers, and documents.

## General Rules

- Use one canonical term for one concept
- Prefer business language over implementation jargon
- Avoid abbreviations unless widely understood and documented
- Avoid names tied to one industry when the capability is broader
- Use names that remain valid if deployment or technology changes
- Do not use marketing names inside core domain models
- Record approved synonyms in the glossary rather than creating duplicate concepts

## Platform Hierarchy Terms

- **Platform** — the complete shared system
- **Domain** — an area of business ownership and authoritative behavior
- **Capability** — a discrete business or platform ability
- **Module** — a deployable or licensable grouping of capabilities; use carefully
- **Engine** — reusable cross-domain logic
- **Industry Pack** — configuration and content that assembles capabilities for an industry
- **Workspace** — a role- and task-focused user experience
- **Extension** — an independently installed addition using published contracts
- **Integration** — a connection to an external system
- **Entitlement** — an organization’s right to use a capability
- **Permission** — an actor’s right to perform an action

## Record Naming

Business records use singular nouns in domain models and plural nouns for collections.

Examples:

- `Order` and `Orders`
- `Employee` and `Employees`
- `Warehouse` and `Warehouses`
- `PurchaseOrder` and `PurchaseOrders`

Avoid ambiguous generic terms such as `Item`, `Entry`, `Object`, or `Data` unless their meaning is formally constrained.

## API Naming

- Resource names use stable canonical nouns
- URLs use lowercase plural nouns and hyphens where needed
- Commands use explicit verbs
- Avoid exposing database table names
- Version public APIs explicitly
- Use consistent pagination, filtering, sorting, error, and idempotency conventions

Examples:

```text
GET /v1/orders
POST /v1/orders
POST /v1/orders/{orderId}/cancel
POST /v1/inventory-adjustments
```

## Event Naming

Events describe completed facts in past tense.

Pattern:

`<domain>.<entity>.<event>.v<major>`

Examples:

```text
commerce.order.created.v1
commerce.order.cancelled.v1
inventory.stock.adjusted.v1
workforce.employee.hired.v1
payroll.pay-run.posted.v1
```

Commands must not be named as events.

## Permission Naming

Pattern:

`<domain>.<resource>.<action>`

Examples:

```text
commerce.order.read
commerce.order.create
commerce.order.cancel
inventory.adjustment.approve
workforce.employee.compensation.read
payroll.pay-run.post
```

## Capability Naming

Pattern:

`<domain>.<capability>`

Examples:

```text
commerce.pos
commerce.ecommerce
inventory.lot-tracking
warehouse.wave-picking
workforce.performance-management
payroll.multi-jurisdiction
```

Capabilities must not be named after pricing plans.

## Human-Readable Identifiers

Internal primary keys should remain globally unique and opaque. Human-facing references may use configurable prefixes and sequences.

Examples:

```text
ORD-2026-000001
INV-2026-000001
PO-2026-000001
EMP-000001
WH-000001
```

Reference formats must support tenant configuration, collision prevention, fiscal periods, offline allocation, and migration.

## Document Naming

- Foundation and policy documents use uppercase snake case
- ADRs use `ADR-NNNN-DESCRIPTIVE-TITLE.md`
- Domain specifications use stable domain names
- Avoid dates in filenames unless the document is inherently periodic
- Version and status belong in front matter, not filenames

## Prohibited Patterns

- Different names for the same concept across domains without an approved terminology mapping
- Names that encode temporary vendors or frameworks into business concepts
- Plan names used as authorization rules
- `Manager`, `Helper`, `Utility`, or `Service` without a precise responsibility
- Acronyms that are not present in the glossary
