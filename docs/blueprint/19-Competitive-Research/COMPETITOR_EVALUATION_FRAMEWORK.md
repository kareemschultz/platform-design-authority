---
document_id: PDA-CIR-004
title: Competitor Evaluation Framework
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0022]
---

# Competitor Evaluation Framework

## 1. Purpose

This framework standardizes how Meridian evaluates products across domains. It prevents inconsistent scorecards, feature-count contests, aesthetic bias, and conclusions that ignore target segment, consequence, implementation cost, or Meridian's architecture.

## 2. Evaluation Unit

The preferred unit is a **capability-workflow pair**, not a whole product.

Examples:

- bank transaction categorization and review;
- stock receiving against an order;
- session revocation;
- role assignment;
- period close;
- split tender;
- project time approval.

Whole-product judgments such as "X has better UX" are too broad unless decomposed into evidence-backed capability judgments.

## 3. Product Context

Record:

- product and edition;
- target segment;
- deployment model;
- geography and regulatory focus;
- pricing or entitlement tier reviewed;
- platform reviewed;
- date and version;
- integration assumptions;
- source availability.

## 4. Evaluation Dimensions

### 4.1 Capability depth

Assess whether the product supports:

- basic path;
- advanced path;
- exceptions;
- corrections and reversal;
- approvals;
- audit evidence;
- configuration;
- import/export;
- extensibility;
- reporting consequences.

### 4.2 Workflow quality

Assess:

- number and clarity of steps;
- user effort;
- system assistance;
- recoverability;
- prevention of duplicate or contradictory action;
- interruption handling;
- resumption;
- review and confirmation;
- finality and consequence clarity.

### 4.3 User experience

Assess:

- learnability;
- discoverability;
- terminology;
- navigation depth;
- information density;
- progressive disclosure;
- keyboard efficiency;
- mobile transformation;
- accessibility evidence;
- state clarity;
- expert acceleration.

### 4.4 Automation

Assess:

- deterministic rules;
- suggestion quality;
- confidence and explanation;
- human review;
- override;
- exception queue;
- learning behavior;
- auditability;
- rollback;
- deterministic fallback.

### 4.5 Data and architecture

Assess only with adequate evidence:

- ownership boundaries;
- API quality;
- events and webhooks;
- idempotency;
- pagination;
- extensibility;
- portability;
- import/export;
- multi-entity support;
- offline support;
- migration model.

### 4.6 Trust and control

Assess:

- permission scope;
- entitlement clarity;
- tenant or company context;
- audit trail;
- approvals;
- privacy controls;
- security evidence;
- destructive-action safeguards;
- explainability;
- administrative visibility.

### 4.7 Operational quality

Assess:

- performance evidence;
- reliability evidence;
- observability available to customers;
- failure communication;
- supportability;
- backup/export;
- degraded operation;
- reconciliation and recovery.

### 4.8 Ecosystem and lifecycle

Assess:

- integrations;
- extensions;
- API stability;
- release communication;
- migration guidance;
- deprecation policy;
- partner ecosystem;
- documentation;
- support model;
- lock-in risk.

## 5. Rating Scale

Scores are optional and must never replace written evidence.

- **5 — Leading:** unusually complete and effective for the target workflow, with strong evidence.
- **4 — Strong:** handles the workflow well with minor material weaknesses.
- **3 — Adequate:** table-stakes support with notable limitations.
- **2 — Weak:** supported but difficult, incomplete, unsafe, or poorly integrated.
- **1 — Minimal:** nominal support only.
- **0 — Absent:** no evidence of support.
- **N/E — Not evaluated:** insufficient evidence.
- **N/A — Not applicable:** outside product scope.

A score must include a short rationale, source references, and confidence.

## 6. Meridian Disposition

For each capability-workflow pair, record:

- Meridian current status;
- market expectation;
- strongest observed approach;
- weakest recurring approach;
- customer pain points;
- Meridian disposition;
- confidence;
- blueprint impact;
- implementation milestone;
- validation criteria.

## 7. Table-Stakes Test

A capability is not table stakes merely because several products list it. Consider:

- target segment expectation;
- frequency;
- consequence;
- switching impact;
- legal or operational necessity;
- dependency on Meridian's strategic position;
- implementation and support burden.

## 8. Differentiation Test

A proposed differentiator must answer:

- Which user problem is materially improved?
- For whom?
- Compared with which baseline?
- Is the advantage durable or easily copied?
- Does it increase operational or regulatory risk?
- Can it be measured?
- Is it compatible with Meridian's architecture and economics?

## 9. Feature Exclusion Test

A feature may be intentionally excluded when it:

- conflicts with domain ownership;
- creates unsafe automation;
- duplicates a better platform capability;
- serves a segment outside approved scope;
- creates disproportionate complexity;
- depends on unavailable external evidence;
- undermines portability, accessibility, or auditability;
- is better delivered through an integration.

Exclusion must include rationale and revisit trigger.

## 10. AI Evaluation

AI capabilities receive additional scrutiny:

- What deterministic workflow exists without AI?
- What data is used?
- Is confidence calibrated and visible?
- Can the user inspect provenance?
- Who approves consequential output?
- Can the user override and correct?
- Is the action audited?
- Can the model or provider fail safely?
- Can the feature be disabled?
- Does AI reduce work or merely relocate review burden?

## 11. Accessibility Evaluation

Visual observation is not accessibility evidence. Record whether evidence comes from:

- keyboard testing;
- screen-reader testing;
- zoom and reflow testing;
- contrast measurement;
- published accessibility documentation;
- automated scans;
- unknown.

## 12. Comparison Matrix Template

| Capability/workflow | Product | Edition/platform | Observed approach | Strength | Weakness | Evidence class | Confidence | Meridian disposition |
|---|---|---|---|---|---|---|---|---|

## 13. Product Summary Template

Each product summary should include:

1. Position and target segment
2. Relevant editions
3. Strongest capability areas
4. Weakest capability areas
5. Notable workflow patterns
6. Automation and AI posture
7. Architecture and ecosystem evidence
8. Recurring customer pain points
9. Things Meridian should adopt
10. Things Meridian should improve
11. Things Meridian should never copy
12. Open questions

## 14. Required Counter-Evidence

Every high-confidence favorable conclusion should actively search for:

- failure states;
- complaints;
- limitations by plan;
- mobile or accessibility weaknesses;
- migration costs;
- support burden;
- contradictory documentation;
- product changes after the observed version.

## 15. Final Synthesis

A domain matrix must not end with a winner. It should end with a Meridian design position that combines compatible evidence, preserves explicit trade-offs, and states where no market precedent is sufficient.