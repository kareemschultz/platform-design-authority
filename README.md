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
00-Foundation/          Constitution, canon, principles, glossary, governance
01-Platform/            Platform kernel and shared services
02-Architecture/        System, API, event, data, integration, and first-slice contracts
03-Business-Engines/    Reusable shared engines
04-Business-Domains/    Business domains, capability map, ownership, first-slice Finance handoff
05-Industry-Packs/      Industry and jurisdiction configurations
06-AI/                  AI architecture, registries, safety, evaluation, memory, agents
07-Developer-Platform/  APIs, SDKs, CLI, webhooks, applications, extensions, sandboxes
08-Marketplace/         Publisher, listing, review, installation, commercial phasing
09-UX/                  Design system, Tailwind, shadcn/ui, charts, accessibility, marketing
10-Data/                Data platform, contracts, lineage, metrics, search, retention
11-Security/            Tenant isolation, privacy, risk, providers, controls, legal hold
12-Deployment/          OpenTofu, environments, capacity, self-hosting, recovery, cost
13-Commercial/          Packaging, entitlements, billing, partners, cash and disbursement
14-Engineering/         Handbook, recipes, dependency rules
15-Operations/          SLOs, incidents, runbooks, exercises, status, migration, repair
16-Testing/             Quality strategy, specialist standards, first-slice matrix
17-Roadmap/             First slice, prototypes, budgets, ratification
18-Decisions/           Architecture Decision Records
19-Appendices/          Dated evidence and completeness records
20-Strategy/            Founder decisions, market strategy, handbooks, company operations
openapi/                Draft API contracts
schemas/                Draft JSON Schemas for events, AI, offline, providers, exports
registry/               Machine-readable governance and delivery artifacts
scripts/                Deterministic validation and registry generation
reviews/                Independent audits, registrations, and dispositions
templates/              Standard authoring templates
.claude/skills/         Project-local agent skills
.github/workflows/      Read-only documentation governance CI
CLAUDE.md               AI-agent operating contract
```

## Start Here

- `PLATFORM_MANIFEST.md`
- `00-Foundation/CONSTITUTION.md`
- `00-Foundation/GLOSSARY.md`
- `01-Platform/PLATFORM_KERNEL_OVERVIEW.md`
- `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`
- `04-Business-Domains/CAPABILITY_MAP_AMENDMENT-2026-07-11.md`
- `17-Roadmap/FIRST_SLICE_MANIFEST.md`
- `17-Roadmap/FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md`
- `18-Decisions/ADR-0020-BUN-HONO-ORPC-PREFERRED-PROTOTYPE-STACK.md`
- `02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md`
- `14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `14-Engineering/WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md`
- `02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md`
- `02-Architecture/WORKFLOW_RUNTIME_DECISION_MATRIX.md`
- `02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md`
- `01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md`
- `19-Appendices/BETTER_AUTH_COMPLETE_VERIFICATION-2026-07-12.md`
- `09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md`
- `19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md`
- `18-Decisions/ADR-0021-REPOSITORY-OWNED-DOCUMENTATION-PORTAL.md`
- `18-Decisions/ADR-0022-BASE-UI-BACKED-SHADCN-PRIMITIVES.md`
- `18-Decisions/ADR-0023-EVALUATE-PG-DURABLE-FOR-DATABASE-LOCAL-WORKFLOWS.md`
- `18-Decisions/ADR-0024-POSTGRESQL-18-MINIMAL-EXTENSION-POLICY.md`
- `20-Strategy/FOUNDER_DECISION_REGISTER.md`
- `19-Appendices/DOCUMENTATION_COMPLETENESS_MATRIX-2026-07-11.md`
- `reviews/FABLE5_THIRD_AUDIT_V1.md`
- `reviews/FABLE5_THIRD_AUDIT_DISPOSITION_V1.md`
- `CLAUDE.md`

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

Curated governance includes namespaces, first-slice scope, capability metadata, endpoint permissions, design tokens, architecture rules, governance exemptions, and premium-source provenance templates.

Draft implementation contracts are under `openapi/` and `schemas/`.

Run:

```bash
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

## Document Lifecycle

`Draft → In Review → Approved or Accepted → Ratified where required → Deprecated or Superseded`

Approved or Ratified status requires review evidence. Production implementation requires approved authority or a reviewed exception.

## Current Status

The repository is in **complete blueprint remediation and constrained technical-prototype readiness**.

Three independent Fable 5 audits have been completed. The third-audit remediation adds first-slice events, API and permission contracts, delivery depth, numeric quality budgets, schemas, Marketplace governance, AI controls, UX implementation standards, deployment and operations depth, and formal audit disposition.

The intended readiness decision remains: **one constrained vertical-slice implementation after named blockers; Technical Prototypes 1–3 may start after final verification**. Proposed ADR-0020 makes Bun/Hono/oRPC the preferred prototype path with an evidence-driven Node fallback; production ratification remains pending.

Pilot and production readiness still require founder decisions, qualified Guyana review, provider certification, customer evidence, executable tests, accessibility and security evidence, and operational exercises.

## Working Agreement

`Idea → Research → Capability Proposal → Blueprint Specification → Independent Review → Decision → Implementation → Verification → Measurement → Documentation`

## Ownership

Platform Founder: Kareem Schultz  
Repository: `kareemschultz/platform-design-authority`
