---
document_id: PDA-CIR-003
title: Competitive Research Source Trust Model
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Source Trust Model

## 1. Purpose

This document defines how Meridian weighs evidence used in competitive research. It prevents polished marketing, screenshots, isolated complaints, generated summaries, and inferred architecture from quietly acquiring the same authority as direct, reproducible, first-party evidence.

## 2. Core Rule

Source trust is contextual. No source is universally authoritative.

Examples:

- A pricing page may be authoritative for currently advertised plan limits but weak evidence for actual customer outcomes.
- A screenshot may be useful for visible information hierarchy but cannot prove keyboard accessibility or backend behavior.
- A public source repository may prove implementation details for that version but not the hosted service's current deployment.
- A customer complaint may reveal a real failure mode but cannot establish prevalence by itself.

## 3. Trust Dimensions

Every important source is evaluated across:

- **Proximity** — how directly does it observe the claim?
- **Authority** — is the source responsible for the subject?
- **Reproducibility** — can another reviewer verify it?
- **Currency** — is it current for the question?
- **Completeness** — does it include material constraints and failure states?
- **Incentive** — does the source benefit from presenting the claim favorably or unfavorably?
- **Specificity** — does it address the exact product, version, workflow, segment, and platform?
- **Legality** — may the evidence be accessed, retained, quoted, and shared in the proposed way?

## 4. Source Classes

### Class A — Direct and authoritative

Examples:

- official API specifications;
- official product documentation describing the exact workflow;
- official changelogs and release notes;
- official legal, security, privacy, and licensing terms;
- reproducible behavior in an accessible current product;
- public source code for the exact reviewed version;
- independently executed tests against the product.

Default use: suitable for load-bearing factual claims within its scope.

Limitations: vendors can omit weaknesses, hosted behavior can differ from public code, and documentation can lag implementation.

### Class B — Strong first-party explanatory evidence

Examples:

- official help-center articles;
- official product tours and webinars;
- official architecture blogs;
- official support responses;
- official roadmap and issue statements;
- vendor case studies with disclosed methodology.

Default use: strong evidence, but claims should be checked against behavior or another source when consequential.

### Class C — Structured observational evidence

Examples:

- Mobbin screens and flows;
- public demos;
- recorded product walkthroughs;
- app-store listings;
- screenshots from current official sources;
- independently captured network or browser behavior within allowed access.

Default use: useful for visible workflow and UX observations.

Must not be used alone to prove:

- accessibility;
- security;
- internal architecture;
- actual performance;
- data ownership;
- error handling not shown;
- customer outcomes.

### Class D — Aggregated customer evidence

Examples:

- recurring themes across G2, Capterra, app stores, forums, Reddit, and communities;
- public migration narratives;
- repeated public support complaints;
- issue trackers for open-source products.

Default use: useful for discovering pain points, language, edge cases, and research questions.

Limitations: selection bias, unknown configuration, unverifiable identity, outdated versions, and overrepresentation of unhappy users.

### Class E — Individual commentary and secondary analysis

Examples:

- a single review;
- a blog comparison;
- an analyst summary;
- a consultant's teardown;
- a social-media post;
- an unsourced feature table.

Default use: discovery only unless independently verified.

### Class F — Generated or inferred evidence

Examples:

- AI summaries;
- architecture inferred from UI behavior;
- estimated workflows;
- generated code based on screenshots;
- reconstructed feature lists;
- search-engine snippets.

Default use: hypothesis generation only.

A Class F claim cannot independently support a Meridian decision.

## 5. Preferred Source Order by Claim Type

| Claim | Preferred evidence |
|---|---|
| Feature availability | Current official docs plus direct product verification |
| Pricing or entitlement | Current official pricing and plan terms |
| API behavior | Official API specification plus reproducible request evidence |
| UX structure | Direct product observation, permitted research catalog, or official demo |
| Accessibility | Product testing and published accessibility evidence |
| Performance | Reproducible measurement under stated conditions |
| Customer pain point | Multiple independent reports plus official acknowledgement where available |
| Security or compliance | Official attestation, legal statement, or audited report |
| Architecture | Official technical documentation or public source for the exact version |
| AI accuracy | Reproducible evaluation with a disclosed dataset and method |
| Market adoption | Credible third-party methodology or audited company disclosure |

## 6. Contradictory Sources

When sources disagree:

1. preserve the disagreement;
2. compare dates, versions, plans, platforms, and regions;
3. prefer direct and current evidence for the exact claim;
4. distinguish hosted service from open-source edition;
5. distinguish product capability from plan entitlement;
6. lower confidence until resolved;
7. avoid blending incompatible facts into one synthetic conclusion.

## 7. Marketing Claims

Marketing claims must be labeled as vendor-stated unless independently verified. Words such as "automatic," "real time," "accurate," "secure," "compliant," "AI-powered," and "unlimited" require examination of conditions, limits, exclusions, and failure behavior.

## 8. Customer Complaints

A customer complaint may be recorded as:

- reported friction;
- reported defect;
- reported limitation;
- reported migration trigger;
- reported support burden.

It must not be rewritten as a confirmed product defect without reproduction or authoritative corroboration.

## 9. Screenshots and Visual Catalogs

Screenshots and pattern catalogs may support observations about visible layout, hierarchy, controls, copy, and state presentation. They may not be committed when terms prohibit redistribution, and they may not be treated as evidence of:

- semantics;
- focus behavior;
- assistive-technology support;
- responsive behavior beyond shown viewports;
- hidden states;
- backend rules;
- licensing of implementation source.

## 10. Source Code

Public source code is evidence only for the identified repository, branch, tag, or commit. It does not automatically establish the hosted product's behavior, security posture, operational architecture, or commercial edition.

## 11. Subscription and Authenticated Sources

Authenticated tools and paid catalogs may be used only within their terms. Research must not expose credentials, private tokens, account-only URLs, licensed source, or assets. Record enough provenance for another authorized reviewer to reproduce the work without creating a substitute archive.

## 12. Citation and Retention

Research documents should retain:

- source title;
- publisher or product;
- source class;
- retrieval date;
- version or release where known;
- permitted stable reference;
- claim supported;
- access or retention limitation.

Do not retain copied articles, complete screenshots, videos, private exports, or proprietary code unless the license and repository policy explicitly allow it.

## 13. Trust Escalation

A weak source can initiate research but cannot become stronger merely through repetition. Ten copied blog posts deriving from the same vendor announcement remain one underlying source.

Confidence rises when evidence becomes more direct, independent, current, reproducible, and specific.

## 14. Minimum Evidence for Meridian Dispositions

- **Adopt:** at least one strong source, relevant direct evidence, trade-off analysis, and compatibility with Meridian authority.
- **Improve:** evidence of a useful market principle plus a documented weakness Meridian can address.
- **Combine:** at least two complementary patterns whose assumptions do not conflict.
- **Custom Meridian Required:** evidence that market patterns fail material Meridian constraints or no adequate precedent exists.
- **Reject:** a clear conflict with Meridian principles, risk controls, or target workflow.
- **Defer:** credible value but insufficient scope, maturity, economics, or evidence.
- **Insufficient Evidence:** mandatory when the required threshold is not met.

## 15. Review Requirement

Load-bearing conclusions must be independently reviewable. The research record should make it possible to identify what was observed, what was inferred, which sources were unavailable, and why the confidence level was chosen.