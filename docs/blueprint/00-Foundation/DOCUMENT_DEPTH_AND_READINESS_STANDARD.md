---
document_id: PDA-FND-017
title: Document Depth and Readiness Standard
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0025]
document_class: foundation-authority
declared_depth: contract-specified
evidence_state: implemented
applicable_dimensions: [purpose, authority-and-scope, migration-and-extensibility, verification-and-evidence, external-dependencies, references-and-traceability]
---

# Document Depth and Readiness Standard

## Purpose

Define how Meridian evaluates documentation depth, evidence, discoverability, and readiness without confusing file existence, lifecycle approval, implementation, or production proof.

This standard is subordinate to the Constitution, accepted ADRs, and approved specifications. While Draft, it governs only documentation remediation and controlled-prototype review. It does not promote any document or authorize implementation beyond the existing prototype exception.

## Core Rule

Four independent questions must be answered for every material subject:

1. **Lifecycle:** who has reviewed and authorized the current version?
2. **Depth:** how much design or operating detail does the artifact contain?
3. **Evidence:** what behavior, external fact, or review has actually been proved?
4. **Applicability:** which implementation, release, tenant, jurisdiction, provider, device, or audience does the claim cover?

No answer implies another. A long Draft is not Approved. A contract-complete specification is not implemented. Passing prototype tests do not establish pilot or production readiness. A generated registry record proves discoverability and syntax, not semantic completeness.

The first-slice capability depths `full`, `prototype`, and `seam` remain capability-scope terms from PDA-RDM-003 and `registry/first-slice.json`; they are not document-depth labels.

## Artifact Classes

| Class | Examples | Primary completeness question |
|---|---|---|
| Foundation authority | Constitution, canon, principles, naming, glossary, governance | Are authority, terms, invariants, amendment rules, and review thresholds unambiguous? |
| Architecture decision | ADR | Is one consequential decision, its alternatives, consequences, evidence, and review record explicit? |
| Platform, engine, domain, and cross-cutting specification | ownership, behavior, UX, security, data, commercial, deployment, testing | Can affected teams implement the declared scope without inventing owners, invariants, contracts, or failure behavior? |
| Machine contract | OpenAPI, schema, capability/event/permission/endpoint registry | Is the contract deterministic, versioned, validated, owned, compatible, and generated from the correct source? |
| Plan, roadmap, status, and register | workstreams, milestones, risks, decisions, research backlog | Is state tied to a dated source of truth, with owners, gates, dependencies, and no unsupported completion claim? |
| Research, verification, review, and evidence | matrices, teardowns, audits, test reports | Are source, method, cutoff, limitations, confidence, contradictions, and transfer implications reproducible? |
| Operations and runbook | service record, incident, recovery, migration, backup, repair | Can an authorized operator detect, contain, recover, verify, escalate, and preserve evidence safely? |
| Product, administrator, developer, release, and in-app documentation | MDX guides, API reference, migration guide, release note | Does the content describe released behavior for a named audience/version with prerequisites, permissions, outcomes, errors, accessibility, and support boundaries? |
| Index, template, generated artifact, and immutable evidence | section README, template, registry, independent audit | Is its non-authoritative or derived role explicit, discoverable, fresh, and protected from accidental promotion? |

The canonical class identifiers, required dimensions, depth vocabulary, and evidence vocabulary are machine-readable in `registry/document-classes.json`. The class identifiers are `foundation-authority`, `architecture-decision`, `specification`, `machine-contract`, `plan-roadmap-register`, `research-review-evidence`, `operations-runbook`, `product-documentation`, and `index-template-derived-evidence`. A class describes the artifact's job; it does not change authority order or lifecycle.

## Depth Vocabulary

Depth labels describe content, not lifecycle.

| Depth | Minimum meaning | Prohibited inference |
|---|---|---|
| `indexed` | The subject or artifact is named, owned, and discoverable. | No architecture or implementation detail is implied. |
| `ownership-defined` | Purpose, scope, owner, boundary, dependencies, and deferrals are explicit. | No complete behavior or contract is implied. |
| `architecture-specified` | Entities/concepts, invariants, lifecycle, authority, security/privacy, failure model, cross-domain seams, and decision dependencies are defined as applicable. | No executable or public contract is implied. |
| `contract-specified` | Commands/APIs, events, permissions, schemas, idempotency, concurrency, versioning, offline/sync, compatibility, migration, observability, and tests are defined as applicable. | No implementation or successful test is implied. |
| `prototype-ready` | The exact Draft/Proposed authorities being tested, bounded scope, environment, acceptance criteria, risks, fallbacks, and evidence plan are named. | No pilot or production authority is implied. |
| `implementation-ready` | Applicable architecture and contracts are reviewed, unresolved decisions cannot change the build materially, migration/operations/documentation work is planned, and acceptance fixtures exist. | No claim that the implementation passes or that production is authorized. |
| `operationally-evidenced` | The implementation, security, accessibility, performance, migration, recovery, monitoring, and operator procedures have dated results at the declared environment and scale. | No broader tenant, jurisdiction, provider, or production generalization is implied. |

