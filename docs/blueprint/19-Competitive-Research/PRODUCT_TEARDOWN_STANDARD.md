---
document_id: PDA-CIR-014
title: Product Teardown Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Product Teardown Standard

## 1. Purpose

This standard defines how Meridian conducts product teardowns that are useful for architecture, workflow, UX, and implementation decisions without becoming product imitation or superficial feature comparison.

A teardown must explain what problem the product solves, how the workflow behaves, where the evidence is strong or weak, what Meridian should learn, and what Meridian should reject.

## 2. Scope

A teardown may cover:

- an entire product;
- one domain or module;
- one workflow;
- one client surface;
- one release or redesign;
- one implementation pattern;
- one failure or migration experience.

Broad product teardowns must remain synthesis documents. Detailed evidence belongs in domain matrices, workflow references, source records, and pain-point registers.

## 3. Required Sections

### Product Context

- product and edition;
- target segment;
- geography and market context;
- observed platforms;
- pricing or packaging relevant to the analysis;
- observation date;
- source and access limitations.

### User and Job

- primary roles;
- jobs to be done;
- frequency and consequence;
- implementation or setup assumptions;
- boundaries of the evaluation.

### Capability Map

- core capabilities;
- optional modules;
- table stakes;
- differentiators;
- important absences;
- roadmap-only items clearly separated from shipped behavior.

### Workflow Analysis

For each critical workflow:

- trigger;
- prerequisites;
- steps;
- decisions;
- system feedback;
- review and approval;
- errors and exceptions;
- recovery and reversal;
- resulting records and evidence;
- integrations and follow-up work.

### Information Architecture

- application shell;
- navigation depth;
- workspace and context model;
- search, recents, favorites, and commands;
- settings and administration structure;
- desktop, mobile, and device transformation.

### Experience Analysis

- learnability;
- expert efficiency;
- progressive disclosure;
- information density;
- forms and validation;
- tables and pagination;
- dashboards and analytics;
- empty, denied, offline, stale, partial, uncertain, and failure states;
- accessibility observations and evidence limitations.

### Architecture and Integration

Only document architecture that is directly supported by:

- public source code;
- official technical documentation;
- API or protocol evidence;
- official engineering publications.

Otherwise classify conclusions as inference or unknown.

Cover where evidenced:

- ownership boundaries;
- data model concepts;
- API and webhook surface;
- eventing;
- offline model;
- extension/plugin model;
- import/export;
- deployment and upgrade model;
- security and tenancy.

### Automation and AI

- rules;
- suggestions;
- confidence;
- provenance;
- approval;
- autonomy;
- feedback;
- correction;
- fallback;
- audit;
- cost and limits.

### Reliability and Operations

- documented limits;
- latency and scale claims;
- observability;
- retry and recovery;
- backup/export/migration;
- support and incident communication;
- release and deprecation practices.

### Customer Pain and Failure Evidence

Separate:

- observed behavior;
- documented limitation;
- recurring customer complaint;
- inferred cause;
- confirmed root cause.

Do not repeat inflammatory or identifying content. Summarize patterns fairly and cite appropriate evidence.

### What the Product Does Well

Identify principles worth learning from. Do not copy proprietary expression.

### What Meridian Should Never Copy

Record anti-patterns, hidden trade-offs, unsafe defaults, architecture conflicts, or target-segment assumptions that do not fit Meridian.

### Meridian Disposition

For each material finding choose:

- Adopt underlying principle
- Improve materially
- Prototype
- Defer
- Intentionally exclude
- Reject
- Insufficient evidence

State the affected Meridian authority and required evidence.

### What Surprised Us

Record findings that contradicted assumptions, exposed unexpected trade-offs, or changed the research direction. This section must not be filled with generic observations merely to appear insightful.

## 4. Evidence Register

Every teardown includes a compact evidence table:

