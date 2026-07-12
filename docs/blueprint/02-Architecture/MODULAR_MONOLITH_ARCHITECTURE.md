---
document_id: PDA-ARC-002
title: Modular Monolith Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0002]
---

# Modular Monolith Architecture

## Decision Summary

The initial platform will use a modular monolith with strict logical domain boundaries. Independent services may be extracted only when measurable operational, security, scale, residency, or ownership needs justify them.

## Module Structure

Each domain module should contain:

- Public application contracts
- Commands, queries, and use cases
- Domain model and business rules
- Persistence adapters and migrations
- Event publishers and consumers
- Permission and entitlement declarations
- Tests, telemetry, and documentation

Private implementation details must not be imported by other modules.

## Dependency Rules

1. Business domains may depend on kernel contracts and approved shared engines.
2. Domains may not depend directly on another domain’s persistence model.
3. Cross-domain calls use published application interfaces.
4. Circular domain dependencies are prohibited.
5. Shared code must represent a stable platform abstraction; miscellaneous shared utility dumping grounds are prohibited.
6. Module dependency rules must be enforced automatically in CI.

## Data Boundaries

A single database technology may be used initially, but each domain owns its schemas or tables. Direct cross-domain writes and ungoverned joins are prohibited. Reporting and search use governed projections.

## Transaction Boundaries

Strong transactions should remain within one domain. Cross-domain workflows use orchestration, events, reservations, and compensation rather than distributed transactions by default.

## Extraction Criteria

A module may become a service when it requires:

- Independent scaling or availability
- Strong fault, security, or compliance isolation
- Separate data residency
- Independent deployment and ownership
- Specialized technology
- A materially different release cadence

Extraction must preserve contracts and avoid changing business semantics.

## Deployment Units

The architecture may produce multiple application processes from the same modular codebase, such as web API, background worker, scheduler, edge runtime, and integration worker, without turning every module into a network service.

## Verification

- Automated module-dependency checks
- Contract tests
- Schema ownership checks
- Prohibition of direct cross-module repository access
- Event and API compatibility tests
- Architecture fitness functions in CI
