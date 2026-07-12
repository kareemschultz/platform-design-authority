---
document_id: PDA-AI-011
title: AI Platform Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0014]
---

# AI Platform Architecture

## Purpose

Define the governed AI platform layered on the AI Orchestration Engine, including models, prompts, tools, agents, retrieval, memory, evaluation, safety, observability, incident response, budgets, and provider exit.

## Architecture

```text
User or Workflow
  -> AI Experience
  -> AI Orchestration Engine
  -> Policy, Budget, and Approval Gate
  -> Model Gateway / Retrieval / Tool Gateway
  -> Domain Application Contracts
  -> Audit, Evaluation, Metering, Incident, and Exit Controls
```

## Core Components

- Model Gateway and Model Registry
- Prompt and Instruction Registry
- Tool Registry
- Agent Registry
- Retrieval and Grounding Service
- Memory Service
- Evaluation and Red-Team Service
- Policy, Approval, and Safety Service
- Usage, Budget, and Cost Service
- AI Audit and Provenance Service
- AI Incident and Kill-Switch Service
- Provider Exit and Fallback Service

## Principles

1. Models never grant authority.
2. Tools call ordinary application commands.
3. Retrieval is tenant-, permission-, purpose-, and classification-filtered.
4. Every production agent has an owner, release state, evaluation suite, budget, incident path, kill switch, and provider exit plan.
5. AI output is not authoritative until validated by the owning domain.
6. Essential workflows remain usable without AI.
7. Fallback providers pass mandatory evaluation before activation.
8. Prompt, tool, model, policy, and provider versions are auditable.
9. Data retention, memory, and erasure follow ADR-0014.
10. High-impact actions require explicit approval and compensation policy.
11. Tenant data is not used for provider training by default.
12. Delegation depth, cycles, cost, actions, records, time, and external communication are bounded.

## Canonical Autonomy Levels

The platform uses one ladder across all AI documents:

1. Inform
2. Draft
3. Recommend
4. Confirm Single Action
5. Approved Workflow
6. Bounded Automation

Levels 4–6 require separately approved mutating-agent controls. Level 6 is outside the first slice.

## Budget and Loop Controls

Budgets independently limit model units, provider cost, tool calls, mutating actions, records affected, communications, wall-clock time, delegation depth, and task count.

Multi-step mutation reserves enough budget for compensation and reconciliation before starting. Exhaustion pauses safely or compensates; it never abandons an unexplained partial mutation.

Canonical limits and behavior are defined in `AI_SDK_MULTI_AGENT_AND_MUTATING_AGENT_CONTROLS.md`.

## Provider Portability

Every production agent declares primary and fallback providers, feature gaps, classifications, regions, cost, latency, evaluation evidence, cutover, rollback, credential revocation, and provider-side data deletion.

Critical agents rehearse provider exit before GA and at least annually.

## Data Boundaries

AI may process data only when classification, tenant configuration, provider agreement, purpose, retention, and user authority allow it. Secret data is prohibited. Restricted data requires explicit policy and an approved provider.

## Release Gate

A production AI capability requires:

- Threat model
- Evaluation dataset, graders, and thresholds
- Prompt-injection, delegation, and tool-abuse tests
- Tenant-isolation tests
- Privacy, memory, retention, and provider review
- Cost, action, record, and latency budgets
- Human fallback
- Support runbook and incident clocks
- Kill switch
- Evaluated fallback and provider-exit plan
- Customer-facing limitations

## Initial Delivery

The first slice permits only optional read-only briefing and bounded import-mapping assistance as defined in `FIRST_SLICE_AI_BOUNDARY.md`.