| Evidence ID | Claim | Source class | Source | Date | Evidence mode | Confidence | Limitation |
|---|---|---|---|---|---|---|---|

Detailed source records may live in a supporting research artifact when the table becomes unwieldy.

## 5. Workflow Notation

Use a clear state-oriented form:

```text
Trigger
  ↓
Draft or imported record
  ↓ validation failure → Review queue
Validated
  ↓ rule or suggestion
Proposed match
  ↓ reject → Unmatched
Approved
  ↓ domain command
Canonical record committed
  ↓
Audit + event + downstream projection
```

The notation must include important exceptions and recovery, not only the happy path.

## 6. Comparative Fairness

A teardown must not:

- compare different plan tiers without disclosure;
- compare a configured enterprise deployment with a default trial as if equal;
- treat third-party extensions as core product without qualification;
- penalize a focused product for not being an ERP unless expansion is the question;
- assume a polished screen proves strong backend integrity;
- infer accessibility from appearance;
- infer AI quality from marketing claims;
- use stale screenshots as current product evidence;
- treat product popularity or funding as product-quality evidence.

## 7. Copyright and Licensing

- Use original prose and analysis.
- Do not commit screenshots, recordings, source code, icons, copy, or assets unless redistribution is explicitly allowed and required.
- Prefer stable public references.
- Sanitize authenticated references and never include tokens or private account details.
- Do not recreate distinctive screens pixel for pixel.
- Code sketches must be original Meridian interfaces or pseudocode.

## 8. Depth Levels

### Level 1 — Rapid Scan

Use for backlog triage. Requires a small number of primary sources, explicit limitations, and no architecture conclusions.

### Level 2 — Workflow Teardown

Use before implementation planning. Requires multiple primary sources, direct workflow evidence where possible, contradiction handling, and Meridian dispositions.

### Level 3 — Deep Product Teardown

Use for strategic competitors or foundational domains. Requires capability, workflow, UX, technical, pain-point, lifecycle, and commercial analysis with independent review.

### Level 4 — Implementation Benchmark

Use when a specific Meridian implementation is compared against real alternatives. Requires reproducible first-party testing, declared scenarios, quantitative evidence, and no unsupported superiority claim.

## 9. Review Gates

A teardown cannot become Accepted until:

- primary sources have been reviewed;
- evidence dates and editions are recorded;
- important contradictory evidence is represented;
- legal and access boundaries are respected;
- confidence is assigned per material conclusion;
- Meridian impacts are mapped;
- an independent reviewer checks for unfair comparison and confirmation bias;
- any proposed architecture change follows normal governance.

## 10. File Naming

Use uppercase snake case for governed synthesis documents. Product-specific teardown files should use a stable normalized product name, for example:

```text
PRODUCT_TEARDOWNS/QUICKBOOKS_ONLINE.md
PRODUCT_TEARDOWNS/XERO.md
PRODUCT_TEARDOWNS/ODOO_ACCOUNTING.md
```

Do not create one file per minor feature when a domain matrix or workflow reference is the better authority.

## 11. Teardown Template

```markdown
---
document_id: PDA-CIR-NNN
title: Product Name Teardown
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: YYYY-MM-DD
related_adrs: []
---

# Product Name Teardown

## Executive Summary
## Product Context
## Users and Jobs
## Capability Map
## Critical Workflows
## Information Architecture
## UX and Accessibility
## Technical and Integration Evidence
## Automation and AI
## Reliability and Operations
## Customer Pain and Failure Evidence
## What It Does Well
## What Meridian Should Never Copy
## What Surprised Us
## Meridian Dispositions
## Required Blueprint or Roadmap Changes
## Evidence Register
## Confidence and Limitations
## Revalidation Triggers
```

## 12. Maintenance

Teardowns are dated evidence snapshots. Major product changes require a new review entry and version update; historical findings must remain traceable. A teardown may be archived when the product exits the relevant market, but findings incorporated into Meridian authorities remain governed independently.