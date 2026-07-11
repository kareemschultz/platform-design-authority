---
document_id: PDA-DEV-005
title: Project Agent Skills
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Project Agent Skills

## Purpose

Define project-local reusable skills for Claude Code, compatible agent-skill tooling, and other coding agents without allowing skills to override repository authority, security, scope, or review requirements.

## Architectural Position

A skill is a reusable procedure or focused body of guidance loaded when relevant. It is not an ADR, permission grant, implementation authority, or substitute for reading the governing specification.

Project skills live under `.claude/skills/<skill-name>/SKILL.md`. The skill format follows Anthropic's documented project-skill location and the open Agent Skills convention. Other agents may consume equivalent content through adapters, but the Markdown source remains repository-controlled.

## Initial Skill Set

### `frontend-architecture`

Plans and reviews Next.js, TanStack, Expo, state ownership, component boundaries, design tokens, white label, accessibility, and offline behavior.

### `ui-pattern-audit`

Adversarial review of information hierarchy, progressive disclosure, overlays, tabs, drawers, menus, states, accessibility, and responsive behavior.

### `dashboard-design`

Turns business questions and data shape into metric definitions, visualizations, filters, drill-downs, alerts, and action layers.

### `form-wizard-design`

Designs forms, multi-selects, hierarchical selectors, repeatable sections, bulk changes, steppers, wizards, validation, and offline form behavior.

### `accessibility-review`

Reviews complete workflows for keyboard, focus, semantics, contrast, reflow, forms, tables, overlays, native mobile, and error prevention.

### `vercel-v0-handoff`

Creates a constrained design-system-aware generation brief for v0 and reviews generated code against platform rules. It is manually invoked because generation scope should remain user-controlled.

## Skill Rules

1. A skill must identify when it applies.
2. A skill must cite governing repository documents.
3. A skill must not duplicate long specifications when it can point to them.
4. A skill must remain narrow enough to evaluate.
5. Side-effecting skills are manual-only.
6. Tool permissions are minimized.
7. Forked subagent context is preferred for large audits to avoid polluting the main working context.
8. Skills must not authorize deployment, secrets access, production mutation, or broad administrator behavior.
9. Skills must preserve first-slice scope.
10. Generated output receives normal architecture, security, accessibility, test, and human review.

## Skill Creation Workflow

1. Identify a repeated procedure, checklist, or specialized review.
2. Confirm it is not a stable fact better placed in `CLAUDE.md`.
3. Identify source documents and authority.
4. Write a concise skill entry file with a precise description.
5. Add supporting files only when they reduce repeated context.
6. Restrict model invocation for consequential workflows.
7. Test automatic and manual triggering.
8. Evaluate false triggering, missed triggering, output quality, and token cost.
9. Review security implications of any allowed tools or dynamic commands.
10. Version changes through ordinary pull-request review.

## Evaluation

Each skill should have representative prompts covering:

- Correct invocation
- Non-invocation on unrelated work
- Correct governing-document retrieval
- Adherence to architecture and scope
- Useful output structure
- Refusal to invent missing business decisions
- Security and privacy behavior
- Accessibility and testing depth where relevant

## Vercel and Anthropic Integration

Anthropic's current Claude Code documentation describes project skills under `.claude/skills/`, optional frontmatter for invocation and tools, forked context, supporting files, and evaluation. Vercel's v0 and AI SDK are useful implementation accelerators for React and AI interfaces, but remain subordinate to the platform's design system and architecture.

The repository does not copy proprietary Anthropic or Vercel skill content. It creates original project-specific skills informed by public official documentation.

## Source References

- Anthropic Claude Code skills: https://code.claude.com/docs/en/skills
- Anthropic Claude Code project memory: https://code.claude.com/docs/en/memory
- Vercel v0 documentation: https://v0.app/docs
- Vercel AI SDK documentation: https://vercel.com/docs/ai-sdk
- Agent Skills open standard: https://agentskills.io/
