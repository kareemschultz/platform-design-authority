---
document_id: PDA-CIR-097
title: Direct Device and Offline Evidence Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0010, ADR-0014, ADR-0017]
---

# Direct Device and Offline Evidence Matrix

## Purpose and Evidence Boundary

This study answers CIR-BACK-025 by separating **officially documented device/offline behavior** from **directly observed behavior** and **Meridian prototype evidence**. At the 2026-07-16 cutoff, lawful public documentation was available, but configured product tenants, production-capable payment accounts, representative hardware, provider sandboxes, controlled outage environments, and Meridian native/offline prototype execution were not available in this research workspace.

Therefore:

- every competitor behavior below is **officially documented**, not directly observed;
- direct competitor device scenarios are **explicitly blocked by access**, satisfying only the backlog's accounting rule, not the implementation evidence requirement;
- no row proves accessibility, reliability, security, correctness, regional/provider eligibility, or Meridian fitness;
- no first-slice or production readiness claim follows from this document.

## Products, Device Classes, and Access

| Product/surface | Device class | Documented edition/geography context | Direct observation status |
|---|---|---|---|
| Square POS offline payments | Square Register/Terminal/Handheld/Stand/Reader and supported mobile POS modes | US support page; hardware/payment-method/time-limit eligibility varies | Blocked: no account, supported payment setup, hardware, card-network test permission, or outage lab |
| Shopify POS offline features | iOS/Android POS and supported card-reader/terminal configurations | public help; Shopify Payments, reader and regional behavior vary | Blocked: no configured store, supported reader/terminal, payment account, or outage lab |
| Toast offline mode | Toast POS/Toast Go, hardwired printer/KDS/network surfaces | restaurant ecosystem; background card processing and network layout matter | Blocked: no restaurant tenant, activated devices, processor, hub/KDS/printer network, or outage lab |
| Dynamics 365 Field Service Mobile | iOS, Android and Windows 10+ model-driven app | Field Service license and administrator-defined offline profile | Blocked: no licensed tenant, mobile profile, technician devices, work orders, or sync lab |
| Retail Pro Prism app | documented Windows/Android Prism app and retail POS environment | current public guides identify version-specific behavior/limitations | Blocked: no licensed environment, server/client topology, supported peripherals, or outage lab |
| Meridian controlled prototypes | web/native/device/offline first-slice surfaces | governed by first-slice and prototype authorities | Not executed in this research wave; must be evaluated by implementation workstreams and EVID records |

## Scenario Evidence Matrix

Legend: **Documented** means an official page states the behavior; **Unknown** means the source set did not establish it; **Blocked** means no direct trial was possible.

