---
document_id: PDA-AI-010
title: First Slice AI Boundary
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# First Slice AI Boundary

## Purpose

Define the narrow, optional, measurable AI scope permitted in the first Guyana retail vertical slice while the platform proves deterministic business behavior, tenant isolation, privacy, audit, and operations.

## Governing Position

AI is a platform differentiator, but it is not allowed to conceal an incomplete product foundation.

The first slice must remain fully usable when:

- AI is disabled by the tenant
- The model provider is unavailable
- The tenant has no AI entitlement
- The user lacks AI permission
- The request exceeds budget or policy
- The retrieved evidence is insufficient
- The output fails validation or safety review

No essential sale, refund, cash close, stored-value, inventory, tax, payment, privacy, or recovery workflow depends on model output.

## Permitted Initial Use Case

### Store Operations Briefing

A read-only assistant may generate a manager briefing from authorized platform projections covering:

- Sales versus configured target
- Cash and register exceptions
- Stockouts and low-stock items
- Unreconciled inventory movements
- Returns, refunds, discounts, and stored-value anomalies already identified by deterministic rules
- Offline devices and synchronization backlog
- Provider, webhook, import, fiscal, privacy, or operational queues

The assistant summarizes existing facts and links to source records. It does not create transactions, change prices, approve refunds, adjust stock, move cash, suspend users, or make fraud accusations.

## Optional Secondary Prototype

An import-mapping assistant may suggest mappings between an uploaded source file and approved catalog or Party fields.

Controls:

- Suggestions are drafts.
- The user previews and confirms mappings.
- Domain validation and dry-run results remain authoritative.
- AI cannot create custom fields automatically.
- Restricted or Secret fields are excluded unless a separately approved policy permits them.
- The import remains idempotent and reversible through ordinary migration controls.

This prototype is not required for first-slice acceptance.

## Prohibited First-Slice AI Actions

- Autonomous payment, refund, stored-value, cash, or inventory mutation
- Autonomous price, discount, tax, or fiscal decision
- Autonomous user, role, permission, entitlement, or support-access change
- Autonomous privacy denial, erasure, legal-hold, or retention exception
- Autonomous fraud block or adverse customer decision
- Autonomous provider credential or webhook configuration
- Autonomous customer communication without review
- Training on tenant data by default
- Cross-tenant retrieval, memory, profiling, or reputation
- Unrestricted SQL, repository access, shell execution, or network requests
- Hidden fallback from deterministic logic to model judgment

## Tool Policy

The first assistant receives only approved read tools such as:

- Read store performance summary
- Read register and cash exceptions
- Read inventory exception summary
- Read return and refund summary
- Read stored-value exception summary
- Read device and synchronization health
- Read authorized operational queues
- Search permission-filtered documents and records

Every tool call enforces tenant, organization, location, permission, entitlement, purpose, classification, and rate limits independently of the model.

## Retrieval and Grounding

- Retrieval is performed through approved Search and Data Platform contracts.
- Results include source record, projection time, classification, and authorization context.
- The assistant cites source links or references for factual claims.
- Current stock, cash, payment, stored-value, entitlement, or permission decisions require authoritative revalidation outside the AI response.
- Retrieved text is treated as untrusted input and cannot redefine system instructions or tool policy.
- Low-confidence or conflicting evidence results in an explicit limitation, not invented certainty.

## Data Handling

AI inputs and outputs are classified before processing.

### Allowed by Default

- Aggregated Internal or Confidential operational metrics
- Authorized product and inventory summaries
- Sanitized exception descriptions
- Published policies and help content

### Restricted or Prohibited Without Separate Approval

- Authentication factors and secrets
- Raw payment credentials
- Government identifiers
- Payroll and compensation
- Health data
- Full customer contact exports
- Whistleblower or investigation records
- Raw support impersonation content
- Privacy-case evidence

Prompts, responses, traces, feedback, embeddings, and evaluation data follow ADR-0014 and the deletion journal.

## Model and Provider Policy

The model registry records:

- Provider and deployment
- Model identifier and version
- Region and residency
- Provider retention and training terms
- Approved data classifications
- Cost and rate limits
- Safety configuration
- Evaluation status
- Fallback and disable behavior
- Owner and review date

No provider is permanently embedded into domain code or customer promises.

## User Experience

- AI assistance is clearly identified.
- Source links and projection times are shown.
- The user can inspect underlying deterministic data.
- The assistant distinguishes fact, inference, recommendation, and unknown.
- A non-AI route remains available.
- The user can report an incorrect or unsafe response.
- The platform never implies the assistant is a licensed accountant, lawyer, tax adviser, regulator, or fraud investigator.
- Generated text respects locale, accessibility, and white-label presentation without impersonating the tenant's staff.

## Evaluation Dataset

The first evaluation set contains representative, synthetic or safely de-identified scenarios for:

- Healthy store
- Cash variance
- Low stock and stockout
- Pending offline sales
- Failed provider settlement
- Stored-value anomaly
- High return rate already identified by rules
- Conflicting or stale projections
- User without permission for one source
- Cross-tenant prompt attack
- Prompt injection in a document or product description
- Missing evidence
- Provider timeout

## Evaluation Measures

- Factual claim support rate
- Correct source citation
- Permission and tenant-isolation adherence
- Refusal of prohibited tools and data
- Detection of stale or conflicting evidence
- Unsupported-claim and hallucination rate
- Manager usefulness rating
- Time saved
- Cost and latency
- Accessibility of the experience
- Correct behavior when AI is unavailable

A release threshold is approved before customer preview. Model or prompt changes rerun the evaluation set.

## Human Oversight

The Store Operations Briefing is advisory. A manager may follow links and execute ordinary governed workflows. The AI output never counts as approval, evidence of reconciliation, a statutory filing, a fraud finding, or a posted business record.

## Audit and Monitoring

Record, subject to retention policy:

- Tenant and actor
- Agent, prompt, model, retrieval, and tool versions
- Tool calls and source references
- Classification and purpose
- Cost and latency
- Safety or policy decisions
- User feedback
- Protected hashes where raw content is unnecessary

Monitor cost spikes, repeated failures, suspicious tool requests, prompt injection, cross-tenant attempts, low-source coverage, and user override patterns.

## Incident Controls

Operators can disable by:

- Model
- Provider
- Agent
- Tool
- Tenant
- Capability
- Data classification
- Region

Disabling AI must not interrupt deterministic platform workflows.

## Maturity Gates

### Prototype

Internal or controlled test tenants, synthetic data preferred, read-only tools, no customer dependency.

### Customer Preview

Requires approved threat model, privacy review, evaluation threshold, cost controls, support runbook, tenant opt-in, and clear preview labeling.

### General Availability

Requires demonstrated reliability, accessibility, operational ownership, provider exit plan, documented limitations, audit, data-processing terms, and independent review.

Mutating agents require a separate future specification and approval.

## Relationship to NIST AI RMF

The first-slice process follows the NIST AI Risk Management Framework structure:

- Govern: ownership, policy, roles, incidents, and accountability
- Map: use case, affected users, data, context, and harms
- Measure: evaluations, security tests, cost, latency, and user outcomes
- Manage: release gates, limits, monitoring, fallback, and retirement

## Source Reference

- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework