---
document_id: PDA-UX-038
title: WS1 Thin Application Shell Implementation Evidence
version: 0.2.1
status: Draft
owner: Frontend Platform
last_reviewed: 2026-07-14
related_adrs: [ADR-0005, ADR-0020, ADR-0026]
---

# WS1 Thin Application Shell Implementation Evidence

> **Point-in-time evidence.** Findings, verification results, and conclusions below reflect the platform, dependencies, and vendor catalogs as observed through this document's own dated evidence (most recently reviewed 2026-07-14). Nothing here is re-verified automatically on a later read; re-confirm current state before relying on a dated finding for a new decision. See ADR-0025's evidence-banner amendment for the convention.

## Evidence status

This record covers the controlled WS1 prototype shell from PDA-RDM-008. It does not promote the web surface, accessibility conformance, authentication factor UX, or operating environment to pilot or production readiness. Consolidated closure remains PR9 work.

## Governed scope

The shell consumes the published `@meridian/contracts-platform-api` contract and does not import server router implementations. Better Auth remains responsible for authentication and sessions. Platform Tenancy provides current membership and active context. Party remains the business-person authority. Authorization and Entitlements remain separate current-state checks. Audit records remain append-only evidence.

The implemented route hierarchy has two persistent levels:

- Home: `/`
- Administration overview: `/administration`
- Users: `/administration/users`
- Roles: `/administration/roles`
- Entitlements: `/administration/entitlements`
- Sessions: `/administration/sessions`
- Audit: `/administration/audit`

The legacy `/dashboard` path redirects to Administration. Browser cursor state is expressed in the URL, so normal Back behavior restores the prior page.

## Authority and context behavior

- The Administration server layout checks the Better Auth session before rendering.
- The client stores only an opaque active-context identifier in `sessionStorage`, scoped to the browser tab.
- The server creates and revalidates the tenant, organization, and optional location context. The client never constructs an authoritative principal, role list, or permission list.
- Organization and location changes call `setActiveContext`; protected queries carry the returned context identifier.
- Repository tenant predicates and application-command authorization remain mandatory after transport authorization.
- The overview distinguishes authentication identity, Party linkage, organization, and location scope.

The shell uses permissions `platform.user.read`, `platform.role.read`, `platform.entitlement.read`, `platform.audit.read`, and the authenticated-session contracts for session listing and revocation. Capability provisioning remains distinct from these permissions.

## State coverage

Each administrative list has loading, empty, success, and error rendering. The shared failure classifier distinguishes:

- unauthenticated or revoked session — reauthenticate;
- insufficient role/scope — permission denied;
- capability not provisioned — entitlement unavailable;
- stronger factor needed — step-up required;
- governed approval needed — approval required;
- offline — current authority unavailable;
- dependency failure — retryable unavailable state.

Cached information may remain visible while offline, but the UI states that changes and authority evaluation require connectivity. Revoking the current session signs the user out and returns to the login boundary; revoking another session invalidates the session list.

## Responsive and accessibility implementation

- A keyboard-first skip control moves focus to the single main landmark.
- Desktop primary navigation and mobile Sheet navigation expose native links and `aria-current`.
- Administration subnavigation remains horizontally reachable at narrow widths and uses 40-pixel minimum targets; mobile primary targets use 48 pixels.
- Desktop records use semantic tables with captions and header cells. Small screens receive list/card presentation using `dl`, `dt`, and `dd`, not an ARIA grid.
- Context inputs use native labelled `select` controls.
- Session revocation uses an accessible Base UI Dialog with title, description, cancel, and destructive confirmation.
- Status is never communicated by color alone; text and icons accompany state badges and alerts.
- Motion comes from owned shadcn source and remains compatible with the global reduced-motion token policy.

PR9 completed the controlled-prototype browser review recorded in PDA-IMPL-005. Formal product WCAG 2.2 AA conformance still requires independent assistive-technology, text-only zoom, production-content, native, and qualified accessibility evidence before pilot or production.

## Component provenance and technology evidence

