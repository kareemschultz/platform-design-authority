---
document_id: PDA-OPS-019
title: Import and Online Numbering Recovery Runbook
version: 0.4.0
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
- Do not repair malformed CSV by changing the declared newline convention, stripping formula/control prefixes into a second untracked file, or bypassing exact target headers. Correct the source, recompute SHA-256, and create a new governed import.
- The uploader and approver are separate facts. Opening-stock Adjustments and movements are attributed to the current approver who authorizes the commit; never rewrite them to the uploader for convenience.

## Signals and triggers

Investigate when a job remains `Approved` or `Committing`, the scanner returns `Unavailable`, a wave is `Failed`, reconciliation is `Mismatch`, an import's applied count differs from its durable row checkpoints, a correction report cannot be regenerated, allocation latency rises, an allocation response is uncertain, or a sequence becomes `Suspended`.

Prototype diagnostics are tenant-scoped counts and opaque IDs only:

- job reference/allocation/sequence-version snapshot, state/version/reconciliation state, total/valid/warning/rejected/applied/failed/skipped, last completed row;
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
3. Retry approval with the same import ID. Each row reuses `${importId}:row:${sourceKey}`; the import-owner per-row receipt returns the recorded opaque target ID before any owner command is considered, and the owner receipt remains a second deduplication boundary.
4. Verify import-row receipts, row target IDs, applied count, last-completed-row, wave completion, lifecycle events, Catalog receipts or Inventory create/approve receipts, and Audit evidence. A late checkpoint must not move a `Failed` or `Cancelled` job back to `Committing`.
5. If reconciliation differs, stop. Record opaque IDs and counts, preserve all facts, and escalate under PDA-OPS-012. Do not mark the job completed manually.

## Rejected owner command

1. Treat a job, active row, and wave recorded as `Failed` with the same safe failure code as terminal evidence of a deterministic owner-command rejection, not as an interrupted process.
2. Verify `platform.import.failed.v1` contains only the schema-governed import ID, target, safe failure code, last completed row, and version. Never copy exception text or row content into the event, Audit, logs, or tickets.
3. Replaying the same approval command must return the same terminal job without invoking the owner command again.
4. Correct the source through a new import and a new idempotency key. Do not change the failed row, reset the wave, or convert the failed job back to `Approved`/`Committing`.
5. Once reconciliation and retention conditions are satisfied, the governed staging purge may remove normalized rows/findings/waves while preserving the failed job, command receipt, event, and Audit evidence.

## Number allocation uncertainty

1. Retry the exact tenant, organization, sequence, and idempotency key. Do not mint a replacement key merely because the caller timed out.
2. If the fingerprint matches, the service returns the original allocation without advancing the sequence.
3. If the key is bound to another fingerprint, treat it as a caller conflict; do not override the receipt.
4. For an import reference, verify the import job's allocation ID and sequence-version snapshot match the immutable allocation and issued event. The fixed `platform.import-job` sequence is system-managed; do not create or change it through SQL.
5. If Numbering, import persistence, or either outbox append failed, the transaction must contain no import job, allocation, counter advance, validation event, or number-issued event. Verify the entire unit before retry.
6. If a sequence is Suspended, missing after a failed system-assurance attempt, or conflicts with the fixed system configuration, do not edit current/next/configuration values. Escalate to the future governed definition/change workflow.

## Cancel, reconcile, and accept

1. Use the tenant/organization-scoped list and status APIs; page findings with the opaque cursor rather than requesting or exporting unrestricted staging rows.
2. Cancel only a `ReadyForApproval` job at its current version. Cancellation is not a rollback and must not be used after owner effects begin.
3. On completion, verify the server-computed reconciliation state. `Reconciled` means every commit-eligible row is durably accounted for; `Mismatch` requires investigation and cannot be accepted.
4. Record acceptance only for a completed `Reconciled` job at its current version. Acceptance records who reviewed the result; it never rewrites Product, Inventory, Numbering, or event facts.
5. Cancel and accept reuse target approve authority and are audited. Staging purge requires the narrower target purge permission.

## Terminal staging purge

1. Verify the job is `Completed`, `Failed`, or `Cancelled`, its owner effects and command receipts reconcile, and at least 30 days have elapsed since the most recent terminal-state update.
2. Check the ADR-0014 deletion journal and legal-hold state. A hold blocks purge. A shorter approved privacy rule uses its governed deletion-journal path; it is not a reason to bypass this API.
3. Invoke the tenant-scoped import-owner purge API with current `catalog.import.purge` or `inventory.import.purge` authority; never issue ad hoc SQL deletes.
4. Verify normalized rows, findings, and wave staging are absent and `staging_purged_at` plus the allowlisted operator Audit record are present.
5. Verify the import job/count/reference/reconciliation evidence, import and per-row command receipts, Numbering allocation, Catalog or Inventory owner facts, immutable Inventory movements, and outbox/Audit evidence remain.
6. Stop and escalate if the job is non-terminal, inside the 30-day window, held, tenant identity is uncertain, or retained evidence no longer reconciles. Production scheduling, legal-hold/deletion-journal integration, and exercises remain separately gated.

## Recovery closure evidence

Close only when tenant scope is verified, no raw content was exposed, owner effects and receipts reconcile, import checkpoints agree, lifecycle events and Audit evidence exist, Numbering current/next values agree with allocations, the original idempotency key is replay-safe, and the incident/change record cites exact commands and result counts. Production alert thresholds, RTO/RPO, provider response, retention purge exercises, and offline Numbering recovery remain open gates.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-07-16 | Platform Design Authority | Added strict CSV remediation boundaries, per-row receipt recovery, import-reference/version verification, cancel/reconcile/accept operations, approver attribution, and audited purge after the 30-day window subject to ADR-0014 deletion-journal/legal-hold state. |
| 0.3.0 | 2026-07-16 | Platform Design Authority | Distinguished resumable process interruption from terminal owner-command rejection, added failed-event/replay handling, and allowed governed staging purge for reconciled failed jobs. |
| 0.2.0 | 2026-07-16 | Platform Design Authority | Added the terminal-only staging purge procedure and retained production scheduling/deletion-journal automation as open gates. |
| 0.1.0 | 2026-07-16 | Platform Design Authority | Added controlled-prototype import/scanner/wave and online Numbering uncertainty/recovery procedures without granting direct data-repair authority. |
