---
document_id: PDA-CIR-017
title: Competitive Pattern Decision Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Pattern Decision Register

## 1. Purpose

This register records reusable product, workflow, UX, automation, and operational patterns discovered across multiple products and states Meridian’s governed disposition.

It prevents vague conclusions such as “make it like Stripe” or “use the Linear pattern.” Meridian adopts principles and interaction logic, not another product’s trade dress, business rules, or hidden assumptions.

## 2. Pattern Scope

Patterns may cover:

- navigation and information architecture;
- forms and progressive disclosure;
- tables, pagination, selection, and inspectors;
- review, approval, and exception queues;
- accounting, inventory, POS, payment, and service workflows;
- audit, activity, and change history;
- AI suggestion, explanation, approval, and fallback;
- mobile, offline, and degraded-state transformation;
- onboarding, help, changelog, and notifications;
- integration, migration, and recovery practices.

Component-source decisions remain governed by the UX component catalog and acquisition policies. This register may point to implementation candidates but cannot promote them.

## 3. Dispositions

- **Adopt Principle** — underlying behavior fits Meridian and is already sufficiently understood.
- **Adapt** — principle is useful but requires meaningful changes for Meridian context, risk, or ownership.
- **Prototype** — promising but needs first-party evidence.
- **Custom Meridian Required** — external patterns do not satisfy the domain or platform requirement.
- **Defer** — useful, but not relevant to current scope.
- **Reject** — conflicts with Meridian principles or creates unacceptable risk.
- **Insufficient Evidence** — no decision yet.
- **Superseded** — replaced by a newer decision.

## 4. Required Decision Fields

Every entry includes:

- pattern ID and name;
- user task and context;
- observed products or sources;
- common principle;
- important differences;
- disposition;
- Meridian adaptation;
- what must not be copied;
- owning authority;
- implementation candidate, if any;
- required evidence;
- confidence and refresh trigger.

## 5. Initial Decisions

### PAT-001 — Shallow role-based application navigation

- Task: find and move between frequent workspaces in a broad business platform.
- Observed sources: Linear, Vercel, Figma, modern SaaS admin products, and negative ERP/CRM examples.
- Principle: show only relevant primary workspaces, permit one coherent nested capability level, and use contextual navigation inside the selected workspace.
- Differences: some products optimize for single-workspace SaaS and do not represent tenant, organization, location, entitlement, or offline context.
- Disposition: Adapt
- Meridian adaptation:
  - maximum two persistent levels;
  - mandatory visible operating context;
  - normal route for every command/search destination;
  - no nested tabs;
  - role, permission, entitlement, and rollout aware.
- Must not copy: competitor labels, branding, hidden context assumptions, or three-band chrome without evidence.
- Authority: `NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`
- Confidence: High

### PAT-002 — List-detail side inspector

- Task: inspect a record without losing list position, filter, or selection context.
- Observed sources: Squarespace, Stripe-like operational products, GitHub issue and deployment inspectors.
- Principle: open a bounded side panel for summary and quick actions, with a deep link to the full record.
- Disposition: Adopt Principle
- Meridian adaptation:
  - official Sheet primitive through `@meridian/ui-web`;
  - URL-backed selection where appropriate;
  - focus trap and restoration;
  - no nested panels;
  - panel never becomes the only route to the record.
- Must not copy: proprietary layout or use the panel as a hidden full application.
- Authority: advanced interface patterns and component catalog.
- Confidence: High

### PAT-003 — Explicit valid-versus-excluded import review

- Task: review a bulk import before consequential commit.
- Observed sources: Remote, Attio, Deel, accounting and commerce import patterns.
- Principle: show exact valid, invalid, warning, duplicate, and excluded counts; permit error-only filtering; require review before commit.
- Disposition: Adapt
- Meridian adaptation:
  - dry run and stable command identity;
  - same validation for inline correction and final import;
  - partial-success policy explicit;
  - downloadable synthetic-safe error report;
  - audit and permission enforcement.
- Must not copy: source-specific domain fields or silently omit invalid records.
- Confidence: High

### PAT-004 — Persistent step tracker for dependent workflows

- Task: complete a complex, resumable sequence such as import, setup, close, or onboarding.
- Observed sources: Deel and other multistep products.
- Principle: visible current step, completed steps, remaining work, validation state, and ability to resume safely.
- Disposition: Adapt
- Meridian adaptation: use only when steps are genuinely dependent; keep step count bounded; expose irreversible consequences before final confirmation.
- Must not copy: artificially splitting a short form merely to look guided.
- Confidence: High

### PAT-005 — Human-readable permission descriptions with impact preview

- Task: create or change roles and permissions safely.
- Observed sources: Workable, Langdock, GitHub, enterprise admin products.
- Principle: pair stable permission identity with human label, description, scope, and affected-member impact.
- Disposition: Adopt Principle
- Meridian adaptation: governed permission catalog labels; server enforcement; entitlement separation; affected-member count; explicit confirmation and audit.
- Must not copy: product-specific role names or raw permission matrix without grouping.
- Confidence: High

### PAT-006 — Before-and-after audit summary with technical identity available

- Task: investigate a consequential change.
- Observed sources: Dropbox, PlanetScale, 7shifts, GitHub.
- Principle: human sentence and controlled diff are primary; stable technical event name, actor, scope, time, and correlation remain available.
- Disposition: Adopt Principle
- Meridian adaptation: redact sensitive fields, avoid arbitrary request dumps, provide filter and export controls consistent with authorization.
- Must not copy: raw values for secrets or personally sensitive fields.
- Confidence: High

