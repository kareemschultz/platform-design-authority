---
document_id: PDA-CIR-005
title: Competitive Research Standards
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Standards

## 1. Purpose

This document defines the minimum quality, provenance, ethics, security, and review standards for Meridian competitive research.

## 2. Mandatory Properties

Every governed research document must be:

- relevant to a named Meridian decision;
- evidence-backed;
- source-classified;
- current enough for the decision;
- explicit about uncertainty;
- respectful of licensing and access controls;
- balanced by counter-evidence;
- clear about what is observed, documented, inferred, and unknown;
- connected to implementation or governance follow-up;
- independently reviewable.

## 3. Required Sections

Domain matrices, workflow references, and major teardowns must include:

1. Executive summary
2. Scope and research questions
3. Meridian baseline
4. Product and edition coverage
5. Source register
6. Capability findings
7. Workflow findings
8. UX and accessibility findings
9. Automation and AI findings
10. Architecture and integration findings
11. Pain points and failure modes
12. Counter-evidence and limitations
13. Meridian dispositions
14. Things Meridian should never do
15. Required blueprint changes
16. Implementation implications
17. Validation criteria
18. Confidence and revisit triggers

## 4. Research Scope Control

Each wave must define:

- included capabilities;
- excluded capabilities;
- products reviewed;
- editions and platforms reviewed;
- time cutoff;
- source-access limitations;
- why the sample is sufficient for the intended decision.

A document must not imply complete market coverage unless the methodology genuinely supports that claim.

## 5. Citation Standard

Every non-trivial product claim should be traceable to a source record containing:

- publisher or product;
- title;
- date or version when known;
- retrieval date;
- stable reference where permitted;
- source class;
- claim supported;
- access limitation.

Quotations should be brief and necessary. Prefer original synthesis over copied language.

## 6. Freshness Standard

Research is stale when:

- the relevant product has materially changed;
- pricing or plan boundaries changed;
- the workflow was observed on an unsupported or retired version;
- the source is no longer accessible;
- the Meridian decision has changed;
- implementation evidence contradicts the finding;
- the recorded review date exceeds the domain's refresh cadence.

Stale research may remain historically useful but must not silently support a current decision.

## 7. Privacy and Security

Do not collect or commit:

- credentials;
- tokens;
- session cookies;
- private customer data;
- private account identifiers;
- proprietary support conversations;
- private authenticated URLs containing access material;
- sensitive screenshots;
- copied production data;
- secrets found during technical inspection.

Use synthetic or redacted examples.

## 8. Licensing and Copyright

Research may describe and analyze protected products. It must not:

- mirror a commercial catalog;
- redistribute licensed templates or source;
- copy complete screens or flows into the repository without permission;
- recreate distinctive trade dress;
- copy substantial documentation or marketing text;
- remove attribution or licensing notices;
- imply ownership of third-party work.

## 9. Automated Collection

Scraping, crawling, bulk export, or automated collection must comply with applicable terms, robots controls, rate limits, and legal review. An authenticated MCP or API does not automatically authorize building a local substitute for the source service.

## 10. Product Access

Research must state whether evidence came from:

- public access;
- free account;
- paid account;
- trial;
- public source repository;
- official demo;
- permitted MCP or API;
- third-party observation.

Do not share account credentials or licensed assets across unauthorized users.

## 11. UX Evidence

A screenshot supports visible observations only. Accessibility, responsiveness, interaction, performance, and hidden-state claims require direct testing or published evidence.

## 12. Technical Evidence

Do not infer internal architecture from route names, bundle structure, UI behavior, or marketing language. Technical claims require official documentation, public source for the exact version, or reproducible inspection within permitted boundaries.

## 13. Customer Evidence

Customer reports must be handled without harassment, deanonymization, or misrepresentation. Record patterns rather than identifying private individuals. Do not quote vulnerable or personal information unnecessarily.

## 14. Quantitative Evidence

A number must include:

- source;
- population;
- sample;
- period;
- method;
- relevant limitations.

Do not average incomparable ratings, convert qualitative complaints into prevalence, or rank products with invented precision.

## 15. Scorecard Use

Scores are aids for comparison, not authority. Every score requires narrative evidence and confidence. A total score must not conceal a critical weakness in security, financial correctness, accessibility, auditability, or recovery.

## 16. AI Use

AI-assisted research must include source verification for load-bearing claims. Generated citations, quotes, feature details, and product behavior must be checked directly. AI may not fabricate inaccessible product access or pretend to have executed a workflow it did not execute.

## 17. Review Requirements

Before merge, a substantial research wave should receive:

- documentation and registry validation;
- architecture review for implications;
- UX review for pattern conclusions;
- domain review for correctness;
- legal or licensing review when retention or reuse is unclear;
- independent challenge of high-confidence decisions.

## 18. Change-Control Standard

Research findings do not directly modify runtime behavior. A finding that changes Meridian authority must identify and update the owning document, ADR, registry, or implementation plan in a separate, reviewable change or a clearly separated commit.

## 19. No Silent Scope Expansion

Finding a competitor feature does not add it to Meridian's scope. New capability proposals require:

- user value;
- segment relevance;
- architecture ownership;
- security and privacy assessment;
- operational cost;
- support burden;
- lifecycle plan;
- founder or product approval where required.

## 20. Research Debt

Known limitations must be recorded in the research backlog. Do not hide missing mobile, accessibility, regional, pricing-tier, or failure-state evidence behind a broad conclusion.

## 21. Things Research Must Never Do

- Turn competitive parity into product strategy.
- Reward feature count over workflow quality.
- Treat an attractive screen as a complete system.
- Recommend unsafe automation to reduce clicks.
- Hide contradictory evidence.
- Treat vendor marketing as independent validation.
- Present customer anecdotes as statistical truth.
- Copy proprietary expression instead of extracting principles.
- Create an unmaintainable archive of stale product facts.
- Block implementation indefinitely when a bounded prototype can answer the question.

## 22. Completion Gate

A research artifact is mergeable when its claims are traceable, its limitations are honest, its Meridian implications are bounded, and a future reviewer can understand both why the conclusion was reached and what evidence would cause it to change.