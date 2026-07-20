---
document_id: PDA-ENG-019
title: Business DNA Engine
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
related_adrs: [ADR-0008]
---

# Business DNA Engine

> **Disambiguation.** A second file also named `BUSINESS_DNA_ENGINE.md` exists at `docs/blueprint/20-Strategy/BUSINESS_DNA_ENGINE.md` (`PDA-STR-012`, titled "Business DNA Strategy Rationale"). This document (`PDA-ENG-019`) is the sole architectural and data-model authority; the 20-Strategy file is non-normative business rationale only and explicitly defers to this one on any conflict. Confirm the directory when citing either by filename alone.

## Purpose

Own the governed recommendation and onboarding engine that translates explicit business facts, approved evidence, industry defaults, jurisdiction requirements, and observed configuration into explainable platform setup recommendations.

## Architectural Position

Business DNA is a shared engine because Product, Implementation, Sales, Customer Success, onboarding, workspace composition, entitlement recommendations, industry packs, reporting, automation, and AI all consume the same business profile and recommendation logic.

It does not own the authoritative operational data described by the profile. Party, Organizations, Catalog, Inventory, Commerce, Workforce, Finance, and other domains remain authoritative for their records.

The engine registration is:

`engine.business-dna`

Detailed configuration continues to use platform configuration, metadata, industry-pack, and jurisdiction-pack contracts rather than introducing a new identifier namespace prematurely.

## Core Entities

- Business DNA Profile
- Profile Version
- Evidence Item
- Question and Answer
- Derived Attribute
- Recommendation
- Recommendation Explanation
- Accepted or Rejected Recommendation
- Readiness Gap
- Implementation Path
- Review and Expiry Schedule

## Profile Dimensions

- Industry and subindustry
- Business and revenue model
- Customer, supplier, and workforce structure
- Locations, stores, warehouses, channels, and legal entities
- Currencies, countries, tax, and jurisdiction obligations
- Catalog, inventory, lot, serial, expiry, and warehouse complexity
- Commerce, service, project, rental, fleet, manufacturing, and asset needs
- Payment and collection model
- Offline and device requirements
- Integration landscape
- Reporting and control maturity
- Automation and AI maturity
- Security, privacy, and risk profile

## Evidence Types

- Explicit customer answer
- Imported configuration
- Verified domain fact
- Industry-pack default
- Jurisdiction requirement
- Implementation observation
- Approved user preference
- AI-assisted inference

Every evidence item records source, date, owner, confidence, classification, purpose, and expiry. AI inference is never presented as a verified fact.

## Recommendation Outputs

- Suggested first workspace and navigation
- Capability and edition recommendation
- Entitlement and usage estimate
- Required configuration
- Suggested roles and permission templates
- Migration and integration path
- Suggested dashboards and reports
- Required controls and approvals
- Jurisdiction and provider readiness gaps
- Suggested implementation sequence
- Optional AI and automation maturity path

A recommendation does not purchase a capability, grant access, create a legal obligation, or alter authoritative data without explicit approval.

## Lifecycle

Profile states:

- Draft
- Collecting Evidence
- Review Required
- Reviewed
- Active
- Stale
- Superseded
- Archived

Recommendation states:

- Proposed
- Explained
- Accepted
- Rejected
- Applied
- Partially Applied
- Expired
- Superseded

## Explainability

Every recommendation states:

- What is recommended
- Why
- Evidence used
- Confidence
- Cost or operational consequence where known
- Required decision maker
- Alternative choices
- Reversal or reset behavior

## Privacy and Fairness

- Collect only information needed for configuration and customer outcomes.
- Do not infer protected or sensitive traits without an approved purpose.
- No hidden cross-tenant profiling.
- Customers can inspect, correct, reject, export, and reset profile data.
- Profile data follows classification, retention, legal hold, and erasure policy.
- Recommendations affecting people, credit, employment, access, or regulated treatment require separate domain governance.

## AI Boundary

AI may assist question selection, summarization, explanation, and low-risk recommendation generation. Deterministic rules and jurisdiction requirements remain explicit. AI-generated recommendations enter the same review, provenance, evaluation, and incident controls as other AI outputs.

## Events

- `platform.business-dna-profile.created.v1`
- `platform.business-dna-profile.reviewed.v1`
- `platform.business-dna-profile.stale-detected.v1`
- `platform.business-dna-recommendation.created.v1`
- `platform.business-dna-recommendation.accepted.v1`
- `platform.business-dna-recommendation.rejected.v1`
- `platform.business-dna-recommendation.applied.v1`

## Quality Gates

- Source and confidence completeness
- Recommendation explanation
- Tenant isolation
- Sensitive-attribute review
- Customer correction and reset
- Recommendation accuracy against reviewed implementations
- Time-to-first-value improvement
- Rejection and override analysis
- Industry and jurisdiction validation
- AI evaluation where AI contributes

## Initial Scope

The first implementation is a guided questionnaire plus rules-based recommendations for the Guyana retail foundation slice. Continuous optimization, broad AI inference, and cross-customer benchmarking are deferred until customer evidence, privacy controls, and measurement exist.