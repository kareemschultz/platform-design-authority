---
document_id: PDA-AI-001
title: AI Platform Section Index
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# AI Platform

## Current Specifications

- `../03-Business-Engines/AI_ORCHESTRATION_ENGINE.md` — provider-neutral gateway, tools, agents, retrieval, approvals, evaluation, usage, and audit ownership
- `FIRST_SLICE_AI_BOUNDARY.md` — optional read-only first-slice AI, prohibited actions, evaluation, fallback, and release gates
- `../10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md` — permission-filtered lexical, semantic, and hybrid retrieval
- `../10-Data/DATA_CLASSIFICATION_AND_HANDLING.md` — AI eligibility and protected-data handling
- `../11-Security/THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md` — AI trust boundaries and abuse cases

## Planned Specifications

- AI platform architecture and provider compatibility
- Model gateway and lifecycle registry
- Tool and agent registry schemas
- Retrieval, grounding, memory, and context
- Human approval and autonomy levels
- Evaluation datasets, red teaming, and release evidence
- Prompt and instruction governance
- Cost, usage, budgets, and commercial metering
- Safety, privacy, provenance, and incident response
- AI developer SDK
- Multi-agent coordination
- Mutating-agent controls

## Non-Negotiable Rule

No production AI implementation may bypass ordinary tenant isolation, permissions, entitlements, domain commands, workflows, approvals, data classification, privacy transformations, rate limits, audit, or incident controls.

The deterministic platform remains fully usable when AI is unavailable, disabled, unentitled, over budget, or unable to produce a grounded result.