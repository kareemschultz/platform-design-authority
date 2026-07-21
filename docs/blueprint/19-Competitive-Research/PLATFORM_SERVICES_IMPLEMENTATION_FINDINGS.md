---
document_id: PDA-CIR-079
title: Platform Services Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# Platform Services Implementation Findings

## Supported findings

1. Shared search, inbox, analytics, collaboration, and AI surfaces must carry authority, tenant, permission, freshness, and provenance context.
2. Attention, assignment, conversation, operational history, audit, and business completion are distinct concepts.
3. Automation needs versioned definitions, simulation, idempotent execution, approval, and observable recovery.
4. AI action is ordinary application command execution with additional uncertainty, cost, model-failure, and prompt-injection controls.
5. Documentation and change communication need one governed source and explicit product/version/availability labels.

## Proposed Governed Follow-Up Changes

| Affected authority | Issue and suggested change | Evidence/confidence | Urgency/review |
|---|---|---|---|
| AI specifications | standardize suggestion/draft/action/agent autonomy levels, preview, approval, budget and disabled fallback | AI product docs; high | before AI tool expansion; AI/security/PDA |
| Search and permission contracts | define permission-filtering, deletion propagation, freshness watermark and offline snapshot | search docs; high | platform prototype | security/privacy/PDA |
| Analytics/metric authority | define metric ID/version/grain/unit/freshness and accessible alternative contract | BI docs; high | before dashboards | data/UX/accessibility/PDA |
| Notification/inbox standard | separate attention/read/snooze/assignment/review/business completion | collaboration tools; high | shared UX | UX/accessibility/privacy |
| Automation/workflow matrix | add simulation, definition version, run owner, idempotency and compensation evidence to selection criteria | automation docs; high | before runtime choice | architecture/security/operations |
| Documentation architecture | require release-state taxonomy and in-app/public/tenant-audit separation | changelog docs; high | before publishing changes | Developer Platform/PDA |

## Required evidence and rejected patterns

Prototype prompt-injection containment, AI-disabled essential flows, action previews, cost limits, automation replay, permission/deletion index lag, metric reconciliation, accessible charts, inbox dedupe, external sharing expiry, and documentation version routing. Reject prompt authorization, analytics as authority, cross-tenant search, notification-as-completion, comments-as-audit, and changelog-as-tenant-history.

## Confidence and revalidation

High for controls; medium for fast-changing product behaviors. Revalidate AI and vendor-specific claims at least quarterly and before technology selection.

## Sources

- [OpenAI ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — official, retrieved 2026-07-16.
- [Metabase filters](https://www.metabase.com/docs/latest/dashboards/filters) — official, retrieved 2026-07-16.
- [Algolia typo tolerance](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance/) — official, retrieved 2026-07-16.
- [GitHub changelog](https://github.blog/changelog/) — official, retrieved 2026-07-16.
