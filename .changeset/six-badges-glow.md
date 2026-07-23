---
"@meridian/ui-web": patch
"web": patch
---

Add `info`/`success`/`warning`/`pending`/`offline` semantic variants to Alert and Badge, consuming the platform's already-registered `--status-*` design tokens (previously only wired into `metric-card.tsx`/`page.tsx` ad hoc, never through the shared components' own variant system). Update `QueryFailure` and `MutationError`'s Alert variant selection, and `StateBadge`'s classification (now also shared by `administration-pages.tsx`, replacing a duplicate and contradictory local classifier), to route each of their distinct failure/state kinds to a semantically accurate variant instead of collapsing most of them into a neutral default. Migrate the global offline banner and an import-detail offline badge onto the new `offline` variant. `warning` renders as a colored border + icon with neutral text rather than colored text, since `--status-warning` fails 4.5:1 AA contrast once tinted or blended -- a token-level gap tracked separately, not fixable per-component while keeping colored text.
