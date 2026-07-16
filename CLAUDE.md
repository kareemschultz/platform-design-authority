# Platform Design Authority — AI Contributor Instructions

This repository is the architectural source of truth for the modular, white-label, AI-native Business Operating Platform. These instructions apply to every AI or automated contributor.

## 1. Authority Order

When documents conflict, report the conflict and use this order:

1. `docs/blueprint/00-Foundation/CONSTITUTION.md`
2. Ratified or Accepted ADRs
3. Approved specifications with review evidence
4. Proposed ADRs
5. Draft specifications
6. `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md` for unresolved business authority
7. Templates, evidence, reviews, examples, and generated artifacts

Generated registries are indexes and contracts derived from authoritative sources; they do not outrank those sources.

## 2. Lifecycle

Only Approved, Accepted, or Ratified material may direct production implementation. Draft and Proposed material may guide controlled prototypes that name the exact documents and decisions being tested.

Approved or Ratified documents require `review_evidence`. Do not promote status because a document is long, implemented, or generated.

## 3. Required References

Plans, pull requests, specifications, and architectural recommendations cite:

- Document IDs and ADRs
- Canonical capability IDs
- Event and permission IDs
- Owning domains, engines, platform areas, and contracts
- First-slice depth or deferral
- Founder, legal, regulatory, provider, commercial, and evidence dependencies

## 4. Mandatory Lookups

Before inventing an identifier or boundary, consult:

- `registry/domains.json`
- `registry/documents.json`
- `registry/capabilities.json`
- `registry/capability-metadata.json`
- `registry/events.json`
- `registry/permissions.json`
- `registry/first-slice.json`
- `registry/first-slice-tests.json`
- `registry/endpoint-permissions.json`
- `registry/architecture-rules.json`
- `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md` for technology, version, compatibility, and workaround claims
- `docs/blueprint/14-Engineering/WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md` before creating or handing off parallel work
- `docs/blueprint/07-Developer-Platform/PRODUCT_DOCUMENTATION_AND_KNOWLEDGE_ARCHITECTURE.md` for user, developer, release, or in-app help changes
- `docs/blueprint/02-Architecture/POSTGRESQL_18_EXTENSION_DECISION_MATRIX.md` before adding a database extension, preload library, or background worker
- `docs/blueprint/01-Platform/BETTER_AUTH_PLUGIN_AND_FEATURE_DECISION_MATRIX.md` before enabling or recommending a Better Auth core option, plugin, managed-infrastructure integration, partner integration, or community plugin
- `docs/blueprint/09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md` before creating, applying, changing, or recommending a shadcn preset, style, base/theme/chart color, font, icon library, radius, menu treatment, RTL, or density default
- `docs/blueprint/09-UX/PREFERRED_COMPONENT_CATALOG.md` before searching, importing, generating, adapting, approving, or replacing reusable components, blocks, animations, page compositions, or progressive-disclosure patterns
- `docs/blueprint/02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md` before changing runtime, HTTP shell, transport, or Node fallback policy
- `docs/blueprint/02-Architecture/WORKFLOW_RUNTIME_DECISION_MATRIX.md` before selecting or changing durable/background workflow infrastructure
- `docs/blueprint/02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md` before changing the documentation platform or content-delivery architecture
- `docs/blueprint/04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md`
- `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md`

Do not edit generated registries manually. Update sources and run:

