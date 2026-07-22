---
document_id: PDA-RDM-012
title: "WS3 Implementation Plan: POS Cash Workflow"
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0002, ADR-0003, ADR-0013, ADR-0014, ADR-0016, ADR-0017, ADR-0020, ADR-0026, ADR-0027]
---

# WS3 Implementation Plan: POS Cash Workflow

## 1. Purpose, Authority, and Lifecycle

This document expands `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) section "WS3 — POS Cash Workflow (P3)" and `TECHNICAL_PROTOTYPE_PLAN.md` (PDA-RDM-004) §Prototype 3 into the implementation-control plan for Technical Prototype 3. It follows the structure and rigor of `WS2_CATALOG_AND_INVENTORY_IMPLEMENTATION_PLAN.md` (PDA-RDM-009) without restating WS2's content. It defines the exact capability depth, owners, package boundaries, FROZEN identifier tables, maker/checker state machines, lane commands, and evidence matrix used to implement WS3 as a **controlled prototype**, per FDR-012.

This is a **Draft plan for a controlled prototype**. It does not ratify a Draft or Proposed source, authorize a pilot or production deployment, establish a contractual service level, or claim WS3 is complete. If this plan conflicts with the Constitution, a ratified or accepted ADR, or a higher-authority approved specification, the higher-authority source wins and work stops for disposition. Section 10 records every conflict this plan found between lower-authority sources instead of silently resolving them.

### 1.1 Entry gate and controlled-prototype authorization

WS3's ordinary entry gate (`FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS3 **Entry**) requires: WS2 controlled-prototype closeout recorded through issue #90; PDA-REV-019 recording the issue #83 disclosure/redaction review subject to exact-head independent concurrence and merge; issue #94 establishing restricted raw-evidence handling; and issue #82 recording at least 8 structured interviews and 3 direct workflow observations across at least 3 businesses as retained real-world evidence. **Issues #94 and #82 remain open.** No agent-generated, simulated, inferred, or waived substitute satisfies #82.

