---
document_id: PDA-AI-015
title: AI SDK Multi Agent and Mutating Agent Controls
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI SDK, Multi-Agent, and Mutating-Agent Controls

## Purpose

Define the developer contracts and safety boundaries for AI applications, coordinated agents, and tools that may change business state.

## AI SDK

The SDK exposes typed access to model gateway, prompt registry, retrieval, tool invocation, approvals, evaluations, budgets, provenance, and audit. It never exposes direct database or unrestricted network access.

## Multi-Agent Coordination

A coordinator may delegate bounded tasks to specialist agents. Every delegation records purpose, input, allowed tools, budget, tenant scope, timeout, and expected output.

Agents cannot delegate more authority than they possess. Shared memory is explicit and classified.

## Mutating Agents

Mutating agents require:

- Approved tool allow-list
- Explicit user or workflow purpose
- State preconditions
- Idempotency
- Preview or confirmation
- Approval thresholds
- Compensation or reversal
- Rate and budget limits
- Audit and incident disablement

## Prohibited Behavior

- Unrestricted SQL or shell
- Hidden cross-tenant coordination
- Self-modifying permissions or tool lists
- Autonomous legal, payroll, tax, privacy, access, or payment decisions without approved policy
- Silent customer communication
- Recursive execution without limits

## Quality Gates

- Delegation trace
- Tool and scope enforcement
- Loop and budget controls
- Compensation tests
- Prompt-injection tests
- Human-approval tests
- Emergency kill switch
