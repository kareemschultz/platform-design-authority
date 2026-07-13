---
document_id: PDA-UX-032
title: Component Acceptance Checklist
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# Component Acceptance Checklist

## Purpose

Provide the evidence checklist required to promote a component, pattern, block, layout, or animation from discovery to Prototype Approved or Platform Approved status in the Preferred Component Catalog.

A checklist is completed for the resulting Meridian-owned implementation, not merely for the external source demo.

## Candidate Record

- [ ] User task and outcome are explicit.
- [ ] Target roles, surfaces, devices, and deployment modes are named.
- [ ] Risk class is recorded.
- [ ] Preferred Component Catalog entry exists.
- [ ] Platform-owned, official shadcn/ui, premium-source, and custom alternatives were considered where applicable.
- [ ] Exact source item, version, retrieval date, and provenance are recorded.
- [ ] License permits the intended entity, repository, product, deployment, and redistribution model.
- [ ] No secret, token, private registry URL, invoice, account cookie, or prohibited source is committed.

## Architecture and Ownership

- [ ] The component has a clear package and owner.
- [ ] Domain-specific behavior remains with the owning domain.
- [ ] Business rules are not embedded in presentation code.
- [ ] Permissions, entitlements, approvals, audit, and tenant scope use ordinary platform contracts.
- [ ] No provider SDK type leaks into platform or domain component APIs.
- [ ] Server and client boundaries are intentional.
- [ ] The implementation does not require the originating MCP at build or runtime.
- [ ] Duplicate primitive, icon, form, chart, state, styling, or utility libraries were not introduced without approval.

## Source and Token Normalization

- [ ] Meridian naming replaces source-library naming in public APIs.
- [ ] Raw colors and arbitrary values are replaced with semantic tokens.
- [ ] Typography, spacing, radius, elevation, density, focus, motion, and breakpoints follow governed tokens.
- [ ] Approved primitives replace conflicting source primitives where applicable.
- [ ] Source branding, sample data, tracking, remote fonts, and unapproved assets are removed.
- [ ] Light, dark, high-contrast, and representative tenant themes are verified.

## Task and Pattern Fit

- [ ] The selected pattern is appropriate for the user task.
- [ ] Tabs represent peer views rather than ordered steps.
- [ ] Wizards are used only for dependent or consequential sequences.
- [ ] Dialogs and popovers remain bounded.
- [ ] Drawers preserve context rather than becoming hidden applications.
- [ ] Progressive disclosure reduces complexity without hiding consequences.
- [ ] The component improves task clarity or speed compared with simpler alternatives.

## Canonical States

- [ ] Loading
- [ ] Empty
- [ ] No results
- [ ] Partial
- [ ] Stale
- [ ] Offline
- [ ] Pending
- [ ] Uncertain external result
- [ ] Permission denied
- [ ] Entitlement unavailable
- [ ] Validation error
- [ ] Recoverable failure
- [ ] Irrecoverable failure
- [ ] Success
- [ ] Suspended, restricted, or deprecated where applicable

Non-applicable states are explicitly marked with a reason.

## Accessibility

- [ ] Native semantics are preferred.
- [ ] Name, role, state, value, and description are programmatic.
- [ ] Full keyboard operation is supported.
- [ ] Focus order follows the task.
- [ ] Focus is visible and unobscured.
- [ ] Focus returns correctly after overlays.
- [ ] Status, error, pending, offline, uncertain, and completion changes are announced.
- [ ] Contrast meets policy.
- [ ] Information is not color-only.
- [ ] Text zoom, reflow, and text scaling are usable.
- [ ] Touch targets meet approved minimums.
- [ ] Reduced motion and high contrast are supported.
- [ ] Screen-reader behavior is manually reviewed for complex interactions.
- [ ] Charts or complex visuals include accessible summaries and structured alternatives.
- [ ] Consequential actions include review, correction, and confirmation.

## Responsive and Density

- [ ] Narrow mobile behavior is defined.
- [ ] Tablet behavior is defined.
- [ ] Small and standard desktop behavior is defined.
- [ ] Wide-screen behavior does not create unreadable line lengths or scattered actions.
- [ ] Container-constrained behavior is tested where applicable.
- [ ] Compact density remains operable and accessible.
- [ ] POS or kiosk variants use appropriate touch targets and scanner/external-keyboard behavior.
- [ ] Mobile transformation preserves meaning, state, and recovery.

## Offline, Degraded, and Authority Semantics

- [ ] Current, stale, partial, local-only, queued, conflicted, and reconciled states are distinguishable where applicable.
- [ ] The component does not imply authoritative completion before confirmation.
- [ ] Retry behavior is safe and understandable.
- [ ] Duplicate submission is prevented or handled idempotently.
- [ ] Provider uncertainty does not appear as failure or success.
- [ ] Offline restrictions and lease expiry are visible where applicable.

## Security and Privacy

- [ ] No unsafe HTML or script execution.
- [ ] External links and remote content are controlled.
- [ ] No protected data leaks through suggestions, counts, previews, empty states, or errors.
- [ ] File and URL handling is threat-modeled where applicable.
- [ ] Sensitive values are masked appropriately.
- [ ] Support, impersonation, export, bulk, and administrative actions remain auditable.
- [ ] Privacy and deletion states propagate to cached or displayed data.

## Performance

- [ ] Bundle and dependency impact is recorded.
- [ ] Hydration is necessary and bounded.
- [ ] Interaction performance meets the applicable budget.
- [ ] Large lists, grids, charts, or forms are tested at representative scale.
- [ ] Images and fonts are optimized.
- [ ] Motion does not create disproportionate CPU, GPU, battery, paint, or layout cost.
- [ ] Operational components do not load marketing-only dependencies.
- [ ] Failure under low bandwidth or low-powered devices is graceful.

## Motion and Animation

- [ ] Motion explains state, continuity, hierarchy, or feedback.
- [ ] Tokenized duration and easing are used.
- [ ] Reduced-motion behavior is verified.
- [ ] Animation does not delay frequent actions.
- [ ] Continuous animation is absent from operational work unless explicitly justified.
- [ ] Focus and screen-reader state remain correct.
- [ ] Animated values do not imply false precision or completion.

## White Label and Localization

- [ ] Branding uses semantic roles.
- [ ] Security, warning, success, pending, offline, and uncertainty semantics cannot be rebranded away.
- [ ] Legal and support identity remain visible where required.
- [ ] Long text and text expansion are tested.
- [ ] Dates, currencies, quantities, names, and addresses are locale-aware.
- [ ] RTL is considered where applicable.
- [ ] Sentences are not assembled from translation-hostile fragments.

## Evidence

- [ ] Storybook stories cover required states and variants.
- [ ] Interaction tests pass.
- [ ] Automated accessibility checks pass.
- [ ] Required manual accessibility review is recorded.
- [ ] Visual regression baselines are approved.
- [ ] Responsive screenshots or tests exist.
- [ ] Performance evidence exists.
- [ ] Security review exists for risky surfaces.
- [ ] Provenance record is complete.
- [ ] Migration and retirement behavior are documented.
- [ ] Technology lessons are added when compatibility or upgrade behavior was learned.

## Promotion Decision

Record:

- Catalog status granted
- Approved surfaces and restrictions
- Owner
- Reviewer or evidence source
- Date
- Known limitations
- Follow-up issues
- Revisit trigger

Platform Approved requires all applicable blocking gates. A visual review alone cannot grant approval.