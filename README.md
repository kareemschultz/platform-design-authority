# Platform Design Authority

> The authoritative blueprint for a modular, intelligent, white-label Business Operating Platform.

## Purpose

This repository defines the platform before implementation. It is the source of truth for product strategy, architecture, capabilities, user experience, AI, security, data, commercial design, deployment, engineering, testing, operations, roadmap, and company operating decisions.

Draft documents support research and technical prototypes. They do not become production authority merely because they exist.

## Vision

Build one unified platform that can run organizations across industries without forcing every customer to purchase, see, or use every capability.

The platform supports modular domains, role-based workspaces, reusable industry and jurisdiction packs, SaaS and self-hosted deployment, offline operation, white label, extensions and marketplace, and governed AI assistance.

## Authority Model

1. Ratified Constitution
2. Accepted or Approved Architecture Decision Records
3. Approved domain, engine, UX, data, security, commercial, deployment, operations, testing, roadmap, and strategy specifications
4. Implementation and operational documentation
5. Source code

Conflicts are reported and dispositioned rather than resolved silently.

## Repository Structure

```text
apps/                    Web, server, native, and Fumadocs applications
packages/                Shared API, auth, database, environment, UI, and configuration packages
ops/                     Prototype operational assets and PostgreSQL controls
docs/blueprint/00-Foundation/          Constitution, canon, principles, glossary, governance
docs/blueprint/01-Platform/            Platform kernel and shared services
docs/blueprint/02-Architecture/        System, API, event, data, integration, and first-slice contracts
docs/blueprint/03-Business-Engines/    Reusable shared engines
docs/blueprint/04-Business-Domains/    Business domains, capability map, ownership, first-slice Finance handoff
docs/blueprint/05-Industry-Packs/      Industry and jurisdiction configurations
docs/blueprint/06-AI/                  AI architecture, registries, safety, evaluation, memory, agents
docs/blueprint/07-Developer-Platform/  APIs, SDKs, CLI, webhooks, applications, extensions, sandboxes
docs/blueprint/08-Marketplace/         Publisher, listing, review, installation, commercial phasing
docs/blueprint/09-UX/                  Design system, Tailwind, shadcn/ui, charts, accessibility, marketing
docs/blueprint/10-Data/                Data platform, contracts, lineage, metrics, search, retention
docs/blueprint/11-Security/            Tenant isolation, privacy, risk, providers, controls, legal hold
docs/blueprint/12-Deployment/          OpenTofu, environments, capacity, self-hosting, recovery, cost
docs/blueprint/13-Commercial/          Packaging, entitlements, billing, partners, cash and disbursement
docs/blueprint/14-Engineering/         Handbook, recipes, dependency rules
docs/blueprint/15-Operations/          SLOs, incidents, runbooks, exercises, status, migration, repair
docs/blueprint/16-Testing/             Quality strategy, specialist standards, first-slice matrix
docs/blueprint/17-Roadmap/             First slice, prototypes, budgets, ratification
docs/blueprint/18-Decisions/           Architecture Decision Records
docs/blueprint/19-Appendices/          Dated verification, evidence, and readiness assessments
docs/blueprint/19-Competitive-Research/ Governed comparator research, findings, sources, and backlog
docs/blueprint/20-Strategy/            Founder decisions, market strategy, handbooks, company operations
openapi/                Draft API contracts
schemas/                Draft JSON Schemas for events, AI, offline, providers, exports
registry/               Machine-readable governance and delivery artifacts
scripts/                Deterministic validation and registry generation
docs/reviews/                Independent audits, registrations, and dispositions
docs/templates/              Standard authoring templates
.agents/skills/          Agent Skills-compatible project workflows
.claude/skills/         Project-local agent skills
docs/implementation/     Prototype evidence, dispositions, audits, scaffold provenance, and migration records
.github/workflows/      Read-only documentation governance CI
AGENTS.md                Agent-neutral contributor operating contract
CLAUDE.md               AI-agent operating contract
package.json             Bun/Turborepo workspace root
```

## Start Here

- `docs/blueprint/PLATFORM_MANIFEST.md`
- `docs/blueprint/00-Foundation/CONSTITUTION.md`
- `docs/blueprint/00-Foundation/DOCUMENT_DEPTH_AND_READINESS_STANDARD.md`
- `docs/blueprint/00-Foundation/GLOSSARY.md`
- `docs/blueprint/01-Platform/PLATFORM_KERNEL_OVERVIEW.md`
- `docs/blueprint/04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`
- `docs/blueprint/17-Roadmap/FIRST_SLICE_MANIFEST.md`
- `docs/blueprint/17-Roadmap/FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md`
- `docs/blueprint/18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `docs/blueprint/02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md`
- `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `docs/blueprint/14-Engineering/WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md`
- `docs/blueprint/02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md`
- `docs/blueprint/02-Architecture/WORKFLOW_RUNTIME_DECISION_MATRIX.md`
- `docs/blueprint/02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md`
- `docs/blueprint/01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`
- `docs/blueprint/09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md`
- `docs/blueprint/18-Decisions/ADR-0021-REPOSITORY-OWNED-DOCUMENTATION-PORTAL.md`
- `docs/blueprint/18-Decisions/ADR-0022-BASE-UI-BACKED-SHADCN-PRIMITIVES.md`
- `docs/blueprint/18-Decisions/ADR-0023-EVALUATE-PG-DURABLE-FOR-DATABASE-LOCAL-WORKFLOWS.md`
- `docs/blueprint/18-Decisions/ADR-0024-POSTGRESQL-18-MINIMAL-EXTENSION-POLICY.md`
- `docs/blueprint/18-Decisions/ADR-0025-NORMALIZE-MONOREPO-AND-DOCUMENTATION-LAYOUT.md`
- `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md`
- `docs/blueprint/15-Operations/CONTROLLED_PROTOTYPE_SERVICE_RUNBOOKS.md`
- `docs/blueprint/19-Appendices/DOCUMENTATION_DEPTH_ASSESSMENT-2026-07-16.md`
- `docs/blueprint/19-Competitive-Research/README.md`
- `docs/reviews/MERIDIAN_DOCUMENTATION_COMPLETION_AUDIT_V1.md`
- `docs/reviews/MERIDIAN_DOCUMENTATION_COMPLETION_AUDIT_DISPOSITION_V1.md`
- `docs/reviews/FABLE5_THIRD_AUDIT_V1.md`
- `docs/reviews/FABLE5_THIRD_AUDIT_DISPOSITION_V1.md`
- `CLAUDE.md`

