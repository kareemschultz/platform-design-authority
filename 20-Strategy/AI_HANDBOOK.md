---
document_id: PDA-STR-016
title: AI Handbook
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Handbook

## Purpose

Define how the company researches, builds, evaluates, deploys, sells, supports, and governs AI capabilities.

## Company-Stage Note

This is a founding-stage operating design. It does not imply production AI autonomy, proprietary models, completed evaluations, or existing customer data-training programs.

## Rules

- Use AI where it improves measurable work.
- Preserve a deterministic path for essential workflows.
- Use approved registry versions for models, prompts, tools, agents, data classes, and providers.
- Do not place business authority inside prompts.
- Do not expose secrets or cross-tenant data.
- High-impact actions follow ordinary permissions, entitlements, approvals, budgets, and compensation.
- Every capability has evaluation, cost, support, incident, kill-switch, fallback, and provider-exit ownership.
- Tenant data is not used for provider training by default.
- Marketplace AI assets follow the same governance as first-party assets.

## Canonical Autonomy Levels

1. Inform
2. Draft
3. Recommend
4. Confirm Single Action
5. Approved Workflow
6. Bounded Automation

User interfaces state the level clearly. Levels 4–6 require separately approved mutating-agent controls. The first slice remains Levels 1–2.

## Development Lifecycle

Idea, use-case map, risk classification, data review, prototype, evaluation, red team, internal preview, customer preview, limited availability, general availability, monitoring, provider-exit rehearsal, deprecation, and retirement.

## Budgets and Delegation

Agents use explicit cost, model-unit, tool-call, action, record, communication, time, and delegation budgets. Multi-step mutation reserves compensation budget. Unlimited recursion and authority expansion are prohibited.

## Customer Claims

Sales and marketing describe verified capabilities, autonomy level, limitations, provider dependence, data behavior, and human oversight. Do not claim autonomous correctness, regulatory approval, professional advice, or guaranteed model behavior.

## Provider Review

Review privacy, retention, training, residency, reliability, security, pricing, model changes, fallback evaluation, exit, data deletion, and incident notification.

## Operations

Monitor quality, unsupported claims, tool failures, budget use, latency, safety, tenant isolation, provider health, memory purge, evaluation expiry, and user feedback. Maintain kill switches and tested fallbacks.

## Incident Response

Use the severity and clocks in `06-AI/EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md`. Disable the narrowest component, preserve evidence, stop loops, determine scope, compensate or correct downstream state, communicate, add regression cases, and review provider and policy controls.

## Required Records

Machine-readable records follow `schemas/ai/registry-records-v1.schema.json` and `06-AI/AI_REGISTRY_SCHEMAS_AND_PROVIDER_EXIT.md`.
