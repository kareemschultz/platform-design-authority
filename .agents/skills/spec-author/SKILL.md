---
name: spec-author
description: Author or revise a governed Platform Design Authority specification. Use when creating a platform, architecture, engine, domain, UX, data, security, commercial, deployment, operations, testing, roadmap, or strategy document.
disable-model-invocation: true
argument-hint: "[target-path-or-topic]"
---

# Governed Specification Author

Create or revise `$ARGUMENTS` only after identifying its authoritative owner and affected documents.

## Read First

- `AGENTS.md`
- `00-Foundation/CONSTITUTION.md`
- `00-Foundation/NAMING_STANDARDS.md`
- `00-Foundation/GLOSSARY.md`
- `registry/domains.json`
- `registry/documents.json`
- `registry/capabilities.json`
- Relevant ADRs, dependency matrix, first-slice scope, and founder decisions

## Process

1. Search the repository for the concept and synonyms.
2. Identify whether the request creates a new owner, changes an existing owner, or only adds detail.
3. Determine whether an ADR or founder decision is required first.
4. Select an unused document ID and valid filename.
5. Write complete front matter.
6. Define purpose, scope, ownership, boundaries, entities, lifecycle, rules, permissions, entitlements, events, APIs, offline behavior, privacy, security, UX, operations, tests, and open decisions as applicable.
7. Propagate the decision into older authoritative documents, indexes, capability maps, dependency matrices, registries, skills, and dispositions.
8. Run documentation validation and registry freshness checks.

## Rules

- Do not create a file merely to increase coverage.
- Do not duplicate ownership.
- Do not invent legal, regulatory, commercial, provider, or founder facts.
- Distinguish architecture, prototype, pilot, and production readiness.
- Record unresolved evidence honestly.
- Never mark a document Approved or Ratified without the required review.

## Output

Report target path, document ID, governing sources, propagated files, open decisions, validation results, and any required ADR or founder action.
