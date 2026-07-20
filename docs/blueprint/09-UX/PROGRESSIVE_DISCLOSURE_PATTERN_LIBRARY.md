---
document_id: PDA-UX-037
title: Progressive Disclosure Pattern Library
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
related_adrs: [ADR-0005, ADR-0022]
---

# Progressive Disclosure Pattern Library

## Decision

Progressive disclosure reduces cognitive load by sequencing optional detail, not by hiding truth, consequence, authority, or recovery. Meridian chooses a disclosure pattern from the user's task, risk, data shape, device, and interruption model. A visually available block does not choose the pattern.

This library operationalizes ADVANCED_INTERFACE_PATTERNS.md, which governs where either conflicts. It also absorbs `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md` (PDA-UX-014), superseded by this document as of 2026-07-20: that document's distinct content — general rules, data density, role/entitlement/personalization adaptation, onboarding, and evaluation — is folded in below. PDA-UX-014 remains on file as superseded historical evidence; this document is current guidance.

## General rules

These absorb PDA-UX-014's foundational rules. Where a rule is elaborated by a more specific section below, this is the compact form; follow the cross-reference for the full behavior.

1. Hidden content remains discoverable — a disclosure control is never the only route to something the user is entitled to find.
2. A disclosure control's label describes what it reveals; a generic "More" that hides consequence is not a valid label.
3. Disclosure state persists only when it helps resume a task, never into unsafe client storage for secret or protected content (see Offline, stale, and interrupted work).
4. A required field cannot look optional because its section is collapsed.
5. Errors inside a closed section surface in that section's summary (see Accessibility requirements).
6. Advanced configuration uses safe defaults and explains what it inherits, not only what it overrides.
7. Expert shortcuts such as the command palette supplement the guided path; they do not replace or bypass it.
8. Disclosure changes what is visible, never what is authorized — collapsing or expanding a section cannot grant or hide a permission decision.
9. Search may reveal where a setting lives; it does not reveal a protected value the searching user cannot otherwise see.
10. Responsive and mobile disclosure preserves task order and state (see Responsive transformation).

## Disclosure layers

| Layer | Contents | Visibility rule |
|---|---|---|
| 1. Task essentials | Identity, current state, primary fields/actions, consequence, blocking errors | Always visible before commitment |
| 2. Supporting context | Summary, recent history, explanation, non-blocking warnings | Adjacent or one explicit disclosure |
| 3. Advanced controls | Rare configuration, expert filters, diagnostics, raw detail | Explicitly labeled; state preserved |
| 4. Evidence and provenance | Audit facts, provider payload references, event chronology, policy basis | Reachable without losing task context; redacted by authority |

The interface must not bury a Layer 1 fact in a later layer.

## Pattern selection matrix

| Pattern | Use when | Do not use when | Preferred source | Required behavior |
|---|---|---|---|---|
| Inline reveal | A small local explanation or one optional field belongs to the current sentence/field | Content is long, consequential, or independently navigable | Official Collapsible or owned disclosure | Clear control name, expanded state, focus remains stable |
| Accordion | Several peer sections are independently reviewable | Users must compare multiple sections simultaneously or errors span closed sections | Official Accordion | Headings, expanded state, errors surfaced and opened |
| Tabs | Peer views share one object and switching does not imply ordered progress | Steps are sequential, data loss is possible, or hidden tabs contain blocking errors | Official Tabs | Arrow-key model, stable labels, URL/persistence where valuable |
| Popover | Short, non-modal context or selection is anchored to a control | Task is long, critical, or must survive navigation | Official Popover | Focus, dismissal, collision, zoom, touch, and mobile fallback |
| Tooltip | A brief supplementary label or shortcut helps a named control | Essential meaning, error, fee, status, or touch-only instruction is present | Official Tooltip | Not the only label; keyboard and touch-safe alternative |
| Drawer or sheet | Contextual detail/edit must preserve the underlying object, especially on narrow screens | High-consequence confirmation or large independent workflow needs a route | Official Drawer/Sheet plus custom composition | Focus trap/return, URL or draft persistence, mobile full-screen transformation |
| Dialog | A short blocking decision or bounded edit requires focused attention | The user needs page context, extended comparison, or recovery after interruption | Official Dialog | Label, description, focus, escape, cancel, error and pending states |
| Alert dialog | A destructive or high-consequence decision needs explicit confirmation | A normal save or reversible low-risk action is occurring | Official Alert Dialog | Consequence, scope, recovery, safe default focus; no ambiguous confirm |
| Wizard/stepper | A long, ordered task benefits from validation, saved progress, and review | Users frequently jump among fields or the flow is short | Official primitives plus custom state machine; Studio visual candidate | Named steps, errors, save/resume, back behavior, review, idempotent submit |
| Inspector/detail pane | Users scan a list and inspect items repeatedly without losing position | Mobile space is insufficient or deep linking is essential without fallback | Custom composite from official primitives | Selection and focus synchronized; route/mobile fallback; stale state visible |
| Advanced-settings section | Defaults serve most users and expert settings are optional | A setting changes money, access, privacy, legal meaning, or destructive behavior | Official Collapsible/Accordion plus custom policy | Explicit summary of non-default values; search and reset |
| Evidence drill-down | Summary must link to facts, events, calculations, or provenance | Evidence is used to justify an action but is inaccessible by permission | Custom audit/event composite | Immutable references, chronology, redaction, incomplete-state honesty |
| Saved view/filter builder | Repeated high-volume work benefits from reusable query disclosure | A hidden filter can make totals or scope misleading | Official form/popover primitives plus custom query model | Active-filter summary, clear-all, scope, sharing, permissions, URL/persistence |
| Command palette | Expert navigation or action discovery benefits from search | It becomes the only path or bypasses permissions/consequence review | Official Command plus custom ranking/authority | Visible alternative, permission-filtered results, confirmation where required |

