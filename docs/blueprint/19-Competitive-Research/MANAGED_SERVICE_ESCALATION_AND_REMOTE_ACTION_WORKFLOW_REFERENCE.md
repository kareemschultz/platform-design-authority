---
document_id: PDA-CIR-088
title: Managed-Service Escalation and Remote-Action Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# Managed-Service Escalation and Remote-Action Workflow Reference

## Purpose and Scope

Translate CIR-BACK-021 evidence into a safe future workflow hypothesis. This is research input for Service, Assets/Maintenance, Platform, Developer Platform, Security, Privacy, Operations, UX, Accessibility, and AI review. It is not an executable runbook or implementation contract.

## Actors and Separate Authorities

| Actor | May own or decide | Must not inherit automatically |
|---|---|---|
| requester/end user | report symptom, supply context, approve or refuse presence-sensitive access where policy permits | tenant administration, diagnostic truth, change approval |
| service agent | triage, communicate, link evidence, run authorized read-only diagnostics | asset mutation, credential export, unrestricted remote control |
| problem owner | investigate recurrence/root-cause hypotheses and known workarounds | change deployment or closure of another domain's fact |
| change approver | decide a bounded change from risk, scope, test, rollback, and evidence | authority to author or execute every automation |
| remote operator | execute an approved action against named targets within a time window | client-wide, tenant-wide, secret-wide, or administrator authority |
| managed-service/customer administrator | grant delegated scope and policy within their authority | Platform support access or cross-tenant visibility |
| Security/Privacy | classify threats, emergency/break-glass, consent/notice, recording, credential and evidence policy | business-domain ownership |
| automation/AI | propose or execute only a registered ordinary application command | prompt-derived authority, silent target expansion, or uncontrolled shell access |

## Consequential Workflow

1. **Intake and correlation.** Preserve channel/source, reporter, tenant, affected service/asset reference, observed time, symptom, evidence classification, and correlation key. Dedupe without destroying individual reports.
2. **Authority and context check.** Revalidate tenant, partner delegation, role, resource scope, active context, entitlement, approval policy, device ownership, and support-access conditions. Failure produces a safe denial and audit record, not a workaround.
3. **Impact and urgency.** Record affected users/locations/services, safety/security/privacy impact, business consequence, current workaround, and confidence. Priority is explainable and override is audited.
4. **Triage.** Separate observation from inference. Read-only diagnostics declare freshness, source, expected range, timeout, and data classification. Unknown or stale device state remains unknown.
5. **Incident decision.** Create or link an incident when restoration coordination is needed. Monitoring signal, requester ticket, incident, problem, change, work order, and security case retain separate identities.
6. **Escalation.** Escalate on deterministic policy: impact, elapsed SLA clock, missing owner acknowledgement, security/privacy signal, repeated failure, uncertain remote state, or dependency/provider threshold. Preserve trigger and policy version.
7. **Problem/change decision.** Repeated or material incidents may link to a problem. A consequential repair becomes a change or Maintenance work order with affected targets, risk, plan, preconditions, test, rollback/compensation, window, owner, approval, and expiry.
8. **Remote-action preflight.** Resolve exact targets at execution time; show additions/removals since approval; verify agent/device state, user-presence rule, consent/notice requirement, credential broker, command definition/hash, parameter redaction, cohort, concurrency, timeout, and stop condition.
9. **Preview and approval.** Present human-readable effect, target count, excluded targets, destructive/security classification, required restart/downtime, rollback limits, evidence captured, and residual uncertainty. Approval binds this version and scope only.
10. **Execute.** Create one durable operation plus per-target attempts. Use bounded retries, idempotency where meaningful, lease/lock where concurrency is unsafe, kill switch, and cancellation semantics. Never treat dispatch as success.
11. **Verify and reconcile.** Compare expected and observed outcome per target; reconcile late/offline results; classify succeeded, failed-safe, failed-uncertain, cancelled, skipped, expired, or manual-review-required. A command with uncertain effect is not blindly retried.
12. **Restore and close.** Confirm service restoration separately from root-cause or permanent-fix completion. Notify affected audiences, retain redacted evidence, create follow-up problem/change/risk items, and record closure authority and residual risk.

## Escalation State Model

`reported → triaged → acknowledged → investigating → containment-active → restoration-pending → restored → closure-review → closed`

Side states are `awaiting-requester`, `awaiting-provider`, `awaiting-change-approval`, `security-hold`, `privacy-hold`, `failed-uncertain`, and `cancelled`. Waiting states carry an owner, reason, clock behavior, next action, and deadline. Restored does not mean root cause eliminated; closed does not mutate linked Asset, Maintenance, Finance, Security, or Audit facts.

## Remote-Action Threat Boundary

