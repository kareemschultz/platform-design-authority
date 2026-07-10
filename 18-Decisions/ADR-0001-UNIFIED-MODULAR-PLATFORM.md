---
document_id: ADR-0001
title: Adopt a Unified Modular Business Operating Platform
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0001 — Adopt a Unified Modular Business Operating Platform

## Context

Earlier product concepts separated retail, e-commerce, warehouse operations, HR, payroll, and related capabilities under distinct product identities. The new direction is to rebuild from first principles under one public brand and one technical platform while allowing customers to purchase and use only the capabilities relevant to them.

The platform must support small businesses, multi-location operators, enterprises, resellers, and multiple industries without producing disconnected applications or overwhelming users.

## Decision Drivers

- One coherent customer and administrator experience
- Reuse of shared identity, data, workflow, reporting, security, AI, billing, and integration capabilities
- Feature-level packaging and paywalls
- Role-based simplicity despite broad platform scope
- White-label and reseller support
- Long-term maintainability and upgradeability
- Ability to add new industries without creating product forks

## Options Considered

### Option A — Maintain separate products

Keep retail, workforce, warehouse, e-commerce, and future systems as separately branded and engineered products.

**Strengths:** Clear initial positioning and independent release cycles.  
**Weaknesses:** Duplicated services, fragmented data, inconsistent UX, expensive integrations, and increasing divergence.

### Option B — Build a monolithic all-in-one ERP

Place every feature in one application with broad shared data access and plan-based menu hiding.

**Strengths:** Fast early development and straightforward deployment.  
**Weaknesses:** Tight coupling, poor capability boundaries, difficult testing, unsafe paywalls, and overwhelming interfaces.

### Option C — Unified modular platform

Build one platform kernel with shared engines and independently governed business domains. Present one brand while using entitlements, permissions, workspaces, and industry packs to compose each customer’s experience.

**Strengths:** Reuse, consistent UX, commercial flexibility, partner support, and controlled extensibility.  
**Weaknesses:** Requires stronger architecture, governance, domain contracts, and upfront specification.

## Decision

Adopt **Option C: Unified modular platform**.

The platform will use:

- One public platform identity, with branding configurable later
- One platform kernel
- Reusable cross-domain business engines
- Domain-owned authoritative data
- Capability-level entitlements separated from user permissions
- Role-based workspaces and progressive disclosure
- Configuration-based industry packs
- Customer and partner white-label modes
- API, event, and extension contracts for interoperability

Retail, e-commerce, POS, warehouse, HR, payroll, finance, CRM, manufacturing, and other areas will be platform domains or capability groups, not separately engineered products.

## Rationale

This approach best supports the founder’s goal of selling different combinations of capabilities to different businesses without maintaining separate systems. It also protects user simplicity by composing navigation and workflows around roles rather than exposing the platform’s full breadth to everyone.

## Consequences

### Positive

- Shared services are built once and reused
- Customers can activate only what they need
- Cross-domain reporting and automation become possible
- White-label and reseller models can use the same platform
- New industry solutions can be assembled without forks

### Negative

- Domain boundaries and contracts must be designed carefully
- Entitlements, permissions, and feature flags require separate governance
- Early delivery may be slower than building an unstructured monolith
- Documentation and architecture review become mandatory disciplines

### Risks

- **Risk:** The platform becomes a distributed monolith.  
  **Mitigation:** Enforce domain ownership, contract tests, dependency rules, and event/API boundaries.

- **Risk:** The broad feature map overwhelms customers.  
  **Mitigation:** Use role-based workspaces, progressive disclosure, presets, guided onboarding, and entitlement-aware navigation.

- **Risk:** Excessive modularity creates operational complexity.  
  **Mitigation:** Begin with a modular monolith where appropriate while preserving logical domain boundaries and extraction paths.

## Platform Impact

- **Domains affected:** All
- **Shared engines affected:** All
- **Data ownership:** Domain-owned with governed master-data references
- **Security:** Tenant, entitlement, permission, and policy checks required at every access layer
- **Commercial:** Base platform plus domains, add-ons, industry packs, usage, and service tiers
- **UX:** Workspace-based navigation and capability-aware interfaces
- **Mobile/offline:** Defined per capability
- **AI:** Permission- and entitlement-aware tool access
- **Operations:** Capability and tenant context included in telemetry and audit records

## Validation

The decision is validated when:

- The capability map assigns every initial capability to one owner
- The entitlement model can disable a capability across UI, API, jobs, reports, automation, and AI
- At least three distinct industry solutions can be composed without application forks
- A partner can brand and manage customer tenants from the same platform
- Role-based usability testing shows users are not exposed to irrelevant domains

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Kareem Schultz | Founder | Pending | | |
| Independent reviewer | Architecture | Pending | | |
| Independent reviewer | UX | Pending | | |
| Independent reviewer | Security | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-10 | Platform Design Authority | Initial proposal |
