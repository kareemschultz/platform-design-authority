---
document_id: PDA-AI-013
title: AI Memory Retrieval and Context
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Memory, Retrieval, and Context

## Purpose

Define how AI receives current business context, retrieves evidence, stores approved memory, and avoids cross-tenant leakage, stale authority, and uncontrolled personal profiling.

## Context Layers

- Authentication and assurance context
- Tenant, organization, legal entity, location, and workspace
- Permissions and entitlements
- User request and current record
- Approved retrieved evidence
- Workflow state
- Short-lived conversation state
- Approved durable memory

## Retrieval Rules

1. Search and Data Platform perform permission-filtered retrieval.
2. The AI layer cannot broaden retrieval scope.
3. Every chunk records tenant, source, classification, timestamp, and provenance.
4. High-impact answers revalidate current source records.
5. Retrieved text is untrusted and cannot redefine system or tool policy.
6. Citations identify the evidence used.
7. Stale, conflicting, or incomplete evidence is disclosed.

## Memory Types

### Ephemeral

Conversation and task state that expires quickly.

### User Preference

Approved preferences such as layout or communication style. It must be visible, editable, exportable, and deletable.

### Workspace Memory

Shared operating context approved for a team or workspace.

### Agent Operational Memory

Bounded task state, prior attempts, and workflow checkpoints.

### Prohibited Memory

Hidden sensitive profiling, unrestricted raw conversation history, authentication secrets, or cross-tenant identity correlation.

## Memory Record

A durable memory stores source, purpose, tenant scope, subject, classification, confidence, owner, creation method, expiry, review date, and deletion behavior.

## Privacy

Memory participates in access, export, correction, restriction, and erasure workflows. A deleted source must not survive through an embedding, summary, or memory entry unless a lawful retention basis remains.

## Quality Gates

- Tenant and permission isolation
- Prompt-injection testing
- Staleness and conflict handling
- Source deletion propagation
- User visibility and control
- Expiry enforcement
- Memory reconstruction-resistance