## Never-hidden information

The following remains visible before the related action:

- Total, currency, fees, taxes, tender, balance, and provider uncertainty.
- Destructive effect, reversal/compensation behavior, and recovery limits.
- Current tenant, organization, role context, permission scope, and entitlement distinction.
- Offline, stale, queued, conflicting, pending, unavailable, or unverified authority.
- Privacy, legal, fiscal, security, and required consent meaning.
- Validation failures and the location of affected fields.
- AI involvement, source/provenance, proposed tool action, approval need, and deterministic alternative.
- Required fields, missing dependencies, and blocking device/provider capability.

Tooltips, hover cards, animation, color, icons, and marketing copy cannot carry these facts alone.

## Domain pattern library

### POS and payments

- Keep cart, totals, tender state, offline state, register, operator, and current tenant in Layer 1.
- Use an inspector or drawer for product detail without losing cart position.
- Use a route or full-screen task for tender; do not reduce payment consequence to a popover.
- Split payment uses an explicit allocation workspace with remaining balance always visible.
- Provider uncertainty opens a stable status and recovery panel; it never collapses into a success toast.
- Receipt options may follow confirmed completion, not precede or imply it.

### Permissions, roles, and tenancy

- Show effective scope and tenant context with each consequential grant.
- Use an inspector for permission rationale and source; use a dialog or route for grant/revoke confirmation according to consequence.
- Advanced filters may hide unused permission families, but active grants, denials, inherited scope, and pending changes remain summarized.
- Entitlement and permission are distinct labels and views.
- Organization switching shows unsaved work, queued work, offline state, and authority changes before transition.

### Inventory and reconciliation

- Adjustment quantity, unit, item, location, reason, effective date, and reversal behavior are Layer 1.
- Use a wizard for counted reconciliation only when progress is saved and resumable.
- Variance evidence can drill into counts, movements, and event provenance.
- Barcode ambiguity must open a selection/resolution state; it cannot silently select.
- Offline queued movements remain visibly provisional.

### Audit, finance, and provider diagnostics

- Summary cards link to immutable evidence rather than copying or rewriting it.
- Use an inspector for rapid event review and a dedicated route for deep comparison/diff.
- Redaction and insufficient-authority states remain explicit.
- Financial exceptions disclose source amounts, currency, status, reconciliation, and correction method.
- Raw provider data is protected and never exposed merely because an advanced section is open.

### AI-assisted work

- The AI sidebar may disclose citations, provenance, assumptions, and tool details progressively, but the proposed action, affected scope, authority check, approval requirement, and uncertainty remain visible.
- Expanded technical details must not replace a plain-language consequence summary.
- AI explanations do not alter or conceal deterministic controls.
- Essential first-slice work remains operable with AI disabled.

## Data density

Dense information is appropriate when users need comparison and precision — accounting grids, inventory ledgers, audit review. Manage density with:

- Prioritized columns
- Saved views
- Grouping
- Row expansion
- Inspector panels
- Sticky identifiers
- Summary and detail modes
- Keyboard navigation
- Virtualization

Do not replace useful density with decorative spacing that forces excessive scrolling; a compact grid is a legitimate Layer 2/3 destination, not a defect to soften.

## Role, entitlement, and personalization adaptation

Navigation and controls are composed from permissions, entitlements, workspace, and context — see also "Permissions, roles, and tenancy" above. A hidden, unavailable capability should not create dead-end clutter; when it is relevant to an administrator specifically, the UI may show a clear upgrade or request-access path, but ordinary users should not be repeatedly distracted by inaccessible features.

