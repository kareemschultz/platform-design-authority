---
document_id: PDA-DAT-002
title: Search Relevance and Semantic Retrieval
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0024]
---

# Search Relevance and Semantic Retrieval

## Purpose

Define ownership and controls for keyword search, faceting, ranking, semantic retrieval, embeddings, retrieval-augmented generation, and permission-aware discovery across platform data.

## Architectural Position

The Search Platform owns indexing, retrieval contracts, filters, lexical ranking, semantic ranking, and operational search projections. The AI Orchestration Engine may consume approved retrieval results but does not own authoritative search indexes or bypass search authorization.

Domains own source records and declare searchable fields, data classification, freshness requirements, deletion behavior, and projection contracts.

## Retrieval Layers

1. Exact identifier and reference lookup
2. Structured filters and facets
3. Lexical full-text search
4. Synonym, typo, stemming, and language-aware relevance
5. Semantic vector retrieval
6. Hybrid ranking
7. AI-generated answer grounded in retrieved evidence

Each layer is optional by capability and must preserve tenant, record, field, and purpose restrictions.

## Index Contract

Every indexed document defines:

- Tenant and organization scope
- Source domain, entity, and record identifier
- Search document type and schema version
- Title, body, facets, sortable fields, and timestamps
- Classification and field-level restrictions
- Source version and projection time
- Deletion or tombstone behavior
- Embedding model and version when applicable

## Authorization

Search applies coarse tenant and scope filters before retrieval and validates current authorization before returning records or protected snippets. A cached index entry or embedding never grants access.

Field-level permissions affect searchable text, facets, highlights, exports, and AI grounding. Search results must not leak record existence through counts, suggestions, or timing.

## Relevance Governance

Candidate retrieval quality uses precision and recall here. Ordering, command ranking, top-k success, and mean reciprocal rank are governed by `10-Data/SEARCH_AND_COMMAND_RANKING_POLICY.md`; these are complementary evaluations, not competing authorities. See also `01-Platform/SEARCH_AND_DISCOVERY.md` and `09-UX/NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`.

Relevance changes are versioned and tested with:

- Representative query sets
- Expected-result judgments
- No-result and low-confidence cases
- Role and industry segments
- Language and regional variants
- Accessibility and latency budgets
- Security leakage tests

Measure precision, recall, ranking quality, success rate, reformulation, time to result, and business-task completion—not only click-through rate.

## Semantic Retrieval

- Begin with PostgreSQL 18 core full-text search and evidence-triggered `pg_trgm`; keep pgvector in an isolated named prototype until admitted under ADR-0024.
- Use approved embedding models through the AI gateway.
- Record model, dimensions, normalization, source text version, and generation date.
- Re-embed when source content, permissions, model, or chunking changes materially.
- Do not embed secrets, authentication factors, or prohibited sensitive fields.
- Separate public, tenant, restricted, and highly sensitive indexes where needed.

## Chunking and Grounding

Documents are chunked according to domain structure, headings, records, and legal context rather than arbitrary token length alone. Retrieval results retain source identifiers, versions, timestamps, and citations so AI output can show provenance.

## Freshness and Consistency

Search is a non-authoritative projection. User experiences must show when data may be stale. High-impact decisions such as stock commitment, payment, payroll, entitlement, or authorization require authoritative domain revalidation.

## Deletion and Privacy

Domain deletion, anonymization, retention, and legal-hold events propagate to lexical indexes, vector stores, caches, suggestions, and evaluation datasets. Removal must be measurable and reconciled.

## Failure Modes

- Index unavailable: fall back to bounded domain queries where practical.
- Semantic service unavailable: retain lexical search.
- Stale projection: show status and revalidate before action.
- Low-confidence AI answer: return sources or request clarification rather than inventing an answer.

## Initial Scope

- Product, party, order, inventory, document, and help search
- PostgreSQL lexical search and trigram matching
- Permission-filtered results
- One semantic document-retrieval prototype using pgvector
- Hybrid relevance evaluation dataset
- Citation-preserving AI retrieval

## Ranking Policy Reference

Ranking changes and fixtures defer to `SEARCH_AND_COMMAND_RANKING_POLICY.md`; this creates no second authority.
