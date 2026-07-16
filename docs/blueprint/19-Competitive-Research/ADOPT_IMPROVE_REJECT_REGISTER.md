---
document_id: PDA-CIR-082
title: Adopt Improve Reject Register
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014, ADR-0017, ADR-0019]
---

# Adopt Improve Reject Register

## Purpose

This is a deduplicated transfer index for repeated research decisions. It does not amend the named authorities.

| ID | Disposition | Pattern | Conditions | Transfer destination | Status |
|---|---|---|---|---|---|
| AIR-001 | Adopt | stable operation identity and idempotency | owning command and correlation | Payment, Commerce, workflows | Supported |
| AIR-002 | Adopt | effective-dated and append-oriented consequential facts | clear owner and reproducible history | Finance, Inventory, HR, Payroll | Supported |
| AIR-003 | Adopt | fast search, saved views and command navigation | visible scope, permission and freshness | UX/Search | Supported |
| AIR-004 | Adopt | source-linked summaries, drafts and suggestions | editable, auditable, deterministic fallback | AI/domain UX | Supported |
| AIR-005 | Improve | offline operation | signed bounds, certainty, conflicts and reconciliation | Offline/Device/domain specs | Prototype Required |
| AIR-006 | Improve | shared inbox/review mechanics | domain-owned decisions and no copied authority | Platform workflows | Prototype Required |
| AIR-007 | Improve | cross-domain suite navigation | task/context model, not module maze | Navigation/UX | Prototype Required |
| AIR-008 | Improve | analytics/dashboard delivery | governed metric, freshness and accessible alternative | Data/UX | Prototype Required |
| AIR-009 | Improve | plugin/extensibility ecosystems | isolation, review, permission, provenance, compatibility | ADR-0019/Developer Platform | Supported |
| AIR-010 | Reject | destructive correction of consequential facts | reversal/compensation required | all owning domains | Supported |
| AIR-011 | Reject | provider SDK/object as platform business contract | adapter boundary required | Payment/integrations | Supported |
| AIR-012 | Reject | generic contact/user as canonical Party | Party link and domain role required | Party/Identity/domains | Supported |
| AIR-013 | Reject | prompt, notification, comment or UI visibility as authority | ordinary authorization required | AI/UX/security | Supported |
| AIR-014 | Reject | hidden offline/provider uncertainty | explicit review/reconciliation | Offline/Operations | Supported |
| AIR-015 | Reject | module count, customization breadth or marketplace size as quality | outcome/evidence evaluation | product strategy | Supported |
| AIR-016 | Defer | marketplace funds, publisher payouts and payment facilitation | founder/legal/provider gates | Founder Decision Register | Deferred |

## Confidence and limitations

Confidence is high for constitutional fit and medium for experience benefit. Items marked Prototype Required remain hypotheses. Revalidate when an owning authority changes or first-party evidence contradicts the research.

