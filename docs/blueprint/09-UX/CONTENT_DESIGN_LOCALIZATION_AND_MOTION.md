---
document_id: PDA-UX-018
title: Content Design Localization and Motion
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-24
---

# Content Design, Localization, and Motion

## Purpose

Define product language, terminology, instructions, errors, localization, formatting, and motion behavior across web, mobile, documents, notifications, and white-label experiences.

## Content Principles

- Use plain business language.
- Name the object and consequence precisely.
- Prefer verbs that describe the real action.
- Explain recovery, not merely failure.
- Distinguish fact, warning, pending, uncertainty, and recommendation.
- Avoid internal architecture terms in ordinary user interfaces.
- An action's label stays identical through its whole flow: a control labeled "Publish" produces a confirmation that says "Published," not "Success" or "Submitted" -- the label is the vocabulary a person uses to recognize what just happened, and switching words on the same action breaks that recognition.

## Error Content

Errors state what happened, what remains safe, whether retry is appropriate, and the next action. Provider uncertainty is never mislabeled as failure.

## Localization

Externalize text, formats, currencies, units, names, addresses, dates, pluralization, and sorting. Terminology mappings may adapt presentation without changing canonical semantics.

## White Label

Customer terminology and brand voice remain within approved meaning, legal, security, and accessibility constraints.

## Motion

`ANIMATION_AND_MOTION_GUIDE.md` (PDA-UX-036) is the authoritative motion specification; this section states the content-facing principle only and defers to PDA-UX-036 on any conflict.

Motion explains continuity, hierarchy, progress, or state change. It must not delay frequent work, imply success before confirmation, or ignore reduced-motion preferences.

## Quality Gates

- Content review
- Terminology consistency
- Translation context
- Text expansion and RTL review
- Error and recovery testing
- Reduced-motion testing
- Screen-reader announcement review
