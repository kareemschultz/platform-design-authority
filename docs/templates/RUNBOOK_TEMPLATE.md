---
document_id: PDA-OPS-NNN
title: Service or Incident Runbook
version: 0.1.0
status: Draft
owner: Named service owner
last_reviewed: YYYY-MM-DD
related_adrs: []
document_class: operations-runbook
declared_depth: ownership-defined
evidence_state: planned
applicable_dimensions: [authority-and-scope, data-and-integrity, contracts-and-compatibility, authority-controls, offline-and-degraded, failure-and-recovery, security-and-privacy, verification-and-evidence, references-and-traceability]
---

# Service or Incident Runbook

## Purpose and Authority Boundary

Name the implemented service, environment, authorized operator, prohibited actions, tenant boundary, and capability/contract scope. State whether the procedure is planned, implemented, reviewed, or exercised.

## Trigger, Impact, and Preconditions

Name the alert or observation, user/business impact, safe prerequisites, required permission or approval, and evidence that must be captured before action.

## Safe Diagnosis

Provide ordered, read-only diagnostics; redact secrets and protected data; distinguish liveness, readiness, business correctness, and projection freshness.

## Containment and Degraded Behavior

Describe containment, offline/degraded behavior, uncertainty, traffic or job controls, and the conditions that require escalation rather than operator mutation.

## Recovery and Rollback

Provide bounded recovery and rollback steps. Prohibit direct fact edits, audit deletion, unsafe replay, and unverified destructive action. Financial, inventory, payroll, stored-value, cash, and audit corrections use reversal or compensation.

## Verification and Closure

Name post-recovery checks, reconciliation, tenant-isolation checks, retained evidence, communications, residual risk, owner, and closure authority.

## Escalation

Name the service owner, Security/Privacy trigger, provider or professional dependency, time threshold, and handoff evidence.

## Applicability Record

Map every class-required dimension to an exact section in `registry/document-class-adoption.json`, or record `not-applicable` with an artifact-specific reason. A procedure cannot claim `verified` without a dated review, test, or exercise.
