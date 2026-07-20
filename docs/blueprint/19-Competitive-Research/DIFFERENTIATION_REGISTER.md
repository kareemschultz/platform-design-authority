---
document_id: PDA-CIR-011
title: Meridian Differentiation Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Meridian Differentiation Register

## 1. Purpose

This register records evidence-backed ways Meridian intends to be meaningfully better than available alternatives. It prevents “differentiation” from becoming a list of slogans, unverified superiority claims, or features that competitors already provide well.

A differentiation entry is valid only when it connects:

- a demonstrated user or operator problem;
- a specific Meridian response;
- an owned capability or architectural advantage;
- a measurable validation method;
- explicit trade-offs and limits.

## 2. Differentiation Status

- **Hypothesis** — plausible advantage, evidence or implementation incomplete.
- **Validated Need** — market problem is well supported; Meridian response not yet proven.
- **Prototype Candidate** — response is ready for bounded testing.
- **Prototype Validated** — first-party evidence supports the response.
- **Implemented** — merged implementation exists, but production evidence may not.
- **Market Validated** — customer or pilot evidence demonstrates meaningful advantage.
- **Rejected** — not strategically sound, not differentiating, or too costly.
- **Superseded** — market or product direction changed.

## 3. Required Entry Fields

Every entry must include:

- differentiation ID;
- affected users and workflow;
- market problem and evidence;
- Meridian response;
- what is genuinely different;
- implementation owner;
- required capabilities and dependencies;
- risks and trade-offs;
- validation metric;
- current status and confidence;
- claims that are prohibited until stronger evidence exists.

## 4. Initial Register

### DIFF-001 — Enterprise breadth without ERP-maze navigation

- Status: Validated Need
- Confidence: High
- Users: ordinary operators, administrators, experts, mobile users
- Market problem: broad business platforms commonly expose deep module trees, duplicated destinations, technical terminology, and configuration-heavy navigation.
- Meridian response:
  - role-based workspace visibility;
  - maximum two persistent navigation levels;
  - task language instead of package names;
  - contextual tabs for peer views only;
  - visible operating context;
  - search, recents, favorites, and commands as accelerators;
  - device-specific task-preserving transformations.
- Difference: breadth is registered and composable without requiring every user to see the whole platform.
- Owner: Platform UX and application shell
- Risks: hiding infrequent capabilities too aggressively; role configuration becoming another source of complexity.
- Validation:
  - first-time task completion;
  - expert keyboard task time;
  - navigation depth;
  - wrong-context action rate;
  - mobile completion rate.
- Prohibited claim: “easiest ERP” until comparative user evidence exists.

### DIFF-002 — Explainable, optional AI governed by domain truth

- Status: Validated Need
- Confidence: High
- Users: owners, accountants, operators, reviewers, administrators
- Market problem: AI automation often obscures sources, rules, uncertainty, permissions, and responsibility.
- Meridian response:
  - AI proposes; domain services validate and commit;
  - source and rationale are visible;
  - uncertainty and confidence are bounded and never become business truth;
  - human approval for consequential actions;
  - deterministic non-AI completion path;
  - correction and feedback are auditable;
  - budgets, providers, and failures are explicit.
- Difference: AI capability is integrated without becoming a parallel authority.
- Owner: AI platform plus owning domains
- Risks: review overload; users overtrust explanations; latency and cost.
- Validation: suggestion acceptance accuracy, override rate, explanation comprehension, audit traceability, successful completion with AI disabled.
- Prohibited claim: autonomous or error-free bookkeeping.

### DIFF-003 — Permission, entitlement, rollout, and context are separate

- Status: Implemented foundation
- Confidence: High
- Users: tenant users, administrators, support
- Market problem: generic locked states conflate user authorization, tenant packaging, rollout, limits, and wrong context.
- Meridian response: independent authorization and entitlement evaluation, server-validated active context, capability-aware navigation, and distinct canonical states.
- Difference: users receive an actionable reason without exposing sensitive policy internals.
- Owner: Platform Identity, Tenancy, Authorization, Entitlements, UX
- Risks: state combinations increase test burden.
- Validation: comprehension testing and direct API enforcement.
- Prohibited claim: production-ready access control until security and pilot gates pass.

### DIFF-004 — Human-readable audit connected to canonical events

- Status: Implemented foundation
- Confidence: High
- Users: auditors, administrators, support, security, finance
- Market problem: audit logs are either too shallow for evidence or too technical for investigation.
- Meridian response: append-only records with actor, scope, action, outcome, correlation, redacted change summary, and exact registered event identity.
- Difference: human investigation and machine integration share stable canonical evidence without exposing raw secrets or request dumps.
- Owner: Platform Audit and domain event owners
- Risks: storage growth, noisy denial events, sensitive diff exposure.
- Validation: investigation exercises, redaction tests, correlation coverage, retention controls.

### DIFF-005 — Honest offline, degraded, and uncertain states

- Status: Prototype Candidate
- Confidence: High
- Users: cashiers, mobile workers, field users, operators
- Market problem: products often imply success during connectivity or provider ambiguity, creating unsafe retries and reconciliation burden.
- Meridian response: queued, pending, uncertain, conflicted, reconciled, accepted, and rejected states with command identity and visible evidence.
- Difference: Meridian treats uncertainty as a governed state, not a generic spinner or failure toast.
- Owner: Offline platform, Payments, POS, domain owners
- Risks: complex UX and storage; not every workflow can be safely available offline.
- Validation: deterministic failure injection, duplicate-command safety, user comprehension, recovery time.

### DIFF-006 — One Party model without collapsing domain identities

