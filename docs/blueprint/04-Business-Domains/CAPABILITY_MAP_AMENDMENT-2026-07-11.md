---
document_id: PDA-DOM-090
title: Capability Map Amendment 2026-07-11
version: 0.3.0
status: Superseded
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0007, ADR-0016, ADR-0017]
superseded_by: PDA-DOM-021 v0.4.0
---

# Capability Map Amendment — 2026-07-11

## Purpose

Preserve the dated amendment that introduced Party, Payment, and Business DNA identifiers after Business Capability Map version 0.3.0.

Business Capability Map version 0.4.0 incorporated these identifiers without renaming, lifecycle promotion, first-slice change, or contract change. This document is no longer parsed as a canonical capability source. It remains historical evidence for provenance and must not direct new registration work.

## Party and Relationships

- `party.records`
- `party.contact-points`
- `party.addresses`
- `party.identifiers`
- `party.relationships`
- `party.duplicate-detection`
- `party.merge`
- `party.identity-links`
- `party.privacy-state`

`platform.party` is a deprecated draft alias. New implementation and first-slice scope use `party.records` and the dedicated `party` namespace.

## Payment Orchestration

- `payment.intents`
- `payment.methods`
- `payment.provider-adapters`
- `payment.authorization`
- `payment.capture`
- `payment.refunds`
- `payment.reversals`
- `payment.disputes`
- `payment.settlement`
- `payment.reconciliation`
- `payment.terminals`
- `payment.offline-policy`

`engine.payments` remains the top-level shared-engine registration. Detailed contracts use `payment.*` under ADR-0017.

## Business DNA

- `engine.business-dna`

Business DNA remains a shared-engine registration. Its profile data and recommendations use governed Platform Configuration, Extensible Metadata, Industry Pack, Jurisdiction Pack, and AI contracts.

`commerce.customer-account-sales` is already present in the main Business Capability Map and is explicitly deferred from the first slice.

## Governance Rules

- The current identifiers and their lifecycle requirements resolve through `BUSINESS_CAPABILITY_MAP.md` version 0.4.0 or later.
- A capability listed here must resolve to an authoritative namespace owner.
- First-slice depth is recorded separately in `registry/first-slice.json`.
- Permissions, events, APIs, packaging, offline behavior, and test declarations remain separate governed artifacts.
- This amendment does not grant entitlements or permissions.

## Supersession Evidence

- Successor: PDA-DOM-021 version 0.4.0
- Consolidated families: Party and Relationships, Payment Orchestration, and Business DNA
- Identifier delta: none
- Owner delta: none
- First-slice depth delta: none
- Permission, event, API, packaging, and offline delta: none
- Registry generator action: remove this document from `CAPABILITY_SOURCES` after equality validation
