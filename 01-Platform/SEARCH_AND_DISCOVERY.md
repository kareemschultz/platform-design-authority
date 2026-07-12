---
document_id: PDA-PLT-012
title: Search and Discovery
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Search and Discovery

Retrieval/index authority is `10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md`; result and command ordering is governed by `10-Data/SEARCH_AND_COMMAND_RANKING_POLICY.md`; interaction behavior is governed by `09-UX/NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`.

## Purpose

Define the kernel search primitive for global and domain search, command discovery, saved views, indexing, permission filtering, navigation, and search administration.

`10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md` owns the deeper lexical, semantic, hybrid-ranking, embedding, evaluation, and retrieval-data architecture. AI Orchestration consumes authorized retrieval results and owns answer generation and tool use.

## Core Capabilities

- Global search across entitled and permitted records
- Domain-specific search and faceting
- Command palette and quick actions
- Recent items, favorites, and saved searches
- Full-text, identifier, barcode, and structured-field search
- Search suggestions and permission-safe previews
- Typo tolerance, synonyms, and terminology mappings
- Navigation target resolution
- Index health, rebuild, deletion, and reconciliation tools

## Ownership Boundary

The kernel Search service owns:

- Search document ingestion contracts
- Tenant, scope, and field filters
- Exact, structured, and lexical retrieval
- Search administration and health
- Result envelopes and navigation targets

The Data Platform owns:

- Relevance evaluation methodology
- Semantic embeddings and vector projections
- Hybrid retrieval and ranking
- Search data quality, lineage, and analytical evaluation

AI Orchestration owns:

- Prompt and context assembly
- Grounded answer generation
- Citation presentation
- Tool selection and action

Domains remain authoritative for source records and current permissions.

## Rules

1. Search results never reveal records, fields, counts, suggestions, timing signals, or snippets the user cannot access.
2. Entitlement, permission, tenant, legal-entity, branch, location, purpose, and field-level policy are enforced during retrieval and result rendering.
3. Search indexes are projections, never authoritative stores.
4. Index freshness, lag, deletion, and reconciliation behavior are explicit.
5. Sensitive values require masking, tokenization, or exclusion from indexing.
6. Terminology and synonyms may vary by tenant without changing canonical semantics.
7. Semantic retrieval preserves the same controls and provenance as lexical search.
8. AI-generated answers are not a Search kernel responsibility.
9. High-impact actions revalidate against the owning domain rather than trusting a search result.

## Result Model

Each result includes canonical type, title, reference, context, permitted preview fields, source domain, current status, projection timestamp, classification, and navigation target.

## Indexing Model

Domains publish approved searchable projections. Indexers consume versioned events or controlled change feeds. Rebuild, backfill, privacy purge, and restore operations are tenant-safe, resumable, idempotent, and observable.

## Search Administration

Authorized administrators need:

- Index status and lag
- Failed-document inspection
- Rebuild, purge, and reconciliation controls
- Search analytics without protected content leakage
- Synonym and terminology management
- Result-quality evaluation links
- Privacy target acknowledgement

## Quality Gates

- Permission and field-leak tests
- Tenant-isolation tests
- Count, suggestion, and timing-leak tests
- Index-lag and recovery tests
- Deletion-journal propagation tests
- Relevance benchmarks
- Accessibility and keyboard-navigation tests
- Large-tenant and noisy-neighbor performance tests
