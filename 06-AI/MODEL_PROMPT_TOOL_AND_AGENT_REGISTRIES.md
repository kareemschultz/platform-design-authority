---
document_id: PDA-AI-012
title: Model Prompt Tool and Agent Registries
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Model, Prompt, Tool, and Agent Registries

## Purpose

Define the governed records used to select, release, observe, revoke, and reproduce AI behavior.

## Model Registry

Each model deployment records provider, model identifier, version, region, modalities, context limits, structured-output support, tool support, data-retention terms, training terms, approved classifications, cost, latency, fallback, evaluation state, and retirement date.

## Prompt Registry

Each prompt or instruction package records purpose, owner, version, system instructions, variables, prohibited uses, output schema, model policy, retrieval sources, evaluation set, release state, and change history.

Prompts cannot contain hidden business permissions or replace domain rules.

## Tool Registry

Every tool records:

- Canonical identifier
- Owning domain or platform service
- Input and output schemas
- Read or mutation classification
- Permission and entitlement requirements
- Data classification
- Idempotency
- Approval and confirmation policy
- Rate and cost limits
- Audit fields
- Failure and compensation behavior
- Offline support

## Agent Registry

Every agent records purpose, owner, release state, allowed models, prompts, tools, retrieval, memory, budget, approval level, evaluation suite, support owner, incident controls, and tenant availability.

## Versioning

A production execution records exact model, prompt, tool, agent, retrieval-index, and policy versions. Breaking behavior changes require a new agent or prompt major version and evaluation rerun.

## Governance

- Draft entries are unavailable to ordinary tenants.
- Customer Preview requires explicit opt-in.
- Suspended models, prompts, tools, or agents stop new execution immediately.
- Historical audit remains readable after retirement.
- Registries are tenant-aware but platform policy establishes minimum safety.

## Quality Gates

- Schema validation
- Duplicate identifier prevention
- Ownership and permission validation
- Evaluation linkage
- Classification compatibility
- Provider-term review
- Emergency-disable test
- Reproducibility test
