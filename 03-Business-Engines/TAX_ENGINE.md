---
document_id: PDA-ENG-007
title: Tax Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Tax Engine

## Purpose

Provide jurisdiction-aware tax determination, calculation, exemption, evidence, reporting, and provider integration across commerce, procurement, finance, payroll, assets, and other domains.

## Core Capabilities

- Jurisdictions, registrations, nexus, and establishments
- Tax codes, categories, rates, exemptions, and inclusive or exclusive pricing
- Compound, withholding, reverse-charge, and recoverability hooks
- Place-of-supply and customer or supplier status rules
- Effective dating and historical replay
- External tax-provider adapters and fallback policy
- Calculation evidence and return-reporting outputs

## Rules

1. Tax results must preserve jurisdiction, rule version, rate, base, rounding, exemption, and evidence.
2. Historical transactions retain the original tax determination unless corrected through governed adjustment.
3. Legal-entity and location context is mandatory.
4. Tax overrides require exceptional permission, reason, and audit.
5. Provider failures must follow explicit fail-open, fail-closed, cached, or deferred policy by workflow.
6. Country-specific behavior belongs in governed jurisdiction packs or adapters.
7. Tax calculations must distinguish transaction, accounting, reporting, and settlement currency.

## Quality Gates

- Jurisdiction and effective-date tests
- Inclusive and exclusive rounding tests
- Exemption and reverse-charge tests
- Provider outage tests
- Historical replay
- Audit-evidence verification
