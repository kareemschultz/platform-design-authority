---
document_id: PDA-CIR-077
title: Documentation and Changelog Pattern Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Documentation and Changelog Pattern Matrix

## Authority boundary

Stripe, GitHub, Vercel, Linear, Intercom, shadcn/ui, and mature documentation platform patterns were reviewed through 2026-07-16. Any Meridian documentation change remains governed by Product Documentation and Knowledge Architecture and the documentation-platform decision matrix.

| Surface | Strong pattern | Meridian requirement |
|---|---|---|
| user/admin docs | task-first guides and role context | product/version/edition, prerequisites, accessibility and support path |
| developer/API | concepts plus exact contract reference | generated accuracy, auth/permission, examples, errors and deprecation |
| contextual help | link from current task/state | versioned source, no divergent embedded copy |
| tours | progressive introduction | dismissible, replayable, keyboard/screen-reader and no authority |
| release notes | dated user impact | audience, availability, migration, rollback/known issue |
| public changelog | discoverability and trust | distinguish shipped, preview, deprecated, fixed and unavailable |
| in-app What's New | targeted adoption | tenant/role targeting without mixing tenant audit history |
| migration/deprecation | action and deadline | replacement, compatibility, telemetry, support and owner |

## Decisions

Adopt one-source multi-surface publishing, version/edition labels, concise release impact, contextual deep links, and explicit deprecation. Reject marketing-only changelogs, copied help fragments, “available” without rollout scope, release notes as tenant audit, and tours that block essential workflows.

## Confidence and sources

High for information architecture; no documentation platform change is proposed directly.

- [Stripe documentation](https://docs.stripe.com/) — official documentation, retrieved 2026-07-16.
- [GitHub changelog](https://github.blog/changelog/) — official changelog, retrieved 2026-07-16.
- [Vercel changelog](https://vercel.com/changelog) — official changelog, retrieved 2026-07-16.
- [Linear changelog](https://linear.app/changelog) — official changelog, retrieved 2026-07-16.
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) — official changelog, retrieved 2026-07-16.

