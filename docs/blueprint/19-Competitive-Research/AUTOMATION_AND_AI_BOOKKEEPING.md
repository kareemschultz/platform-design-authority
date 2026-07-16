---
document_id: PDA-CIR-022
title: Automation and AI-Assisted Bookkeeping
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0013, ADR-0016, ADR-0022]
---

# Automation and AI-Assisted Bookkeeping

## 1. Purpose

This document defines how Meridian may use deterministic automation and AI assistance in bookkeeping and accounting without surrendering domain authority, auditability, reversibility, or human control.

Automation is valuable when it reduces repetitive work, surfaces exceptions, and improves evidence quality. It is unsafe when it silently converts uncertain observations into canonical financial records.

## 2. Authority Boundary

Accounting owns financial validity and posting. AI and automation may prepare, classify, match, explain, prioritize, or propose. They may not redefine accounting policy, bypass permissions, invent evidence, or become the system of financial record.

The governing rule is:

> Automation may accelerate a decision. The Accounting domain must validate and commit the decision.

Every automated or AI-assisted action remains subject to:

- tenant and organization context;
- permissions and entitlements;
- accounting policy and period controls;
- source-document and transaction evidence;
- idempotency and concurrency rules;
- audit and correlation requirements;
- deterministic fallback;
- review, rejection, correction, and reversal.

## 3. Automation Classes

### 3.1 Deterministic rules

Examples:

- vendor-to-account mapping;
- bank-description rules;
- amount and currency conditions;
- tax-code defaults;
- cost-center defaults;
- transfer-pair detection rules;
- recurring-transaction templates;
- threshold and exception routing;
- document completeness checks.

Rules must be versioned, scoped, testable, explainable, and replayable against a declared input set.

### 3.2 Statistical or heuristic assistance

Examples:

- duplicate likelihood;
- transaction similarity;
- anomaly prioritization;
- probable transfer pairing;
- document-to-transaction candidate ranking;
- unusual merchant or amount detection.

Heuristics must return evidence and bounded confidence rather than a false binary certainty.

### 3.3 Generative or model-assisted work

Examples:

- suggested category or account;
- proposed memo or explanation;
- receipt and invoice field extraction;
- suggested match rationale;
- plain-language journal explanation;
- draft review summary;
- suggested follow-up question;
- variance explanation candidate.

Generated content is never evidence merely because it is fluent.

### 3.4 Prohibited silent autonomy

The following must not be silently committed by AI during controlled prototype or production operation:

- journal posting;
- reconciliation approval;
- period close;
- lock-date changes;
- tax position or filing decision;
- revenue-recognition decision;
- depreciation policy or asset disposal;
- payroll posting;
- write-off approval;
- intercompany elimination;
- destructive deletion of financial evidence;
- correction of a posted entry without an explicit reversal or governed adjustment.

A future autonomy increase requires a separate authority, bounded risk class, first-party evidence, rollback, and founder or PDA approval where reserved.

## 4. Canonical Suggestion Model

An assisted bookkeeping proposal should expose a stable contract similar to:

```ts
type BookkeepingSuggestion = {
  id: Id<"BookkeepingSuggestion">;
  tenantId: Id<"Tenant">;
  organizationId: Id<"Organization">;
  subject: {
    type: "bank-transaction" | "document" | "journal-draft" | "reconciliation-item";
    id: string;
    version: number;
  };
  suggestionType:
    | "categorize"
    | "match"
    | "split"
    | "transfer-pair"
    | "duplicate"
    | "extract"
    | "explain"
    | "exception-priority";
  proposedEffect: unknown;
  evidenceReferences: EvidenceReference[];
  rationale: string;
  confidence?: {
    value: number;
    calibrationVersion: string;
    interpretation: "low" | "medium" | "high";
  };
  source: {
    kind: "rule" | "heuristic" | "model" | "human-template";
    identifier: string;
    version: string;
  };
  createdAt: Instant;
  expiresAt?: Instant;
  status: "proposed" | "approved" | "rejected" | "corrected" | "stale" | "withdrawn";
};
```

This is a research contract sketch, not an implementation authorization.

## 5. Required Review Experience

Every consequential suggestion must show:

- source transaction or document;
- proposed accounting effect;
- affected accounts, amount, currency, tax, organization, and period;
- rationale in user language;
- source and evidence references;
- confidence only when calibrated and meaningful;
- policy or rule that contributed;
- conflicts, missing evidence, and uncertainty;
- approve, reject, correct, and defer actions;
- whether approval creates a draft or posts a canonical command;
- audit and reversal implications.

The user must never need to infer whether clicking “Accept” will merely save a suggestion, create a draft, or post to the ledger.

## 6. Review Queue

Meridian should investigate a shared operational review-queue platform for:

- uncategorized transactions;
- low-confidence classifications;
- unmatched payments;
- transfer candidates;
- duplicate candidates;
- missing documents;
- document extraction exceptions;
- invalid imports;
- bank-feed interruptions;
- reconciliation differences;
- stale suggestions;
- policy violations;
- anomaly review;
- approval-required journals.

The queue may share assignment, priority, due date, evidence, comments, and status mechanics. The owning domain retains validation and commit authority.

### Queue statuses

