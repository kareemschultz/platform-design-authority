---
document_id: PDA-PLT-004
title: Authorization and Policy
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# Authorization and Policy

## Purpose

Define how the platform determines whether a person, service, device, extension, automation, or AI agent may perform an action on a resource in a specific context.

## Authorization Model

The platform combines role-based access control, attribute-based policy, resource scopes, entitlement checks, approvals, segregation of duties, data-classification restrictions, and contextual conditions such as time, device, risk, and workflow state.

## Decision Inputs

An authorization decision may evaluate actor identity and type, tenant and organization, roles and permissions, canonical capability entitlement from `registry/capabilities.json`, limits, resource ownership, classification, scope, risk, assurance, workflow, delegation, device, and session context.

## Rules

1. Deny by default.
2. Every protected action uses a named canonical permission.
3. UI visibility is advisory; server enforcement is authoritative.
4. Shared policy contracts centralize authorization logic.
5. Sensitive field access can be controlled independently from record access.
6. Privilege escalation, permission changes, impersonation, and break-glass use require enhanced audit.
7. Segregation of duties supports creator-versus-approver and initiator-versus-settler rules.
8. Decisions are explainable to authorized administrators without exposing sensitive security internals.
9. A permission does not create an entitlement, and an entitlement does not grant an actor permission.
10. Current policy is re-evaluated for consequential operations rather than trusted permanently from a token or UI state.

## Permission Naming

Use exactly:

`<namespace>.<resource>.<action>`

A resource may use hyphens when a precise compound noun is required. Do not add a fourth dot-separated segment.

Examples:

- `commerce.order.create`
- `inventory.adjustment.approve`
- `finance.journal.post`
- `workforce.compensation.read`
- `payroll.pay-run.finalize`
- `payment.intent.refund`

Every implementation permission must resolve through the governed permission registry appropriate to its delivery scope.

## Policy Outcomes

- Allow
- Deny
- Require approval
- Require step-up authentication
- Allow with field masking
- Allow within limit
- Allow read-only

## Delegation

Delegated access specifies delegator, delegate, scope, permissions, start, expiry, reason, revocation, and whether further delegation is permitted.

## Testing Requirements

- Permission-registry validation
- Permission matrix tests
- Cross-tenant denial tests
- Scope-boundary tests
- Field-level access tests
- Entitlement interaction tests
- Approval and segregation-of-duties tests
- Impersonation and delegation tests
- AI and automation tool-authorization tests