## Prototype Development

Prerequisites: Bun 1.3.14 (pinned by `packageManager`), Docker with Compose for the disposable PostgreSQL prototype, Python 3 for the governance scripts, and Node.js 24 only for the server fallback-runtime check.

```bash
bun install --frozen-lockfile   # install workspace dependencies
bun run dev                     # run the Turbo dev graph
bun run dev:web                 # Next.js web prototype on port 3001
bun run dev:server              # Hono/oRPC server on port 3000
bun run dev:native              # Expo prototype
bun run --filter docs dev       # Fumadocs portal on port 4000
bun run build                   # build all workspaces
bun run check-types             # typecheck all workspaces
bun run check                   # ultracite/Biome lint and format check
bun run fix                     # apply safe lint/format fixes
bun run test                    # run workspace tests
bun run db:start                # start the disposable PostgreSQL container
bun run db:migrate              # apply reviewed Drizzle migrations
bun run docker:up               # build and start the full Compose stack
```

Environment variables are validated by `packages/tooling/env`; see `apps/docs/content/docs/getting-started/index.mdx` for the local `.env` shapes. "Meridian" is an internal codename and must not appear in tenant-visible product strings (ADR-0026).

## UI Foundation

The initial web foundation is the latest approved stable Tailwind CSS release, source-owned shadcn/ui components, and Recharts through shadcn chart composition for ordinary operational visualization.

Magic UI Pro and shadcn/studio premium assets may accelerate marketing and selected product surfaces under license, provenance, accessibility, performance, reduced-motion, security, dark-mode, and white-label controls.

## Machine-Readable Governance

Generated registries include:

- `registry/documents.json`
- `registry/capabilities.json`
- `registry/events.json`
- `registry/permissions.json`
- `registry/first-slice-tests.json`

Curated governance includes namespaces, first-slice scope, capability metadata and family readiness, document classes and opt-in adoption, operational readiness, ratification-wave preparation, endpoint permissions, product-documentation evidence, design tokens, architecture rules, governance exemptions, and premium-source provenance templates.

Draft implementation contracts are under `openapi/` and `schemas/`.

Run:

```bash
python scripts/validate_docs.py
python scripts/generate_registries.py --check
python -m unittest scripts/test_validate_document_indexes.py
python scripts/validate_document_indexes.py
python -m unittest scripts/test_validate_document_classes.py
python scripts/validate_document_classes.py
python -m unittest scripts/test_validate_product_docs.py
python scripts/validate_product_docs.py
python -m unittest scripts/test_validate_research_registration.py
python scripts/validate_research_registration.py
python -m unittest scripts/test_validate_capability_readiness.py
python scripts/validate_capability_readiness.py
python -m unittest scripts/test_validate_ratification_waves.py
python scripts/validate_ratification_waves.py
```

## Document Lifecycle

`Draft → In Review → Approved or Accepted → Ratified where required → Deprecated or Superseded`

Approved or Ratified status requires review evidence. Production implementation requires approved authority or a reviewed exception.

## Current Status

The repository is in **controlled-prototype delivery and documentation-depth remediation**.

The documentation-completion audit is registered by `docs/reviews/MERIDIAN_DOCUMENTATION_COMPLETION_AUDIT_REGISTRATION.md` and dispositioned by `docs/reviews/MERIDIAN_DOCUMENTATION_COMPLETION_AUDIT_DISPOSITION_V1.md`. It preserves the existing controlled-prototype exception while rejecting enterprise-depth, ratification, comprehensive-research, first-slice-completion, and pilot/production readiness claims at its cutoff.

WS1 is complete at controlled-prototype depth. WS2 is active: plan, contracts, Catalog Product, and Inventory ledger/workflows are merged through PR #69; durable event delivery/projections are on open PR #74, and later WS2 increments remain sequenced. Proposed ADR-0020 makes Bun/Hono/oRPC the preferred prototype path with an evidence-driven Node fallback; production ratification remains pending.

Pilot and production readiness still require FDR-001 through FDR-010, qualified Guyana review, provider certification, customer evidence, executable tests, accessibility and security evidence, and operational exercises.

## Working Agreement

`Idea → Research → Capability Proposal → Blueprint Specification → Independent Review → Decision → Implementation → Verification → Measurement → Documentation`

## Ownership

Platform Founder: Kareem Schultz  
Repository: `kareemschultz/platform-design-authority`