- New
- Assigned
- In Review
- Waiting for Evidence
- Proposed
- Approved
- Rejected
- Corrected
- Resolved
- Superseded

Status names must not imply that an accounting record has posted unless it has.

## 7. Confidence and Explanation

Confidence must not be decorative.

When shown, it must answer:

- confidence in what exact proposition;
- based on which evidence;
- calibrated against which task and version;
- what the user should do differently at this level;
- whether important evidence is missing.

A percentage without calibration or action meaning is prohibited confidence theater.

Explanations should distinguish:

- direct source evidence;
- deterministic rule contribution;
- similarity or statistical evidence;
- model-generated interpretation;
- unresolved assumptions.

## 8. Human Correction and Learning

Corrections may improve future suggestions, but learning must be bounded.

The system must record whether a correction changes:

- this suggestion only;
- a tenant-specific deterministic rule;
- a reusable template;
- training or evaluation feedback;
- nothing beyond the current command.

A user correction must not silently create a broad rule. Proposed rules require preview, scope, effective date, conflict analysis, and explicit confirmation.

Sensitive tenant data must not be reused for model training without an explicit lawful authority and governed policy.

## 9. Staleness and Concurrency

A suggestion becomes stale when material inputs change, including:

- transaction version;
- linked document;
- account state;
- exchange rate;
- accounting period or lock state;
- role or permission;
- entitlement;
- rule version;
- model or prompt version where relevant;
- reconciliation status.

Approval must revalidate current state. A suggestion is not an authorization token.

## 10. Audit Requirements

Audit evidence must include:

- suggestion identifier;
- source kind and version;
- input evidence references;
- actor;
- active context;
- decision and correction;
- resulting command and canonical record identifiers;
- reason code;
- correlation identifier;
- occurrence time;
- redacted summary of material effect.

Do not persist raw prompts, secrets, credentials, full request objects, or unclassified personal information merely for convenience.

## 11. Deterministic Fallback

Essential bookkeeping must remain possible when AI is:

- disabled;
- unavailable;
- too costly;
- rate-limited;
- contractually prohibited;
- uncertain;
- wrong;
- unsupported in a jurisdiction or language.

Fallback must include manual categorization, deterministic rules, search, matching, document entry, journal drafting, reconciliation, and reporting.

## 12. Evaluation Metrics

Do not optimize for suggestion acceptance rate alone.

Measure:

- time to correct books;
- exception backlog age;
- precision and recall by suggestion class;
- false-positive consequence;
- approval versus correction rate;
- correction distance;
- confidence calibration;
- evidence completeness;
- reversal rate;
- user time saved;
- reviewer disagreement;
- performance by tenant, language, currency, and transaction class where lawful;
- deterministic fallback success;
- audit completeness.

A lower automation rate may be preferable when it substantially reduces consequential errors.

## 13. Product Research Findings

Current market patterns suggest four broad strategies:

1. **Automation-first bookkeeping** reduces visible bookkeeping work but may narrow supported accounting depth or obscure why a decision was made.
2. **Small-business accounting suites** combine rules, bank matching, and manual review but often accumulate complex configuration and inconsistent exception handling.
3. **ERP accounting modules** provide broad integration but may expose implementation and navigation complexity to ordinary users.
4. **Enterprise financial suites** provide controls and close depth but frequently require specialist configuration and training.

Meridian should combine approachable review, strong accounting authority, explicit evidence, and cross-domain integration rather than copying any one category.

## 14. Meridian Decisions

### Adopt

- review-first assistance;
- evidence-backed suggestions;
- deterministic rules with preview and versioning;
- exception prioritization;
- explainable matching;
- human correction;
- stable audit linkage.

### Improve

- unify review mechanics without centralizing domain authority;
- make accounting effect visible before approval;
- distinguish confidence, completeness, and policy validity;
- preserve expert efficiency alongside novice explanations;
- provide safe bulk review with explicit scope.

### Reject

- silent posting;
- opaque category changes;
- AI-only essential workflows;
- generic “smart” labels without evidence;
- unbounded learning from user corrections;
- automatic broad rules from one action;
- generated explanations presented as source evidence;
- automation success measured only by volume.

## 15. Required Prototypes

Before implementation approval, prototype:

1. categorization suggestion and correction;
2. transaction-to-document matching;
3. transfer-pair review;
4. duplicate review;
5. reconciliation exception queue;
6. suggested rule creation with preview;
7. AI-disabled deterministic fallback;
8. stale suggestion after period or source change.

Each prototype must include direct API enforcement, audit evidence, accessibility, responsive behavior, and synthetic two-tenant data.

## 16. Open Research Questions

- Which suggestion classes can safely support bounded bulk approval?
- How should confidence be calibrated across tenants with little history?
- Which rule conflicts should block approval versus warn?
- How should accountant and business-owner review experiences differ?
- What evidence is sufficient for automated transfer pairing?
- How should offline document capture reconcile with later bank data?
- Which jurisdictions constrain model processing or data residency?
- When should suggestions expire rather than be recomputed?

## 17. Revalidation Triggers

Refresh this document when:

- accounting AI products materially change autonomy;
- Meridian defines its Accounting implementation plan;
- a model/provider is selected;
- pilot evidence contradicts the review-first model;
- legal, privacy, tax, or audit requirements change;
- the shared operational inbox receives an owning platform design.
