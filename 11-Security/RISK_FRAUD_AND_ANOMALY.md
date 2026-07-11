---
document_id: PDA-SEC-003
title: Risk Fraud and Anomaly Management
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Risk, Fraud, and Anomaly Management

## Purpose

Define a governed service for detecting, assessing, explaining, and responding to suspicious identity, payment, commerce, inventory, payroll, API, automation, and administrative behavior.

## Architectural Position

Risk management consumes authorized signals and recommends or enforces policy through approved domain contracts. It does not silently rewrite source transactions or become the authoritative owner of payments, orders, stock, payroll, identity, or audit records.

## Initial Ownership

The Security platform owns:

- Signal normalization
- Risk policies and versions
- Risk assessments
- Case creation
- Decision explanations
- Velocity, reputation, and anomaly features
- Cross-domain risk correlation
- Model and rule performance monitoring

Domains own the final business action unless a pre-approved security policy permits an immediate protective block.

## Signal Categories

- Authentication failures, new devices, impossible travel, and recovery activity
- API keys, service identities, rate-limit events, and unusual integration behavior
- Payment authorization, refunds, chargebacks, and account changes
- Order velocity, unusual discounts, returns, gift cards, and loyalty redemption
- Inventory adjustments, shrinkage, voids, and unusual transfers
- Payroll account changes, off-cycle payments, and unusual overrides
- Privileged administration, impersonation, exports, and bulk changes
- AI tool calls, automation loops, and unusual cost or data access

## Assessment Output

- Risk score or band
- Decision: allow, challenge, hold, review, limit, block, or monitor
- Policy and model versions
- Contributing signals and explanation
- Expiry and reassessment conditions
- Recommended business action
- Case or evidence references

## Human Review

High-impact holds and blocks require clear queues, evidence, service levels, escalation, and override authority. Reviewers must see enough explanation to act without exposing protected model internals or unnecessary personal data.

## Rules and Models

- Begin with deterministic rules and velocity controls.
- Add statistical and machine-learning models only with labeled data, evaluation, drift monitoring, and rollback.
- Separate detection confidence from business impact.
- Record false positives and false negatives.
- Never use protected characteristics unlawfully or infer sensitive traits without an approved basis.

## Domain Enforcement

Examples:

- Better Auth may request step-up authentication or revoke sessions.
- Commerce may hold fulfillment or require manager approval.
- Payments may require provider challenge or block capture.
- Inventory may require dual approval for unusual adjustments.
- Payroll may freeze a bank-account change pending verification.
- AI Orchestration may reduce tool scope or require human approval.

## Privacy and Retention

Risk signals are classified and retained according to fraud, security, legal, and privacy policy. Access is restricted. Subject-access and deletion requests must account for legal exemptions, investigation integrity, and third-party rights.

## Events

- `security.risk-assessment-created.v1`
- `security.risk-decision-changed.v1`
- `security.review-required.v1`
- `security.protective-action-applied.v1`
- `security.risk-case-closed.v1`

## Initial Scope

- Authentication and account-takeover signals
- Refund, discount, return, and loyalty velocity rules
- Privileged export and impersonation alerts
- Payroll payment-detail change controls
- AI budget and loop anomalies
- Review queue and override audit

Advanced fraud models and consortium data are later capabilities requiring separate privacy, legal, and model-governance review.
