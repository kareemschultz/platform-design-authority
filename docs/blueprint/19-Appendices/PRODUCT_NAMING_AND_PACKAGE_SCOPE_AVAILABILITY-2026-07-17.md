---
document_id: PDA-APP-026
title: Product Naming and Package Scope Availability Baseline 2026-07-17
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
verified_as_of: 2026-07-17
related_adrs: [ADR-0026]
related_founder_decisions: [FDR-011]
---

# Product Naming and Package Scope Availability Baseline — 2026-07-17

## Purpose

Record the evidence state for ADR-0026 and FDR-011 without treating an internal codename, an existing workspace import, or the absence of a known objection as proof of legal or technical availability.

## Baseline Result

**No product-name, trademark, domain, npm-organization, package-scope, source-hosting organization, app-store, social-identity, or other public-name availability or clearance checks had been performed or evidenced as of 2026-07-17.**

This appendix is a dated record of missing evidence. It is not an availability search, legal opinion, reservation, registration, clearance, or authorization to publish. No inference should be drawn from a name or scope appearing unused in this repository's evidence.

## Candidate Uses and Evidence State

| Candidate use | Current evidence state | Decision consequence |
|---|---|---|
| "Meridian" internal engineering codename | Accepted for internal engineering use by ADR-0026 and the founder approval below | May name workspace internals; may not be treated as a tenant-visible or commercial brand |
| "Meridian" commercial product or company-facing brand | Not checked; not selected | Blocked pending FDR-011 ratification and appropriate legal/market evidence |
| `@meridian/*` private workspace imports | In repository use under ADR-0026 | Allowed for internal workspace resolution only; use does not establish npm ownership or publishing rights |
| `@meridian` npm organization or public package scope | Not checked, claimed, or reserved | Public package publication is prohibited |
| `@pda/*` or `@platform-design-authority/*` fallback scopes | Not checked, claimed, or reserved | Candidates only; neither is an approved or presumed-available fallback |
| Product, company, or defensive domains | No candidates checked or registered by this evidence | Registration and launch are blocked pending selection, authority, and checks |
| Source-hosting organization, app-store, social, and other public identities | Not checked or reserved by this evidence | Public identity claims are blocked pending channel-specific checks |

## Checks Required Before Public Use

The responsible owner must record, at minimum:

1. The exact candidate name, spelling, intended goods/services, markets, jurisdictions, and public channels.
2. Qualified trademark and confusing-similarity review appropriate to the intended jurisdictions and classes.
3. Domain, npm organization/scope, source-hosting organization, app-store, and other relevant identity availability at the time action is authorized.
4. Account ownership, recovery, multi-factor authentication, registrar/registry controls, renewal, and package-publishing controls.
5. License, attribution, white-label, localization, accessibility, and customer-visible presentation implications.
6. The selected outcome, rejected candidates, reservations or registrations actually completed, evidence sources, access date, owner, and revisit triggers.

Availability observations are time-sensitive and do not substitute for registration, contract, legal clearance, or continuing control. Secrets, recovery material, private registration data, and account credentials must not be recorded in this public appendix.

## Current Controls

- Keep "Meridian" out of tenant-visible strings, receipts, emails, public API identifiers, public documentation branding, and marketing claims unless FDR-011 later authorizes a specific use.
- Do not publish packages under `@meridian/*` or any unverified fallback scope.
- Keep canonical capabilities, events, permissions, schemas, and contracts independent of any codename or commercial name.
- A public repository and private-workspace package metadata are not public package publication.

## Decision Evidence

- [Issue #81, owner approval comment 5008157609](https://github.com/kareemschultz/platform-design-authority/issues/81#issuecomment-5008157609) approved the P-W1 F-L-006 decision to create the product-naming founder decision with triggers.
- ADR-0026 governs the internal codename.
- FDR-011 governs the unresolved commercial name and public package scope.

## Reverification Triggers

Replace or supersede this missing-evidence baseline with a completed dated appendix before any trigger listed in FDR-011. Reverify after a material delay, jurisdiction or market expansion, scope change, ownership change, conflict, refusal, challenge, or loss of a reserved identity.