| Scenario/question | Square | Shopify POS | Toast | Dynamics Field Service | Direct observation and Meridian implication |
|---|---|---|---|---|---|
| prepare while online | offline settings and supported modes/devices documented | login/product import and hardware requirements documented | readiness/background processing/network preparation documented | admin configures offline profile and initial sync | Blocked; Meridian must prove preflight/readiness, not rely on outage-time discovery |
| connectivity state visible | offline session/banner/countdown behavior documented | offline limitations and device caution documented | banner/dialog after documented detection period | sync/globe status and progress documented | Blocked; accessible non-color announcement must be tested |
| bounded local work | cash/card subset | sale/offline feature subset | orders, card/cash, print/KDS subset with topology limits | profile-selected records and field work | Blocked; local authority must be explicit per command/data class |
| unsupported features disabled/explained | unsupported hardware/tenders/apps listed | login, gift card and hardware limits listed | gift card/loyalty/API/customer-credit and other limits listed | data depends on profile/filter; related data can be absent | Blocked; deterministic fallback and reason must be tested |
| delayed payment risk | merchant bears decline/expiry/dispute risk; upload windows documented | capture/reader behavior varies; online dependency documented | merchant risk and background processing constraints documented | not a payment surface | Blocked; Payment must retain provider uncertainty and never imply authorization |
| local persistence loss hazards | sign-out, app delete, mode/location switch or factory reset can lose pending payments | power-off/sign-out can risk offline orders | uninstall/clear memory and some network actions can lose data or extend downtime | initial/incomplete sync can leave no local data | Blocked; Meridian needs durable local journal, recovery and operator warnings tested |
| expiry/lease | documented session/upload time limits by hardware | no universal lease established in cited page | product-specific behavior; no universal lease established here | sync profile/interval rather than one universal command lease | Blocked; Meridian lease/expiry must be command-specific and governed |
| multi-device behavior | device-specific pending data and restrictions | device/app-specific | topology and outage type affect device coordination; offline payment guide warns devices may not sync | each device syncs its profile/data | Blocked; never assume local consensus across devices |
| reconnect/up-sync | automatic upload/process when reconnected within limits | offline orders/payment capture behavior reconnect-dependent | returns online/syncs; reporting may lag until sync | automatic and forced sync documented | Blocked; up-sync must be idempotent, resumable and observable |
| conflicts/duplicates | not fully established by cited public page | not fully established | not fully established | profile/sync docs establish filters and sync, not full business conflict semantics | Unknown; Meridian must test version conflicts, duplicate commands and compensation |
| tombstones/deletions | Unknown | Unknown | Unknown | Unknown in cited set | Meridian must define deletion/tombstone behavior; absence of vendor evidence is not permission to omit it |
| correction/reversal | offline payment failures become visible after processing; refund rules constrained | product-specific, not established here | product-specific, not established here | domain-specific | Meridian owner correction/reversal rules remain authoritative |
| device security | supported hardware/modes documented, effectiveness untested | supported hardware documented, effectiveness untested | managed ecosystem behavior documented, effectiveness untested | Intune capability listed; effectiveness untested | Blocked; enrollment, attestation, key storage, revoke, wipe and compromise tests required |
| accessibility | not established by offline documentation | not established | not established | not established | Direct WCAG/assistive-technology evidence blocked; mandatory formal review remains open |

## Documented Failure and Recovery Evidence

### Square

Square documents offline transactions stored in the POS app, automatic processing after reconnect, device/payment-method restrictions, merchant liability for declined/expired/disputed payments, and explicit data-loss hazards. It distinguishes internet outage from Square service disruption and documents hardware-dependent session/upload windows. These facts strongly support bounded leases, visible pending state, provider uncertainty, recovery countdown, and “do not sign out/reset” warnings. They do not prove storage implementation, encryption effectiveness, accessibility, or success rates.

### Shopify POS

Shopify documents that login needs connectivity to import product data, gift cards are unavailable offline, app extensions vary in offline support, hardware behavior varies, and power-off/sign-out can lose offline orders. This supports preloaded-scope disclosure and dependency-specific degradation. It does not establish uniform offline payment support or complete conflict/recovery behavior.

### Toast

Toast documents automatic offline mode after a connection problem, different behavior for local-network, internet, or cloud disruption, continued subset operation, and important restrictions. Current guidance says orders and card payments can continue under conditions, while reporting and several tender/loyalty/API paths pause. Some pages describe local hub/device behavior for particular outage topologies while other pages warn that devices cannot synchronize in other offline conditions; this is not a contradiction to erase but evidence that **outage topology is part of the state model**.

### Dynamics 365 Field Service Mobile

Microsoft documents administrator-defined offline profiles, initial and delta/up sync, status/progress, filtered local data, and background synchronization. Troubleshooting documentation describes blank/no-data outcomes after incomplete or invalid-profile synchronization and related-table filter failures. This supports explicit profile completeness validation, first-sync readiness, dependency closure, manual retry and admin diagnostics. It does not prove business conflict resolution or accessibility.

### Retail Pro Prism

Retail Pro publishes current version-specific POS/application guides and describes desktop/mobile surfaces. These sources confirm a maintained device context but did not provide enough public, normalized failure/reconnect detail for a load-bearing offline behavior conclusion. This product remains useful as a named/device comparator and **Insufficient Evidence** for direct offline semantics.

## Meridian Scenario Set Required for Direct Evidence

