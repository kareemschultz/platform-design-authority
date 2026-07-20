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

`apps/web` and `packages/ui-web/core` each carry their own `components.json`; each needs its own `.env` alongside it (copy, don't move, if you need the CLI to work from both — the two directories are independent invocation contexts as far as the CLI's own env loading is concerned). The MCP server, by contrast, is registered at the operator-account level (`claude mcp add --scope user`) and works in every worktree, checkout, and future session on the operator's machine with zero per-repository setup — only the CLI's authenticated registry route depends on a local `.env`. Because `.env` is gitignored by design, it never propagates via git: a freshly created worktree starts without one, and an agent needing the CLI route there self-serves with a plain `cp` of an existing `.env` into the new worktree's `apps/web/` and `packages/ui-web/core/` — a sealed-envelope file operation in which the agent never reads or types the credential values.

### The four Studio workflows, and using each to its fullest

Studio's MCP ships four instruction-driven workflows. Map the task to the right one instead of defaulting to hand-editing:

| Workflow | Command | Use when | Key MCP tools |
|---|---|---|---|
| Create UI | `/cui` | Landing a new block/section/page based on an existing Studio block, customized to platform content | `get-create-instructions`, `get-blocks-metadata`, `get-block-meta-content`, `collect_selected_blocks`, `get_add_command_for_items` |
| Inspire UI | `/iui` (Pro) | A genuinely novel surface where no single Studio block fits — synthesize a fresh design from Studio patterns | `get-inspire-instructions`, `get-blocks-metadata`, `get-inspiration-block-content` |
| Refine UI | `/rui` | **Fixing visual defects, enhancing an existing surface, or migrating an off-system treatment onto the design system** — swap a weak component for a stronger Studio variant, update a button/dialog/table treatment | `get-refine-instructions`, `get-component-meta-content`, `get-component-content`, `collect_selected_components`, `get_add_command_for_components` |
| Figma to Code | `/ftc` | Installing the exact Pro/Free blocks composed in a Figma design (requires the Figma MCP; keep original block frame names) | `get-ftc-instructions`, `parse-figma-blocks`, `collect_selected_blocks`, `get_add_command_for_items` |

One implementation detail from Studio's own documentation worth knowing before landing image-bearing blocks: Studio's generated content uses Unsplash image URLs (and `/ftc` serves Figma-exported images from the local Figma MCP on `localhost:3845`), so Next.js `images.remotePatterns` must allow those hosts or the block renders with broken images. Treat any such `next.config` change as part of the intake diff — reviewed, minimal (exact hostnames, never a wildcard), and removed again if the normalized component replaces stock imagery with platform-owned assets, which is the usual end state.

The refine workflow deserves emphasis because it is the one agents historically underuse: when existing UI does not line up with the design system — raw palette values, missing canonical states, a hand-rolled primitive duplicating a catalog-preferred component, inconsistent treatments of the same pattern across surfaces — the repair loop is *diagnose against the governed baseline* (`python scripts/validate_ui_governance.py`, the canonical-state list, `PREFERRED_COMPONENT_CATALOG.md`) → *search Studio's variant catalog for a stronger replacement* (`get-component-meta-content`) → *normalize and record provenance exactly as for new intake* → *fix the defect class repo-wide, not the single instance*. The `frontend-implementation` skill's Step 5 carries the full procedure. Two boundaries hold regardless of workflow: theme/preset changes (`@ss-themes`, `/rui`'s theme-install capability, base color/font/radius/density) are governed by `SHADCN_CONFIGURATION_DECISION_MATRIX.md` and are never a casual per-surface refinement, and per Studio's own guidance, refined or generated output still gets this repository's gates after Studio's own lint-fix pass — Studio's conventions are not this repository's conventions.

**Known constraint, confirmed 2026-07-20: the CLI `add` command can write a file outside the intended repository entirely when run from inside a git worktree.** Landing a `ui`-aliased single-file component (e.g. `button`, `badge` — anything resolved through the `ui` alias rather than the `components` alias) from a worktree nested under `.claude/worktrees/<name>/` produced a stray file at the *primary checkout's root*, not inside the worktree, twice in direct succession with two different components. The workspace symlink resolution itself is correct (`node_modules/@meridian/ui-web` correctly points inside the worktree); the CLI appears to compute the write target using a relative-path assumption that does not account for the extra `.claude/worktrees/<name>/` nesting a worktree adds versus a normal checkout. This is a third-party tool behavior, not something this repository's configuration can fix directly. Mitigation until Studio ships a fix or a root cause is confirmed upstream:

- Prefer the MCP content-fetch route (`get-block-meta-content`, `get-inspiration-block-content`) over the CLI `add` command when working from a git worktree — the agent places the fetched content itself, so there is no third-party write-target computation to escape.
- If the CLI route is used from a worktree anyway, check `git status` at the *primary checkout's root* immediately afterward, not only inside the worktree, and remove anything unexpected found there before it is mistaken for real work.
- The CLI route is safe to use without this check when run from the primary checkout directly (not a worktree).

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
