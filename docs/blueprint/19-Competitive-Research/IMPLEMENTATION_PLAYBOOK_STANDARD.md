---
document_id: PDA-CIR-018
title: Research-to-Implementation Playbook Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Research-to-Implementation Playbook Standard

## 1. Purpose

This standard defines how competitive research is converted into implementation guidance without allowing research artifacts to bypass Meridian governance.

A playbook is a bridge between evidence and delivery. It is not a substitute for an ADR, domain specification, implementation plan, API contract, migration plan, or test plan.

## 2. When a Playbook Is Required

Create a playbook when a domain or cross-cutting capability has:

- completed its competitive research wave;
- multiple accepted or prototype-worthy patterns;
- non-trivial workflow, architecture, UX, automation, or operational implications;
- enough evidence to guide implementation choices;
- a planned implementation workstream.

Do not create a playbook for a single minor feature or an uncorroborated discovery.

## 3. Required Inputs

A playbook must cite:

- governing Meridian authorities;
- current capability and domain ownership;
- relevant ADRs;
- competitor capability matrix;
- workflow reference;
- product teardowns;
- pain-point and market-gap entries;
- pattern decisions;
- unresolved risks and founder decisions;
- current implementation baseline.

## 4. Required Structure

### 4.1 Mission and Boundaries

State:

- intended outcome;
- user roles;
- supported contexts;
- explicit non-goals;
- lifecycle target;
- what remains prototype-only.

### 4.2 Domain and Platform Ownership

Map:

- owning domain;
- supporting platform services;
- forbidden cross-domain ownership;
- composition-root responsibilities;
- integration boundaries.

### 4.3 Canonical Workflow Set

For each workflow define:

- trigger;
- command or query;
- actor and scope;
- preconditions;
- main path;
- exceptions;
- review and approval;
- correction or reversal;
- audit;
- events;
- downstream projections;
- offline or degraded behavior.

### 4.4 Capability and Contract Implications

List required:

- capabilities;
- permissions;
- entitlements;
- events;
- API operations;
- state models;
- persistence ownership;
- idempotency behavior;
- pagination and search behavior.

No identifier becomes canonical until registered through the normal process.

### 4.5 Experience Architecture

Define:

- routes and navigation position;
- information hierarchy;
- forms and progressive disclosure;
- table/list/detail model;
- canonical states;
- accessibility requirements;
- responsive and mobile transformation;
- expert accelerators;
- explainability and provenance.

### 4.6 Automation and AI

Separate:

- deterministic rules;
- assistive suggestions;
- review queues;
- approval boundaries;
- model-independent contracts;
- confidence and evidence;
- correction and learning;
- deterministic fallback;
- cost and entitlement controls.

AI must not silently own domain decisions.

### 4.7 Reliability and Operations

Define:

- quality budgets;
- retry and recovery;
- observability;
- support evidence;
- export and migration;
- deprecation and rollout;
- incident and changelog implications.

### 4.8 Implementation Sequence

Break work into small PRs that preserve vertical-slice evidence:

```text
contract and invariants
→ persistence
→ application behavior
→ authorization and entitlement
→ event and audit
→ web/native experience
→ accessibility and responsive evidence
→ operational verification
```

Do not build a complete backend in isolation from the workflow experience.

### 4.9 Acceptance Evidence

For each claim define:

- test scenario;
- expected result;
- evidence owner;
- environment;
- lifecycle stage;
- rejection or rollback condition.

## 5. Competitor Evidence Transfer

Every transferred finding must state:

- source principle;
- what Meridian adopts;
- what Meridian changes;
- what Meridian rejects;
- why the final implementation is original;
- which first-party evidence will validate it.

A competitor feature list alone is not implementation guidance.

## 6. Required Decision Labels

Use:

- Required for first slice;
- Required before domain implementation;
- Prototype candidate;
- Production-readiness requirement;
- Deferred seam;
- Intentionally excluded;
- Research incomplete.

## 7. Playbook Quality Gate

A playbook cannot become Accepted until:

- the relevant research wave has independent review;
- contradictory evidence is represented;
- domain ownership is consistent with the blueprint;
- proposed contracts do not duplicate existing authorities;
- security, privacy, accessibility, offline, and audit implications are explicit;
- implementation sequencing is realistic;
- unresolved founder and external decisions remain open;
- production readiness is not implied by prototype guidance.

## 8. File Organization

Playbooks should live under a clearly named subdirectory when introduced, for example:

```text
docs/blueprint/19-Competitive-Research/IMPLEMENTATION_PLAYBOOKS/
  ACCOUNTING_AND_BOOKKEEPING.md
  CATALOG_AND_INVENTORY.md
  POS_AND_COMMERCE.md
```

Do not create a playbook until the relevant research artifacts exist.

## 9. Maintenance

Update the playbook when:

- the owning blueprint authority changes;
- a prototype disproves a research assumption;
- a competitor pattern becomes stale;
- the workstream scope changes;
- implementation evidence closes or reopens a gap.

Historical decisions must remain traceable through versions and linked evidence.
