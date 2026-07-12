---
document_id: ADR-0017
title: Register Dedicated Payment Namespace
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-11
last_reviewed: 2026-07-11
supersedes: null
superseded_by: null
related_adrs: [ADR-0011, ADR-0015, ADR-0016]
---

# ADR-0017 — Register Dedicated Payment Namespace

## Context

The capability map registers the shared engine as `engine.payments`, while first-slice permissions used identifiers such as `engine.payment-intent.create`. Using the broad `engine` namespace for detailed Payment contracts makes ownership ambiguous and differs from the dedicated AI, Loyalty, and Fiscalization families.

## Decision

Register the dedicated namespace:

`payment`

The Payment Engine remains registered at the top level as:

`engine.payments`

Detailed Payment capabilities, permissions, APIs, schemas, and events use `payment.*`.

Examples:

- `payment.intent.create`
- `payment.intent.confirm`
- `payment.reconciliation.create`
- `payment.intent.captured.v1`
- `payment.intent.uncertain.v1`
- `payment.settlement.reconciled.v1`

## Ownership

The Payment Engine owns tender orchestration, provider-adapter state, payment intent lifecycle, provider capability declarations, settlement evidence, and payment reconciliation.

Commerce owns sales, returns, cash, and customer stored value. Finance owns accounting interpretation. Providers own regulated payment execution and settlement under direct tenant-provider contracts.

## Consequences

### Positive

- Detailed Payment contracts resolve to one owner.
- Permissions no longer squat on the generic `engine` prefix.
- Event and SDK generation becomes consistent with other substantial engine families.
- Provider-specific names remain outside platform contracts.

### Negative

- Existing draft permission and API examples must be renamed.
- Generated registries and any prototype code must migrate before implementation.

## Required Controls

- Register `payment` in `registry/domains.json`.
- Add detailed `payment.*` capabilities to the capability map.
- Rename first-slice Payment permissions and API mappings.
- Define canonical Payment events.
- Keep `engine.payments` as the engine registration only.
- Do not use this namespace decision to imply custody, payment facilitation, aggregation, or merchant-of-record behavior.

## Validation

The decision is validated when all detailed Payment identifiers use `payment.*`, generated registries resolve them to the Payment Engine, and no governed permission uses `engine.payment*`.

## Review Record

Fourth-audit remediation confirms this Proposed ADR remains subordinate to ratified authority.

## Change Log

- 2026-07-12: Added review/change-log structure; no lifecycle promotion.
