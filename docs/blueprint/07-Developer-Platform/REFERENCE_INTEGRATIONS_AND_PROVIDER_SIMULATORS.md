---
document_id: PDA-DEV-009
title: Reference Integrations and Provider Simulators
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Reference Integrations and Provider Simulators

## Purpose

Define reusable examples and simulators for payment, tax, messaging, identity, storage, search, fiscalization, and external-system integrations.

## Reference Integration

Each reference demonstrates:

- Provider-neutral interface
- Tenant-scoped credentials
- Capability declaration
- Idempotency
- Webhook verification
- Uncertain and delayed state
- Retry and reconciliation
- Rate limiting
- Observability
- Migration and exit

## Simulator Behaviors

- Success
- Validation rejection
- Timeout
- Delayed result
- Duplicate callback
- Out-of-order callback
- Partial success
- Rate limit
- Credential expiry
- Certificate rotation
- Provider outage
- Reconciliation mismatch

## Initial Simulators

- Payment provider
- MMG-style request-to-pay wallet
- Tax provider
- Email and SMS provider
- Better Auth enterprise identity provider
- Fiscal authority submission endpoint
- Object storage
- Search indexing

## Rules

1. Simulators never pretend to certify production provider behavior.
2. Provider-specific features remain behind capability declarations.
3. Test fixtures include correlation and idempotency.
4. Sensitive credentials are synthetic.
5. Reference integrations are examples, not automatic architecture authority.

## Quality Gates

- Deterministic scenarios
- Contract tests
- Failure injection
- Tenant-isolation tests
- Documentation and sample applications
- Provider migration test
