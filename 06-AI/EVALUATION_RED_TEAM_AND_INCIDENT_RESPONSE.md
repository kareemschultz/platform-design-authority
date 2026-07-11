---
document_id: PDA-AI-014
title: AI Evaluation Red Team and Incident Response
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Evaluation, Red Team, and Incident Response

## Purpose

Define evidence required before AI release and the controls used to detect, contain, investigate, communicate, and remediate AI failures.

## Evaluation Families

- Task completion and business usefulness
- Grounding and citation support
- Tenant and permission isolation
- Tool selection and argument correctness
- Structured-output validity
- Refusal and approval behavior
- Prompt-injection resistance
- Sensitive-data leakage
- Bias, fairness, and harmful stereotyping where relevant
- Cost, latency, and availability
- Accessibility and language quality
- Regression against prior releases

## Dataset Governance

Evaluation cases record source, purpose, classification, consent or de-identification basis, owner, expected behavior, grading method, and expiry. Production data is not copied into evaluation sets casually.

## Red-Team Scenarios

- Cross-tenant extraction
- Prompt injection in documents, products, comments, and web content
- Tool escalation
- Indirect secret extraction
- Approval bypass
- Repeated low-value automation loops
- Fraud or social-engineering assistance
- Unsafe legal, medical, tax, or employment conclusions
- Model-provider outage or compromised response
- Memory poisoning

## Release Evidence

Each release stores model, prompt, tool, agent, policy, dataset, thresholds, result, reviewer, known limitations, rollback, and customer communication.

## Incident Levels

- Critical: cross-tenant disclosure, unauthorized consequential action, secret leakage, widespread unsafe output
- Major: material incorrect action, persistent policy failure, major availability or cost event
- Moderate: bounded quality regression or limited unsafe output
- Minor: cosmetic, isolated, or low-impact defect

## Response

1. Disable affected model, prompt, tool, agent, tenant, or capability.
2. Preserve privacy-safe evidence.
3. Determine scope and customer impact.
4. Revoke credentials or sessions if involved.
5. Correct downstream business state through domain workflows.
6. Notify affected customers and authorities where required.
7. Add regression cases.
8. Review provider, policy, and operational controls.

## Quality Gates

No AI capability reaches GA without repeatable evaluation, attack testing, owner, support runbook, kill switch, fallback, and documented residual risk.
