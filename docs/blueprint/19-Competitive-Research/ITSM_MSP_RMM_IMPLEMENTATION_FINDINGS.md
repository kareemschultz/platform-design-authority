---
document_id: PDA-CIR-089
title: ITSM, MSP, and RMM Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# ITSM, MSP, and RMM Implementation Findings

## Executive Finding

Meridian should adopt the relationship discipline of mature ITSM, the client/agreement context of PSA, and the resource-scoped execution controls of RMM, but must not collapse those products into one ownership model. The differentiator is an evidence-first action boundary: a service record coordinates work; an asset/device reference identifies the target; Platform authority controls the actor and secret; the owning domain performs the mutation; every uncertain remote effect is reconciled.

## Adopt, Improve, Reject, and Defer

| Disposition | Finding | Rationale |
|---|---|---|
| Adopt | separate incident, problem, change, request, asset/configuration, work order, agreement/SLA, and evidence identities | each has different owner, lifecycle, correction, reporting, and closure meaning |
| Adopt | deterministic escalation with owner, clock, pause reason, trigger, and policy version | hidden SLA pauses and notification-only assignment create operational ambiguity |
| Adopt | device/site/client-scoped roles and remote-tool permissions | product evidence consistently treats target visibility and action authority as separable |
| Improve | one cross-domain review shell over owner commands and evidence | reduces operator fragmentation without moving business rules or data ownership into Service/UI |
| Improve | generated action preview with target diff, risk, consent, credential, cohort, rollback, and evidence plan | market consoles expose powerful remote controls; Meridian needs consequence visibility before dispatch |
| Improve | durable operation plus per-target attempts and uncertainty reconciliation | remote delivery, offline devices, provider timeouts, and retries make binary job status unsafe |
| Improve | agreements/SLA linked to Commercial/entitlement/Finance facts by contract, not copied into tickets | PSA convenience must not create duplicate commercial or accounting authority |
| Reject | universal MSP administrator, immutable broad administrator as ordinary operating role, or support access implied by partner relationship | conflicts with least privilege, tenant scope, delegation, and audit boundaries |
| Reject | credentials in notes, custom fields, script parameters, exports, or reusable provider objects | conflicts with Platform Secrets and protected-data controls |
| Reject | ticket closure as proof of service restoration, permanent fix, asset correction, billing completion, or audit completion | closure meanings remain domain specific |
| Reject | monitoring signal or discovered device as current authoritative asset truth | discovery is stale/fallible projection until reconciled by the owner |
| Reject | arbitrary provider or marketplace code in the core process | ADR-0019 prohibits it; adapters and isolated extension runtimes remain the boundary |
| Defer | production RMM agent, remote desktop, background shell, credential broker, cross-client analytics, AI-run remediation, and marketplace integrations | require roadmap admission, provider/technology selection, threat model, ADRs, external evidence, and implementation tests |

## Proposed Architecture Impact

No immediate source authority changes are authorized. At roadmap admission, review must decide:

1. whether Service owns incident/problem/change records or change belongs to a separately registered operational-governance capability;
2. how Assets/Maintenance authoritative records map to Platform device enrollment and external discovered-device projections;
3. whether remote action is a Platform command family, Maintenance execution seam, isolated extension, or provider adapter boundary;
4. how partner/MSP delegation relates to tenant membership without turning a Better Auth user into Party or a domain role;
5. which operations are internal only versus supported public API, webhook, or extension contracts;
6. how agent deployment, connectivity, update, revocation, quarantine, data residency, and failure recovery are deployed and operated.

These are ADR/capability-registration triggers. Research must not decide them implicitly.

## Data and Integrity Implications

Candidate concepts for an admitted specification—not approved schemas—include Service Case, Incident, Problem, Known Workaround, Change, Service Contract Reference, SLA Evaluation, Managed Endpoint Projection, Delegation Grant Reference, Diagnostic Request, Remote Action Definition, Remote Action Operation, Target Attempt, Consent/Notice Evidence, Credential Use Reference, Verification Result, and Escalation Record.

Each record requires opaque identity, tenant, owner, version/concurrency, lifecycle, timestamps/timezone, classification, retention, legal/privacy hold behavior, source/provenance, and audit correlation. Target attempts retain expected and observed effect separately. Correction appends evidence or compensation; audit/security/financial/inventory facts are never silently overwritten. Discovery records carry source, observed time, freshness, confidence, and reconciliation state.

## API, Event, Permission, and Integration Implications

- APIs expose preview before execute, exact target/policy/definition versions, idempotency, pagination, resource bounds, async operation identity, safe errors, uncertainty, cancellation limits, and evidence retrieval.
- Events are owner-defined past-tense facts only after consumers and versioning are known. Provider callbacks do not define canonical names.
- Permissions separate service-record work from Asset/Maintenance mutation, Platform device administration, secret use, remote execution, approval, evidence viewing, and break-glass review.
- External RMM/PSA/monitoring adapters use Developer Platform applications/webhooks, tenant installation scope, secret references, signed callbacks, replay protection, rate limits, compatibility evidence, disable behavior, and data exit.
- Bulk remote actions use target caps, cohorts, throttles, provider limits, partial-result semantics, and exportable reconciliation manifests.

