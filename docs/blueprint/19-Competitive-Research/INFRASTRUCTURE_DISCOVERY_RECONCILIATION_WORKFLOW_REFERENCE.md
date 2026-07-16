---
document_id: PDA-CIR-094
title: Infrastructure Discovery and Reconciliation Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# Infrastructure Discovery and Reconciliation Workflow Reference

## Purpose

This document converts the evidence in PDA-CIR-093 into a provider-neutral workflow hypothesis. It is not an approved service, schema, event family, permission family, endpoint, agent protocol, or provider abstraction. Exact ownership must be resolved through capability registration and, where boundaries or execution architecture change, an ADR.

## Roles and Separations

| Role/concept | Responsibility | Must not imply |
|---|---|---|
| source connection owner | installs/disables an adapter and approves source scope | business-domain authority or unrestricted provider administration |
| collector/controller | reports observations or accepts provider actions | Meridian permission, tenant membership, Party, or authoritative asset truth |
| reconciliation reviewer | compares observation to intended/authoritative references | permission to mutate every affected owner |
| authoritative owner | decides whether its fact changes through its normal command | ownership of the external system or its credentials |
| remote-action approver | approves the exact operation, targets, risk, window, and evidence plan | execution authority outside the approved envelope |
| executor | dispatches a signed/versioned operation using a secret reference | approval, credential visibility, or proof of effect |
| verifier | evaluates returned and independently observed evidence | permission to rewrite audit history or hide uncertainty |

Authentication identity, Party, tenant/organization/location, domain role, entitlement, permission, and external provider role remain separate.

## Workflow A: Connect and Baseline a Source

1. **Declare purpose and owner.** Name the admitted capability, owning domain/platform area, source product/edition, tenant/site scope, data classes, lawful basis, retention, and exact decision the integration supports.
2. **Review risk.** Security, privacy, operations, domain owners, and ADR-0019 extension controls review credentials, egress, code/runtime, webhook, plugin, agent, support, backup, disable, and data-exit behavior.
3. **Create installation and secret references.** Store no credential material in the research record, adapter configuration payload, source object, logs, or job parameters. Bind secret use to tenant, provider, environment, operation class, and rotation policy.
4. **Test least privilege.** Prove read/write scopes separately. A provider read token cannot imply mutation authority; provider admin rights cannot imply Meridian permission.
5. **Capture source contract.** Record API/version, fields, pagination, limits, conditional writes, idempotency, webhooks, deletion/tombstone behavior, error envelope, clock/timezone, and documented upgrade policy.
6. **Run bounded baseline.** Use scope and item caps, checkpoints, rate limits, resumability, and cancellation. Every object receives source identity, observed time, ingestion time, raw-evidence hash/reference, and normalization version.
7. **Quarantine invalid or ambiguous records.** Do not auto-create authoritative records from weak matches. Unsafe content, unknown tenant, missing source ID, malformed address, ambiguous location, or excessive volume enters a protected review state.
8. **Reconcile counts and manifests.** Compare requested, read, normalized, rejected, unmatched, duplicated, and failed counts. Retain a manifest and request correlation.
9. **Verify disable and recovery.** Disable prevents new collection/actions but retains governed evidence. Prove secret revoke, webhook reject, job cancellation, backup/restore scope, and data export/deletion behavior.

## Workflow B: Observe, Match, and Reconcile

### Observation lifecycle

`received -> validated -> normalized -> unmatched|candidate-match|contradictory -> reviewed -> linked|rejected|expired|superseded`

The lifecycle describes a future concept only; exact state names require governed design.

1. A scheduled scan, webhook, operator refresh, or controller poll creates a source observation.
2. Boundary validation enforces source installation, tenant/site scope, signature/authentication, replay controls, schema/version, size, rate, and protected-data policy.
3. Normalization preserves original source identity and value while deriving comparable fields. It never rewrites the source evidence.
4. Matching proposes zero, one, or multiple candidate authoritative references using deterministic rules and confidence. Names, IP addresses, serial numbers, MAC addresses, hostnames, and location labels are signals, not universal identity.
5. A contradiction is classified by consequence: stale observation, planned drift, unauthorized change, authoritative-data defect, duplicate identity, source mapping defect, unreachable collector, or unknown.
6. Low-risk exact links may be suggested, but the owner or approved deterministic policy decides. High-risk, ambiguous, cross-tenant, ownership-changing, or destructive proposals always require explicit review.
7. Acceptance dispatches the owning domain's ordinary command with the actor, permission, entitlement, expected version, reason, evidence, and correlation. The reconciliation surface does not write another owner's tables.
8. Rejection retains the reason and prevents immediate repeated suggestion until a named revalidation trigger.
9. Freshness jobs expire observations and expose last-known state as stale rather than current.

## Workflow C: Consequential Remote Action

### Required preflight