```bash
python scripts/generate_registries.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

## 5. Architectural Rules

- Preserve ADR-0002 and ADR-0003 modular-monolith and data ownership boundaries.
- Follow `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md` and `registry/architecture-rules.json`.
- A domain owns its authoritative data and behavior.
- Do not import another domain's repositories, migrations, or tables.
- Use explicit application contracts, the transactional outbox, and canonical events.
- Enforce tenant scope across data, cache, search, jobs, events, files, exports, webhooks, offline, extensions, and AI.
- Evaluate entitlements and permissions separately. Feature flags are neither.
- Better Auth owns authentication and sessions, not Party, business roles, permissions, entitlements, or tenant hierarchy.
- Better Auth plugins are deny-by-default. Organization/Admin roles, payment/subscription plugins, Agent Auth, MCP, managed audit, and scaffold defaults do not transfer canonical platform ownership.
- Party owns canonical real-world identity; domains own role records.
- Corrections to financial, inventory, payroll, stored-value, cash, and audit facts use reversal or compensation.
- Privacy follows ADR-0014 and the deletion journal.
- Commerce owns customer stored value. Payment orchestrates provider rails. Finance accounts and reconciles. Loyalty owns only non-cash value.
- Initial tenant payments use direct tenant-provider contracts. Do not introduce custody, pooling, sub-merchants, payment facilitation, aggregation, or merchant-of-record behavior.
- Detailed Payment identifiers use `payment.*` under ADR-0017.
- Offline behavior declares leases, limits, idempotency, numbering, conflicts, tombstones, and reconciliation.
- External webhooks belong to the Developer Platform.
- Extension execution follows ADR-0019. Arbitrary third-party code is prohibited inside the core application process.
- Marketplace paid billing and publisher payout remain disabled until founder and external gates are complete.
- AI tools use normal application commands and all ordinary authority controls.
- Essential first-slice workflows remain deterministic with AI disabled.

## 6. Naming

- Capability: `<namespace>.<capability>`
- Event: `<namespace>.<entity>.<past-tense-fact>.v<major>`
- Permission: `<namespace>.<resource>.<action>`
- ADR filename: `ADR-NNNN-DESCRIPTIVE-TITLE.md`
- Specification filename: uppercase snake case, with dated evidence suffix where appropriate

Do not invent prefixes, use plan names as capability IDs, or use provider names in business contracts.

Use `Platform Subscription` for the platform SaaS contract and `Recurring Agreement` for a tenant's customer contract.

`engine.<name>` registers a shared engine. Dedicated detailed families include `ai.*`, `payment.*`, `loyalty.*`, and `fiscalization.*`.

"Meridian" is the internal engineering codename only (ADR-0026): it names the workspace, `@meridian/*` packages, services, and CI — never canonical identifiers, tenant-visible strings, receipts, or public API surfaces. The `@meridian/*` scope is provisional and private until npm/trademark checks are recorded; the commercial product name and publishing identity require FDR-011.

## 7. Money, Time, Quantity, and Identity

- Authoritative money uses explicit currency and approved decimal/integer semantics, never binary floating point.
- Preserve units and conversion provenance.
- Preserve timezone and legally relevant local dates.
- Use opaque internal identifiers separately from human references.
- GYD is first-class; USD and other currencies require explicit policy.
- A Better Auth user is not a Party or domain role.
- Stored value is not a payment credential, loyalty account, bank deposit, or receivable.

## 8. UI and Experience

- Web styling uses the latest approved stable Tailwind CSS release.
- shadcn/ui components are copied and normalized into platform-owned source.
- New authenticated web scaffolds use the governed Base UI/Rhea/Neutral/Blue/Geist-Inter/Lucide/default-radius bootstrap, then normalize it into semantic tokens and accessible compact, comfortable, and touch variants. A preset is not design-system authority.
- Ordinary charts use shadcn chart composition and Recharts.
- Specialized visualization libraries require a justified requirement and review.
- Magic UI Pro and shadcn/studio premium assets follow the premium source policy and provenance template.
- External components, blocks, animations, and page compositions remain candidates until `PREFERRED_COMPONENT_CATALOG.md` promotion gates pass; MCP availability or paid access never grants approval.
- Agents must search platform-owned components first, record provenance, review diffs, avoid duplicate primitive systems, and never let imported UI redefine domain, permission, entitlement, payment, privacy, or workflow semantics.
- Never commit premium credentials, license keys, private download URLs, or prohibited redistributable source.
- Every component and workflow covers canonical states, accessibility, responsive behavior, offline behavior, performance, and white label.
- `ui-pattern-audit` reviews pattern selection; `accessibility-review` performs formal accessibility review.

## 9. First-Slice Scope

The bounded scope is defined by `FIRST_SLICE_MANIFEST.md`, `registry/first-slice.json`, the OpenAPI contract, schemas, and test matrix.

Included depth is explicitly `full`, `prototype`, or `seam`.

Core areas:

- Identity, tenancy, Party, permissions, entitlements, devices, audit, privacy, and offline sync
- Catalog, barcode, Inventory ledger, POS, registers, cash, deposits, returns, receipts, and stored value
- Payment, tax, fiscalization, reporting, Finance, webhook, and provider seams according to declared depth
- Backup, recovery, accessibility, testing, operations, and tenant isolation

Deferred:

- Production storefront and tenant recurring commerce
- Advanced loyalty
- Full General Ledger and financial statements
- Customer-account tender
- Production fiscal submission
- Self-checkout
- Unverified terminal coverage
- Payment facilitation or custody
- Broad autonomous AI
- Arbitrary marketplace code execution

Do not expand scope without updating all source and machine-readable artifacts plus founder decisions.

## 10. Contract Discipline

Draft implementation contracts are under `openapi/` and `schemas/`.

- OpenAPI operations declare permissions or explicit authenticated context.
- Event references resolve to one canonical owning definition.
- Provider capability is never inferred from another provider.
- Offline messages are signed, versioned, idempotent, and bounded.
- Import/export and Finance handoff preserve manifests, hashes, reconciliation, and classification.
- AI records follow the governed AI schema.

## 11. Development Practice

Everyday commands (Bun + Turborepo):

```bash
bun install                 # workspace install
bun run dev                 # all dev servers (or dev:web / dev:server / dev:native)
bun run check-types         # TypeScript across every workspace
bun run test                # bun:test suites
bun run check               # ultracite (Biome) lint + format check; `bun run fix` applies
bun run db:start            # local PostgreSQL 18 via Docker
bun run db:migrate          # apply committed Drizzle migrations
```

Every change must leave ALL gates green before a PR: `check-types`, `test`, `check`, `python scripts/validate_docs.py`, and `python scripts/generate_registries.py --check`. CI additionally runs the live Docker stack, migration freshness, and API/web health probes — do not merge on a red or skipped gate.

Code conventions:

- TypeScript strict everywhere; every workspace carries a working `check-types` script.
- Core packages stay runtime-neutral per ADR-0020 and `ARCHITECTURE_DEPENDENCY_RULES.md`: no Bun globals, `bun:*` imports, Hono context types, oRPC transport objects, or database adapters in domain, application, contract, or authorization code.
- All external input is validated with zod v4 schemas at the boundary; oRPC procedures declare typed errors.
- Environment access goes only through `@meridian/tooling-env`'s validated schema — never scattered `process.env` reads; secrets have no dev defaults and are never committed.
- Database changes go through Drizzle schema + `db:generate`; committed migrations are never hand-edited (CI enforces migration freshness).
- Tests are colocated `*.test.ts` using `bun:test` and assert real behavior — no placeholder assertions.
- No `console.log` in committed code; use the structured logger. No commented-out code blocks.
- Line endings are LF, enforced by `.gitattributes` — Windows contributors should not fight the formatter.
- New UI follows the governed shadcn bootstrap (§8), preferred-component catalog, and semantic tokens; raw palette values in real components are lint-visible defects.

## 12. Change Process

Before editing:

1. Read governing documents and search the concept repository-wide.
2. Identify owner and authority.
3. Determine ADR or founder-decision needs.
4. Check downstream impact across contracts, UI, security, privacy, offline, operations, testing, Commercial, and first-slice scope.
5. For technology or version claims, invoke `technology-evidence-maintainer`, verify current primary sources, and consult the living technology ledger. Never rely solely on model memory.
6. Claim one issue, branch, worktree, and pull request per independently mergeable change; record overlap and dependencies before parallel work.

After editing:

1. Propagate every affected source.
2. Update machine-readable sources and regenerate outputs.
3. Record assumptions, evidence gaps, and deferrals.
4. Run governance checks.
5. Update dispositions.
6. Do not claim readiness beyond evidence.
7. Update the technology ledger and lessons when a dependency, compatibility assumption, workaround, fallback, or breaking change is discovered.
8. Record documentation and release-note impact for user-visible, API, configuration, migration, permission, workflow, or troubleshooting changes.
