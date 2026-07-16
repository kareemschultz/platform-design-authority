---
document_id: PDA-CIR-019
title: Competitive Research Implementation Evidence Register
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Implementation Evidence Register

## 1. Purpose

This register tracks whether a competitive-research conclusion was actually transferred into Meridian, prototyped, validated, rejected, or superseded.

It closes the loop between:

```text
Research finding
→ Meridian decision
→ blueprint or implementation change
→ first-party evidence
→ retained, revised, or rejected outcome
```

Research does not create product value merely by existing. This register records whether the decision produced a better Meridian implementation.

## 2. Authority Boundary

This register is evidence and traceability support. It does not replace:

- implementation plans;
- GitHub issues and pull requests;
- prototype evidence reports;
- lifecycle decisions;
- ADR review evidence;
- capability maturity records;
- release and production-readiness gates.

An entry marked `Validated` here does not independently promote a capability, component, dependency, or workstream.

## 3. Statuses

Use exactly:

- **Not Transferred** — finding remains research-only.
- **Transferred to Authority** — incorporated into a blueprint, ADR, registry, or implementation plan.
- **Planned** — implementation work is accepted but not started.
- **Prototype In Progress** — bounded implementation is active.
- **Prototype Evidence Complete** — the planned experiment produced evidence.
- **Validated** — first-party evidence supports retaining the decision.
- **Partially Validated** — some assumptions held and others did not.
- **Rejected by Evidence** — prototype or user evidence disproved the research conclusion.
- **Deferred** — retained but outside current scope.
- **Superseded** — replaced by a newer decision.
- **Unable to Verify** — required evidence cannot currently be obtained.

## 4. Required Fields

Every material entry includes:

- evidence ID;
- originating research artifact and finding ID;
- research confidence at transfer time;
- Meridian disposition;
- owning authority;
- implementation issue and PR;
- affected capability or workflow;
- intended user outcome;
- test or prototype method;
- evidence produced;
- result;
- retained changes;
- rejected assumptions;
- follow-up work;
- lifecycle impact;
- review date and owner.

## 5. Initial Entries

### IMPL-EV-001 — Shallow role-based application navigation

- Origin: `PATTERN_DECISION_REGISTER.md`, PAT-001.
- Status: Prototype Evidence Complete.
- Meridian disposition: Adapt.
- Owning authority: navigation and first-slice UX standards.
- Implementation: WS1 thin application shell.
- Intended outcome: users can identify their current workspace and administrative destinations without three-plus persistent navigation levels.
- Evidence required:
  - keyboard navigation;
  - responsive transformation;
  - visible tenant/organization/location context;
  - route discoverability;
  - permission-aware navigation;
  - mobile behavior.
- Current conclusion: retain the shallow model; continue usability testing as business-domain navigation expands.
- Follow-up: validate again during WS2 when Catalog and Inventory add the first real business workspaces.

### IMPL-EV-002 — Permission versus entitlement state separation

- Origin: PAT-007 and Mobbin UX findings.
- Status: Prototype Evidence Complete.
- Meridian disposition: Adapt.
- Intended outcome: users understand whether access is denied because of their authority or because the tenant lacks a capability.
- Evidence required:
  - distinct copy and visual treatment;
  - server responses remain independently enforced;
  - no unavailable capability is falsely presented as a permission error;
  - no hidden permission is presented as an upsell.
- Current conclusion: retain as a platform-wide canonical distinction.
- Follow-up: validate with real entitlement limits and rollout states in later workstreams.

### IMPL-EV-003 — Session evidence row and revocation workflow

- Origin: PAT-008.
- Status: Partially Validated.
- Meridian disposition: Prototype.
- Intended outcome: users identify and revoke suspicious sessions safely.
- Supported evidence:
  - current-session indicator;
  - last-active information;
  - individual and all-other revocation;
  - explicit reauthentication after revocation.
- Remaining uncertainty:
  - trustworthy coarse-location evidence;
  - cross-device user comprehension;
  - production-scale invalidation behavior.
- Current conclusion: retain device and activity evidence; do not fabricate location.

### IMPL-EV-004 — Before-and-after audit summary

- Origin: PAT-006.
- Status: Planned.
- Meridian disposition: Adopt Principle.
- Intended outcome: consequential changes are understandable without exposing secrets or forcing users to reconstruct state from event names.
- Required evidence:
  - controlled redacted change summary;
  - human-readable action sentence;
  - technical event identity available for advanced users;
  - actor, context, time, and correlation evidence;
  - filter and pagination behavior.
- Follow-up: evaluate in the first deeper domain activity timeline.

### IMPL-EV-005 — Inventory receiving accept/reject-per-line model

- Origin: PAT-009.
- Status: Not Transferred.
- Meridian disposition: Prototype.
- Intended outcome: receiving records expected, accepted, rejected, remaining, cost, discrepancy, and evidence explicitly.
- Blocking requirement: WS2 domain invariants and procurement ownership must be defined before implementation.
- Follow-up: transfer into the WS2 Catalog and Inventory implementation plan after dedicated domain research.

## 6. Entry Template

```markdown
### IMPL-EV-NNN — Name

- Origin:
- Research confidence:
- Status:
- Meridian disposition:
- Owning authority:
- Capability or workflow:
- Intended user outcome:
- Issue:
- PR:
- Prototype or test method:
- Evidence produced:
- Result:
- Retained changes:
- Rejected assumptions:
- Remaining risks:
- Lifecycle impact:
- Follow-up:
- Reviewed:
```

## 7. Validation Rules

An entry cannot be marked `Validated` merely because:

- code merged;
- tests passed without testing the research claim;
- a screenshot looked correct;
- a competitor uses the same pattern;
- the implementation owner prefers the approach;
- no one reported a problem during a controlled prototype.

Validation requires evidence tied to the intended outcome.

## 8. Evidence Types

Strong first-party evidence may include:

- acceptance scenarios;
- automated behavioral tests;
- accessibility testing;
- moderated usability research;
- performance measurements;
- incident and support evidence;
- pilot feedback;
- telemetry with privacy controls;
- reconciliation or data-integrity proof;
- rollback or recovery exercises.

The evidence type must fit the claim. Unit tests do not prove learnability, and usability tests do not prove tenant isolation.

## 9. Contradiction Handling

When implementation evidence contradicts research:

1. preserve the original finding;
2. record the contradiction;
3. determine whether the source, interpretation, segment, or Meridian adaptation was wrong;
4. update the pattern decision or governing authority;
5. reject or narrow the differentiation claim;
6. create follow-up research only when it can change the decision.

Do not protect a research conclusion from contradictory first-party evidence.

## 10. Review Cadence

Review this register:

- at the end of each prototype;
- when a research-backed PR merges;
- during workstream closeout;
- before making a market differentiation claim;
- when customer or operational evidence contradicts a validated entry.

The register should become more selective over time. Record material research-to-product transfers, not every minor UI decision.
