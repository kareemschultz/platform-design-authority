---
document_id: PDA-AI-001
title: AI Platform Section Index
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Platform

## Current Specifications

- `docs/blueprint/03-Business-Engines/AI_ORCHESTRATION_ENGINE.md`
- `AI_PLATFORM_ARCHITECTURE.md`
- `MODEL_PROMPT_TOOL_AND_AGENT_REGISTRIES.md`
- `AI_REGISTRY_SCHEMAS_AND_PROVIDER_EXIT.md`
- `MEMORY_RETRIEVAL_AND_CONTEXT.md`
- `EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md`
- `AI_SDK_MULTI_AGENT_AND_MUTATING_AGENT_CONTROLS.md`
- `FIRST_SLICE_AI_BOUNDARY.md`
- `docs/blueprint/10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md`
- `docs/blueprint/10-Data/DATA_CLASSIFICATION_AND_HANDLING.md`
- `docs/blueprint/11-Security/THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md`
- `docs/blueprint/20-Strategy/AI_HANDBOOK.md`
- `schemas/ai/registry-records-v1.schema.json`

## Canonical Controls

- Six autonomy levels: Inform, Draft, Recommend, Confirm Single Action, Approved Workflow, and Bounded Automation
- Permission, entitlement, classification, purpose, budget, approval, and tool enforcement
- Delegation depth, cycle, repetition, time, action, record, and cost limits
- Compensation-budget reservation for mutating workflows
- Provider fallback evaluation and exit rehearsal
- Tenant-data training prohibited by default
- Memory approvers, retention, purge SLO, and reconstruction testing
- Evaluation thresholds, red-team cadence, incident clocks, and kill switches
- Publisher AI assets use the same governance

## Remaining Implementation Evidence

- AI SDK package
- Provider adapters
- Prompt and registry authoring tools
- Evaluation datasets and graders
- Customer-facing administration UX
- Multi-agent and mutating-agent prototype evidence
- Provider-exit rehearsal evidence

No production AI implementation may bypass ordinary platform authority or domain-owned business commands.
