---
document_id: PDA-REV-016
title: Document Class Adoption Sample Review
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0025]
---

# Document Class Adoption Sample Review

## Review Identity and Limit

- Review date: 2026-07-16
- Reviewer role: documentation-governance author self-review
- Candidate baseline: `dd73fa2`
- Policy: PDA-FND-017 and `registry/document-classes.json`
- Adoption set: `registry/document-class-adoption.json`
- Decision: suitable for independent Wave 0 review after validators pass

This is not independent review evidence and does not approve PDA-FND-017, close DCA-006, promote a lifecycle state, or establish repository-wide class adoption. Its purpose is to make the author's mapping inspectable and reproducible before an independent reviewer dispositions it.

## Method

For one representative artifact in each class, the review compared declared class, depth, evidence state, applicable dimensions, mapped sections, and reasoned non-applicability against the class policy. It also checked that depth was not confused with lifecycle, implemented procedure or metadata was not described as verified behavior, and product MDX remained outside blueprint authority.

The validator proves path, metadata, vocabulary, dimension, and section-reference agreement. This review assesses the chosen mappings. Neither proves the semantic truth of every sentence in a sample.

The exact reviewed class identifiers are `foundation-authority`, `architecture-decision`, `specification`, `machine-contract`, `plan-roadmap-register`, `research-review-evidence`, `operations-runbook`, `product-documentation`, and `index-template-derived-evidence`.

## Sample Results

| Sample | Class | Artifact | Depth / evidence | Review result | Material limit |
|---|---|---|---|---|---|
| CLASS-SAMPLE-001 | Foundation authority | PDA-FND-017 | `contract-specified` / `implemented` | Mapping coherent | Standard remains Draft and unapproved |
| CLASS-SAMPLE-002 | Architecture decision | ADR-0021 | `contract-specified` / `documented` | Mapping coherent | ADR remains Proposed; portal behavior is not production evidence |
| CLASS-SAMPLE-003 | Specification | PDA-DEV-010 | `architecture-specified` / `documented` | Mapping coherent with offline disposition | Implemented manifest/MDX controls do not make the whole documentation architecture operationally evidenced |
| CLASS-SAMPLE-004 | Machine contract | PDA-PLT-027 | `contract-specified` / `implemented` | Mapping coherent | Permission source and generator exist; business correctness still needs review |
| CLASS-SAMPLE-005 | Plan/roadmap/register | PDA-RDM-010 | `contract-specified` / `implemented` | Mapping coherent | Preparation controls exist; ratification reviews do not |
| CLASS-SAMPLE-006 | Research/review/evidence | PDA-CIR-002 | `contract-specified` / `documented` | Mapping coherent | Method documentation is not completion of the research backlog |
| CLASS-SAMPLE-007 | Operations/runbook | PDA-OPS-018 | `prototype-ready` / `implemented` | Mapping coherent with offline disposition | Procedures are unexercised and not pilot-ready |
| CLASS-SAMPLE-008 | Product documentation | PDOC-0005 | `prototype-ready` / `implemented` | Mapping coherent with accessibility/offline dispositions | Page separates the implemented boundary from a generated Draft canonical table; neither is production evidence |
| CLASS-SAMPLE-009 | Index/derived/evidence | PDA-FND-015 | `indexed` / `implemented` | Mapping coherent | Index correctness depends on the separate navigation validator |

## Adversarial Findings

1. Requiring the four fields across all legacy documents now would manufacture compliance and create a high-noise migration. The register therefore gates only opted-in artifacts.
2. Heading presence cannot prove semantic completeness. Section references are navigation evidence for review, not a semantic score.
3. `not-applicable` is permitted only with an artifact-specific reason; blank, generic, or class-wide boilerplate must fail review.
4. The product-documentation sample remains in its release/evidence manifest. Class adoption does not promote it into the architecture authority plane.
5. `implemented` means the contract, metadata, procedure, or control exists. Only `verified` may represent a passing named review, test, exercise, or measurement.

## Independent Review Criteria

An independent reviewer should request changes if class dimensions omit a consequential lens, a sample's depth/evidence claim exceeds its proof, a non-applicability reason hides an actual requirement, the templates conflict with the policy, or the validator can pass a seeded mismatch. Approval should identify the exact candidate revision and disposition every finding.

## Conclusion

The class model, nine-sample adoption register, front matter, templates, and validator are internally aligned at author self-review. DCA-006 may move from Open to implemented-pending-independent-review only after the complete validation suite passes. It must not be marked Closed from this record.
