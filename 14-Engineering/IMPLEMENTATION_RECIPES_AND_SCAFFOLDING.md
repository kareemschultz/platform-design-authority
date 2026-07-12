---
document_id: PDA-ENGR-011
title: Implementation Recipes and Scaffolding
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
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
- New Better Auth core option or plugin
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

## Example: Better Auth Core Option or Plugin

1. Verify the current stable release, official option/plugin page, package, maturity, changelog, and advisories.
2. Confirm the decision in `PDA-PLT-028`; if absent or different, update the matrix, ADR-0006, identity specification, dated evidence, and lifecycle ledger before code.
3. Inventory schema, migrations, routes, methods, cookies, secrets, hooks, claims, external processors, managed-service costs, and data flows.
4. Prove the option does not own Party, tenancy, business roles/permissions, entitlements, approvals, payment, subscriptions, domain roles, or AI authority.
5. Pin the exact core and plugin packages, generate schema to a review branch, and diff endpoints and migrations.
6. Add tenant-isolation, denial, CSRF/origin, proxy, cookie, linking, recovery, revocation, replay, enumeration, audit, rollback, and runtime compatibility tests as applicable.
7. Update the technology lessons ledger with any breaking change, workaround, failure, or reusable result.

## Guardrails

- Generated code may not cross domain boundaries.
- Templates do not decide ownership.
- Scaffolded permissions and entitlements start denied.
- Offline support is never assumed.
- AI-generated implementations require normal review.
- Recipe changes are versioned and tested against golden examples.

## Delivery

The CLI eventually exposes these recipes, but Markdown remains the human-readable authority until tooling is implemented and validated.
