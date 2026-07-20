---
document_id: PDA-CIR-093
title: Infrastructure, DCIM, IPAM, and Network Operations Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# Infrastructure, DCIM, IPAM, and Network Operations Competitive Capability Matrix

## Purpose and Authority Boundary

This study answers CIR-BACK-023: which infrastructure-inventory, DCIM, IPAM, asset-accountability, controller, and network-automation patterns may inform Meridian without making a discovered record or external controller authoritative for a Meridian business domain. It is research input only. It does not admit infrastructure management to the first slice, select a provider, authorize network control, register a capability, or change Assets, Service, Platform, Developer Platform, Security, or Operations ownership.

Meridian's Constitution, ADR-0002, ADR-0003, ADR-0014, ADR-0019, domain specifications, secrets controls, and registries remain authoritative. An external object is a source-qualified projection until the owning Meridian authority accepts or links it. A controller's ability to mutate infrastructure is not permission to change a Meridian asset, service, tenancy, Party, location, or commercial fact.

## Research Cutoff, Products, and Evidence Method

Research cutoff: **2026-07-16**. Evidence was read from public first-party documentation. No configured tenant, appliance, agent, network, paid edition, plugin, API call, restore, upgrade, packet capture, remote action, accessibility test, or security assessment was performed.

| Product/surface | Segment and edition context | Evidence mode | Important access limitation |
|---|---|---|---|
| NetBox current stable documentation | open-source network source-of-truth/DCIM/IPAM platform | officially documented; public source is available but not architecture-audited here | no configured instance, plugin, webhook receiver, concurrent-write, or upgrade test |
| phpIPAM 1.8.1 documentation | open-source IP address management | officially documented; public source available | no discovery scan, agent, API, authentication, or upgrade test |
| Snipe-IT current public documentation/API | open-source asset-accountability system | officially documented; public source available | no asset import, audit, label/device, API, or permission test |
| UniFi Site Manager and local Network APIs | managed/local network administration | officially documented | no console, site, gateway, supported-device, role, API, backup, or outage test |
| FortiGate 7.4/7.6 administration guidance | enterprise firewall/network automation | officially documented | no appliance, FortiManager, fabric, CLI, automation stitch, or privilege test |

Product families are deliberately non-equivalent: NetBox emphasizes intended network state and inventory; phpIPAM emphasizes address planning/discovery; Snipe-IT emphasizes custody/accountability; UniFi and FortiGate operate infrastructure. Their overlap is useful evidence, not justification for a universal Meridian infrastructure module.

## Capability and Boundary Matrix

Legend: **D** directly documented in the cited public collection; **P** partial or differently scoped; **N/E** not established by this study. Ratings describe the cited surface, not quality or deployment fitness.

| Capability/boundary | NetBox | phpIPAM | Snipe-IT | UniFi | FortiGate | Meridian implication |
|---|---:|---:|---:|---:|---:|---|
| intended-state inventory | D | P | P | P | P | retain owner/source/freshness; never infer authority from field similarity |
| sites, locations, racks, devices | D | P | P | P | P | location and asset references remain mapped to their Meridian owners |
| prefixes, addresses, VLANs | D | D | N/E | P | P | IPAM identity is separate from device, tenant, site, and service identity |
| asset custody/check-out | N/E | N/E | D | N/E | N/E | accountability workflows must not be synthesized from controller presence |
| discovery/scanning | integration-oriented | D | N/E | D | D | discovered state is observation with time, source, confidence, and expiry |
| controller operational state | N/E | N/E | N/E | D | D | useful for diagnostics; never silently overwrites intended or business state |
| change history/audit | D | D/P | D/P | P | D/P | retain source audit references, but Meridian commands also require native audit |
| REST/API integration | D | D | D | D | D/P | adapters need explicit tenant install, scopes, rate limits, idempotency, and disable/data-exit behavior |
| webhooks/event delivery | D | P | P | P | automation-oriented | provider notification is an input, not a canonical Meridian event |
| bulk operations | D | D/P | D/P | P | D/P | preview, caps, partial-result semantics, and reconciliation are mandatory |
| concurrent update protection | D for documented ETag/If-Match support | N/E | N/E | N/E | N/E | capability must be verified per adapter; absent proof requires safe serialization/re-read |
| roles and delegated administration | D/P | D/P | D/P | D | D | provider roles cannot stand in for Meridian permissions, delegation, or Party/domain roles |
| credential/secret use | token/API mechanisms | token mechanisms | token mechanisms | API keys/console credentials | privileged appliance credentials | secrets stay in Platform Secrets; logs/records retain only references |
| plugins/customization | D | P | P | integrations | automation/connectors | ADR-0019 isolation and lifecycle rules apply; no arbitrary core-process execution |
| backup/restore/upgrade | D/P | D | D/P | D/P | D | operational evidence must cover restore, compatibility, migration, rollback, and data exit |
| remote mutation | API-mediated data change | IPAM/data change | asset/accountability change | network/device operation | network/security operation | consequence, target, approval, credential, provider response, and observed effect are separate records |
| offline/degraded certainty | N/E | N/E | N/E | controller/device dependent | appliance/management-plane dependent | never assume reachability or success; represent queued, accepted, uncertain, verified, failed, and expired states |