**FDR-012** (Founder Decision Register, decided 2026-07-18; evidence: [founder approval comment on PR #101](https://github.com/kareemschultz/platform-design-authority/pull/101#issuecomment-5010116100), merged as `c84b1b2e2610589569a6b2d44729208b1f83470f`; sequencing context on [issue #13](https://github.com/kareemschultz/platform-design-authority/issues/13)) grants a **bounded controlled-prototype implementation exception**: WS3 implementation may proceed on the isolated branch `claude/ws3-integration` ahead of the #94/#82 gates. FDR-012 does not change the #94/#82 entry, retention, or merge conditions — it bounds only where implementation work may occur before those gates close.

### 1.2 Deviation record

This run departs from WS2's per-PR review cadence by explicit, recorded Founder direction (FDR-012):

- **Single integration branch.** All WS3 stages (PR0-PR6) land on `claude/ws3-integration`, not individually reviewed and merged branches.
- **Consolidated end-of-run review** replaces per-PR independent review. No stage in this plan claims exact-head independent concurrence; that concurrence is deferred to the single consolidated review the orchestrator records at run end.
- **No merge to `main`.** This plan, and every stage built against it, remains unmerged until #94 and #82 close and the consolidated review concurs. No stage document, evidence file, or commit on this branch may claim WS3 completion, program-status progress, or CI-green status (branch pushes run no CI by design).
- **Journal discipline.** Only the orchestrator records `AUTHORIZED`/`RUN COMPLETE`/`BUILD FINISHED` lines in the program journal; implementation stages never write there.

### 1.3 Governing sources

| Concern | Governing source |
|---|---|
| Authority and lifecycle | CLAUDE.md §1-§2; `docs/blueprint/00-Foundation/CONSTITUTION.md` |
| First-slice scope and depth | PDA-RDM-003 (`FIRST_SLICE_MANIFEST.md`), PDA-RDM-004, PDA-RDM-007, `registry/first-slice.json`, `registry/capability-metadata.json` |
| Commerce/POS ownership and events | `docs/blueprint/04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`; `registry/capabilities.json`; `registry/events.json` |
| Cash custody boundary | `docs/blueprint/13-Commercial/CASH_COLLECTION_AND_DISBURSEMENT_BOUNDARIES.md` |
| Finance handoff | `docs/blueprint/04-Business-Domains/FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md` (PDA-DOM-026); `schemas/finance/finance-handoff-v1.schema.json` |
| Guyana prototype tax | `docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_PROTOTYPE_TAX_PACK.md` (PDA-IND-090) |
| Modular boundaries | ADR-0002, ADR-0003, PDA-ENGR-012, `registry/architecture-rules.json` |
| Runtime and persistence | ADR-0020, ADR-0027 |
| Events, transactions, namespaces | ADR-0016, ADR-0017 |
| Commerce/Stored Value ownership boundary | ADR-0013 (informs the WS3/WS4 seam; stored value itself is WS4, not WS3) |
| Privacy and classification | ADR-0014 |
| Permissions and endpoints | `registry/permissions.json`, `registry/endpoint-permissions.json`, `docs/blueprint/01-Platform/FIRST_SLICE_PERMISSION_CATALOG.md`, `docs/blueprint/02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md` |
| Evidence | `registry/first-slice-tests.json`, PDA-RDM-006 |
| Founder scope authority | FDR-012 (this run); FDR-004 (first-slice scope, unaffected) |
| Stage specifications | the orchestrator's external stage-specification packet (`pr0-control-plan` through `pr6-closeout`), outside this repository, authoritative for per-PR scope once this plan exists per those stages' own "Read first" instruction |

## 2. Scope: PR1-PR6

WS3 scope is fixed by the stage specification packet, not invented here. This section records only the capability-to-stage assignment the FROZEN tables in section 4 depend on; the stage files remain authoritative for implementation detail, test obligations, and out-of-scope boundaries.

| Stage | Goal | Primary permissions/events implemented |
|---|---|---|
| **PR0** (this plan) | Governance, contracts, event schemas, package skeletons. No behavior. | none (contract-only) |
| **PR1** | RegisterSession: open, cash movement (paid-in/paid-out/safe-drop), close, cash-variance maker/checker | `register.open`, `register.close`, `cash-movement.create`, `cash-variance.approve`; `register.opened.v1`, `register.closed.v1`, `cash-movement.posted.v1` |
| **PR2** | Cash sale: pricing, tax, numbered receipt, synchronous Inventory stock movement, hold/resume, price-override maker/checker | `sale.create`, `sale.complete`, `sale.hold`, `price-override.request`, `price-override.approve`, `receipt.read`; `sale.completed.v1`, `sale.held.v1`, `receipt.issued.v1` |
| **PR3** | Returns, refunds, voids, receipt reissue, exchanges, gift receipts | `return.create`, `return.approve`, `refund.create`, `refund.approve`, `receipt.void`, `receipt.reissue`; `return.completed.v1`, `refund.requested.v1`, `exchange.completed.v1` |
| **PR4** | Bank deposits (two-phase maker/checker), accountant handoff export | `deposit.create`, `deposit.confirm`, `platform.export.create`, `platform.export.read`; `deposit.prepared.v1`, `deposit.reconciled.v1` |
| **PR5** | Web POS experience over PR1-PR4 | none new (UI over existing contracts) |
| **PR6** | Evidence checker, scenario demonstrations, closeout (status `implemented-pending-gates-and-review`) | none new (verification only) |

## 3. FROZEN TABLE (a) — Permissions

Every `commerce.*` POS-scope permission and every `platform.*`/`engine.*` identifier WS3's contracts touch, regardless of namespace. Verified against `registry/permissions.json` on this branch (2026-07-18); **no addition is permitted** — a later stage needing an identifier not listed here HALTS and records the gap.

| Permission | Owning stage | Notes |
|---|---|---|
| `commerce.register.open` | PR1 | Opens a RegisterSession with a counted float |
| `commerce.register.close` | PR1 | Closes with a counted drawer; zero-variance closes complete immediately, non-zero routes to `cash-variance.approve` |
| `commerce.cash-movement.create` | PR1 | Paid-in, paid-out, and safe-drop (reason-coded) share this one permission per the PR1 stage file |
| `commerce.cash-variance.approve` | PR1 | Checker for a non-zero-variance close; maker (closer) cannot self-approve |
| `commerce.sale.create` | PR2 | Opens a Sale (Draft/Open) on an open register |
| `commerce.sale.complete` | PR2 | Completes a sale: tender, receipt number, synchronous Inventory movement, atomic with `commerce.sale.completed.v1` |
| `commerce.sale.hold` | PR2 | Parks an Open sale to Held; resume is not a distinct permission (§6.2) |
| `commerce.price-override.request` | PR2 | Maker: requests a line price override on an uncompleted sale |
| `commerce.price-override.approve` | PR2 | Checker: applies the requested price; requester cannot self-approve |
| `commerce.receipt.read` | PR2 | Read a receipt by ID (sale, return, or reissue kind) |
| `commerce.receipt.reissue` | PR3 | Reprints an existing receipt as a new numbered REISSUE artifact; own authority, not a maker/checker pair |
| `commerce.receipt.void` | PR3 | Same-day/open-session administrative reversal of a sale; own authority, not a maker/checker pair |
| `commerce.return.create` | PR3 | Maker: creates a Pending return referencing an original sale and bounded lines |
| `commerce.return.approve` | PR3 | Checker: posts the compensating Inventory movement and completes the return; creator cannot self-approve |
| `commerce.refund.create` | PR3 | Maker: requests a cash refund referencing an approved return |
| `commerce.refund.approve` | PR3 | Checker: posts the cash-movement (paid-out, reason `Refund`) on the open register; requester cannot self-approve |
| `commerce.deposit.create` | PR4 | Maker: prepares a deposit and reserves the amount against available safe custody (no custody transfer yet) |
| `commerce.deposit.confirm` | PR4 | Checker: posts the safe-to-bank custody transfer; preparer cannot self-confirm |
| `platform.export.create` | PR4 | Creates the bounded accountant-handoff export job (already wired to `POST /v1/exports/accountant-handoff`) |
| `platform.export.read` | PR4 | Reads a generated export artifact by ID (already wired to `GET /v1/exports/{exportId}`) |

Twenty permissions total. `commerce.stored-value.*` (8 permissions) is registered but is WS4 scope (`FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS4) and is out of this table by design, not omission.

## 4. FROZEN TABLE (b) — Events

Every registered `commerce.*` POS-scope event, verified directly against `registry/events.json` rather than the stage packet's illustrative list (which the packet itself said not to trust). The registry additionally holds `commerce.exchange.completed.v1` and `commerce.refund.requested.v1`, neither of which appeared in the packet's illustrative set; both are included below with their owning stage.

| Event | Owning stage | Producer | Schema (this PR0) |
|---|---|---|---|
| `commerce.register.opened.v1` | PR1 | `register.open` command | `schemas/events/commerce.register.opened.v1.schema.json` (new) |
| `commerce.register.closed.v1` | PR1 | `register.close` command (zero variance) or `cash-variance.approve` (non-zero variance) | `schemas/events/commerce.register.closed.v1.schema.json` (new) |
| `commerce.cash-movement.posted.v1` | PR1 | `cash-movement.create` command (paid-in/paid-out/safe-drop); also emitted by PR3's `refund.approve` posting a paid-out cash movement | `schemas/events/commerce.cash-movement.posted.v1.schema.json` (new) |
| `commerce.sale.completed.v1` | PR2 | `sale.complete` command | already registered: `schemas/events/commerce.sale.completed.v1.schema.json` |
| `commerce.sale.held.v1` | PR2 | `sale.hold` command | `schemas/events/commerce.sale.held.v1.schema.json` (new) |
| `commerce.receipt.issued.v1` | PR2 (sale receipts); PR3 (return and reissue receipts, and the gift-receipt `priceSuppressed` variant) | `sale.complete`, `return.approve`, `receipt.reissue` commands | `schemas/events/commerce.receipt.issued.v1.schema.json` (new) |
| `commerce.return.completed.v1` | PR3 | `return.approve` command | `schemas/events/commerce.return.completed.v1.schema.json` (new) |
| `commerce.refund.requested.v1` | PR3 | `refund.create` command (matches the registered "requested" fact; the approved/posted fact rides on `commerce.cash-movement.posted.v1` — see §6) | `schemas/events/commerce.refund.requested.v1.schema.json` (new) |
| `commerce.exchange.completed.v1` | PR3 | The composed return+new-sale exchange flow, once both the compensating return and replacement sale commit (§6.5) | `schemas/events/commerce.exchange.completed.v1.schema.json` (new) |
| `commerce.deposit.prepared.v1` | PR4 | `deposit.create` command | `schemas/events/commerce.deposit.prepared.v1.schema.json` (new) |
| `commerce.deposit.reconciled.v1` | PR4 | `deposit.confirm` command | `schemas/events/commerce.deposit.reconciled.v1.schema.json` (new) |

Eleven events total. `commerce.stored-value-*` (7 events) is WS4 scope and excluded by design. `platform.export.*` has no registered event; the export artifact and its manifest/hash are the durable record (§7).

All ten new schemas validate against `schemas/events/event-envelope-v1.schema.json` and use integer minor-unit money fields (`*Minor`), matching the existing `commerce.sale.completed.v1.schema.json` convention — never binary floating point (CLAUDE.md §7).

## 5. FROZEN TABLE (c) — Capabilities

Every WS3-family capability from `registry/capabilities.json` / `registry/first-slice.json`, its registered depth, owning stage, and required test dimensions (all 13 `registry/first-slice-tests.json` dimensions apply at `full`/`prototype` depth — there is no dimension waiver by dominance; PR files name only their *dominant* three).

| Capability | Depth | Owning stage(s) | Realization |
|---|---:|---|---|
| `commerce.pos` | full | PR1-PR5 (umbrella) | The composed register/sale/receipt/return/deposit surface; no single stage owns it alone |
| `commerce.register-management` | full | PR1 | RegisterSession open/close |
| `commerce.shift-management` | full | PR1 | **No dedicated permission or event is registered for "shift."** `registry/capability-metadata.json` declares `commerce.shift-management` depends on `commerce.register-management`. WS3 realizes shift-management AS the RegisterSession lifecycle (open → movements → close) PR1 implements; no additional identifier is invented. |
| `commerce.cash-management` | full | PR1 (movements/variance); PR4 (deposits) | Cash movements, safe drops, and variance in PR1; deposits in PR4. See §10.2 for the `commerce.deposits` capability-ID gap this resolves. |
| `commerce.order-management` | prototype | PR2 | `FIRST_SLICE_MANIFEST.md` Commerce bullet "Sales and order completion" maps this directly onto `commerce.sale.create`/`commerce.sale.complete`; no dedicated permission is invented. |
| `commerce.returns` | full | PR3 | `return.create`/`return.approve` |
| `commerce.exchanges` | prototype | PR3 | No dedicated permission is registered. `registry/capability-metadata.json` declares `commerce.exchanges` depends on `commerce.returns`. Per the PR3 stage file, an exchange is realized as a return (`return.create`/`return.approve`) composed with a new sale (`sale.create`/`sale.complete`) inside one register session; `commerce.exchange.completed.v1` is the registered correlating fact emitted once both legs commit (§6.5). |
| `commerce.refunds` | full | PR3 | `refund.create`/`refund.approve` |
| `commerce.receipts` | full | PR2 (issue), PR3 (void/reissue) | `receipt.read`/`receipt.reissue`/`receipt.void` |
| `commerce.gift-receipts` | prototype | PR3 | No dedicated permission is registered. Realized as a `priceSuppressed: true` variant of `commerce.receipt.issued.v1` produced through the existing sale/return receipt path, per the PR3 stage file's "price-suppressed receipt variant" framing; no new identifier is invented. |
| `commerce.mobile-pos` | prototype | PR5 | `FIRST_SLICE_MANIFEST.md` Commerce bullet "Mobile or tablet POS layout seam" — realized as PR5's responsive/touch-target layout of the *same* web POS, not a native app (native/offline is WS5 territory). No dedicated permission or package is invented. |
| `commerce.offline-sales` | full | PR2/PR5 (online path only); **PENDING WS5** | Mirrors WS2's `inventory.offline-movements` boundary exactly: WS3 proves the online sale/receipt-numbering command path only. Device enrollment, lease issuance, signed batch transport, and general offline reconciliation are WS5 ownership (`FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS5). PR6's closeout records this as an explicit partial-satisfaction boundary, not a completed capability. |

**Deferred with existing authority (not WS3):** `commerce.stored-value`, `commerce.stored-value-ledger`, `commerce.store-credit`, `commerce.gift-cards` (all full depth) are assigned to WS4 by `FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS4, whose **Entry** condition is "WS3 done." `commerce.storefront`, `commerce.recurring-agreements`, `commerce.memberships`, `commerce.self-checkout`, `commerce.customer-account-sales` carry explicit `registry/first-slice.json` deferral rows and are out of first-slice scope entirely, not merely out of WS3. `commerce.quotes`, `commerce.sales-orders`, `commerce.omnichannel-orders`, `commerce.channel-management`, `commerce.storefront-connectors`, `commerce.assisted-selling`, `commerce.checkout`, `commerce.layaway`, `commerce.ecommerce` are not `first_slice` at all in `registry/first-slice.json` and require no disposition.

### 5.1 Supporting engine/platform work

The following non-`commerce.*` first-slice capabilities are WS3-adjacent — a WS3 package depends on or produces against them — but do not become hidden WS3 business-capability rows, mirroring `WS2_CATALOG_AND_INVENTORY_IMPLEMENTATION_PLAN.md` §3.1's treatment of `platform.numbering`/`platform.events`: building or consuming a package is not the same as owning that capability's first-slice evidence.

| Capability | Depth | WS3 relationship |
|---|---:|---|
| `engine.pricing` | full | PR0 creates `packages/engines/pricing`; PR2 implements prototype-fidelity line pricing (§10.1 records the fidelity gap against the registered full depth). Evidence for this capability's full-depth completion is NOT claimed by WS3. |
| `engine.tax` | prototype | PR0 creates `packages/engines/tax`; PR2 implements the exclusive/inclusive formulas from PDA-IND-090 as prototype, non-statutory behavior, matching the registered depth exactly. |
| `engine.documents` | full | `commerce.receipts`' capability-metadata dependency. **No `packages/engines/documents` package exists in WS3's package list** — receipt rendering is implemented directly inside `packages/domains/pos` (receipt number, lines, tax breakdown, tender/change per PR2's stage file), not through a separate Documents engine. `engine.documents` full-depth evidence is NOT produced by WS3; it remains an explicit gap, not a silent one. |
| `platform.numbering` | full | Consumed from WS2 PR5 (`packages/platform/numbering`) for the online receipt-numbering path (PR2). WS3 does not re-own or re-implement Numbering; the offline-safe allocation path remains explicitly PENDING WS5 per PR2's stage file. |
| `payment.refunds` | prototype | `commerce.refunds`' capability-metadata dependency. WS3 PR3 implements **cash refunds only** (a cash-movement posted on the open register); no `payment.*` provider rail is invoked. Electronic-tender refund orchestration through a payment provider is WS6 (Provider Adapter) scope, per `FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS6. `payment.refunds` prototype-depth evidence involving an actual provider rail is NOT produced by WS3. |

## 6. FROZEN TABLE (d) — Maker/Checker State Machines

For every create/approve pair the stage packet names (cash-variance, price-override, return, refund, deposit-confirm): the exact state a request creates, the irreversible-effect boundary, the approve/deny transition and its emitted event, and the self-approval rejection rule. **No irreversible cash, inventory, or outbox business effect occurs before approval.** A cosmetic approval recorded after an already-applied effect is a conformance failure per the stage packet, not an implementation choice.

Common rule across all five pairs: the actor who performed the maker action (request/create/prepare) MUST differ from the actor who performs the checker action (approve/confirm), enforced by active-context actor comparison before any effect is applied. A self-approval attempt is denied with a stable, non-disclosing error, produces no state transition, no business event, and no audit success record — only an audit denial record.

### 6.1 Cash variance (`commerce.cash-variance.approve`)

| State | Trigger | Effect | Event |
|---|---|---|---|
| (implicit) `Closing` (pending variance) | `register.close` computes a non-zero counted-vs-expected variance | Register remains open for read/audit purposes only; no further cash movements accepted; **no `commerce.register.closed.v1` yet** | none |
| `Closed` | `cash-variance.approve` by an actor other than the closer | Session transitions to Closed; variance recorded as an audit/ledger fact | `commerce.register.closed.v1` |

A zero-variance close skips `Closing` entirely and emits `commerce.register.closed.v1` directly from `register.close`. No `commerce.cash-variance.*` event is registered; none is invented — the approval unblocks the already-registered close event. No deny/reject permission is registered for this prototype; an unapproved variance simply remains `Closing` pending re-count or escalation, which is an accepted prototype-depth limit, not a silent scope reduction (recorded in §10.3).

### 6.2 Price override (`commerce.price-override.request` / `.approve`)

| State | Trigger | Effect | Event |
|---|---|---|---|
| `Pending` | `price-override.request` on an uncompleted sale line | No price change applied yet; line price unchanged | none |
| `Approved` | `price-override.approve` by an actor other than the requester | Requested price applied to the line (still pre-completion) | none |

No dedicated event is registered for either transition; none is invented. Governed rule: **a sale cannot complete (`sale.complete`) while any of its lines carries a `Pending` price override.** Resume after `sale.hold` is not a distinct permission — any subsequent authorized mutation (adding a line, requesting/approving an override, or completing) on a Held sale implicitly returns it to Open in the same operation; no `commerce.sale.resume` or `.unhold` identifier exists, and none is invented.

### 6.3 Return (`commerce.return.create` / `.approve`)

| State | Trigger | Effect | Event |
|---|---|---|---|
| `Pending` | `return.create` referencing an original completed sale and bounded lines (cumulative-returned-quantity check performed at create time) | No inventory or cash effect yet | none |
| `Completed` | `return.approve` by an actor other than the creator | Posts the compensating Inventory movement through Inventory's own application command (never Inventory's repositories/tables directly); links the return receipt | `commerce.return.completed.v1` |

The return pair posts the **inventory** compensation only. Cash effects, if any, are the separate refund pair (§6.4) referencing the completed return — this keeps the two maker/checker pairs from conflating an inventory approval with a cash approval.

### 6.4 Refund (`commerce.refund.create` / `.approve`)

| State | Trigger | Effect | Event |
|---|---|---|---|
| `Requested` | `refund.create` referencing an approved return (or a governed no-receipt/gift-receipt path if PR3 scopes one) | No register cash effect yet | `commerce.refund.requested.v1` |
| `Posted` | `refund.approve` by an actor other than the requester | Posts a paid-out cash movement (reason `Refund`) on the referenced open register | `commerce.cash-movement.posted.v1` |

`commerce.refund.requested.v1` matches the registered event name exactly (not `.refunded.v1` or `.approved.v1`, neither of which is registered). No dedicated "refund approved" event exists; the approval's irreversible cash effect rides on the already-registered `commerce.cash-movement.posted.v1`, exactly as PR1 registers it — no invented event.

### 6.5 Exchange composition (no dedicated permission; `commerce.exchanges` realization)

Not a create/approve pair in its own right — composed from the return and sale pairs already governed above, per §5's `commerce.exchanges` row:

1. `return.create` + `return.approve` complete the compensating return (§6.3), posting inventory back and emitting `commerce.return.completed.v1`.
2. `sale.create` + `sale.complete` complete the replacement sale on the same register session, emitting `commerce.sale.completed.v1`.
3. Once both legs are committed, the composed exchange operation emits the correlating `commerce.exchange.completed.v1` referencing both `returnId` and `newSaleId`.

Both legs retain their own maker/checker discipline (return approver ≠ return creator; the replacement sale needs no approval beyond ordinary `sale.complete` authority). No new permission is invented for "exchange" itself.

### 6.6 Deposit (`commerce.deposit.create` / `.confirm`)

| State | Trigger | Effect | Event |
|---|---|---|---|
| `Prepared` | `deposit.create`: amount, currency (GYD), preparer identity, register/safe provenance, deposit reference number | **Effect-free preparation**: reserves the amount against available safe custody; no custody transfer posted | `commerce.deposit.prepared.v1` |
| `Reconciled` | `deposit.confirm` by an actor other than the preparer | Posts the safe-to-bank custody transfer atomically | `commerce.deposit.reconciled.v1` |

Naming note: this pair uses `create`/`confirm` (not `create`/`approve`) because that is the exact permission pair `registry/permissions.json` registers; the maker/checker discipline (preparer ≠ confirmer, no effect before the second authority) is identical to the other four pairs.

## 7. Package and Ownership Plan

| Package | Responsibility | Prohibited responsibility |
|---|---|---|
| `packages/domains/pos` (`@meridian/domain-pos`) | Runtime-neutral RegisterSession, Sale, Return, Refund, Deposit state machines and application ports (PR1-PR4 implement behavior; PR0 publishes only state constants and the persistence-port marker) | PostgreSQL, transport, Inventory implementation, Pricing/Tax calculation |
| `packages/persistence/pos-postgres` (`@meridian/persistence-pos-postgres`) | POS-owned schema, migrations, repositories (PR0 registers an empty owner stream; PR1 adds the first tables) | Inventory, Catalog, or Numbering tables/migrations |
| `packages/engines/pricing` (`@meridian/engine-pricing`) | Runtime-neutral line-pricing contract (port + types only in PR0; PR2 implements `unitPrice × quantity` plus declared discounts) | Tax calculation, persistence, sale completion orchestration |
| `packages/engines/tax` (`@meridian/engine-tax`) | Runtime-neutral tax contract plus the fixed Guyana prototype categories/rate as DATA from PDA-IND-090 (port + types + constants only in PR0; PR2 implements the exclusive/inclusive formulas) | Statutory tax authority, fiscalization, persistence |
| `apps/server/composition` | Binds oRPC procedures and owner adapters to the existing pool (PR1-PR4); registers the empty `pos` migration stream (PR0) | Business rules, cross-owner table orchestration |

`packages/engines/*` is a package family already registered in `registry/architecture-rules.json` (`may_depend_on: foundation, contracts, platform, tooling`); `domains` may depend on `engines`. WS3 PR0 is the first stage to populate it.

Consistent with WS2 PR1's own precedent (verified via `git show 9da5ac0`), PR0 does **not** add a `drizzle.config.ts`, a `db:generate` script, or root `package.json` `db:generate` wiring to `pos-postgres` — that arrives with PR1's first real schema, exactly as WS2's `catalog-postgres`/`inventory-postgres` gained theirs in PR2, not PR1. PR0 *does* register `pos-postgres` in `registry/architecture-rules.json` (via `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`'s Registered Persistence Owners table), the empty migration stream in `apps/server/composition/migrations.ts`, and the CI migration-freshness diff-check list — ahead of WS2's own PR1 timing for that CI line, because this stage's spec explicitly requires it.

