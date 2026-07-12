---
document_id: PDA-TST-011
title: Specialist Testing Standards
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Specialist Testing Standards

## Purpose

Define focused testing requirements for tenant isolation, ledgers, offline synchronization, providers, accessibility, performance, jurisdictions, and AI.

## Tenant Isolation

- Identifier substitution across every API and UI path
- Cross-tenant cache, search, file, event, export, job, support, and AI tests
- Partner and delegated-scope tests
- Property-based tenant-boundary tests
- Database and repository contract tests

## Ledger and Financial Correctness

- Balance invariants
- Duplicate source and idempotency
- Concurrent posting
- Reversals and partial reversals
- Currency and rounding
- Restore and replay
- Reconciliation to source and provider
- Privacy pseudonymization without economic change

## Offline

- Network loss at each transition
- Long disconnection
- Lease expiry
- Duplicate and out-of-order replay
- Number-range exhaustion
- Conflict handling
- Lost or revoked device
- Privacy tombstones
- Server restore followed by resynchronization

## Provider Simulators

Simulators model success, delay, duplicate webhook, out-of-order webhook, timeout, uncertain state, partial refund, rejection, rate limit, malformed payload, certificate rotation, and outage.

## Accessibility

- Automated static checks
- Keyboard-only workflows
- Screen-reader workflows
- Zoom and reflow
- High contrast and reduced motion
- Touch and external keyboard/scanner
- Error prevention and recovery

## Performance

- POS and search latency
- Large catalogs and tenants
- Inventory posting throughput
- Bulk import and export
- Queue backlog recovery
- Noisy-neighbor isolation
- Offline local-store growth
- Cost per workflow

## Jurisdiction Certification

Every statutory pack includes source evidence, effective dates, calculation examples, expected forms, corrections, edge cases, historical replay, and reviewer approval.

## AI Evaluation

- Grounding and citation
- Tenant and permission isolation
- Tool correctness
- Prompt injection
- Sensitive data
- Refusal and approval
- Cost and latency
- Regression by model and prompt version

## Evidence

Each specialist suite records version, environment, data, expected invariants, result, artifacts, reviewer, defects, and accepted residual risk.
