---
document_id: PDA-SEC-003
title: Risk Fraud and Anomaly Management
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Risk, Fraud, and Anomaly Management

## Purpose

Define a governed Security service for detecting, assessing, explaining, reviewing, and responding to suspicious identity, payment, commerce, stored-value, inventory, payroll, API, automation, and administrative behavior.

## Architectural Position

Risk management consumes authorized signals and recommends or enforces policy through approved domain contracts. It does not silently rewrite source transactions or become the authoritative owner of payments, orders, stock, payroll, identity, stored value, or audit records.

This service owns transactional and security risk decisions. Governance and Compliance owns enterprise risk registers, control assessments, audit findings, and compliance evidence. A transactional risk case may link to a Governance incident or control failure without merging the two ownership models.

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

The Security platform owns:

- Signal normalization
- Risk policies and versions
- Risk assessments and explanations
- Risk cases and review workflow
- Velocity, reputation, and anomaly features
- Cross-domain risk correlation within authorized scope
- Protective-action recommendations
- Model and rule performance monitoring
- Appeal and false-positive remediation evidence

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
- Laundering or prohibited transaction patterns
- Sanctions or restricted-party evasion
- Abuse of marketplace, payout, or communication services
- Deliberate misuse of AI or automation

Platform-operator investigation of tenant behavior requires separate authority, restricted access, legal basis, and audit. It must not become invisible support impersonation.

## Signal Categories

- Authentication failures, new devices, impossible travel, and recovery activity
- API keys, service identities, rate-limit events, and unusual integration behavior
- Payment authorization, refunds, chargebacks, and account changes
- Order velocity, unusual discounts, returns, gift cards, store credit, and loyalty redemption
- Inventory adjustments, shrinkage, voids, and unusual transfers
- Payroll account changes, off-cycle payments, and unusual overrides
- Privileged administration, impersonation, exports, and bulk changes
- AI tool calls, automation loops, and unusual cost or data access

## Risk Assessment Output

- Risk score or band
- Decision: allow, challenge, hold, review, limit, block, or monitor
- Policy and model versions
- Contributing signals and explanation
- Expiry and reassessment conditions
- Recommended business action
- Case and evidence references
- Appeal eligibility and review deadline

## Risk Case Model

A Risk Case contains:

- Tenant and operator scope
- Subject, Party, device, transaction, or application references
- Risk category and severity
- Assessment and contributing signals
- Assigned queue and owner
- State: Open, Triage, Investigating, Awaiting Information, Actioned, Appealed, Resolved, or Reopened
- Service-level target
- Evidence and notes
- Protective actions
- Customer or subject communication where permitted
- Appeal, override, and remediation history
- Closure reason and false-positive classification

## Human Review and Appeal

High-impact holds and blocks require clear queues, evidence, service levels, escalation, and override authority. Reviewers must see enough explanation to act without exposing protected model internals or unnecessary personal data.

Where policy or law permits, affected users or tenants receive a review or appeal route. A successful appeal reverses protective action through ordinary domain commands and records the reason; it does not erase the original assessment.

## Rules, Models, and Inline Limits

- Domains and engines may enforce local hard limits required for correctness, such as one-time token use or maximum offline redemption.
- The Risk service owns cross-transaction velocity, reputation, correlation, and anomaly policy.
- Begin with deterministic rules and velocity controls.
- Add statistical and machine-learning models only with labeled data, evaluation, drift monitoring, fairness review, and rollback.
- Separate detection confidence from business impact.
- Record false positives and false negatives.
- Never use protected characteristics unlawfully or infer sensitive traits without an approved basis.

## Cross-Tenant Correlation

Canonical Party identity is tenant-scoped unless an explicit platform-level legal basis and governance process permits otherwise. Cross-tenant correlation may use de-identified, aggregated, provider-supplied, or platform-abuse signals, but must not create a hidden global Party graph.

Any cross-tenant reputation feature requires a separate privacy, legal, security, and fairness review.

## Domain Enforcement

Examples:

- Better Auth may request step-up authentication or revoke sessions.
- Commerce may hold fulfillment or require manager approval.
- Payments may require provider challenge or block capture.
- Stored Value may reserve or suspend an instrument.
- Inventory may require dual approval for unusual adjustments.
- Payroll may freeze a bank-account change pending verification.
- AI Orchestration may reduce tool scope or require human approval.

## Privacy and Retention

Risk signals are classified and retained according to fraud, security, legal, and privacy policy. Access is restricted. Subject-access and deletion requests account for legal exemptions, investigation integrity, other parties' rights, and ADR-0014.

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
- Refund, discount, return, loyalty, and stored-value velocity rules
- Privileged export and impersonation alerts
- Payroll payment-detail change controls
- AI budget and loop anomalies
- Review queue, appeal, override, and audit

Advanced fraud models, consortium data, and cross-tenant identity correlation are deferred and require separate approval.