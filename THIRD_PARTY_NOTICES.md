# Third-Party Notices — Controlled-Prototype Baseline

> This generated inventory does not license repository-maintained material, establish
> legal approval, or authorize source, package, app, binary, native, or container
> distribution. License conclusions remain `NOASSERTION`. This is a declared
> manifest/lock baseline, not a post-build or artifact notice bundle.

## Copied source and retained assets

### Better-T-Stack PWA scaffold (asset.better-t-stack.prototype-favicons)

- Source/version: https://github.com/AmanVarshney01/create-better-t-stack/tree/e1bf536f3ba1804a944735efab3941a21f6ba815 — 3.36.3 / exact asset provenance unresolved
- Upstream-declared license: `NOASSERTION`
- Public license evidence: not established for exact assets
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `not-established-for-exact-assets`
- Distribution status: `replace-before-distribution`
- Modifications: Retained because no explicit reference is not sufficient proof of non-use by browser metadata conventions; replace with owned assets before distribution.
- Covered paths:

  - `apps/web/public/favicon/apple-touch-icon.png`
  - `apps/web/public/favicon/favicon-96x96.png`
  - `apps/web/public/favicon/favicon.svg`
  - `apps/web/public/favicon/web-app-manifest-192x192.png`
  - `apps/web/public/favicon/web-app-manifest-512x512.png`
  - `apps/web/src/app/favicon.ico`

### Expo template through Better-T-Stack (asset.expo-template.prototype-icons)

- Source/version: https://github.com/expo/expo — Better-T-Stack 3.36.3 / Expo SDK 57 scaffold
- Upstream-declared license: `NOASSERTION`
- Public license evidence: not established for exact assets
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `not-established-for-exact-assets`
- Distribution status: `replace-before-distribution`
- Modifications: Retained only for local controlled-prototype operation; exact asset rights and trademark disposition have not been established.
- Covered paths:

  - `apps/native/assets/images/android-icon-background.png`
  - `apps/native/assets/images/android-icon-foreground.png`
  - `apps/native/assets/images/android-icon-monochrome.png`
  - `apps/native/assets/images/favicon.png`
  - `apps/native/assets/images/icon.png`
  - `apps/native/assets/images/splash-icon.png`

### Better-T-Stack (source.better-t-stack.ui.3.36.3)