| Threat/failure | Required control | Evidence retained |
|---|---|---|
| wrong tenant/client/site/device | tenant and delegation join at query and command boundaries; exact target snapshot plus execution-time diff | authority decision, target IDs, excluded IDs, policy/version |
| stale inventory or offline agent | freshness watermark, last-seen, source, agent capability, preflight; expired action rather than indefinite queue | discovery snapshot, preflight result, expiry, late result |
| overbroad script or parameter | signed/versioned definition, immutable hash, schema validation, classified parameters, staged cohort, target cap | definition/hash, author/reviewer, parameter redactions, cohort |
| privilege or credential misuse | distinct diagnose/interact/automate/credential permissions; short-lived secret broker; no plaintext return | permission decision, secret-reference use, target, purpose, duration |
| missing or invalid consent | tenant/jurisdiction/device-owner policy, visible notice, presence check, recorded decision, emergency path | consent/notice policy and result; break-glass approval and review |
| hidden destructive outcome | risk classification, explicit preview, maker-checker, maintenance window, rollback/compensation plan | approval binding, plan, test, rollback result |
| retry after uncertain effect | stable operation/attempt identity, effect query, reconciliation before retry, idempotency token where supported | uncertainty state, reconciliation probes, disposition |
| compromised operator/session | strong authentication, short session, device trust where approved, IP/risk controls, kill switch, concurrent-session visibility | session/risk signals, session termination, protective action |
| sensitive output leakage | allowlisted diagnostics, output classification/redaction, size/time limits, protected evidence store | output hash, classification, redaction rule, access log |
| automation supply-chain compromise | provenance, review, malware/static checks, dependency lock, revocation, emergency disable | source, signature/hash, scan/review, revocation reason |

## UX, Accessibility, and Device Requirements

- The operator always sees tenant/client, site, target count, command risk, authority, user-presence/consent status, freshness, and connection state before action.
- Bulk target selection uses preview, filters, exclusions, staged cohorts, accessible tables, downloadable redacted evidence, and confirmation that names the consequence—not a generic modal.
- Keyboard and screen-reader users receive the same target diff, progress, warnings, failure/uncertainty, stop control, and evidence links. Status is never color-only.
- Progress distinguishes queued, dispatched, running, acknowledged, observed effect, and reconciled completion. A spinner is not evidence.
- Mobile may approve or observe only when the workflow can preserve full context and secure authentication; narrow screens must not hide target scope or destructive warnings.
- Offline operator execution is prohibited for remote administrative actions. A disconnected UI may retain read-only incident notes according to classification, but cannot manufacture current target or authority state.

## Contract, Event, and Permission Implications

If roadmap admission occurs, the owning specifications must define application commands for incident/problem/change transitions, delegated support access, diagnostic requests, remote-action preview/approval/execution/cancellation, per-target reconciliation, and evidence retrieval. Public/adaptor operations must be registered in OpenAPI and the endpoint-permission manifest.

Canonical events would be required only after owner review for material state changes and integration consumers; this research deliberately does not name them. External monitoring and RMM callbacks enter through Developer Platform webhooks, are signed, replay protected, tenant resolved, idempotent, and converted to owner commands. Provider event names never become canonical Meridian events.

Permission design must separate read, triage, assign, approve, execute, cancel, use-secret, view-output, replay/reconcile, policy-administer, and break-glass authority by owning resource. `platform.support-access.approve` is an existing first-slice approval permission; it does not authorize future Service or remote actions by itself.

## Failure, Recovery, and Testing

Tests must cover tenant/client isolation, expired delegation, target drift, offline/late devices, duplicate callback, repeated dispatch, uncertain effect, partial cohort failure, cancellation race, lease expiry, credential refusal, consent denial, secret/output redaction, approval version drift, permission revocation mid-run, operator session loss, provider outage, webhook replay, audit completeness, accessible progress, responsive target review, and recovery after worker/database restart.

Capacity evidence must use target/cohort counts, output volume, queue age, provider limits, and reconciliation time. Security testing must include cross-tenant selection, script substitution, parameter injection, output exfiltration, session hijack, privilege escalation, and compromised agent/provider scenarios. No pilot claim is allowed without a real provider/test agent, runbook, alerts, rollback/kill exercise, and dated results.

## Sources and Traceability

Product evidence is registered by SRC-041 through SRC-048 and cited in PDA-CIR-087. Governing Meridian references are ADR-0002, ADR-0003, ADR-0014, ADR-0019, PDA-DOM-021, PDA-DOM-013, PDA-DOM-014, PDA-PLT-005, PDA-SEC-001, PDA-DEV-003, PDA-OPS-019, `registry/capabilities.json`, `registry/permissions.json`, `registry/events.json`, `registry/endpoint-permissions.json`, and `openapi/first-slice-v1.yaml`.
