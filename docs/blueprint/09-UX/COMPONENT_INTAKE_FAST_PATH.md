---
document_id: PDA-UX-040
title: Component Intake Fast Path
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
related_adrs: [ADR-0005, ADR-0022]
---

# Component Intake Fast Path

## Why this document exists

Compliant component intake previously required reading roughly five of seven overlapping 09-UX governance documents — `COMPONENT_ACQUISITION_POLICY.md`, `COMPONENT_NORMALIZATION_STANDARD.md`, `COMPONENT_SOURCE_MATRIX.md`, `COMPONENT_ACCEPTANCE_CHECKLIST.md`, `COMPONENT_CATALOG_AND_STATE_MATRIX.md`, `COMPONENT_DISCOVERY_AUDIT.md`, and `PREFERRED_COMPONENT_CATALOG.md` — with manual provenance recording. That friction pushed agents toward hand-building UI the platform's paid subscriptions (shadcn Studio Pro, Mobbin Pro) already cover, or toward skipping provenance entirely.

This document is a router, not a replacement: it is the single entry point that sequences the existing seven documents into one path, and each step below names exactly which document governs it. Physical consolidation of those seven documents is deferred (`docs/project/GOVERNANCE_REMEDIATION_PROGRAM_PLAN.md` Phase 7) — merging them now would cost seven `document_id` lifecycle events and registry churn for no speed gain today.

For automation, use the `component-intake` skill (`.claude/skills/component-intake/`), which walks this exact sequence and generates the provenance record, checklist, and catalog update for you.

## Step 0 — Classify before searching

Read `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` and this repository's `frontend-implementation` skill first (`.claude/skills/frontend-implementation/`) for the token and hard-rule baseline every component must meet regardless of source. Then identify which family in `PREFERRED_COMPONENT_CATALOG.md`'s "Preferred Shared Components" tables the need belongs to, and check its current `Catalog Statuses` — a `Custom Required` or `Restricted` family stops here; do not search further sources for it.

## Step 1 — Acquisition order

Search in this order and record which step actually supplied the component:

1. **Platform-owned source first.** Search `PREFERRED_COMPONENT_CATALOG.md`'s existing entries and the owned UI packages under `packages/`. A `Platform Approved` or `Prototype Approved` entry is the default; use it before searching anywhere external.
2. **shadcn Studio Pro via its MCP server.** An owned subscription — search it before hand-building any block, page, or composite. Use `get-blocks-metadata` to find the category, `get-block-meta-content` to compare variants, then fetch real source content via the MCP's content-fetch tools (not the CLI `add` command — see the note below) before writing anything by hand.
3. **Mobbin Pro for pattern research.** Use it to research interaction patterns on genuinely novel surfaces; it is a research reference, not an installable source — never copy Mobbin screenshots or markup directly into the repository.
4. **Hand-build, as the last resort**, following `COMPONENT_ACQUISITION_POLICY.md` and `docs/blueprint/00-Foundation/UX_PHILOSOPHY.md`.

`COMPONENT_SOURCE_MATRIX.md` records the full counted inventory of what each source currently offers; consult it before concluding a family has no suitable candidate.

### The Studio CLI, the Studio MCP, and credential handling

Studio Pro supports three installation methods per its own documentation: the `shadcn` CLI `add` command against Studio's registries, the MCP server (`get-blocks-metadata`, `get-block-meta-content`, `get-inspiration-block-content`, and the create/inspire/refine/figma-to-code instruction tools), and manual download. Both `apps/web/components.json` and `packages/ui-web/core/components.json` declare the `@ss-components`, `@ss-themes`, and `@ss-blocks` registries Studio's CLI expects, using `${EMAIL}` and `${LICENSE_KEY}` environment-variable interpolation — never a literal credential. This is safe to commit precisely because it contains no secret material, only variable *names*.

**An agent must never write the actual email or license key into any file, tracked or untracked, gitignored or not** — CLAUDE.md/AGENTS.md §8's prohibition on entering credentials applies regardless of git-tracking status. The human operator creates their own `.env` (already covered by this repository's `.env`/`.env*` `.gitignore` entries) with the real `EMAIL` and `LICENSE_KEY` values; an agent only ever references the placeholder names.

