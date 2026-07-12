---
document_id: ADR-0003
title: Adopt Domain-Owned Data and Published Contracts
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0003 — Adopt Domain-Owned Data and Published Contracts

## Context

A unified business platform needs cross-domain workflows, reporting, and automation, but uncontrolled shared data access would make ownership ambiguous and changes unsafe. The platform also requires one source of truth for orders, stock, employees, pay runs, ledger entries, and other critical records.

## Decision Drivers

- Clear accountability for business rules and data quality
- Safe modular evolution
- Strong tenant and security boundaries
- Reliable cross-domain workflows
- Search, analytics, and offline support without competing sources of truth
- Future service extraction

## Options Considered

### Shared database with unrestricted access

Simple initially, but allows hidden coupling and bypasses domain invariants.

### Fully isolated databases for every domain immediately

Strong physical boundaries, but adds premature operational and transactional complexity.

### Logical ownership with published contracts and governed projections

Each domain owns its authoritative data and mutation rules. Other domains use APIs, commands, events, or read projections.

## Decision

Adopt logical domain ownership with published contracts. A shared database technology may be used initially, but direct cross-domain writes are prohibited. Derived copies for search, analytics, integration, reporting, and offline use must identify their source and remain non-authoritative.

## Consequences

### Positive

- Business invariants remain with the owner
- Changes become easier to reason about and test
- Cross-domain dependencies are visible
- Reporting and search can scale through projections
- Physical separation remains possible later

### Negative

- Some cross-domain views require projections or orchestration
- Eventual consistency must be designed and communicated
- Teams must resist shortcut joins and direct repository access

## Required Controls

- Data ownership catalog
- Schema or table ownership rules
- Application-service and event contracts
- Reliable event publication
- Projection freshness and rebuild procedures
- Automated architecture checks
- Ledger-specific integrity rules

## Validation

The decision is successful when every initial authoritative entity has one owner, cross-domain writes are blocked by tests or tooling, projections can be rebuilt, and critical workflows remain traceable across commands and events.
