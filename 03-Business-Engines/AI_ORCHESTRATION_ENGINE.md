---
document_id: PDA-ENG-016
title: AI Orchestration Engine
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0014, ADR-0016]
---

# AI Orchestration Engine

## Purpose

Define the shared engine that coordinates AI models, tools, retrieval, agents, approvals, evaluations, cost controls, privacy, and audit across platform domains without allowing AI to bypass ordinary application boundaries.

## Architectural Position

The AI Orchestration Engine is a domain-neutral shared engine. It does not own authoritative business records. It invokes approved domain and platform application commands through governed tool contracts.

Detailed model, agent, memory, evaluation, safety, and developer specifications belong in `06-AI/`. This document establishes ownership and minimum cross-domain rules now so AI references elsewhere have an architectural home.

## Core Responsibilities

- Provider-neutral model gateway
- Model and deployment registry
- Prompt and instruction registry
- Tool registry
- Agent registry
- Retrieval orchestration
- Context assembly
- Permission, entitlement, policy, and approval enforcement
- Data-classification and purpose enforcement
- Cost and usage accounting
- Evaluation and release gates
- Human-in-the-loop workflows
- Provenance and audit
- Redaction and data-boundary enforcement
- Retention and privacy-transformation integration
- Incident response and model-disable controls

## Non-Responsibilities

The engine does not:

- Own customer, supplier, employee, inventory, finance, or other domain records
- Grant permissions or entitlements
- Execute unrestricted SQL
- Call domain repositories directly
- Treat model output as an authoritative decision without domain validation
- Replace workflows, approvals, rules, risk review, or audit
- Store unrestricted long-term memory by default
- Create a hidden cross-tenant Party graph

## Tool Contract

Every AI tool declares:

- Stable tool identifier
- Owning platform service, engine, or domain
- Input and output schema
- Required capability entitlement
- Required permissions and scopes
- Risk classification
- Approval requirements
- Whether the tool is read-only or mutating
- Idempotency behavior
- Data classification, redaction, and purpose rules
- Offline availability
- Cost and rate limits
- Audit and provenance fields
- Retention and erasure behavior
- Failure and compensation behavior

Mutating tools call normal application commands. AI does not bypass validation, workflow, approval, segregation-of-duties, or audit rules.

## Agent Contract

An agent definition includes:

- Agent identifier and version
- Purpose and prohibited purposes
- Model policy
- Allowed tools
- Retrieval sources
- Memory policy
- Tenant and workspace scope
- Human approval policy
- Cost budget
- Evaluation suite
- Release status
- Owner and support contact
- Incident-disable mechanism

## Model Gateway

The gateway normalizes provider interaction while preserving provider-specific capabilities behind adapters.

Required concerns:

- Model selection and fallback
- Regional and data-residency policy
- Prompt and response logging policy
- Token or unit metering
- Timeouts, retries, and circuit breakers
- Safety filters
- Structured output validation
- Streaming
- Provider outage handling
- Provider-specific retention and training controls

## Retrieval

Retrieval is:

- Tenant-scoped
- Permission-filtered
- Purpose-aware
- Entitlement-aware
- Classification-aware
- Source-cited where practical
- Resistant to prompt injection from retrieved content
- Auditable
- Limited to approved indexes and projections

Search owns indexing and retrieval contracts. AI consumes authorized retrieval results. A retrieved statement does not replace a current domain read or policy check where correctness matters.

## Memory

Memory types may include:

- Ephemeral conversation state
- User preference memory
- Workspace context
- Task state
- Approved organizational knowledge
- Agent-specific operational memory

Every memory type requires retention, scope, sensitivity, deletion, export, and cross-session policy. Personal or business memory is not stored merely because a model generated it.

## Human Oversight

The engine supports:

- Suggest-only actions
- Draft generation
- Review and confirm
- Approval workflows
- Dual control
- Fully automated actions within approved risk limits

High-impact actions involving money, stored value, payroll, employment, tax, legal status, access, customer communication, privacy, deletion, or irreversible external effects require explicit policy and usually human confirmation or approval.

## Evaluation

Every production agent and significant prompt or model change requires evaluation appropriate to its risk.

Evaluation may cover:

- Task completion
- Factuality and grounding
- Authorization adherence
- Tenant isolation
- Tool-selection correctness
- Hallucination rate
- Refusal behavior
- Prompt-injection resistance
- Sensitive-data leakage
- Cost and latency
- Accessibility and language quality
- Human acceptance rate
- Regression against prior releases

## Release States

- Research
- Prototype
- Internal Preview
- Customer Preview
- Limited Availability
- General Availability
- Suspended
- Retired

A model or agent may be disabled independently from the rest of the platform.

## Usage and Cost

AI usage integrates with the Metering Service and commercial entitlements.

Track:

- Provider and model
- Input, output, cached, image, audio, or other billable units
- Tool executions
- Retrieval and storage cost
- Tenant, user, agent, workflow, and capability
- Included allowance and overage
- Budget and threshold decisions
- Failed and retried calls

## Security

Required controls:

- Prompt-injection defenses
- Tool allow-lists
- Schema validation
- Output encoding
- Secret isolation
- Data-loss prevention
- Tenant and role scoping
- Rate and budget limits
- Model and provider allow-lists
- Sensitive-data minimization
- Audit and anomaly detection
- Emergency kill switches

## Audit, Retention, and Provenance

Capture as policy permits:

- Actor and tenant
- Agent, prompt, model, and tool versions
- Source references
- Tool inputs and outputs or protected hashes
- Approvals and confirmations
- Cost and latency
- Final business command IDs
- Errors, retries, and fallback path
- Whether content was AI-generated or AI-modified
- Data classification and retention class

Raw prompts and responses are stored only when an approved purpose requires them. Deletion-journal actions propagate to prompts, responses, embeddings, memory, feedback, traces, and evaluation datasets under ADR-0014.

## Events

Representative events:

- `ai.request.created.v1`
- `ai.request.completed.v1`
- `ai.request.failed.v1`
- `ai.tool-invocation.completed.v1`
- `ai.approval-request.created.v1`
- `ai.agent.released.v1`
- `ai.agent.suspended.v1`
- `ai.evaluation.completed.v1`
- `ai.budget-threshold.reached.v1`

## Initial Capability Family

- `ai.gateway`
- `ai.model-registry`
- `ai.tool-registry`
- `ai.agent-registry`
- `ai.retrieval`
- `ai.evaluation`
- `ai.governance`
- `ai.usage-metering`

`engine.ai-orchestration` remains the top-level engine registration in the Business Capability Map. Detailed capabilities use the registered `ai` namespace under ADR-0016.

## Delivery Principle

The first vertical slice implements only the minimum AI capabilities needed for one measurable, low-risk workflow. Broad autonomous-agent scope is deferred until permissions, entitlements, tenant isolation, audit, evaluation, privacy, and incident controls are proven.