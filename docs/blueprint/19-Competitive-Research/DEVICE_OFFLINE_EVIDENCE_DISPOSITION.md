---
document_id: PDA-CIR-098
title: Device and Offline Evidence Disposition
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0010, ADR-0014, ADR-0017]
---

# Device and Offline Evidence Disposition

## Decision

CIR-BACK-025 is **Transferred with direct observation explicitly blocked**. PDA-CIR-097 records current first-party documentation, the exact missing access, contradictory/conditional behavior, and a twelve-scenario direct-evidence plan. This satisfies the backlog instruction to make the absence of observation explicit. It does **not** satisfy Meridian prototype, accessibility, provider, security, or implementation evidence and does not make any offline workflow ready for pilot or production.

## Evidence Accounting

| Evidence class | Status | What exists | What remains |
|---|---|---|---|
| official competitor documentation | Supported | Square, Shopify POS, Toast, Dynamics Field Service and Retail Pro sources retrieved 2026-07-16 | revalidate exact edition/geography/hardware before trials |
| direct competitor behavior | Blocked | none | lawful tenants, hardware, provider/payment access, representative data and controlled disruptions |
| competitor accessibility | Blocked | none | keyboard, screen reader, zoom/reflow, touch target, motion, timing and error-recovery evaluation |
| Meridian prototype behavior | Open | governed requirements and scenario plan | actual native/web/device/offline implementation tests and artifacts |
| security/privacy/device evidence | Open | threat-relevant hypotheses | device enrollment/key storage, revoke/wipe, tenant isolation, protected local data and forensic/audit tests |
| payment/provider certification | Open | documented provider uncertainty patterns | exact Guyana/provider/terminal eligibility, certification and outage/reconciliation testing |
| operational readiness | Open | failure/recovery requirements | telemetry, alerts/runbooks, capacity, restore, support, exercises and rollback evidence |

No `EVID-*` item is marked complete from this research.

## Adopt, Improve, Reject, and Defer

| Disposition | Finding | Rationale/confidence |
|---|---|---|
| Adopt | dependency-specific degraded states and visible pending/uncertain work | strong documented convergence; implementation untested |
| Adopt | online preparation, bounded local scope, leases/expiry, reconnect reconciliation and explicit unsupported actions | official docs repeatedly expose these constraints |
| Improve | one operator-readable certainty model across device, LAN, internet, service, provider and owner dependencies | documented products vary; prototype and user evidence required |
| Improve | durable command journal with per-command authority, idempotency, version, expiry and recovery evidence | Meridian requirement; no competitor implementation inference |
| Improve | topology-aware behavior: distinguish single device, local network, internet, provider and platform outage | Toast documentation demonstrates why one offline boolean is insufficient |
| Reject | treating queued, stored, provider-accepted or locally printed as final success | conflicts with payment, inventory, stored-value, cash and audit correctness |
| Reject | last-write-wins correction and silent expiry/data loss | conflicts with reversal/compensation and truthful recovery |
| Reject | documentation-only accessibility or behavioral proof | no direct evidence exists |
| Defer | production native/kiosk/scanner/field-device behavior beyond admitted first-slice depth | requires governed implementation and device/provider evidence |

## Proposed Governed Follow-Up Changes

These are proposals only; research does not amend the authorities.

