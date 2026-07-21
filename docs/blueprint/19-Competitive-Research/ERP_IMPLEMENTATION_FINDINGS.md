---
document_id: PDA-CIR-028
title: ERP Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0007, ADR-0016, ADR-0019, ADR-0022]
---

# ERP Implementation Findings

## Purpose

Translate the ERP matrix, workflow reference, and teardown into bounded follow-up findings. This document does not authorize a generic ERP domain, new identifiers, or first-slice expansion.

## Findings

1. Meridian's advantage candidate is coherent capability composition with explicit owners, not the quantity of visible modules.
2. Tenant, organization, legal entity, and location are distinct contexts and must be visible at consequential commands.
3. Party identity and domain roles must remain separate even when competitors expose one customer/vendor/employee master screen.
4. Shared workflow, approval, import, audit, search, notification, document, and reporting seams should reduce duplication without taking business authority.
5. Setup needs readiness checks, consequence previews, versioning, validation, activation, and rollback/disable paths.
6. Cross-domain review queues are useful only when every item retains owner, command/proposal identity, version, authority, and freshness.
7. Bulk operations require explicit scope, preview, partial-failure policy, idempotency, and reconciliation.
8. Extension provenance and upgrade compatibility are product requirements, not back-office housekeeping.
9. Mobile experiences should transform bounded tasks; the desktop module tree is not a mobile design.
10. No competitor documentation justifies production readiness or a superiority claim for Meridian.

## Candidate implementation seams

| Seam | Owner | Minimum contract | First-slice treatment |
|---|---|---|---|
| Active context | Platform Kernel | tenant, organization, location, actor, version, expiry | Included where already governed |
| Capability workspace | Frontend Platform | entitled/authorized tasks, recents, saved views | Controlled prototype |
| Configuration readiness | Owning domain plus Platform | prerequisites, validation, approval, activation | Pattern only |
| Import execution | Developer Platform plus owner commands | manifest, hash, preview, idempotency, reconciliation | Existing bounded seam |
| Review queue | Platform seam plus domain owner | assignment, SLA, owner reference, version, outcome | Prototype required |
| Extension inventory | Developer Platform | provenance, permissions, compatibility, health, disable | Governed by ADR-0019; paid marketplace deferred |

## Prototype evidence required

Test context switching with stale drafts; configure one capability with readiness and rollback; import mixed-validity records twice; approve an owner proposal after its source state changes; retry a failed job without duplicate effect; navigate representative tasks by role, search, and keyboard; and disable an extension without orphaning routes, jobs, APIs, or data access.

## Proposed Governed Follow-Up Changes

| Affected authority | Exact issue | Suggested change | Evidence and confidence | Urgency and review |
|---|---|---|---|---|
| PDA-UX-005 / navigation and global search | Context switching and configuration discovery need a shared consequence pattern | Add a visible context-and-scope confirmation pattern for consequential commands | ERP matrix and workflow; Medium | Before broader multi-organization UI; PDA and accessibility review |
| Platform administration specifications | Setup readiness is distributed across documents | Define a non-authoritative readiness contract referencing owner checks | Cross-suite setup evidence; Medium | Before configuration shell prototype; PDA/security review |
| Workflow/approval engine specifications | Shared review queues lack a single research-backed minimum item contract | Evaluate owner reference, version, freshness, consequence, and recovery fields | ERP and accounting findings; Medium | Before shared queue implementation; ADR review may be required |
| Developer Platform import/export | Migration evidence and reconciliation need consistent UI and contract treatment | Reconfirm manifest/hash/dry-run/row-error requirements across domain imports | Official import patterns plus Meridian contract discipline; Medium | Before bulk migrations; security/privacy review |
| Founder Decision Register | Initial paid implementation/partner service model is not defined | Record whether implementation services or partner certification are in initial commercial scope | Competitor implementation dependency cannot decide this; Low | Commercial planning; founder/legal review |

No direct authoritative edit is made by this research.

## Intentional exclusions

Generic ERP modules, enterprise consolidation, arbitrary low-code mutation, production marketplace payouts, custody, broad autonomous AI, and universal localization remain outside the first slice unless separately governed.

## Confidence, limitations, and revalidation

Confidence is Medium for the platform patterns and Low for implementation effort or customer outcomes. Revalidate after direct prototype tests, customer evidence, security/accessibility review, founder decisions, and major competitor release or packaging changes.

## Source register

See PDA-CIR-025 through PDA-CIR-027 and their dated official sources. No secondary source is load-bearing for these implementation findings.