- Status: Implemented foundation
- Confidence: High
- Users: administrators and every relationship-oriented domain
- Market problem: systems duplicate a person or organization across customer, supplier, employee, contact, and login records.
- Meridian response: canonical Party identity with explicit domain roles and separate authentication linkage.
- Difference: shared identity and history without making authentication or CRM own every relationship.
- Owner: Party domain and Platform Identity
- Risks: merge, privacy, and global-identity complexity.
- Validation: cross-domain linkage, duplicate handling, privacy boundaries, tenant isolation.

### DIFF-007 — Reversal-first consequential record correction

- Status: Validated Need
- Confidence: Medium
- Users: finance, inventory, payments, stored value, administrators
- Market problem: destructive edits and hidden history make it hard to explain corrections.
- Meridian response: immutable or append-oriented records, explicit reversal/correction commands, controlled diffs, effective dates, and linked audit evidence.
- Difference: correction is a first-class workflow rather than an afterthought.
- Owner: owning business domains
- Risks: user confusion; some non-consequential metadata remains legitimately editable.
- Validation: conservation tests, audit reconstruction, user correction tasks.

### DIFF-008 — Global core with governed regional capability packs

- Status: Hypothesis
- Confidence: Medium
- Users: multi-country businesses and regional implementers
- Market problem: global platforms can be shallow locally; local platforms often cannot scale across entities and countries.
- Meridian response: stable global contracts with jurisdiction-specific tax, fiscal, payroll, reporting, payment, and compliance packs under explicit evidence gates.
- Difference: localization without uncontrolled forks.
- Owner: platform governance and regional domain packs
- Risks: unsupported legal claims, maintenance burden, country-specific provider fragility.
- Validation: one bounded regional pack with legal review, upgrade tests, and pilot evidence.

### DIFF-009 — Unified review queue with domain-owned decisions

- Status: Hypothesis
- Confidence: Medium
- Users: accountants, operations leads, administrators
- Market problem: exceptions and suggestions are fragmented across pages, emails, and notifications.
- Meridian response: shared queue mechanics for priority, assignment, evidence, review, and status while each domain retains validation and commit authority.
- Difference: one operational inbox without creating a generic service that owns business truth.
- Owner: platform workflow seam and domain owners
- Risks: over-generalization and queue overload.
- Validation: accounting prototype first, then cross-domain transferability.

### DIFF-010 — Capability lifecycle visible from research through production

- Status: Prototype Candidate
- Confidence: Medium
- Users: founders, product, architecture, engineering, support
- Market problem: broad platforms frequently confuse documented, available, configured, production-ready, and commercially supported capability.
- Meridian response: registries, lifecycle states, evidence dimensions, workstream plans, program status, risk gates, and change history.
- Difference: claims and implementation maturity remain independently traceable.
- Owner: Platform Design Authority and delivery governance
- Risks: governance overhead and stale status.
- Validation: automated freshness checks and independent release review.

## 5. Differentiation Entry Template

```markdown
### DIF-NNN — Name

- Status:
- Confidence:
- Users:
- Workflow:
- Market problem:
- Evidence:
- Meridian response:
- Genuine difference:
- Owner:
- Dependencies:
- Risks and trade-offs:
- Validation metrics:
- Evidence required for next status:
- Prohibited claims:
- Revisit trigger:
```

## 6. Claim Discipline

External claims require evidence appropriate to the audience and must not be inferred from this register alone. “Designed to,” “prototype demonstrates,” and “pilot evidence indicates” must not be replaced with “best,” “safest,” “compliant,” or “production-ready” without independent proof.

## 7. Maintenance

Research waves may add hypotheses. Implementation PRs may advance entries only with linked evidence. Customer or pilot validation is required before an entry becomes Market Validated. Entries that become ordinary market table stakes remain useful product requirements but should be removed from active differentiation claims.

## 8. Program Closeout Additions

### DIFF-011 — Authority-visible cross-domain productivity

- Status: Prototype Required
- Confidence: Medium
- Market problem: shared search, dashboards and inboxes often hide the source owner and freshness.
- Meridian response: authority/freshness context and source-domain command reauthorization.
- Prohibited claim: do not call this an advantage until multi-domain usability and isolation evidence exists.

### DIFF-012 — Shared uncertainty and recovery grammar

- Status: Prototype Required
- Confidence: Medium-High
- Market problem: pending, offline, timeout, stale and partial states are inconsistently represented.
- Meridian response: consistent vocabulary plus domain-owned reconciliation and compensation.
- Prohibited claim: do not claim reliability from documented state names alone.

### DIFF-013 — Deterministic AI-disabled essential workflows

- Status: Prototype Required
- Confidence: High for need, Low for delivered quality
- Market problem: assistance can become a hidden dependency.
- Meridian response: normal application commands remain available under provider/model/cost/policy failure.
- Prohibited claim: do not claim safe AI without security, prompt-injection and failure evidence.

### DIFF-014 — Source-linked release communication by audience

- Status: Prototype Required
- Confidence: Medium
- Market problem: changelogs, in-app announcements, API changes and tenant history are mixed.
- Meridian response: one governed source feeding distinct audience/availability surfaces.
- Prohibited claim: do not infer adoption or comprehension without research.

### DIFF-015 — Marketplace restraint as a risk boundary

- Status: Deferred
- Confidence: High
- Market problem: marketplace UI can hide custody, payout, tax and compliance obligations.
- Meridian response: paid billing, payout and facilitation stay disabled until named gates pass.
- Prohibited claim: restraint is an architectural decision, not a competitive claim.
