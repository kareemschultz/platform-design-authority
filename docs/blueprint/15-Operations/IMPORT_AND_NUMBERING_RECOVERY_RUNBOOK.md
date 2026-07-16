---
document_id: PDA-OPS-019
title: Import and Online Numbering Recovery Runbook
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0014, ADR-0016, ADR-0027]
---

# Import and Online Numbering Recovery Runbook

## Purpose and scope

Operate the WS2 controlled-prototype Product/opening-stock import and Strict Online Numbering paths. This runbook covers scanner outage, failed validation, interrupted commit waves, reconciliation, stalled jobs, and allocation uncertainty. It does not authorize direct edits to Catalog, Inventory, import, Numbering, Audit, or outbox facts and is not a production SLO or incident-response claim.

## Safety boundaries

- Derive tenant from the authenticated active context. Never accept a tenant copied from an upload, report, ticket, or operator query.
- Never paste raw CSV, normalized Product text, credentials, headers, cookies, tokens, unrestricted findings, or Party PII into logs, tickets, metrics, or Audit.
- Never repair an import by writing Catalog or Inventory tables. Resume the import so stable row keys replay owner application commands.
- Never edit/delete posted Inventory movements or issued Number allocations. Corrections use Inventory reversal/compensation and the governed Numbering gap/void policy when that policy is implemented.
- Do not bypass a scanner outage. `Unavailable` is a fail-closed dependency state.

## Signals and triggers

Investigate when a job remains `Approved` or `Committing`, the scanner returns `Unavailable`, a wave is `Failed`, an import's applied count differs from its durable row checkpoints, a correction report cannot be regenerated, allocation latency rises, an allocation response is uncertain, or a sequence becomes `Suspended`.

Prototype diagnostics are tenant-scoped counts and opaque IDs only:

- job state/version, total/valid/warning/rejected/applied/failed/skipped, last completed row;
- wave state/range/completed rows/last completed row/failure code;
- owner command receipt existence by the stable import-row key;
- import lifecycle outbox event existence;
- sequence state/current/next value and allocation existence by idempotency key.

## Scanner outage

1. Confirm the scanner seam reports `Unavailable`; do not retry as `Clean` or change the persisted result.
2. Stop new approvals if uploads cannot be scanned.
3. Restore or replace only through the governed provider/configuration process.
4. Retry the original create command with the same content hash and idempotency key.
5. Verify no job, row, event, or Audit record was created for the unavailable attempt.

## Interrupted import wave

1. Read the tenant-scoped job and wave checkpoint. Do not infer completion from Catalog or Inventory counts alone.
2. Confirm the approver differs from the uploader and still has current permission and entitlement.
3. Retry approval with the same import ID. Each row reuses `${importId}:row:${sourceKey}`; already-applied owner commands replay their original result.
4. Verify row target IDs, applied count, last-completed-row, wave completion, lifecycle events, Catalog receipts or Inventory create/approve receipts, and Audit evidence.
5. If reconciliation differs, stop. Record opaque IDs and counts, preserve all facts, and escalate under PDA-OPS-012. Do not mark the job completed manually.

## Number allocation uncertainty

1. Retry the exact tenant, organization, sequence, and idempotency key. Do not mint a replacement key merely because the caller timed out.
2. If the fingerprint matches, the service returns the original allocation without advancing the sequence.
3. If the key is bound to another fingerprint, treat it as a caller conflict; do not override the receipt.
4. If outbox append failed, the transaction must contain neither the allocation nor counter advance. Verify both before retry.
5. If a sequence is Suspended or missing, do not edit current/next values. Escalate to the future governed definition/change workflow.

## Terminal staging purge

1. Verify the job is `Completed` or `Cancelled`, its owner effects and command receipts reconcile, and the applicable ADR-0014 retention period has expired.
2. Invoke the tenant-scoped import-owner purge command; never issue ad hoc SQL deletes.
3. Verify normalized rows, findings, and wave staging are absent and `staging_purged_at` is present.
4. Verify the import job/count evidence, import command receipts, Catalog or Inventory owner facts, immutable Inventory movements, and outbox/Audit evidence remain.
5. Stop and escalate if the job is non-terminal, tenant identity is uncertain, or retained evidence no longer reconciles. Production scheduling and deletion-journal automation remain separately gated.

## Recovery closure evidence

Close only when tenant scope is verified, no raw content was exposed, owner effects and receipts reconcile, import checkpoints agree, lifecycle events and Audit evidence exist, Numbering current/next values agree with allocations, the original idempotency key is replay-safe, and the incident/change record cites exact commands and result counts. Production alert thresholds, RTO/RPO, provider response, retention purge exercises, and offline Numbering recovery remain open gates.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-07-16 | Platform Design Authority | Added the terminal-only staging purge procedure and retained production scheduling/deletion-journal automation as open gates. |
| 0.1.0 | 2026-07-16 | Platform Design Authority | Added controlled-prototype import/scanner/wave and online Numbering uncertainty/recovery procedures without granting direct data-repair authority. |
