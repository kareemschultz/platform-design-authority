---
document_id: PDA-AI-014
title: AI Evaluation Red Team and Incident Response
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Evaluation, Red Team, and Incident Response

## Purpose

Define evidence required before AI release and the controls used to detect, contain, investigate, communicate, and remediate AI failures.

## Ownership

- AI Product Owner: business usefulness, release scope, customer disclosure
- AI Evaluation Owner: datasets, graders, thresholds, regression evidence
- Security Owner: prompt injection, tool abuse, sensitive data, red team
- Privacy Owner: classification, retention, data-subject and provider review
- Operations Owner: monitoring, incidents, provider outage, kill switches
- Domain Owner: authoritative workflow correctness and mutation consequences

One person may hold multiple roles during the founding stage, but the review responsibilities remain distinct and recorded.

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

Evaluation cases record source, purpose, classification, consent or de-identification basis, owner, expected behavior, grading method, expiry, and known limitations.

Production data enters an evaluation set only through an approved, documented process. “Casual” or undocumented copying is prohibited.

## Provisional Dataset Sizes

Minimum pre-release suites:

| Risk level | Functional cases | Security/adversarial cases | Regression cases |
|---|---:|---:|---:|
| Low, read-only | 100 | 50 | 50 |
| Moderate, recommendation or draft | 250 | 150 | 100 |
| High, confirmed single action | 500 | 300 | 200 |
| Very high, approved workflow or bounded automation | 1,000 | 750 | 500 |

These are minimum case counts, not proof of representativeness. Add domain, language, region, device, data-volume, and failure-mode coverage as risk requires.

## Grading Methods

Use a combination of:

- Deterministic assertions
- Exact schema validation
- Domain invariant checks
- Source and citation verification
- Human expert rating with a rubric
- Pairwise comparison
- Adversarial success/failure
- Production telemetry after release

Model-based graders may assist but cannot be the sole judge of tenant isolation, permission, financial correctness, tool authorization, or sensitive-data leakage.

## Provisional Release Thresholds

### All Production AI

- Cross-tenant access or disclosure: 0 tolerated failures
- Unauthorized tool or permission bypass: 0 tolerated failures
- Secret or prohibited-data disclosure: 0 tolerated failures
- Structured-output validity: at least 99.5% for tool-bound outputs
- Required source/citation presence: at least 99% where grounding is mandatory
- Unsupported material factual claim: less than 1% in the release suite
- Kill-switch and fallback test: 100% pass

### Read-Only and Draft Assistance

- Task success: at least 90%
- User-rated usefulness: at least 4 of 5 median in controlled review
- Correct refusal on prohibited requests: at least 98%
- p95 latency and cost within the approved capability budget

### Mutating Capabilities

- Correct tool selection and arguments: at least 99.5%
- Correct approval or confirmation behavior: 100%
- Idempotency and duplicate protection: 100%
- Compensation or reversal test: 100%
- Unsafe autonomous mutation: 0 tolerated failures

A threshold exception requires documented residual risk, owner, compensating controls, limited rollout, expiry, and approval.

## Red-Team Scenarios

- Cross-tenant extraction
- Prompt injection in documents, products, comments, web content, extensions, and provider responses
- Tool escalation
- Indirect secret extraction
- Approval bypass
- Repeated automation loops and budget exhaustion
- Fraud or social-engineering assistance
- Unsafe legal, medical, tax, financial, privacy, or employment conclusions
- Model-provider outage or compromised response
- Memory poisoning and retrieval poisoning
- Multi-agent delegation cycles
- Marketplace AI-pack abuse

## Cadence

- Before every new agent, tool, model, prompt major version, or autonomy-level increase
- Before Customer Preview, Limited Availability, and GA
- Monthly automated regression for active customer-facing AI
- Quarterly adversarial review for Moderate and higher risk
- Annual independent red-team exercise for High and Very High risk capabilities
- Immediate targeted rerun after an incident, provider change, or material security advisory

## Release Evidence

Each release stores model, prompt, tool, agent, policy, dataset, thresholds, result, reviewer, deviations, known limitations, budget, fallback, rollback, support guidance, and customer communication.

## Incident Levels and Clocks

| AI level | Examples | Acknowledge | Contain or disable target |
|---|---|---:|---:|
| AI-1 Critical | Cross-tenant disclosure, Secret leakage, unauthorized consequential action, widespread harmful mutation | 15 minutes | 30 minutes |
| AI-2 Major | Material incorrect action, persistent policy failure, unsafe output affecting customers, provider compromise | 30 minutes | 2 hours |
| AI-3 Moderate | Bounded quality or refusal regression, limited cost or availability event | 4 hours | 1 business day |
| AI-4 Minor | Cosmetic, wording, isolated low-impact defect | 1 business day | Planned release |

AI-1 maps to Operational Severity 1 and Security SEC-1. AI-2 maps to Severity 2 or SEC-2 as applicable.

Containment clocks do not replace statutory or contractual notification clocks. Potential personal-data or cross-tenant disclosure immediately enters the Security Operations notification decision flow.

## Response

1. Disable the narrowest affected model, prompt, tool, agent, provider, tenant, or capability.
2. Preserve privacy-safe evidence and exact versions.
3. Determine scope, tenant, records, actions, cost, and customer impact.
4. Revoke credentials or sessions if involved.
5. Stop loops and release unused budget reservations.
6. Correct downstream state through domain-owned workflows.
7. Notify customers, providers, insurers, or authorities where required.
8. Add regression and red-team cases.
9. Review provider, prompt, tool, memory, policy, and operational controls.
10. Verify restoration before re-enabling.

## Quality Gates

No AI capability reaches GA without repeatable evaluation, named owners, thresholds, attack testing, support runbook, kill switch, evaluated fallback, provider-exit plan, monitoring, incident clocks, and documented residual risk.