---
document_id: PDA-CIR-013
title: World-Class Capability Criteria
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# World-Class Capability Criteria

## 1. Purpose

This document defines the questions every major Meridian capability must answer before it may be described internally as world-class. The criteria are deliberately stricter than feature completeness.

A capability is not world-class because it has more settings, more modules, more AI, or a polished dashboard. It must produce a reliable user outcome, remain safe under failure, fit Meridian ownership, and demonstrate evidence across the lifecycle.

## 2. Core Principle

World-class means:

> A relevant user can understand, complete, verify, recover, and trust the capability at the scale and consequence Meridian claims, while experts remain efficient and the platform remains governable.

## 3. User Outcome

- Is the user’s goal explicit?
- Is the workflow aligned to a real job rather than an internal service boundary?
- Can a first-time relevant user complete the basic path?
- Can an expert complete frequent work rapidly?
- Does the system make the next action clear?
- Are completion and consequence unmistakable?
- Does the capability reduce work rather than merely relocate it?

## 4. Information Architecture and Navigation

- Does the capability have one discoverable owning location?
- Is navigation no deeper than necessary?
- Are labels written in user language?
- Is current tenant, organization, location, workspace, and operating state visible?
- Are contextual tabs limited to peer views?
- Are search and commands accelerators rather than hidden dependencies?
- Can users return to the same filtered, sorted, paginated, and selected context?

## 5. Progressive Disclosure

- Is basic work simple without hiding material facts?
- Are advanced controls available when needed?
- Are consequential settings, totals, uncertainty, approval, and destructive effects always visible?
- Are wizards used only for dependent sequences?
- Are drawers and dialogs bounded rather than hidden applications?
- Does the interface avoid nested tabs and repeated navigation trees?

## 6. Correctness and Domain Integrity

- Does the owning domain define the invariant?
- Can invalid state be represented or persisted?
- Are commands idempotent where retries are possible?
- Are concurrency conflicts detected?
- Are corrections reversible or compensating where required?
- Are financial, stock, stored-value, payment, and audit records conserved and reconstructable?
- Are calculations, rounding, time, currency, and units governed?

## 7. State Completeness

Where relevant, does the capability explicitly support:

- initial loading;
- progressive loading;
- empty;
- no results;
- invalid input;
- permission denied;
- entitlement unavailable;
- wrong context;
- offline;
- queued;
- stale;
- partial;
- uncertain;
- conflicting;
- failed;
- retrying;
- completed;
- reversed or corrected;
- deprecated or unavailable.

A happy-path-only component or API is not complete.

## 8. Accessibility and Inclusive Use

- Is the workflow keyboard-operable?
- Is focus visible, logical, and restored correctly?
- Are landmarks, names, descriptions, and status updates available to assistive technology?
- Is color never the only carrier of meaning?
- Does the surface reflow at 200% zoom?
- Are touch targets appropriate?
- Is motion purposeful and reduced-motion safe?
- Are charts and complex data available in accessible alternatives?
- Are locale, RTL, long labels, number formats, and text expansion considered?

## 9. Device and Environment Fit

- Does the workflow preserve its task across desktop, tablet, phone, kiosk, POS, scanner, and native clients where claimed?
- Is the device-specific transformation intentional rather than a compressed desktop layout?
- Are offline and degraded capabilities explicitly bounded?
- Are unsafe actions disabled honestly rather than appearing to succeed?
- Is local state recoverable after restart or reconnect where promised?

## 10. Security, Privacy, and Access

- Is active context server-validated?
- Are permissions enforced at transport and command boundaries?
- Are entitlements evaluated separately?
- Are sensitive fields minimized, classified, and redacted?
- Is data tenant-scoped through keys, repositories, and tests?
- Does the capability avoid exposing account existence, policy internals, or private metadata unnecessarily?
- Are support and administrative access visible and auditable?
- Are credentials, tokens, and secrets excluded from logs and artifacts?

## 11. Auditability and Explainability

- Can a user or investigator tell what happened?
- Is actor, scope, time, target, outcome, correlation, and controlled change summary available?
- Can automated or AI-supported decisions explain source, rule, rationale, and uncertainty?
- Are technical event names linked to human-readable meaning?
- Are audit records append-only and redacted?
- Can an operator reconstruct the consequential sequence without private database access?

## 12. Automation and AI

- Does automation have a clear objective and owner?
- Can the user understand why it acted or suggested?
- Is confidence calibrated and non-authoritative?
- Are approval and autonomy levels explicit?
- Can users correct, reject, and provide feedback?
- Does the system avoid learning unsafe shortcuts from overrides?
- Can the essential workflow complete with AI disabled or unavailable?
- Are cost, latency, provider failure, and model change managed?

