<!--
Fill in every section. Delete a section only when it is genuinely not
applicable, and say so explicitly (e.g. "UI/UX changes: none").
-->

## Linked issue

Closes #

## Parent workstream

<!-- e.g. WS1, WS2, Cross-cutting -->

## Governing documents

<!-- Document IDs / ADRs / registries this PR is scoped by -->

## Summary

## Scope

## Non-goals

## Contract changes

<!-- OpenAPI operations, endpoint-permission entries, capability/permission ids -->

## Migration changes

<!-- Schema changes and their owning persistence package -->

## Permissions / events

## UI/UX changes

<!-- Routes, components, canonical states. Screenshots only when safe and useful — never include tenant data, credentials, or internal URLs. -->

## Risks and deferrals

<!-- Link an existing RR-### / TD-### entry, or note a new one this PR creates -->

## Test evidence

- [ ] `bun install --frozen-lockfile`
- [ ] `bun run check-types`
- [ ] `bun run test`
- [ ] `bun run check`
- [ ] `bun run build`
- [ ] Node fallback evidence attached/described (when applicable per ADR-0020)

## Documentation and registry freshness

- [ ] `python scripts/validate_docs.py` passes
- [ ] `python scripts/generate_registries.py --check` passes (no drift)
- [ ] `python -m unittest scripts/test_validate_document_indexes.py` and `python scripts/validate_document_indexes.py` pass
- [ ] `python -m unittest scripts/test_validate_product_docs.py` and `python scripts/validate_product_docs.py` pass when product documentation, contracts, permissions, or evidence changes
- [ ] `python scripts/generate_contracts.py --check` passes (when contracts changed)
- [ ] `python -m unittest scripts/test_validate_program_status.py` and `python scripts/validate_program_status.py` pass (when project-status tracking changed)

## Lifecycle statement

<!--
State exactly what lifecycle this PR claims — e.g. "controlled-prototype
depth only; no ADR or specification is promoted; no production-readiness
claim is made." Do not omit this section.
-->

## Rollout / rollback

## No unsupported production-readiness claim

- [ ] This PR does not claim founder, legal, customer, provider, security, accessibility, operational, or pilot readiness beyond what is separately evidenced.
