---
document_id: PDA-ENG-016
title: AI Orchestration Engine
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0014, ADR-0016]
---

# AI Orchestration Engine

## Purpose

Define the shared engine that coordinates AI models, tools, retrieval, agents, approvals, evaluations, budgets, privacy, provider exit, and audit without bypassing ordinary application boundaries.

## Architectural Position

The AI Orchestration Engine is domain-neutral and owns no authoritative business records. It invokes approved application commands through governed tools. Detailed controls live in `06-AI/`.

## Responsibilities

- Provider-neutral model gateway
- Model, prompt, tool, and agent registries
- Retrieval, context, and memory policy
- Permission, entitlement, classification, purpose, and approval enforcement
- Cost, action, record, time, and delegation budgets
- Evaluation and release gates
- Human oversight and compensation
- Provenance and audit
- Privacy transformation
- Incident and kill-switch controls
- Evaluated fallback and provider exit

## Non-Responsibilities

The engine does not own domain records, grant access, execute unrestricted SQL or shell, call repositories directly, treat model output as authoritative, replace workflow or risk review, create unrestricted memory, or create cross-tenant identity graphs.

## Canonical Autonomy Levels

1. Inform
2. Draft
3. Recommend
4. Confirm Single Action
5. Approved Workflow
6. Bounded Automation

This ladder is authoritative across AI documents. Levels 4–6 require the controls in `06-AI/AI_SDK_MULTI_AGENT_AND_MUTATING_AGENT_CONTROLS.md`. The first slice remains at Levels 1–2.

## Tool Contract

Every tool declares identifier, owner, schemas, entitlement, permissions, scopes, mutation class, risk, approval, idempotency, classification, purpose, offline posture, budget, audit, retention, incident disablement, and compensation.

## Agent Contract

Every agent declares purpose, owner, autonomy level, exact model/prompt/tool versions, retrieval, memory, scope, approvals, budgets, loop limits, evaluation, release state, support, kill switch, and provider-exit plan.

## Model Gateway

The gateway governs selection, evaluated fallback, region, residency, retention, provider training terms, metering, timeout, retry, circuit breaking, structured output, streaming, and outage behavior.

A fallback must pass mandatory evaluation before activation.

## Retrieval and Memory

Retrieval is tenant-, permission-, purpose-, entitlement-, classification-, source-, and deletion-state-aware. Search owns indexing and retrieval contracts.

Memory types, approvers, retention classes, purge SLOs, and reconstruction testing are defined in `06-AI/MEMORY_RETRIEVAL_AND_CONTEXT.md`.

## Budgets and Delegation

Budgets separately control provider cost, model units, tool calls, mutations, records, communication, time, delegation depth, and delegated task count.

Mutating multi-step workflows reserve compensation and reconciliation budget before starting. Delegation cycles, authority expansion, and unlimited recursion are prohibited.

## Evaluation and Release

Evaluation thresholds, dataset sizes, grading methods, red-team cadence, and incident clocks are defined in `06-AI/EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md`.

Release states:

- Draft
- Internal Evaluation
- Internal Preview
- Customer Preview
- Limited Availability
- General Availability
- Suspended
- Deprecated
- Retired

## Usage and Cost

Track provider, model, billable units, tool calls, retrieval, storage, tenant, actor, agent, workflow, capability, retries, failures, budgets, reservations, and released compensation budget.

## Security and Privacy

Required controls include prompt-injection defenses, exact tool allow-lists, schema validation, output encoding, secret isolation, DLP, tenant and role scoping, provider allow-lists, anomaly detection, kill switches, and ADR-0014 propagation.

Provider training or fine-tuning on tenant data is prohibited by default and requires explicit contractual opt-in and separate governance.

## Events

- `ai.request.created.v1`
- `ai.request.completed.v1`
- `ai.request.failed.v1`
- `ai.tool-invocation.completed.v1`
- `ai.approval-request.created.v1`
- `ai.agent.released.v1`
- `ai.agent.suspended.v1`
- `ai.evaluation.completed.v1`
- `ai.budget-threshold.reached.v1`

## Capability Family

- `ai.gateway`
- `ai.model-registry`
- `ai.tool-registry`
- `ai.agent-registry`
- `ai.retrieval`
- `ai.evaluation`
- `ai.governance`
- `ai.usage-metering`

## Delivery Principle

The first slice uses optional read-only briefing and bounded import mapping. Mutating and autonomous scope remains deferred until all controls are proven.
