---
document_id: PDA-UX-014
title: Progressive Disclosure and Complexity Management
version: 0.1.1
status: Superseded
owner: Platform Design Authority
last_reviewed: 2026-07-20
superseded_by: PDA-UX-037
---

# Progressive Disclosure and Complexity Management

> Superseded on 2026-07-20 by PDA-UX-037 (`PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md`). This document's distinct content — general rules, data density, role/entitlement/personalization adaptation, onboarding, and evaluation — is folded into PDA-UX-037. This dated file remains historical evidence only; do not cite it for current guidance.

## Purpose

Define how the platform reveals complexity gradually without hiding authority, risk, cost, errors, data quality, or required business context.

## Principle

Show what is necessary for the current role, task, and decision. Reveal additional detail when the user asks for it, when the workflow requires it, or when risk makes it necessary.

Progressive disclosure is not minimalism for its own sake. It is a control over cognitive load and error probability.

## Disclosure Layers

### Layer 1 — Status and Next Action

The user sees:

- Current state
- Most important result or warning
- Primary next action
- Essential scope and context

### Layer 2 — Working Detail

The user sees the fields, records, filters, calculations, and supporting information needed to complete the task.

### Layer 3 — Advanced Configuration

Rare settings, exceptions, policy overrides, and specialist controls appear in advanced sections, secondary tabs, or dedicated pages.

### Layer 4 — Evidence and System Detail

Audit, calculation evidence, provider references, event history, synchronization detail, and diagnostics appear in inspectors or specialist workspaces.

## What Must Never Be Hidden

- Price, fees, taxes, currency, and total
- Refund destination and timing
- Selected records and effective scope
- Permission or entitlement consequence
- Destructive or irreversible impact
- Offline, stale, uncertain, or pending status
- Legal or statutory declaration
- Material data-quality warning
- Required approval
- Privacy purpose and sensitive-data use
- Provider uncertainty

## Disclosure Techniques

- Role-based workspaces
- Advanced sections
- Optional accordions
- Summary cards with drill-down
- Inspector drawers
- Contextual help
- Expandable calculation breakdowns
- Secondary tabs
- Saved views
- Filter panels
- Step-by-step setup
- Command palette for expert shortcuts
- Inline “show more” for long descriptions

## Rules

1. Hidden content remains discoverable.
2. The control label describes what will be revealed.
3. Disclosure state persists only when useful and safe.
4. Required fields cannot look optional because they are collapsed.
5. Errors inside collapsed sections surface in the section summary.
6. Advanced configuration uses safe defaults and explains inheritance.
7. Expert shortcuts do not remove the guided path.
8. Disclosure must not alter authorization.
9. Search may reveal where a setting lives but not reveal protected values.
10. Mobile disclosure preserves task order and state.

## Role and Entitlement Adaptation

Navigation and controls are composed from permissions, entitlements, workspace, and context. Hidden unavailable capabilities should not create dead-end clutter.

When an unavailable capability is relevant to an administrator, the UI may show a clear upgrade or request-access path. Ordinary users should not be repeatedly distracted by inaccessible features.

## Data Density

Dense information is appropriate when users need comparison and precision. Manage density by:

- Prioritized columns
- Saved views
- Grouping
- Row expansion
- Inspector panels
- Sticky identifiers
- Summary and detail modes
- Keyboard navigation
- Virtualization

Do not replace useful density with large decorative spacing that forces excessive scrolling.

## Defaults and Personalization

Defaults should reflect common tasks, not the most advanced possible configuration.

Personalization may remember:

- Column visibility
- Saved filters
- Dashboard layout
- Preferred workspace
- Expanded advanced sections

It must not hide required compliance information, change permissions, or make shared procedures impossible to support.

## Onboarding

Use progressive onboarding:

- Explain the first task in context.
- Provide sample data or guided setup where safe.
- Avoid long product tours before the user has a goal.
- Reveal help when the user encounters a new capability.
- Allow experienced users to skip guidance.

## Evaluation

Measure:

- Time to locate a control
- Completion rate
- Error rate
- Advanced-section usage
- Help usage
- Abandonment
- Training time
- Support questions
- Whether users notice critical states

A screen is not successful merely because it looks clean. Users must find the right depth of information at the right time.
