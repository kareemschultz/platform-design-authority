---
document_id: PDA-DAT-016
title: Search and Command Ranking Policy
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Search and Command Ranking Policy

## Purpose

Define ranking, filtering, typo tolerance, recency, personalization, command ordering, leakage prevention, explainability, and evaluation for global search and command-palette results.

This document owns result ordering and command-palette evaluation. `docs/blueprint/10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md` owns retrieval/index architecture and uses precision/recall for candidate-set quality; this policy uses top-k and mean reciprocal rank for ordering quality. Both apply after authorization. UI behavior is governed by `docs/blueprint/09-UX/NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`, and the platform primitive by `docs/blueprint/01-Platform/SEARCH_AND_DISCOVERY.md`.

## Security Before Ranking

Authorization, tenant, organization, legal entity, location, field masking, classification, entitlement, legal hold, and privacy state are applied before a result enters the candidate set.

Counts, suggestions, spell corrections, recent items, snippets, and “no access” placeholders must not reveal protected records.

## Result Families

- Records
- Workspaces and navigation destinations
- Saved views
- Reports and dashboards
- Files and knowledge
- Help and documentation
- Approved actions and commands
- Recent and favorite items

## Baseline Ranking Signals

Weighted signals may include:

- Exact identifier or barcode match
- Exact normalized name match
- Prefix and token match
- Typo-tolerant similarity
- Business context and active workspace
- User role and common workflow
- Recency and frequency of authorized use
- Record status
- Curated importance
- Data freshness and quality
- Search-source confidence

Commercial placement cannot silently override security or task relevance.

## Exact-Match Precedence

Exact barcode, SKU, receipt number, order number, user-entered identifier, and command name normally outrank fuzzy results when the identifier type is valid in the active context.

## Typo Tolerance

- Preserve exact results.
- Use language-aware normalization.
- Apply tighter tolerance to short identifiers and financial references.
- Show the interpreted query when correction materially changes it.
- Never auto-correct a value that could create a consequential action without confirmation.

## Recency and Personalization

Personalization is tenant-local and user-specific unless a team view is explicitly approved. It may use recent authorized activity, favorites, role, workspace, and accepted terminology preferences.

It must not create hidden sensitive profiles or cross-tenant correlation.

## Command Palette Ranking

Priority order:

1. Exact command or destination match
2. Actions valid for the current record or workspace
3. Frequent safe navigation
4. Recent authorized records
5. Broader commands and help

Destructive, financial, privacy, access, or bulk commands never execute directly from search text. They open a governed preview, form, or confirmation workflow.

## Command Shortcuts

Initial shortcuts may include:

- Open command palette
- Focus global search
- Create sale
- Find product
- Open register
- Go to dashboard
- Open recent records

Shortcuts are discoverable, remappable where practical, and do not conflict with browser, assistive-technology, scanner, or operating-system conventions.

## Empty and No-Result Behavior

Differentiate:

- No matching authorized result
- Search unavailable
- Index stale
- Query too broad
- Filters exclude all results
- Offline local results only

Do not imply a protected result exists.

## Ranking Evaluation

Use a dated query set with:

- Exact identifier queries
- Natural-language queries
- Misspellings
- Synonyms and customer terminology
- Ambiguous names
- Permission-limited cases
- Cross-tenant attack probes
- Stale and deleted records
- Mobile and offline cases

Metrics include top-1 success, top-5 success, mean reciprocal rank, zero-result rate, time to result, correction rate, protected-data leakage, and task completion.

## Explainability

Authorized administrators may inspect why a result family ranked highly using safe factors such as exact match, recent use, workspace context, or curated importance. Internal security scoring and other users’ activity are not exposed.

## Quality Gates

- Authorization before candidate generation
- Search leakage tests
- Command permission and entitlement tests
- Exact-match and typo tests
- Deleted and privacy-transformed record removal
- Ranking regression suite
- Accessibility and keyboard tests
- Offline and stale-index behavior
- Performance budget

## Ranking-Authority Boundary

This document owns ranking objectives, fixtures, and approval. Retrieval documents own indexing, authorization filtering, and candidates. Precision/recall measure coverage; MRR/top-k measure ordering over the same fixtures.
