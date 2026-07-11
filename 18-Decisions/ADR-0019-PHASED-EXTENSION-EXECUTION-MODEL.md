---
document_id: ADR-0019
title: Use a Phased Extension Execution Model
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-11
last_reviewed: 2026-07-11
supersedes: null
superseded_by: null
related_adrs: [ADR-0016]
---

# ADR-0019 — Use a Phased Extension Execution Model

## Context

The platform needs integrations, workflow packs, reports, widgets, importers, AI skills, and future marketplace extensions. Executing arbitrary publisher code inside the core application process would create unacceptable tenant-isolation, supply-chain, availability, privacy, and support risk.

## Decision

Adopt four execution classes in increasing order of privilege.

### Class 1 — Declarative Extension

Configuration, workflow definitions, report metadata, templates, themes, and approved UI composition. No arbitrary code.

### Class 2 — External Application

Publisher-hosted application using public APIs, OAuth, webhooks, and registered scopes. This is the default for third-party logic.

### Class 3 — Sandboxed Function

Platform-hosted WASM or isolated worker execution may be introduced only after a security prototype and separate implementation approval. It receives no ambient filesystem, network, database, credential, or tenant access.

### Class 4 — Reviewed First-Party Package

Code maintained inside the platform repository under ordinary architecture, supply-chain, testing, and release controls. Marketplace approval alone cannot grant this status.

Arbitrary third-party code is prohibited inside the core application process.

## Sandboxed Function Minimum Controls

Before Class 3 is enabled, define and test:

- CPU and wall-clock limits
- Memory ceiling
- Invocation and concurrency limits
- Read-only ephemeral filesystem or no filesystem
- Default-deny network egress with destination allowlists
- Secret references mediated by the Secrets service
- Tenant, actor, permission, entitlement, and classification context
- Typed input and output schemas
- Deterministic cancellation and timeout
- Logging without secrets or protected payload leakage
- Package signing, provenance, malware, dependency, and license review
- Emergency suspension and tenant-scoped kill switch
- Version compatibility, upgrade, rollback, and uninstall
- Metering and commercial limits

## Initial Resource Defaults

Prototype defaults for any future sandbox evaluation:

- 128 MB memory
- 5 seconds wall-clock
- 1 CPU-equivalent burst
- No outbound network by default
- No persistent filesystem
- 1 MB input and output payload ceiling
- Maximum 3 retries for retry-safe work

These are test defaults, not production commitments.

## Data and Authority

Extensions access domain data only through public application contracts. An extension cannot grant itself scopes, broaden tenant context, bypass field masking, or receive credentials directly.

Publisher AI skills, tools, prompts, and agents additionally enter the governed AI registries and evaluation gates.

## Consequences

### Positive

- Safe default path through declarative and externally hosted extensions
- Reduced core-process attack surface
- Explicit security gate before platform-hosted arbitrary logic
- Clear marketplace review and support boundaries

### Negative

- Some publisher experiences require more integration work
- External applications add network and provider dependencies
- WASM or worker support requires future runtime investment
- Not every legacy plugin can be accepted

## Validation

Before Class 3 adoption, prototype at least two runtime candidates and test tenant escape, CPU exhaustion, memory exhaustion, network denial, secret denial, cancellation, package tampering, logging, and emergency suspension.
