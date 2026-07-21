---
document_id: PDA-CIR-074
title: Search Competitive Pattern Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Search Competitive Pattern Matrix

## Scope

Algolia, Elasticsearch/OpenSearch, GitHub, Linear, Notion, and command-palette patterns were reviewed through 2026-07-16. Search is a permission-filtered projection, never current authority.

| Pattern | Product benefit | Meridian control |
|---|---|---|
| global/scoped search | rapid discovery across contexts | visible scope, tenant/location, object type and permission |
| command palette | keyboard navigation and action | separate navigation from consequential command; confirm when required |
| typo tolerance/ranking | recovers imperfect queries | explain important matches; protect identifiers and exact codes |
| recents/saved searches | continuity | private-by-default, retention and permission re-evaluation |
| result actions | resolve work quickly | authorize against source record at action time |
| index freshness | responsive projection | watermark, deletion/tombstone propagation and stale label |
| degraded/offline | cached recents/local index | bounded scope, captured-at and no authority claim |

## Decisions and limitations

Adopt fast keyboard operation, visible scope, filters, recents, saved searches, typo tolerance, and source-linked results. Reject cross-tenant index leakage, cached result authority, autocomplete exposure, action-by-text ambiguity, and silent permission lag. Confidence is high for security/UX controls, medium for ranking/tool choices.

## Sources

- [Algolia typo tolerance](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance/) — official documentation, retrieved 2026-07-16.
- [Elasticsearch search](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-your-data.html) — official documentation, retrieved 2026-07-16.
- [OpenSearch search](https://docs.opensearch.org/latest/search-plugins/) — official documentation, retrieved 2026-07-16.
- [Linear search](https://linear.app/docs/search) — official documentation, retrieved 2026-07-16.

