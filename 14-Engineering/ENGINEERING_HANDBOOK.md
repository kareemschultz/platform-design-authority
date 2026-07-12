---
document_id: PDA-ENGR-010
title: Engineering Handbook
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Engineering Handbook

## Purpose

Define the working standards for architecture, code, packages, reviews, dependencies, migrations, testing, security, release, and documentation.

## Repository Structure

Use a monorepo with clear application, package, domain, engine, platform, tooling, and documentation boundaries. Package names and imports must reflect ownership rather than convenience.

## TypeScript Standards

- Strict mode
- No untyped external data
- Runtime validation at trust boundaries
- Explicit money, quantity, time, tenant, and identifier types
- Exhaustive state handling
- No broad `any` or silent casts
- Provider types translated into platform contracts

## Domain Boundaries

- No direct cross-domain repository imports
- No writes to another owner's tables
- Commands, queries, and events are explicit
- Transaction boundaries are documented
- Outbox publication accompanies consequential state changes
- Architecture tests enforce dependency direction

## Code Review

Every review checks correctness, ownership, tenant isolation, permissions, entitlements, privacy, audit, idempotency, failure states, migration, observability, accessibility, and test evidence.

Large changes are split by coherent vertical behavior, not arbitrary file count.

## Dependencies

- Prefer well-maintained, licensed, replaceable libraries
- Pin and review critical dependencies
- Generate SBOMs
- Monitor vulnerabilities and abandoned packages
- Avoid framework-specific business logic
- Require an ADR for platform-wide stack changes

## Database Changes

Use reviewed migrations, expand-and-contract patterns, bounded locks, backfills, tenant-safe verification, rollback or compensation, and restore rehearsal for consequential changes.

## Error Handling

Errors are typed, safe, correlated, localized at the UI boundary, and classified as validation, authorization, entitlement, conflict, dependency, provider uncertainty, or internal failure.

## Security

- Secrets never enter source or logs
- Least privilege for workloads and operators
- Dependency and container scanning
- Secure defaults
- Threat modeling for first-slice capabilities
- Cross-tenant negative tests
- Signed artifacts and protected release paths

## Release

A release requires passing tests, migrations, compatibility review, documentation, observability, rollback, support notes, and approval appropriate to risk.

## Documentation

Code changes update governing and implementation documentation. Draft specifications do not become production authority through implementation.

## Definition of Done

A capability is done only when behavior, denial, failure, recovery, audit, privacy, accessibility, performance, operations, support, and documentation are verified.