| Scenario ID | Device/workflow | Required disruption | Required proof |
|---|---|---|---|
| OFF-01 | POS cash sale and receipt | internet unavailable before cart | allowed scope, numbering, tax snapshot, receipt, journal durability, up-sync |
| OFF-02 | card-present attempt | provider/network unavailable before authorization | no false authorization, provider/terminal uncertainty, lease, recovery/reconciliation |
| OFF-03 | POS return/refund | original sale locally absent or provider unavailable | safe block/fallback, lookup proof, permission, correction and customer communication |
| OFF-04 | inventory scan/count | repeated scan and device reconnect | deduplication, unit/lot context, concurrency conflict and owner correction |
| OFF-05 | warehouse pick/transfer | two devices act on same reservation | lease expiry, conflict, partial completion, reversal/compensation and review queue |
| OFF-06 | field-service evidence | media/signature captured offline | consent, encryption, local protection, upload resume, retention and deletion |
| OFF-07 | kiosk session | network loss mid-session | timeout, privacy reset, payment uncertainty, receipt/recovery and no cross-user leakage |
| OFF-08 | native device revoke | device offline when revoked | bounded lease, key/session expiry, queued-command rejection and reconnect quarantine |
| OFF-09 | upgrade/schema change | old client reconnects with queued work | compatibility window, migration, rejected-version recovery and no data loss |
| OFF-10 | accessibility | screen reader/keyboard/switch/zoom under degraded state | perceivable state, operable recovery, time extension, non-color certainty and error announcement |
| OFF-11 | destructive local event | app close, OS kill, reboot, low storage, clock skew | journal durability, monotonic ordering, user warning, recovery and evidence |
| OFF-12 | server accepts then response is lost | reconnect/up-sync timeout | idempotent replay, duplicate suppression, truthful uncertainty and final reconciliation |

## Things Meridian Must Never Copy

- “Offline” as a single boolean across device, LAN, internet, provider and service dependencies.
- A universal promise that all online features work offline.
- Hidden merchant/operator risk for delayed authorization or stale data.
- Pending work stored only in an opaque app state with no governed durability/recovery evidence.
- Silent deletion after lease/upload expiry.
- Device reset/sign-out guidance without consequence-aware blocking or warning.
- Last-write-wins for consequential financial, inventory, stored-value, payroll, cash or audit facts.
- Provider acceptance shown as final success.
- Direct-observation or accessibility claims inferred from help pages, screenshots, demos, or marketing.

## Confidence and Revalidation

Confidence is high that the cited pages document materially different degraded modes, constraints, recovery hazards and user-visible states. Confidence is **unknown** for actual device behavior in this workspace because no direct trial occurred. Revalidate the documentation before a trial, then execute the scenario set on exact product editions, operating systems, hardware, provider configurations and network topologies.

## Sources

All retrieved 2026-07-16:

1. [Square offline payments](https://squareup.com/help/us/en/article/7777-process-card-payments-with-offline-mode) — supported modes/hardware/tenders, risk, time limits, pending state, data-loss hazards and reconnect behavior; US context.
2. [Shopify POS offline features](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/selling-offline/offline-features) — feature/hardware limits and data-loss cautions; plan/region/payment setup varies.
3. [Toast offline mode](https://doc.toasttab.com/doc/platformguide/platformOfflineMode.html), [offline mode overview](https://doc.toasttab.com/doc/platformguide/adminOfflineModeOverview.html), and [offline payments overview](https://doc.toasttab.com/doc/platformguide/platformOfflinePaymentsOverview.html) — outage types, banners, local/cloud dependencies, supported work and limits; topology/configuration varies.
4. [Dynamics Field Service work offline](https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/work-offline), [offline profile](https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/set-up-offline-profile), [mobile overview](https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/overview), and [mobile troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/dynamics-365/field-service/mobile-app/mobile-app-common-issues) — profile, sync, supported device features and failure recovery; licensed tenant unavailable.
5. [Retail Pro current documentation](https://my.retailpro.com/documentation/?bookid=1&chapterid=1&documentid=2&p=4) and [Prism app guide](https://my.retailpro.com/documentation/?bookid=287&chapterid=0&documentid=287&p=4) — current device/version context; direct offline detail insufficient.

Stable source records: SRC-070 through SRC-074.
