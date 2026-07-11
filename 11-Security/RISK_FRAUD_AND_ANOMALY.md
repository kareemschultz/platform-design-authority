---
document_id: PDA-SEC-003
title: Risk Fraud and Anomaly Management
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0014]
---

# Risk, Fraud, and Anomaly Management

## Purpose

Define a governed Security service for detecting, assessing, explaining, reviewing, and responding to suspicious identity, payment, commerce, stored-value, inventory, payroll, API, automation, and administrative behavior.

## Architectural Position

Risk management consumes authorized signals and recommends or enforces policy through approved domain contracts. It does not silently rewrite source transactions or become the authoritative owner of payments, orders, stock, payroll, identity, stored value, or audit records.

This service owns transactional and security risk decisions. Governance and Compliance owns enterprise risk registers, control assessments, audit findings, and compliance evidence.

## Capability Family

- `security.risk-signals`
- `security.risk-policies`
- `security.risk-assessments`
- `security.risk-cases`
- `security.velocity-controls`
- `security.protective-actions`
- `security.risk-appeals`
- `security.model-monitoring`

## Core Ownership

The Security platform owns signal normalization, policies, assessments, explanations, cases, velocity and anomaly features, authorized correlation, protective recommendations, performance monitoring, appeal, and false-positive remediation.

Domains own the final business action unless a pre-approved security policy permits an immediate, reversible protective block.

## Threat Categories

### Fraud Against a Tenant

- Account takeover
- Stolen credentials or payment instruments
- Refund, return, loyalty, or stored-value abuse
- Employee theft and unauthorized discounts
- Inventory shrinkage
- Payroll diversion

### Fraud by a Tenant or Platform Customer

- Trial abuse and fake accounts
- Card testing
- Laundering or prohibited patterns
- Sanctions or restricted-party evasion
- Abuse of marketplace, payout, or communication services
- Deliberate misuse of AI or automation

Platform investigation requires separate authority, restricted access, legal basis, and audit.

## Signal Categories

- Authentication failures, new devices, impossible travel, and recovery
- API keys, service identities, rate-limit and integration anomalies
- Payment authorization, refunds, disputes, and account changes
- Order velocity, discounts, returns, gift cards, store credit, and loyalty
- Inventory adjustments, shrinkage, voids, and transfers
- Payroll account changes and unusual overrides
- Privileged administration, impersonation, exports, and bulk changes
- AI tool calls, automation loops, and unusual cost or data access

## Risk Assessment Output

- Risk score or band
- Allow, challenge, hold, review, limit, block, or monitor
- Policy and model versions
- Contributing signals and explanation
- Expiry and reassessment
- Recommended business action
- Case and evidence references
- Appeal eligibility and deadline

## Risk Case Model

A Risk Case contains tenant and operator scope, subject references, category, severity, assessment, signals, owner, state, service target, evidence, actions, communication, appeal, override, remediation, and closure reason.

States: Open, Triage, Investigating, Awaiting Information, Actioned, Appealed, Resolved, and Reopened.

## Human Review and Appeal

High-impact holds and blocks require queues, evidence, service levels, escalation, and override authority. Successful appeal reverses protective action through ordinary domain commands and records the reason.

## Rules, Models, and Inline Limits

- Domains may enforce local hard limits required for correctness.
- Risk owns cross-transaction velocity, reputation, correlation, and anomaly policy.
- Begin with deterministic rules and velocity controls.
- Add models only with labeled data, evaluation, drift, fairness, and rollback.
- Separate detection confidence from business impact.
- Record false positives and false negatives.
- Do not infer sensitive traits without an approved basis.

## Cross-Tenant Correlation

Canonical Party identity is tenant-scoped. Cross-tenant correlation may use de-identified, aggregated, provider-supplied, or platform-abuse signals but cannot create a hidden global Party graph.

Any cross-tenant reputation feature requires separate privacy, legal, security, and fairness review.

## Domain Enforcement

Better Auth may request step-up or revoke sessions. Commerce may hold fulfillment. Payment may challenge or block capture. Stored Value may reserve or suspend. Inventory may require dual approval. Payroll may freeze a payment-detail change. AI may reduce scope or require approval.

## Signal Retention Policy

Provisional retention classes, subject to jurisdiction, contract, legal hold, and professional review:

| Class | Examples | Default retention |
|---|---|---:|
| R0 transient | In-memory rate windows and unsuccessful low-risk checks | 24 hours or less |
| R1 operational | Ordinary velocity features and low-risk assessments | 90 days |
| R2 security | Authentication abuse, privileged anomalies, account takeover evidence | 1 year |
| R3 financial/fraud case | Payment, refund, stored-value, inventory, payroll, or marketplace investigation evidence | 7 years after closure |
| R4 legal hold | Evidence subject to litigation, regulator, or investigation hold | Until released plus ordinary class period |
| R5 model evaluation | De-identified labeled examples and performance evidence | 12 months then review |

Rules:

1. Raw signals are minimized; derived features are preferred when sufficient.
2. Secret data and raw credentials are prohibited.
3. A case may preserve linked evidence longer than the ordinary signal window only with an explicit basis.
4. Privacy requests account for legal exemptions and investigation integrity under ADR-0014.
5. Expired signals are deleted or irreversibly pseudonymized from stores, features, search, analytics, AI memory, and backups according to policy.
6. Cross-tenant features use shorter retention unless separate approval establishes a need.
7. Retention configuration is effective-dated and auditable.

## Events

- `security.risk-assessment.created.v1`
- `security.risk-decision.changed.v1`
- `security.risk-review.required.v1`
- `security.protective-action.applied.v1`
- `security.protective-action.reversed.v1`
- `security.risk-case.closed.v1`
- `security.risk-appeal.received.v1`

## Initial Scope

- Authentication and account-takeover signals
- Refund, discount, return, loyalty, and stored-value velocity
- Privileged export and impersonation alerts
- Payroll payment-detail change controls
- AI budget and loop anomalies
- Review queue, appeal, override, audit, and retention enforcement

Advanced models, consortium data, and cross-tenant identity correlation are deferred.