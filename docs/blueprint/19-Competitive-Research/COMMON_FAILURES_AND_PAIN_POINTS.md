---
document_id: PDA-CIR-009
title: Common Failures and Pain Points Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Common Failures and Pain Points Register

## 1. Purpose

This register records recurring product failures that Meridian should prevent, test for, or deliberately outperform. It focuses on user and operator pain, not competitor embarrassment.

A pain point becomes a Meridian requirement only after it is translated into an owned invariant, workflow requirement, UX rule, test, risk, or implementation decision.

## 2. Evidence Standard

Each accepted entry must include:

- a precise workflow or context;
- consequence and affected role;
- evidence sources and confidence;
- observed symptom separated from inferred cause;
- Meridian prevention or differentiation response;
- validation method;
- revalidation trigger.

Anecdotes may seed entries but cannot establish prevalence alone.

## 3. Failure Taxonomy

- Navigation and discoverability
- Setup and configuration
- Data entry and forms
- Search, filtering, and retrieval
- Permissions and administration
- Accounting and reconciliation
- Inventory and operations
- POS and payments
- Automation and AI
- Integrations and extensibility
- Performance and reliability
- Offline and recovery
- Reporting and analytics
- Pricing and packaging
- Migration and lock-in
- Support and documentation
- Accessibility and inclusive use

## 4. Initial Cross-Domain Findings

### CFP-001 — ERP maze navigation

- Status: Accepted baseline risk
- Symptom: users traverse deep sidebars, repeated settings trees, nested tabs, and duplicated destinations without a clear current context.
- Consequence: slow task completion, training dependence, wrong-context actions, and poor mobile transformation.
- Evidence: repeated market complaints and direct pattern observation in large ERP/CRM products; corroborated by Meridian’s Mobbin navigation audit.
- Confidence: High
- Meridian response:
  - maximum two persistent navigation levels;
  - role-based workspace visibility;
  - one owning location per destination;
  - contextual tabs only for peer views;
  - no nested tabs;
  - search and command palette as accelerators, not sole routes;
  - visible tenant, organization, location, workspace, and offline context.
- Validation: route-map review, navigation-depth tests, moderated task testing, mobile transformation review.

### CFP-002 — Configuration sprawl masquerading as flexibility

- Status: Researching
- Symptom: products expose hundreds of settings without progressive disclosure, ownership, defaults, or consequence explanations.
- Consequence: implementation projects become consultant-dependent; administrators create contradictory configurations; upgrades become risky.
- Confidence: Medium
- Meridian response:
  - complexity tiers;
  - safe defaults;
  - advanced settings behind explicit disclosure;
  - configuration ownership and scope;
  - preview, validation, audit, rollback, and effective-date support for consequential settings.
- Validation: configuration inventory, role-based usability tests, upgrade simulations.

### CFP-003 — Silent automation in consequential workflows

- Status: Accepted baseline risk
- Symptom: rules or AI categorize, post, reconcile, approve, or alter records without clear provenance, review, or reversal.
- Consequence: financial misstatement, user distrust, difficult audits, and invisible model/rule drift.
- Confidence: High
- Meridian response:
  - AI proposes; owning domain validates and commits;
  - confidence never substitutes for permission or evidence;
  - material suggestions expose source, rationale, uncertainty, and affected records;
  - approval, rejection, correction, and undo/reversal are auditable;
  - deterministic fallback remains available.
- Validation: policy tests, suggestion-to-commit traceability, audit review, disable-AI acceptance tests.

### CFP-004 — Bank reconciliation becomes opaque at scale

- Status: Planned research
- Symptom: users cannot explain why transactions matched, why rules fired, what remains unreconciled, or how to undo a mistaken reconciliation.
- Consequence: close delays, duplicate postings, accountant workarounds, and low trust in automation.
- Confidence: Medium
- Meridian response candidate:
  - explainable matching;
  - explicit transaction, document, and journal relationships;
  - review queue;
  - rule trace;
  - reversible reconciliation decisions;
  - stable exception categories;
  - lock-date aware corrections.
- Validation: accounting research wave and prototype evidence.

### CFP-005 — Permission models expose technical identifiers instead of user meaning

