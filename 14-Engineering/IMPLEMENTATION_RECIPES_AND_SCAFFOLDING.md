---
document_id: PDA-ENGR-011
title: Implementation Recipes and Scaffolding
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Implementation Recipes and Scaffolding

## Purpose

Define repeatable implementation recipes that turn approved blueprint decisions into consistent code without letting templates replace architectural judgment.

## Recipe Families

- New platform service
- New business domain
- New shared engine
- New capability
- New command and query
- New event producer and consumer
- New REST endpoint and SDK method
- New import/export flow
- New background job or durable workflow
- New report, dashboard, and metric
- New permission and entitlement
- New offline-capable workflow
- New provider adapter
- New extension or marketplace application
- New AI tool or agent
- New industry or jurisdiction pack

## Recipe Contract

Every recipe identifies:

- Governing documents and ADRs
- Authoritative owner
- Capability, event, permission, and package identifiers
- Required files and package boundaries
- Tenant and authorization context
- Data classification and retention
- Audit and observability
- Idempotency and failure handling
- Offline declaration
- Testing and documentation
- Review and lifecycle gates

## Example: New Capability

1. Register ownership and identifier.
2. Define users, workflows, state, invariants, permissions, entitlements, metrics, and offline behavior.
3. Review dependencies and data ownership.
4. Add application contracts.
5. Implement domain behavior and persistence.
6. Publish events through the outbox.
7. Add UI and SDK surfaces.
8. Add tenant-isolation, denial, failure, recovery, accessibility, and performance tests.
9. Add operations and support evidence.
10. Update registries and documentation.

## Example: New Provider Adapter

- Define stable platform interface
- Record provider capability matrix
- Isolate credentials
- Implement idempotency and webhook verification
- Model uncertain state
- Add sandbox simulator
- Reconcile provider and internal records
- Define outage, migration, and exit
- Avoid provider identifiers as primary business identities

## Guardrails

- Generated code may not cross domain boundaries.
- Templates do not decide ownership.
- Scaffolded permissions and entitlements start denied.
- Offline support is never assumed.
- AI-generated implementations require normal review.
- Recipe changes are versioned and tested against golden examples.

## Delivery

The CLI eventually exposes these recipes, but Markdown remains the human-readable authority until tooling is implemented and validated.