- Source/version: https://github.com/AmanVarshney01/create-better-t-stack/tree/e1bf536f3ba1804a944735efab3941a21f6ba815 — 3.36.3 / commit e1bf536f3ba1804a944735efab3941a21f6ba815
- Upstream-declared license: `MIT`
- Public license evidence: https://github.com/AmanVarshney01/create-better-t-stack/blob/e1bf536f3ba1804a944735efab3941a21f6ba815/LICENSE
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `public-upstream-license-observed-not-legally-reviewed`
- Distribution status: `legal-review-required`
- Modifications: Scaffold-generated components were normalized into repository-maintained TypeScript source paths and subsequently modified for the governed UI system. card.tsx: root radius changed from rounded-none to rounded-2xl (2026-07-22) to align with Button/Badge/Alert's shared --radius-2xl token per docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md's radius/elevation family guidance; CardHeader/CardFooter's internal rounded-none (corner-clipping under the root's overflow-hidden) is unchanged. button.tsx: default size changed from h-8 (32px) to h-10 (40px) and lg size from h-9 (36px) to h-11 (44px) to preserve a distinct step above the new default (2026-07-22), meeting the registered 40x40 CSS px preferred product touch target in docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md; icon and icon-lg (the plain icon-button sizes that pair with default/lg) changed from size-8/size-9 to size-10/size-11 to match, since both existing call sites were already manually overriding icon to size-10 to work around the same gap; icon-sm/icon-xs (intentionally sub-40px compact/dense options, paired with sm/xs) are unchanged. card.tsx and dropdown-menu.tsx: ring color changed from ring-foreground/10 (card.tsx) and ring-foreground/5 with dark:ring-foreground/10 (dropdown-menu.tsx) to the single ring-(--border-strong) (2026-07-23, issue #204/#225) -- accessibility-review found the previous foreground-alpha rings measured well below the 3:1 non-text-contrast minimum in light mode; --border-strong is a corrected registry token verified at 4.76:1 against a white card/popover fill in light mode and 3.76:1/4.16:1 against the dark card fill/page background (see globals.css for the full contrast derivation).
- Covered paths:

  - `packages/ui-web/core/src/components/button.tsx`
  - `packages/ui-web/core/src/components/card.tsx`
  - `packages/ui-web/core/src/components/checkbox.tsx`
  - `packages/ui-web/core/src/components/dropdown-menu.tsx`
  - `packages/ui-web/core/src/components/input.tsx`
  - `packages/ui-web/core/src/components/label.tsx`
  - `packages/ui-web/core/src/components/skeleton.tsx`
  - `packages/ui-web/core/src/components/sonner.tsx`

### shadcn/studio Pro (source.shadcn-studio.empty-state-01)

- Source/version: https://shadcnstudio.com — Studio catalog entry dated 2026-03-13, retrieved 2026-07-20 via MCP get-inspiration-block-content
- Upstream-declared license: `NOASSERTION`
- Public license evidence: not established for exact assets
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `not-established-for-exact-assets`
- Distribution status: `legal-review-required`
- Modifications: Studio Pro block empty-state-01 was normalized into a reusable platform component: renamed to MetricEmptyState, hardcoded content parameterized as props, Card import switched to the platform-owned package, and the source's route wrapper dropped. Full change list in the referenced UI provenance record.
- Covered paths:

  - `packages/ui-web/core/src/components/metric-empty-state.tsx`

### shadcn/studio Pro (source.shadcn-studio.statistics-card-03)

- Source/version: https://shadcnstudio.com — Studio inspiration-block catalog entry, retrieved 2026-07-21 via MCP get-inspiration-block-content
- Upstream-declared license: `NOASSERTION`
- Public license evidence: not established for exact assets
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `not-established-for-exact-assets`
- Distribution status: `legal-review-required`
- Modifications: Studio Pro statistics-component variant statistics-card-03 was normalized into a reusable platform component: renamed to MetricCard, trend (arrow direction) split from tone (positive/negative/neutral interpretation, rendered as visible text, not color alone), unowned Avatar primitive replaced with a styled span, loading/error/stale canonical states added via one persistent aria-live announcement region, Card and Badge imports switched to the platform-owned package with a newly added owned Skeleton import for the new loading state, and the source's route wrapper and demo data dropped. Full change list in the referenced UI provenance record.
- Covered paths:

  - `packages/ui-web/core/src/components/metric-card.tsx`

### shadcn/ui CLI (source.shadcn.ui.4.13.0)

- Source/version: https://github.com/shadcn-ui/ui/tree/d0fae528221011f75a8c64a917073904c2847493 — 4.13.0 / commit d0fae528221011f75a8c64a917073904c2847493
- Upstream-declared license: `MIT`
- Public license evidence: https://github.com/shadcn-ui/ui/blob/d0fae528221011f75a8c64a917073904c2847493/LICENSE.md
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `public-upstream-license-observed-not-legally-reviewed`
- Distribution status: `legal-review-required`
- Modifications: CLI-generated components were copied into repository-maintained source paths and normalized for Base UI and the governed design system. alert.tsx and badge.tsx: added info/success/warning/pending/offline variants (2026-07-22) consuming the platform's already-registered --status-info/success/warning/pending/offline CSS custom properties in globals.css, alongside the existing default/destructive (Alert) and default/destructive/secondary/outline/ghost/link (Badge) variants, per docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md's 6 registered status roles. accessibility-review found --status-warning fails 4.5:1 AA as colored text once tinted or blended (verified: 4.09:1 on Alert's description at /90 opacity, 4.32:1 on Badge's 10%-tinted background) -- at the time, this was a token-level gap (no paired warning-foreground role) out of this change's scope to retune, since --status-warning is governed by PDA-UX-023 and required cross-surface review this change could not perform. Fixed within scope: dropped the /90 opacity multiplier on all 5 new Alert variants' description text (info/success/pending/offline now render comfortably above 4.5:1; only warning still failed after this), and gave warning alone a border+icon-only colored treatment (neutral text) on both Alert and Badge, since border/icon need only 3:1 non-text contrast (passes at 4.92:1) while text does not. That token-level gap was resolved 2026-07-23 (issue #209): a paired --status-warning-foreground role was added to registry/design-tokens.json and globals.css for consumers that need colored warning text (see metric-card.json); alert.tsx/badge.tsx's own warning variant intentionally keeps its neutral-text treatment, since it already shipped verified-accessible and doesn't need the new role. dialog.tsx: ring color changed from --border-strong to --border-strong-overlay (2026-07-23, issue #226 review) -- --border-strong's ring sits directly on the dialog-overlay scrim rather than a solid surface fill, and measures only ~2.25:1 against that scrim composited over this platform's light-theme page background, below the 3:1 non-text-contrast minimum; --border-strong-overlay is the darker value verified against that specific composited scrim (see docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md).
- Covered paths:

  - `packages/ui-web/core/src/components/alert.tsx`
  - `packages/ui-web/core/src/components/badge.tsx`
  - `packages/ui-web/core/src/components/dialog.tsx`
  - `packages/ui-web/core/src/components/separator.tsx`
  - `packages/ui-web/core/src/components/sheet.tsx`
  - `packages/ui-web/core/src/components/table.tsx`

### shadcn/ui CLI (source.shadcn.ui.4.14.0)

- Source/version: https://github.com/shadcn-ui/ui — 4.14.0 (npm; no gitHead metadata published for this release, commit reference unavailable)
- Upstream-declared license: `MIT`
- Public license evidence: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
- Repository license conclusion: `NOASSERTION`
- Permitted-use evidence: `public-upstream-license-observed-not-legally-reviewed`
- Distribution status: `legal-review-required`
- Modifications: CLI-generated component was copied into repository-maintained source path and normalized: trigger height changed from h-8/h-7 to h-10/h-9 to match the platform's 40px comfortable-density target and the owned Input primitive's sizing; trigger border/background changed from border-transparent+bg-input/50 to border-input+bg-transparent to match Input's bordered treatment; trigger and popup radius changed from rounded-2xl to rounded-xl/rounded-none respectively, matching Input and the platform's established DropdownMenu floating-listbox convention; formatted via the platform's own ultracite/Biome formatter (tabs, sorted props). SelectItem's className added data-highlighted:bg-accent/text-accent-foreground (2026-07-23, Codex review finding) -- the original CLI output only styled :focus, leaving keyboard/hover navigation via Base UI's separate highlighted state (present without DOM focus, e.g. hover) with no visible active-row indicator. Popup ring color changed from ring-foreground/5 with dark:ring-foreground/10 to the single ring-(--border-strong) (2026-07-23, issue #204/#225), for the same accessibility-review contrast reason recorded on card.tsx/dropdown-menu.tsx above.
- Covered paths:

  - `packages/ui-web/core/src/components/select.tsx`

## License-review observations

- `@axe-core/playwright@4.12.1` — observed `MPL-2.0`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `@biomejs/biome@2.5.2` — observed `MIT OR Apache-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `@biomejs/biome@2.5.3` — observed `MIT OR Apache-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `@biomejs/cli-win32-x64@2.5.2` — observed `MIT OR Apache-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `@biomejs/cli-win32-x64@2.5.3` — observed `MIT OR Apache-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `@expo-google-fonts/material-symbols@0.4.38` — observed `MIT AND Apache-2.0`; kind `and-conjunctive`; conclusion `NOASSERTION`; qualified review required.
- `@img/sharp-win32-x64@0.35.3` — observed `Apache-2.0 AND LGPL-3.0-or-later`; kind `and-conjunctive`; conclusion `NOASSERTION`; qualified review required.
- `@yuku-codegen/binding-win32-x64@0.6.1` — observed `missing package metadata`; kind `metadata-missing`; conclusion `NOASSERTION`; qualified review required.
- `@yuku-parser/binding-win32-x64@0.6.1` — observed `missing package metadata`; kind `metadata-missing`; conclusion `NOASSERTION`; qualified review required.
- `axe-core@4.12.1` — observed `MPL-2.0`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `big-integer@1.6.52` — observed `Unlicense`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `caniuse-lite@1.0.30001805` — observed `CC-BY-4.0`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `fb-dotslash@0.5.8` — observed `MIT OR Apache-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `lightningcss@1.32.0` — observed `MPL-2.0`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `lightningcss-win32-x64-msvc@1.32.0` — observed `MPL-2.0`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `node-forge@1.4.0` — observed `BSD-3-Clause OR GPL-2.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `spawndamnit@3.0.1` — observed `SEE LICENSE IN LICENSE`; kind `license-file-pointer`; conclusion `NOASSERTION`; qualified review required.
- `stream-buffers@2.2.0` — observed `Unlicense`; kind `obligation-review`; conclusion `NOASSERTION`; qualified review required.
- `type-fest@0.21.3` — observed `MIT OR CC0-1.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `type-fest@0.7.1` — observed `MIT OR CC0-1.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.
- `type-fest@5.8.0` — observed `MIT OR CC0-1.0`; kind `or-choice`; conclusion `NOASSERTION`; qualified review required.

## Build-time references outside the lock inventory

- **Geist, Geist Mono, and Inter through next/font/google** — upstream-declared `OFL-1.1`; conclusion `NOASSERTION`; status `artifact-review-required`. Font files are fetched and embedded during build and are not represented by the JavaScript lock inventory. Built output requires separate inspection.

## Locked JavaScript packages

The lock inventory contains 1480 resolution records and 1394 unique package/version pairs. Lock presence is not runtime
reachability or permission to distribute. Every conclusion below is `NOASSERTION`.

| Package | Version | License conclusion |
|---|---:|---|
| `@adobe/css-tools` | `4.5.0` | `NOASSERTION` |
| `@alloc/quick-lru` | `5.2.0` | `NOASSERTION` |
| `@axe-core/playwright` | `4.12.1` | `NOASSERTION` |
| `@babel/code-frame` | `7.29.7` | `NOASSERTION` |
| `@babel/compat-data` | `7.29.7` | `NOASSERTION` |
| `@babel/core` | `7.29.7` | `NOASSERTION` |
| `@babel/generator` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-annotate-as-pure` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-compilation-targets` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-create-class-features-plugin` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-create-regexp-features-plugin` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-define-polyfill-provider` | `0.6.8` | `NOASSERTION` |
| `@babel/helper-globals` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-member-expression-to-functions` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-module-imports` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-module-transforms` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-optimise-call-expression` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-plugin-utils` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-remap-async-to-generator` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-replace-supers` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-skip-transparent-expression-wrappers` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-string-parser` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-validator-identifier` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-validator-option` | `7.29.7` | `NOASSERTION` |
| `@babel/helper-wrap-function` | `7.29.7` | `NOASSERTION` |
| `@babel/helpers` | `7.29.7` | `NOASSERTION` |
| `@babel/parser` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-proposal-decorators` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-proposal-export-default-from` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-syntax-decorators` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-syntax-dynamic-import` | `7.8.3` | `NOASSERTION` |
| `@babel/plugin-syntax-export-default-from` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-syntax-flow` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-syntax-jsx` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-syntax-nullish-coalescing-operator` | `7.8.3` | `NOASSERTION` |
| `@babel/plugin-syntax-optional-chaining` | `7.8.3` | `NOASSERTION` |
| `@babel/plugin-syntax-typescript` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-arrow-functions` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-async-generator-functions` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-async-to-generator` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-block-scoping` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-class-properties` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-class-static-block` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-classes` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-destructuring` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-export-namespace-from` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-flow-strip-types` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-for-of` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-logical-assignment-operators` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-modules-commonjs` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-named-capturing-groups-regex` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-nullish-coalescing-operator` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-object-rest-spread` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-optional-catch-binding` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-optional-chaining` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-parameters` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-private-methods` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-private-property-in-object` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-display-name` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-jsx` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-jsx-development` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-jsx-self` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-jsx-source` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-react-pure-annotations` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-regenerator` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-runtime` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-shorthand-properties` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-template-literals` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-typescript` | `7.29.7` | `NOASSERTION` |
| `@babel/plugin-transform-unicode-regex` | `7.29.7` | `NOASSERTION` |
| `@babel/preset-typescript` | `7.29.7` | `NOASSERTION` |
| `@babel/runtime` | `7.29.7` | `NOASSERTION` |
| `@babel/template` | `7.29.7` | `NOASSERTION` |
| `@babel/traverse` | `7.29.7` | `NOASSERTION` |
| `@babel/types` | `7.29.7` | `NOASSERTION` |
| `@base-ui/react` | `1.6.0` | `NOASSERTION` |
| `@base-ui/utils` | `0.3.1` | `NOASSERTION` |
| `@better-auth/core` | `1.6.23` | `NOASSERTION` |
| `@better-auth/drizzle-adapter` | `1.6.23` | `NOASSERTION` |
| `@better-auth/kysely-adapter` | `1.6.23` | `NOASSERTION` |
| `@better-auth/memory-adapter` | `1.6.23` | `NOASSERTION` |
| `@better-auth/mongo-adapter` | `1.6.23` | `NOASSERTION` |
| `@better-auth/passkey` | `1.6.23` | `NOASSERTION` |
| `@better-auth/prisma-adapter` | `1.6.23` | `NOASSERTION` |
| `@better-auth/telemetry` | `1.6.23` | `NOASSERTION` |
| `@better-auth/utils` | `0.4.2` | `NOASSERTION` |
| `@better-fetch/fetch` | `1.3.1` | `NOASSERTION` |
| `@biomejs/biome` | `2.5.2` | `NOASSERTION` |
| `@biomejs/biome` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-darwin-arm64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-darwin-arm64` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-darwin-x64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-darwin-x64` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-linux-arm64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-linux-arm64` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-linux-arm64-musl` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-linux-arm64-musl` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-linux-x64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-linux-x64` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-linux-x64-musl` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-linux-x64-musl` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-win32-arm64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-win32-arm64` | `2.5.3` | `NOASSERTION` |
| `@biomejs/cli-win32-x64` | `2.5.2` | `NOASSERTION` |
| `@biomejs/cli-win32-x64` | `2.5.3` | `NOASSERTION` |
| `@changesets/apply-release-plan` | `7.1.1` | `NOASSERTION` |
| `@changesets/assemble-release-plan` | `6.0.10` | `NOASSERTION` |
| `@changesets/changelog-git` | `0.2.1` | `NOASSERTION` |
| `@changesets/cli` | `2.31.0` | `NOASSERTION` |
| `@changesets/config` | `3.1.4` | `NOASSERTION` |
| `@changesets/errors` | `0.2.0` | `NOASSERTION` |
| `@changesets/get-dependents-graph` | `2.1.4` | `NOASSERTION` |
| `@changesets/get-release-plan` | `4.0.16` | `NOASSERTION` |
| `@changesets/get-version-range-type` | `0.4.0` | `NOASSERTION` |
| `@changesets/git` | `3.0.4` | `NOASSERTION` |
| `@changesets/logger` | `0.1.1` | `NOASSERTION` |
| `@changesets/parse` | `0.4.3` | `NOASSERTION` |
| `@changesets/pre` | `2.0.2` | `NOASSERTION` |
| `@changesets/read` | `0.6.7` | `NOASSERTION` |
| `@changesets/should-skip-package` | `0.1.2` | `NOASSERTION` |
| `@changesets/types` | `4.1.0` | `NOASSERTION` |
| `@changesets/types` | `6.1.0` | `NOASSERTION` |
| `@changesets/write` | `0.4.0` | `NOASSERTION` |
| `@clack/core` | `1.4.3` | `NOASSERTION` |
| `@clack/prompts` | `1.7.0` | `NOASSERTION` |
| `@dotenvx/dotenvx` | `1.75.1` | `NOASSERTION` |
| `@dotenvx/primitives` | `0.8.0` | `NOASSERTION` |
| `@drizzle-team/brocli` | `0.10.2` | `NOASSERTION` |
| `@egjs/hammerjs` | `2.0.17` | `NOASSERTION` |
| `@emnapi/core` | `1.11.1` | `NOASSERTION` |
| `@emnapi/core` | `1.11.2` | `NOASSERTION` |
| `@emnapi/runtime` | `1.11.1` | `NOASSERTION` |
| `@emnapi/runtime` | `1.11.2` | `NOASSERTION` |
| `@emnapi/wasi-threads` | `1.2.2` | `NOASSERTION` |
| `@esbuild-kit/core-utils` | `3.3.2` | `NOASSERTION` |
| `@esbuild-kit/esm-loader` | `2.6.5` | `NOASSERTION` |
| `@esbuild/aix-ppc64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/android-arm` | `0.28.1` | `NOASSERTION` |
| `@esbuild/android-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/android-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/darwin-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/darwin-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/freebsd-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/freebsd-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-arm` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-ia32` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-loong64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-mips64el` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-ppc64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-riscv64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-s390x` | `0.28.1` | `NOASSERTION` |
| `@esbuild/linux-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/netbsd-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/netbsd-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/openbsd-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/openbsd-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/openharmony-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/sunos-x64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/win32-arm64` | `0.28.1` | `NOASSERTION` |
| `@esbuild/win32-ia32` | `0.28.1` | `NOASSERTION` |
| `@esbuild/win32-x64` | `0.28.1` | `NOASSERTION` |
| `@eslint-community/eslint-utils` | `4.9.1` | `NOASSERTION` |
| `@eslint-community/regexpp` | `4.12.2` | `NOASSERTION` |
| `@eslint/config-array` | `0.23.5` | `NOASSERTION` |
| `@eslint/config-helpers` | `0.6.0` | `NOASSERTION` |
| `@eslint/core` | `1.2.1` | `NOASSERTION` |
| `@eslint/object-schema` | `3.0.5` | `NOASSERTION` |
| `@eslint/plugin-kit` | `0.7.2` | `NOASSERTION` |
| `@expo-google-fonts/material-symbols` | `0.4.38` | `NOASSERTION` |
| `@expo/cli` | `57.0.6` | `NOASSERTION` |
| `@expo/code-signing-certificates` | `0.0.6` | `NOASSERTION` |
| `@expo/config` | `57.0.3` | `NOASSERTION` |
| `@expo/config-plugins` | `57.0.3` | `NOASSERTION` |
| `@expo/config-types` | `57.0.1` | `NOASSERTION` |
| `@expo/devcert` | `1.2.1` | `NOASSERTION` |
| `@expo/devtools` | `57.0.0` | `NOASSERTION` |
| `@expo/dom-webview` | `57.0.0` | `NOASSERTION` |
| `@expo/env` | `2.4.1` | `NOASSERTION` |
| `@expo/expo-modules-macros-plugin` | `0.3.0` | `NOASSERTION` |
| `@expo/fingerprint` | `0.20.3` | `NOASSERTION` |
| `@expo/image-utils` | `0.11.1` | `NOASSERTION` |
| `@expo/inline-modules` | `0.1.2` | `NOASSERTION` |
| `@expo/json-file` | `11.0.0` | `NOASSERTION` |
| `@expo/local-build-cache-provider` | `57.0.2` | `NOASSERTION` |
| `@expo/log-box` | `57.0.0` | `NOASSERTION` |
| `@expo/metro` | `56.0.0` | `NOASSERTION` |
| `@expo/metro-config` | `57.0.3` | `NOASSERTION` |
| `@expo/metro-file-map` | `57.0.0` | `NOASSERTION` |
| `@expo/metro-runtime` | `57.0.3` | `NOASSERTION` |
| `@expo/osascript` | `2.7.0` | `NOASSERTION` |
| `@expo/package-manager` | `1.13.0` | `NOASSERTION` |
| `@expo/plist` | `0.8.0` | `NOASSERTION` |
| `@expo/prebuild-config` | `57.0.5` | `NOASSERTION` |
| `@expo/require-utils` | `57.0.1` | `NOASSERTION` |
| `@expo/router-server` | `57.0.2` | `NOASSERTION` |
| `@expo/schema-utils` | `57.0.1` | `NOASSERTION` |
| `@expo/sdk-runtime-versions` | `1.0.0` | `NOASSERTION` |
| `@expo/spawn-async` | `1.8.0` | `NOASSERTION` |
| `@expo/sudo-prompt` | `9.3.2` | `NOASSERTION` |
| `@expo/ui` | `57.0.4` | `NOASSERTION` |
| `@expo/vector-icons` | `15.1.1` | `NOASSERTION` |
| `@expo/ws-tunnel` | `2.0.0` | `NOASSERTION` |
| `@expo/xcpretty` | `4.4.4` | `NOASSERTION` |
| `@floating-ui/core` | `1.8.0` | `NOASSERTION` |
| `@floating-ui/dom` | `1.8.0` | `NOASSERTION` |
| `@floating-ui/react-dom` | `2.1.9` | `NOASSERTION` |
| `@floating-ui/utils` | `0.2.12` | `NOASSERTION` |
| `@fuma-translate/react` | `1.0.2` | `NOASSERTION` |
| `@fumadocs/base-ui` | `16.11.3` | `NOASSERTION` |
| `@fumadocs/tailwind` | `0.1.1` | `NOASSERTION` |
| `@hexagon/base64` | `1.1.28` | `NOASSERTION` |
| `@hono/node-server` | `2.0.11` | `NOASSERTION` |
| `@humanfs/core` | `0.19.2` | `NOASSERTION` |
| `@humanfs/node` | `0.16.8` | `NOASSERTION` |
| `@humanfs/types` | `0.15.0` | `NOASSERTION` |
| `@humanwhocodes/module-importer` | `1.0.1` | `NOASSERTION` |
| `@humanwhocodes/retry` | `0.4.3` | `NOASSERTION` |
| `@img/colour` | `1.1.0` | `NOASSERTION` |
| `@img/sharp-darwin-arm64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-darwin-x64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-freebsd-wasm32` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-libvips-darwin-arm64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-darwin-x64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-arm` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-arm64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-ppc64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-riscv64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-s390x` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linux-x64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linuxmusl-arm64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-libvips-linuxmusl-x64` | `1.3.2` | `NOASSERTION` |
| `@img/sharp-linux-arm` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linux-arm64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linux-ppc64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linux-riscv64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linux-s390x` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linux-x64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linuxmusl-arm64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-linuxmusl-x64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-wasm32` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-webcontainers-wasm32` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-win32-arm64` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-win32-ia32` | `0.35.3` | `NOASSERTION` |
| `@img/sharp-win32-x64` | `0.35.3` | `NOASSERTION` |
| `@inquirer/external-editor` | `1.0.3` | `NOASSERTION` |
| `@isaacs/ttlcache` | `1.4.1` | `NOASSERTION` |
| `@jest/schemas` | `29.6.3` | `NOASSERTION` |
| `@jest/types` | `29.6.3` | `NOASSERTION` |
| `@jridgewell/gen-mapping` | `0.3.13` | `NOASSERTION` |
| `@jridgewell/remapping` | `2.3.5` | `NOASSERTION` |
| `@jridgewell/resolve-uri` | `3.1.2` | `NOASSERTION` |
| `@jridgewell/source-map` | `0.3.11` | `NOASSERTION` |
| `@jridgewell/sourcemap-codec` | `1.5.5` | `NOASSERTION` |
| `@jridgewell/trace-mapping` | `0.3.31` | `NOASSERTION` |
| `@levischuck/tiny-cbor` | `0.2.11` | `NOASSERTION` |
| `@manypkg/find-root` | `1.1.0` | `NOASSERTION` |
| `@manypkg/get-packages` | `1.1.3` | `NOASSERTION` |
| `@mdx-js/mdx` | `3.1.1` | `NOASSERTION` |
| `@modelcontextprotocol/sdk` | `1.29.0` | `NOASSERTION` |
| `@napi-rs/wasm-runtime` | `1.1.6` | `NOASSERTION` |
| `@next/env` | `16.2.11` | `NOASSERTION` |
| `@next/swc-darwin-arm64` | `16.2.11` | `NOASSERTION` |
| `@next/swc-darwin-x64` | `16.2.11` | `NOASSERTION` |
| `@next/swc-linux-arm64-gnu` | `16.2.11` | `NOASSERTION` |
| `@next/swc-linux-arm64-musl` | `16.2.11` | `NOASSERTION` |
| `@next/swc-linux-x64-gnu` | `16.2.11` | `NOASSERTION` |
| `@next/swc-linux-x64-musl` | `16.2.11` | `NOASSERTION` |
| `@next/swc-win32-arm64-msvc` | `16.2.11` | `NOASSERTION` |
| `@next/swc-win32-x64-msvc` | `16.2.11` | `NOASSERTION` |
| `@noble/ciphers` | `2.2.0` | `NOASSERTION` |
| `@noble/hashes` | `2.2.0` | `NOASSERTION` |
| `@nodelib/fs.scandir` | `2.1.5` | `NOASSERTION` |
| `@nodelib/fs.stat` | `2.0.5` | `NOASSERTION` |
| `@nodelib/fs.walk` | `1.2.8` | `NOASSERTION` |
| `@opentelemetry/semantic-conventions` | `1.43.0` | `NOASSERTION` |
| `@orama/orama` | `3.1.18` | `NOASSERTION` |
| `@orpc/client` | `1.14.7` | `NOASSERTION` |
| `@orpc/contract` | `1.14.7` | `NOASSERTION` |
| `@orpc/interop` | `1.14.7` | `NOASSERTION` |
| `@orpc/json-schema` | `1.14.7` | `NOASSERTION` |
| `@orpc/openapi` | `1.14.7` | `NOASSERTION` |
| `@orpc/openapi-client` | `1.14.7` | `NOASSERTION` |
| `@orpc/server` | `1.14.7` | `NOASSERTION` |
| `@orpc/shared` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server-aws-lambda` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server-fastify` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server-fetch` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server-node` | `1.14.7` | `NOASSERTION` |
| `@orpc/standard-server-peer` | `1.14.7` | `NOASSERTION` |
| `@orpc/tanstack-query` | `1.14.7` | `NOASSERTION` |
| `@orpc/zod` | `1.14.7` | `NOASSERTION` |
| `@oxc-project/types` | `0.139.0` | `NOASSERTION` |
| `@peculiar/asn1-android` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-cms` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-csr` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-ecc` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-pfx` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-pkcs8` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-pkcs9` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-rsa` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-schema` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-x509` | `2.8.0` | `NOASSERTION` |
| `@peculiar/asn1-x509-attr` | `2.8.0` | `NOASSERTION` |
| `@peculiar/utils` | `2.0.3` | `NOASSERTION` |
| `@peculiar/x509` | `1.14.3` | `NOASSERTION` |
| `@playwright/test` | `1.61.1` | `NOASSERTION` |
| `@quansync/fs` | `1.0.0` | `NOASSERTION` |
| `@radix-ui/primitive` | `1.1.5` | `NOASSERTION` |
| `@radix-ui/react-collection` | `1.1.12` | `NOASSERTION` |
| `@radix-ui/react-compose-refs` | `1.1.3` | `NOASSERTION` |
| `@radix-ui/react-context` | `1.2.0` | `NOASSERTION` |
| `@radix-ui/react-dialog` | `1.1.19` | `NOASSERTION` |
| `@radix-ui/react-direction` | `1.1.2` | `NOASSERTION` |
| `@radix-ui/react-dismissable-layer` | `1.1.15` | `NOASSERTION` |
| `@radix-ui/react-focus-guards` | `1.1.4` | `NOASSERTION` |
| `@radix-ui/react-focus-scope` | `1.1.12` | `NOASSERTION` |
| `@radix-ui/react-id` | `1.1.2` | `NOASSERTION` |
| `@radix-ui/react-portal` | `1.1.13` | `NOASSERTION` |
| `@radix-ui/react-presence` | `1.1.7` | `NOASSERTION` |
| `@radix-ui/react-primitive` | `2.1.7` | `NOASSERTION` |
| `@radix-ui/react-roving-focus` | `1.1.15` | `NOASSERTION` |
| `@radix-ui/react-slot` | `1.3.0` | `NOASSERTION` |
| `@radix-ui/react-tabs` | `1.1.17` | `NOASSERTION` |
| `@radix-ui/react-use-callback-ref` | `1.1.2` | `NOASSERTION` |
| `@radix-ui/react-use-controllable-state` | `1.2.3` | `NOASSERTION` |
| `@radix-ui/react-use-effect-event` | `0.0.3` | `NOASSERTION` |
| `@radix-ui/react-use-is-hydrated` | `0.1.1` | `NOASSERTION` |
| `@radix-ui/react-use-layout-effect` | `1.1.2` | `NOASSERTION` |
| `@react-native-masked-view/masked-view` | `0.3.2` | `NOASSERTION` |
| `@react-native/assets-registry` | `0.86.0` | `NOASSERTION` |
| `@react-native/babel-plugin-codegen` | `0.86.0` | `NOASSERTION` |
| `@react-native/babel-preset` | `0.86.0` | `NOASSERTION` |
| `@react-native/codegen` | `0.86.0` | `NOASSERTION` |
| `@react-native/community-cli-plugin` | `0.86.0` | `NOASSERTION` |
| `@react-native/debugger-frontend` | `0.86.0` | `NOASSERTION` |
| `@react-native/debugger-shell` | `0.86.0` | `NOASSERTION` |
| `@react-native/dev-middleware` | `0.86.0` | `NOASSERTION` |
| `@react-native/gradle-plugin` | `0.86.0` | `NOASSERTION` |
| `@react-native/js-polyfills` | `0.86.0` | `NOASSERTION` |
| `@react-native/metro-babel-transformer` | `0.86.0` | `NOASSERTION` |
| `@react-native/metro-config` | `0.86.0` | `NOASSERTION` |
| `@react-native/normalize-colors` | `0.74.89` | `NOASSERTION` |
| `@react-native/normalize-colors` | `0.86.0` | `NOASSERTION` |
| `@react-native/virtualized-lists` | `0.86.0` | `NOASSERTION` |
| `@rolldown/binding-android-arm64` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-darwin-arm64` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-darwin-x64` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-freebsd-x64` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-arm-gnueabihf` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-arm64-gnu` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-arm64-musl` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-ppc64-gnu` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-s390x-gnu` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-x64-gnu` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-linux-x64-musl` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-openharmony-arm64` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-wasm32-wasi` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-win32-arm64-msvc` | `1.1.5` | `NOASSERTION` |
| `@rolldown/binding-win32-x64-msvc` | `1.1.5` | `NOASSERTION` |
| `@rolldown/pluginutils` | `1.0.1` | `NOASSERTION` |
| `@sec-ant/readable-stream` | `0.4.1` | `NOASSERTION` |
| `@shikijs/core` | `4.3.1` | `NOASSERTION` |
| `@shikijs/engine-javascript` | `4.3.1` | `NOASSERTION` |
| `@shikijs/engine-oniguruma` | `4.3.1` | `NOASSERTION` |
| `@shikijs/langs` | `4.3.1` | `NOASSERTION` |
| `@shikijs/primitive` | `4.3.1` | `NOASSERTION` |
| `@shikijs/themes` | `4.3.1` | `NOASSERTION` |
| `@shikijs/types` | `4.3.1` | `NOASSERTION` |
| `@shikijs/vscode-textmate` | `10.0.2` | `NOASSERTION` |
| `@simplewebauthn/browser` | `13.3.0` | `NOASSERTION` |
| `@simplewebauthn/server` | `13.3.2` | `NOASSERTION` |
| `@sinclair/typebox` | `0.27.10` | `NOASSERTION` |
| `@sindresorhus/merge-streams` | `4.0.0` | `NOASSERTION` |
| `@standard-schema/spec` | `1.1.0` | `NOASSERTION` |
| `@stardazed/streams-text-encoding` | `1.0.2` | `NOASSERTION` |
| `@swc/helpers` | `0.5.15` | `NOASSERTION` |
| `@swc/helpers` | `0.5.23` | `NOASSERTION` |
| `@t3-oss/env-core` | `0.13.11` | `NOASSERTION` |
| `@t3-oss/env-nextjs` | `0.13.11` | `NOASSERTION` |
| `@tailwindcss/node` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-android-arm64` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-darwin-arm64` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-darwin-x64` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-freebsd-x64` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-linux-arm-gnueabihf` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-linux-arm64-gnu` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-linux-arm64-musl` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-linux-x64-gnu` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-linux-x64-musl` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-wasm32-wasi` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-win32-arm64-msvc` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/oxide-win32-x64-msvc` | `4.3.2` | `NOASSERTION` |
| `@tailwindcss/postcss` | `4.3.2` | `NOASSERTION` |
| `@tanstack/devtools-event-client` | `0.4.4` | `NOASSERTION` |
| `@tanstack/form-core` | `1.33.2` | `NOASSERTION` |
| `@tanstack/pacer-lite` | `0.1.1` | `NOASSERTION` |
| `@tanstack/query-core` | `5.101.2` | `NOASSERTION` |
| `@tanstack/react-form` | `1.33.2` | `NOASSERTION` |
| `@tanstack/react-query` | `5.101.2` | `NOASSERTION` |
| `@tanstack/react-store` | `0.11.0` | `NOASSERTION` |
| `@tanstack/store` | `0.11.0` | `NOASSERTION` |
| `@testing-library/dom` | `10.4.1` | `NOASSERTION` |
| `@testing-library/jest-dom` | `6.9.1` | `NOASSERTION` |
| `@testing-library/user-event` | `14.6.1` | `NOASSERTION` |
| `@ts-morph/common` | `0.27.0` | `NOASSERTION` |
| `@turbo/darwin-64` | `2.10.5` | `NOASSERTION` |
| `@turbo/darwin-arm64` | `2.10.5` | `NOASSERTION` |
| `@turbo/linux-64` | `2.10.5` | `NOASSERTION` |
| `@turbo/linux-arm64` | `2.10.5` | `NOASSERTION` |
| `@turbo/windows-64` | `2.10.5` | `NOASSERTION` |
| `@turbo/windows-arm64` | `2.10.5` | `NOASSERTION` |
| `@tybys/wasm-util` | `0.10.3` | `NOASSERTION` |
| `@types/aria-query` | `5.0.4` | `NOASSERTION` |
| `@types/bun` | `1.3.14` | `NOASSERTION` |
| `@types/chai` | `5.2.3` | `NOASSERTION` |
| `@types/debug` | `4.1.13` | `NOASSERTION` |
| `@types/deep-eql` | `4.0.2` | `NOASSERTION` |
| `@types/esrecurse` | `4.3.1` | `NOASSERTION` |
| `@types/estree` | `1.0.9` | `NOASSERTION` |
| `@types/estree-jsx` | `1.0.5` | `NOASSERTION` |
| `@types/hammerjs` | `2.0.46` | `NOASSERTION` |
| `@types/hast` | `3.0.5` | `NOASSERTION` |
| `@types/istanbul-lib-coverage` | `2.0.6` | `NOASSERTION` |
| `@types/istanbul-lib-report` | `3.0.3` | `NOASSERTION` |
| `@types/istanbul-reports` | `3.0.4` | `NOASSERTION` |
| `@types/json-schema` | `7.0.15` | `NOASSERTION` |
| `@types/mdast` | `4.0.4` | `NOASSERTION` |
| `@types/mdx` | `2.0.14` | `NOASSERTION` |
| `@types/ms` | `2.1.0` | `NOASSERTION` |
| `@types/node` | `12.20.55` | `NOASSERTION` |
| `@types/node` | `20.19.43` | `NOASSERTION` |
| `@types/node` | `26.1.1` | `NOASSERTION` |
| `@types/pg` | `8.20.0` | `NOASSERTION` |
| `@types/react` | `19.2.17` | `NOASSERTION` |
| `@types/react-dom` | `19.2.3` | `NOASSERTION` |
| `@types/react-test-renderer` | `19.1.0` | `NOASSERTION` |
| `@types/unist` | `2.0.11` | `NOASSERTION` |
| `@types/unist` | `3.0.3` | `NOASSERTION` |
| `@types/validate-npm-package-name` | `4.0.2` | `NOASSERTION` |
| `@types/yargs` | `17.0.35` | `NOASSERTION` |
| `@types/yargs-parser` | `21.0.3` | `NOASSERTION` |
| `@typescript-eslint/project-service` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/scope-manager` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/tsconfig-utils` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/types` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/typescript-estree` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/utils` | `8.64.0` | `NOASSERTION` |
| `@typescript-eslint/visitor-keys` | `8.64.0` | `NOASSERTION` |
| `@ungap/structured-clone` | `1.3.3` | `NOASSERTION` |
| `@vitest/expect` | `4.1.10` | `NOASSERTION` |
| `@vitest/mocker` | `4.1.10` | `NOASSERTION` |
| `@vitest/pretty-format` | `4.1.10` | `NOASSERTION` |
| `@vitest/runner` | `4.1.10` | `NOASSERTION` |
| `@vitest/snapshot` | `4.1.10` | `NOASSERTION` |
| `@vitest/spy` | `4.1.10` | `NOASSERTION` |
| `@vitest/utils` | `4.1.10` | `NOASSERTION` |
| `@xmldom/xmldom` | `0.8.13` | `NOASSERTION` |
| `@xmldom/xmldom` | `0.9.10` | `NOASSERTION` |
| `@yuku-codegen/binding-darwin-arm64` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-darwin-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-freebsd-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-arm-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-arm-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-arm64-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-arm64-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-x64-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-linux-x64-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-win32-arm64` | `0.6.1` | `NOASSERTION` |
| `@yuku-codegen/binding-win32-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-darwin-arm64` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-darwin-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-freebsd-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-arm-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-arm-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-arm64-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-arm64-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-x64-gnu` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-linux-x64-musl` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-win32-arm64` | `0.6.1` | `NOASSERTION` |
| `@yuku-parser/binding-win32-x64` | `0.6.1` | `NOASSERTION` |
| `@yuku-toolchain/types` | `0.5.43` | `NOASSERTION` |
| `abort-controller` | `3.0.0` | `NOASSERTION` |
| `accepts` | `1.3.8` | `NOASSERTION` |
| `accepts` | `2.0.0` | `NOASSERTION` |
| `acorn` | `8.17.0` | `NOASSERTION` |
| `acorn-jsx` | `5.3.2` | `NOASSERTION` |
| `agent-base` | `7.1.4` | `NOASSERTION` |
| `agent-cli-detector` | `0.1.2` | `NOASSERTION` |
| `ajv` | `6.15.0` | `NOASSERTION` |
| `ajv` | `8.20.0` | `NOASSERTION` |
| `ajv-formats` | `2.1.1` | `NOASSERTION` |
| `ajv-formats` | `3.0.1` | `NOASSERTION` |
| `anser` | `1.4.10` | `NOASSERTION` |
| `ansi-colors` | `4.1.3` | `NOASSERTION` |
| `ansi-escapes` | `4.3.2` | `NOASSERTION` |
| `ansi-regex` | `4.1.1` | `NOASSERTION` |
| `ansi-regex` | `5.0.1` | `NOASSERTION` |
| `ansi-regex` | `6.2.2` | `NOASSERTION` |
| `ansi-styles` | `3.2.1` | `NOASSERTION` |
| `ansi-styles` | `4.3.0` | `NOASSERTION` |
| `ansi-styles` | `5.2.0` | `NOASSERTION` |
| `ansis` | `4.3.1` | `NOASSERTION` |
| `arg` | `5.0.2` | `NOASSERTION` |
| `argparse` | `1.0.10` | `NOASSERTION` |
| `argparse` | `2.0.1` | `NOASSERTION` |
| `aria-hidden` | `1.2.6` | `NOASSERTION` |
| `aria-query` | `5.3.0` | `NOASSERTION` |
| `aria-query` | `5.3.2` | `NOASSERTION` |
| `array-union` | `2.1.0` | `NOASSERTION` |
| `asap` | `2.0.6` | `NOASSERTION` |
| `asn1js` | `3.0.10` | `NOASSERTION` |
| `assertion-error` | `2.0.1` | `NOASSERTION` |
| `ast-types` | `0.16.1` | `NOASSERTION` |
| `astring` | `1.9.0` | `NOASSERTION` |
| `atomically` | `1.7.0` | `NOASSERTION` |
| `axe-core` | `4.12.1` | `NOASSERTION` |
| `babel-plugin-polyfill-corejs2` | `0.4.17` | `NOASSERTION` |
| `babel-plugin-polyfill-corejs3` | `0.13.0` | `NOASSERTION` |
| `babel-plugin-polyfill-regenerator` | `0.6.8` | `NOASSERTION` |
| `babel-plugin-react-compiler` | `1.0.0` | `NOASSERTION` |
| `babel-plugin-react-native-web` | `0.21.2` | `NOASSERTION` |
| `babel-plugin-syntax-hermes-parser` | `0.36.0` | `NOASSERTION` |
| `babel-plugin-transform-flow-enums` | `0.0.2` | `NOASSERTION` |
| `babel-preset-expo` | `57.0.2` | `NOASSERTION` |
| `bail` | `2.0.2` | `NOASSERTION` |
| `balanced-match` | `4.0.4` | `NOASSERTION` |
| `base64-js` | `1.5.1` | `NOASSERTION` |
| `baseline-browser-mapping` | `2.10.43` | `NOASSERTION` |
| `better-auth` | `1.6.23` | `NOASSERTION` |
| `better-call` | `1.3.7` | `NOASSERTION` |
| `better-path-resolve` | `1.0.0` | `NOASSERTION` |
| `big-integer` | `1.6.52` | `NOASSERTION` |
| `body-parser` | `2.3.0` | `NOASSERTION` |
| `bplist-creator` | `0.1.0` | `NOASSERTION` |
| `bplist-parser` | `0.3.1` | `NOASSERTION` |
| `bplist-parser` | `0.3.2` | `NOASSERTION` |
| `brace-expansion` | `5.0.7` | `NOASSERTION` |
| `braces` | `3.0.3` | `NOASSERTION` |
| `browserslist` | `4.28.6` | `NOASSERTION` |
| `bser` | `2.1.1` | `NOASSERTION` |
| `buffer-from` | `1.1.2` | `NOASSERTION` |
| `bun-types` | `1.3.14` | `NOASSERTION` |
| `bundle-name` | `4.1.0` | `NOASSERTION` |
| `bytes` | `3.1.2` | `NOASSERTION` |
| `cac` | `7.0.0` | `NOASSERTION` |
| `call-bind-apply-helpers` | `1.0.2` | `NOASSERTION` |
| `call-bound` | `1.0.4` | `NOASSERTION` |
| `callsites` | `3.1.0` | `NOASSERTION` |
| `camelcase` | `6.3.0` | `NOASSERTION` |
| `caniuse-lite` | `1.0.30001805` | `NOASSERTION` |
| `ccount` | `2.0.1` | `NOASSERTION` |
| `chai` | `6.2.2` | `NOASSERTION` |
| `chalk` | `2.4.2` | `NOASSERTION` |
| `chalk` | `4.1.2` | `NOASSERTION` |
| `chalk` | `5.6.2` | `NOASSERTION` |
| `character-entities` | `2.0.2` | `NOASSERTION` |
| `character-entities-html4` | `2.1.0` | `NOASSERTION` |
| `character-entities-legacy` | `3.0.0` | `NOASSERTION` |
| `character-reference-invalid` | `2.0.1` | `NOASSERTION` |
| `chardet` | `2.2.0` | `NOASSERTION` |
| `chokidar` | `5.0.0` | `NOASSERTION` |
| `chrome-launcher` | `0.15.2` | `NOASSERTION` |
| `chromium-edge-launcher` | `0.3.0` | `NOASSERTION` |
| `ci-info` | `2.0.0` | `NOASSERTION` |
| `ci-info` | `3.9.0` | `NOASSERTION` |
| `citty` | `0.2.2` | `NOASSERTION` |
| `class-variance-authority` | `0.7.1` | `NOASSERTION` |
| `cli-cursor` | `2.1.0` | `NOASSERTION` |
| `cli-cursor` | `5.0.0` | `NOASSERTION` |
| `cli-spinners` | `2.9.2` | `NOASSERTION` |
| `client-only` | `0.0.1` | `NOASSERTION` |
| `cliui` | `8.0.1` | `NOASSERTION` |
| `clone` | `1.0.4` | `NOASSERTION` |
| `clsx` | `2.1.1` | `NOASSERTION` |
| `cnfast` | `0.0.8` | `NOASSERTION` |
| `code-block-writer` | `13.0.3` | `NOASSERTION` |
| `collapse-white-space` | `2.1.0` | `NOASSERTION` |
| `color` | `4.2.3` | `NOASSERTION` |
| `color-convert` | `1.9.3` | `NOASSERTION` |
| `color-convert` | `2.0.1` | `NOASSERTION` |
| `color-name` | `1.1.3` | `NOASSERTION` |
| `color-name` | `1.1.4` | `NOASSERTION` |
| `color-string` | `1.9.1` | `NOASSERTION` |
| `comma-separated-tokens` | `2.0.3` | `NOASSERTION` |
| `commander` | `11.1.0` | `NOASSERTION` |
| `commander` | `12.1.0` | `NOASSERTION` |
| `commander` | `14.0.3` | `NOASSERTION` |
| `commander` | `15.0.0` | `NOASSERTION` |
| `commander` | `2.20.3` | `NOASSERTION` |
| `commander` | `7.2.0` | `NOASSERTION` |
| `compressible` | `2.0.18` | `NOASSERTION` |
| `compression` | `1.8.1` | `NOASSERTION` |
| `compute-scroll-into-view` | `3.1.1` | `NOASSERTION` |
| `conf` | `10.2.0` | `NOASSERTION` |
| `connect` | `3.7.0` | `NOASSERTION` |
| `content-disposition` | `1.1.0` | `NOASSERTION` |
| `content-type` | `1.0.5` | `NOASSERTION` |
| `content-type` | `2.0.0` | `NOASSERTION` |
| `convert-source-map` | `2.0.0` | `NOASSERTION` |
| `cookie` | `0.7.2` | `NOASSERTION` |
| `cookie` | `1.1.1` | `NOASSERTION` |
| `cookie-signature` | `1.2.2` | `NOASSERTION` |
| `core-js-compat` | `3.49.0` | `NOASSERTION` |
| `cors` | `2.8.6` | `NOASSERTION` |
| `cosmiconfig` | `9.0.2` | `NOASSERTION` |
| `cross-fetch` | `3.2.0` | `NOASSERTION` |
| `cross-spawn` | `7.0.6` | `NOASSERTION` |
| `css-in-js-utils` | `3.1.0` | `NOASSERTION` |
| `css.escape` | `1.5.1` | `NOASSERTION` |
| `cssesc` | `3.0.0` | `NOASSERTION` |
| `csstype` | `3.2.3` | `NOASSERTION` |
| `debounce-fn` | `4.0.0` | `NOASSERTION` |
| `debug` | `2.6.9` | `NOASSERTION` |
| `debug` | `3.2.7` | `NOASSERTION` |
| `debug` | `4.4.3` | `NOASSERTION` |
| `decode-named-character-reference` | `1.3.0` | `NOASSERTION` |
| `decode-uri-component` | `0.2.2` | `NOASSERTION` |
| `dedent` | `1.7.2` | `NOASSERTION` |
| `deep-is` | `0.1.4` | `NOASSERTION` |
| `deepmerge` | `4.3.1` | `NOASSERTION` |
| `default-browser` | `5.5.0` | `NOASSERTION` |
| `default-browser-id` | `5.0.1` | `NOASSERTION` |
| `defaults` | `1.0.4` | `NOASSERTION` |
| `define-lazy-prop` | `2.0.0` | `NOASSERTION` |
| `define-lazy-prop` | `3.0.0` | `NOASSERTION` |
| `defu` | `6.1.7` | `NOASSERTION` |
| `depd` | `2.0.0` | `NOASSERTION` |
| `dequal` | `2.0.3` | `NOASSERTION` |
| `destroy` | `1.2.0` | `NOASSERTION` |
| `detect-indent` | `6.1.0` | `NOASSERTION` |
| `detect-libc` | `2.1.2` | `NOASSERTION` |
| `detect-node-es` | `1.1.0` | `NOASSERTION` |
| `devlop` | `1.1.0` | `NOASSERTION` |
| `diff` | `8.0.4` | `NOASSERTION` |
| `dir-glob` | `3.0.1` | `NOASSERTION` |
| `dnssd-advertise` | `1.1.6` | `NOASSERTION` |
| `dom-accessibility-api` | `0.5.16` | `NOASSERTION` |
| `dom-accessibility-api` | `0.6.3` | `NOASSERTION` |
| `dot-prop` | `6.0.1` | `NOASSERTION` |
| `dotenv` | `17.4.2` | `NOASSERTION` |
| `drizzle-kit` | `0.31.10` | `NOASSERTION` |
| `drizzle-orm` | `0.45.2` | `NOASSERTION` |
| `dts-resolver` | `3.0.0` | `NOASSERTION` |
| `dunder-proto` | `1.0.1` | `NOASSERTION` |
| `ee-first` | `1.1.1` | `NOASSERTION` |
| `electron-to-chromium` | `1.5.389` | `NOASSERTION` |
| `emoji-regex` | `10.6.0` | `NOASSERTION` |
| `emoji-regex` | `8.0.0` | `NOASSERTION` |
| `empathic` | `2.0.1` | `NOASSERTION` |
| `encodeurl` | `1.0.2` | `NOASSERTION` |
| `encodeurl` | `2.0.0` | `NOASSERTION` |
| `enhanced-resolve` | `5.21.6` | `NOASSERTION` |
| `enquirer` | `2.4.1` | `NOASSERTION` |
| `entities` | `6.0.1` | `NOASSERTION` |
| `env-paths` | `2.2.1` | `NOASSERTION` |
| `error-ex` | `1.3.4` | `NOASSERTION` |
| `error-stack-parser` | `2.1.4` | `NOASSERTION` |
| `es-define-property` | `1.0.1` | `NOASSERTION` |
| `es-errors` | `1.3.0` | `NOASSERTION` |
| `es-module-lexer` | `2.3.1` | `NOASSERTION` |
| `es-object-atoms` | `1.1.2` | `NOASSERTION` |
| `esast-util-from-estree` | `2.0.0` | `NOASSERTION` |
| `esast-util-from-js` | `2.0.1` | `NOASSERTION` |
| `esbuild` | `0.28.1` | `NOASSERTION` |
| `escalade` | `3.2.0` | `NOASSERTION` |
| `escape-html` | `1.0.3` | `NOASSERTION` |
| `escape-string-regexp` | `1.0.5` | `NOASSERTION` |
| `escape-string-regexp` | `4.0.0` | `NOASSERTION` |
| `escape-string-regexp` | `5.0.0` | `NOASSERTION` |
| `eslint` | `10.7.0` | `NOASSERTION` |
| `eslint-scope` | `9.1.2` | `NOASSERTION` |
| `eslint-visitor-keys` | `3.4.3` | `NOASSERTION` |
| `eslint-visitor-keys` | `5.0.1` | `NOASSERTION` |
| `espree` | `11.2.0` | `NOASSERTION` |
| `esprima` | `4.0.1` | `NOASSERTION` |
| `esquery` | `1.7.0` | `NOASSERTION` |
| `esrecurse` | `4.3.0` | `NOASSERTION` |
| `estraverse` | `5.3.0` | `NOASSERTION` |
| `estree-util-attach-comments` | `3.0.0` | `NOASSERTION` |
| `estree-util-build-jsx` | `3.0.1` | `NOASSERTION` |
| `estree-util-is-identifier-name` | `3.0.0` | `NOASSERTION` |
| `estree-util-scope` | `1.0.0` | `NOASSERTION` |
| `estree-util-to-js` | `2.0.0` | `NOASSERTION` |
| `estree-util-value-to-estree` | `3.5.0` | `NOASSERTION` |
| `estree-util-visit` | `2.0.0` | `NOASSERTION` |
| `estree-walker` | `3.0.3` | `NOASSERTION` |
| `esutils` | `2.0.3` | `NOASSERTION` |
| `etag` | `1.8.1` | `NOASSERTION` |
| `event-target-shim` | `5.0.1` | `NOASSERTION` |
| `eventsource` | `3.0.7` | `NOASSERTION` |
| `eventsource-parser` | `3.1.0` | `NOASSERTION` |
| `execa` | `5.1.1` | `NOASSERTION` |
| `execa` | `9.6.1` | `NOASSERTION` |
| `expect-type` | `1.4.0` | `NOASSERTION` |
| `expo` | `57.0.4` | `NOASSERTION` |
| `expo-asset` | `57.0.3` | `NOASSERTION` |
| `expo-constants` | `57.0.3` | `NOASSERTION` |
| `expo-crypto` | `57.0.0` | `NOASSERTION` |
| `expo-file-system` | `57.0.0` | `NOASSERTION` |
| `expo-font` | `57.0.0` | `NOASSERTION` |
| `expo-glass-effect` | `57.0.0` | `NOASSERTION` |
| `expo-keep-awake` | `57.0.0` | `NOASSERTION` |
| `expo-linking` | `57.0.2` | `NOASSERTION` |
| `expo-modules-autolinking` | `57.0.5` | `NOASSERTION` |
| `expo-modules-core` | `57.0.3` | `NOASSERTION` |
| `expo-modules-jsi` | `57.0.1` | `NOASSERTION` |
| `expo-network` | `57.0.0` | `NOASSERTION` |
| `expo-router` | `57.0.4` | `NOASSERTION` |
| `expo-server` | `57.0.0` | `NOASSERTION` |
| `expo-splash-screen` | `57.0.2` | `NOASSERTION` |
| `expo-status-bar` | `57.0.0` | `NOASSERTION` |
| `expo-symbols` | `57.0.0` | `NOASSERTION` |
| `expo-system-ui` | `57.0.0` | `NOASSERTION` |
| `expo-web-browser` | `57.0.0` | `NOASSERTION` |
| `exponential-backoff` | `3.1.3` | `NOASSERTION` |
| `express` | `5.2.1` | `NOASSERTION` |
| `express-rate-limit` | `8.5.2` | `NOASSERTION` |
| `extend` | `3.0.2` | `NOASSERTION` |
| `extendable-error` | `0.1.7` | `NOASSERTION` |
| `fast-deep-equal` | `3.1.3` | `NOASSERTION` |
| `fast-glob` | `3.3.3` | `NOASSERTION` |
| `fast-json-stable-stringify` | `2.1.0` | `NOASSERTION` |
| `fast-levenshtein` | `2.0.6` | `NOASSERTION` |
| `fast-string-truncated-width` | `3.0.3` | `NOASSERTION` |
| `fast-string-width` | `3.0.2` | `NOASSERTION` |
| `fast-uri` | `3.1.4` | `NOASSERTION` |
| `fast-wrap-ansi` | `0.2.2` | `NOASSERTION` |
| `fastq` | `1.20.1` | `NOASSERTION` |
| `fb-dotslash` | `0.5.8` | `NOASSERTION` |
| `fb-watchman` | `2.0.2` | `NOASSERTION` |
| `fbjs` | `3.0.5` | `NOASSERTION` |
| `fbjs-css-vars` | `1.0.2` | `NOASSERTION` |
| `fdir` | `6.5.0` | `NOASSERTION` |
| `fetch-nodeshim` | `0.4.10` | `NOASSERTION` |
| `figures` | `6.1.0` | `NOASSERTION` |
| `file-entry-cache` | `8.0.0` | `NOASSERTION` |
| `fill-range` | `7.1.1` | `NOASSERTION` |
| `filter-obj` | `1.1.0` | `NOASSERTION` |
| `finalhandler` | `1.1.2` | `NOASSERTION` |
| `finalhandler` | `2.1.1` | `NOASSERTION` |
| `find-up` | `3.0.0` | `NOASSERTION` |
| `find-up` | `4.1.0` | `NOASSERTION` |
| `find-up` | `5.0.0` | `NOASSERTION` |
| `flat-cache` | `4.0.1` | `NOASSERTION` |
| `flatted` | `3.4.2` | `NOASSERTION` |
| `flexsearch` | `0.8.212` | `NOASSERTION` |
| `flow-enums-runtime` | `0.0.6` | `NOASSERTION` |
| `fontfaceobserver` | `2.3.0` | `NOASSERTION` |
| `forwarded` | `0.2.0` | `NOASSERTION` |
| `framer-motion` | `12.42.2` | `NOASSERTION` |
| `fresh` | `0.5.2` | `NOASSERTION` |
| `fresh` | `2.0.0` | `NOASSERTION` |
| `fs-extra` | `11.3.6` | `NOASSERTION` |
| `fs-extra` | `7.0.1` | `NOASSERTION` |
| `fs-extra` | `8.1.0` | `NOASSERTION` |
| `fsevents` | `2.3.2` | `NOASSERTION` |
| `fsevents` | `2.3.3` | `NOASSERTION` |
| `fumadocs-core` | `16.11.3` | `NOASSERTION` |
| `fumadocs-mdx` | `15.1.0` | `NOASSERTION` |
| `function-bind` | `1.1.2` | `NOASSERTION` |
| `fuzzysort` | `3.1.0` | `NOASSERTION` |
| `gensync` | `1.0.0-beta.2` | `NOASSERTION` |
| `get-caller-file` | `2.0.5` | `NOASSERTION` |
| `get-east-asian-width` | `1.6.0` | `NOASSERTION` |
| `get-intrinsic` | `1.3.0` | `NOASSERTION` |
| `get-nonce` | `1.0.1` | `NOASSERTION` |
| `get-own-enumerable-keys` | `1.0.0` | `NOASSERTION` |
| `get-proto` | `1.0.1` | `NOASSERTION` |
| `get-stream` | `6.0.1` | `NOASSERTION` |
| `get-stream` | `9.0.1` | `NOASSERTION` |
| `get-tsconfig` | `4.14.0` | `NOASSERTION` |
| `get-tsconfig` | `5.0.0-beta.5` | `NOASSERTION` |
| `getenv` | `2.0.0` | `NOASSERTION` |
| `github-slugger` | `2.0.0` | `NOASSERTION` |
| `glob` | `13.0.6` | `NOASSERTION` |
| `glob-parent` | `5.1.2` | `NOASSERTION` |
| `glob-parent` | `6.0.2` | `NOASSERTION` |
| `globby` | `11.1.0` | `NOASSERTION` |
| `gopd` | `1.2.0` | `NOASSERTION` |
| `graceful-fs` | `4.2.11` | `NOASSERTION` |
| `has-flag` | `3.0.0` | `NOASSERTION` |
| `has-flag` | `4.0.0` | `NOASSERTION` |
| `has-symbols` | `1.1.0` | `NOASSERTION` |
| `hasown` | `2.0.4` | `NOASSERTION` |
| `hast-util-from-parse5` | `8.0.3` | `NOASSERTION` |
| `hast-util-parse-selector` | `4.0.0` | `NOASSERTION` |
| `hast-util-raw` | `9.1.0` | `NOASSERTION` |
| `hast-util-to-estree` | `3.1.3` | `NOASSERTION` |
| `hast-util-to-html` | `9.0.5` | `NOASSERTION` |
| `hast-util-to-jsx-runtime` | `2.3.6` | `NOASSERTION` |
| `hast-util-to-parse5` | `8.0.1` | `NOASSERTION` |
| `hast-util-whitespace` | `3.0.0` | `NOASSERTION` |
| `hastscript` | `9.0.1` | `NOASSERTION` |
| `hermes-compiler` | `250829098.0.14` | `NOASSERTION` |
| `hermes-estree` | `0.35.0` | `NOASSERTION` |
| `hermes-estree` | `0.36.0` | `NOASSERTION` |
| `hermes-parser` | `0.35.0` | `NOASSERTION` |
| `hermes-parser` | `0.36.0` | `NOASSERTION` |
| `hoist-non-react-statics` | `3.3.2` | `NOASSERTION` |
| `hono` | `4.12.29` | `NOASSERTION` |
| `hookable` | `6.1.1` | `NOASSERTION` |
| `hosted-git-info` | `7.0.2` | `NOASSERTION` |
| `html-void-elements` | `3.0.0` | `NOASSERTION` |
| `http-errors` | `2.0.1` | `NOASSERTION` |
| `https-proxy-agent` | `7.0.6` | `NOASSERTION` |
| `human-id` | `4.2.0` | `NOASSERTION` |
| `human-signals` | `2.1.0` | `NOASSERTION` |
| `human-signals` | `8.0.1` | `NOASSERTION` |
| `hyphenate-style-name` | `1.1.0` | `NOASSERTION` |
| `iconv-lite` | `0.7.3` | `NOASSERTION` |
| `ignore` | `5.3.2` | `NOASSERTION` |
| `image-size` | `1.2.1` | `NOASSERTION` |
| `import-fresh` | `3.3.1` | `NOASSERTION` |
| `import-without-cache` | `0.4.0` | `NOASSERTION` |
| `imurmurhash` | `0.1.4` | `NOASSERTION` |
| `indent-string` | `4.0.0` | `NOASSERTION` |
| `inherits` | `2.0.4` | `NOASSERTION` |
| `inline-style-parser` | `0.2.7` | `NOASSERTION` |
| `inline-style-prefixer` | `7.0.1` | `NOASSERTION` |
| `invariant` | `2.2.4` | `NOASSERTION` |
| `ip-address` | `10.2.0` | `NOASSERTION` |
| `ipaddr.js` | `1.9.1` | `NOASSERTION` |
| `is-alphabetical` | `2.0.1` | `NOASSERTION` |
| `is-alphanumerical` | `2.0.1` | `NOASSERTION` |
| `is-arrayish` | `0.2.1` | `NOASSERTION` |
| `is-arrayish` | `0.3.4` | `NOASSERTION` |
| `is-core-module` | `2.16.2` | `NOASSERTION` |
| `is-decimal` | `2.0.1` | `NOASSERTION` |
| `is-docker` | `2.2.1` | `NOASSERTION` |
| `is-docker` | `3.0.0` | `NOASSERTION` |
| `is-extglob` | `2.1.1` | `NOASSERTION` |
| `is-fullwidth-code-point` | `3.0.0` | `NOASSERTION` |
| `is-glob` | `4.0.3` | `NOASSERTION` |
| `is-hexadecimal` | `2.0.1` | `NOASSERTION` |
| `is-in-ssh` | `1.0.0` | `NOASSERTION` |
| `is-inside-container` | `1.0.0` | `NOASSERTION` |
| `is-interactive` | `2.0.0` | `NOASSERTION` |
| `is-number` | `7.0.0` | `NOASSERTION` |
| `is-obj` | `2.0.0` | `NOASSERTION` |
| `is-obj` | `3.0.0` | `NOASSERTION` |
| `is-plain-obj` | `4.1.0` | `NOASSERTION` |
| `is-promise` | `4.0.0` | `NOASSERTION` |
| `is-regexp` | `3.1.0` | `NOASSERTION` |
| `is-stream` | `2.0.1` | `NOASSERTION` |
| `is-stream` | `4.0.1` | `NOASSERTION` |
| `is-subdir` | `1.2.0` | `NOASSERTION` |
| `is-unicode-supported` | `1.3.0` | `NOASSERTION` |
| `is-unicode-supported` | `2.1.0` | `NOASSERTION` |
| `is-windows` | `1.0.2` | `NOASSERTION` |
| `is-wsl` | `2.2.0` | `NOASSERTION` |
| `is-wsl` | `3.1.1` | `NOASSERTION` |
| `isexe` | `2.0.0` | `NOASSERTION` |
| `isexe` | `3.1.5` | `NOASSERTION` |
| `jest-get-type` | `29.6.3` | `NOASSERTION` |
| `jest-util` | `29.7.0` | `NOASSERTION` |
| `jest-validate` | `29.7.0` | `NOASSERTION` |
| `jest-worker` | `29.7.0` | `NOASSERTION` |
| `jimp-compact` | `0.16.1` | `NOASSERTION` |
| `jiti` | `2.7.0` | `NOASSERTION` |
| `jose` | `6.2.3` | `NOASSERTION` |
| `js-tokens` | `4.0.0` | `NOASSERTION` |
| `js-yaml` | `3.15.0` | `NOASSERTION` |
| `js-yaml` | `4.3.0` | `NOASSERTION` |
| `js-yaml` | `5.2.1` | `NOASSERTION` |
| `jsc-safe-url` | `0.2.4` | `NOASSERTION` |
| `jsesc` | `3.1.0` | `NOASSERTION` |
| `json-buffer` | `3.0.1` | `NOASSERTION` |
| `json-parse-even-better-errors` | `2.3.1` | `NOASSERTION` |
| `json-schema-traverse` | `0.4.1` | `NOASSERTION` |
| `json-schema-traverse` | `1.0.0` | `NOASSERTION` |
| `json-schema-typed` | `7.0.3` | `NOASSERTION` |
| `json-schema-typed` | `8.0.2` | `NOASSERTION` |
| `json-stable-stringify-without-jsonify` | `1.0.1` | `NOASSERTION` |
| `json5` | `2.2.3` | `NOASSERTION` |
| `jsonc-parser` | `3.3.1` | `NOASSERTION` |
| `jsonfile` | `4.0.0` | `NOASSERTION` |
| `jsonfile` | `6.2.1` | `NOASSERTION` |
| `keyv` | `4.5.4` | `NOASSERTION` |
| `kleur` | `3.0.3` | `NOASSERTION` |
| `kleur` | `4.1.5` | `NOASSERTION` |
| `kysely` | `0.29.3` | `NOASSERTION` |
| `lan-network` | `0.2.1` | `NOASSERTION` |
| `leven` | `3.1.0` | `NOASSERTION` |
| `levn` | `0.4.1` | `NOASSERTION` |
| `lighthouse-logger` | `1.4.2` | `NOASSERTION` |
| `lightningcss` | `1.32.0` | `NOASSERTION` |
| `lightningcss-android-arm64` | `1.32.0` | `NOASSERTION` |
| `lightningcss-darwin-arm64` | `1.32.0` | `NOASSERTION` |
| `lightningcss-darwin-x64` | `1.32.0` | `NOASSERTION` |
| `lightningcss-freebsd-x64` | `1.32.0` | `NOASSERTION` |
| `lightningcss-linux-arm-gnueabihf` | `1.32.0` | `NOASSERTION` |
| `lightningcss-linux-arm64-gnu` | `1.32.0` | `NOASSERTION` |
| `lightningcss-linux-arm64-musl` | `1.32.0` | `NOASSERTION` |
| `lightningcss-linux-x64-gnu` | `1.32.0` | `NOASSERTION` |
| `lightningcss-linux-x64-musl` | `1.32.0` | `NOASSERTION` |
| `lightningcss-win32-arm64-msvc` | `1.32.0` | `NOASSERTION` |
| `lightningcss-win32-x64-msvc` | `1.32.0` | `NOASSERTION` |
| `lines-and-columns` | `1.2.4` | `NOASSERTION` |
| `locate-path` | `3.0.0` | `NOASSERTION` |
| `locate-path` | `5.0.0` | `NOASSERTION` |
| `locate-path` | `6.0.0` | `NOASSERTION` |
| `lodash.debounce` | `4.0.8` | `NOASSERTION` |
| `lodash.startcase` | `4.4.0` | `NOASSERTION` |
| `lodash.throttle` | `4.1.1` | `NOASSERTION` |
| `log-symbols` | `2.2.0` | `NOASSERTION` |
| `log-symbols` | `6.0.0` | `NOASSERTION` |
| `longest-streak` | `3.1.0` | `NOASSERTION` |
| `loose-envify` | `1.4.0` | `NOASSERTION` |
| `lru-cache` | `10.4.3` | `NOASSERTION` |
| `lru-cache` | `11.5.2` | `NOASSERTION` |
| `lru-cache` | `5.1.1` | `NOASSERTION` |
| `lucide-react` | `1.24.0` | `NOASSERTION` |
| `lz-string` | `1.5.0` | `NOASSERTION` |
| `magic-string` | `0.30.21` | `NOASSERTION` |
| `makeerror` | `1.0.12` | `NOASSERTION` |
| `markdown-extensions` | `2.0.0` | `NOASSERTION` |
| `markdown-table` | `3.0.4` | `NOASSERTION` |
| `marky` | `1.3.0` | `NOASSERTION` |
| `math-intrinsics` | `1.1.0` | `NOASSERTION` |
| `mdast-util-find-and-replace` | `3.0.2` | `NOASSERTION` |
| `mdast-util-from-markdown` | `2.0.3` | `NOASSERTION` |
| `mdast-util-gfm` | `3.1.0` | `NOASSERTION` |
| `mdast-util-gfm-autolink-literal` | `2.0.1` | `NOASSERTION` |
| `mdast-util-gfm-footnote` | `2.1.0` | `NOASSERTION` |
| `mdast-util-gfm-strikethrough` | `2.0.0` | `NOASSERTION` |
| `mdast-util-gfm-table` | `2.0.0` | `NOASSERTION` |
| `mdast-util-gfm-task-list-item` | `2.0.0` | `NOASSERTION` |
| `mdast-util-mdx` | `3.0.0` | `NOASSERTION` |
| `mdast-util-mdx-expression` | `2.0.1` | `NOASSERTION` |
| `mdast-util-mdx-jsx` | `3.2.0` | `NOASSERTION` |
| `mdast-util-mdxjs-esm` | `2.0.1` | `NOASSERTION` |
| `mdast-util-phrasing` | `4.1.0` | `NOASSERTION` |
| `mdast-util-to-hast` | `13.2.1` | `NOASSERTION` |
| `mdast-util-to-markdown` | `2.1.2` | `NOASSERTION` |
| `mdast-util-to-string` | `4.0.0` | `NOASSERTION` |
| `media-typer` | `1.1.0` | `NOASSERTION` |
| `memoize-one` | `5.2.1` | `NOASSERTION` |
| `memoize-one` | `6.0.0` | `NOASSERTION` |
| `merge-descriptors` | `2.0.0` | `NOASSERTION` |
| `merge-stream` | `2.0.0` | `NOASSERTION` |
| `merge2` | `1.4.1` | `NOASSERTION` |
| `metro` | `0.84.4` | `NOASSERTION` |
| `metro-babel-transformer` | `0.84.4` | `NOASSERTION` |
| `metro-cache` | `0.84.4` | `NOASSERTION` |
| `metro-cache-key` | `0.84.4` | `NOASSERTION` |
| `metro-config` | `0.84.4` | `NOASSERTION` |
| `metro-core` | `0.84.4` | `NOASSERTION` |
| `metro-file-map` | `0.84.4` | `NOASSERTION` |
| `metro-minify-terser` | `0.84.4` | `NOASSERTION` |
| `metro-resolver` | `0.84.4` | `NOASSERTION` |
| `metro-runtime` | `0.84.4` | `NOASSERTION` |
| `metro-source-map` | `0.84.4` | `NOASSERTION` |
| `metro-symbolicate` | `0.84.4` | `NOASSERTION` |
| `metro-transform-plugins` | `0.84.4` | `NOASSERTION` |
| `metro-transform-worker` | `0.84.4` | `NOASSERTION` |
| `micromark` | `4.0.2` | `NOASSERTION` |
| `micromark-core-commonmark` | `2.0.3` | `NOASSERTION` |
| `micromark-extension-gfm` | `3.0.0` | `NOASSERTION` |
| `micromark-extension-gfm-autolink-literal` | `2.1.0` | `NOASSERTION` |
| `micromark-extension-gfm-footnote` | `2.1.0` | `NOASSERTION` |
| `micromark-extension-gfm-strikethrough` | `2.1.0` | `NOASSERTION` |
| `micromark-extension-gfm-table` | `2.1.1` | `NOASSERTION` |
| `micromark-extension-gfm-tagfilter` | `2.0.0` | `NOASSERTION` |
| `micromark-extension-gfm-task-list-item` | `2.1.0` | `NOASSERTION` |
| `micromark-extension-mdx-expression` | `3.0.1` | `NOASSERTION` |
| `micromark-extension-mdx-jsx` | `3.0.2` | `NOASSERTION` |
| `micromark-extension-mdx-md` | `2.0.0` | `NOASSERTION` |
| `micromark-extension-mdxjs` | `3.0.0` | `NOASSERTION` |
| `micromark-extension-mdxjs-esm` | `3.0.0` | `NOASSERTION` |
| `micromark-factory-destination` | `2.0.1` | `NOASSERTION` |
| `micromark-factory-label` | `2.0.1` | `NOASSERTION` |
| `micromark-factory-mdx-expression` | `2.0.3` | `NOASSERTION` |
| `micromark-factory-space` | `2.0.1` | `NOASSERTION` |
| `micromark-factory-title` | `2.0.1` | `NOASSERTION` |
| `micromark-factory-whitespace` | `2.0.1` | `NOASSERTION` |
| `micromark-util-character` | `2.1.1` | `NOASSERTION` |
| `micromark-util-chunked` | `2.0.1` | `NOASSERTION` |
| `micromark-util-classify-character` | `2.0.1` | `NOASSERTION` |
| `micromark-util-combine-extensions` | `2.0.1` | `NOASSERTION` |
| `micromark-util-decode-numeric-character-reference` | `2.0.2` | `NOASSERTION` |
| `micromark-util-decode-string` | `2.0.1` | `NOASSERTION` |
| `micromark-util-encode` | `2.0.1` | `NOASSERTION` |
| `micromark-util-events-to-acorn` | `2.0.3` | `NOASSERTION` |
| `micromark-util-html-tag-name` | `2.0.1` | `NOASSERTION` |
| `micromark-util-normalize-identifier` | `2.0.1` | `NOASSERTION` |
| `micromark-util-resolve-all` | `2.0.1` | `NOASSERTION` |
| `micromark-util-sanitize-uri` | `2.0.1` | `NOASSERTION` |
| `micromark-util-subtokenize` | `2.1.0` | `NOASSERTION` |
| `micromark-util-symbol` | `2.0.1` | `NOASSERTION` |
| `micromark-util-types` | `2.0.2` | `NOASSERTION` |
| `micromatch` | `4.0.8` | `NOASSERTION` |
| `mime` | `1.6.0` | `NOASSERTION` |
| `mime-db` | `1.52.0` | `NOASSERTION` |
| `mime-db` | `1.54.0` | `NOASSERTION` |
| `mime-types` | `2.1.35` | `NOASSERTION` |
| `mime-types` | `3.0.2` | `NOASSERTION` |
| `mimic-fn` | `1.2.0` | `NOASSERTION` |
| `mimic-fn` | `2.1.0` | `NOASSERTION` |
| `mimic-fn` | `3.1.0` | `NOASSERTION` |
| `mimic-function` | `5.0.1` | `NOASSERTION` |
| `min-indent` | `1.0.1` | `NOASSERTION` |
| `minimatch` | `10.2.5` | `NOASSERTION` |
| `minimist` | `1.2.8` | `NOASSERTION` |
| `minipass` | `7.1.3` | `NOASSERTION` |
| `mkdirp` | `1.0.4` | `NOASSERTION` |
| `motion` | `12.42.2` | `NOASSERTION` |
| `motion-dom` | `12.42.2` | `NOASSERTION` |
| `motion-utils` | `12.39.0` | `NOASSERTION` |
| `mri` | `1.2.0` | `NOASSERTION` |
| `ms` | `2.0.0` | `NOASSERTION` |
| `ms` | `2.1.3` | `NOASSERTION` |
| `multitars` | `1.0.0` | `NOASSERTION` |
| `nanoid` | `3.3.16` | `NOASSERTION` |
| `nanostores` | `1.4.0` | `NOASSERTION` |
| `natural-compare` | `1.4.0` | `NOASSERTION` |
| `negotiator` | `0.6.3` | `NOASSERTION` |
| `negotiator` | `0.6.4` | `NOASSERTION` |
| `negotiator` | `1.0.0` | `NOASSERTION` |
| `next` | `16.2.11` | `NOASSERTION` |
| `next-themes` | `0.4.6` | `NOASSERTION` |
| `node-fetch` | `2.7.0` | `NOASSERTION` |
| `node-forge` | `1.4.0` | `NOASSERTION` |
| `node-int64` | `0.4.0` | `NOASSERTION` |
| `node-releases` | `2.0.51` | `NOASSERTION` |
| `npm-package-arg` | `11.0.3` | `NOASSERTION` |
| `npm-run-path` | `4.0.1` | `NOASSERTION` |
| `npm-run-path` | `6.0.0` | `NOASSERTION` |
| `nullthrows` | `1.1.1` | `NOASSERTION` |
| `nypm` | `0.6.8` | `NOASSERTION` |
| `ob1` | `0.84.4` | `NOASSERTION` |
| `object-assign` | `4.1.1` | `NOASSERTION` |
| `object-inspect` | `1.13.4` | `NOASSERTION` |
| `object-treeify` | `1.1.33` | `NOASSERTION` |
| `obug` | `2.1.3` | `NOASSERTION` |
| `on-finished` | `2.3.0` | `NOASSERTION` |
| `on-finished` | `2.4.1` | `NOASSERTION` |
| `on-headers` | `1.1.0` | `NOASSERTION` |
| `once` | `1.4.0` | `NOASSERTION` |
| `onetime` | `2.0.1` | `NOASSERTION` |
| `onetime` | `5.1.2` | `NOASSERTION` |
| `onetime` | `7.0.0` | `NOASSERTION` |
| `oniguruma-parser` | `0.12.2` | `NOASSERTION` |
| `oniguruma-to-es` | `4.3.6` | `NOASSERTION` |
| `open` | `11.0.0` | `NOASSERTION` |
| `open` | `7.4.2` | `NOASSERTION` |
| `open` | `8.4.2` | `NOASSERTION` |
| `openapi-types` | `12.1.3` | `NOASSERTION` |
| `optionator` | `0.9.4` | `NOASSERTION` |
| `ora` | `3.4.0` | `NOASSERTION` |
| `ora` | `8.2.0` | `NOASSERTION` |
| `outdent` | `0.5.0` | `NOASSERTION` |
| `p-filter` | `2.1.0` | `NOASSERTION` |
| `p-limit` | `2.3.0` | `NOASSERTION` |
| `p-limit` | `3.1.0` | `NOASSERTION` |
| `p-locate` | `3.0.0` | `NOASSERTION` |
| `p-locate` | `4.1.0` | `NOASSERTION` |
| `p-locate` | `5.0.0` | `NOASSERTION` |
| `p-map` | `2.1.0` | `NOASSERTION` |
| `p-try` | `2.2.0` | `NOASSERTION` |
| `package-manager-detector` | `0.2.11` | `NOASSERTION` |
| `parent-module` | `1.0.1` | `NOASSERTION` |
| `parse-entities` | `4.0.2` | `NOASSERTION` |
| `parse-json` | `5.2.0` | `NOASSERTION` |
| `parse-ms` | `4.0.0` | `NOASSERTION` |
| `parse-png` | `2.1.0` | `NOASSERTION` |
| `parse5` | `7.3.0` | `NOASSERTION` |
| `parseurl` | `1.3.3` | `NOASSERTION` |
| `path-browserify` | `1.0.1` | `NOASSERTION` |
| `path-exists` | `3.0.0` | `NOASSERTION` |
| `path-exists` | `4.0.0` | `NOASSERTION` |
| `path-key` | `3.1.1` | `NOASSERTION` |
| `path-key` | `4.0.0` | `NOASSERTION` |
| `path-parse` | `1.0.7` | `NOASSERTION` |
| `path-scurry` | `2.0.2` | `NOASSERTION` |
| `path-to-regexp` | `8.4.2` | `NOASSERTION` |
| `path-type` | `4.0.0` | `NOASSERTION` |
| `pathe` | `2.0.3` | `NOASSERTION` |
| `pg` | `8.22.0` | `NOASSERTION` |
| `pg-cloudflare` | `1.4.0` | `NOASSERTION` |
| `pg-connection-string` | `2.14.0` | `NOASSERTION` |
| `pg-int8` | `1.0.1` | `NOASSERTION` |
| `pg-pool` | `3.14.0` | `NOASSERTION` |
| `pg-protocol` | `1.15.0` | `NOASSERTION` |
| `pg-types` | `2.2.0` | `NOASSERTION` |
| `pgpass` | `1.0.5` | `NOASSERTION` |
| `picocolors` | `1.1.1` | `NOASSERTION` |
| `picomatch` | `2.3.2` | `NOASSERTION` |
| `picomatch` | `4.0.5` | `NOASSERTION` |
| `pify` | `4.0.1` | `NOASSERTION` |
| `pkce-challenge` | `5.0.1` | `NOASSERTION` |
| `pkg-up` | `3.1.0` | `NOASSERTION` |
| `playwright` | `1.61.1` | `NOASSERTION` |
| `playwright-core` | `1.61.1` | `NOASSERTION` |
| `plist` | `3.1.1` | `NOASSERTION` |
| `pngjs` | `3.4.0` | `NOASSERTION` |
| `postcss` | `8.5.17` | `NOASSERTION` |
| `postcss-selector-parser` | `7.1.4` | `NOASSERTION` |
| `postcss-value-parser` | `4.2.0` | `NOASSERTION` |
| `postgres-array` | `2.0.0` | `NOASSERTION` |
| `postgres-bytea` | `1.0.1` | `NOASSERTION` |
| `postgres-date` | `1.0.7` | `NOASSERTION` |
| `postgres-interval` | `1.2.0` | `NOASSERTION` |
| `powershell-utils` | `0.1.0` | `NOASSERTION` |
| `prelude-ls` | `1.2.1` | `NOASSERTION` |
| `prettier` | `2.8.8` | `NOASSERTION` |
| `pretty-format` | `27.5.1` | `NOASSERTION` |
| `pretty-format` | `29.7.0` | `NOASSERTION` |
| `pretty-ms` | `9.3.0` | `NOASSERTION` |
| `proc-log` | `4.2.0` | `NOASSERTION` |
| `progress` | `2.0.3` | `NOASSERTION` |
| `promise` | `7.3.1` | `NOASSERTION` |
| `promise` | `8.3.0` | `NOASSERTION` |
| `prompts` | `2.4.2` | `NOASSERTION` |
| `property-information` | `7.2.0` | `NOASSERTION` |
| `proxy-addr` | `2.0.7` | `NOASSERTION` |
| `punycode` | `2.3.1` | `NOASSERTION` |
| `pvtsutils` | `1.3.6` | `NOASSERTION` |
| `pvutils` | `1.1.5` | `NOASSERTION` |
| `qs` | `6.15.3` | `NOASSERTION` |
| `quansync` | `0.2.11` | `NOASSERTION` |
| `quansync` | `1.0.0` | `NOASSERTION` |
| `query-string` | `7.1.3` | `NOASSERTION` |
| `queue` | `6.0.2` | `NOASSERTION` |
| `queue-microtask` | `1.2.3` | `NOASSERTION` |
| `radash` | `12.1.1` | `NOASSERTION` |
| `range-parser` | `1.2.1` | `NOASSERTION` |
| `range-parser` | `1.3.0` | `NOASSERTION` |
| `raw-body` | `3.0.2` | `NOASSERTION` |
| `react` | `19.2.3` | `NOASSERTION` |
| `react` | `19.2.7` | `NOASSERTION` |
| `react-devtools-core` | `6.1.5` | `NOASSERTION` |
| `react-dom` | `19.2.3` | `NOASSERTION` |
| `react-dom` | `19.2.7` | `NOASSERTION` |
| `react-fast-compare` | `3.2.2` | `NOASSERTION` |
| `react-freeze` | `1.0.4` | `NOASSERTION` |
| `react-is` | `16.13.1` | `NOASSERTION` |
| `react-is` | `17.0.2` | `NOASSERTION` |
| `react-is` | `18.3.1` | `NOASSERTION` |
| `react-is` | `19.2.7` | `NOASSERTION` |
| `react-native` | `0.86.0` | `NOASSERTION` |
| `react-native-drawer-layout` | `4.2.7` | `NOASSERTION` |
| `react-native-gesture-handler` | `2.32.0` | `NOASSERTION` |
| `react-native-is-edge-to-edge` | `1.3.1` | `NOASSERTION` |
| `react-native-reanimated` | `4.5.0` | `NOASSERTION` |
| `react-native-safe-area-context` | `5.7.0` | `NOASSERTION` |
| `react-native-screens` | `4.25.2` | `NOASSERTION` |
| `react-native-web` | `0.21.2` | `NOASSERTION` |
| `react-native-worklets` | `0.10.0` | `NOASSERTION` |
| `react-refresh` | `0.14.2` | `NOASSERTION` |
| `react-remove-scroll` | `2.7.2` | `NOASSERTION` |
| `react-remove-scroll-bar` | `2.3.8` | `NOASSERTION` |
| `react-style-singleton` | `2.2.3` | `NOASSERTION` |
| `read-yaml-file` | `1.1.0` | `NOASSERTION` |
| `readdirp` | `5.0.0` | `NOASSERTION` |
| `recast` | `0.23.12` | `NOASSERTION` |
| `recma-build-jsx` | `1.0.0` | `NOASSERTION` |
| `recma-jsx` | `1.0.1` | `NOASSERTION` |
| `recma-parse` | `1.0.0` | `NOASSERTION` |
| `recma-stringify` | `1.0.0` | `NOASSERTION` |
| `redent` | `3.0.0` | `NOASSERTION` |
| `reflect-metadata` | `0.2.2` | `NOASSERTION` |
| `regenerate` | `1.4.2` | `NOASSERTION` |
| `regenerate-unicode-properties` | `10.2.2` | `NOASSERTION` |
| `regenerator-runtime` | `0.13.11` | `NOASSERTION` |
| `regex` | `6.1.0` | `NOASSERTION` |
| `regex-recursion` | `6.0.2` | `NOASSERTION` |
| `regex-utilities` | `2.3.0` | `NOASSERTION` |
| `regexpu-core` | `6.4.0` | `NOASSERTION` |
| `regjsgen` | `0.8.0` | `NOASSERTION` |
| `regjsparser` | `0.13.2` | `NOASSERTION` |
| `rehype-raw` | `7.0.0` | `NOASSERTION` |
| `rehype-recma` | `1.0.0` | `NOASSERTION` |
| `remark` | `15.0.1` | `NOASSERTION` |
| `remark-gfm` | `4.0.1` | `NOASSERTION` |
| `remark-mdx` | `3.1.1` | `NOASSERTION` |
| `remark-parse` | `11.0.0` | `NOASSERTION` |
| `remark-rehype` | `11.1.2` | `NOASSERTION` |
| `remark-stringify` | `11.0.0` | `NOASSERTION` |
| `require-directory` | `2.1.1` | `NOASSERTION` |
| `require-from-string` | `2.0.2` | `NOASSERTION` |
| `reselect` | `5.2.0` | `NOASSERTION` |
| `resolve` | `1.22.12` | `NOASSERTION` |
| `resolve-from` | `4.0.0` | `NOASSERTION` |
| `resolve-from` | `5.0.0` | `NOASSERTION` |
| `resolve-pkg-maps` | `1.0.0` | `NOASSERTION` |
| `resolve-workspace-root` | `2.0.1` | `NOASSERTION` |
| `restore-cursor` | `2.0.0` | `NOASSERTION` |
| `restore-cursor` | `5.1.0` | `NOASSERTION` |
| `reusify` | `1.1.0` | `NOASSERTION` |
| `rolldown` | `1.1.5` | `NOASSERTION` |
| `rolldown-plugin-dts` | `0.27.9` | `NOASSERTION` |
| `rou3` | `0.7.12` | `NOASSERTION` |
| `router` | `2.2.0` | `NOASSERTION` |
| `run-applescript` | `7.1.0` | `NOASSERTION` |
| `run-parallel` | `1.2.0` | `NOASSERTION` |
| `safe-buffer` | `5.2.1` | `NOASSERTION` |
| `safer-buffer` | `2.1.2` | `NOASSERTION` |
| `sax` | `1.6.0` | `NOASSERTION` |
| `scheduler` | `0.27.0` | `NOASSERTION` |
| `scroll-into-view-if-needed` | `3.1.0` | `NOASSERTION` |
| `semver` | `6.3.1` | `NOASSERTION` |
| `semver` | `7.8.5` | `NOASSERTION` |
| `send` | `0.19.2` | `NOASSERTION` |
| `send` | `1.2.1` | `NOASSERTION` |
| `serialize-error` | `2.1.0` | `NOASSERTION` |
| `serve-static` | `1.16.3` | `NOASSERTION` |
| `serve-static` | `2.2.1` | `NOASSERTION` |
| `server-only` | `0.0.1` | `NOASSERTION` |
| `set-cookie-parser` | `3.1.2` | `NOASSERTION` |
| `setimmediate` | `1.0.5` | `NOASSERTION` |
| `setprototypeof` | `1.2.0` | `NOASSERTION` |
| `sf-symbols-typescript` | `2.2.0` | `NOASSERTION` |
| `shadcn` | `4.13.0` | `NOASSERTION` |
| `shallowequal` | `1.1.0` | `NOASSERTION` |
| `sharp` | `0.35.3` | `NOASSERTION` |
| `shebang-command` | `2.0.0` | `NOASSERTION` |
| `shebang-regex` | `3.0.0` | `NOASSERTION` |
| `shell-quote` | `1.10.0` | `NOASSERTION` |
| `shiki` | `4.3.1` | `NOASSERTION` |
| `side-channel` | `1.1.1` | `NOASSERTION` |
| `side-channel-list` | `1.0.1` | `NOASSERTION` |
| `side-channel-map` | `1.0.1` | `NOASSERTION` |
| `side-channel-weakmap` | `1.0.2` | `NOASSERTION` |
| `siginfo` | `2.0.0` | `NOASSERTION` |
| `signal-exit` | `3.0.7` | `NOASSERTION` |
| `signal-exit` | `4.1.0` | `NOASSERTION` |
| `simple-plist` | `1.3.1` | `NOASSERTION` |
| `simple-swizzle` | `0.2.4` | `NOASSERTION` |
| `sisteransi` | `1.0.5` | `NOASSERTION` |
| `slash` | `3.0.0` | `NOASSERTION` |
| `slugify` | `1.6.9` | `NOASSERTION` |
| `sonner` | `2.0.7` | `NOASSERTION` |
| `source-map` | `0.5.7` | `NOASSERTION` |
| `source-map` | `0.6.1` | `NOASSERTION` |
| `source-map` | `0.7.6` | `NOASSERTION` |
| `source-map-js` | `1.2.1` | `NOASSERTION` |
| `source-map-support` | `0.5.21` | `NOASSERTION` |
| `space-separated-tokens` | `2.0.2` | `NOASSERTION` |
| `spawndamnit` | `3.0.1` | `NOASSERTION` |
| `split-on-first` | `1.1.0` | `NOASSERTION` |
| `split2` | `4.2.0` | `NOASSERTION` |
| `sprintf-js` | `1.0.3` | `NOASSERTION` |
| `stackback` | `0.0.2` | `NOASSERTION` |
| `stackframe` | `1.3.4` | `NOASSERTION` |
| `stacktrace-parser` | `0.1.11` | `NOASSERTION` |
| `standard-navigation` | `0.0.5` | `NOASSERTION` |
| `statuses` | `1.5.0` | `NOASSERTION` |
| `statuses` | `2.0.2` | `NOASSERTION` |
| `std-env` | `4.2.0` | `NOASSERTION` |
| `stdin-discarder` | `0.2.2` | `NOASSERTION` |
| `stream-buffers` | `2.2.0` | `NOASSERTION` |
| `strict-uri-encode` | `2.0.0` | `NOASSERTION` |
| `string-width` | `4.2.3` | `NOASSERTION` |
| `string-width` | `7.2.0` | `NOASSERTION` |
| `stringify-entities` | `4.0.4` | `NOASSERTION` |
| `stringify-object` | `5.0.0` | `NOASSERTION` |
| `strip-ansi` | `5.2.0` | `NOASSERTION` |
| `strip-ansi` | `6.0.1` | `NOASSERTION` |
| `strip-ansi` | `7.2.0` | `NOASSERTION` |
| `strip-bom` | `3.0.0` | `NOASSERTION` |
| `strip-final-newline` | `2.0.0` | `NOASSERTION` |
| `strip-final-newline` | `4.0.0` | `NOASSERTION` |
| `strip-indent` | `3.0.0` | `NOASSERTION` |
| `structured-headers` | `0.4.1` | `NOASSERTION` |
| `style-to-js` | `1.1.21` | `NOASSERTION` |
| `style-to-object` | `1.0.14` | `NOASSERTION` |
| `styled-jsx` | `5.1.6` | `NOASSERTION` |
| `styleq` | `0.1.3` | `NOASSERTION` |
| `supports-color` | `5.5.0` | `NOASSERTION` |
| `supports-color` | `7.2.0` | `NOASSERTION` |
| `supports-color` | `8.1.1` | `NOASSERTION` |
| `supports-hyperlinks` | `2.3.0` | `NOASSERTION` |
| `supports-preserve-symlinks-flag` | `1.0.0` | `NOASSERTION` |
| `systeminformation` | `5.31.17` | `NOASSERTION` |
| `tagged-tag` | `1.0.0` | `NOASSERTION` |
| `tailwind-merge` | `3.6.0` | `NOASSERTION` |
| `tailwindcss` | `4.3.2` | `NOASSERTION` |
| `tapable` | `2.3.3` | `NOASSERTION` |
| `term-size` | `2.2.1` | `NOASSERTION` |
| `terminal-link` | `2.1.1` | `NOASSERTION` |
| `terser` | `5.49.0` | `NOASSERTION` |
| `throat` | `5.0.0` | `NOASSERTION` |
| `tiny-invariant` | `1.3.3` | `NOASSERTION` |
| `tinybench` | `2.9.0` | `NOASSERTION` |
| `tinyexec` | `1.2.4` | `NOASSERTION` |
| `tinyglobby` | `0.2.17` | `NOASSERTION` |
| `tinyrainbow` | `3.1.0` | `NOASSERTION` |
| `tmpl` | `1.0.5` | `NOASSERTION` |
| `to-regex-range` | `5.0.1` | `NOASSERTION` |
| `toidentifier` | `1.0.1` | `NOASSERTION` |
| `toqr` | `0.1.1` | `NOASSERTION` |
| `tr46` | `0.0.3` | `NOASSERTION` |
| `tree-kill` | `1.2.2` | `NOASSERTION` |
| `trim-lines` | `3.0.1` | `NOASSERTION` |
| `trough` | `2.2.0` | `NOASSERTION` |
| `ts-api-utils` | `2.5.0` | `NOASSERTION` |
| `ts-morph` | `26.0.0` | `NOASSERTION` |
| `tsconfig-paths` | `4.2.0` | `NOASSERTION` |
| `tsdown` | `0.22.7` | `NOASSERTION` |
| `tslib` | `1.14.1` | `NOASSERTION` |
| `tslib` | `2.8.1` | `NOASSERTION` |
| `tsx` | `4.21.0` | `NOASSERTION` |
| `tsx` | `4.23.1` | `NOASSERTION` |
| `tsyringe` | `4.10.0` | `NOASSERTION` |
| `turbo` | `2.10.5` | `NOASSERTION` |
| `tw-animate-css` | `1.4.0` | `NOASSERTION` |
| `type-check` | `0.4.0` | `NOASSERTION` |
| `type-fest` | `0.21.3` | `NOASSERTION` |
| `type-fest` | `0.7.1` | `NOASSERTION` |
| `type-fest` | `5.8.0` | `NOASSERTION` |
| `type-is` | `2.1.0` | `NOASSERTION` |
| `typescript` | `6.0.3` | `NOASSERTION` |
| `ua-parser-js` | `1.0.41` | `NOASSERTION` |
| `ultracite` | `7.9.3` | `NOASSERTION` |
| `unconfig-core` | `7.5.0` | `NOASSERTION` |
| `undici` | `7.28.0` | `NOASSERTION` |
| `undici-types` | `6.21.0` | `NOASSERTION` |
| `undici-types` | `8.3.0` | `NOASSERTION` |
| `unicode-canonical-property-names-ecmascript` | `2.0.1` | `NOASSERTION` |
| `unicode-match-property-ecmascript` | `2.0.0` | `NOASSERTION` |
| `unicode-match-property-value-ecmascript` | `2.2.1` | `NOASSERTION` |
| `unicode-property-aliases-ecmascript` | `2.2.0` | `NOASSERTION` |
| `unicorn-magic` | `0.3.0` | `NOASSERTION` |
| `unified` | `11.0.5` | `NOASSERTION` |
| `unist-util-is` | `6.0.1` | `NOASSERTION` |
| `unist-util-position` | `5.0.0` | `NOASSERTION` |
| `unist-util-position-from-estree` | `2.0.0` | `NOASSERTION` |
| `unist-util-remove-position` | `5.0.0` | `NOASSERTION` |
| `unist-util-stringify-position` | `4.0.0` | `NOASSERTION` |
| `unist-util-visit` | `5.1.0` | `NOASSERTION` |
| `unist-util-visit-parents` | `6.0.2` | `NOASSERTION` |
| `universalify` | `0.1.2` | `NOASSERTION` |
| `universalify` | `2.0.1` | `NOASSERTION` |
| `unpipe` | `1.0.0` | `NOASSERTION` |
| `update-browserslist-db` | `1.2.3` | `NOASSERTION` |
| `uri-js` | `4.4.1` | `NOASSERTION` |
| `use-callback-ref` | `1.3.3` | `NOASSERTION` |
| `use-latest-callback` | `0.2.6` | `NOASSERTION` |
| `use-sidecar` | `1.1.3` | `NOASSERTION` |
| `use-sync-external-store` | `1.6.0` | `NOASSERTION` |
| `util-deprecate` | `1.0.2` | `NOASSERTION` |
| `utils-merge` | `1.0.1` | `NOASSERTION` |
| `uuid` | `14.0.1` | `NOASSERTION` |
| `validate-npm-package-name` | `5.0.1` | `NOASSERTION` |
| `validate-npm-package-name` | `7.0.2` | `NOASSERTION` |
| `vary` | `1.1.2` | `NOASSERTION` |
| `vaul` | `1.1.2` | `NOASSERTION` |
| `vfile` | `6.0.3` | `NOASSERTION` |
| `vfile-location` | `5.0.3` | `NOASSERTION` |
| `vfile-message` | `4.0.3` | `NOASSERTION` |
| `vite` | `8.1.4` | `NOASSERTION` |
| `vitest` | `4.1.10` | `NOASSERTION` |
| `vlq` | `1.0.1` | `NOASSERTION` |
| `walker` | `1.0.8` | `NOASSERTION` |
| `warn-once` | `0.1.1` | `NOASSERTION` |
| `wcwidth` | `1.0.1` | `NOASSERTION` |
| `web-namespaces` | `2.0.1` | `NOASSERTION` |
| `webidl-conversions` | `3.0.1` | `NOASSERTION` |
| `whatwg-fetch` | `3.6.20` | `NOASSERTION` |
| `whatwg-url` | `5.0.0` | `NOASSERTION` |
| `whatwg-url-minimum` | `0.1.2` | `NOASSERTION` |
| `which` | `2.0.2` | `NOASSERTION` |
| `which` | `4.0.0` | `NOASSERTION` |
| `why-is-node-running` | `2.3.0` | `NOASSERTION` |
| `wildcard-match` | `5.1.4` | `NOASSERTION` |
| `word-wrap` | `1.2.5` | `NOASSERTION` |
| `wrap-ansi` | `7.0.0` | `NOASSERTION` |
| `wrappy` | `1.0.2` | `NOASSERTION` |
| `ws` | `7.5.11` | `NOASSERTION` |
| `ws` | `8.21.0` | `NOASSERTION` |
| `wsl-utils` | `0.3.1` | `NOASSERTION` |
| `xcode` | `3.0.1` | `NOASSERTION` |
| `xml2js` | `0.6.0` | `NOASSERTION` |
| `xmlbuilder` | `11.0.1` | `NOASSERTION` |
| `xmlbuilder` | `15.1.1` | `NOASSERTION` |
| `xtend` | `4.0.2` | `NOASSERTION` |
| `y18n` | `5.0.8` | `NOASSERTION` |
| `yallist` | `3.1.1` | `NOASSERTION` |
| `yaml` | `2.9.0` | `NOASSERTION` |
| `yargs` | `17.7.3` | `NOASSERTION` |
| `yargs-parser` | `21.1.1` | `NOASSERTION` |
| `yocto-queue` | `0.1.0` | `NOASSERTION` |
| `yocto-spinner` | `1.2.1` | `NOASSERTION` |
| `yoctocolors` | `2.1.2` | `NOASSERTION` |
| `yuku-ast` | `0.1.7` | `NOASSERTION` |
| `yuku-codegen` | `0.6.1` | `NOASSERTION` |
| `yuku-parser` | `0.6.1` | `NOASSERTION` |
| `zod` | `3.25.76` | `NOASSERTION` |
| `zod` | `4.4.3` | `NOASSERTION` |
| `zod-to-json-schema` | `3.25.2` | `NOASSERTION` |
| `zwitch` | `2.0.4` | `NOASSERTION` |

Generated by `python scripts/generate_third_party.py`.
