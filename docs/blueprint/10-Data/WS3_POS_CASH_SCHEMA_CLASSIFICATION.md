---
document_id: PDA-DAT-020
title: WS3 POS Cash Schema Classification
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0016, ADR-0017, ADR-0027]
review_evidence: []
---

# WS3 POS Cash Schema Classification

## Purpose and Authority

This record satisfies `WS3_POS_CASH_IMPLEMENTATION_PLAN.md` (PDA-RDM-012) §7's owner-persistence discipline and PR6's `privacy_and_classification` evidence obligation for every WS3 capability, mirroring PDA-DAT-019's WS2 pattern. It classifies the thirteen `pos_*` tables `@meridian/persistence-pos-postgres` owns (register/cash-movement from PR1, sale/receipt/price-override from PR2, return/refund from PR3, deposit/custody-transfer/source-shift from PR4), confirmed against `packages/persistence/pos-postgres/src/schema.ts` and its colocated `schema.test.ts`. It is a classification record, not an RLS, retention-automation, or production-deployment claim.

POS (Commerce) owns register, sale, receipt, return, refund, and deposit-preparation/confirmation facts. It never owns Inventory's stock ledger, Catalog's Product/Variant/Identifier facts, or Platform Numbering's sequence state — it consumes each through the published application ports and events the frozen control plan §6-§7 name (`SaleInventoryMovementPort`, `ReturnInventoryMovementPort`, `ReceiptNumberAllocatorPort`, `DepositReferenceAllocatorPort`, `PosCatalogPort`), never a cross-owner table or migration. Cash custody itself (the physical GYD float, safe, and bank-transfer facts) stays inside this ledger; Commerce-owned stored value, gift cards, and store credit are WS4 tables this record does not cover.

## Table Declarations

| Table | Owner and scope | Authority | Classification and retention | Offline/search/export | Audit and erasure effect |
|---|---|---|---|---|---|
| `pos_register_session` | POS; `(tenant_id, id)`, `organization_id`, `location_id`, `register_id` | Authoritative RegisterSession lifecycle (Open/Closing/Closed) | Confidential; retain with cash-variance and closer/approver evidence for the audit/reconciliation window | No offline write path (online-only on this branch, PENDING WS5); permissioned operational read/export | Open/close/cash-variance-approve require actor, correlation, and — for variance — a distinct approver from the closer; no silent state transition |
| `pos_cash_movement` | POS; `(tenant_id, id)`, tenant-preserving `session_id` | Authoritative append-only paid-in/paid-out/safe-drop fact | Confidential; append-only, retained with the owning session's window; a correction is a new opposing movement, never an edit | No offline write path; permissioned operational export | Direction, reason code, actor, and idempotency key are retained; refund-posted movements (PR3) carry the originating refund reference |
| `pos_command_receipt` | POS; `(tenant_id, id/operation/idempotency_key)` | Operational deduplication evidence shared by every PR1-PR4 command | Confidential; short bounded operational retention, finalized before pilot | Not searchable, offline, or ordinarily exportable | Stores a request-body hash and safe result only, never unrestricted request payload |
| `pos_sale` | POS; `(tenant_id, id)`, `register_id`/`session_id` | Authoritative Sale lifecycle (Draft/Open/Held/Completed) | Confidential; retain with completed totals, tenders, and price-override linkage for the audit window | No offline write path (online-only, PENDING WS5 for numbering); permissioned export | Completion is atomic with receipt numbering and the synchronous Inventory movement in one transaction; a `Pending` price override on any line blocks completion |
| `pos_sale_line` | POS; tenant-preserving `sale_id`, Product/Variant reference | Authoritative priced/taxed line, exact-decimal quantity | Confidential; follows Sale retention | No offline write path; permissioned export only through the Sale | Carries `engine.pricing`/`engine.tax` output (gross/discount/net/tax) as committed fact, never recomputed from stale client input |
| `pos_price_override` | POS; tenant-preserving `sale_id`/`line_id` | Authoritative Pending/Approved maker-checker override request | Confidential; retained with the Sale | No offline write path; permissioned export | Requester and approver identities are distinct actors (`approval_separation` denial otherwise); no approval before the Sale references the applied price |
| `pos_receipt` | POS; `(tenant_id, id)`, `register_id`, optional `return_id`/`original_receipt_id` | Authoritative numbered artifact (Sale/Return/Reissue kinds, `priceSuppressed` gift-receipt variant) | Confidential; retain with the owning Sale/Return for the audit and dispute window | No offline write path; permissioned read (`commerce.receipt.read`) and export | Numbering is monotonic and non-duplicate per register (Platform Numbering allocator); reissue creates a new numbered artifact rather than mutating the original; void/reissue never erase the original receipt row |
| `pos_return` | POS; `(tenant_id, id)`, `sale_id` | Authoritative Pending/Completed return workflow header | Confidential; retain with cumulative-returned-quantity and approval evidence | No offline capture path; permissioned export | Create/approve requires the creator and approver to differ (`approval_separation`); approval posts the compensating Inventory movement atomically with the completion |
| `pos_return_line` | POS; tenant-preserving `return_id`, `sale_line_id` | Authoritative returned-quantity fact used for the cumulative-return cap | Confidential; follows Return retention | No offline capture path; permissioned export only through the Return | Cumulative-returned-quantity is checked at create time across all of a sale line's prior returns, preventing an over-return |
| `pos_refund` | POS; `(tenant_id, id)`, `return_id` | Authoritative Requested/Posted cash-compensation workflow | Confidential; retain with the posted `pos_cash_movement` reference | No offline capture path; permissioned export | Amount derives solely from the referenced Return, never caller input; requester and approver must differ; approval posts a `Refund`-reason paid-out cash movement on the still-open register |
| `pos_deposit` | POS; `(tenant_id, id)`, `organization_id` | Authoritative Prepared/Reconciled deposit workflow | Confidential; retain with reserved-amount and confirming-actor evidence | No offline capture path; permissioned export | Preparation is effect-free (reserves against available safe custody only); preparer and confirmer must differ (`approval_separation`); cumulative reservation across concurrent deposits is capped at available safe custody |
| `pos_deposit_custody_transfer` | POS; `(tenant_id, id)`, `deposit_id` | Authoritative safe-to-bank custody-transfer fact | Confidential; append-only, retained with the owning deposit | No offline capture path; permissioned export | Exactly one transfer row posts per confirmed deposit, atomic with the `Reconciled` state transition; concurrent double-confirm posts exactly one |
| `pos_deposit_source_shift` | POS; `(tenant_id, deposit_id, session_id)`, no independent id | Authoritative join naming which RegisterSession safe-drops fund a deposit | Confidential; follows the owning deposit | No offline capture path; permissioned export only through the Deposit | Safe-drop provenance is explicit rather than inferred; an unknown source-shift reference is rejected before reservation |

