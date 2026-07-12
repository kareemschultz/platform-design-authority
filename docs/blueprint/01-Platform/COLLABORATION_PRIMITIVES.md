---
document_id: PDA-PLT-026
title: Collaboration Primitives
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0014, ADR-0016]
---

# Collaboration Primitives

## Purpose

Define shared comments, mentions, followers, subscriptions, reactions, assignments, record links, and collaborative activity without forcing every domain to reimplement them.

## Architectural Position

The platform owns collaboration primitives and their delivery behavior. Domains own the records being discussed and decide whether collaboration is allowed, which fields may be referenced, and which actions are available.

Collaboration is not a replacement for domain workflow, approvals, audit, or case management.

## Core Primitives

- Comment thread
- Comment and reply
- Mention
- Follower or watcher
- Record subscription
- Reaction
- Lightweight assignment
- Internal note versus externally visible message
- Cross-record link
- Resolution state

## Attachment and Rich Content Rules

- Attachments use the platform file service.
- Rich content uses a constrained, sanitized document format.
- Embedded records use stable references, not copied authoritative data.
- Links are resolved through current authorization at view time.
- External links receive safe-opening and phishing controls.

## Authorization

A user may collaborate only when they can access the referenced record and the collaboration action. Mentioning a user does not grant access. Notifications must not reveal protected record content to a recipient who cannot open it.

Visibility scopes include:

- Private to author
- Internal team
- Organization or workspace
- Selected participants
- Customer, supplier, worker, or partner portal
- Public, only where the owning domain explicitly permits it

## Lifecycle

Comments are append-oriented. Editing preserves version history. Deletion normally becomes a tombstone with reason, except where privacy or legal policy requires deletion, redaction, restriction, or pseudonymization under ADR-0014. Moderation and privacy transformation preserve audit evidence without exposing removed content to ordinary users.

## Notifications

Mentions, assignments, replies, follows, and status changes publish notification intents. Users control ordinary preferences, while legally or operationally mandatory notices may not be disabled.

## Offline

Selected mobile workflows may create comments offline with client-generated identifiers, queued attachments, and conflict-safe ordering. Access is revalidated during synchronization. Privacy tombstones must be applied before protected content is presented after reconnection.

## Search and AI

Collaboration content is indexed only within the record's permission boundary. AI retrieval preserves participant and record visibility and distinguishes user-authored statements from authoritative business facts.

## Retention and Privacy

Collaboration content inherits domain retention unless a stricter collaboration policy applies. Privacy requests account for authorship, other participants' rights, legal holds, and the business need to preserve decision history.

## Events

- `platform.comment.created.v1`
- `platform.comment.edited.v1`
- `platform.mention.created.v1`
- `platform.record-follow.created.v1`
- `platform.assignment.created.v1`
- `platform.thread.resolved.v1`

## Initial Scope

Comments, replies, mentions, followers, internal/external visibility, attachments, notifications, and audit on Commerce orders, supplier purchase orders, service cases, and approval records.