## 8. Contract Surface

OpenAPI paths per `openapi/first-slice-v1.yaml` (single source file; `packages/contracts/*/src` is generated and never hand-edited): `/registers/*`, `/sales*`, `/receipts/*`, `/deposits*`, `/refunds*`, `/returns*`, `/exports/accountant-handoff`.

**Verified starting state (2026-07-18):** almost this entire surface already existed as draft stub operations on this branch before PR0 — `/registers/{registerId}/open`, `/close`, `/cash-movements`, `/safe-drops`; `/cash-variances/{varianceId}/approve`; `/sales`, `/sales/{saleId}/complete`, `/sales/{saleId}/hold`; `/returns`, `/returns/{returnId}/approve`; `/refunds`, `/refunds/{refundId}/approve`; `/deposits`, `/deposits/{depositId}/confirm`; `/receipts/{receiptId}` (GET), `/receipts/{receiptId}/reissue`, `/receipts/{receiptId}/void`; `/exports/accountant-handoff` (POST, `platform.export.create`) and `/exports/{exportId}` (GET, `platform.export.read`) — every one already carrying its correct `x-permission` from Table (a). **PR0's only contract addition is `commerce.price-override.request`/`.approve`**, which had zero endpoint mappings before this PR (`endpoint_count: 0` in `registry/permissions.json`):

