---
document_id: PDA-CIR-095
title: Infrastructure Operations Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# Infrastructure Operations Implementation Findings

## Executive Finding

Meridian should adopt source-qualified infrastructure observations and explicit reconciliation, not a universal CMDB or network-controller ownership shortcut. The durable requirement is a three-truth model: the owning Meridian authority retains intended/business truth; external systems provide observed or controller truth with provenance and freshness; a governed reconciliation workflow proposes owner commands and preserves uncertainty. Consequential remote action needs its own operation, target-attempt, approval, secret-use, and verification evidence.

## Table Stakes and Differentiation Candidates

### Table stakes

- inventory identity with site/location relationships and lifecycle;
- IP/prefix/VLAN and device identifiers where admitted;
- source installation, authentication, least-privilege scopes, and health;
- import/discovery manifests, pagination, rate limits, retries, and freshness;
- matching, duplicate/contradiction review, owner decision, and audit;
- change history, actor/source correlation, export, backup/restore, upgrade, and disable/data exit;
- roles and target scope separated from credentials;
- truthful partial, stale, unreachable, uncertain, verified, and failed states;
- bulk preview/caps and safe remote-action control.

### Prototype-required differentiation candidates

- one cross-domain reconciliation queue that retains source/owner boundaries;
- intended/discovered/operational comparison with consequence-aware freshness;
- approval bound to an exact target/action/version preview hash;
- provider acceptance and independently verified effect displayed separately;
- contradiction routing to the owning command without duplicating owner data;
- accessible structured alternatives to topology and high-density network views.

These are candidates, not competitive advantages. No implementation or user evidence exists.

## Proposed Governed Follow-Up Changes

Research does not directly amend these authorities. Each proposal requires normal ownership, review, and lifecycle treatment.

| Affected authority | Exact issue | Suggested change | Evidence | Confidence | Urgency | Required review |
|---|---|---|---|---|---|---|
| `registry/capabilities.json`, capability catalog, domain ownership | no admitted canonical capability currently owns infrastructure discovery/reconciliation/network operation | at roadmap admission, register the minimum capabilities and owner contracts; keep source connection, Assets/Maintenance truth, Service coordination, and Platform execution distinct | PDA-CIR-093/094 | Medium | before prototype | PDA/domain owners/founder for scope; ADR if boundary changes |
| Assets and Maintenance specifications | relationship between authoritative assets, managed endpoints and controller observations is not specified for this deferred area | add source-qualified projection/link/reconciliation semantics only when admitted | NetBox/phpIPAM/Snipe-IT/controller contrast | Medium | before prototype | Assets, Maintenance, Security, Data |
| Developer Platform integration authority | external DCIM/IPAM/controller adapters need installation, webhook, API-version, disable and data-exit requirements | define provider-neutral adapter contract and per-provider capability evidence; external webhooks remain Developer Platform owned | official APIs/webhooks | Medium | before adapter | Developer Platform, Security, Operations; ADR-0019 review |
| Platform Secrets and delegation | high-privilege network credentials and partner/operator authority create broad blast radius | specify tenant/environment/target/action-bound secret use and time-bounded delegation; retain only secret-use references in evidence | compared role/token/action surfaces | High principle; effectiveness untested | before any remote action | Security, Platform Identity, privacy/legal where monitoring applies |
| Jobs/workflow/automation specifications | ordinary background-job status is insufficient for provider acceptance, per-target attempts and uncertain effects | define operation/attempt/verification/expiry/cancellation/reconciliation semantics before using remote automation | PDA-CIR-094 | Medium | before prototype | Platform, affected owner, Security, Operations; ADR if runtime changes |
| Audit and privacy authorities | discovered infrastructure and action output may reveal sensitive topology, identities, configurations or customer data | classify fields/outputs, redact secrets, scope evidence access, preserve legal/privacy hold and deletion-journal behavior | provider data and remote-operation evidence | High need; exact classification open | before ingestion | Security, Privacy, Legal as applicable |
| UX/navigation standards | topology and dense reconciliation tables need accessible non-visual, responsive and review-safe patterns | govern source/freshness/uncertainty displays, accessible diff/table alternative, target preview and recovery | PDA-CIR-093/094 | Medium | before UI prototype | UX and formal accessibility review |
| Operations readiness | no deployable service/agent/collector/provider exists to exercise backup, compatibility, stale-source, kill or restore behavior | add service-specific readiness only after deployment selection; do not claim PDA-OPS-019 covers it | access limitations | High | before pilot | Operations, Security, provider owner |
| Founder Decision Register / roadmap | infrastructure/DCIM/IPAM/network automation is outside the current constrained slice | retain explicit deferral or make a named admission decision with customer/value/risk evidence | FIRST_SLICE_MANIFEST and this study | High | at roadmap consideration | Founder and PDA |

