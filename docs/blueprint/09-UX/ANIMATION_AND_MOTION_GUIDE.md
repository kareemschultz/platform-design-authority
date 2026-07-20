---
document_id: PDA-UX-036
title: Animation and Motion Guide
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
related_adrs: [ADR-0005, ADR-0022]
---

# Animation and Motion Guide

## Decision

Meridian motion communicates causality, continuity, status, hierarchy, or spatial change. It is never required to understand or complete an essential task, never substitutes for text or state, and never claims that an operation succeeded before authoritative confirmation.

Operational surfaces default to restrained motion. Marketing may use richer motion within separate accessibility and performance budgets. Premium or generated animation remains Restricted until normalized and accepted.

## Scope relative to Content Design, Localization, and Motion

This document is the authoritative motion specification — timing, easing, causality, and the reduced-motion contract. `CONTENT_DESIGN_LOCALIZATION_AND_MOTION.md` (PDA-UX-018) restates motion's content-facing principle in one paragraph as part of its content/localization scope; where the two differ in phrasing, this document governs. PDA-UX-018 owns product language, terminology, errors, and localization — subjects this document does not cover.

## Token authority

Implementations consume the semantic motion roles in registry/design-tokens.json. They must not introduce arbitrary timing constants as a reusable API.

| Role | Intended use | Default behavior |
|---|---|---|
| motion.instant | Immediate state response and focus indication | No perceptible transition |
| motion.fast | Small hover, press, disclosure, and status response | Short and interruptible |
| motion.normal | Ordinary overlay, panel, and local continuity | Restrained and interruptible |
| motion.slow | Deliberate spatial explanation where users benefit | Rare in product UI |
| motion.deliberate | Marketing or instructional sequence | Restricted and optional |

Token values and easing come from DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md. A source library's durations and springs must be mapped to semantic roles or removed.

## Motion decision matrix

| Pattern | Product disposition | Marketing disposition | Required control |
|---|---|---|---|
| Button press and control-state feedback | Preferred Candidate | Allowed | Must not delay activation or focus |
| Accordion/collapsible height transition | Preferred Candidate | Allowed | Content remains reachable with motion off |
| Dialog, drawer, sheet entry/exit | Preferred Candidate | Allowed | Focus timing and escape are deterministic |
| Skeleton or progress indication | Preferred Candidate | Allowed | Honest semantics; no false completion; restrained animation |
| Toast entry/exit | Preferred Candidate | Allowed | Adequate time, pause/dismiss where needed, no critical-only toast |
| List insertion/removal | Researching | Allowed | Preserve focus and announce consequential changes |
| Chart transition | Restricted | Allowed | Never obscure values; text/table alternative; disable for large updates |
| Drag and drop | Restricted | Allowed | Complete keyboard alternative and non-motion placement feedback |
| Route/page transition | Restricted | Allowed | No delay, no focus loss, no navigation ambiguity |
| Auto-advancing carousel | Rejected in operations | Restricted | User control, pause, focus safety, reduced motion |
| Parallax, marquee, continuous orbit, background particles | Rejected in operations | Restricted | Decorative, stoppable where required, budgeted |
| Success confetti or celebration | Rejected for consequential work | Restricted | Never substitute for confirmation; reduced-motion alternative |
| Pulsing critical alert | Restricted | Restricted | Avoid flashing; use stable text/icon/color-independent status |
| Loading spinner without status or escape | Rejected | Rejected | Provide task, state, time expectation, cancel/retry as applicable |

## Operational motion rules

- State change appears only after the authoritative client state changes; pending and uncertain remain visibly distinct from success.
- Animation cannot hide a fee, balance, permission consequence, destructive impact, validation error, audit fact, offline state, provider uncertainty, or required action.
- Motion is interruptible and does not queue long sequences behind rapid input.
- Focus moves according to the interaction contract, not according to animation completion.
- Repeated scanning, POS entry, grid navigation, and keyboard workflows must not incur decorative delay.
- Offline queueing, sync, retry, and reconciliation use stable named states; animation may indicate activity but not authority.
- Financial reversal and correction use explicit status and reference; motion cannot imply erasure.
- AI streaming shows that content is arriving, not that it is correct or authorized.

## Reduced motion

Every animated component must support prefers-reduced-motion and a no-motion Storybook mode.

Reduced mode:

- Removes non-essential transforms, parallax, auto-play, zoom, rotation, bouncing, and large spatial movement.
- Replaces movement with immediate state change, opacity only when safe, or a static indicator.
- Preserves loading, progress, expanded/collapsed, pending, success, error, and focus information.
- Does not lengthen task completion or remove controls.
- Applies to canvas, SVG, CSS, Web Animations, video, Lottie, chart libraries, and JavaScript runtimes.

User pause and stop controls remain required where WCAG timing or moving-content criteria apply; reduced-motion support alone is not a substitute.

## Accessibility acceptance

For each motion-bearing component, record:

- Keyboard behavior before, during, and after the transition.
- Focus visibility, focus destination, return focus, and interrupted-transition behavior.
- Screen-reader announcement and whether the visual movement is decorative.
- Contrast and non-color state representation at every stable state.
- 200 percent and 400 percent zoom behavior.
- Touch target and gesture alternative.
- Reduced-motion and motion-disabled behavior.
- Flashing, vestibular, seizure, attention, and cognitive-load review.
- RTL direction and spatial-language behavior.

No essential task may require hover, drag, animation timing, or visually tracking a moving object.

## Performance and implementation

- Prefer CSS transitions for small local changes.
- Add an animation runtime only for a named need that CSS and existing dependencies cannot meet.
- Lazy-load marketing animation and large visualization code.
- Avoid layout-thrashing height animation on large or virtualized surfaces.
- Cap concurrent animated elements and disable transition animation for large dataset updates.
- Measure JavaScript, hydration, interaction latency, frame stability, memory, and battery impact on representative mobile and POS hardware.
- Never place an entire operational page behind a client boundary solely for animation.

Exact budgets remain governed by the performance specification and must be captured in the component acceptance record.

## Premium and generated sources

Shadcn Studio metadata did not expose a separate animation catalog or reliable animation total. Do not infer that its named blocks contain no animation or that they are accepted. Magic UI Pro and any Studio or AI-generated motion are Restricted by default.

Before adoption:

1. Record provenance and license.
2. Inventory runtime, CSS, assets, fonts, icons, and transitive dependencies.
3. Strip decorative motion from operational variants.
4. Map all remaining behavior to semantic motion tokens.
5. add reduced-motion and no-motion paths.
6. Run accessibility, performance, visual-regression, and interaction tests.

## Canonical story matrix

Every reusable motion pattern needs stories for:

- Default, hover, focus, active, disabled, and interrupted states.
- Loading, pending, uncertain, success, error, and recovery where applicable.
- Motion enabled, reduced, and disabled.
- Compact, comfortable, and POS/touch density where applicable.
- Mobile, tablet, desktop, kiosk, zoom, high contrast, and RTL.
- Slow device, delayed network, offline, stale, and rapid repeated input.

## Prohibited behavior

- Motion that delays an essential action or conceals current authority.
- Auto-play with no applicable pause or stop control.
- Critical state communicated only by animation or color.
- Replaying entrance motion on every data refresh.
- Animating large tables, logs, or feeds without virtualization and measurement.
- Using motion to pressure a purchase, approval, permission grant, or irreversible action.
- Promoting vendor accessibility or production-ready claims without Meridian evidence.

## Recheck

Review this guide when semantic motion tokens, WCAG interpretation, primitive libraries, chart libraries, premium sources, device targets, or performance budgets change.