- Status: Accepted
- Symptom: administrators see raw permission names or enormous undifferentiated matrices.
- Consequence: over-granting, under-granting, role proliferation, and support dependence.
- Confidence: High
- Meridian response:
  - governed human-readable labels and descriptions;
  - capability grouping;
  - scope and affected-member summaries;
  - impact preview;
  - server-side enforcement;
  - permission and entitlement semantics kept distinct.
- Validation: admin task testing and direct API denial tests.

### CFP-006 — Product entitlement is confused with user authorization

- Status: Accepted
- Symptom: products display a generic lock or upgrade prompt without clarifying whether the tenant lacks the feature or the user lacks permission.
- Consequence: incorrect support requests, accidental upsell pressure, and administrator confusion.
- Confidence: High
- Meridian response: distinct permission-denied and entitlement-unavailable states with specific explanation, no blurred content, and capability-aware navigation.
- Validation: comprehension tests and API/UI consistency checks.

### CFP-007 — Dashboards optimize appearance rather than decisions

- Status: Accepted baseline risk
- Symptom: KPI cards and charts show mixed periods, unclear definitions, stale values, weak drill-down, and no actionable task.
- Consequence: false confidence, decorative complexity, and expensive queries with little user value.
- Confidence: High
- Meridian response:
  - every metric has a definition, source, period, freshness, and owner;
  - charts include accessible alternatives;
  - cards map to user decisions or monitored obligations;
  - comparisons use explicit compatible periods;
  - uncertainty and partial data are visible.
- Validation: metric-contract review and task-based analytics testing.

### CFP-008 — Consumer ecommerce patterns are reused for POS or inventory

- Status: Accepted
- Symptom: storefront grids, carts, and checkout flows are presented as evidence for cashier, receiving, stock, or reconciliation workflows.
- Consequence: poor scanner efficiency, missing cash controls, weak exception handling, and unsuitable density.
- Confidence: High
- Meridian response: classify storefront, back-office commerce, POS, inventory, and marketplace patterns separately; require domain-specific research.
- Validation: source classification in every candidate audit.

### CFP-009 — Bulk actions hide selection scope

- Status: Accepted
- Symptom: users cannot tell whether an action applies to visible rows, the current page, selected records, or all filtered results.
- Consequence: destructive mistakes and incomplete operations.
- Confidence: High
- Meridian response: explicit selection scope, item count, filter scope, preview, consequence summary, and partial-failure handling.
- Validation: bulk-action acceptance tests.

### CFP-010 — Infinite scroll is used for consequential records

- Status: Accepted
- Symptom: finance, inventory, audit, or permission records use endless scrolling without stable position, total context, or revisitation.
- Consequence: missed records, weak exports, impossible selection, and poor auditability.
- Confidence: High
- Meridian response: numbered pagination for stable review sets; cursor pagination for changing streams; infinite scroll restricted to non-consequential browsing.
- Validation: pagination decision recorded per workflow.

### CFP-011 — Mobile experiences shrink desktop rather than preserve tasks

- Status: Accepted
- Symptom: wide tables, multi-level sidebars, dense forms, and hover interactions are compressed onto a phone.
- Consequence: unusable touch targets, hidden context, and abandoned mobile workflows.
- Confidence: High
- Meridian response: task-preserving transformation, bounded mobile destinations, alternative list/card presentations, stepwise forms, and explicit deferral for workflows that cannot be made safe.
- Validation: device-class acceptance tests at 200% zoom and assistive technology review.

### CFP-012 — Offline behavior is silent or dishonest

- Status: Accepted baseline risk
- Symptom: applications appear to save while offline without exposing queue state, uncertainty, conflict, or reconciliation.
- Consequence: duplicate actions, lost work, false success, and financial inconsistency.
- Confidence: High
- Meridian response: explicit offline/degraded/queued/conflicted states; command identity; bounded retry; conflict handling; eventual evidence of canonical acceptance or rejection.
- Validation: deterministic network-failure and recovery scenarios.

### CFP-013 — Integration errors are treated as local success

- Status: Accepted baseline risk
- Symptom: provider timeout or ambiguous response is displayed as success or generic failure.
- Consequence: duplicate payments, uncertain fulfillment, broken reconciliation, and unsafe retries.
- Confidence: High
- Meridian response: provider uncertainty as a first-class state; idempotent retry; reconciliation; visible evidence; no invented certainty.
- Validation: ambiguity and timeout tests.

