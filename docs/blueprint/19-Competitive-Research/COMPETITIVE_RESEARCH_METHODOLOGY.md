---
document_id: PDA-CIR-002
title: Competitive Research Methodology
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Methodology

## 1. Purpose

This document defines how Meridian researches products, workflows, market expectations, customer pain points, and implementation patterns. It is designed to produce evidence that can safely inform blueprint changes without turning product observation into unreviewed authority.

## 2. Research Question Format

Every research effort begins with a bounded question containing:

- **User** — who is trying to accomplish something?
- **Task** — what outcome do they need?
- **Context** — tenant, organization, location, device, frequency, and operating conditions.
- **Consequence** — what happens if the task is wrong, late, duplicated, unavailable, or misunderstood?
- **Decision** — what Meridian choice is the research expected to inform?
- **Evidence threshold** — what would be enough to make, defer, or reject that choice?

Example:

> How do leading bookkeeping products help a small-business owner categorize an imported bank transaction while preserving accountant review, auditability, and correction by reversal?

A weak question such as "What features does X have?" is not sufficient by itself.

## 3. Research Layers

### 3.1 Capability research

Determines whether a market capability is:

- table stakes;
- segment-specific;
- premium or specialist;
- emerging;
- poorly served;
- obsolete;
- intentionally excluded by Meridian.

### 3.2 Workflow research

Documents the end-to-end user and system sequence, including:

- initiation;
- data capture;
- validation;
- classification;
- suggestion or automation;
- review;
- approval;
- posting or execution;
- exception handling;
- reversal or correction;
- audit evidence;
- reporting consequences.

### 3.3 Experience research

Evaluates:

- information architecture;
- navigation depth;
- terminology;
- cognitive load;
- discoverability;
- expert efficiency;
- progressive disclosure;
- keyboard and touch suitability;
- mobile transformation;
- accessibility risks;
- empty, loading, stale, partial, denied, offline, and error states.

### 3.4 Automation and AI research

Separates:

- deterministic rules;
- statistical suggestions;
- generative assistance;
- autonomous actions;
- user approval;
- reviewer approval;
- override;
- rollback;
- explanation;
- provenance;
- confidence;
- audit;
- fallback.

### 3.5 Failure and pain-point research

Collects recurring friction from support forums, reviews, community discussions, migration stories, incident reports, and product limitations. Findings must distinguish:

- direct observation;
- vendor acknowledgment;
- repeated independent reports;
- isolated complaint;
- inferred root cause;
- validated root cause.

### 3.6 Architecture and integration research

Uses official technical sources to assess:

- API shape;
- webhooks and events;
- extension model;
- import/export;
- identity and authorization;
- idempotency;
- pagination;
- rate limits;
- offline support;
- data ownership;
- deployment model;
- migration and compatibility.

Unpublished internal architecture remains unknown.

## 4. Research Sequence

### Step 1 — Establish Meridian baseline

Before researching competitors, read the relevant Meridian authorities and current implementation. Record what is already decided, what remains open, and what would require governance change.

### Step 2 — Define comparison set

Select competitors from materially different categories, for example:

- automation-first specialist;
- small-business incumbent;
- open-source product;
- modular ERP;
- enterprise suite;
- mobile-first entrant;
- developer-first platform.

Do not compare only products with the same business model or visual style.

### Step 3 — Gather first-party evidence

Prefer:

1. official product documentation;
2. official help center;
3. official API and developer documentation;
4. official release notes and changelog;
5. official pricing, plan, and legal pages;
6. official demonstrations, webinars, and product tours;
7. public source code and issues where applicable.

### Step 4 — Gather observational evidence

Use permitted tools such as Mobbin, public demos, videos, and screenshots to study visible behavior. Record that this evidence cannot prove accessibility, backend design, security, or actual user outcomes.

### Step 5 — Gather customer evidence

Use reviews, communities, forums, issue trackers, and migration stories. Record source, date, context, and limitations. Do not convert anecdotes into percentages.

### Step 6 — Reconstruct workflow

Create a workflow model showing:

- actors;
- system boundaries;
- steps;
- decisions;
- state transitions;
- exceptions;
- recovery;
- evidence created;
- downstream effects.

Mark every element as observed, documented, inferred, or unknown.

