---
document_id: PDA-STR-031
title: Third-Party Notices, SBOM, and Asset Provenance Baseline
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0026]
---

# Third-Party Notices, SBOM, and Asset Provenance Baseline

## Authority and claim boundary

This document records bounded technical progress on issue [#93](https://github.com/kareemschultz/platform-design-authority/issues/93), opened from PDA-REV-019. It does not close that issue, ratify a source/documentation license, prove copyright ownership, establish legal approval, authorize external contributions or distribution, approve a public `@meridian/*` scope, or close FDR-002/FDR-005/FDR-009/FDR-011.

The repository intentionally has no root `LICENSE`; every tracked package manifest remains `private: true`. All repository license conclusions remain `NOASSERTION`, even where immutable upstream evidence records a declared license.

## Deterministic technical baseline

`third_party/provenance.json` is the reviewed public-safe source. `scripts/generate_third_party.py` uses only tracked repository source and `bun.lock` to:

- inventory every external lock resolution, including optional platform records, selectors, integrity, and declared dependency metadata;
- generate CycloneDX 1.6 **direct declared manifest** SBOMs for docs, native, server, web, and worker, marking composition `incomplete` and intentionally omitting unique serial numbers for deterministic source-baseline regeneration while requiring RFC-4122 serials for later artifact BOMs;
- map every governed copied-source and retained-asset path to exact source family, modification/distribution status, and SHA-256;
- generate `THIRD_PARTY_NOTICES.md` as a controlled-prototype baseline, not a distribution-ready notice/license-text bundle;
- reject non-private manifests, missing/untracked/duplicate/symlinked governed paths, restricted evidence fields, license promotion, and stale outputs; and
- preserve `OR` choices separately from cumulative `AND` obligations.

The declared SBOMs are not transitive-reachability or post-build artifact SBOMs. The complete lock inventory includes development and optional records without claiming they ship. Artifact-specific SBOMs/notices remain required.

## Copied-source and asset disposition

Eight initial shared UI components map to the Better-T-Stack 3.36.3 scaffold. Six later components—Alert, Badge, Dialog, Separator, Sheet, and Table—map to the independently recorded `shadcn@4.13.0` generation event. Immutable upstream commits and public license evidence are recorded, but the repository conclusion remains `NOASSERTION`; exact current bytes are hashed.

Four unreferenced React/Expo demo-logo variants were removed. The six native icon/splash images and all six current web favicon/manifest assets, including `apps/web/src/app/favicon.ico`, are retained and hashed. The web files have no explicit tracked reference, but browser/framework delivery conventions make that insufficient evidence of non-use. Every retained scaffold asset is `replace-before-distribution` because exact asset rights/trademark provenance is unresolved.

## License-review observations

The dated Windows installed-package observation identified `OR` choices, cumulative `AND` expressions, missing metadata, a bundled-license pointer, MPL-2.0, CC-BY-4.0, and Unlicense cases. These observations are recorded in the provenance source and verified against name/version pairs in `bun.lock`. They are not a complete cross-platform license inventory or legal conclusion.

Notably, `MIT AND Apache-2.0` and `Apache-2.0 AND LGPL-3.0-or-later` are conjunctive: both sides require disposition. No agent may “elect” one branch. `OR` expressions also remain `NOASSERTION` until qualified review records a permitted selection. Missing Yuku metadata, the `spawndamnit` bundled-license pointer, Sharp/libvips, attribution/copyleft obligations, and every package not yet observed remain open.

## Generated files and operations

- `third_party/generated/dependency-inventory.json`
- `third_party/generated/source-asset-inventory.json`
- `third_party/generated/sbom/{docs,native,server,web,worker}.cdx.json`
- `THIRD_PARTY_NOTICES.md`

Regenerate with `bun run third-party:generate`; run focused tests with `bun run third-party:test`; verify freshness with `bun run third-party:check`. CI runs the tests and freshness check after the frozen install and before runtime gates.

## Retained issue #93 and release gates

Issue #93 remains open. Before any external binary, container, native, source, docs, or public package release, retain artifact-specific SBOMs and notices covering actually bundled JavaScript, container base/OS packages, Gradle/CocoaPods dependencies, compiled payloads, target-selected optional packages, build-fetched fonts/assets, complete license texts, missing/choice/combined-license disposition, modifications, trademarks, and qualified legal review.

Premium entitlement, invoice, private-source, private-download, credential, and license-key evidence remains Restricted/Prohibited under PDA-REV-019 and must not enter this public baseline.

## Change Log

- **0.1.0 (2026-07-18):** Added an initial host-installed inventory and narrative asset/license review.
- **0.2.0 (2026-07-18):** Replaced the host-specific custom inventory with deterministic lock-derived outputs, per-workspace CycloneDX declared manifests, generated notices, exact path/hash coverage, tests/CI, corrected source-family and `AND`/`OR` semantics, and explicit retained issue/release gates.