### CFP-014 — Audit logs are technically complete but operationally unreadable

- Status: Accepted
- Symptom: logs show opaque codes, omit before/after context, or require manual joining across systems.
- Consequence: slow incident response, weak support, and poor accountability.
- Confidence: High
- Meridian response: human-readable action plus exact event name, controlled diff, actor, scope, outcome, correlation, and redaction.
- Validation: audit investigation exercises.

### CFP-015 — Add-on ecosystems create inconsistent product behavior

- Status: Planned research
- Symptom: essential workflows depend on extensions with incompatible UX, permissions, data models, upgrades, and support.
- Consequence: fragile installations and unclear accountability.
- Confidence: Medium
- Meridian response candidate: governed extension contracts, capability declarations, permission/event requirements, isolation, compatibility testing, and marketplace review.
- Validation: ERP and platform ecosystem research.

### CFP-016 — Pricing and plan changes surprise operators

- Status: Planned research
- Symptom: capability availability, limits, or usage charges change without clear in-product explanation or migration path.
- Consequence: operational interruption and loss of trust.
- Confidence: Medium
- Meridian response candidate: entitlement-aware changelog, rollout state, limits, effective dates, and administrator notification.
- Validation: packaging and release-communication research.

## 5. Entry Template

```markdown
### CFP-NNN — Name

- Status:
- Domain:
- Role:
- Workflow:
- Symptom:
- Consequence:
- Evidence:
- Evidence mode:
- Confidence:
- Inferred cause:
- Meridian response:
- Affected authority:
- Validation:
- Revisit trigger:
```

## 6. Maintenance

- Entries remain even when mitigated; mark the implementation evidence.
- Findings that prove false are Withdrawn with explanation.
- Domain research waves add detailed entries and may refine cross-domain entries.
- This register must not name individual customers or reproduce proprietary support material.
- Repeated pain does not require Meridian to implement the same capability; intentional exclusion remains valid when explained.

## 7. Cross-Domain Closeout Index

The original CFP identifiers remain stable. The required FAIL identifiers below deduplicate them into cross-domain transfer clusters rather than replacing historical entries.

| ID | Failure cluster | Status | Evidence | Transfer |
|---|---|---|---|---|
| FAIL-001 | module maze, configuration sprawl and consultant-dependent operations | Supported | ERP wave; CFP-001, CFP-002, CFP-015 | ERP_IMPLEMENTATION_FINDINGS.md |
| FAIL-002 | false success, hidden offline/provider uncertainty and unsafe retry | Supported | POS/payment/offline waves; CFP-012, CFP-013 | CROSS_DOMAIN_FAILURE_AND_RECOVERY_PATTERNS.md |
| FAIL-003 | destructive correction and current-state overwrite | Supported | accounting, inventory, manufacturing, payroll | ADOPT_IMPROVE_REJECT_REGISTER.md |
| FAIL-004 | copied/duplicate identity and authority across domains | Supported | CRM, HR, service and ERP waves | CUSTOMER_AND_SERVICE_IMPLEMENTATION_FINDINGS.md |
| FAIL-005 | automation or AI hides evidence, authority, cost or recovery | Supported | accounting/platform-services waves; CFP-003 | PLATFORM_SERVICES_IMPLEMENTATION_FINDINGS.md |
| FAIL-006 | dashboards/search/inboxes present projections as current truth | Supported | analytics, search and inbox waves; CFP-007 | CROSS_DOMAIN_WORKFLOW_PATTERNS.md |
| FAIL-007 | bulk/mobile/board interactions omit accessible and partial-failure paths | Supported | cross-wave UX; CFP-009 through CFP-011 | proposed UX/accessibility review |
| FAIL-008 | notification, comment or status is mistaken for assignment, audit or completion | Supported | service/collaboration/inbox waves | CROSS_DOMAIN_REVIEW_QUEUE_STANDARD.md |
| FAIL-009 | discovered/controller state is treated as authoritative or provider acceptance is treated as verified effect | Supported | infrastructure and device/offline continuation studies | PDA-CIR-094, PDA-CIR-095 and PDA-CIR-098; prototype evidence required |
