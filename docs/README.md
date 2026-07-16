# Documentation

This directory is the canonical home for repository prose. ADR-0025 separates four documentation classes without changing their authority.

| Directory | Purpose | Authority |
|---|---|---|
| `blueprint/` | Governed platform architecture, decisions, evidence, roadmap, and strategy | Constitution, lifecycle metadata, ADRs, and approved specifications |
| `implementation/` | Prototype evidence, dispositions, candidate audits, scaffold provenance, and repository migration records | Implementation evidence only |
| `reviews/` | Independent audits, immutable evidence, registrations, and dispositions | Evidence; dispositions do not rewrite independent audits |
| `templates/` | ADR, specification, and review authoring templates | Guidance only |

Product, user, administrator, developer, migration, troubleshooting, and release content is authored in `apps/docs/content/docs/` because it is compiled by the Fumadocs application. It derives from released or explicitly labelled prototype behavior and does not become architecture authority.

Machine-consumed artifacts remain intentionally separate:

- `openapi/` — canonical API contracts;
- `schemas/` — canonical message and record schemas;
- `registry/` — generated and curated governance registries;
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