### PAT-007 — Usage-aware entitlement unavailable state

- Task: understand why a capability or limit is unavailable.
- Observed sources: Grain and other plan-limit products; negative blurred-paywall patterns.
- Principle: identify the capability and, when limit-based, show current usage and limit without teasing hidden content.
- Disposition: Adapt
- Meridian adaptation: separate user permission from tenant entitlement, rollout, suspension, and wrong context; no generic upgrade lock.
- Must not copy: manipulative urgency, blurred content, or simple plan-tier assumptions.
- Confidence: High

### PAT-008 — Session evidence row with bounded location information

- Task: recognize and revoke suspicious sessions.
- Observed sources: Braintrust, GitHub, security settings products.
- Principle: show device, current-session indicator, last activity, and coarse location or network evidence where trustworthy.
- Disposition: Prototype
- Meridian adaptation: location is optional and never presented as precise certainty; separate sessions from authentication factors; revoke one and all others.
- Must not copy: precise geolocation claims derived from IP.
- Confidence: Medium

### PAT-009 — Stock receiving as accept/reject per line

- Task: receive goods against an expected order while recording discrepancies.
- Observed sources: Shopify, Fresha, inventory and procurement products.
- Principle: expected quantity, accepted quantity, rejected quantity, remaining quantity, progress, and cost reconciliation are visible per line.
- Disposition: Prototype
- Meridian adaptation: domain-owned receiving command, idempotency, partial receipt, reason codes, attachments, audit, and inventory-event atomicity.
- Must not copy: commerce-specific wording or silent auto-fill as final confirmation.
- Confidence: Medium pending WS2 research.

### PAT-010 — On-hand, committed, and available inventory separation

- Task: understand stock that exists, is reserved, and can be promised.
- Observed sources: Shopify and inventory products.
- Principle: distinguish physical on-hand from committed/reserved and derived available quantity.
- Disposition: Prototype
- Meridian adaptation: terms and equations must follow Meridian Inventory ownership and reservation contracts; no editable derived value.
- Must not copy: treating available and on-hand as independently editable numbers.
- Confidence: Medium pending domain invariant review.

### PAT-011 — AI suggestion review rather than silent commit

- Task: use automation for categorization, matching, drafting, or anomaly handling.
- Observed sources: Kick-like bookkeeping automation, Grammarly-like review, emerging finance AI products.
- Principle: suggestion, source, rationale, confidence, effect, approve, reject, correct, and feedback are explicit.
- Disposition: Custom Meridian Required
- Meridian adaptation: domain validates and commits; permission, entitlement, policy, and audit remain ordinary platform controls; deterministic fallback required.
- Must not copy: autonomous posting, confidence theater, or model-specific UX that hides business evidence.
- Confidence: High for safety principle; detailed workflow remains research pending.

### PAT-012 — Public changelog plus audience-aware in-app What’s New

- Task: understand product changes and required action.
- Observed sources: Shadcn Studio and mature developer products.
- Principle: chronological categorized release notes with stable links, while in-app communication is concise and relevant.
- Disposition: Prototype
- Meridian adaptation: separate public product, in-app, developer/API, and tenant audit authorities; filter availability by capabilities and rollout; no ordinary release modal interruption.
- Must not copy: commercial Free/Pro structure unless Meridian packaging requires it.
- Confidence: Medium pending dedicated research.

## 6. Decision Template

```markdown
### PAT-NNN — Name

- Task:
- Context and consequence:
- Observed products:
- Evidence:
- Common principle:
- Important differences:
- Disposition:
- Meridian adaptation:
- Must not copy:
- Owning authority:
- Implementation source:
- Required evidence:
- Confidence:
- Revalidate when:
```

## 7. Decision Transfer

A pattern decision must be transferred into the appropriate UX standard, domain specification, implementation plan, or component catalog before implementation relies on it. This register preserves cross-source reasoning; it is not a substitute for the owning authority.

## 8. Maintenance

Review entries after relevant prototypes and market refreshes. Promote no external component merely because the underlying pattern is accepted. A rejected expression may still contain a valid general principle, and an accepted principle may require completely original Meridian implementation.

## 9. Program Closeout Decisions

| ID | Pattern | Disposition | Status | Required evidence |
|---|---|---|---|---|
| PAT-013 | stable operation identity across retry and reconciliation | Adopt | Supported | provider timeout/idempotency/replay tests |
| PAT-014 | visible pending/queued/unknown/stale/conflicted/partial states | Custom Meridian Required | Prototype Required | cross-domain recovery usability |
| PAT-015 | shared review item with source-domain command | Combine | Prototype Required | accounting plus second-domain prototype |
| PAT-016 | effective-date/reversal correction presentation | Combine | Prototype Required | invariant, audit and comprehension tests |
| PAT-017 | permission-aware search with freshness watermark | Improve | Prototype Required | tenant isolation, deletion and lag tests |
| PAT-018 | governed metric plus table/text alternative | Adopt | Prototype Required | reconciliation and WCAG evidence |
| PAT-019 | AI action preview and deterministic fallback | Custom Meridian Required | Prototype Required | prompt-injection, disabled and budget-failure tests |
| PAT-020 | audience-aware release state taxonomy | Improve | Prototype Required | public/in-app/API/audit separation test |
