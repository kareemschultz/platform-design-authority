---
document_id: PDA-ARC-007
title: Integration Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Integration Architecture

## Purpose

Define how the platform connects to external applications, devices, providers, government systems, marketplaces, and customer infrastructure while preserving domain ownership and operational safety.

## Integration Types

- Public API client
- Webhook subscriber
- Event-stream consumer
- Managed connector
- File import or export
- Device or edge adapter
- Embedded application
- Marketplace extension
- Data warehouse or BI feed
- Government, tax, fiscal, banking, and payroll interface

## Adapter Pattern

External-system specifics belong in adapters. Business domains expose canonical commands, queries, and events. Adapters translate external formats without embedding provider rules in the domain core.

## Rules

1. Integrations may not write directly to domain databases.
2. Every integration declares tenant, scopes, permissions, entitlements, data access, rate limits, and owner.
3. Credentials must use the secrets service and support revocation and rotation.
4. Incoming messages require authentication, validation, deduplication, schema mapping, and quarantine for unsafe payloads.
5. Outbound delivery requires retries, signatures where appropriate, delivery history, and dead-letter handling.
6. Provider-specific identifiers must be mapped without replacing canonical platform identities.
7. Sync direction, authority, conflict policy, and deletion behavior must be explicit.
8. Integration failures must be visible to administrators and affected users when business work is delayed.

## Synchronization Modes

- Real-time synchronous
- Event-driven near-real-time
- Scheduled incremental synchronization
- Full reconciliation
- User-triggered import or export
- Offline or edge relay

## Connector Lifecycle

- Available
- Configuring
- Validating
- Active
- Degraded
- Suspended
- Revoked
- Deprecated

## Data Mapping

Mappings must support canonical fields, custom fields, reference values, units, currencies, time zones, tax codes, conflict rules, and version history.

## Operational Requirements

- Per-tenant quotas and throttling
- Circuit breakers and provider health
- Replay and reconciliation
- Sandbox and test credentials
- Version and compatibility management
- Cost and usage visibility
- Support diagnostics with sensitive-data masking

## Quality Gates

- Contract and mapping tests
- Duplicate and out-of-order tests
- Credential revocation tests
- Provider outage simulations
- Reconciliation tests
- Tenant-isolation and data-minimization review
