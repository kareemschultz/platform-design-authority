---
document_id: PDA-AI-016
title: AI Registry Schemas and Provider Exit
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Registry Schemas and Provider Exit

## Purpose

Define the minimum machine-readable records for models, prompts, tools, agents, evaluations, budgets, releases, incidents, and provider exit.

Canonical JSON Schemas are maintained under `schemas/ai/`.

## Model Record

Required fields:

- Identifier and version
- Provider and provider model identifier
- Region and endpoint class
- Modalities and limits
- Tool and structured-output support
- Approved data classifications
- Provider retention and training terms
- Cost and latency profile
- Evaluation suite and result
- Fallback model
- Release state and retirement
- Owner and incident contact

## Prompt Record

- Identifier and semantic version
- Purpose and owner
- System and developer instruction references
- Variables and output schema
- Allowed models, retrieval, memory, and tools
- Prohibited uses
- Evaluation suite
- Release state
- Change and rollback history

## Tool Record

- Identifier and version
- Owning platform or domain service
- Input and output schema
- Read or mutation classification
- Permission and entitlement requirements
- Data classification
- Approval and confirmation policy
- Idempotency and compensation
- Rate, record, time, and cost limits
- Audit and incident disablement

## Agent Record

- Identifier and version
- Purpose and owner
- Canonical autonomy level
- Allowed models, prompts, tools, retrieval, and memory
- Tenant availability
- Budgets and loop limits
- Approval and compensation policy
- Evaluation suite and thresholds
- Provider exit plan
- Support, monitoring, and kill switch

## Evaluation Record

- Subject type and exact versions
- Dataset and grader versions
- Risk class
- Thresholds
- Results and failures
- Human reviewers
- Security and privacy review
- Known limitations
- Approval or rejection
- Expiry and rerun trigger

## Provider Exit Plan

Every production provider plan records:

1. Provider services and data used
2. Customer and tenant impact
3. Exportable prompts, configurations, histories, and audit evidence
4. Credential and key revocation
5. Provider-side deletion request and evidence
6. Replacement provider and feature gaps
7. Fallback evaluation results
8. Cutover, rollback, and dual-run plan
9. Cost and latency change
10. Customer communication
11. Residual provider identifiers or records
12. Exit rehearsal date and owner

A fallback model or provider cannot be enabled merely because it is listed. It must satisfy the mandatory safety, authorization, privacy, tool, and workflow evaluations.

## Release States

- Draft
- Internal Evaluation
- Internal Preview
- Customer Preview
- Limited Availability
- General Availability
- Suspended
- Deprecated
- Retired

## Marketplace Records

Publisher AI assets use the same schemas and add publisher, listing, installation, commercial, support, suspension, and removal references.

## Quality Gates

- JSON Schema validation
- Identifier and ownership validation
- Exact-version reproducibility
- Permission and classification compatibility
- Budget and autonomy consistency
- Evaluation threshold enforcement
- Provider exit completeness
- Kill-switch test
- Privacy deletion propagation