### Step 7 — Compare alternatives

For each meaningful difference, answer:

- What problem is the product solving?
- What trade-off did it choose?
- Which user segment benefits?
- Which user segment is harmed?
- What hidden complexity may exist?
- Is the behavior compatible with Meridian's principles?

### Step 8 — Form Meridian disposition

Use Adopt, Improve, Combine, Custom Meridian Required, Defer, Reject, or Insufficient Evidence.

### Step 9 — Identify governance impact

List affected:

- blueprint documents;
- ADRs;
- capabilities;
- permissions;
- events;
- APIs;
- data models;
- UX patterns;
- quality budgets;
- risks;
- implementation plans.

### Step 10 — Define validation

State how Meridian will know the decision was correct. Examples include prototype evidence, usability testing, performance measurement, accountant review, accessibility testing, or pilot outcomes.

## 5. Sampling Rules

- Compare at least three materially different implementations where feasible.
- Include at least one counterexample or product that intentionally chooses a different trade-off.
- Do not use search-result counts as reviewed evidence.
- Do not count a product as reviewed unless a relevant source was actually inspected.
- Separate complete workflows from isolated screens.
- Record unavailable, paywalled, or inaccessible evidence.
- Stop expanding the sample once additional products no longer change the conclusion materially, and record that saturation judgment.

## 6. Evidence Labels

Each claim must be labeled internally or in its evidence table as one of:

- **Directly observed**
- **Officially documented**
- **Vendor-stated**
- **Customer-reported**
- **Independently reproduced**
- **Inferred from behavior**
- **Unknown**

## 7. Confidence Model

### High

Use when multiple independent strong sources support the same conclusion and no material counter-evidence remains unresolved.

### Medium

Use when evidence is credible but incomplete, limited to one product category, or dependent on a vendor claim.

### Low

Use when evidence is narrow, mostly anecdotal, visually inferred, or contradicted.

### Unknown

Use when the required evidence is unavailable or the question is not yet testable.

## 8. Research Record Schema

Every substantial finding should record:

- research ID;
- date;
- researcher or agent;
- research question;
- Meridian capability or workflow;
- products examined;
- sources;
- evidence labels;
- findings;
- counter-evidence;
- disposition;
- confidence;
- affected authorities;
- required follow-up;
- revalidation trigger.

## 9. Pain-Point Handling

A complaint becomes a Meridian design input only after asking:

- Is the complaint repeated?
- Is the product being used as intended?
- Is the problem caused by configuration, training, pricing, missing functionality, or actual UX failure?
- Does the complaint apply to Meridian's target segment?
- What trade-off would a proposed fix create?
- Can the problem be validated in a prototype?

## 10. Quantitative Claims

Do not publish market share, adoption, satisfaction, time savings, accuracy, error reduction, performance, or financial outcomes without a source whose methodology is understood. Vendor marketing claims must be identified as vendor claims.

## 11. Research with Subscription Tools

Subscription tools such as Mobbin or premium component catalogs may be used within their terms for internal research. They must not be mirrored, scraped, bulk-exported, or committed as proprietary assets. Store original analysis and permitted stable references, not copied catalogs.

## 12. AI-Assisted Research

AI may accelerate source discovery, summarization, comparison, and drafting. It must not:

- invent sources;
- hide inaccessible evidence;
- fabricate product behavior;
- present inference as fact;
- reproduce protected content;
- substitute for direct review of load-bearing sources;
- assign High confidence without sufficient evidence.

Every research PR remains subject to human and independent-agent review.

## 13. Refresh Rules

A finding must be revisited when:

- the competitor changes the relevant workflow;
- the source becomes stale or unavailable;
- a new market category emerges;
- Meridian implementation evidence contradicts it;
- target users change;
- pricing or entitlement structure materially changes;
- a regulation or platform constraint changes;
- a major incident reveals a previously hidden risk.

## 14. Completion Criteria

Research is complete enough to inform a decision when:

- the question is bounded;
- Meridian's existing position is known;
- comparison products are diverse;
- first-party evidence is represented;
- workflow and failure states are understood;
- counter-evidence is recorded;
- disposition and confidence are explicit;
- governance impact is identified;
- validation criteria are defined;
- unresolved unknowns are tracked rather than concealed.