## Strong Patterns

### Intended, discovered, and operational state are distinct

NetBox describes its API across DCIM, IPAM, tenancy, virtualization, circuits, and related models, with change logging on most objects and request identifiers for correlation. phpIPAM documents discovery scanning beside managed IPAM. UniFi and FortiGate expose live controller/device operations. Together, these surfaces support a high-confidence pattern: **intended state**, **discovered state**, and **operational state** must remain distinguishable even when one product displays all three.

Meridian should represent provenance explicitly:

- source/provider and source object identity;
- tenant/site/location/asset mapping state;
- observed time and ingestion time;
- freshness/expiry and collection method;
- expected/intended value versus observed value;
- confidence and contradiction;
- reconciliation owner, decision, and evidence;
- last verified command/effect correlation where applicable.

### Optimistic concurrency and bulk atomicity are adapter facts

NetBox documents ETag/`If-Match` handling for concurrent updates and all-or-none behavior for a documented bulk deletion path. These are useful provider-specific facts, not universal guarantees. Every adapter must record which operations support conditional writes, idempotency, atomicity, pagination, partial success, and retry. Meridian must not infer write safety from the existence of a REST API.

### Asset accountability is not device discovery

Snipe-IT's asset workflow centers on assignment, check-out/check-in, audit, and accountability. A network controller can report that a device exists or is connected, but cannot prove custody, approved use, ownership, depreciation, warranty, location authority, or disposal. Meridian must preserve the Assets/Maintenance boundary and reconcile controller evidence through an explicit proposal.

### Remote automation needs higher control than ordinary record editing

FortiGate documents system actions such as backup and reboot, and notes that some automation paths can bypass interactive CLI confirmation. This is direct evidence that provider-side convenience can remove a human safeguard. Meridian must add its own preview, risk classification, permission, approval, target binding, credential reference, execution identity, uncertainty, verification, and protected evidence around consequential adapter actions.

### Provider response envelopes are not uniform success signals

Snipe-IT's API overview warns that some business outcomes are represented in a JSON status payload even when the HTTP status is 200. Meridian adapters must validate the product-specific response contract rather than equate transport success with business success.

## Weak Patterns and Things Meridian Must Never Copy

- A universal inventory table that mixes authoritative, imported, discovered, and operational facts without provenance.
- Automatic creation of authoritative assets, locations, organizations, tenants, Parties, services, or entitlements from discovery.
- A topology screen that implies current truth without collection time, unreachable state, confidence, and contradiction.
- Reusing a provider's global administrator, site role, or API token as Meridian authorization.
- Credentials in custom fields, notes, scripts, webhook payloads, audit text, exports, or job parameters.
- Treating HTTP acceptance, queue dispatch, device acknowledgement, or ticket closure as verified effect.
- Unbounded scans, mass changes, or reboot/backup actions without target preview, caps, throttling, maintenance policy, and abort/reconcile paths.
- Executing user-supplied templates, plugins, scripts, or connectors in the core application process; NetBox's webhook security warning reinforces the ADR-0019 boundary.
- Assuming a backup exists, is complete, or restores because a vendor exposes a backup control.
- Letting a controller's product taxonomy redefine Meridian domain ownership.

