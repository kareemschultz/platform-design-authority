---
document_id: PDA-CIR-010
title: Market Gap Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0022]
---

# Market Gap Register

## 1. Purpose

This register captures evidence-backed gaps between user needs and available market solutions. It distinguishes genuine unmet needs from attractive ideas, implementation preferences, and unsupported claims of superiority.

A market gap does not automatically become Meridian scope. It must pass strategic fit, ownership, feasibility, risk, and lifecycle review.

## 2. Gap Qualification

A candidate gap should demonstrate at least three of the following:

- repeated pain across multiple relevant products or user segments;
- workarounds involving spreadsheets, duplicate systems, consultants, or manual controls;
- important workflow states absent or weakly supported;
- a mismatch between product target segment and user need;
- poor interoperability or ownership boundaries;
- material accessibility, offline, regional, or mobile deficiency;
- opaque automation or weak auditability;
- expensive capability available only to large enterprises;
- fragmented capability across multiple products;
- a credible path for Meridian to perform materially better.

## 3. Gap Status

- **Hypothesis** — plausible, not yet sufficiently evidenced.
- **Validated** — triangulated evidence supports a real gap.
- **Strategic Candidate** — validated and aligned with Meridian strategy.
- **Planned Response** — incorporated into governed scope or roadmap.
- **Addressed** — implementation evidence exists.
- **Rejected** — real gap, but Meridian intentionally will not address it.
- **Superseded** — market or strategy changed.

## 4. Initial Gap Hypotheses

### GAP-001 — Explainable automation for bookkeeping

- Status: Hypothesis
- Users: owners, bookkeepers, accountants, reviewers
- Need: reduce manual categorization and matching without losing control or auditability.
- Market symptom: automation-oriented products emphasize reduced effort, while traditional accounting products often expose powerful but fragmented rules and review workflows.
- Meridian opportunity: combine explainable suggestions, rule traces, source evidence, confidence, human approval, correction learning, and domain-owned posting.
- Risk: overpromising AI accuracy or increasing review burden.
- Evidence needed: Kick, Numeric, Puzzle, Rillet, QuickBooks, Xero, and accountant workflow research.

### GAP-002 — One review queue across operational exceptions

- Status: Hypothesis
- Users: accountants, administrators, operations leads
- Need: see and resolve uncategorized transactions, failed matches, missing receipts, duplicate suspicions, rule failures, reconciliation exceptions, imports, and AI suggestions in one coherent work surface.
- Market symptom: exceptions are often scattered across domain-specific pages and notifications.
- Meridian opportunity: a platform review-queue pattern with domain-owned item types, priorities, assignment, due dates, evidence, and bulk handling.
- Risk: creating an over-generalized workflow engine or hiding domain semantics.
- Evidence needed: accounting, inventory, payments, support, and work-management research.

### GAP-003 — Enterprise capability with small-business learnability

- Status: Validated strategic theme
- Users: small and midsize businesses growing into multi-entity operations
- Need: advanced controls without consultant-dependent navigation and configuration.
- Market symptom: lightweight products are easier but become limiting; broad ERPs are powerful but difficult to learn, configure, and upgrade.
- Meridian opportunity: progressive disclosure, complexity tiers, role-based workspaces, safe defaults, governed extension points, and consistent patterns.
- Risk: attempting to serve every segment simultaneously.
- Evidence needed: ongoing ERP, accounting, CRM, inventory, and workforce comparison.

### GAP-004 — Clear permission versus entitlement communication

- Status: Validated
- Users: end users, administrators, support
- Need: understand whether an action is unavailable because of role, tenant provisioning, rollout, limit, or temporary suspension.
- Market symptom: generic locks, disabled controls, and upgrade prompts obscure the actual cause.
- Meridian opportunity: distinct canonical states backed by independent authorization and entitlement evaluation.
- Risk: exposing sensitive policy detail.
- Evidence: existing Mobbin and WS1 research.

### GAP-005 — Honest offline and provider uncertainty

- Status: Strategic Candidate
- Users: cashiers, field workers, operators, finance teams
- Need: continue safely when connectivity or providers are uncertain, with explicit queued, pending, conflicted, and reconciled states.
- Market symptom: many products either stop entirely or present false success and unsafe retry behavior.
- Meridian opportunity: command identity, local evidence, bounded offline capability, provider uncertainty, reconciliation, and recovery workflows.
- Risk: high implementation complexity and incorrect expectations about offline scope.
- Evidence needed: POS, field-service, payment, and offline product research plus first-party prototypes.

### GAP-006 — Region-ready platform without fragmented forks

- Status: Strategic Candidate
- Users: businesses operating across countries with local tax, fiscal, payroll, payment, and reporting needs
- Need: stable global core with jurisdictional packs that do not fork domain ownership.
- Market symptom: global products may be weak locally; local products may not scale across entities or countries.
- Meridian opportunity: governed regional capability packs, evidence gates, provider adapters, and explicit legal boundaries.
- Risk: unsupported compliance claims and excessive jurisdiction scope.
- Evidence needed: region-specific research before each pack.

