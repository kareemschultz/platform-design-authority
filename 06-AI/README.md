---
document_id: PDA-AI-001
title: AI Platform Section Index
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Platform

## Current Specifications

- `../03-Business-Engines/AI_ORCHESTRATION_ENGINE.md` — shared engine ownership and minimum platform boundaries
- `AI_PLATFORM_ARCHITECTURE.md` — complete AI control-plane architecture
- `MODEL_PROMPT_TOOL_AND_AGENT_REGISTRIES.md` — model, prompt, tool, and agent lifecycle records
- `MEMORY_RETRIEVAL_AND_CONTEXT.md` — context assembly, retrieval, memory, provenance, and privacy
- `EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md` — release evidence, attack testing, incidents, and containment
- `FIRST_SLICE_AI_BOUNDARY.md` — optional, read-only first-slice scope and prohibited actions
- `../10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md` — permission-filtered retrieval architecture
- `../10-Data/DATA_CLASSIFICATION_AND_HANDLING.md` — AI data eligibility and handling
- `../11-Security/THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md` — AI trust boundaries and abuse cases
- `../20-Strategy/AI_HANDBOOK.md` — company AI operating rules

## Remaining Implementation-Level Depth

- Concrete registry JSON schemas
- AI SDK package design
- Model-provider adapter contracts
- Prompt-template authoring format
- Evaluation fixtures and graders
- Multi-agent coordination protocol
- Mutating-agent approval and compensation patterns
- Customer-facing AI administration UX

These are implementation-ready specifications to be written during the corresponding delivery wave, not missing architectural ownership.

## Non-Negotiable Rule

No production AI implementation may bypass tenant isolation, permissions, entitlements, domain commands, workflows, approvals, data classification, privacy transformations, quotas, audit, evaluation, or incident controls.

The deterministic platform remains usable when AI is unavailable, disabled, unentitled, over budget, or unable to produce a grounded result.
