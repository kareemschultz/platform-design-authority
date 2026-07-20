---
name: component-intake
description: Automate bringing one external UI component, block, or pattern into this repository — search, fetch, normalize, provenance, catalog, and verify. Use whenever the user wants to add, import, install, or land a specific shadcn Studio Pro block/component, a Mobbin-researched pattern, or any other external UI source into the codebase. Distinct from frontend-implementation (broad "how do I build this UI feature" guidance) and frontend-architecture (pre-implementation planning) — this skill is the narrow, mechanical procedure for one external-to-owned component intake.
---

# Component Intake Skill

This skill automates `docs/blueprint/09-UX/COMPONENT_INTAKE_FAST_PATH.md`'s six-step path for one component at a time. Read that document for the full authority chain; this skill is the checklist that walks it.

## When to use this vs. a sibling skill

- **This skill**: "bring block X into the repo", "add the Studio pricing section", "install the Mobbin-inspired empty state".
- **`frontend-architecture`**: planning a whole page or feature before any component decision is made.
- **`frontend-implementation`**: the general build-time rules (tokens, states, accessibility) that apply whether or not this skill was used.

## Procedure

### 1. Classify

Check `docs/blueprint/09-UX/PREFERRED_COMPONENT_CATALOG.md` for the family this need belongs to and its current `Catalog Statuses`. `Custom Required` or `Restricted` stops here — do not proceed to search.

### 2. Search, in order

1. **Platform-owned first.** Search the catalog's existing entries and `packages/ui-web/core/src/components/` (or the equivalent native package). If found, use it; stop here.
2. **shadcn Studio Pro via MCP.** Call `get-blocks-metadata` to find the category, then `get-block-meta-content` with that category's `path` to compare specific variants by name, description, tags, and use case. Select the closest match; if the user named a specific variant, honor that over your own judgment.
3. **Fetch real source.** Prefer the MCP's own content-fetch tools (`get-inspiration-block-content` for the selected variant's path, or the create-UI collection flow's install command if the operator's own `.env` with real Studio credentials is already configured in this environment — see the fast-path document's credential-handling note). Never fetch, request, guess, or write an actual license key, API key, or account email into any file yourself, regardless of git-tracking status.
4. **Mobbin Pro for pattern research** on genuinely novel interactions the catalog has no direction for — a research reference, never a copy-paste source.
5. **Hand-build** only once 1–4 are exhausted.

### 3. Normalize

Apply all six steps from the fast-path document: semantic tokens, canonical states, accessibility, responsive/density, offline/degraded behavior, white label. Place the normalized file under the platform's owned package (matching its existing import-alias convention — e.g. `@meridian/ui-web/components/<name>` for files inside `packages/ui-web/core/src/components/`), never under a vendor-branded path like `components/shadcn-studio/`.

Run `bun run check-types` and `bun run check` (or `bun run fix` for auto-fixable issues) before moving on — a component that doesn't pass the platform's own lint conventions isn't normalized yet, regardless of what Studio's own instructions say about its formatting.

### 4. Write the provenance record

Create `evidence/ui-provenance/<component-name>.json`, matching `registry/premium-ui-provenance-template.json`'s exact field set under a `{"record": {...}}` wrapper. Fill in what's genuinely known:

- `id`: `ui-source.<source>.<item>` (e.g. `ui-source.shadcn-studio.empty-state-01`)
- `source_product`, `source_item`, `source_version`, `retrieved_at`: factual, from the MCP metadata
- `license_owner`, `permitted_entity`, `permitted_products`: **always `null`** — never populate these in this public repository
- `repository_paths`, `platform_component_name`: where it landed
- `modifications`: an honest list of every change from the source (renames, prop parameterization, import-path changes, dropped route wrappers)
- `dependencies_added`, `external_network_calls_removed`, `token_normalization`: factual
- The review fields (`accessibility_review`, `responsive_review`, `reduced_motion_review`, `performance_review`, `security_review`, `dark_mode_review`, `white_label_review`, `visual_regression_story`, `reviewed_by`, `reviewed_at`): `null` unless that review has genuinely happened — do not mark a review complete because the component looks fine to you.

### 5. Catalog entry

Add or update the entry in `PREFERRED_COMPONENT_CATALOG.md` using its `Catalog Entry Template`, under a `### Prototype Approved` heading (create one if this is the first such entry) if steps 1–4 are complete but full acceptance evidence (accessibility, responsive, test, Storybook) is not yet done, or `Platform Approved` only once that evidence genuinely exists. Cite the provenance record path in the entry's `License/provenance record` field.

### 6. Verify

Run, in order:

```bash
python scripts/validate_ui_governance.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
bun run check-types
bun run test
bun run check
```

All must pass before opening a pull request. Record the intake in the PR body's UI/UX changes checklist (provenance recorded, no raw palette values; `ui-pattern-audit`/`accessibility-review` runs if the component is novel enough to warrant them).

## Worked example

`packages/ui-web/core/src/components/metric-empty-state.tsx` was landed through this exact procedure: Studio Pro's `empty-state-01` (Dashboard and Application category), fetched via `get-inspiration-block-content`, normalized (parameterized props, owned `Card` import, dropped the source's route wrapper), recorded at `evidence/ui-provenance/metric-empty-state.json`, cataloged as `Prototype Approved` in `PREFERRED_COMPONENT_CATALOG.md`. Read those three artifacts together as a template.
