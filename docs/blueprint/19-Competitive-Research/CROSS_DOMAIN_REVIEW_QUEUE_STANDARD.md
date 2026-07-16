---
document_id: PDA-CIR-085
title: Cross-Domain Review Queue Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Cross-Domain Review Queue Standard

## Purpose and authority boundary

This draft standard defines shared queue mechanics. It does not create a cross-domain owner, generic write repository, or administrator bypass. Source domains own facts, validation, transitions, permissions, and commit commands.

## Required queue item contract

Every item carries an opaque queue reference; source-domain type and record/operation reference; tenant and allowed context; reason/category; priority and due/escalation policy version; created/updated time; freshness; accountable owner/team; assignment/acceptance/delegation state; evidence references with sensitivity; permitted source-domain commands; resolution outcome; correlation and audit reference.

## Required interactions

- Filter, sort, group and save views without exposing unauthorized counts or autocomplete.
- Assign, accept, delegate, snooze and escalate with explicit SLA effects.
- Open source context with authority/freshness labels.
- Preview a source-domain command; reauthorize and execute against the current record version.
- Report stale, already resolved, permission lost, partially failed, provider unknown and conflicted outcomes.
- Bulk operations declare exact scope and per-item results.
- Provide keyboard, screen-reader, zoom, reduced-motion and non-color status support.

## Prohibited design

No copied business payload as new authority; no “resolve” button that only marks notification read; no cross-domain super-permission; no AI auto-resolution; no snooze that silently violates statutory/SLA rules; no last-write-wins assignment; no sensitive evidence in notification previews.

## AI and automation

AI may summarize, prioritize or propose with source links, confidence, model/version, cost/budget and feedback. It cannot expand the reviewer’s allowed commands. Deterministic sorting/filtering and manual review must remain available when AI is disabled.

## Evidence and lifecycle

Status is Draft and Prototype Required. Validate with accounting match exceptions plus a second domain such as payment uncertainty or inventory discrepancy. Required evidence: authority isolation, stale-item handling, accessible triage, queue-scale performance, privacy redaction, assignment races, notification delivery failure, AI-disabled operation and audit reconstruction.

