---
document_id: ADR-0018
title: Use OpenTofu for Infrastructure as Code
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-11
last_reviewed: 2026-07-11
supersedes: null
superseded_by: null
---

# ADR-0018 — Use OpenTofu for Infrastructure as Code

## Context

The platform requires reproducible SaaS, dedicated, recovery, and supported self-hosted environments. The infrastructure specification requires reviewed plans, remote state, policy checks, drift detection, modular reuse, and provider portability but did not select an implementation tool.

## Options Considered

### OpenTofu

Open-source Terraform-compatible workflow, broad provider ecosystem, declarative plans, reusable modules, remote state, and reduced dependence on a proprietary license.

### Terraform

Mature ecosystem and managed commercial services, but current licensing and product coupling create avoidable strategic dependence for a platform that values self-hosting and portability.

### Pulumi

Strong general-purpose-language experience and testability, but introduces runtime-language and dependency complexity into infrastructure delivery and reduces the familiarity of the plan/apply workflow for many operators.

### Cloud-specific templates

Deep provider integration but weak portability and duplicated architecture across deployment modes.

## Decision

Use OpenTofu as the default infrastructure-as-code engine for platform-managed cloud and reference self-hosted deployment modules.

- Pin the OpenTofu CLI version in CI and release tooling.
- Use reviewed reusable modules.
- Store state in encrypted remote backends with locking for shared environments.
- Separate state by environment, region, and customer isolation boundary.
- Generate and review plans before apply.
- Use policy-as-code and static validation.
- Produce machine-readable plans for cost, security, and destructive-change review.
- Keep cloud-provider-specific resources behind documented modules.

Terraform-compatible providers and modules may be used only after license, maintenance, security, and compatibility review.

## Consequences

### Positive

- Declarative, reviewable infrastructure
- Broad ecosystem and operator familiarity
- Open-source foundation
- Strong fit for multi-environment and self-hosted modules
- Portable plan and state model

### Negative

- State and provider governance remain operational responsibilities
- Provider behavior and module quality vary
- Complex application workflows may still require scripting
- Compatibility with upstream Terraform features must be monitored

## Required Controls

- Remote encrypted state and locking
- No credentials in code or state outputs
- State-access separation
- Provider and module pinning
- Module provenance and vulnerability review
- Plan review for production
- Destructive-change policy
- Drift detection
- Recovery-state backup and restore
- Golden deployment tests
- Customer support-tier compatibility matrix

## Module Families

- Bootstrap and state
- Identity and access
- Network and DNS
- Compute and container runtime
- PostgreSQL
- Redis or Valkey
- Object storage
- Search
- Messaging and durable workflow
- Observability
- Secrets and keys
- Backup and recovery
- Edge and self-hosted support

## Validation

Validate through a disposable first-slice environment, isolated recovery environment, plan/apply/destroy tests, drift simulation, state recovery, provider upgrade, and one reference self-hosted installation.

## Evidence and Cross-Links

- `19-Appendices/OPENTOFU_VERIFICATION-2026-07-12.md`
- `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`

## Review Record

Fourth-audit remediation confirms this Proposed ADR remains subordinate to ratified authority.

## Change Log

- 2026-07-12: Added review/change-log structure; no lifecycle promotion.