## Candidate Contract Semantics, Not Approved Schemas

If admitted, design should evaluate Source Installation, Source Credential Reference, Collection Run, Source Observation, Normalization Version, Authoritative Link, Candidate Match, Contradiction, Reconciliation Decision, Remote Action Definition, Remote Action Operation, Target Attempt, Approval Reference, Secret Use Reference, Provider Correlation, Verification Result, and Compensation Record.

Minimum invariants:

- opaque identities and explicit tenant/source/site scope;
- immutable source identity, observation time, ingestion time, provenance and evidence hash/reference;
- intended and observed values never overwrite one another silently;
- matches are versioned decisions, not mutable foreign-key guesses;
- every accepted change invokes the authoritative owner's application command;
- provider transport, acceptance, target acknowledgement and verified effect are distinct;
- uncertainty is durable and assigned until reconciled or explicitly expired under policy;
- consequential retries use verified idempotency or safe re-read/deduplication;
- correction appends or compensates; audit evidence is not rewritten;
- deletion, retention, privacy hold, export and source uninstall are explicit.

No new identifier, endpoint, event, permission, namespace, schema, or technology is authorized here.

## Security and Abuse Cases

Threat modeling must include cross-tenant source mapping, malicious collector/controller, stolen provider token, plugin/template/code execution, webhook replay, source poisoning, duplicate-identity takeover, stale observation used for change, target substitution after approval, mass-action blast radius, privilege/secret revocation race, output/backup exfiltration, covert monitoring, device impersonation, provider callback loss, and audit tampering.

Required controls include allowlisted egress, signed/authenticated source delivery, schema/size/rate bounds, tenant binding, least privilege, secret broker references, protected output, deterministic target resolution, approval-preview binding, just-in-time reauthorization, cohort caps, throttling, kill/quarantine, independent verification, immutable correlation, and tested disable/revoke paths.

## Operational and Testing Impact

A future prototype must test:

- API pagination, rate limiting, malformed/business-error envelopes, replay and version incompatibility;
- baseline/resume manifests and counts across partial failures;
- freshness, expiration, unreachable collectors and contradictory source data;
- duplicate and cross-tenant match attacks;
- conditional writes where supported and concurrency conflict where not;
- queue timeout, callback loss, provider outage, offline target, revocation and target drift;
- partial bulk action, stop threshold, compensation, evidence loss and reconciliation;
- credential rotation and emergency revoke;
- adapter/agent upgrade, rollback, backup/restore and uninstall/data exit;
- accessible high-volume review, non-visual topology alternative and mobile transformation;
- AI-disabled essential workflows and malicious AI suggestion rejection.

## Intentional Exclusions

This study does not authorize or claim completeness for CMDB, DCIM, IPAM, network source of truth, topology, scanning, configuration backup, firewall management, SD-WAN, Wi-Fi management, monitoring, RMM, NAC, vulnerability management, secret vault, remote shell/desktop, arbitrary scripts, network AI, multi-vendor orchestration, or marketplace plugins. It does not establish provider availability, licensing, compliance, security, performance, accessibility, Guyana fit, or production readiness.

## Transfer, Confidence, and Revalidation

CIR-BACK-023 may be marked **Transferred** because PDA-CIR-093 through PDA-CIR-095, CIR-LED-0013, RES-011, and SRC-057 through SRC-061 provide the requested documented comparison, workflow, controls, and follow-up traceability. Transfer means the Draft evidence is registered; independent review, configured-product observation, threat/security assessment, customer evidence, provider selection, roadmap admission, and implementation evidence remain open.

Confidence is medium for the source/discovery/reconciliation boundary and low for product quality, defaults, scale, accessibility, security effectiveness, deployment effort, and regional suitability. Revalidate before roadmap admission, provider selection, a material product/API/security change, or 2027-07-16.

## Related Meridian Authorities

PDA-FND-002, ADR-0002, ADR-0003, ADR-0014, ADR-0019, PDA-DOM-013, PDA-DOM-014, PDA-DOM-021, PDA-PLT-005, PDA-SEC-001, PDA-DEV-003, PDA-OPS-019, PDA-UX-011, PDA-CIR-093, PDA-CIR-094, `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `registry/architecture-rules.json`, and `registry/first-slice.json`.