Defaults should reflect common tasks, not the most advanced possible configuration. Personalization may remember column visibility, saved filters, dashboard layout, preferred workspace, and expanded advanced sections. It must never hide required compliance information, change permissions, or make a shared procedure impossible for a colleague to support from the same screen.

## Onboarding

Use progressive onboarding, not a long tour:

- Explain the first task in context, not as an abstract product overview.
- Provide sample data or guided setup where safe.
- Reveal help when the user encounters a new capability, not before.
- Allow experienced users to skip guidance entirely.

## Evaluation

A screen is not successful merely because it looks clean. Measure whether the right depth of information reached the user at the right time:

- Time to locate a control
- Completion rate
- Error rate
- Advanced-section usage
- Help usage
- Abandonment
- Training time
- Support questions
- Whether users notice critical states without prompting

## Responsive transformation

| Desktop pattern | Narrow-screen transformation |
|---|---|
| Popover | Drawer, sheet, or inline section when content or touch density requires |
| Side inspector | Full-screen route/sheet with preserved list position |
| Multi-column form | One-column groups with stable summary and error navigation |
| Data-grid column detail | Row summary plus detail route/sheet; never horizontal clipping as only path |
| Hover card | Explicit disclosure control |
| Persistent sidebar | Sheet/bottom navigation only when hierarchy and task access remain clear |
| Split view | Sequential list/detail with back-state preservation |

Responsive change must preserve data, draft state, focus intent, active filters, current tenant, and consequences.

## Accessibility requirements

- Disclosure controls expose programmatic name, role, state, and relationship.
- Keyboard order follows reading and task order; focus is never moved merely because content expanded.
- Closed sections containing validation errors open or expose an error summary that links to the field.
- Dialogs, sheets, and drawers implement predictable initial focus, trap where modal, escape, close, and return focus.
- Tabs and accordions follow the selected primitive's documented keyboard model.
- Zoom and reflow do not clip triggers, content, close controls, or consequence summaries.
- Touch targets meet the governed minimum and never depend on hover.
- Screen readers receive status updates without repeated or noisy announcements.
- Reduced motion preserves the disclosure state and immediate access.
- RTL reverses spatial presentation where appropriate without reversing chronology or business meaning.

## Offline, stale, and interrupted work

- Persist disclosure state only when it helps resume the task; never persist secret or protected content into unsafe client storage.
- A resumed wizard revalidates authority, tenant, version, and prerequisites.
- Draft and queued states are separate from committed success.
- If an overlay closes during failure, the parent surface retains a visible error and recovery path.
- Conflicts open a governed comparison/resolution flow; last-write-wins is not a disclosure strategy.
- Navigation away from an unsaved or pending task follows the interruption policy.

## Story and test matrix

Each accepted disclosure pattern needs:

- Closed/open, default/focus/disabled, loading, empty, no-results, denied, unavailable, stale, offline, pending, uncertain, error, recovery, and success states as applicable.
- Keyboard, screen reader, visible focus, zoom, touch, reduced motion, high contrast, and RTL evidence.
- Mobile, tablet, desktop, kiosk/POS, long text, localization, and large-data cases.
- Nested-content and interruption tests, including focus return and unsaved work.
- Permission, tenant, protected-data, and audit checks for disclosed content.

## Source guidance

Official shadcn accordion, collapsible, tabs, popover, tooltip, dialog, alert-dialog, drawer, sheet, command, form, field, table, and sidebar entries are Preferred Candidate primitives. Studio's application-shell, form-layout, multi-step-form, account-settings, and dashboard candidates are composition research only. All domain-specific disclosure behavior remains platform-owned.

## Prohibited behavior

- Hiding a consequence to make a page look simple.
- Using a tooltip for essential content.
- Nesting modal surfaces without a reviewed interaction contract.
- Treating tabs as a wizard or a wizard as arbitrary navigation.
- Closing an overlay and losing errors, drafts, queue state, or recovery.
- Using responsive removal to make a required action inaccessible.
- Letting AI decide disclosure depth from aesthetic preference.
- Copying a premium block's information architecture without task evidence.

## Recheck

Review this library when canonical states, first-slice workflows, navigation architecture, primitive foundation, accessibility evidence, device targets, or offline semantics change.

## Change Log

- 2026-07-20 — v0.2.0 absorbed PDA-UX-014 (Progressive Disclosure and Complexity Management) on its supersession: added General rules, Data density, Role/entitlement/personalization adaptation, Onboarding, and Evaluation sections. PDA-UX-014 is retained as a superseded historical document, not deleted.
