---
document_id: PDA-DEV-005
title: Project Agent Skills
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Project Agent Skills

## Purpose

Define project-local reusable skills for Claude Code, compatible Agent Skills tooling, and other coding agents without allowing skills to override repository authority, security, scope, or review requirements.

## Architectural Position

A skill is a reusable procedure or focused body of guidance loaded when relevant. It is not an ADR, permission grant, implementation authority, or substitute for reading the governing specification.

Project skills live under `.claude/skills/<skill-name>/SKILL.md`. Other agents may consume equivalent content through adapters, but this repository remains authoritative for the project-specific procedure.

## Current Skill Set

### Governance and Blueprint Skills

#### `spec-author`

Authors or revises governed specifications, checks ownership, propagates decisions, and runs documentation governance.

#### `adr-author`

Creates durable architecture decisions with options, consequences, controls, validation, and propagation.

#### `consistency-auditor`

Runs an adversarial read-only review for contradictions, ownership drift, registry mismatch, first-slice scope drift, and lifecycle overclaims.

#### `capability-registrar`

Registers capability IDs, namespaces, permissions, events, dependencies, first-slice depth, and generated registries.

#### `review-disposition`

Converts an independent audit into a formal disposition matrix, remediation plan, closure criteria, and follow-up review checkpoint.

#### `technology-evidence-maintainer`

Verifies current primary sources, versions, compatibility combinations, breaking changes, workarounds, alternatives, fallbacks, and reusable lessons before agents change or document the technology stack.

### Frontend and Experience Skills

#### `frontend-architecture`

Plans and reviews Next.js, TanStack, Expo, Tailwind, shadcn/ui, state ownership, component boundaries, accessibility, analytics, white label, and offline behavior.

#### `ui-pattern-audit`

Adversarial review of information hierarchy, progressive disclosure, overlays, tabs, drawers, menus, states, accessibility, responsive behavior, and workflow quality.

#### `dashboard-design`

Turns business questions and data shape into governed metrics, responsive visualizations, cross-filters, comparisons, drill-downs, alerts, annotations, and action layers.

#### `form-wizard-design`

Designs forms, multi-selects, hierarchical selectors, repeatable sections, bulk changes, steppers, wizards, validation, and offline behavior.

#### `accessibility-review`

Reviews workflows for keyboard, focus, semantics, contrast, reflow, charts, tables, overlays, native mobile, and error prevention.

#### `vercel-v0-handoff`

Creates a constrained Tailwind/shadcn-aware generation brief for v0 and reviews generated output against platform rules. It is manual-only.

## Tool-Semantics Rule

Claude Code's `allowed-tools` field **pre-approves** listed tools; it does not restrict the remaining tool pool.

Therefore:

- Read-only audit skills use `disallowed-tools` to remove mutation and shell tools while active.
- Side-effecting skills use `disable-model-invocation: true` and require explicit user invocation.
- Project-wide deny rules belong in `.claude/settings.json` when a tool must be blocked across all skills and prompts.
- A skill must never assume `allowed-tools` is an allowlist.

## Forked Context

`context: fork` and an explicit agent are used for read-heavy audits when supported. Skills must still be correct if a client ignores optional fork metadata; safety cannot depend solely on subagent isolation.

## Skill Rules

1. A skill identifies when it applies.
2. It cites governing repository documents.
3. It points to long specifications rather than duplicating them unnecessarily.
4. It remains narrow enough to evaluate.
5. Side-effecting skills are manual-only.
6. Tool access is minimized using correct semantics.
7. Read-heavy audits prefer forked context.
8. Skills cannot authorize deployment, secrets access, production mutation, or broad administrator behavior.
9. Skills preserve first-slice scope and founder decisions.
10. Generated output receives ordinary architecture, security, accessibility, testing, and human review.
11. Skills do not embed proprietary third-party prompts.
12. Skills remain portable enough to map to the open Agent Skills standard where practical.
13. Technology claims use the living technology ledger and current primary sources; model memory is never sufficient evidence.

## Skill Creation Workflow

1. Identify a repeated procedure or specialized review.
2. Confirm it is not a stable fact better placed in `CLAUDE.md`.
3. Identify source documents and authority.
4. Write precise front matter and instructions.
5. Add supporting files only when they reduce repeated context.
6. Choose automatic or manual invocation deliberately.
7. Apply `disallowed-tools` for temporary restriction; do not misuse `allowed-tools`.
8. Test triggering, false triggering, missed triggering, output quality, safety, and token cost.
9. Review dynamic commands and tool permissions.
10. Version changes through normal review.

## Evaluation

Each skill requires representative cases covering:

- Correct invocation
- Non-invocation on unrelated work
- Governing-document retrieval
- Architecture and scope adherence
- Useful output structure
- Refusal to invent business decisions
- Tool and side-effect safety
- Security and privacy behavior
- Accessibility and testing depth where relevant
- Compatibility when fork metadata is not honored

## Vercel and Premium UI Integration

Vercel v0, Tailwind, shadcn/ui, Magic UI Pro, and shadcn/studio premium assets are implementation accelerators. Skills must apply `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`; third-party output remains subordinate to platform ownership, accessibility, licensing, performance, and maintenance rules.

## Source References

- Anthropic Claude Code skills: https://code.claude.com/docs/en/skills
- Anthropic Claude Code project memory: https://code.claude.com/docs/en/memory
- Vercel v0 documentation: https://v0.app/docs
- Vercel AI SDK documentation: https://vercel.com/docs/ai-sdk
- Agent Skills open standard: https://agentskills.io/
