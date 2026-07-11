---
document_id: PDA-TST-010
title: Platform Testing Strategy
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Platform Testing Strategy

## Purpose

Define the quality system for a modular, multi-tenant, offline-capable, financially consequential, white-label, AI-assisted Business Operating Platform.

## Testing Principles

1. Test business invariants, not only code coverage.
2. Every capability proves tenant isolation, permission, entitlement, audit, and failure behavior.
3. Ledger and statutory systems test reversal and reconciliation, not destructive correction.
4. Provider integrations are tested against recorded contracts and failure simulation.
5. Offline workflows test disconnection, duplication, stale authority, and conflict recovery.
6. Accessibility, usability, and performance are release criteria.
7. AI requires evaluation datasets and tool-safety tests, not anecdotal prompting.
8. Production incidents create regression tests where practical.

## Test Layers

### Unit and Domain Tests

- Value objects and calculations
- State transitions and invariants
- Policy and rule evaluation
- Rounding, currency, quantity, time, and effective dating
- Serialization and schema validation

### Module and Application Tests

- Commands, queries, repositories, and domain events
- Permission and entitlement enforcement
- Idempotency and duplicate handling
- Outbox behavior
- Audit evidence
- Cross-domain contract boundaries

### Integration Tests

Use real PostgreSQL and representative infrastructure through Testcontainers or equivalent for:

- Database constraints and migrations
- Redis and job behavior
- Event delivery
- Object storage
- Search projections
- Better Auth adapter
- Provider adapters and webhook verification

### Contract Tests

- Public REST and OpenAPI contracts
- Event schemas and compatibility
- Webhook signatures and retries
- SDK generation
- Provider adapter capability declarations
- Offline synchronization protocol

### End-to-End Tests

- Role-based user workflows
- White-label branding and custom domains
- Payments, stored value, inventory, and returns
- Import and export
- Support and delegated administration
- Browser and native applications

### Security Tests

- Cross-tenant read, write, search, export, event, file, and cache denial
- Authorization bypass and confused-deputy cases
- Session, recovery, passkey, SSO, and API-key abuse
- Injection, SSRF, deserialization, and malicious-file cases
- Rate-limit and credential-stuffing behavior
- Support impersonation
- AI prompt injection and tool escalation

### Offline and Resilience Tests

- Network loss at every state transition
- Duplicate replay
- Out-of-order synchronization
- Device lease expiry
- Privacy tombstone application
- Offline numbering ranges
- Stored-value reservations
- Server restore followed by client resynchronization

### Performance Tests

- POS transaction latency
- Product search and scanning
- Inventory posting throughput
- Report and export limits
- Tenant-noisy-neighbor tests
- Background queue recovery
- Webhook fan-out
- Mobile cold start and offline database size

### Accessibility and Experience Tests

- Keyboard and screen-reader workflows
- Focus, errors, status, and confirmation
- Touch and mobile ergonomics
- High contrast and zoom
- Offline, stale, conflict, and pending-state clarity
- Workflow completion time and error rate

### AI Evaluation

- Grounded-answer accuracy
- Retrieval authorization
- Tool-selection correctness
- Refusal and approval behavior
- Hallucination and unsupported-claim rate
- Prompt-injection resistance
- Cost and latency
- Regression by model and prompt version

## Mandatory Capability Test Matrix

Every first-slice capability must declare:

- Happy path
- Validation failures
- Authorization failures
- Entitlement failures
- Tenant-isolation failures
- Idempotency and retry
- Audit evidence
- Provider or dependency outage
- Offline behavior or explicit not-supported result
- Privacy and retention
- Accessibility
- Performance budget
- Recovery and reconciliation

## Financial and Ledger Testing

For Finance, Inventory, Stored Value, Payments, Payroll, and fiscal records:

- Balance invariants
- Reversal chains
- Partial operations
- Multi-currency rounding
- Period boundaries
- Concurrent posting
- Duplicate source events
- Reconciliation to source and external provider
- Restore and replay

Property-based and model-based tests should be used for high-value invariants.

## Migration Testing

- Forward migration
- Rollback or compensating migration
- Large representative dataset
- Tenant-by-tenant validation
- Extension-field compatibility
- Backfill idempotency
- Zero or bounded downtime
- Restore from pre-migration backup

## Environments

- Local deterministic environment
- CI ephemeral integration environment
- Shared development environment
- Staging with production-like topology and synthetic data
- Controlled pilot environment
- Production

Production data must not be copied into lower environments without approved de-identification.

## Release Gates

A release candidate requires:

- Governance and registry checks passing
- Architecture-boundary checks passing
- Unit, module, integration, and contract suites passing
- No unresolved critical security findings
- Tenant-isolation suite passing
- Migration rehearsal passing
- Accessibility and performance budgets met
- Recovery procedure verified for consequential changes
- Required manual approvals recorded

## First-Slice Acceptance Suite

The Caribbean retail slice must prove:

- Better Auth login, session revocation, and step-up
- Tenant and legal-entity isolation
- Catalog and product search
- Register open, cash sale, mixed tender, and close
- Inventory movement and reconciliation
- Stored-value issue and redemption
- Offline sale, numbering, and sync
- Return and refund policy
- Audit and support access
- Search and export permissions
- Backup restore and privacy reapplication
- Provider webhook and settlement reconciliation seam

## Evidence and Reporting

Test evidence records version, environment, data set, tenant, capability, result, duration, logs, artifacts, reviewer, waived failures, and linked defects. Flaky tests are defects and cannot be normalized into permanent retries.