### GAP-007 — Unified Party identity across domains

- Status: Planned Response
- Users: administrators, sales, finance, support, HR, operations
- Need: one canonical person or organization relationship across customer, supplier, employee, contact, and identity roles.
- Market symptom: duplicate records and inconsistent identity models across modules.
- Meridian opportunity: Party as canonical relationship identity, separate from authentication.
- Risk: over-centralizing domain-specific data.
- Evidence: blueprint and WS1 implementation.

### GAP-008 — Audit evidence that humans can investigate

- Status: Planned Response
- Users: administrators, auditors, support, security, finance
- Need: understand actor, scope, decision, before/after, outcome, and correlation without querying multiple systems.
- Market symptom: logs are often opaque, incomplete, or technically rich but operationally unreadable.
- Meridian opportunity: structured append-only audit plus readable investigation UI and stable event contracts.
- Risk: PII leakage and excessive storage.
- Evidence: WS1 and Mobbin findings.

### GAP-009 — Product change communication filtered by relevance

- Status: Hypothesis
- Users: tenant admins, ordinary users, developers, partners
- Need: learn about changes relevant to their role, capabilities, integrations, and rollout without release-note overload.
- Market symptom: public changelogs are broad; in-app announcements are often promotional or interruptive.
- Meridian opportunity: canonical release notes feeding public changelog, in-app What’s New, and developer/API changes with audience and entitlement filters.
- Risk: maintaining multiple inconsistent authorities.
- Evidence needed: Studio, Stripe, GitHub, Linear, Vercel, and enterprise release-communication research.

### GAP-010 — Reversible and explainable consequential changes

- Status: Strategic Candidate
- Users: finance, inventory, administrators, operations
- Need: understand and safely correct postings, stock movements, permissions, configuration, and automated decisions.
- Market symptom: products rely on destructive edit, hidden history, or technically possible but confusing reversal flows.
- Meridian opportunity: correction-by-reversal, effective dates, previews, controlled diffs, and audit-linked remediation.
- Risk: user confusion if reversal concepts are not clearly presented.
- Evidence needed: accounting, inventory, authorization, and configuration research.

## 5. Entry Template

```markdown
### GAP-NNN — Name

- Status:
- Users:
- Need:
- Market symptom:
- Evidence:
- Confidence:
- Existing alternatives:
- Meridian opportunity:
- Strategic fit:
- Risks:
- Required authority changes:
- Validation criteria:
- Revisit trigger:
```

## 6. Decision Rules

A gap may become planned Meridian scope only when:

- the need is evidenced;
- Meridian has a defensible owner and architecture boundary;
- the response aligns with the Constitution and product philosophy;
- implementation and lifecycle cost are understood;
- the solution is more than a competitor checkbox;
- intentional exclusions are documented;
- validation criteria exist.

## 7. Maintenance

Review this register at each research-wave closeout and roadmap boundary. Market movement can close a gap without Meridian action; those entries must be superseded rather than preserved as convenient differentiation claims.

## 8. Program Closeout Additions

### GAP-011 — Authority and freshness visible at the point of action

- Status: Prototype Required
- Users: all cross-domain operators
- Need: distinguish authoritative facts from stale projections and know which domain will execute an action.
- Evidence: ERP, analytics, search, service and inbox waves.
- Meridian opportunity: authority/freshness labels plus source-domain reauthorization.
- Risk: excessive technical language; requires UX evidence.

### GAP-012 — One honest uncertainty and recovery vocabulary

- Status: Prototype Required
- Users: cashiers, operations, finance, support and administrators
- Need: distinguish pending, queued, unknown, stale, conflicted, partial and needs-review outcomes.
- Evidence: POS, payments, offline, integration, automation and analytics waves.
- Meridian opportunity: shared state grammar with domain-owned recovery.
- Risk: common words may obscure domain-specific legal effects.

### GAP-013 — Effective-dated correction across business operations

- Status: Prototype Required
- Users: finance, inventory, workforce, administrators
- Need: understand original, correction, net effect and downstream impact.
- Evidence: accounting, supply-chain and workforce waves.
- Meridian opportunity: shared correction presentation with domain-specific compensation.
- Risk: false reuse across non-equivalent invariants.

### GAP-014 — Deterministic productivity when AI is unavailable

- Status: Supported
- Users: every operator in an essential workflow
- Need: finish work under AI disablement, refusal, outage or budget exhaustion.
- Evidence: AI, automation, accounting and service waves.
- Meridian opportunity: optional assistive layer with normal-command fallback.
- Risk: duplicated UX if assistance is not integrated carefully.
