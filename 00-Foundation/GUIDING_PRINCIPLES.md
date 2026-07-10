---
document_id: PDA-FND-003
title: Guiding Principles
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Guiding Principles

## Purpose

These principles translate the Platform Canon and Constitution into practical guidance for daily product, design, architecture, commercial, and engineering decisions.

## Principles

### 1. Start with the user’s job, not the module

Design around the outcome a user is trying to achieve. Domain and module boundaries should remain clear internally, but workflows may cross them when that creates a simpler experience.

### 2. One concept, one owner, one meaning

Every core concept must have one authoritative definition and owner. Synonyms may be presented through governed terminology settings, but internal semantics must remain stable.

### 3. Entitlements and permissions are different

An entitlement answers, “Does this organization own this capability?” A permission answers, “May this user perform this action?” Every capability must enforce both where applicable.

### 4. Hide complexity, never responsibility

The interface should simplify decisions, but it must not hide material consequences, financial impact, approvals, risk, or irreversible effects.

### 5. Default to safe and sensible

New organizations should be productive quickly through strong defaults. Security, auditability, data integrity, accessibility, and recoverability must be enabled by default.

### 6. Configuration before code forks

Solve variation through metadata, policies, workflows, templates, industry packs, terminology, and extension points before introducing custom source code.

### 7. Shared engines before duplicated logic

When behavior applies across domains, it belongs in a shared engine with a stable contract. Duplication requires an explicit architectural exception.

### 8. APIs and events are product surfaces

Interfaces used by integrations and automation deserve the same design discipline, documentation, versioning, testing, and usability as graphical interfaces.

### 9. Mobile is not a smaller desktop

Mobile workflows must be designed for context, speed, touch, scanning, camera use, intermittent connectivity, and reduced attention.

### 10. Offline is a business-continuity mode

Offline behavior must be deliberate, visible, conflict-aware, and recoverable. Queued actions and synchronization state must never be ambiguous.

### 11. AI follows the same rules as people

AI receives no hidden privilege. It must use explicit tools, scoped identities, entitlements, permissions, approvals, audit trails, and policy checks.

### 12. Audit the decision, not only the button click

For significant actions, capture actor, time, tenant, reason, source, before and after state, approval context, and relevant automation or AI provenance.

### 13. Prefer reversible change

Where practical, support drafts, previews, simulations, approvals, undo, reversals, version history, and staged rollout.

### 14. Build for global use from the start

Never assume one currency, tax system, time zone, language, address format, legal entity, measurement system, or fiscal calendar.

### 15. White-label without fragmentation

Branding, terminology, domains, communications, documents, support surfaces, and approved application identity must be configuration-driven and upgrade-safe.

### 16. Measure outcomes, not activity

Success metrics should reflect user and business outcomes: faster completion, fewer errors, reliable stock, accurate payroll, reduced reconciliation time, and improved customer service.

### 17. Make failure understandable

Errors must explain what happened, what was preserved, what the user can do, and where support or administrators can investigate.

### 18. Document decisions before they disappear

Material architectural, product, commercial, security, or data decisions require durable records with context and tradeoffs.

### 19. Prefer a modular monolith before premature distribution

Logical domain boundaries are mandatory. Physical service separation is earned by scale, isolation, ownership, deployment, or reliability needs—not fashion.

### 20. No feature is complete without operations

A capability is incomplete until it has tests, telemetry, audit, support guidance, migration behavior, failure handling, documentation, and lifecycle ownership.

## Review Questions

Before approving a proposal, ask:

- Does it solve a clear user or business problem?
- Which domain owns the capability and data?
- Can it be reused?
- Is it entitlement-aware, permission-aware, auditable, and observable?
- Is the experience understandable on desktop and mobile?
- Does it define offline behavior where relevant?
- Can it be configured without a fork?
- Does AI operate safely and explainably?
- Is the change testable, supportable, and reversible?
