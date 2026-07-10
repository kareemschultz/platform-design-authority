---
document_id: PDA-PLT-004
title: Authorization and Policy
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Authorization and Policy

## Purpose

Define how the platform determines whether a person, service, device, extension, automation, or AI agent may perform an action on a resource in a specific context.

## Authorization Model

The platform combines:

- Role-based access control for reusable job responsibilities
- Attribute-based policies for context-sensitive rules
- Resource scopes such as tenant, organization, legal entity, branch, location, department, team, or record owner
- Entitlement checks for purchased capabilities
- Approval and segregation-of-duties policies
- Data-classification and field-level restrictions
- Time, device, network, risk, and workflow-state conditions where justified

## Decision Inputs

An authorization decision may evaluate:

- Actor identity and type
- Tenant and organization context
- Effective roles and permissions
- Capability entitlement and current limits
- Resource ownership and classification
- Branch, location, department, and legal-entity scope
- Action risk and required assurance level
- Workflow and approval state
- Delegation, impersonation, or service-account context
- Device, session, and environmental risk

## Rules

1. Deny by default.
2. Every protected action must use a named canonical permission.
3. UI visibility is advisory; server-side enforcement is authoritative.
4. Authorization logic must be centralized through shared policy contracts rather than copied into modules.
5. Sensitive field access must be independently controllable from record access where required.
6. Privilege escalation, permission changes, impersonation, and break-glass use require enhanced audit.
7. Separation of duties must support policies such as creator cannot approve, payroll preparer cannot finalize, and refund initiator cannot settle above thresholds.
8. Policy decisions should be explainable to authorized administrators without exposing sensitive security internals.

## Permission Naming

Use `<domain>.<resource>.<action>`.

Examples:

- `commerce.order.create`
- `inventory.adjustment.approve`
- `finance.journal.post`
- `workforce.employee.compensation.read`
- `payroll.pay-run.finalize`

## Policy Outcomes

- Allow
- Deny
- Require approval
- Require step-up authentication
- Allow with field masking
- Allow within limit
- Allow read-only

## Delegation

Delegated access must specify delegator, delegate, scope, permissions, start, expiry, reason, revocation, and whether further delegation is permitted.

## Testing Requirements

- Permission matrix tests
- Cross-tenant denial tests
- Scope-boundary tests
- Field-level access tests
- Entitlement interaction tests
- Approval and separation-of-duties tests
- Impersonation and delegation tests
- AI and automation tool-authorization tests
