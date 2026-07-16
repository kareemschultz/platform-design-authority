---
document_id: PDA-CIR-081
title: Platform Advantage Register
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014, ADR-0017]
---

# Platform Advantage Register

## Purpose and status vocabulary

This register separates table stakes from candidate advantage and proof. “Prototype Required” is not a market claim. Stable IDs are local to this document.

| ID | Candidate | Status | Evidence | Owner/transfer destination | Next proof |
|---|---|---|---|---|---|
| ADV-001 | authority and freshness visible in cross-domain projections | Prototype Required | ERP, CRM, analytics, search waves | platform UX plus domain owners | permission/freshness usability and isolation tests |
| ADV-002 | shared uncertainty and recovery vocabulary | Prototype Required | POS, payments, offline, integration research | Offline, Payment, UX, Operations | timeout/offline/conflict recovery exercises |
| ADV-003 | shared review queue, domain-owned commit | Prototype Required | accounting, service, automation research | workflow seam plus domain owners | two-domain prototype without authority leakage |
| ADV-004 | reversal/effective-date correction grammar | Prototype Required | accounting, inventory, manufacturing, payroll | owning domains and UX | conservation, audit reconstruction and user correction tests |
| ADV-005 | deterministic workflows with AI disabled | Supported | AI research and existing authority | AI/platform/domain owners | end-to-end disabled/provider-failure tests |
| ADV-006 | capability readiness and evidence visibility | Supported | research and governance program | PDA/Developer Platform | freshness automation and external comprehension |
| ADV-007 | governed regional capability packs | Deferred | ERP/workforce/payment research | founder/PDA/legal/provider owners | one qualified regional pilot |
| ADV-008 | source-linked change communication by audience | Prototype Required | documentation/changelog wave | Developer Platform/UX | public, in-app, developer and tenant-audit separation |

## Table stakes—not differentiators

Responsive UI, keyboard support, search, imports, dashboards, APIs, notifications, approval, audit logging, mobile access, common integrations, basic AI drafting, and basic offline caching are expected capabilities. They become differentiating only through evidenced quality in a defined segment.

## Rejected advantage claims

Do not claim “all-in-one,” “AI-native,” “secure,” “compliant,” “offline-first,” “global,” “real time,” “best,” or “world-class” from blueprint intent alone. These words require bounded definitions and independent evidence.

## Confidence and maintenance

Confidence is medium. Update only when implementation/pilot evidence changes a status; never promote from research volume. See IMPLEMENTATION_EVIDENCE_REGISTER.md.

