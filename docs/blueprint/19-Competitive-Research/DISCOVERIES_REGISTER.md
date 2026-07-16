---
document_id: PDA-CIR-016
title: Competitive Research Discoveries Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Discoveries Register

## 1. Purpose

This register captures surprising, cross-cutting, or strategically important discoveries that emerge during research but do not yet belong in a domain authority, ADR, capability registry, pain-point register, or differentiation claim.

The register protects useful insight from being lost while preventing preliminary observations from silently becoming product decisions.

## 2. What Qualifies as a Discovery

A discovery should be recorded when it:

- contradicts a meaningful Meridian assumption;
- reveals a repeated pattern across unrelated products;
- exposes a previously hidden trade-off;
- identifies a potentially reusable workflow or architecture principle;
- demonstrates that a presumed table-stakes feature is weakly used or poorly served;
- reveals that a market “best practice” creates material harm;
- changes the order or focus of a research wave;
- suggests a new validation experiment;
- identifies a gap between documented and observed product behavior.

Generic facts and ordinary competitor features do not belong here.

## 3. Discovery Status

- **Observed** — noteworthy observation, not yet corroborated.
- **Corroborating** — additional evidence is being collected.
- **Supported** — sufficient evidence exists to act as a research input.
- **Transferred** — incorporated into another governed authority or implementation experiment.
- **Rejected** — evidence did not support the initial interpretation.
- **Superseded** — replaced by a more accurate discovery.

## 4. Initial Discoveries

### DISC-001 — Comparative disagreement is often more valuable than consensus

- Status: Supported
- Observation: mature products frequently solve the same narrow task in materially different ways. The disagreement exposes segment assumptions, risk tolerance, and hidden constraints more effectively than a simple feature-presence matrix.
- Evidence: Mobbin session, authorization, audit, entitlement, and inventory comparisons.
- Confidence: High
- Implication: research must compare at least three materially different approaches where practical and record why they diverge.
- Transferred to: `COMPETITIVE_RESEARCH_METHODOLOGY.md` and `COMPETITOR_EVALUATION_FRAMEWORK.md`.

### DISC-002 — Screenshots are strongest for discovering questions, not proving answers

- Status: Supported
- Observation: visual catalogs reveal hierarchy, sequence, and interaction candidates but omit hidden states, accessibility, security, data integrity, and architecture.
- Evidence: authenticated Mobbin research and Studio candidate audits.
- Confidence: High
- Implication: a screenshot may seed a requirement or prototype, never approve a component or backend claim.
- Transferred to: `SOURCE_TRUST_MODEL.md` and UX source policies.

### DISC-003 — The best external pattern may confirm an existing Meridian rule rather than create a new one

- Status: Supported
- Observation: many high-value findings validated rules Meridian already established, such as shallow navigation, visible context, explicit bulk scope, and state separation.
- Confidence: High
- Implication: research value includes confidence and evidence, not document growth. Do not create new governance merely to show research output.
- Transferred to: `RESEARCH_STANDARDS.md`.

### DISC-004 — Product categories are easy to misclassify when the visible surface looks similar

- Status: Supported
- Observation: consumer storefronts, back-office ecommerce, inventory, and POS can share products, tables, totals, and carts while serving fundamentally different jobs and risks.
- Evidence: Mobbin catalog searches and ecommerce-dashboard review.
- Confidence: High
- Implication: every candidate must record product category, role, frequency, consequence, and operational context before transfer.
- Transferred to: `COMPETITOR_EVALUATION_FRAMEWORK.md` and domain research backlog.

### DISC-005 — Automation quality is primarily a review-and-recovery design problem

- Status: Corroborating
- Observation: automatic categorization or matching is not valuable merely because it fires frequently; value depends on explanation, exception prioritization, correction, learning boundaries, reversal, and audit.
- Evidence: preliminary accounting-product review, Meridian AI philosophy, and repeated market messaging.
- Confidence: Medium
- Implication: accounting research should center the review queue and exception workflow rather than model accuracy marketing.
- Next action: CIR-BACK-002, CIR-BACK-003, CIR-BACK-016.

### DISC-006 — Broad platforms often externalize complexity into implementation projects