- `POST /sales/{saleId}/price-overrides` — `commerce.price-override.request`
- `POST /sales/{saleId}/price-overrides/{overrideId}/approve` — `commerce.price-override.approve`

Both are added to `openapi/first-slice-v1.yaml`, `registry/endpoint-permissions.json`, and `docs/blueprint/02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md` together, matching the WS2 PR1 propagation discipline.

Every operation in the fixed surface declares a permission from Table (a); none declares `x-authorization` instead, because every WS3 operation is a permissioned business command, not a bare-session read.

### 8.1 Finance handoff

`docs/blueprint/04-Business-Domains/FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md` (PDA-DOM-026) and `schemas/finance/finance-handoff-v1.schema.json` are referenced, not modified, per CLAUDE.md §10. The contract's own API list (`GET /v1/finance-handoff/posting-batches`, `POST /v1/exports/accountant-handoff`, `GET /v1/exports/{exportId}`, `POST /v1/deposit-reconciliations`) is broader than WS3's fixed surface: WS3 PR4 implements only `POST /v1/exports/accountant-handoff` and `GET /v1/exports/{exportId}`. The posting-batches read endpoint and the `/deposit-reconciliations` endpoint (already mapped in `registry/endpoint-permissions.json` to `finance.bank-reconciliation.create`, a Finance-namespace permission) remain Finance workstream ownership, out of WS3 scope by the fixed contract-path list in this plan's charter, not by omission.

