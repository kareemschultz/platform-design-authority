# Root Document Migration Proposal

Status: Proposal for integrated review; no migration is executed by PR #2.
Owner: Platform Design Authority with Developer Platform and Documentation owners.
Lifecycle: controlled prototype planning evidence only.

The Meridian Fumadocs prototype must not mass-move or duplicate the architecture repository. Root architecture/governance documents remain authoritative according to the root contributor contract, Constitution and each document's lifecycle metadata. Product documentation is a separate information class.

## Current inventory and authority

| Source | Current role | Proposed product-doc treatment |
|---|---|---|
| `00-Foundation/CONSTITUTION.md` | Highest repository authority | Never copied into product docs; cite internally where required |
| `01-Platform/` through `20-Strategy/` | Governed architecture, specifications, evidence and strategy | Retain in place; publish only purpose-written product guidance derived through review |
| `18-Decisions/` ADR records | ADR authority according to lifecycle | Retain history and paths; product docs may link to ratified decisions but must not paraphrase them as a second authority |
| `openapi/` and `schemas/` | Canonical machine contracts | Generate labelled API/reference pages; generated output is never edited as authority |
| `registry/*.json` | Generated indexes/contracts | Keep generated from authoritative sources; do not copy into prose or edit manually |
| `reviews/FABLE*` | Independent audit evidence | Never modified, moved or republished by the scaffold remediation |
| `07-Developer-Platform/PRODUCT_DOCUMENTATION_AND_KNOWLEDGE_ARCHITECTURE.md` | Product-document strategy | Governs information classes, ownership and publication process |
| `meridian/apps/fumadocs/content/docs/` | Prototype product-doc source | Only reviewed user/admin/developer prose; no placeholder or architecture copies |

## Desired final layout

```text
/
├── 00-Foundation/ ... 20-Strategy/   # architecture/governance authority, unchanged
├── openapi/ and schemas/             # canonical contracts, unchanged
├── registry/                         # generated authority indexes, unchanged
└── meridian/
    └── apps/fumadocs/content/docs/
        ├── getting-started/
        ├── user-guides/
        ├── administration/
        ├── developer/
        ├── api/                       # generated, source-labelled reference only
        ├── troubleshooting/
        ├── migrations/
        └── release-notes/
```

This proposal does **not** approve that final taxonomy for production publication. Audience classification, stable document identifiers and public/private visibility remain review decisions.

## Link and script impact inventory

A later restructuring PR must inventory before moving anything:

1. Relative Markdown links within all root documents and ADR references.
2. Front matter fields including `related_adrs`, document IDs and lifecycle metadata.
3. Root `README.md`, `CLAUDE.md`, issue templates, PR templates and CODEOWNERS path rules.
4. `scripts/generate_registries.py`, `scripts/validate_docs.py` and their test fixtures.
5. `.github/workflows/docs-governance.yml` and `meridian-prototype.yml` path filters.
6. Fumadocs source configuration, navigation, search, sitemap, llms routes and OpenAPI generation inputs.
7. External GitHub permalinks, issue/PR citations and downstream agent instructions.
8. Registry records and any consumers that expect current directory-prefixed paths.

## Registry and workflow effects

- Generated registry paths must change only through authoritative source/path updates followed by `python scripts/generate_registries.py`; generated JSON is never hand-edited.
- Governance validation must pass both before and after any move.
- Workflow path filters must be updated in the same migration commit so moved documents remain governed.
- Fumadocs CI must distinguish authored product content from generated API/reference output and verify generated-source freshness.
- Preview builds must never publish internal evidence, Fable material, secrets, tenant data or unapproved Draft/Proposed claims.

## Fumadocs content mapping

- User/admin/developer guides are authored as new product-facing pages after the represented behaviour is approved and tested.
- API reference is generated from canonical OpenAPI files and displays the source file, source revision and generation date.
- Architecture background remains in this repository and is linked only for authorised internal audiences.
- Release notes and migration guides derive from reviewed changesets, migrations and PR evidence.
- Placeholder/demo pages remain outside production navigation and publication.

## History-preserving move strategy

If an Accepted ADR or explicit approved migration plan later authorises a root reorganisation:

1. Create a dedicated issue, branch, worktree and PR with exclusive ownership.
2. Capture the pre-move commit SHA and generated-registry snapshot.
3. Produce a machine-readable old-path to new-path manifest.
4. Use `git mv` in a move-only commit with no prose changes so Git history is reviewable.
5. Update links, scripts, registry sources and workflow filters in a separate commit.
6. Regenerate registries from authoritative sources in a third commit.
7. Add redirects or stable-link mappings where external consumers require them.
8. Review the complete diff for accidental content rewrites and visibility changes.

## Validation plan

The migration PR must run and record:

```bash
python scripts/generate_registries.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
git diff --check
```

It must also run broken-link checks, Fumadocs production build under Bun and approved Node LTS, OpenAPI freshness/semantic checks, navigation/search checks, public-content classification review, accessibility checks and workflow path-filter tests.

## Rollback plan

- Before merge: revert the move/update commits in reverse order or abandon the dedicated branch; no production path changes occur.
- After merge but before publication: revert the migration PR as one unit and regenerate registries from restored sources.
- After publication: restore old paths or redirects first, verify external links and search, then revert source moves. Never leave registry/workflow references pointing at absent paths.
- Rollback evidence must include restored governance checks, docs build and link validation.

## Open decisions and blockers

- Public, partner, customer and internal visibility classifications.
- Stable documentation identifiers for contextual help.
- Canonical OpenAPI files mature enough for product publication.
- Redirect/permalink retention period and ownership.
- Accepted ADR or explicit approval governing the final restructuring.

Until those decisions are recorded, root governed documentation remains in place and Fumadocs publishes only bounded prototype product content.