| Affected authority | Exact issue | Suggested change | Evidence | Confidence | Urgency | Required review |
|---|---|---|---|---|---|---|
| offline/sync specification and ADR-0010 implementation plan | degraded state can differ by device, LAN, internet, platform and provider; one online/offline flag is unsafe | specify dependency/certainty state, command lease, local journal, first-sync readiness, retry/idempotency, conflict, tombstone, revoke and reconciliation semantics | PDA-CIR-097 | High need; implementation open | before prototype exit | Offline, Security, Data, affected owners; ADR amendment if semantics change |
| POS/Payment first-slice contracts | delayed card work can be locally accepted yet provider-uncertain and hardware/time limited | retain separate operation/attempt/provider/terminal state and explicit merchant/operator recovery; verify against exact selected provider | Square/Shopify/Toast docs; ADR-0017 | High principle | before terminal/provider prototype | Payment, POS, Finance, Security, provider/legal review |
| Inventory/warehouse/device specifications | concurrent scan/pick/count work requires leases, units, duplicate suppression and correction | add scenario-bound acceptance criteria at admitted depth; do not broaden warehouse scope | OFF-04/OFF-05 | Medium | before related prototype | Inventory, UX, Offline, Testing |
| Field Service/client specifications | offline media/signature/location can be highly sensitive and conflict-prone | define consent, local protection, upload resume, deletion and owner correction only at roadmap admission | Dynamics docs and OFF-06 | Medium | deferred | Field Service, Privacy, Security, Legal as applicable |
| Device security authority | offline revoke, key/session expiry, device compromise and reset behavior require direct evidence | bind command leases and local data access to device enrollment/key state; test revoke/quarantine/wipe | OFF-08/OFF-11 | High need | before prototype exit | Security, Platform Identity, Device owner |
| accessibility and UX standards | documented offline UIs do not prove assistive-technology behavior | run formal accessibility review on readiness, banners, countdowns, pending work, errors, conflicts and recovery | evidence gap and OFF-10 | High | before prototype exit | UX and Accessibility reviewers |
| testing matrix and implementation evidence register | research scenarios are not yet executable evidence records | create implementation-linked tests/evidence for OFF-01 through OFF-12 without marking complete until artifacts exist | PDA-CIR-097 | High | at workstream planning | Testing and every affected owner |
| Operations readiness | outage topology, pending work, local data loss and delayed reconciliation need live exercises | add telemetry/runbooks/alerts and execute network/provider/device/reset/reconnect drills after deployment exists | official failure guidance | High | before pilot | Operations, Security, provider owners |

## Direct-Test Entry Criteria

A lawful competitor or Meridian device trial must record:

- exact product, edition, plan, geography, release/app/OS version and date;
- hardware model/firmware/peripherals and network topology;
- provider/payment/terminal configuration and permitted test instruments;
- tenant/location/register/device/user roles and test-data classification;
- online baseline, prepared offline scope, clock/timezone and initial-sync state;
- disruption injection and recovery method;
- expected state, observed screen/nonvisual output, local persistence and server/provider evidence;
- retry/idempotency, conflict, duplicate, expiry, reset/revoke and compensation outcome;
- accessibility method and assistive technology;
- screenshots/video/logs only when lawful and stored under repository evidence/licensing/privacy policy—not copied into competitive documents by default;
- limitations, contradictions, incident impact and independent reviewer.

## Blocking Conditions

Direct competitor evidence is blocked on access to configured tenants, exact hardware/peripherals, provider/payment test permissions, safe outage labs, representative roles/data, and accessibility tooling. Meridian direct evidence is blocked until the relevant implementation/prototype exists and its governing documents identify the tested depth. These are evidence gates, not reasons to invent results or keep scope perpetually open.

## Transfer, Confidence, and Revalidation

Registration: CIR-LED-0015, RES-013, PDA-CIR-097 and PDA-CIR-098, and SRC-070 through SRC-074. Confidence is medium-to-high for documented constraints, **unknown** for directly observed competitor behavior, and **not yet evidenced** for Meridian implementation. Revalidate and run direct tests before any affected controlled prototype exits its permitted lifecycle; on exact product/hardware/provider changes; or by 2027-07-16.

## Related Meridian Authorities

PDA-FND-002, ADR-0003, ADR-0010, ADR-0014, ADR-0017, FIRST_SLICE_MANIFEST.md, PDA-PLT-005, PDA-DOM-003, PDA-DOM-004, PDA-SEC-001, PDA-UX-011, PDA-TST-001, PDA-OPS-019, PDA-CIR-097, `registry/first-slice.json`, `registry/first-slice-tests.json`, `registry/permissions.json`, and `registry/endpoint-permissions.json`.
