---
document_id: PDA-STR-012
title: Business DNA Strategy Rationale
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Business DNA Strategy Rationale

## Purpose

Explain the strategic reason for a governed Business DNA capability. The sole architectural and data-model authority is `docs/blueprint/03-Business-Engines/BUSINESS_DNA_ENGINE.md` (`PDA-ENG-019`). This strategy document cannot add dimensions, entities, ownership, lifecycle, or implementation rules independently.

## Authority Boundary

If this rationale differs from PDA-ENG-019, PDA-ENG-019 governs. Changes to the profile schema or recommendation behavior must be made in that engine specification and propagated here only as non-normative context.

## Non-Normative Strategy Questions

- Industry and subindustry
- Business model
- Revenue and payment models
- Organization size and growth stage
- Countries, jurisdictions, currencies, and languages
- Legal entities, locations, stores, warehouses, and channels
- Customer and supplier structure
- Inventory, lot, serial, expiry, and warehouse complexity
- Manufacturing, projects, service, rental, fleet, and asset needs
- Workforce, payroll, scheduling, and compliance
- Digital maturity
- Offline and device requirements
- Automation and AI maturity
- Risk and control profile
- Integration landscape

## Strategy Constraints

PDA-ENG-019 defines Business DNA as versioned configuration and evidence, not an unrestricted AI profile. Strategically, it may draw on:

- Explicit answers
- Imported organizational facts
- Observed platform configuration
- Approved recommendations
- Industry and jurisdiction pack defaults

## Outputs

- Recommended edition and capability set
- Role workspaces and navigation
- Onboarding path
- Configuration defaults
- Required controls and approvals
- Suggested reports and dashboards
- Integration and migration plan
- AI and automation maturity recommendations
- Readiness gaps and implementation effort

## Rules

1. Recommendations never grant permissions or purchase capabilities automatically without approval.
2. Source and confidence are visible.
3. Customers can edit, reject, or reset recommendations.
4. Sensitive attributes are minimized and classified.
5. No hidden cross-tenant profiling.
6. Jurisdiction rules override generic recommendations.
7. Business DNA does not replace canonical domain data.
8. Changes are versioned and explainable.

## Onboarding

Use progressive discovery rather than a massive questionnaire. Begin with high-value questions, infer only low-risk defaults, and request detail when a capability or legal requirement depends on it.

## Maturity

- Manual guided questionnaire
- Rules-based recommendations
- Evidence-assisted configuration
- AI-assisted explanation and gap analysis
- Continuous approved optimization

## Quality Gates

- Recommendation accuracy
- Customer acceptance and correction rate
- Time to first value
- Privacy and fairness review
- Industry and jurisdiction validation
- Explanation quality
- Rollback and reset
