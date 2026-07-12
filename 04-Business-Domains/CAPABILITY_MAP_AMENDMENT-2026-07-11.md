---
document_id: PDA-DOM-090
title: Capability Map Amendment 2026-07-11
version: 0.2.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0007, ADR-0016, ADR-0017]
---

# Capability Map Amendment — 2026-07-11

## Purpose

Amend the Business Capability Map for ownership and namespaces introduced after version 0.3.0 without silently rewriting historical audit evidence.

This document is a canonical capability source consumed by the registry generator. The next consolidated capability-map revision should fold these entries into the main map and supersede this amendment.

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

- These identifiers have the same status and lifecycle requirements as capabilities in `BUSINESS_CAPABILITY_MAP.md`.
- A capability listed here must resolve to an authoritative namespace owner.
- First-slice depth is recorded separately in `registry/first-slice.json`.
- Permissions, events, APIs, packaging, offline behavior, and test declarations remain separate governed artifacts.
- This amendment does not grant entitlements or permissions.