PR4's stage file requires an explicit CONTRACT COVERAGE ENUMERATION mapping every `FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md` requirement (legal-entity isolation, source-event range, posting-rule/version behavior, balanced posting lines, inventory inputs, exception preservation, package contents, time-limited access, encryption/audit controls) to an implementation+test or an explicit governed deferral with owner and gate. That enumeration is PR4 implementation evidence, not a PR0 deliverable; PR0 records only that the obligation exists and is bound to PR4.

## 9. Lane-Command Table

Exact commands for every WS3 test lane, modeled on `.github/workflows/meridian-prototype.yml`'s isolated-worker-DB pattern. Implementers and verifiers use these verbatim.

| Lane | Command | Prerequisite | Timeout |
|---|---|---|---|
| Docs validation | `python scripts/validate_docs.py` | none | 5 min |
| Registry freshness | `python scripts/generate_registries.py --check` | none | 5 min |
| Contract freshness | `python scripts/generate_contracts.py --check` | none | 5 min |
| Public-disclosure scan | `python scripts/check_public_disclosure.py` | none | 5 min |
| Architecture rules | `bun run architecture:check && python scripts/test_architecture_checker.py` | `bun install` | 5 min |
| Program-status validation | `python scripts/validate_program_status.py` | none | 5 min |
| WS1 evidence gate | `bun run ws1:evidence:check` | none | 5 min |
| WS2 evidence gate | `bun run ws2:evidence:check` | none | 5 min |
| Type checking | `bun run check-types` | `bun install` | 10 min |
| Workspace tests (no DB) | `bun run test` | `bun install` | 10 min |
| Lint/format | `bun run check` | `bun install` | 5 min |
| Whitespace | `git diff --check` | none | 1 min |
| Migration freshness | `bun run db:generate && git diff --exit-code -- packages/persistence/*/src/migrations` | `bun run db:start` (local Postgres) | 5 min |
| **PR1 live-PG lane** | `bun run --cwd apps/server db:test` (register/cash-movement suites) | isolated per-test database via `CREATE DATABASE`, matching `apps/server/composition/persistence.integration.test.ts`'s pattern; `bun run db:start` | 15 min |
| **PR2 live-PG lane** | `bun run --cwd apps/server db:test` (sale/receipt/triple-atomicity suites) | same isolated-database pattern | 15 min |
| **PR3 live-PG lane** | `bun run --cwd apps/server db:test` (return/refund/exchange suites) | same isolated-database pattern | 15 min |
| **PR4 live-PG lane** | `bun run --cwd apps/server db:test` (deposit/export suites) | same isolated-database pattern | 15 min |
| Node fallback critical suite | `bun run --cwd apps/server db:test:node` | migrated database; `node` on PATH | 10 min |
| **PR6 worker replay lane** | `bun run --cwd apps/worker db:test` | **SEPARATE isolated database** — the worker guard checks outbox `count==0` at start; never point it at the server lane's database (operational landmine from the fifth audit) | 15 min |
| PR5 web unit tests | `bun test src` scoped inside `apps/web` (bare `bun test` wrongly picks up Playwright specs per WS2 PR6's lesson) | `bun install` | 10 min |
| PR5 Playwright e2e | `bun run --cwd apps/web test:e2e:install && docker compose up -d postgres server web worker && bun run --cwd apps/web test:e2e` | full compose stack | 15 min |
| Docker stack validation | `docker compose build web server worker && docker compose up -d postgres server web worker` | Docker | 15 min |
| Full suite (this stage's own gate) | every command in this table plus `git diff --check` | as above | n/a — run individually with the bounds above |

## 10. Reported Conflicts (CLAUDE.md §1)

### 10.1 `engine.pricing` depth

`registry/first-slice.json` registers `engine.pricing` at **full** depth. The PR0 stage specification's package list describes `packages/engines/pricing` and `packages/engines/tax` together as "(prototype depth...)". This plan treats the registry depth (full) as authoritative per CLAUDE.md §1's authority order, and records the packet's "prototype depth" phrasing as describing this stage's own package-skeleton fidelity, not a depth override. WS3 PR2's pricing implementation (line price × quantity plus any declared sale/line discounts) is therefore recorded as **prototype-equivalent fidelity against a full-depth registered capability** — an explicit, disclosed gap against the registered depth, not a full-depth completion claim. `engine.tax` is registered at `prototype` depth, matching the packet's phrasing exactly; no conflict there.

### 10.2 `commerce.deposits` capability ID

`registry/capabilities.json` lists `commerce.deposits` as a distinct capability ID, but `registry/first-slice.json` does **not** mark it `first_slice: true` (`first_slice_depth: null`). Meanwhile `commerce.deposit.create`/`.confirm` permissions and `commerce.deposit.prepared.v1`/`.reconciled.v1` events ARE registered and required in-slice, and `FIRST_SLICE_MANIFEST.md`'s Commerce bullet reads "Cash management, safe drops, deposits, and variance" as one line. This plan resolves the gap by treating WS3 PR4's deposit behavior as realized under the registered first-slice `commerce.cash-management` capability (full depth), consistent with the manifest's framing, rather than inventing a first-slice assignment for the unregistered `commerce.deposits` capability ID. This is reported, not silently resolved: a future registry correction should either mark `commerce.deposits` first-slice or fold it explicitly into `commerce.cash-management`'s documented scope.

### 10.3 Cash-variance denial path

No `commerce.cash-variance.reject` (or equivalent deny) permission is registered. PR1's `cash-variance.approve` is the only authority on a pending variance; this plan records the absence of a formal deny path as an accepted prototype-depth limit (a variance that is never approved simply stays `Closing` pending re-count or escalation), not a silent scope reduction, because no registered identifier for a deny transition exists to implement.

### 10.4 `domains -> engines` import edge is contract-only, not a direct package import

§7's Package and Ownership Plan states "`domains` may depend on `engines`" and cites `registry/architecture-rules.json`'s `may_depend_on` list as authorization for `packages/domains/pos` to import `@meridian/engine-pricing`/`@meridian/engine-tax` directly. `scripts/check_architecture.py` enforces a stricter, separate rule not accounted for in that reading: `requirements.family_grants_are_contract_only` forbids ANY direct import edge where both the source and target package are in `{platform, engines, domains}`, regardless of the `may_depend_on` family list — a `domains -> engines` edge is contract-only, and neither `@meridian/engine-pricing` nor `@meridian/engine-tax` publishes a separate `packages/contracts/engine-*` package for a domain to import instead. PR2 discovered this running `python scripts/check_architecture.py` (a mandatory gate) against `packages/domains/pos/src/index.ts` and its colocated `index.test.ts`, both of which had imported `PricingEnginePort`/`TaxEnginePort` (types) and, in the test file, `createPricingEngine`/`createTaxEngine` (runtime) directly from the engine packages.

This plan treats the mechanically-enforced checker rule as authoritative over §7's prose per CLAUDE.md §1 (the checker is generated from `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`, the same governing source `registry/architecture-rules.json` is generated from, and is not itself overridden by a Draft implementation plan's informal restatement of what that source allows). PR2's resolution follows this file's own established "domain defines its own local port; composition supplies a conforming adapter" pattern — already used for `SaleInventoryMovementPort`, `ReceiptNumberAllocatorPort`, and `PosCatalogPort` — rather than creating a new `packages/contracts/engine-*` family member: `packages/domains/pos/src/index.ts` now declares local `PosPricingPort`/`PosTaxPort` interfaces (structurally identical to `PricingEnginePort`/`TaxEnginePort`) with zero import from either engine package; `apps/server/composition/pos.ts` (a registered composition root, permitted to import both `domains` and `engines`) is the only place `createPricingEngine()`/`createTaxEngine()` are constructed and wired in. `packages/domains/pos/src/index.test.ts` uses a test-local reimplementation of both formulas (not an import) for the same reason, with the engines' own formula correctness independently asserted by their own colocated test files. `packages/domains/pos/package.json` no longer lists `@meridian/engine-pricing`/`@meridian/engine-tax` as dependencies. A future registry correction should either publish `packages/contracts/engine-pricing`/`packages/contracts/engine-tax` (if `domains` ever needs a nominal engine-provided type it cannot restate locally) or correct §7's prose to describe the contract-only discipline exactly, rather than leaving both readings live side by side.

## 11. Per-Capability/Per-Dimension Test Matrix

From Table (c) and `registry/first-slice-tests.json`'s 13 dimensions (`happy_path`, `validation_and_denial`, `tenant_isolation`, `permission_and_entitlement`, `idempotency_and_duplicate`, `concurrency_and_conflict`, `events_jobs_and_projections`, `audit_and_observability`, `privacy_and_classification`, `offline_and_degraded`, `accessibility_and_responsive`, `performance_and_capacity`, `recovery_replay_and_reconciliation`). All 13 are `required` at `full` and `prototype` depth (the `seam`-depth defaults in `registry/capability-metadata.json` do not apply to any WS3 capability, since none is registered at `seam` depth). PR6's evidence checker (`scripts/check_ws3_evidence.py`) rejects an empty required cell for any capability below; dominant dimensions named per-stage do not waive the other ten.

| Capability | Stage | Dominant dimensions (stage files) | All 13 required |
|---|---|---|---|
| `commerce.register-management` | PR1 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.shift-management` | PR1 | (realized via register-management; same evidence) | yes |
| `commerce.cash-management` | PR1, PR4 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.pos` | PR1-PR5 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.order-management` | PR2 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.receipts` | PR2, PR3 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.returns` | PR3 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.exchanges` | PR3 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.gift-receipts` | PR3 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.refunds` | PR3 | happy_path, validation_and_denial, recovery_replay_and_reconciliation | yes |
| `commerce.mobile-pos` | PR5 | accessibility_and_responsive (design emphasis), happy_path | yes |
| `commerce.offline-sales` | PR2/PR5 (online only) | offline_and_degraded (**partial — PENDING WS5**, recorded per §5, not evidenced complete) | yes, with the WS5-pending disposition recorded explicitly rather than a blank cell |

## 12. Quality Budgets

Minimum provisional budgets from `FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS3 and PDA-RDM-006, to be MEASURED (not merely asserted) per-stage using the methodology PR2/PR5's stage files require (≥50 warm iterations after ≥5 warmup, p50/p95/p99, explicit PASS/MISS-with-disposition):

| Signal | WS3 target |
|---|---:|
| Median cash sale | ≤30s (P90 ≤60s) — DESIGN budget until #82 usability observation exists |
| Platform sale processing | 750ms p95 / 1.5s p99 |
| Add-scanned-item lookup | 100ms p95 |
| POS route JS | ≤350KB target |
| Receipt numbering | offline-safe via `platform/numbering` — **online-only on this branch; offline-safe property PENDING WS5** |
| Duplicate business effects from replay | zero |

## 13. Registry Propagation (this PR0)

- Two new endpoint operations (`commerce.price-override.request`/`.approve`) added to `openapi/first-slice-v1.yaml`, `registry/endpoint-permissions.json`, and `docs/blueprint/02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md`.
- Ten new event schemas added under `schemas/events/` (Table (b)).
- `packages/domains/pos`, `packages/persistence/pos-postgres`, `packages/engines/pricing`, `packages/engines/tax` package skeletons added, each with `check-types` passing and a real colocated `*.test.ts`.
- `docs/blueprint/14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md`'s Registered Persistence Owners table gains the `pos-postgres` row (owner `pos`, `@meridian/domain-pos`, no tables yet).
- `apps/server/composition/migrations.ts` gains `WS3_MIGRATION_STREAMS` (the empty `pos` stream) folded into `ALL_MIGRATION_STREAMS`.
- `.github/workflows/meridian-prototype.yml`'s migration-freshness diff-check list gains `packages/persistence/pos-postgres/src/migrations`.
- `apps/server/package.json` gains `@meridian/domain-pos` and `@meridian/persistence-pos-postgres` dependencies.
- `python scripts/generate_registries.py` regenerates `registry/permissions.json`, `registry/events.json`, `registry/documents.json` (this document as `PDA-RDM-012`), and `registry/architecture-rules.json` from their sources; `--check` must pass with no diff.
- `python scripts/generate_contracts.py` regenerates the TypeScript contract packages from `openapi/first-slice-v1.yaml` + `registry/endpoint-permissions.json`; `--check` must pass with no diff.

## 14. Review and Change Record

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-18 | Platform Design Authority (Claude Code, WS3 PR0) | Initial governed WS3 control plan: FROZEN identifier tables (a)-(d), maker/checker state machines, lane-command table, per-capability test matrix, package/ownership plan, and reported conflicts (§10). Consolidated end-of-run review pending per FDR-012; not yet independently reviewed or merged. |
| 0.1.1 | 2026-07-18 | Platform Design Authority (Claude Code, WS3 PR2) | Records §10.4: `family_grants_are_contract_only` forbids the direct `packages/domains/pos` -> `@meridian/engine-pricing`/`@meridian/engine-tax` import edge §7's prose assumed permitted; resolved via local `PosPricingPort`/`PosTaxPort` ports, discovered running the mandatory `check_architecture.py` gate. No FROZEN table in §3-§9 changed. Still not independently reviewed or merged. |