- exact tenant, site, target identities, source mapping, and current freshness;
- named action definition/version and provider/API version;
- actor permission, entitlement, delegation, support approval, and separation-of-duties result;
- risk class, maintenance window, consent/presence rule, outage/customer impact, and target cap;
- input validation, secret reference, egress destination, timeout, retry/idempotency semantics, and provider limits;
- expected effect, verification method, rollback/compensation limit, evidence classification, and retention;
- previewed diff/cohort and an approval bound to the preview hash.

### Execution lifecycle

1. Create an immutable operation identity and one attempt identity per target.
2. Revalidate authority, target versions, freshness, maintenance window, secret state, kill switch, and provider health immediately before dispatch.
3. Dispatch idempotently where verified. If provider semantics are unknown, use a safe operation-specific deduplication/re-read strategy rather than blind retry.
4. Record transport result, provider acceptance, queue identity, target acknowledgement, and observed effect separately.
5. A timeout or lost callback becomes **uncertain**, not failed or succeeded. Poll/reconcile using provider correlation and independent observation where lawful.
6. Stop or quarantine remaining targets on blast-radius threshold, permission/secret revocation, target drift, anomalous output, provider degradation, or evidence loss.
7. Verify the expected effect and unintended consequences. For reboot, configuration, backup, or security-policy work, verification is specific to the action and never inferred from ticket closure.
8. On partial or harmful effect, invoke the approved compensation/rollback if possible and preserve both original and corrective evidence.
9. Close only after per-target outcomes reconcile. Unresolved uncertainty remains in an operational review queue with owner and deadline.

## Failure and Recovery Matrix

| Failure | Truthful state | Required recovery |
|---|---|---|
| credential expired/revoked | collection/action blocked; last observation stale | rotate/re-authorize through Platform Secrets; never fall back to embedded credential |
| rate limit/pagination interruption | partial manifest | resume from verified checkpoint; reconcile duplicates and gaps |
| webhook replay/out-of-order | quarantined or ordered by source evidence | validate signature/replay window/version; re-read current source where supported |
| source returns HTTP 200 with business error | rejected/failed according to product envelope | parse contract-specific status; no transport-success shortcut |
| target unreachable/offline | queued only if bounded policy permits, otherwise uncertain/blocked | respect expiry/lease; revalidate authority and version at reconnect |
| provider accepted but callback lost | uncertain | correlate/poll/observe; do not blind retry consequential work |
| observation conflicts with owner | contradiction open | owner review or approved deterministic policy; never last-writer-wins |
| duplicate candidate matches | ambiguous/quarantined | explicit merge/link/reject with audit; preserve both source identities |
| mass action crosses threshold | stopped/quarantined | kill remaining dispatch, investigate, reapprove a new preview |
| plugin/adapter version incompatible | disabled/degraded | restore supported version or migrate through tested compatibility plan |
| backup created but restore unproved | backup unverified | restore exercise in isolated environment and reconcile scope/hash |

## UX, Accessibility, and Operational Requirements

The reconciliation workspace must expose source, age/freshness, intended versus observed values, confidence, consequence, owner, candidate matches, and exact commands available. It must support keyboard operation, screen-reader table semantics, non-color state, reflow, large result sets, saved filters, accessible change diffs, time extensions, and clear recovery. Topology is an optional projection with an equivalent structured table; it cannot be the only way to understand or act.

Operations need source/adapter inventory, job and webhook telemetry, stale-source alerts, rate/volume budgets, runbooks, secret rotation, compatibility matrix, provider incident escalation, restore exercises, mass-action kill drills, tenant-isolation tests, and evidence-retention monitoring.

## AI and Automation Limits

AI may summarize contradictions, propose likely matches with evidence, draft change plans, or cluster repeated drift. It cannot grant permission, choose a tenant, reveal a secret, silently accept an authoritative change, expand a target cohort, invent current state, convert uncertainty to success, or execute consequential action without the approved deterministic command path. Essential collection, review, disable, recovery, and reconciliation remain usable with AI disabled.

## Acceptance Evidence Before Roadmap Admission

1. owner/capability/ADR decision and explicit first-slice treatment;
2. threat model, privacy classification, lawful collection/consent and data-exit review;
3. provider/version/edition API contract and least-privilege credential evidence;
4. tenant/site/source identity and cross-tenant negative tests;
5. baseline manifest, pagination, limits, replay, tombstone, stale and duplicate tests;
6. owner-command and optimistic-concurrency tests;
7. offline/unreachable, timeout, lost callback, retry/idempotency and uncertain-effect tests;
8. mass-action preview/cap/kill/partial-result/compensation exercises;
9. accessible responsive reconciliation and non-visual topology evidence;
10. disable, secret revoke, upgrade/migration, backup/restore, retention/deletion and data-exit tests.

## Sources and Revalidation

Evidence and limitations are recorded in PDA-CIR-093 and SRC-057 through SRC-061. Confidence is medium for the workflow synthesis and low for provider-specific implementation effectiveness. Revalidate at scope admission, provider evaluation, material API/edition change, or 2027-07-16.