No currently registered Service permission/event/OpenAPI contract exists. The existing first-slice endpoints for Platform devices, jobs, support approval, and webhooks are not a substitute for future owner contracts.

## Security, Privacy, and Operational Implications

Required threat modeling includes malicious/compromised technician, wrong-client selection, compromised agent/provider, script supply chain, session hijack, consent bypass, covert monitoring, credential/output exfiltration, lateral movement, replay, target drift, privilege revocation race, and immutable-provider-admin risk. Controls require least privilege, strong authentication, device/session risk, time-bound delegation, explicit resource scope, brokered secrets, signed definitions, allowlisted diagnostics, kill/revoke paths, protected evidence, and independent break-glass review.

Operational readiness requires deployable service/agent inventory, telemetry for queue/agent/provider/session state, alerts tied to runbooks, support ownership, vendor escalation, capacity/timeout limits, reconciliation jobs, backup/restore scope, compatibility and agent-update policy, incident exercises, mass-action kill exercise, credential rotation, and tenant-isolation verification. PDA-OPS-018 does not cover these unimplemented services.

## UX and Accessibility Implications

The primary workspace should organize work by consequence and responsibility rather than exposing a vendor module maze. Incident overview combines current impact, affected authoritative references, owner, SLA/escalation, communication, related problem/change/work order, freshness, and recovery evidence. Remote action is a separate high-risk flow with target review and persistent progress/evidence, never a casual inline button.

Accessibility review must cover keyboard target selection, large accessible tables, screen-reader progress announcements, non-color state, time extensions, destructive confirmation, consent dialogs, terminal/log alternatives, zoom/reflow, reduced motion, and error recovery. Vendor screenshots or documented feature presence are not WCAG evidence.

## AI and Automation Boundary

AI may summarize evidence, suggest classification/priority with rationale, correlate related incidents, propose diagnostic steps, draft communications, or recommend a reviewed automation. It cannot grant authority, reveal secrets, silently expand targets, invent consent, claim an uncertain action succeeded, close consequential records, or replace deterministic fallback. Evaluation requires cross-tenant leakage, prompt injection, dangerous-command suggestion, false correlation, hallucinated restoration, and AI-disabled essential-flow tests.

## Customer Pain Hypotheses

These are hypotheses for interviews/prototypes, not market facts:

- technicians lose time switching among ticket, asset, documentation, credential, monitoring, and remote tools;
- powerful remote controls make it hard to know exact scope, consent, and result before acting;
- SLA clocks and agreement coverage are difficult to explain when configuration and status defaults interact;
- client administrators need co-managed access without broad MSP or cross-client visibility;
- automation failures are hard to reconcile across offline devices and provider queues;
- documentation and credential stores become stale or overexposed during staff offboarding;
- customers want proof of what changed, by whom, under which approval, and whether recovery succeeded.

Validate through role-based interviews, task walkthroughs, incident retrospectives, lawful trials, and prototype testing before roadmap admission.

## Acceptance Evidence for Any Future Prototype

1. owner/ADR/capability registration and exact first-slice deferral/admission;
2. threat model, privacy/consent review, provider and deployment decision;
3. tenant/client/delegation/permission isolation tests;
4. signed automation provenance and malicious-script/parameter tests;
5. target-diff, cohort, cancellation, uncertain-effect, retry, and reconciliation tests;
6. secret broker/redaction and credential-rotation evidence;
7. agent offline/update/revoke/quarantine and provider outage tests;
8. accessible/responsive operator and end-user consent evidence;
9. runbooks, telemetry, tested alerts, escalation and mass-action kill exercise;
10. migration/import/export, disable/uninstall, retention/deletion, and data-exit tests.

## Research Disposition and Revalidation

CIR-BACK-021 can be marked Transferred because PDA-CIR-087 through PDA-CIR-089, CIR-LED-0011, RES-009, and SRC-041 through SRC-048 provide the required documented outputs and traceability. It is not independently reviewed or implementation-ready. Revalidate before Service/MSP/RMM roadmap admission, provider selection, any remote-action prototype, a cited product/edition change, or 2027-07-16, whichever occurs first.

## Related Meridian Authorities

PDA-FND-002, ADR-0002, ADR-0003, ADR-0014, ADR-0019, PDA-DOM-021, PDA-DOM-013, PDA-DOM-014, PDA-PLT-005, PDA-SEC-001, PDA-DEV-003, PDA-OPS-018, PDA-CIR-087, PDA-CIR-088, `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `registry/endpoint-permissions.json`, and `openapi/first-slice-v1.yaml`.
