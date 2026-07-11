---
document_id: PDA-ENG-007
title: Tax Engine
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0010]
---

# Tax Engine

## Purpose

Provide jurisdiction-aware tax determination, calculation, exemption, evidence, return-data preparation, and provider integration across commerce, procurement, finance, payroll, assets, and other domains.

## Core Capabilities

- Jurisdictions, registrations, nexus, and establishments
- Tax codes, categories, rates, exemptions, and inclusive or exclusive pricing
- Compound, withholding, reverse-charge, and recoverability hooks
- Place-of-supply and customer or supplier status rules
- Effective dating and historical replay
- External tax-provider adapters and fallback policy
- Calculation evidence and structured return-data outputs

## Ownership Boundary

The Tax Engine owns tax determination and the structured facts needed for accounting and statutory reporting.

It does not own:

- General-ledger posting or tax-control-account reconciliation, which Finance owns
- Statutory document packaging, signing, authority submission, acknowledgement, rejection, or return-package transmission, which Fiscalization owns
- Source commercial, procurement, payroll, or asset transactions

Fiscalization consumes tax results and return-data outputs. Finance consumes tax results for accounting and reconciliation.

## Rules

1. Tax results must preserve jurisdiction, rule version, rate, base, rounding, exemption, and evidence.
2. Historical transactions retain the original tax determination unless corrected through governed adjustment.
3. Legal-entity and location context is mandatory.
4. Tax overrides require exceptional permission, reason, and audit.
5. Provider failures must follow explicit fail-open, fail-closed, cached, or deferred policy by workflow.
6. Country-specific behavior belongs in governed jurisdiction packs or adapters.
7. Tax calculations must distinguish transaction, accounting, reporting, and settlement currency.
8. Tax outputs are not considered filed merely because they were calculated.

## Quality Gates

- Jurisdiction and effective-date tests
- Inclusive and exclusive rounding tests
- Exemption and reverse-charge tests
- Provider outage tests
- Historical replay
- Stored-value issuance and redemption tax treatment
- Finance reconciliation contract
- Fiscalization packaging and submission contract
- Audit-evidence verification