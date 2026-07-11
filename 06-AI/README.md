---
document_id: PDA-AI-001
title: AI Platform Section Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Platform

## Current Specifications

- `../03-Business-Engines/AI_ORCHESTRATION_ENGINE.md` — shared engine ownership and platform boundaries
- `AI_PLATFORM_ARCHITECTURE.md` — complete AI control-plane architecture
- `MODEL_PROMPT_TOOL_AND_AGENT_REGISTRIES.md` — model, prompt, tool, and agent lifecycle records
- `MEMORY_RETRIEVAL_AND_CONTEXT.md` — context assembly, retrieval, memory, provenance, and privacy
- `EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md` — release evidence, attack testing, incidents, and containment
- `AI_SDK_MULTI_AGENT_AND_MUTATING_AGENT_CONTROLS.md` — SDK, delegation, coordination, mutation, approvals, and compensation
- `FIRST_SLICE_AI_BOUNDARY.md` — optional read-only first-slice scope and prohibited actions
- `../10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md`
- `../10-Data/DATA_CLASSIFICATION_AND_HANDLING.md`
- `../11-Security/THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md`
- `../20-Strategy/AI_HANDBOOK.md`

## Remaining Implementation Evidence

- Concrete registry JSON schemas
- AI SDK package
- Provider adapters
- Prompt authoring tools
- Evaluation fixtures and graders
- Customer-facing administration UX
- Multi-agent and mutating-agent prototype evidence

No production AI implementation may bypass tenant isolation, permissions, entitlements, domain commands, workflows, approvals, data classification, privacy transformations, quotas, audit, evaluation, or incident controls.
