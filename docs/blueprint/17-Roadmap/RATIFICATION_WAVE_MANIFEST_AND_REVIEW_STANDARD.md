---
document_id: PDA-RDM-010
title: Ratification Wave Manifest and Review Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0016, ADR-0025]
document_class: plan-roadmap-register
declared_depth: contract-specified
evidence_state: implemented
applicable_dimensions: [purpose, authority-and-scope, failure-and-recovery, verification-and-evidence, external-dependencies, references-and-traceability]
---

# Ratification Wave Manifest and Review Standard

## Purpose

Define the evidence contract that turns a planned review wave into a verifiable review, approval, ratification, or lifecycle promotion. The standard prevents document volume, implementation activity, author self-review, or an unbound review report from being represented as authority.

`registry/ratification-waves.json` records preparation state for RW-00 through RW-08. At the 2026-07-16 cutoff, RW-00 is in `preparation`; every other wave is `not-started`. No wave has a candidate revision, frozen scope manifest, review record, approval record, or promotion record. Therefore no new authority is claimed.

## Authority

This standard implements PDA-FND-011 and PDA-RDM-002. It remains subordinate to the Constitution and accepted/ratified authority. It does not appoint human reviewers, supply founder decisions, create qualified professional opinions, approve a document, or change lifecycle.

The author of a Class A or Class B decision cannot be its sole approver. AI review may add an independent lens but cannot impersonate a founder, legal professional, regulator, provider, customer, accessibility auditor, penetration tester, or named organizational authority.

## Wave States

| State | Required meaning |
|---|---|
| `not-started` | Scope entry points and known blockers exist; no formal review has begun. |
| `preparation` | Required reviewer roles and review prerequisites are being assembled; candidate scope is not frozen. |
| `in-review` | One immutable Git revision and exact document/version/status manifest are under named review. |
| `changes-requested` | Formal review exists and unresolved blocking findings prevent approval. |
| `approved` | The exact candidate scope was accepted by the named authority; all material findings have dispositions. |
| `ratified` | The highest required authority ratified the exact scope and every lifecycle promotion has evidence. |
| `superseded` | A later manifest replaces the record; the earlier evidence remains immutable and linked. |

States are not the same as document lifecycle. A wave may be approved while some scoped documents remain Draft because they were explicitly deferred; a document may not be promoted unless its own promotion record and required approval exist.

## Preparation Record

Every planned wave records:

- stable wave ID and sequence;
- title, approval authority, and required reviewer roles;
- scope entry-point documents;
- blocking dependencies;
- null candidate, review, disposition, approval, and promotion fields until real evidence exists.

Preparation is useful coordination evidence, not review evidence.

## Frozen Scope Manifest

Before `in-review`, create an immutable candidate commit and record every scoped artifact exactly:

| Field | Requirement |
|---|---|
| `document_id` | Must resolve in `registry/documents.json`. |
| `path` | Must equal the registered path at the candidate revision. |
| `version` | Must equal front matter at the candidate revision. |
| `status_before_review` | Must equal the candidate lifecycle state. |
| `content_hash` | SHA-256 of the reviewed file bytes. |
| `scope_disposition` | `review`, `context-only`, or `explicitly-deferred` with a reason. |
| `authority_dependencies` | Governing Constitution sections, ADRs, specifications, FDR items, and external gates. |

Generated registries, schemas, OpenAPI, product MDX, code, and evidence are included when they materially support the wave, with their own path, hash, and role. A branch name, PR number, or moving main-branch pointer is not an immutable candidate.

## Review Records

Each required perspective produces a record with:

- reviewer identity and reviewer role;
- independence/conflict declaration;
- date and exact candidate revision;
- reviewed manifest hash;
- recommendation: approve, approve with conditions, request changes, or reject;
- blocking, major, and minor findings with stable IDs;
- contradictions, dissent, evidence limitations, and inaccessible scope;
- signature or repository-authenticated provenance appropriate to the organization.

One person may cover multiple roles only when the approval authority explicitly accepts the combination and independence remains credible. Missing qualified review remains a blocker; it is not recorded as “not applicable” for convenience.

## Finding Disposition

Every material finding is dispositioned as Accepted, Accepted with modification, Rejected with rationale, Deferred to a named follow-up, or Out of scope with a destination. The disposition records owner, changed document/version, evidence, reviewer response, and closure state.

Unresolved blocking findings force `changes-requested`. Dissent is preserved even when the approval authority accepts the risk. Independent reports are never edited to manufacture closure; disposition occurs in a separate governed artifact.

## Approval and Ratification Record

An approval record names:

- the exact candidate revision and manifest hash;
- approval authority identity and role;
- decision date;
- accepted conditions, residual risks, and deferrals;
- finding-disposition artifact;
- effective scope and explicit non-scope;
- next-wave dependencies;
- any expiry or revalidation trigger.

Ratification additionally records the higher threshold required by the Constitution or foundational authority. Founder and external decisions must link their actual evidence; documentation cannot self-close them.

## Lifecycle Promotion Record

Every promoted document is listed individually with document ID, reviewed version/hash, prior status, approved status, approval record, effective date, and downstream registry/contract impact. The promoted bytes must match the reviewed bytes, except for a separately reviewed mechanical status/metadata patch whose diff is attached.

Prohibited promotions include:

- Draft to Approved because a prototype was implemented;
- Proposed ADR to Accepted without the required decision authority;
- Approved or Ratified without `review_evidence`;
- a whole folder or wave promoted from one generic approval statement;
- review of one commit used to approve later unreviewed changes;
- author or AI self-approval represented as independent review.

## Current Wave Preparation

RW-00 prepares repository governance review. Its blockers include assignment of an independent reviewer, freezing an exact candidate/version manifest, DCA-006 class-specific adoption evidence, and the final governance audit. RW-01 through RW-08 retain their dependency, founder, specialist, implementation, and external blockers in the registry.

RW-08 is deliberately an aggregate planning label. Before review it must split into tractable AI, security/privacy, data, UX/accessibility, deployment/operations, and testing manifests with their applicable authorities. One cross-cutting approval cannot substitute for specialist evidence.

## Validation

`scripts/validate_ratification_waves.py` enforces exact RW-00 through RW-08 coverage, sequence, state vocabulary, scope-path existence, reviewer-role and blocker declarations, Git revision ancestry, document/version/path manifest parity, review-role coverage, disposition/approval evidence, and promotion gates. Seeded tests reject omitted waves, unfrozen review, approval without records, premature promotion, and broken scope paths.

The validator proves evidence binding and lifecycle consistency; it cannot decide whether a reviewer is qualified or whether the architecture should be approved.

## Change and Retention

- Preparation records may evolve with versioned review.
- Once `in-review`, the candidate manifest and review records are immutable evidence; corrections use a successor candidate or disposition.
- Approved/ratified records are retained permanently with supersession links.
- A material post-review change invalidates approval for the changed scope unless the approval record explicitly bounded it.
- Wave status changes update PDA-RDM-002, the registry, the relevant section indexes, and the audit disposition together.
