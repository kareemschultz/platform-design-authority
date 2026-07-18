---
document_id: PDA-STR-031
title: Third-Party Notices, SBOM, and Asset Provenance Baseline
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
---

# Third-Party Notices, SBOM, and Asset Provenance Baseline

Governing issue: [#93](https://github.com/kareemschultz/platform-design-authority/issues/93), opened from PDA-REV-019. This document is a baseline inventory and process, not a legal clearance. Qualified legal review remains required before external binary/container/native distribution, source/documentation licensing ratification, external contribution intake, or public package/app publication (per FDR-002/FDR-005/FDR-009/FDR-011 and `INTELLECTUAL_PROPERTY_LICENSING_AND_REPOSITORY_POLICY.md`).

## 1. Reproducible SBOM

`scripts/generate_sbom.py` walks the installed workspace's `node_modules/.bun/*/node_modules/**/package.json` tree (Bun's hoisted-store layout, not a symlink guess) and writes:

- `evidence/licensing/sbom.json` — full package/version/license/repository inventory
- `evidence/licensing/license-summary.json` — counts by license identifier and a `needs_manual_review` list

**Regenerate with:** `bun install --frozen-lockfile && python scripts/generate_sbom.py`
**Verify freshness with:** `python scripts/generate_sbom.py --check` (CI-safe; exits 1 without writing if evidence is stale)

**Known limitation (disclosed, not hidden):** this is a single workspace-root SBOM. Bun workspaces hoist dependencies into one shared install tree, so the script does not yet isolate which packages are reachable from each individual distributable (`apps/web`, `apps/server`, `apps/worker`, `apps/native`, `apps/docs`). A package used only by `apps/native`'s devDependencies currently appears in the same inventory as a package `apps/server` ships to production. Per-distributable filtering (via each app's own transitive dependency closure) is tracked as follow-up scope within issue #93, not claimed as done here.

### Current baseline (2026-07-18, 1,255 third-party packages, `@meridian/*` workspace packages excluded)

| License | Count |
|---|---:|
| MIT | 1,106 |
| Apache-2.0 | 42 |
| ISC | 41 |
| BSD-3-Clause | 18 |
| BSD-2-Clause | 16 |
| BlueOak-1.0.0 | 7 |
| MIT OR Apache-2.0 (choice) | 4 |
| MPL-2.0 | 4 |
| 0BSD | 3 |
| MIT OR CC0-1.0 (choice) | 3 |
| MISSING | 2 |
| Unlicense | 2 |
| CC-BY-4.0 | 1 |
| BSD-3-Clause OR GPL-2.0 (choice) | 1 |

Full detail: `evidence/licensing/sbom.json` / `evidence/licensing/license-summary.json`.

## 2. Packages needing manual disposition (14 total)

Recorded in `license-summary.json.needs_manual_review`. Grouped by class — **dispositions below are provenance/risk-recording, not legal conclusions**:

- **Combined/choice expressions (11 packages)** — `@biomejs/biome` + `@biomejs/cli-win32-x64` (`MIT OR Apache-2.0`), `fb-dotslash` (`MIT OR Apache-2.0`), `type-fest` ×3 (`MIT OR CC0-1.0`), `@expo-google-fonts/material-symbols` (`MIT AND Apache-2.0`), `node-forge` (`BSD-3-Clause OR GPL-2.0`). All resolvable by electing the permissive branch of the stated choice (MIT/Apache-2.0/CC0/BSD in every case); no action required beyond recording the elected branch if a formal notice file is produced (§3).
- **Copyleft component requiring explicit disposition (1 package)** — `@img/sharp-win32-x64@0.34.5`: `Apache-2.0 AND LGPL-3.0-or-later`. `sharp`'s native binary bundles `libvips`, which is LGPL-3.0-or-later. LGPL obligations (dynamic linking / relink capability, notice) apply to how the compiled binary is distributed, not to this repository's own source. **Open question for qualified legal review:** whether any WS3+ distributable ships this native binary to an end device in a way that triggers LGPL relink/notice obligations, and if so what satisfies them (this is exactly the kind of question `INTELLECTUAL_PROPERTY_LICENSING_AND_REPOSITORY_POLICY.md` reserves for qualified review, not agent inference).
- **Missing license metadata (2 packages)** — `@yuku-codegen/binding-win32-x64@0.6.1`, `@yuku-parser/binding-win32-x64@0.6.1`: no `license` field in their published `package.json`. Both are native-binding packages pulled in transitively; upstream repository/registry page should be checked for a LICENSE file the package.json omitted, before any redistribution decision.
- **Unrecognized identifier (1 package)** — `spawndamnit@3.0.1`: `license: "SEE LICENSE IN LICENSE"` — a valid but non-machine-checkable pointer to a bundled `LICENSE` file; requires a human to open that file once (transitive dev-tooling dependency of `@changesets/cli`, not shipped to any distributable).