Alert, Badge, Dialog, Separator, Sheet, and Table were generated from the official shadcn registry with the exact `shadcn@4.13.0` CLI after an inspected `--dry-run`. The source is owned in `@meridian/ui-web`; no premium Studio source or credential was used. Both monorepo `components.json` files follow the official schema and retain matching Rhea style, Neutral base color, Lucide icon library, RSC, TypeScript, RTL, and menu configuration. The remaining governed preset decisions are recorded in PDA-UX-028.

TECH-LESSON-039 records why custom preset metadata cannot be stored in `components.json`, the tested workaround, owner, and removal trigger.

## Automated evidence

- `apps/web/src/lib/shell.test.ts` proves the two-level route constraint, safe internal login returns, branch highlighting, and distinct permission/entitlement/step-up/offline classification.
- TypeScript checks cover the contract-derived query and mutation shapes.
- The Next production build proves route compilation and typed-link validity.
- Repository-wide implementation, governance, contract, architecture, and migration gates remain required before merge.

## Browser inspection evidence

The production Next build was inspected on 2026-07-14 in a Chromium browser at desktop width and a 390 by 844 pixel mobile viewport:

- the document exposed one banner, one main landmark, labelled primary navigation, a level-one page heading, and labelled API-status region;
- the skip control transferred focus to the `main-content` landmark;
- desktop primary controls measured at least 40 pixels high;
- the mobile viewport had no horizontal document overflow;
- desktop primary links transformed into a labelled **Mobile primary** modal Sheet;
- Sheet links measured 48 pixels high and exposed expanded/current state and an accessible Close control;
- the login form exposed one level-one heading, explicit Email and Password labels, and `email` and `current-password` autocomplete semantics; subsequent source normalization sets its inputs and actions to the 40-pixel governed minimum and the production build covers that change, while PR9 retains the final browser recheck;
- no client runtime warning or error was emitted by these interactions; the expected API connection failure was rendered as the prototype's disconnected state because the inspection intentionally ran without the API service.

This is implementation inspection, not a formal assistive-technology conformance report. PR9 retains the remaining conformance and integrated-authenticated workflow evidence.

## PR9 accessibility and responsive closeout

The 2026-07-14 PR9 review exercised the login and authenticated Administration shell at desktop, 390-pixel mobile, and 320-pixel reflow widths. It verified the accessibility tree, native link/button semantics, landmarks/headings, labelled inputs, error announcements, skip-focus transfer, mobile-dialog focus and restoration, 48-pixel mobile navigation targets, light/dark muted-text contrast, reduced-motion policy, and a clean browser console.

The review found and corrected four High defects and one Medium defect: Base UI button semantics on navigation links, client-session hydration replacement on the login form, root-grid document overflow at 320 pixels, invalid-form focus loss, and a missing executable reduced-motion override. PDA-IMPL-005 retains the finding-level disposition and exact verification result. At 320 pixels the document no longer overflows; only the labelled Administration subnavigation scrolls. Invalid submission focuses the first invalid field with `aria-invalid`, `aria-describedby`, and alert text.

This closes the WS1 prototype accessibility evidence cell. It does not replace the independent pilot/production conformance gates named above.

## Standalone runtime evidence

A fresh Docker Compose stack was built twice on 2026-07-14. The first run exposed and reproduced the build-time public URL defect recorded in TECH-LESSON-040. After the server-only internal API origin was added, a fresh image and database volume proved:

- PostgreSQL 18.4 health and all owner-specific migrations;
- only `pg_stat_statements` and `plpgsql` installed;
- HTTP 200 health for API and web containers;
- unauthenticated Administration returned the governed reauthentication redirect without a container-network error;
- Better Auth created a disposable synthetic user and the resulting session rendered the authenticated Administration shell without redirect;
- web and server logs contained no runtime warning or error for the corrected requests.

The synthetic stack and volume were removed after verification. This remains controlled prototype evidence, not production deployment or identity-provider evidence.

## Explicit deferrals

- Factor enrollment and recovery screens are not implemented; the Better Auth factor baseline remains a server capability.
- User invitation, membership suspension, and role-assignment write forms remain contract/API capabilities rather than shell workflows.
- Audit metadata expansion is deliberately absent to avoid exposing unclassified or restricted fields.
- Storybook visual baselines and automated browser accessibility tooling remain platform-wide work; PDA-IMPL-005 retains truthful manual evidence and unresolved conformance gaps.
- Production OTP delivery remains blocked by FDR-007.
