---
document_id: ADR-0002
title: Adopt a Modular Monolith First
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0002 — Adopt a Modular Monolith First

## Context

The platform will span many business domains and must preserve clear ownership and independent evolution. Beginning with many network services would introduce deployment, consistency, debugging, security, and operational complexity before scale or team structure justifies it. A traditional monolith without enforced boundaries would create equally serious long-term coupling.

## Decision Drivers

- Fast but disciplined initial delivery
- Clear domain ownership
- Strong transaction support within domains
- Lower operational overhead
- Future extraction without redesigning business contracts
- Easier local development, testing, and deployment

## Options Considered

### Unstructured monolith

Fast initially, but permits shared tables, circular dependencies, duplicated rules, and painful extraction.

### Microservices from the beginning

Provides physical isolation, but creates premature distributed-system cost and cross-service coordination.

### Modular monolith with extraction criteria

Uses one primary deployment boundary initially while enforcing domain modules, contracts, schema ownership, and architecture tests.

## Decision

Adopt a modular monolith as the default initial architecture. Preserve logical domain boundaries as if modules could be separately deployed later. Extract services only when measurable scale, availability, security, residency, technology, or ownership needs justify the change.

## Consequences

### Positive

- Lower operational complexity
- Stronger local transactions
- Faster development and testing
- Easier consistency during early product evolution
- Future extraction path through stable contracts

### Negative

- Requires strict automated boundary enforcement
- Poor discipline could still produce a distributed-monolith-in-waiting
- Some modules may eventually need migration to separate services

## Required Controls

- Module dependency rules in CI
- Domain-owned schemas or tables
- No direct cross-domain writes
- Contract tests for application interfaces and events
- Architecture review before service extraction
- Reliable outbox for event publication

## Validation

The decision is successful when multiple domains can evolve independently inside one codebase, cross-domain dependencies remain explicit, and at least one module can be extracted in a controlled exercise without changing its business contract.