None of these 14 are currently known to block controlled-prototype work; they are recorded so a future distribution/licensing decision has a complete, dated starting inventory rather than a silent gap.

## 3. Copied and adapted source — notice mapping

Per `CLAUDE.md` §8: "shadcn/ui components are copied and normalized into platform-owned source." This repository's shadcn-derived components:

| Path | Source | License | Modification | Notice disposition |
|---|---|---|---|---|
| `packages/ui-web/core/src/components/*.tsx` (14 files: alert, badge, button, card, checkbox, dialog, dropdown-menu, input, label, separator, sheet, skeleton, sonner, table) | shadcn/ui component registry (ui.shadcn.com), MIT-licensed, generated via `apps/web/components.json` / `packages/ui-web/core/components.json` shadcn CLI config | MIT | Normalized into platform semantic tokens per `docs/blueprint/09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md`; copied-and-owned per repository policy, not consumed as an npm dependency | Recommend a repository `NOTICE` entry crediting shadcn/ui (ui.shadcn.com) as the upstream origin of these component patterns, alongside the MIT license text. shadcn/ui's own distribution model treats copied component code as becoming part of the consuming project's own source (this is the documented rationale for shadcn/ui not being an installable library) — whether a per-file or NOTICE-level attribution is legally sufficient is a call for qualified review, not asserted here. |

No other copied/vendored UI source (Magic UI Pro, shadcn/studio premium assets) is present in the tracked tree as of this baseline — `docs/blueprint/09-UX/PREFERRED_COMPONENT_CATALOG.md`'s premium-source policy governs if/when any is introduced; this document does not pre-clear that path.

## 4. Native and web asset provenance

| Path | Source | License/provenance | Disposition |
|---|---|---|---|
| `apps/native/assets/images/icon.png`, `android-icon-{foreground,background,monochrome}.png`, `favicon.png`, `splash-icon.png` | Introduced in commit `75e793f` ("prototype: import Meridian scaffold — Better-T-Stack baseline"); filenames match the Expo `create-expo-app`/`expo-router` default template exactly | Expo scaffold placeholder artwork (Expo project default template assets) | **Retained as functional placeholders, not final product branding.** Referenced live in `apps/native/app.json` (icon/splash/favicon/adaptive-icon config), so removal would break the build — replace with owned brand artwork as part of a future branding decision (tracked separately; not this issue's scope), not deleted here. |
| `apps/native/assets/images/react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`, `partial-react-logo.png` | Same scaffold-import commit `75e793f` | Expo/React Native default template demo imagery | **Removed in this change** — confirmed zero references anywhere in tracked source (`app.json`, `*.ts`, `*.tsx`, `*.md`) via repository-wide search before deletion; these were unused example-screen assets, not distributed product assets. |
| `apps/web/public/favicon/*` (apple-touch-icon.png, favicon-96x96.png, favicon.svg, web-app-manifest-192x192.png, web-app-manifest-512x512.png) | Not yet traced to a specific generator/tool in this baseline pass | Unknown — needs provenance confirmation | **Open item.** Before external distribution, confirm whether these were generated by a favicon-generation tool (which may itself carry attribution terms) or hand-authored, and record the answer here. Not a blocker for controlled-prototype work; flagged so it isn't silently forgotten. |

## 5. Restricted evidence pointer

Any completed premium-entitlement invoice, private-source license grant, or paid-asset purchase evidence belongs in the restricted evidence store selected under issue #94 (the same store issue #82's evidence-collection instrument routes raw customer evidence to). None exists in this repository as of this baseline — no premium UI assets are currently tracked.

## 6. Non-goals

This document does not resolve LGPL/GPL distribution questions, does not confirm whether shadcn/ui attribution is legally sufficient, does not clear any package for external distribution, and does not extend the SBOM to per-distributable granularity. Those remain open follow-ups within issue #93 or its qualified-review dependency.
