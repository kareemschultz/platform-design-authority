# Meridian Implementation Conflicts

## oRPC Release Tag and Package-Family Availability

Plan requirement: pin Bun 1.3.14, Hono 4.12.29, oRPC 1.14.8, and Lucide 1.24.0.

Observed during remediation on 2026-07-12:

```bash
bun pm view @orpc/server versions --json
bun pm view @orpc/client versions --json
bun pm view @orpc/openapi versions --json
bun pm view @orpc/zod versions --json
bun pm view @orpc/tanstack-query versions --json
```

The highest published stable 1.x version available for these packages was `1.14.7`; `1.14.8` was not published for the packages used by this scaffold. The next visible line was `2.0.0-beta.*`, which ADR-0020 and PDA-ENGR-013 keep out of the critical prototype path.

Reverified after repository normalization on 2026-07-12: each of the five scoped package `version` queries still returned `1.14.7`. The upstream repository's general `v1.14.8` tag is retained as contextual release evidence, not as proof that the separately published package family exists at that number.

Disposition: the prototype pins the coherent stable `1.14.7` package set. The architecture authority now distinguishes the upstream/general release tag from package-family availability. No upgrade to `1.14.8` is expected unless all scoped packages publish a reviewed coherent set; any later version change follows the normal technology-evidence and compatibility gates.

## Better-T-Stack dry-run output rewrites the package selector

The governed Better-T-Stack 3.36.3 dry run passed on 2026-07-12 with `--addons pwa turborepo ultracite --examples none` and wrote zero files. Although the process was invoked with `bun create better-t-stack@3.36.3`, the tool's JSON result emitted a `reproducibleCommand` containing `better-t-stack@latest`.

Disposition: treat the emitted `@latest` command as an upstream 3.36.3 reporting defect, not as repository authority. `README.md` and `bts.jsonc` retain the exact manually pinned invocation that was actually executed. Recheck this behaviour before adopting a later scaffold version.

## Transitive security overrides

The root lock forces `esbuild 0.28.1`, `postcss 8.5.17`, and `uuid 14.0.1` to avoid older vulnerable transitive resolutions reported during remediation. These are temporary controlled-prototype overrides, not platform-wide production authority.

Compatibility evidence is the frozen Bun install, uncached type and test runs, production builds for web/server/Fumadocs, and Docker builds. Remove each override once all direct dependants naturally resolve an equal or newer non-vulnerable version; do not carry them forward without rerunning those gates.
