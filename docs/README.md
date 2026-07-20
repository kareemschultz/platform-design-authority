# Documentation

This directory is the canonical home for repository prose. ADR-0025 separates four documentation classes without changing their authority.

| Directory | Purpose | Authority |
|---|---|---|
| `blueprint/` | Governed platform architecture, decisions, evidence, roadmap, and strategy | Constitution, lifecycle metadata, ADRs, and approved specifications |
| `implementation/` | Prototype evidence, dispositions, candidate audits, scaffold provenance, and repository migration records | Implementation evidence only |
| `reviews/` | Independent audits, immutable evidence, registrations, and dispositions | Evidence; dispositions do not rewrite independent audits |
| `templates/` | ADR, specification, and review authoring templates | Guidance only |

Product, user, administrator, developer, migration, troubleshooting, and release content is authored in `apps/docs/content/docs/` because it is compiled by the Fumadocs application. It derives from released or explicitly labelled prototype behavior and does not become architecture authority.

## Review and audit evidence taxonomy

- `docs/reviews/` contains human-readable independent audit reports, registrations, dispositions, remediation plans, and completion roadmaps. Delivered independent audit reports are immutable evidence: later corrections, disagreements, closure claims, and status changes belong in a disposition or later review, never in the original report.
- `evidence/audit/` contains machine-readable audit indexes and finding registers. These artifacts make finding identity, severity, status pointers, and closure-test metadata mechanically discoverable; they do not replace the independent report or create a second narrative authority. Factual status fields may point to a governed disposition, but must not rewrite a finding's original actual/expected evidence or closure test.
- `evidence/first-slice/` contains bounded implementation and test-evidence sources used by deterministic evidence checks and generated registries. An evidenced cell proves only its registered first-slice depth and does not imply pilot or production readiness.

The authority order remains the one defined in `AGENTS.md`. Generated or machine-readable evidence is subordinate to its governing source and must preserve the distinction between an immutable observation, a later disposition, and current implementation status.

Machine-consumed artifacts remain intentionally separate:

- `openapi/` — canonical API contracts;
- `schemas/` — canonical message and record schemas;
- `registry/` — generated and curated governance registries, including the separate product-documentation evidence manifest;
- `scripts/` — deterministic registry and validation tooling.

Start with:

- [Blueprint index](blueprint/README.md)
- `docs/blueprint/PLATFORM_MANIFEST.md`
- `docs/blueprint/00-Foundation/CONSTITUTION.md`
- `docs/blueprint/00-Foundation/DOCUMENT_DEPTH_AND_READINESS_STANDARD.md`
- `docs/blueprint/19-Appendices/DOCUMENTATION_DEPTH_ASSESSMENT-2026-07-16.md`
- `docs/blueprint/19-Competitive-Research/README.md`
- `docs/reviews/MERIDIAN_DOCUMENTATION_COMPLETION_AUDIT_REGISTRATION.md`
- [Review evidence and disposition index](reviews/README.md)
- `docs/blueprint/18-Decisions/ADR-0025-NORMALIZE-MONOREPO-AND-DOCUMENTATION-LAYOUT.md`
- [Implementation evidence index](implementation/README.md)
- `docs/implementation/ROOT_DOCUMENT_MIGRATION_PROPOSAL.md`

The history-preserving migration from root numbered directories and the former `meridian/` wrapper is governed by ADR-0025. Historical audit contents retain the paths that were correct when issued; active documents, registries, tooling, and workflows use the normalized layout.