An artifact may be deep but remain Draft. Production-directing readiness requires the appropriate Approved, Accepted, or Ratified authority plus implementation and external evidence; it is not another depth label.

## Evidence Vocabulary

| Evidence state | Meaning |
|---|---|
| `planned` | Required proof and owner are named; no result exists. |
| `documented` | First-party or authoritative prose supports the claim; behavior was not directly tested. |
| `observed` | A lawful direct observation is recorded with environment, version, and limitation. |
| `implemented` | Code, configuration, or procedure exists at an exact revision; no passing result is inferred. |
| `verified` | A named test, review, exercise, or measurement passed at an exact revision/environment. |
| `externally-gated` | Founder, customer, provider, professional, regulatory, certification, or independent evidence is required. |
| `contradicted` | Current evidence conflicts; the claim cannot direct work until dispositioned. |
| `superseded` | Newer evidence replaces the result while history remains preserved. |

## Required Dimensions for Specifications

A platform, engine, domain, workflow, or cross-cutting specification addresses every applicable dimension below. `Not applicable` must name the reason; silence is not a disposition.

1. purpose, users, problem, and business value;
2. authoritative owner, scope, non-goals, dependencies, and first-slice depth or deferral;
3. entities, value objects, identities, money/time/quantity rules, data ownership, classification, retention, and privacy;
4. lifecycle, invariants, correction, reversal/compensation, deletion, concurrency, and idempotency;
5. commands, queries, APIs, schemas, compatibility, pagination, bulk behavior, and rate/resource bounds;
6. canonical events, internal consumers, external webhook boundary, ordering, retry, replay, and projection freshness;
7. permissions, entitlements, rollout, active context, segregation of duties, support/AI/extension authority, and audit;
8. UI, information architecture, task flow, canonical states, responsive transformation, accessibility, and white label;
9. offline leases, signed transport, numbering, conflicts, tombstones, reconciliation, certainty, and device limits;
10. failure classification, degraded behavior, recovery, observability, support, and incident evidence;
11. security threats, secrets, tenant isolation, abuse controls, and safe diagnostics;
12. extensibility, integration, import/export, migration, rollback, upgrade, exit, and data portability;
13. implementation sequence, test dimensions, fixtures, acceptance criteria, capacity targets, and evidence requirements;
14. founder, legal, regulatory, provider, commercial, customer, and professional decisions that documentation cannot make;
15. related document IDs, ADRs, capabilities, events, permissions, OpenAPI operations, schemas, registries, plans, and owners.

The required depth is proportional to admitted scope. A future `ownership-defined` domain must not fabricate APIs or jurisdiction rules merely to fill sections. A first-slice `contract-specified` capability cannot omit applicable authority or failure behavior.

## Class-Specific Requirements

### Foundation and ADRs

Foundation material emphasizes authority, invariant, terminology, consequences, amendment, dissent, and review. An ADR must include context, decision, alternatives, consequences, scope, evidence, status, and review record. It need not repeat every UI/API dimension when those are delegated to named specifications.

### Machine Contracts

Machine contracts require owner, version, compatibility, generator/source provenance, validation, consumer mapping, classification, and change policy. Human prose must not duplicate the canonical schema. A green generator proves freshness, not business correctness.

### Plans, Status, and Registers

Every state claim names an evidence cutoff. Percentages follow PDA-RDM-005 and cannot advance from commit count, issue count, prose volume, or optimism. External state such as GitHub issues, projects, providers, and releases must be reverified before publication.

### Research and Evidence

Research distinguishes documented, observed, inferred, anecdotal, and inaccessible evidence. Product marketing may establish the vendor's stated offer but not usability, reliability, security, accessibility, internal architecture, or customer outcome. Immutable independent audits are registered and dispositioned, never edited to manufacture closure.

### Operations

Runbooks are implementation-coupled. They name trigger, impact, authority, prerequisites, safe diagnostics, containment, recovery, rollback, verification, escalation, tenant/privacy controls, and retained evidence. A planned runbook cannot be operationally evidenced before the service and telemetry exist.

