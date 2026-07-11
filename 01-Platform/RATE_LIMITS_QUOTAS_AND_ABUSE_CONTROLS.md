---
document_id: PDA-PLT-025
title: Rate Limits Quotas and Abuse Controls
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Rate Limits, Quotas, and Abuse Controls

## Purpose

Define platform-wide controls for protecting availability, containing cost, enforcing commercial limits, preventing accidental overload, and responding to abusive behavior.

## Separation of Concerns

- **Rate limits** control activity over a time window.
- **Concurrency limits** control simultaneous work.
- **Quotas** control cumulative consumption.
- **Entitlement limits** define what an organization purchased.
- **Security controls** respond to suspicious or malicious behavior.
- **Infrastructure capacity controls** protect shared resources.

These controls may share measurement infrastructure but must retain distinct reasons, policies, and customer messages.

## Policy Dimensions

Policies may scope by:

- Tenant and organization
- User, service identity, API key, device, or IP range
- Application and environment
- Capability and operation
- Endpoint or event type
- AI model or tool
- Import, export, report, job, or webhook workload
- Commercial plan, contract, or temporary override

## Limit Types

- Requests per interval
- Burst allowance
- Concurrent operations
- Queue depth
- Rows, bytes, files, or records
- Storage and retention volume
- Daily, monthly, or billing-period usage
- AI tokens, cost, or executions
- Webhook deliveries and retries
- Export size and frequency

## Enforcement Rules

1. Protect authentication, recovery, OTP, and public endpoints at the edge and application layers.
2. Evaluate tenant and capability context before applying business-specific limits.
3. Return stable machine-readable error codes and retry guidance.
4. Never represent a security suspension as a normal commercial overage.
5. Do not silently discard authoritative business work because a background limit was reached.
6. Use queues and backpressure for deferrable workloads.
7. Require approval for manual overrides and record expiry.
8. Prevent one tenant's workload from exhausting shared capacity.

## Customer Experience

Where safe, expose:

- Current usage and limit
- Reset or billing-period time
- Retry guidance
- Upgrade or request-capacity path
- Operational status and queued work

Security-sensitive limits may intentionally reveal less detail.

## Technical Behavior

- Token-bucket or equivalent burst handling
- Distributed counters only where necessary
- Local fast-path protection combined with authoritative accounting
- Idempotency so retries do not consume duplicate quota unfairly
- Circuit breakers and load shedding for dependencies
- Priority classes for interactive, financial, synchronization, and bulk work
- Fair scheduling across tenants

## Offline and Synchronization

Offline leases may include bounded transaction, numbering, storage, and time limits. Reconnection evaluates submitted work against the lease rather than applying only the current online rate window.

## AI and Automation

AI and automation require budget limits, loop detection, maximum steps, timeouts, and human approval thresholds. A single rule, workflow, or agent must not generate unbounded recursive work.

## Observability

Track decisions, near-limit warnings, rejected work, queue delays, overrides, abusive patterns, top consumers, cost attribution, and false-positive investigations.

## Initial Scope

- Authentication and API limits
- Bulk import and export limits
- Report and job concurrency
- Webhook delivery limits
- AI budgets
- Tenant-level fair-use protection