## 13. Performance and Scale

- Is the interaction responsive at the declared data volume?
- Are pagination, virtualization, streaming, and background work chosen appropriately?
- Are quality budgets declared and measured?
- Does performance degrade visibly and safely?
- Are expensive analytics and exports bounded?
- Can projections rebuild and recover?
- Are latency, throughput, queue depth, and failure observable?

## 14. Reliability and Recovery

- Are retry semantics safe?
- Are duplicate submissions prevented or harmless?
- Are provider ambiguity and partial success first-class states?
- Can background jobs resume?
- Are dead-letter and manual-recovery paths defined?
- Can the capability recover from process restart, network loss, stale cache, and dependency failure?
- Are backups, restore, and disaster-recovery requirements identified where relevant?

## 15. Integration and Extensibility

- Are APIs, events, imports, exports, and webhooks stable and documented?
- Are permissions and tenancy preserved through integration paths?
- Are versioning and deprecation rules explicit?
- Can plugins or adapters extend the capability without owning core truth?
- Are consumer idempotency and ordering expectations clear?
- Can integrations be observed, retried, disabled, and audited?

## 16. Configuration and Administration

- Are defaults safe and useful?
- Is configuration scoped to the correct tenant, organization, location, or user?
- Are impact, affected users, and effective dates visible?
- Can changes be previewed, validated, audited, and reversed?
- Does the product avoid configuration duplication across modules?
- Can an administrator understand the setting without consulting source code or a consultant?

## 17. Documentation and Learning

- Is there task-oriented getting started guidance?
- Are conceptual, operational, API, troubleshooting, migration, and release materials separated appropriately?
- Is help contextual and searchable?
- Are examples synthetic and safe?
- Are changed behaviors communicated with required action and deadlines?
- Are support escalation and diagnostic evidence clear?

## 18. Commercial and Lifecycle Clarity

- Is capability availability explicit?
- Are limits, entitlements, rollout, feature flags, regions, and plan conditions understandable?
- Are deprecations announced with deadlines and replacements?
- Are experimental and controlled-prototype states clearly labeled?
- Does Meridian avoid implying production readiness from implementation completion?
- Are support and compatibility commitments documented?

## 19. Regional and Regulatory Fit

- Is the global invariant separated from jurisdiction-specific policy?
- Are legal, tax, payroll, fiscal, payment, and reporting claims supported by appropriate evidence?
- Can regional packs evolve without forking the global core?
- Are effective dates, historical rules, and document evidence retained?
- Are unsupported jurisdictions denied or clearly bounded?

## 20. White Label and Brand Adaptation

- Are semantic tokens used instead of raw brand values?
- Can logos, names, typography, colors, and communication be adapted without breaking accessibility?
- Are product identity and legal attribution preserved where required?
- Does customization avoid changing domain meaning or hiding safety states?

## 21. Upgrade and Maintainability

- Are dependencies reviewed and governed?
- Is vendor code normalized rather than copied wholesale?
- Are migrations deterministic and reversible where possible?
- Can the capability upgrade without manual customer-by-customer surgery?
- Are tests, Storybook, contracts, registries, and docs current?
- Is technical debt recorded with an expiry and closure condition?

## 22. Evidence Thresholds

A capability may be described internally as:

- **Research complete** when relevant market and user evidence is reviewed.
- **Blueprint complete** when ownership, invariants, UX, security, events, permissions, API, and lifecycle are governed.
- **Prototype validated** when bounded implementation evidence covers declared risks.
- **Production candidate** only when security, accessibility, performance, operations, migration, support, legal, and pilot gates are satisfied.
- **World-class candidate** when comparative evidence shows it meets or exceeds the strongest relevant market approaches without violating Meridian principles.
- **World-class validated** only after real customer or pilot evidence demonstrates meaningful superiority or exceptional fitness for the declared segment.

## 23. Capability Review Template

```markdown
## Capability

- User and job:
- Segment and context:
- Table-stakes baseline:
- Best observed approaches:
- Meridian target:
- Intentional exclusions:
- Mandatory gates:
- Current evidence stage:
- Failed criteria:
- Risks:
- Validation plan:
- Owner:
- Revisit trigger:
```

## 24. Final Test

Before calling a capability world-class, reviewers must answer:

> Would a relevant user choose Meridian’s workflow over the strongest alternatives after understanding its trade-offs, and can Meridian prove the claim without hiding complexity, risk, or unfinished lifecycle work?

If the answer is unknown, the status remains a hypothesis.