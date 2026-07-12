---
document_id: PDA-AI-015
title: AI SDK Multi Agent and Mutating Agent Controls
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI SDK, Multi-Agent, and Mutating-Agent Controls

## Purpose

Define the developer contracts and safety boundaries for AI applications, coordinated agents, and tools that may change business state.

This is the separate future specification required by `FIRST_SLICE_AI_BOUNDARY.md` for mutating agents. Its existence does **not** authorize mutating agents in the first slice; the first slice remains read-only or draft-assistance only.

## AI SDK

The SDK exposes typed access to:

- Model gateway and model registry
- Prompt and instruction registry
- Permission-filtered retrieval
- Tool registry and invocation
- Approval and confirmation
- Evaluation and policy results
- Usage and budget reservation
- Provenance and audit
- Incident and kill-switch status

It never exposes direct database access, unrestricted shell, unrestricted network, provider credentials, or unregistered tools.

## Canonical Autonomy Levels

All AI documents use this single ladder:

1. **Inform** — explain or summarize without drafting a business artifact.
2. **Draft** — produce a reviewable draft with no business mutation.
3. **Recommend** — propose a choice or action with evidence and alternatives.
4. **Confirm Single Action** — invoke one bounded mutating tool after explicit confirmation.
5. **Approved Workflow** — execute a predefined multi-step workflow with explicit approval and checkpoints.
6. **Bounded Automation** — operate within approved policy, budget, tool, time, and compensation limits with monitoring.

Levels 4–6 require a separately approved capability specification, evaluation evidence, incident controls, and ordinary permissions. Level 6 is prohibited for the first slice.

## Delegation Model

Every delegation records:

- Parent and child execution IDs
- Tenant, actor, purpose, and classification
- Exact delegated task
- Allowed tools and data sources
- Authority ceiling
- Cost and action budget
- Timeout and deadline
- Expected output schema
- Approval requirements
- Memory scope

A child receives the intersection of parent authority and agent policy. It cannot add tools, permissions, entitlements, classifications, tenant scope, or budget.

## Loop and Cycle Controls

Provisional defaults:

- Maximum delegation depth: 3
- Maximum child agents per execution: 8
- Maximum total delegated tasks: 20
- Maximum repeated identical tool call: 3 without a changed input or new evidence
- Maximum workflow wall-clock duration: 15 minutes unless an approved durable workflow declares otherwise
- Maximum planning iterations without a tool result or user decision: 5

The coordinator maintains an execution graph and rejects:

- Delegation to an ancestor execution
- Repeated task signature without new evidence
- Tool cycles that return to an equivalent state
- Budget-negative delegation
- Delegation beyond the authority ceiling

At a limit, the system stops safely, preserves state, releases unused reservations, and requests human review. It does not silently continue with a different model or broader permissions.

## Budget Semantics

Budgets are scoped independently:

- Monetary or provider cost
- Model input/output units
- Tool-call count
- Mutating-action count
- External communication count
- Records affected
- Wall-clock time
- Delegation count and depth

A budget may be:

- Soft: warn and require confirmation to continue
- Hard: stop before exceeding
- Reserved: held before a mutating workflow starts

## Compensation-Budget Reservation

Before a multi-step mutating workflow:

1. Estimate forward cost and actions.
2. Reserve enough monetary, tool, and action budget for required compensation, reversal, customer notification, or reconciliation.
3. Reject the workflow if compensation cannot be afforded or authorized.
4. Release unused reservation only after successful completion or verified compensation.

Budget exhaustion mid-workflow transitions to a safe paused or compensation-required state. It never abandons an externally visible partial mutation silently.

## Provider Portability and Exit

Every production agent declares:

- Primary and fallback model/provider
- Features required from each
- Data classification and residency compatibility
- Prompt and tool compatibility differences
- Cost and latency expectations
- Evaluation suite and minimum thresholds
- Failure and cutover behavior
- Provider data deletion and credential revocation

A fallback cannot enter production until it passes the same mandatory safety, tenant-isolation, tool, and workflow evaluations as the primary model. Quality thresholds may differ only through explicit risk approval.

Provider-exit rehearsal occurs before GA and at least annually for critical agents.

## Mutating Agents

Mutating agents require:

- Approved registry entry and release state
- Explicit purpose and prohibited purposes
- Exact tool allow-list
- Permission, entitlement, classification, and scope enforcement per call
- Authoritative state preconditions
- Idempotency
- Preview or confirmation
- Approval thresholds
- Compensation or reversal
- Reserved budgets
- Rate and record limits
- Audit and incident disablement
- User-visible status and recovery

## Prohibited Behavior

- Unrestricted SQL, shell, network, or repository mutation
- Hidden cross-tenant coordination or reputation
- Self-modifying permissions, policies, prompts, or tool lists
- Autonomous legal, payroll, tax, privacy, access, financial, employment, or payment decisions without separately approved policy
- Silent customer communication
- Recursive execution beyond limits
- Provider fallback without evaluation
- Training a provider model on tenant data by default

## Tenant-Data Training

Provider training or fine-tuning on tenant data is prohibited by default.

Any future opt-in requires:

- Explicit customer contract and authorized administrator consent
- Defined dataset, purpose, provider, region, retention, and deletion
- Data-subject and third-party rights review
- De-identification where practical
- No Secret data
- Separate entitlement and user-facing disclosure
- Evaluation and withdrawal behavior
- Confirmation that provider terms prevent unrelated model training or reuse

## Quality Gates

- Delegation trace and graph validation
- Authority intersection tests
- Depth, cycle, repetition, and timeout tests
- Soft, hard, and reserved budget tests
- Compensation-reservation and exhaustion tests
- Tool and scope enforcement
- Prompt-injection tests
- Human-approval tests
- Provider failover and exit rehearsal
- Emergency kill switch
- Partial-mutation recovery