### Product and Developer Documentation

Product documentation is tied to a released version and behavioral evidence. Procedures name audience, prerequisites, permission, entitlement, active context, steps, outcome, errors, offline behavior, correction/reversal, accessibility, troubleshooting, and support route as applicable. API reference is generated from canonical OpenAPI/schemas.

## Completeness Claim Rules

Allowed claims are bounded and measurable, for example:

- “all governed Markdown documents are registered at commit X”;
- “WS1 has verified evidence for 11 capabilities and 143 applicable cells”;
- “this domain is ownership-defined; contracts are deferred until roadmap admission”;
- “the initial nine competitive-research wave headings are present and In Review.”

Prohibited claims include:

- “complete blueprint coverage” based only on file presence;
- “implementation-ready” while material owner, contract, migration, or failure decisions remain open;
- “production-ready” from Draft/Proposed authority or prototype tests;
- “research complete” when requested families, direct observation, source ledger, or review remain open;
- “compliant,” “certified,” “accessible,” “secure,” or “recoverable” without the named current evidence.

## Discoverability and Cross-Reference Rules

- Every governed document appears in `registry/documents.json` and one canonical section index.
- Every public repository Markdown/MDX artifact has exactly one inventory route: governed document registry, explicit `registry/governance-exemptions.json` record, or product-documentation manifest. Templates, conventional indexes, immutable evidence, and non-authoritative project controls are exemptions only when their path, reason, owner, and review date are recorded; an artifact may not be both registered and exempt.
- Every material specification links its owner, relevant ADRs, capability families, permissions/events/contracts where they exist, first-slice depth or deferral, and implementation/evidence plan.
- Indexes use clickable paths and explain entry routes; filename dumps are insufficient at repository scale.
- Orphan exemptions are explicit for templates, immutable evidence, or generated artifacts.
- Superseded documents link both directions and do not continue to direct new work.

## Validation and Review

Machine checks should verify metadata, identifiers, indexes, links, generated freshness, one-route artifact accounting, MDX build/manifest, class-required section dispositions, status cutoffs, and research registration. They must not force filler or pretend keyword presence proves semantics.

Human review remains required for ownership, contradiction, correctness, evidence quality, accessibility, security, privacy, commercial, legal, regulatory, and operational judgments.

`scripts/validate_document_classes.py` enforces the adopted subset recorded in `registry/document-class-adoption.json`. For each adopted artifact it checks that class, depth, evidence state, applicable dimensions, and mapped section evidence agree with the class policy. It accepts `not-applicable` only with a non-empty artifact-specific reason. It does not infer semantic completeness from a heading.

## Migration and Adoption

1. Apply this standard first to new or materially changed documents.
2. Record each migrated artifact in `registry/document-class-adoption.json`; unregistered legacy artifacts remain governed by lifecycle and existing metadata but are not represented as class-contract conformant.
3. Record current depth honestly; do not bulk-promote old outlines.
4. Prioritize first-slice and near-roadmap specifications, not speculative future detail.
5. Preserve historical evidence and superseded assessments.

The optional front-matter fields `document_class`, `declared_depth`, `evidence_state`, and `applicable_dimensions` are now registry-compatible. They become mandatory only for an artifact admitted to the adoption register. This is a backward-compatible migration: the generated document registry preserves the fields when present and emits `null` or an empty list for unmigrated artifacts.

## Contract and Scope Impact

This Draft standard creates no capability, event, permission, OpenAPI operation, schema, domain owner, entitlement, or first-slice scope. Its machine-readable effects are the class policy, opt-in adoption register, preserved registry metadata, templates, and bounded validator. It authorizes no lifecycle promotion.

No ADR is triggered by this initial clarification because it does not change lifecycle states, authority order, public contracts, or implementation ownership. An ADR is required if adoption later changes platform-wide lifecycle semantics or public governance contracts.

## Adoption Decisions and Remaining Review

- Product MDX remains in the separate `registry/product-documentation.json` publication manifest and may participate in the class-adoption register without becoming a blueprint authority document.
- Class validation is blocking only for explicitly adopted artifacts. Repository-wide mandatory adoption requires Wave 0 review and a measured migration plan.
- Index/orphan exemptions remain governed by the canonical index validator. It rejects unaccounted public Markdown/MDX, missing exemption/manifest paths, duplicate inventory entries, and overlap between governed, exempt, and product-manifested routes; class adoption does not create a second exemption mechanism.
- The initial sample review is author self-assessment, not independent approval. DCA-006 cannot be independently closed until a reviewer dispositions the sample and the Wave 0 candidate.