In practice, this means the MCP content-fetch route remains the agent's actual working method day to day — `get-block-meta-content` and `get-inspiration-block-content` return real source content directly, without the CLI's authenticated network round-trip, and that is exactly how the `MetricEmptyState` proof below was built. The CLI route becomes available once the operator's own `.env` is in place, and is the right choice for a genuinely new registry entry (`@ss-components`/`@ss-themes` items) the MCP tools don't expose an equivalent fetch path for.

The `/cui`, `/iui`, `/rui`, and `/ftc` slash commands (`.claude/commands/`) route directly to Studio's own instruction tools and are safe to use as-is; each carries a short addendum pointing back to this document and the `component-intake` skill so the governed acquisition order and post-generation verification still apply on top of Studio's own generation instructions. Per Studio's own guidance: generate one block per command rather than a whole page in one shot, and always run the platform's own gates (`bun run check-types`, `bun run check`, `python scripts/validate_ui_governance.py`) after Studio's own recommended lint-fix pass, since Studio's linting guidance targets its own conventions, not this repository's.

## Step 2 — Normalize (six steps)

Every acquired component passes through all six before any catalog promotion above `Preferred Candidate`:

1. **Semantic tokens.** Remove every raw hex literal and Tailwind palette utility class; replace with the governed token set. Authority: `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`, `DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`. Verify with `python scripts/validate_ui_governance.py`.
2. **Canonical states.** Cover loading, empty, stale, offline, pending, error, and success — not just the happy path shown in the source. Authority: `COMPONENT_NORMALIZATION_STANDARD.md`, `COMPONENT_CATALOG_AND_STATE_MATRIX.md`.
3. **Accessibility.** Keyboard, focus, semantics, contrast, touch targets, and zoom per WCAG 2.2 AA. Authority: `FIRST_SLICE_UX_AND_ACCESSIBILITY.md`; invoke the `accessibility-review` skill for formal review.
4. **Responsive and density.** Compact, comfortable, and touch variants across breakpoints. Authority: `DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`.
5. **Offline and degraded behavior.** Explicit behavior when data is stale, pending, or unavailable — not silent failure. Authority: `COMPONENT_ACCEPTANCE_CHECKLIST.md`.
6. **White label.** No hardcoded tenant-visible brand name, logo, or color; no `Meridian`/`@meridian/*` codename leakage into rendered surfaces (ADR-0026). Authority: `COMPONENT_ACQUISITION_POLICY.md`, CLAUDE.md §6.

Invoke the `ui-pattern-audit` skill for pattern-selection review once normalization is otherwise complete.

## Step 3 — Provenance

Write a record to `evidence/ui-provenance/<component-name>.json` conforming to `registry/premium-ui-provenance-template.json`'s field set. `license_owner`, `permitted_entity`, and `permitted_products` must stay `null` — sensitive commercial and licensing detail belongs in a private inventory per `COMPONENT_ACQUISITION_POLICY.md`, never in this public repository. `scripts/validate_ui_governance.py` enforces both the field-set conformance and the null requirement.

## Step 4 — Catalog and acceptance

Add or update the component's entry in `PREFERRED_COMPONENT_CATALOG.md` using its `Catalog Entry Template`, citing the provenance record. A component earns `Prototype Approved` once it is normalized and landed with provenance; it earns `Platform Approved` only once accessibility, responsive, and test evidence are also complete — `scripts/validate_ui_governance.py` requires exactly that evidence for any entry whose `Status` cites `Platform Approved`. Consult `COMPONENT_ACCEPTANCE_CHECKLIST.md` for the full promotion gate.

## Step 5 — Verify

Run `bun run gates` (or at minimum `python scripts/validate_ui_governance.py`, `bun run check-types`, `bun run test`, `bun run check`) before opening a pull request. Record the intake in the PR body's UI/UX changes checklist.

## Worked example

`packages/ui-web/core/src/components/metric-empty-state.tsx` (`MetricEmptyState`, catalog entry under "Prototype Approved" in `PREFERRED_COMPONENT_CATALOG.md`, provenance at `evidence/ui-provenance/metric-empty-state.json`) is a real component landed through this exact path: Studio Pro's `empty-state-01` fetched via the MCP content-fetch route, normalized (parameterized props, owned `Card` import, token-only styling confirmed by the validator), provenance recorded, and cataloged — with accessibility, responsive, and test evidence explicitly left as open work before it can advance to `Platform Approved`. Its `evidence/ui-provenance/metric-empty-state.json` record and catalog entry are worth reading side by side as a template for the next intake.