- Status: Corroborating
- Observation: a product can appear flexible because consultants, extensions, or customers absorb integration, configuration, data-cleanup, and upgrade complexity.
- Evidence: recurring ERP market patterns and support ecosystems.
- Confidence: Medium
- Implication: Meridian scorecards must measure configuration and upgrade cost, not feature breadth alone.
- Transferred to: `BEST_IN_CLASS_SCORECARD.md`.

### DISC-007 — Product release communication is an entitlement and context problem, not only a publishing problem

- Status: Observed
- Observation: broad changelogs inform everyone equally, while in-product announcements frequently show irrelevant or unavailable features.
- Evidence: Shadcn Studio changelog review hypothesis and current product patterns.
- Confidence: Medium
- Implication: future Meridian release notes should separate public, in-app, developer/API, and tenant-audit authorities and filter in-app communication by availability.
- Next action: CIR-BACK-019.

### DISC-008 — A unified operational inbox may be a cross-domain differentiator only if domain authority remains local

- Status: Observed
- Observation: exceptions, suggestions, approvals, imports, and failed automation share queue mechanics but differ in validation and consequence.
- Confidence: Medium
- Implication: investigate shared assignment, priority, evidence, and status mechanics while keeping commit authority in owning domains.
- Next action: accounting review-queue research and later cross-domain synthesis.

## 5. Entry Template

```markdown
### DISC-NNN — Name

- Status:
- Date:
- Research wave:
- Observation:
- Why surprising:
- Evidence:
- Evidence mode:
- Contradictory evidence:
- Confidence:
- Meridian implication:
- Required experiment or research:
- Transferred to:
- Revisit trigger:
```

## 6. Transfer Rules

A discovery must move out of this register when it becomes:

- a product requirement;
- an ADR or architecture change;
- a UX standard;
- a capability, permission, event, or API change;
- a roadmap item;
- a pain-point or market-gap entry;
- a differentiation claim;
- an implementation experiment.

The original discovery remains with a pointer to the destination so the reasoning chain is preserved.

## 7. Review

Review discoveries at the end of every research wave. Unsupported observations must not linger indefinitely as suggestive truths; assign follow-up, reject them, or mark them stale.

## 8. Program Closeout Discoveries

### DISC-009 — Uncertainty is a cross-domain product primitive

- Status: Transferred
- Observation: provider, offline, index, automation and AI workflows share an inability to prove immediate finality.
- Confidence: High
- Transferred to: CROSS_DOMAIN_FAILURE_AND_RECOVERY_PATTERNS.md and DIFF-012.

### DISC-010 — Shared UI is safest when authority remains visibly local

- Status: Transferred
- Observation: search, inbox, analytics, collaboration and support benefit from aggregation only when they execute through owning-domain contracts.
- Confidence: High
- Transferred to: CROSS_DOMAIN_WORKFLOW_PATTERNS.md and CROSS_DOMAIN_REVIEW_QUEUE_STANDARD.md.

### DISC-011 — Correction has a reusable experience but non-reusable invariants

- Status: Transferred
- Observation: reversal, compensation, effective dating and diff/history recur, while Finance, Inventory, Payroll and Payment conservation rules differ.
- Confidence: High
- Transferred to: ADOPT_IMPROVE_REJECT_REGISTER.md.

### DISC-012 — Product breadth is often implementation burden in disguise

- Status: Supported
- Observation: edition, module, add-on, configuration and consultant prerequisites determine usable capability more than checklist presence.
- Confidence: Medium
- Next action: preserve implementation-cost dimensions in future scorecards.

### DISC-013 — AI control quality is ordinary application control plus new failure dimensions

- Status: Transferred
- Observation: AI still needs normal permission, entitlement, validation and audit, plus provenance, model failure, prompt injection, cost and probabilistic correction.
- Confidence: High
- Transferred to: PLATFORM_SERVICES_IMPLEMENTATION_FINDINGS.md.

### DISC-014 — Offline is a risk contract, not a connectivity feature

- Status: Transferred
- Observation: every credible offline workflow needs leases, limits, identity, conflicts, certainty and reconciliation.
- Confidence: High
- Transferred to: CROSS_DOMAIN_FAILURE_AND_RECOVERY_PATTERNS.md.
