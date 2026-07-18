# Third-Party Provenance Baseline

This directory contains the deterministic, public-safe controlled-prototype baseline for issue #93 and PDA-REV-019 finding RDR-003. It does not grant a license, prove ownership, constitute legal advice, or authorize distribution.

## Source and generated artifacts

- `provenance.json` is the reviewed source map for copied UI source, retained scaffold assets, build-time references, and dated package-license observations requiring qualified review.
- `generated/dependency-inventory.json` contains every external resolution record in `bun.lock`, including optional platform records. It is not a runtime-reachability result.
- `generated/source-asset-inventory.json` binds every governed copied-source and retained-asset path to a provenance record and SHA-256 hash.
- `generated/sbom/*.cdx.json` are CycloneDX 1.6 **direct declared manifest SBOMs** for docs, native, server, web, and worker. They mark composition completeness as `incomplete` because transitive/artifact reachability is unknown. They omit the recommended unique `serialNumber` to preserve byte-for-byte source-baseline reproducibility; later artifact BOMs must mint RFC-4122 serials. They are not post-build or artifact SBOMs.
- [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) is the generated human-readable baseline, not a distribution-ready notice bundle.

All repository license conclusions remain `NOASSERTION`. `OR` choices and `AND` conjunctive obligations are recorded distinctly. Referenced native/web scaffold assets remain `replace-before-distribution`. Premium entitlement, invoice, private-source, credential, and private-download evidence is prohibited here and belongs only in the restricted system to be selected through issue #94.

## Deterministic use

```bash
python scripts/generate_third_party.py
python -m unittest scripts/test_generate_third_party.py
python scripts/generate_third_party.py --check
```

The checker fails on non-private tracked manifests; unmapped, untracked, missing, duplicate, symlinked, or hash-drifted governed paths; stale outputs; license promotion above `NOASSERTION`; missing license-review records; distribution authority; or prohibited restricted-evidence fields.

## Retained release blockers

Before any external binary, container, native, source, docs, or package release, generate and review artifact-specific SBOMs/notices covering bundled dependency reachability, container/OS packages, Gradle/CocoaPods closure, build-generated fonts/assets, optional target packages, full license texts, missing/choice/combined-license disposition, modifications, trademarks, and qualified legal approval.

FDR-002, FDR-005, FDR-009, FDR-011, PDA-STR-029, ADR-0026, and issue #93 continue to prohibit external distribution and public publication beyond this bounded evidence baseline.