## Customer Pain Hypotheses

These are hypotheses, not prevalence claims:

- operators cannot tell whether a field is intended, imported, discovered, or live;
- duplicate device identities arise across controller, IPAM, asset, service, and procurement tools;
- stale discovery looks authoritative after credentials, agents, or collectors fail;
- broad controller permissions make safe delegation difficult;
- automation reports success before the target effect is verified;
- mass actions lack clear blast-radius preview and recovery evidence;
- integration upgrades silently alter fields, tokens, pagination, or webhook semantics;
- asset custody and network presence disagree without a controlled reconciliation queue.

## Adopt, Improve, Reject, and Defer

| Disposition | Pattern | Confidence |
|---|---|---|
| Adopt | source-qualified intended/discovered/operational state and explicit freshness | High for documented need; implementation untested |
| Adopt | provider request correlation, conditional-write support when verified, and immutable reconciliation evidence | Medium |
| Improve | one review queue for cross-source contradictions that dispatches owner commands without becoming the owner | Medium; prototype required |
| Improve | remote-action operation/attempt model with preview, caps, approval, uncertainty, verification, and compensation | Medium; threat model and prototype required |
| Combine | NetBox-style network modeling, phpIPAM-style discovery, Snipe-IT accountability, and controller telemetry only through mapped contracts | Medium |
| Reject | discovery-as-authority, provider-role-as-permission, and transport-success-as-effect | High |
| Reject | ungoverned scripts/plugins/templates or credentials embedded in records | High under ADR-0019 and security authority |
| Defer | production DCIM/IPAM, topology, scanning, controller management, configuration backup, and network automation | High; outside current first slice |

## Confidence, Contradictions, and Revalidation

Confidence is **medium** for workflow and boundary findings, **low** for configured defaults, security effectiveness, performance, accessibility, edition parity, and operational quality. Product documentation supports feature and workflow facts but does not prove usability or reliable implementation. The main contradiction is structural: integrated products make inventory and operations feel unified, while Meridian must preserve owner-specific authority and uncertainty.

Revalidate before any infrastructure/DCIM/IPAM/network-operations roadmap admission; before selecting or implementing an adapter; after a material API/security/plugin/upgrade change; or by 2027-07-16.

## Source Register

All sources retrieved 2026-07-16:

1. [NetBox REST API](https://netbox.readthedocs.io/en/stable/integrations/rest-api/) — endpoint organization, change logging, request correlation, tokens, concurrency and bulk behavior; public docs, no instance tested.
2. [NetBox webhooks](https://netbox.readthedocs.io/en/stable/integrations/webhooks/) — event-rule delivery, snapshots and user-template security warning; no receiver tested.
3. [phpIPAM documentation](https://phpipam.net/documents/) and [current changelog](https://phpipam.net/documents/changelog/current/) — version, API/discovery/upgrade documentation and current security-fix evidence; no deployment tested.
4. [Snipe-IT managing assets](https://snipe-it.readme.io/docs/managing-assets), [API overview](https://snipe-it.readme.io/reference/api-overview), and [hardware audit endpoint](https://snipe-it.readme.io/reference/hardware-audit-by-id) — accountability, API response semantics and audit operation; no API call tested.
5. [UniFi official API](https://help.ui.com/hc/en-us/articles/30076656117655-Getting-Started-with-the-Official-UniFi-API) and [Site Manager remote management](https://help.ui.com/hc/en-us/articles/20680072882967-UniFi-Remote-Management-via-Site-Manager) — centralized/local API and site-management surfaces; no console tested.
6. [FortiGate system actions](https://docs.fortinet.com/document/fortigate/7.6.3/administration-guide/108345/system-actions) and [automation stitches](https://docs.fortinet.com/document/fortigate/7.4.7/administration-guide/139441/automation-stitches) — consequential actions, triggers, confirmation and fabric limits; no appliance tested.

Stable collection records: SRC-057 through SRC-061.