## Money, Quantity, and Actor Discipline

Every authoritative money column is an integer minor-unit `bigint` (`*Minor`), never a binary float, matching `packages/engines/pricing` and `packages/engines/tax`'s exact-decimal output and CLAUDE.md §7. `pos_sale_line.quantity`/`pos_return_line.quantity` use `numeric(38, 6)`, never a float type. Every table above requires a not-null `tenant_id`; the maker/checker pairs (`cash-variance`, `price-override`, `return`, `refund`, `deposit`) additionally require the checker's actor identity to differ from the maker's, enforced before any irreversible effect, per the frozen control plan §6's common rule.

## Cross-Owner and Engine Boundary

No `pos_*` table stores Inventory stock-ledger rows, Catalog Product/Variant/Identifier rows, or Platform Numbering sequence state directly — those remain `inventory_*`, `catalog_*`, and `platform_numbering_*` owner tables, read or written only through the published application ports named above (`domains -> engines` and `domains -> domains` remain contract-only per §10.4 of the control plan). `packages/engines/pricing` and `packages/engines/tax` are stateless computation, not persistence, and own no table.

## Deferred and Out-of-Scope

Commerce-owned stored value, gift cards, and store credit (`commerce.stored-value*`, `commerce.gift-cards`, `commerce.store-credit`) are WS4 tables outside this record, per the control plan §5's "Deferred with existing authority" note. Offline capture, device leases, signed batch transport, and general sync reconciliation for any `pos_*` table remain WS5 scope; every "No offline ... path" row above records that boundary rather than a silent omission. Production RLS roles/policies, retention automation, legal-hold/deletion-journal integration, and multi-tenant capacity evidence remain the same open gates PDA-DAT-019 records for WS2 (RR-007/RR-009), not re-litigated here.

## Change Log

- 2026-07-18 — v0.1.0 initial WS3 PR6 classification record for the thirteen `pos_*` tables, confirmed against `schema.ts`/`schema.test.ts` on this branch.
