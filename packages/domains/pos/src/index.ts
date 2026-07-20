/**
 * WS3 PR0 published only the runtime-neutral contract boundary for the POS
 * domain. WS3 PR1 (this file) implements the RegisterSession/CashMovement
 * behavior the frozen WS3 control plan
 * (docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md) assigns to
 * this stage: `commerce.register.open`, `commerce.register.close`,
 * `commerce.cash-movement.create`, and `commerce.cash-variance.approve`.
 * Sale, return, refund, and deposit behavior remain WS3 PR2-PR4, never here.
 *
 * Runtime-neutral per ADR-0020: no Bun globals, `bun:*` imports, Hono
 * context types, oRPC transport objects, or database adapters. Concrete
 * Postgres adapters live in `@meridian/persistence-pos-postgres`.
 */

import type { EventEnvelope } from "@meridian/contracts-events";

/**
 * RegisterSession lifecycle (PR1): a session opens with a counted float and
 * closes with a counted drawer. There is no reopen transition — a new
 * session is opened instead. `Closing` is the state a non-zero-variance
 * close occupies while `commerce.cash-variance.approve` is pending; it is
 * never externally observable as a completed close.
 */
export const REGISTER_SESSION_STATES = ["Open", "Closing", "Closed"] as const;

export type RegisterSessionState = (typeof REGISTER_SESSION_STATES)[number];

/**
 * Sale lifecycle (PR2): a sale accumulates lines while `Open`, may be
 * parked to `Held` via `commerce.sale.hold` and resumed by any further
 * authorized mutation, and becomes `Completed` only through
 * `commerce.sale.complete`. A `Completed` sale is append-only; returns and
 * voids are PR3 compensating records, never edits of this state.
 */
export const SALE_STATES = ["Open", "Held", "Completed"] as const;

export type SaleState = (typeof SALE_STATES)[number];

/**
 * Maker/checker pending states shared by the five WS3 create/approve pairs
 * (cash-variance, price-override, return, refund, deposit-confirm). A
 * `Pending` request carries no irreversible cash, inventory, or outbox
 * effect; only `Approved` may. The requesting actor may never also be the
 * approving actor (self-approval is denied at the application boundary).
 */
export const APPROVAL_STATES = ["Pending", "Approved"] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

/**
 * Runtime-neutral persistence boundary. Concrete Postgres adapters live in
 * `@meridian/persistence-pos-postgres`; this core never imports Drizzle,
 * `pg`, migrations, environment access, Hono, oRPC transports, or Bun
 * globals (ADR-0020).
 */
export interface PosPersistencePort {
	readonly owner: "pos";
}

// ---------------------------------------------------------------------------
// Money (CLAUDE.md §7: explicit currency, integer minor-unit semantics —
// never binary floating point. Matches the already-frozen event schemas'
// `*Minor` integer fields exactly.)
// ---------------------------------------------------------------------------

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MAX_MINOR_AMOUNT = Number.MAX_SAFE_INTEGER;

export class PosError extends Error {
	readonly code:
		| "approval_separation"
		| "idempotency_conflict"
		| "insufficient_cash"
		| "invalid_reference"
		| "invalid_state"
		| "negative_stock"
		| "not_found"
		| "validation"
		| "version_conflict";
	constructor(code: PosError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "PosError";
	}
}

function requireCurrency(value: string): void {
	if (!CURRENCY_PATTERN.test(value)) {
		throw new PosError(
			"validation",
			"Currency must be a three-letter ISO 4217 alphabetic code"
		);
	}
}

function requireMatchingCurrency(expected: string, actual: string): void {
	requireCurrency(actual);
	if (actual !== expected) {
		throw new PosError(
			"validation",
			"Amount currency does not match the register session currency"
		);
	}
}

function requireNonNegativeMinor(value: number, field: string): void {
	if (!Number.isInteger(value) || value < 0 || value > MAX_MINOR_AMOUNT) {
		throw new PosError(
			"validation",
			`${field} must be a non-negative integer minor-unit amount`
		);
	}
}

function requirePositiveMinor(value: number, field: string): void {
	if (!Number.isInteger(value) || value <= 0 || value > MAX_MINOR_AMOUNT) {
		throw new PosError(
			"validation",
			`${field} must be a positive integer minor-unit amount`
		);
	}
}

// ---------------------------------------------------------------------------
// Cash movements
// ---------------------------------------------------------------------------

export const CASH_MOVEMENT_DIRECTIONS = ["PaidIn", "PaidOut"] as const;
export type CashMovementDirection = (typeof CASH_MOVEMENT_DIRECTIONS)[number];

export const CASH_MOVEMENT_REASON_CODES = [
	"PaidIn",
	"PaidOut",
	"SafeDrop",
	"Refund",
	"Other",
] as const;
export type CashMovementReasonCode =
	(typeof CASH_MOVEMENT_REASON_CODES)[number];

/**
 * The direction/reason-code pairing every cash movement (paid-in, paid-out,
 * safe drop, and PR3's refund posting) must satisfy. `Other` is the only
 * reason code that tolerates either direction; every other reason code has
 * exactly one legal direction (CLAUDE.md §5 corrections are reversal/
 * compensation only — a mismatched pairing is rejected outright, not
 * silently corrected).
 */
function requireDirectionReasonPairing(
	direction: CashMovementDirection,
	reasonCode: CashMovementReasonCode
): void {
	const requiredDirection: Record<
		Exclude<CashMovementReasonCode, "Other">,
		CashMovementDirection
	> = {
		PaidIn: "PaidIn",
		PaidOut: "PaidOut",
		Refund: "PaidOut",
		SafeDrop: "PaidOut",
	};
	if (reasonCode === "Other") {
		return;
	}
	if (requiredDirection[reasonCode] !== direction) {
		throw new PosError(
			"validation",
			`Reason code ${reasonCode} requires direction ${requiredDirection[reasonCode]}`
		);
	}
}

export interface RegisterSessionRecord {
	closedAt: Date | null;
	closedByActorUserId: string | null;
	closedByPartyId: string | null;
	closeReason: string | null;
	closeRequestedAt: Date | null;
	countedCashMinor: number | null;
	createdAt: Date;
	currency: string;
	expectedCashMinor: number | null;
	id: string;
	locationId: string;
	openedAt: Date;
	openedByActorUserId: string;
	openedByPartyId: string;
	openingFloatMinor: number;
	organizationId: string;
	registerId: string;
	state: RegisterSessionState;
	tenantId: string;
	updatedAt: Date;
	varianceApprovalRequired: boolean;
	varianceApprovedAt: Date | null;
	varianceApprovedByActorUserId: string | null;
	varianceApprovedByPartyId: string | null;
	varianceMinor: number | null;
	version: number;
}

export interface RegisterSessionView {
	closedAt: string | null;
	closeReason: string | null;
	countedCash: { amountMinor: number; currency: string } | null;
	currency: string;
	expectedCash: { amountMinor: number; currency: string } | null;
	id: string;
	locationId: string;
	openedAt: string;
	openerPartyId: string;
	openingFloat: { amountMinor: number; currency: string };
	registerId: string;
	state: RegisterSessionState;
	variance: { amountMinor: number; currency: string } | null;
	varianceApprovalRequired: boolean;
	varianceApprovedAt: string | null;
	varianceApproverPartyId: string | null;
	version: number;
}

export interface CashMovementRecord {
	actorPartyId: string;
	actorUserId: string;
	amountMinor: number;
	createdAt: Date;
	currency: string;
	direction: CashMovementDirection;
	id: string;
	note: string | null;
	organizationId: string;
	reasonCode: CashMovementReasonCode;
	referenceId: string | null;
	registerId: string;
	sessionId: string;
	tenantId: string;
}

export interface CashMovementView {
	amount: { amountMinor: number; currency: string };
	createdAt: string;
	direction: CashMovementDirection;
	id: string;
	note: string | null;
	reasonCode: CashMovementReasonCode;
	referenceId: string | null;
	registerId: string;
	sessionId: string;
}

export interface CashMovementNetTotals {
	paidInMinor: number;
	paidOutMinor: number;
}

export type PosCommandOperation =
	| "commerce.cash-movement.create"
	| "commerce.cash-variance.approve"
	| "commerce.deposit.confirm"
	| "commerce.deposit.create"
	| "commerce.price-override.approve"
	| "commerce.price-override.request"
	| "commerce.receipt.reissue"
	| "commerce.receipt.void"
	| "commerce.refund.approve"
	| "commerce.refund.create"
	| "commerce.register.close"
	| "commerce.register.open"
	| "commerce.return.approve"
	| "commerce.return.create"
	| "commerce.sale.complete"
	| "commerce.sale.create"
	| "commerce.sale.hold";

export interface PosCommandReceipt {
	createdAt: Date;
	idempotencyKey: string;
	operation: PosCommandOperation;
	requestFingerprint: string;
	resourceId: string;
	result: unknown;
	tenantId: string;
}

// ---------------------------------------------------------------------------
// WS3 PR4: Accountant handoff export source data (frozen control plan
// §8.1). This is a bounded, timezone-aware READ over POS's own owned data
// — never a write path, never a maker/checker pair. `periodStartUtc`/
// `periodEndUtc` are exact UTC instants (half-open: >= start, < end); the
// caller (composition, via `AccountantHandoffRequest.timezone`) is
// responsible for having derived them from the requested local calendar
// boundary — POS performs plain instant-range comparisons against its own
// `timestamptz` columns, which are timezone-agnostic by construction, so
// no local-date truncation bug can be introduced on this side of the
// boundary. Electronic-tender/stored-value tender totals are always zero
// on this branch: `completeSale` accepts Cash tenders only
// (`requireCashOnlyTenders`) — WS4/WS6 governed deferrals, not omissions.
// ---------------------------------------------------------------------------

export interface PosFinanceHandoffSaleFact {
	completedAt: Date;
	currency: string;
	discountMinor: number;
	grossMinor: number;
	id: string;
	taxMinor: number;
	totalMinor: number;
}

export interface PosFinanceHandoffRefundFact {
	amountMinor: number;
	currency: string;
	movementId: string;
	postedAt: Date;
	refundId: string;
	/** WS3 remediation R1 cycle 2: distinguishes a real `approveRefund`
	 * posting (`refundId` names an actual `pos_refund` row) from a
	 * `voidReceipt` cash reversal (`refundId` names the void's `pos_return`
	 * row instead — no `pos_refund` row exists for a Void). Both post the
	 * same economic cash effect and belong in this Finance-handoff
	 * category, but a consumer building posting-line provenance
	 * (`sourceType`/`sourceId`) must not label a Void as a Refund reference
	 * that does not exist. */
	sourceKind: "Refund" | "Void";
}

export interface PosFinanceHandoffVarianceFact {
	currency: string;
	occurredAt: Date;
	registerId: string;
	sessionId: string;
	varianceMinor: number;
}

export interface PosFinanceHandoffUnresolvedVarianceFact {
	closeRequestedAt: Date;
	registerId: string;
	sessionId: string;
}

export interface PosFinanceHandoffDepositFact {
	amountMinor: number;
	currency: string;
	depositId: string;
	depositReference: string;
	occurredAt: Date;
}

export interface PosFinanceHandoffSourceData {
	closedVariances: PosFinanceHandoffVarianceFact[];
	/** Net signed quantity movement (fixed-point, scale 1,000,000 — matching
	 * `RETURN_QUANTITY_SCALE`) across completed Sale lines minus Return
	 * lines in range: POS's own already-recorded quantities (the same ones
	 * each line's `inventoryMovementId` posted to Inventory), not a second
	 * query against Inventory's authoritative ledger (a domain may not
	 * import another domain's tables — see the PR4 contract-coverage
	 * enumeration's inventory-input disposition). */
	netInventoryQuantityScaled: string;
	preparedDeposits: PosFinanceHandoffDepositFact[];
	reconciledDeposits: PosFinanceHandoffDepositFact[];
	refunds: PosFinanceHandoffRefundFact[];
	returnCount: number;
	sales: PosFinanceHandoffSaleFact[];
	unresolvedVariances: PosFinanceHandoffUnresolvedVarianceFact[];
}

/** WS3 remediation R3b, Item 7 (server-backed discovery). Cursor-page
 * request/result shape, mirroring `packages/domains/inventory`'s
 * `InventoryPageRequest`/`InventoryPage<T>` exactly — the same
 * `gt(id) … orderBy asc(id) … limit + 1` cursor discipline
 * `listAdjustments` already uses, applied to the five POS approval/
 * confirmation queues below. */
export interface PosPageRequest {
	cursor?: string;
	limit: number;
}
export interface PosPage<T> {
	items: T[];
	nextCursor: string | null;
}

export interface PosRepository {
	acquireCommandLock: (
		tenantId: string,
		operation: PosCommandOperation,
		idempotencyKey: string
	) => Promise<void>;

	// -- WS3 PR2: Sale, PriceOverride, Receipt -------------------------------
	countPendingPriceOverrides: (
		tenantId: string,
		saleId: string
	) => Promise<number>;
	createCashMovement: (
		record: CashMovementRecord
	) => Promise<CashMovementRecord>;

	// -- WS3 PR4: Deposit, Finance handoff -----------------------------------
	createDeposit: (record: DepositRecord) => Promise<DepositRecord>;
	/** Inserts the dedicated custody-transfer row — the ONLY effect
	 * `deposit.confirm` posts (frozen control plan §6.6: "Posts the
	 * safe-to-bank custody transfer atomically"). No row in this table may
	 * ever exist for a `Prepared` deposit; the domain layer's
	 * effect-free-preparation invariant depends on `createDeposit` never
	 * calling this. */
	createDepositCustodyTransfer: (record: {
		amountMinor: number;
		confirmedByActorUserId: string;
		confirmedByPartyId: string;
		currency: string;
		depositId: string;
		id: string;
		organizationId: string;
		postedAt: Date;
		tenantId: string;
	}) => Promise<void>;
	createPriceOverride: (
		record: PriceOverrideRecord
	) => Promise<PriceOverrideRecord>;
	createReceipt: (record: ReceiptRecord) => Promise<ReceiptRecord>;

	// -- WS3 PR3: Return, Refund ----------------------------------------------
	createRefund: (record: RefundRecord) => Promise<RefundRecord>;
	createReturn: (record: ReturnRecord) => Promise<ReturnRecord>;
	createSale: (record: SaleRecord) => Promise<SaleRecord>;
	getCommandReceipt: (
		tenantId: string,
		operation: PosCommandOperation,
		idempotencyKey: string
	) => Promise<PosCommandReceipt | null>;
	/** WS3 remediation R2, Finding B: `organizationId` is REQUIRED (not
	 * optional) on every by-ID lookup below that can be reached from a
	 * caller-supplied identifier — it is filtered in the SQL `WHERE`
	 * clause itself (never a post-fetch check), so a row that exists but
	 * belongs to a DIFFERENT organization in the SAME tenant is
	 * indistinguishable at the SQL level from a row that does not exist at
	 * all: both return `null`, and callers reject with the SAME governed
	 * `PosError("not_found", ...)` denial used for a genuinely unknown id
	 * (non-disclosing — a cross-org caller can never learn the resource
	 * exists elsewhere). `locationId`, where supplied, is an ADDITIONAL SQL
	 * filter on the tables that actually persist a location dimension
	 * (`pos_register_session`, `pos_sale`) — omitted (`undefined`) it is a
	 * no-op, matching an organization-scoped (not location-scoped) active
	 * context. Locks the row (SELECT ... FOR UPDATE) inside the enclosing
	 * transaction where noted below, unchanged from before this finding. */
	getDeposit: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<DepositRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getOpenSession: (
		tenantId: string,
		organizationId: string,
		registerId: string,
		locationId?: string
	) => Promise<RegisterSessionRecord | null>;
	getPriceOverride: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<PriceOverrideRecord | null>;
	getReceipt: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<ReceiptRecord | null>;
	/** WS3 remediation R3, Finding J: keyed on the SAME (tenantId,
	 * registerId, receiptNumber) tuple `pos_receipt_tenant_register_number_
	 * uidx` guarantees uniqueness over — `registerId` is required, not an
	 * optional filter, so this can never return an arbitrary pick among
	 * several receipts sharing a number across different registers. */
	getReceiptByNumber: (
		tenantId: string,
		organizationId: string,
		registerId: string,
		receiptNumber: string
	) => Promise<ReceiptRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getRefund: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<RefundRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getReturn: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<ReturnRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getSale: (
		tenantId: string,
		organizationId: string,
		saleId: string,
		locationId?: string
	) => Promise<SaleRecord | null>;
	getSession: (
		tenantId: string,
		organizationId: string,
		sessionId: string,
		locationId?: string
	) => Promise<RegisterSessionRecord | null>;
	/** WS3 remediation R3b, Item 7 (server-backed discovery). Org-scoped
	 * exactly like `getDeposit` above (`pos_deposit` carries no `locationId`
	 * column — deposits draw custody from a set of register sessions, not
	 * one location). Callers pass `state: "Prepared"` for the confirmation
	 * queue. */
	listDeposits: (
		tenantId: string,
		organizationId: string,
		page: PosPageRequest,
		filters?: { state?: DepositRecord["state"] }
	) => Promise<PosPage<DepositRecord>>;
	/** WS3 remediation R3b, Item 7 (server-backed discovery). Org-scoped
	 * exactly like `getPriceOverride` above (the `pos_price_override` table
	 * carries no `locationId` column). Defaults to no state filter; callers
	 * pass `state: "Pending"` for the approval queue. */
	listPriceOverrides: (
		tenantId: string,
		organizationId: string,
		page: PosPageRequest,
		filters?: { state?: PriceOverrideRecord["state"] }
	) => Promise<PosPage<PriceOverrideRecord>>;
	/** WS3 remediation R3b, Item 7 (server-backed discovery). Org-scoped
	 * exactly like `getRefund` above. Callers pass `state: "Requested"` for
	 * the approval queue (`RefundRecord`'s pending state is named
	 * `"Requested"`, not `"Pending"`). */
	listRefunds: (
		tenantId: string,
		organizationId: string,
		page: PosPageRequest,
		filters?: { state?: RefundRecord["state"] }
	) => Promise<PosPage<RefundRecord>>;
	/** WS3 remediation R3b, Item 7 (server-backed discovery). Org-scoped
	 * exactly like `getReturn` above. Callers pass `state: "Pending"` for
	 * the approval queue. */
	listReturns: (
		tenantId: string,
		organizationId: string,
		page: PosPageRequest,
		filters?: { state?: ReturnRecord["state"] }
	) => Promise<PosPage<ReturnRecord>>;
	/** WS3 remediation R3b, Item 7 (server-backed discovery). Org- and
	 * (optionally) location-scoped exactly like `getSession` above
	 * (`pos_register_session` carries `locationId`, unlike Deposit/Return/
	 * Refund/PriceOverride). Callers pass `state: "Closing"` for the
	 * pending-variance-approval queue — a session only ever holds that
	 * state while a non-zero close variance awaits `commerce.cash-variance.
	 * approve` (see `listCashVariancesContract`'s doc comment in
	 * `packages/contracts/platform-api`). */
	listSessions: (
		tenantId: string,
		organizationId: string,
		page: PosPageRequest,
		filters?: {
			locationId?: string;
			state?: RegisterSessionRecord["state"];
		}
	) => Promise<PosPage<RegisterSessionRecord>>;
	/** Locks EVERY referenced session row (SELECT ... FOR UPDATE), always in
	 * ascending `id` order regardless of the caller's array order, so two
	 * concurrent deposit preparations naming overlapping-but-differently-
	 * ordered session sets can never deadlock — the same discipline
	 * `getSale` gives return.create's cumulative-quantity check, applied
	 * here to serialize concurrent safe-custody reservation (round-3
	 * P1-4). Returns fewer rows than requested if any id does not belong
	 * to the tenant, organization, AND (when supplied) location (WS3
	 * remediation R2, Finding B); callers MUST verify the count matches. */
	lockSessionsForDeposit: (
		tenantId: string,
		organizationId: string,
		sessionIds: string[],
		locationId?: string
	) => Promise<RegisterSessionRecord[]>;
	netCashMovements: (
		tenantId: string,
		sessionId: string
	) => Promise<CashMovementNetTotals>;
	/** Inserts the session row; the owning schema's partial unique index
	 * (tenant_id, register_id) WHERE state IN ('Open', 'Closing') is the
	 * authoritative double-open guard under genuine concurrency — this
	 * return value reports that constraint's outcome, it does not itself
	 * enforce it. A `Closing` session (non-zero variance, pending
	 * `commerce.cash-variance.approve`) still holds an unreconciled custody
	 * position, so it blocks a new open on the same register exactly like an
	 * `Open` one does. */
	openRegister: (
		record: RegisterSessionRecord
	) => Promise<RegisterSessionRecord | "already_open">;
	/**
	 * Bounded, timezone-agnostic instant-range read over POS's own owned
	 * data (WS3 PR4 §8.1) — never touches another domain's tables. Legal-
	 * entity scoping is enforced at the composition/router boundary (POS
	 * records carry no `legalEntityId` in first slice; a governed
	 * simplification recorded in the PR4 contract-coverage enumeration),
	 * not filtered here.
	 */
	queryFinanceHandoffSourceData: (input: {
		organizationId: string;
		periodEndUtc: Date;
		periodStartUtc: Date;
		tenantId: string;
	}) => Promise<PosFinanceHandoffSourceData>;
	recordCommandReceipt: (
		receipt: PosCommandReceipt
	) => Promise<{ inserted: boolean; record: PosCommandReceipt }>;
	/** Sums the `amountMinor` of every distinct `Prepared`/`Reconciled`
	 * Deposit that shares AT LEAST ONE session with the given set (a
	 * conservative, session-set-level reservation — see the PR4
	 * contract-coverage enumeration's documented custody-conservation
	 * design note). Excludes `excludeDepositId` (the deposit being
	 * re-validated on confirm, if any) so a deposit never double-reserves
	 * against its own prior preparation. */
	sumReservedDepositsForSessions: (
		tenantId: string,
		sessionIds: string[],
		excludeDepositId?: string
	) => Promise<number>;
	/** Sums every prior return line's quantity against one Sale line, across
	 * BOTH `Pending` and `Completed` Return rows (frozen control plan §6.3:
	 * "cumulative-returned-quantity check performed at create time"; a
	 * `Pending` return already reserves against the cap even though it has
	 * no inventory/cash effect yet — otherwise two concurrent `Pending`
	 * creates could each pass the check and later both approve, over-
	 * returning the line). Callers MUST call this only after locking the
	 * owning Sale row (`getSale`) in the same transaction, which is what
	 * makes the check race-free under concurrency (`return.create` from a
	 * second actor on the same sale blocks until the first transaction
	 * commits or rolls back). */
	sumReturnedQuantity: (
		tenantId: string,
		saleLineId: string
	) => Promise<string>;
	/** Sums `SafeDrop` cash-movement amounts across the given sessions —
	 * the safe-custody pool a deposit's `sourceShiftIds` may draw against. */
	sumSafeDropForSessions: (
		tenantId: string,
		sessionIds: string[]
	) => Promise<number>;
	updateDeposit: (
		record: DepositRecord,
		expectedVersion: number
	) => Promise<DepositRecord | "version_conflict">;
	updatePriceOverride: (
		record: PriceOverrideRecord,
		expectedVersion: number
	) => Promise<PriceOverrideRecord | "version_conflict">;
	updateRefund: (
		record: RefundRecord,
		expectedVersion: number
	) => Promise<RefundRecord | "version_conflict">;
	updateReturn: (
		record: ReturnRecord,
		expectedVersion: number
	) => Promise<ReturnRecord | "version_conflict">;
	updateSale: (
		record: SaleRecord,
		expectedVersion: number
	) => Promise<SaleRecord | "version_conflict">;
	updateSession: (
		record: RegisterSessionRecord,
		expectedVersion: number
	) => Promise<RegisterSessionRecord | "version_conflict">;
}

/**
 * WS3 remediation R1, Finding A: the register's authoritative expected-cash
 * figure — `openingFloatMinor` plus the SIGNED net of every `CashMovement`
 * row posted for this session (`PaidIn` minus `PaidOut`, across every
 * `reasonCode`: paid-in, paid-out, safe-drop, refund, and the cash-sale
 * `"Other"` entries `completeSale` now posts — see its own remediation
 * comment). `closeRegister` and the Finding E fail-closed guard below both
 * read through this one function so they can never diverge on what
 * "expected cash" means.
 */
async function currentExpectedCashMinor(
	repository: PosRepository,
	tenantId: string,
	session: { id: string; openingFloatMinor: number }
): Promise<number> {
	const totals = await repository.netCashMovements(tenantId, session.id);
	return session.openingFloatMinor + totals.paidInMinor - totals.paidOutMinor;
}

/**
 * WS3 remediation R1, Finding E: `schemas/events/commerce.register.closed.v1
 * .schema.json`'s `data.expectedCashMinor` is `{"type": "integer",
 * "minimum": 0}` — a runtime path that could ever compute a negative
 * expected cash would violate that already-frozen schema. Rather than
 * weaken the schema (not authorized) or silently invent a business policy
 * that expected cash may legitimately go negative (also not authorized),
 * this applies the SAME governing pattern
 * `docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md` §10.3
 * already established for a structurally identical prototype-depth gap (no
 * `commerce.cash-variance.reject` deny path): "accepted prototype-depth
 * limit, disclosed not silent," realized here as a fail-closed guard. Every
 * cash-OUT posting (`approveRefund`'s `Refund` movement, and the
 * `commerce.cash-movement.create` command's `PaidOut`-direction movements —
 * `PaidOut`, `SafeDrop`, or `Other` with a `PaidOut` direction) calls this
 * BEFORE writing any ledger row, event, or state change, so the schema's
 * `minimum: 0` is satisfied by construction and stays untouched. See
 * `remediation-dispositions.md` "## E — Negative expected-cash guard".
 */
function requireCashOutWithinExpectedCash(
	expectedCashMinor: number,
	amountOutMinor: number
): void {
	if (expectedCashMinor - amountOutMinor < 0) {
		throw new PosError(
			"insufficient_cash",
			"This cash-out would drive the register's expected cash below zero"
		);
	}
}

// ---------------------------------------------------------------------------
// WS3 PR2: Sale, PriceOverride, Receipt (frozen control plan §4/§6).
//
// Sale lines are stored embedded on the Sale aggregate (a JSONB array), the
// same pattern WS2's `InventoryCountRecord.lines` already uses for an
// aggregate whose child rows never need independent tenant-scoped querying
// — the frozen PR2 contract surface has no "add a line to an existing
// sale" endpoint (CreateSale submits every line up front), so lines only
// ever mutate together with their owning Sale.
// ---------------------------------------------------------------------------

export const SALE_LINE_TAX_CATEGORIES = [
	"GY_STANDARD_14",
	"GY_ZERO_RATED",
	"GY_EXEMPT",
	"GY_OUT_OF_SCOPE",
] as const;
export type SaleLineTaxCategory = (typeof SALE_LINE_TAX_CATEGORIES)[number];

export interface SaleLineRecord {
	discountMinor: number;
	grossMinor: number;
	id: string;
	/** The Inventory `Sale` movement id `sale.complete` posted for this line
	 * (frozen control plan §6.3). Never exposed on `SaleLineView` — it is
	 * purely an internal cross-domain traceability pointer WS3 PR3's Return
	 * compensation uses to satisfy Inventory's `reversalOfMovementId`
	 * CHECK constraint, not a client-facing fact. `null` only ever appears
	 * transiently before `sale.complete` has posted movements (an Open or
	 * Held sale's lines); every Completed sale line has one. */
	inventoryMovementId: string | null;
	lineTotalMinor: number;
	/** Propagated verbatim from `PosTaxPort.calculateLine`'s `TaxLineResult.
	 * nonStatutory` (stage file: "every computed tax line carries a
	 * `prototype_non_statutory: true` style marker per the PR0 contract").
	 * Persisted so a downstream reader of the Sale line never has to trust
	 * an out-of-band claim that the tax figures are prototype-only. */
	nonStatutory: true;
	priceOverrideId: string | null;
	priceOverrideState: ApprovalState | null;
	productId: string;
	productName: string;
	quantity: string;
	taxAmountMinor: number;
	taxableBaseMinor: number;
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPriceMinor: number;
	variantId: string | null;
}

export interface TenderRecord {
	amountMinor: number;
	referenceId: string | null;
	type: "Cash" | "PaymentIntent" | "StoredValue";
}

export interface SaleRecord {
	changeMinor: number | null;
	completedAt: Date | null;
	createdAt: Date;
	createdByActorUserId: string;
	createdByPartyId: string;
	currency: string;
	customerPartyId: string | null;
	discountMinor: number;
	grossMinor: number;
	heldAt: Date | null;
	id: string;
	lines: SaleLineRecord[];
	locationId: string;
	organizationId: string;
	receiptId: string | null;
	registerId: string;
	sessionId: string;
	state: SaleState;
	taxMinor: number;
	tenantId: string;
	tenderedMinor: number | null;
	tendersMinor: TenderRecord[] | null;
	totalMinor: number;
	updatedAt: Date;
	version: number;
}

export interface PriceOverrideRecord {
	approvedAt: Date | null;
	approvedByActorUserId: string | null;
	approvedByPartyId: string | null;
	currency: string;
	id: string;
	lineId: string;
	organizationId: string;
	reason: string;
	requestedAt: Date;
	requestedByActorUserId: string;
	requestedByPartyId: string;
	requestedPriceMinor: number;
	saleId: string;
	state: ApprovalState;
	tenantId: string;
	version: number;
}

export interface ReceiptLineSnapshot {
	discountMinor: number;
	lineTotalMinor: number;
	/** Same prototype-tax marker as `SaleLineRecord.nonStatutory`, snapshotted
	 * onto the immutable receipt so a printed/returned receipt carries the
	 * same disclosure the sale line did. */
	nonStatutory: true;
	productName: string;
	quantity: string;
	taxAmountMinor: number;
	taxableBaseMinor: number;
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPriceMinor: number;
}

export type ReceiptKind = "Sale" | "Return" | "Reissue";

export interface ReceiptRecord {
	cashierPartyId: string;
	createdAt: Date;
	currency: string;
	id: string;
	issuedAt: Date;
	kind: ReceiptKind;
	lines: ReceiptLineSnapshot[];
	organizationId: string;
	originalReceiptId: string | null;
	priceSuppressed: boolean;
	receiptNumber: string;
	registerId: string;
	returnId: string | null;
	saleId: string | null;
	tenantId: string;
	tenders: TenderRecord[];
	totalMinor: number | null;
}

/**
 * WS3's mandated synchronous stock effect (frozen control plan §6.3, "Read
 * first"). `packages/domains/pos` may not import `@meridian/domain-
 * inventory` directly (domains cannot depend on other domains per
 * `registry/architecture-rules.json`); this port is the seam composition
 * (`apps/server/composition`, a registered composition root) fills with an
 * Inventory service instance bound to the SAME transactional `PoolClient`
 * as the sale commit, mirroring the WS2 `createImportReferenceAllocator`
 * numbering pattern rather than the import target's separate-transaction
 * pattern.
 */
export interface SaleInventoryMovementPort {
	recordSaleMovement: (input: {
		actorUserId: string;
		correlationId: string;
		locationId: string;
		organizationId: string;
		productId: string;
		quantity: string;
		saleId: string;
		tenantId: string;
		unit: string;
		variantId: string | null;
	}) => Promise<{ movementId: string } | "negative_stock">;
}

/**
 * The online receipt-numbering path (`platform/numbering`, WS2 PR5),
 * scoped per register so receipt-number monotonicity holds per register
 * under concurrency. HONESTY BOUNDARY (stage packet, Codex packet-review
 * P1-7): the offline-safe allocation path is EXPLICITLY PENDING WS5; this
 * port only ever satisfies the online path.
 */
export interface ReceiptNumberAllocatorPort {
	allocate: (input: {
		actorUserId: string;
		correlationId: string;
		idempotencyKey: string;
		organizationId: string;
		registerId: string;
		saleId: string;
		tenantId: string;
	}) => Promise<{ value: string }>;
}

/**
 * Product name/reference lookup for the sale-line snapshot (stage file:
 * "product ref by opaque ID + captured name/price snapshot at sale time").
 * `packages/domains/pos` may not import `@meridian/domain-catalog`
 * directly for the same cross-domain-import reason as
 * `SaleInventoryMovementPort` above.
 */
export interface PosCatalogPort {
	requireProduct: (input: {
		productId: string;
		tenantId: string;
		variantId?: string | null;
	}) => Promise<{ productName: string }>;
}

/**
 * Local pricing/tax port contracts — NOT an import of
 * `@meridian/engine-pricing`/`@meridian/engine-tax`. `registry/
 * architecture-rules.json`'s `family_grants_are_contract_only` forbids a
 * direct `domains` -> `engines` import edge (checked by
 * `scripts/check_architecture.py`, regardless of the `may_depend_on` list
 * entry); neither engine publishes a separate published-contract package
 * this domain could import instead. These interfaces mirror
 * `PricingEnginePort`/`TaxEnginePort`'s exact shape structurally — the
 * same "domain defines its own local port; composition supplies a
 * conforming adapter" discipline this file already uses for
 * `SaleInventoryMovementPort`, `ReceiptNumberAllocatorPort`, and
 * `PosCatalogPort` above. `apps/server/composition/pos.ts` (a registered
 * composition root, permitted to import both `domains` and `engines`)
 * wires the real `createPricingEngine()`/`createTaxEngine()` instances in;
 * neither engine package ever imports this one.
 */
export interface PosPricingPort {
	priceLine: (input: {
		discountAmount: string | null;
		productId: string;
		quantity: string;
		unitPrice: string;
		variantId: string | null;
	}) => Promise<{
		discountAmount: string;
		grossAmount: string;
		netAmount: string;
	}>;
}
export interface PosTaxPort {
	calculateLine: (input: {
		category: SaleLineTaxCategory;
		inclusive: boolean;
		taxableBase: string;
	}) => Promise<{
		category: SaleLineTaxCategory;
		nonStatutory: true;
		rate: string;
		taxAmount: string;
		taxableBase: string;
	}>;
}

export interface SaleLineView {
	discount: { amountMinor: number; currency: string };
	gross: { amountMinor: number; currency: string };
	id: string;
	lineTotal: { amountMinor: number; currency: string };
	nonStatutory: true;
	priceOverrideId: string | null;
	priceOverrideState: ApprovalState | null;
	productId: string;
	productName: string;
	quantity: string;
	tax: { amountMinor: number; currency: string };
	taxableBase: { amountMinor: number; currency: string };
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPrice: { amountMinor: number; currency: string };
	variantId: string | null;
}

export interface SaleView {
	change: { amountMinor: number; currency: string } | null;
	completedAt: string | null;
	currency: string;
	customerPartyId: string | null;
	discount: { amountMinor: number; currency: string };
	gross: { amountMinor: number; currency: string };
	heldAt: string | null;
	id: string;
	lines: SaleLineView[];
	receiptId: string | null;
	registerId: string;
	sessionId: string;
	state: SaleState;
	tax: { amountMinor: number; currency: string };
	tendered: { amountMinor: number; currency: string } | null;
	total: { amountMinor: number; currency: string };
	version: number;
}

export interface ReceiptLineView {
	discount: { amountMinor: number; currency: string };
	lineTotal: { amountMinor: number; currency: string };
	nonStatutory: true;
	productName: string;
	quantity: string;
	tax: { amountMinor: number; currency: string };
	taxableBase: { amountMinor: number; currency: string };
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPrice: { amountMinor: number; currency: string };
}

export interface ReceiptView {
	cashierPartyId: string;
	currency: string;
	id: string;
	issuedAt: string;
	kind: ReceiptKind;
	lines: ReceiptLineView[];
	originalReceiptId: string | null;
	priceSuppressed: boolean;
	receiptNumber: string;
	registerId: string;
	returnId: string | null;
	saleId: string | null;
	tenders: Array<{
		amount: { amountMinor: number; currency: string };
		referenceId: string | null;
		type: TenderRecord["type"];
	}>;
	total: { amountMinor: number; currency: string } | null;
}

export interface PosSaleTransactionScope extends PosTransactionScope {
	inventory: SaleInventoryMovementPort;
	numbering: ReceiptNumberAllocatorPort;
}
export interface PosSaleUnitOfWork {
	execute: <T>(
		operation: (scope: PosSaleTransactionScope) => Promise<T>
	) => Promise<T>;
}

export type PendingPosEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;
export interface PosEventAppendPort {
	append: (event: PendingPosEvent) => Promise<"inserted" | "duplicate">;
}
export interface PosTransactionScope {
	events: PosEventAppendPort;
	repository: PosRepository;
}
export interface PosUnitOfWork {
	execute: <T>(
		operation: (scope: PosTransactionScope) => Promise<T>
	) => Promise<T>;
}

export interface PosIdFactory {
	create: (
		kind:
			| "deposit"
			| "deposit-custody-transfer"
			| "event"
			| "exchange"
			| "movement"
			| "price-override"
			| "receipt"
			| "refund"
			| "return"
			| "return-line"
			| "sale"
			| "sale-line"
			| "session"
	) => string;
}

export interface PosPartyPort {
	/** Resolves the acting auth user to their canonical Party identity for
	 * the active tenant/organization context. Commerce owns customer stored
	 * value and cash custody facts against Party identity, never the Better
	 * Auth user id, per CLAUDE.md §5/§7. */
	requireActorPartyId: (input: {
		authUserId: string;
		organizationId: string;
		tenantId: string;
	}) => Promise<string>;
}

async function fingerprint(value: unknown): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(JSON.stringify(value))
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function replay<T>(
	repository: PosRepository,
	input: {
		idempotencyKey: string;
		operation: PosCommandOperation;
		requestFingerprint: string;
		tenantId: string;
	}
): Promise<T | null> {
	await repository.acquireCommandLock(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	const receipt = await repository.getCommandReceipt(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	if (!receipt) {
		return null;
	}
	if (receipt.requestFingerprint !== input.requestFingerprint) {
		throw new PosError(
			"idempotency_conflict",
			"Idempotency key is bound to another POS command"
		);
	}
	return receipt.result as T;
}

async function recordResult<T>(
	repository: PosRepository,
	input: {
		idempotencyKey: string;
		operation: PosCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: T,
	now: Date
): Promise<T> {
	const claim = await repository.recordCommandReceipt({
		createdAt: now,
		idempotencyKey: input.idempotencyKey,
		operation: input.operation,
		requestFingerprint: input.requestFingerprint,
		resourceId: input.resourceId,
		result,
		tenantId: input.tenantId,
	});
	if (claim.record.requestFingerprint !== input.requestFingerprint) {
		throw new PosError(
			"idempotency_conflict",
			"Idempotency key is bound to another POS command"
		);
	}
	if (!claim.inserted) {
		throw new Error(
			"POS command identity was claimed after command side effects began"
		);
	}
	return claim.record.result as T;
}

function requireVersion(record: { version: number }, expected: number): void {
	if (record.version !== expected) {
		throw new PosError("version_conflict", "Register session version is stale");
	}
}

function money(currency: string, amountMinor: number | null) {
	return amountMinor === null ? null : { amountMinor, currency };
}

// ---------------------------------------------------------------------------
// WS3 PR2: Sale, PriceOverride, Receipt helpers.
// ---------------------------------------------------------------------------

const SALE_MONEY_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)\.[0-9]{2}$/;
const SALE_MONEY_SCALE = 100n;
const SALE_QUANTITY_PATTERN =
	/^(?!0(?:\.0{1,6})?$)(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;

/** Converts an integer minor-unit money amount to the two-decimal-place
 * decimal string `@meridian/engine-pricing`/`@meridian/engine-tax` require
 * at their port boundary — CLAUDE.md §7 exact-decimal money end to end,
 * never binary floating point. */
function moneyMinorToDecimal(amountMinor: number): string {
	const value = BigInt(amountMinor);
	const whole = value / SALE_MONEY_SCALE;
	const fraction = (value % SALE_MONEY_SCALE).toString().padStart(2, "0");
	return `${whole}.${fraction}`;
}

function decimalToMoneyMinor(value: string, field: string): number {
	if (!SALE_MONEY_DECIMAL_PATTERN.test(value)) {
		throw new PosError(
			"validation",
			`${field} must be a non-negative decimal with exactly two places`
		);
	}
	const [whole = "0", fraction = "00"] = value.split(".");
	const minor = BigInt(whole) * SALE_MONEY_SCALE + BigInt(fraction);
	return Number(minor);
}

function requireSaleQuantity(value: string): void {
	if (!SALE_QUANTITY_PATTERN.test(value)) {
		throw new PosError(
			"validation",
			"Sale line quantity must be a positive decimal with at most six places"
		);
	}
}

function saleView(record: SaleRecord): SaleView {
	return {
		change: money(record.currency, record.changeMinor),
		completedAt: record.completedAt?.toISOString() ?? null,
		currency: record.currency,
		customerPartyId: record.customerPartyId,
		discount: { amountMinor: record.discountMinor, currency: record.currency },
		gross: { amountMinor: record.grossMinor, currency: record.currency },
		heldAt: record.heldAt?.toISOString() ?? null,
		id: record.id,
		lines: record.lines.map((line) => ({
			discount: { amountMinor: line.discountMinor, currency: record.currency },
			gross: { amountMinor: line.grossMinor, currency: record.currency },
			id: line.id,
			lineTotal: {
				amountMinor: line.lineTotalMinor,
				currency: record.currency,
			},
			nonStatutory: line.nonStatutory,
			priceOverrideId: line.priceOverrideId,
			priceOverrideState: line.priceOverrideState,
			productId: line.productId,
			productName: line.productName,
			quantity: line.quantity,
			tax: { amountMinor: line.taxAmountMinor, currency: record.currency },
			taxableBase: {
				amountMinor: line.taxableBaseMinor,
				currency: record.currency,
			},
			taxCategory: line.taxCategory,
			unit: line.unit,
			unitPrice: {
				amountMinor: line.unitPriceMinor,
				currency: record.currency,
			},
			variantId: line.variantId,
		})),
		receiptId: record.receiptId,
		registerId: record.registerId,
		sessionId: record.sessionId,
		state: record.state,
		tax: { amountMinor: record.taxMinor, currency: record.currency },
		tendered: money(record.currency, record.tenderedMinor),
		total: { amountMinor: record.totalMinor, currency: record.currency },
		version: record.version,
	};
}

function receiptView(record: ReceiptRecord): ReceiptView {
	return {
		cashierPartyId: record.cashierPartyId,
		currency: record.currency,
		id: record.id,
		issuedAt: record.issuedAt.toISOString(),
		kind: record.kind,
		lines: record.lines.map((line) => ({
			discount: { amountMinor: line.discountMinor, currency: record.currency },
			lineTotal: {
				amountMinor: line.lineTotalMinor,
				currency: record.currency,
			},
			nonStatutory: line.nonStatutory,
			productName: line.productName,
			quantity: line.quantity,
			tax: { amountMinor: line.taxAmountMinor, currency: record.currency },
			taxableBase: {
				amountMinor: line.taxableBaseMinor,
				currency: record.currency,
			},
			taxCategory: line.taxCategory,
			unit: line.unit,
			unitPrice: {
				amountMinor: line.unitPriceMinor,
				currency: record.currency,
			},
		})),
		originalReceiptId: record.originalReceiptId,
		priceSuppressed: record.priceSuppressed,
		receiptNumber: record.receiptNumber,
		registerId: record.registerId,
		returnId: record.returnId,
		saleId: record.saleId,
		tenders: record.tenders.map((tender) => ({
			amount: { amountMinor: tender.amountMinor, currency: record.currency },
			referenceId: tender.referenceId,
			type: tender.type,
		})),
		total: money(record.currency, record.totalMinor),
	};
}

function saleEvent(input: {
	actorUserId: string;
	aggregateId: string;
	capabilityId:
		| "commerce.exchanges"
		| "commerce.order-management"
		| "commerce.receipts"
		| "commerce.refunds"
		| "commerce.returns";
	correlationId: string;
	data: Record<string, unknown>;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	schemaRef: string;
	tenantId: string;
}): PendingPosEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: input.capabilityId,
		classification: "Confidential",
		correlationId: input.correlationId,
		data: input.data,
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "commerce",
		purpose: "tenant-sale-and-receipt-operations",
		retentionClass: "commerce-sale-event",
		schemaRef: input.schemaRef,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

function registerSessionView(
	record: RegisterSessionRecord
): RegisterSessionView {
	return {
		closedAt: record.closedAt?.toISOString() ?? null,
		closeReason: record.closeReason,
		countedCash: money(record.currency, record.countedCashMinor),
		currency: record.currency,
		expectedCash: money(record.currency, record.expectedCashMinor),
		id: record.id,
		locationId: record.locationId,
		openedAt: record.openedAt.toISOString(),
		openerPartyId: record.openedByPartyId,
		openingFloat: {
			amountMinor: record.openingFloatMinor,
			currency: record.currency,
		},
		registerId: record.registerId,
		state: record.state,
		variance: money(record.currency, record.varianceMinor),
		varianceApprovalRequired: record.varianceApprovalRequired,
		varianceApprovedAt: record.varianceApprovedAt?.toISOString() ?? null,
		varianceApproverPartyId: record.varianceApprovedByPartyId,
		version: record.version,
	};
}

function cashMovementView(record: CashMovementRecord): CashMovementView {
	return {
		amount: { amountMinor: record.amountMinor, currency: record.currency },
		createdAt: record.createdAt.toISOString(),
		direction: record.direction,
		id: record.id,
		note: record.note,
		reasonCode: record.reasonCode,
		referenceId: record.referenceId,
		registerId: record.registerId,
		sessionId: record.sessionId,
	};
}

function event(input: {
	actorUserId: string;
	aggregateId: string;
	capabilityId: "commerce.cash-management" | "commerce.register-management";
	correlationId: string;
	data: Record<string, unknown>;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	schemaRef: string;
	tenantId: string;
}): PendingPosEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: input.capabilityId,
		classification: "Confidential",
		correlationId: input.correlationId,
		data: input.data,
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "commerce",
		purpose: "tenant-cash-custody-operations",
		retentionClass: "commerce-cash-custody-event",
		schemaRef: input.schemaRef,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

/** Extracted from `completeSale` to keep its cognitive complexity within
 * budget: at least one tender, Cash only (PaymentIntent/StoredValue are
 * WS4/WS6 — "reject politely at the boundary" per the stage file), each a
 * non-negative minor-unit amount. */
function requireCashOnlyTenders(
	tenders: Array<{ amountMinor: number; type: string }>
): void {
	if (tenders.length === 0) {
		throw new PosError(
			"validation",
			"Sale completion requires at least one tender"
		);
	}
	for (const tender of tenders) {
		if (tender.type !== "Cash") {
			throw new PosError(
				"validation",
				"Only Cash tender is implemented at this stage; PaymentIntent and StoredValue tenders are WS4/WS6 scope"
			);
		}
		requireNonNegativeMinor(tender.amountMinor, "tender.amountMinor");
	}
}

function requireMatchingTenderCurrencies(
	currency: string,
	tenders: Array<{ currency: string }>
): void {
	for (const tender of tenders) {
		requireMatchingCurrency(currency, tender.currency);
	}
}

/** Loads and validates a Sale is completable: exists, not already
 * Completed, its register session is still Open (custody link — stage
 * file: "sale completes ONLY against an open register session"), and no
 * line carries a Pending price override (frozen control plan §6.2). */
async function requireCompletableSale(
	repository: PosRepository,
	tenantId: string,
	organizationId: string,
	saleId: string,
	locationId?: string
): Promise<SaleRecord> {
	const sale = await repository.getSale(
		tenantId,
		organizationId,
		saleId,
		locationId
	);
	if (!sale) {
		throw new PosError("not_found", "Sale was not found");
	}
	if (sale.state === "Completed") {
		throw new PosError("invalid_state", "Sale is already completed");
	}
	const session = await repository.getOpenSession(
		tenantId,
		organizationId,
		sale.registerId,
		locationId
	);
	if (!session || session.id !== sale.sessionId) {
		throw new PosError(
			"invalid_state",
			"Sale completion requires its register session to still be open"
		);
	}
	const pendingOverrides = await repository.countPendingPriceOverrides(
		tenantId,
		saleId
	);
	if (pendingOverrides > 0) {
		throw new PosError(
			"invalid_state",
			"Sale cannot complete while a price override is pending approval"
		);
	}
	return sale;
}

/** Prices and taxes one sale line: `unitPrice x quantity` minus any
 * declared per-line discount (`engine.pricing`), then the exclusive
 * formula from the Guyana prototype tax pack (`engine.tax`). Extracted so
 * `createSale` can price every line concurrently via `Promise.all` — the
 * lines are independent of one another (no shared mutable state), unlike
 * `postSaleLineMovements`'s single-PoolClient sequential requirement. */
async function priceSaleLine(
	options: Pick<PosServiceOptions, "ids" | "pricing" | "products" | "tax">,
	tenantId: string,
	lineInput: {
		discountAmount?: { amountMinor: number; currency: string } | null;
		productId: string;
		quantity: string;
		taxCategory?: SaleLineTaxCategory;
		unit: string;
		unitPrice: { amountMinor: number; currency: string };
		variantId?: string | null;
	}
): Promise<SaleLineRecord> {
	const product = await options.products.requireProduct({
		productId: lineInput.productId,
		tenantId,
		variantId: lineInput.variantId ?? null,
	});
	const priced = await options.pricing.priceLine({
		discountAmount: lineInput.discountAmount
			? moneyMinorToDecimal(lineInput.discountAmount.amountMinor)
			: null,
		productId: lineInput.productId,
		quantity: lineInput.quantity,
		unitPrice: moneyMinorToDecimal(lineInput.unitPrice.amountMinor),
		variantId: lineInput.variantId ?? null,
	});
	const taxCategory = lineInput.taxCategory ?? "GY_STANDARD_14";
	const taxed = await options.tax.calculateLine({
		category: taxCategory,
		inclusive: false,
		taxableBase: priced.netAmount,
	});
	const taxableBaseMinor = decimalToMoneyMinor(
		taxed.taxableBase,
		"taxableBase"
	);
	const taxAmountMinor = decimalToMoneyMinor(taxed.taxAmount, "taxAmount");
	return {
		discountMinor: decimalToMoneyMinor(priced.discountAmount, "discountAmount"),
		grossMinor: decimalToMoneyMinor(priced.grossAmount, "grossAmount"),
		id: options.ids.create("sale-line"),
		inventoryMovementId: null,
		lineTotalMinor: taxableBaseMinor + taxAmountMinor,
		nonStatutory: taxed.nonStatutory,
		priceOverrideId: null,
		priceOverrideState: null,
		productId: lineInput.productId,
		productName: product.productName,
		quantity: lineInput.quantity,
		taxAmountMinor,
		taxableBaseMinor,
		taxCategory,
		unit: lineInput.unit,
		unitPriceMinor: lineInput.unitPrice.amountMinor,
		variantId: lineInput.variantId ?? null,
	};
}

/** Recomputes one sale line at the price a price-override approval just
 * granted, through the same pricing/tax engines `createSale` uses, so an
 * override never bypasses the tax pack's formulas. */
async function computeOverriddenLine(
	options: Pick<PosServiceOptions, "pricing" | "tax">,
	line: SaleLineRecord,
	requestedPriceMinor: number
): Promise<SaleLineRecord> {
	const priced = await options.pricing.priceLine({
		discountAmount:
			line.discountMinor > 0 ? moneyMinorToDecimal(line.discountMinor) : null,
		productId: line.productId,
		quantity: line.quantity,
		unitPrice: moneyMinorToDecimal(requestedPriceMinor),
		variantId: line.variantId,
	});
	const taxed = await options.tax.calculateLine({
		category: line.taxCategory,
		inclusive: false,
		taxableBase: priced.netAmount,
	});
	const taxableBaseMinor = decimalToMoneyMinor(
		taxed.taxableBase,
		"taxableBase"
	);
	const taxAmountMinor = decimalToMoneyMinor(taxed.taxAmount, "taxAmount");
	return {
		...line,
		discountMinor: decimalToMoneyMinor(priced.discountAmount, "discountAmount"),
		grossMinor: decimalToMoneyMinor(priced.grossAmount, "grossAmount"),
		lineTotalMinor: taxableBaseMinor + taxAmountMinor,
		nonStatutory: taxed.nonStatutory,
		priceOverrideState: "Approved",
		taxAmountMinor,
		taxableBaseMinor,
		unitPriceMinor: requestedPriceMinor,
	};
}

/** Replaces one line on a Sale and resums the sale-level totals from every
 * line. Resume after hold is not a distinct permission (frozen control
 * plan §6.2): any authorized mutation on a Held sale implicitly returns it
 * to Open in the same operation. */
function applySaleLineUpdate(
	sale: SaleRecord,
	updatedLine: SaleLineRecord,
	now: Date
): SaleRecord {
	const updatedLines = sale.lines.map((candidate) =>
		candidate.id === updatedLine.id ? updatedLine : candidate
	);
	return {
		...sale,
		discountMinor: updatedLines.reduce(
			(sum, candidate) => sum + candidate.discountMinor,
			0
		),
		grossMinor: updatedLines.reduce(
			(sum, candidate) => sum + candidate.grossMinor,
			0
		),
		lines: updatedLines,
		state: sale.state === "Held" ? "Open" : sale.state,
		taxMinor: updatedLines.reduce(
			(sum, candidate) => sum + candidate.taxAmountMinor,
			0
		),
		totalMinor: updatedLines.reduce(
			(sum, candidate) => sum + candidate.lineTotalMinor,
			0
		),
		updatedAt: now,
		version: sale.version + 1,
	};
}

/** Loads and validates a Pending price override before it may be approved:
 * exists and belongs to the named sale, is still Pending, the approver
 * differs from the requester (self-approval denial, frozen control plan
 * §6), the sale is not yet Completed, and its target line still exists.
 *
 * WS3 remediation R2, Finding C: the separation check resolves BOTH sides
 * through canonical Party identity, never the Better Auth `actorUserId` —
 * the maker's Party is already persisted (`requestedByPartyId`), and the
 * approver's Party is resolved here (or safely denied via
 * `PosError("invalid_reference", ...)` on a missing/ambiguous mapping)
 * BEFORE the comparison runs, so two different auth accounts linked to the
 * SAME Party are still denied self-approval. Returns the resolved
 * `approverPartyId` so the caller does not re-resolve it. */
async function requireApprovableOverride(
	repository: PosRepository,
	parties: PosPartyPort,
	tenantId: string,
	organizationId: string,
	saleId: string,
	overrideId: string,
	actorUserId: string,
	locationId?: string
): Promise<{
	approverPartyId: string;
	line: SaleLineRecord;
	override: PriceOverrideRecord;
	sale: SaleRecord;
}> {
	const override = await repository.getPriceOverride(
		tenantId,
		organizationId,
		overrideId
	);
	if (!override || override.saleId !== saleId) {
		throw new PosError("not_found", "Price override was not found");
	}
	if (override.state !== "Pending") {
		throw new PosError(
			"invalid_state",
			"Only a Pending price override can be approved"
		);
	}
	const approverPartyId = await parties.requireActorPartyId({
		authUserId: actorUserId,
		organizationId,
		tenantId,
	});
	if (override.requestedByPartyId === approverPartyId) {
		throw new PosError(
			"approval_separation",
			"The requester cannot approve their own price override"
		);
	}
	const sale = await repository.getSale(
		tenantId,
		organizationId,
		saleId,
		locationId
	);
	if (!sale) {
		throw new PosError("not_found", "Sale was not found");
	}
	if (sale.state === "Completed") {
		throw new PosError(
			"invalid_state",
			"A completed sale cannot receive a price override"
		);
	}
	const line = sale.lines.find((candidate) => candidate.id === override.lineId);
	if (!line) {
		throw new PosError("invalid_reference", "Sale line was not found");
	}
	return { approverPartyId, line, override, sale };
}

/** Posts one synchronous Inventory `Sale` movement per line, inside the
 * sale's own shared transaction (frozen control plan §6.3). Deliberately
 * sequential, not `Promise.all`: every call shares the sale's single
 * transactional `PoolClient`, and node-postgres does not support
 * concurrent queries on one client. Returns the sale's lines with
 * `inventoryMovementId` populated from each posted movement — WS3 PR3
 * needs this traceability to satisfy Inventory's own
 * `inventory_stock_movement_reversal_check` CHECK constraint (a `Reversal`
 * movement REQUIRES a non-null `reversalOfMovementId`), so a Return's
 * compensating movement can reference exactly the Sale movement it
 * reverses instead of inventing an untraceable one. */
async function postSaleLineMovements(
	inventory: SaleInventoryMovementPort,
	sale: SaleRecord,
	actorUserId: string,
	correlationId: string
): Promise<SaleLineRecord[]> {
	const updatedLines: SaleLineRecord[] = [];
	for (const line of sale.lines) {
		// biome-ignore lint/performance/noAwaitInLoops: sequential by necessity — see doc comment above.
		const movement = await inventory.recordSaleMovement({
			actorUserId,
			correlationId,
			locationId: sale.locationId,
			organizationId: sale.organizationId,
			productId: line.productId,
			quantity: line.quantity,
			saleId: sale.id,
			tenantId: sale.tenantId,
			unit: line.unit,
			variantId: line.variantId,
		});
		if (movement === "negative_stock") {
			throw new PosError(
				"negative_stock",
				`Insufficient stock for product ${line.productId}`
			);
		}
		updatedLines.push({ ...line, inventoryMovementId: movement.movementId });
	}
	return updatedLines;
}

// ---------------------------------------------------------------------------
// WS3 PR3: Return, Refund, Void, Reissue, Exchange (frozen control plan
// §6.3-§6.5). Return posts the INVENTORY compensation only; Refund posts
// the CASH compensation only (§6.3: "this keeps the two maker/checker pairs
// from conflating an inventory approval with a cash approval"). Void is a
// same-day/open-session administrative reversal realized as a full Return
// with its own permission (`commerce.receipt.void`) and no maker/checker
// separation — it is `mode: "Void"` on the SAME `ReturnRecord` shape, never
// a distinct aggregate (the frozen `commerce.return.completed.v1` event
// schema's `mode` enum already anticipates this). Exchange is not a
// create/approve pair of its own (§6.5): it is realized by `completeSale`
// accepting an optional `exchangeOfReturnId`, once the compensating Return
// leg is already `Completed`. Gift receipt (`commerce.gift-receipts`) is
// realized as `reissueReceipt`'s `priceSuppressed: true` variant, not a
// separate command.
// ---------------------------------------------------------------------------

export const RETURN_STATES = ["Pending", "Completed"] as const;
export type ReturnState = (typeof RETURN_STATES)[number];

export const RETURN_MODES = ["Return", "Void"] as const;
export type ReturnMode = (typeof RETURN_MODES)[number];

export const REFUND_STATES = ["Requested", "Posted"] as const;
export type RefundState = (typeof REFUND_STATES)[number];

/**
 * Deposit lifecycle (WS3 PR4, frozen control plan §6.6): `deposit.create`
 * is EFFECT-FREE preparation — it reserves `countedAmount` against the
 * available safe custody carried by `sourceShiftIds` (register sessions
 * whose `SafeDrop` cash movements fund the deposit), but posts no custody
 * transfer. Only `deposit.confirm`, by an actor other than the preparer,
 * posts the safe->bank custody transfer (a dedicated
 * `pos_deposit_custody_transfer` row, never present before confirmation —
 * see `PosRepository.createDepositCustodyTransfer`). A Deposit is a
 * custody RECORD, not a payment rail: no provider interaction of any kind
 * (WS6/facilitation-custody remain permanently out of scope).
 */
export const DEPOSIT_STATES = ["Prepared", "Reconciled"] as const;
export type DepositState = (typeof DEPOSIT_STATES)[number];

export interface ReturnLineRecord {
	discountMinor: number;
	grossMinor: number;
	id: string;
	lineTotalMinor: number;
	nonStatutory: true;
	productId: string;
	productName: string;
	quantity: string;
	saleLineId: string;
	taxAmountMinor: number;
	taxableBaseMinor: number;
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPriceMinor: number;
	variantId: string | null;
}

export interface ReturnRecord {
	approvedAt: Date | null;
	approvedByActorUserId: string | null;
	approvedByPartyId: string | null;
	createdAt: Date;
	createdByActorUserId: string;
	createdByPartyId: string;
	currency: string;
	/** Set only once this Return has been consumed as the compensating leg
	 * of an Exchange (frozen control plan §6.5), by `sale.complete`'s
	 * `exchangeOfReturnId` input — never by `return.approve` itself, since
	 * the replacement sale does not exist yet at that point. Purely an
	 * internal idempotency/cross-link fact; it is NOT mirrored onto the
	 * already-emitted `commerce.return.completed.v1` event (see
	 * `completeSale`'s exchange-linking comment for the full disposition of
	 * why `mode`/`exchangeSaleId` stay `"Return"`/`null` on that event). */
	exchangeSaleId: string | null;
	id: string;
	lines: ReturnLineRecord[];
	mode: ReturnMode;
	organizationId: string;
	reason: string;
	receiptId: string | null;
	registerId: string;
	saleId: string;
	state: ReturnState;
	tenantId: string;
	totalRefundableMinor: number;
	updatedAt: Date;
	version: number;
}

export interface RefundRecord {
	amountMinor: number;
	approvedAt: Date | null;
	approvedByActorUserId: string | null;
	approvedByPartyId: string | null;
	cashMovementId: string | null;
	createdAt: Date;
	currency: string;
	id: string;
	organizationId: string;
	registerId: string;
	requestedAt: Date;
	requestedByActorUserId: string;
	requestedByPartyId: string;
	returnId: string;
	state: RefundState;
	tenantId: string;
	updatedAt: Date;
	version: number;
}

/**
 * `DepositRecord` is the Deposit maker/checker aggregate (WS3 PR4, frozen
 * control plan §6.6). `sourceShiftIds` names the register sessions whose
 * `SafeDrop` cash movements fund this deposit's custody reservation —
 * `deposit.create` never accepts a caller-supplied register or safe
 * identifier beyond this list, structurally tying every deposit back to
 * traceable register provenance. `depositReference` is a human-facing
 * reference number allocated through `platform/numbering` (organization-
 * scoped, distinct from the opaque `id`), separate per CLAUDE.md §7
 * ("opaque internal identifiers separately from human references").
 */
export interface DepositRecord {
	amountMinor: number;
	confirmedAt: Date | null;
	confirmedByActorUserId: string | null;
	confirmedByPartyId: string | null;
	createdAt: Date;
	currency: string;
	depositReference: string;
	id: string;
	organizationId: string;
	preparedAt: Date;
	preparedByActorUserId: string;
	preparedByPartyId: string;
	sourceShiftIds: string[];
	state: DepositState;
	tenantId: string;
	updatedAt: Date;
	version: number;
}

export interface DepositView {
	amount: { amountMinor: number; currency: string };
	confirmedAt: string | null;
	confirmerPartyId: string | null;
	depositReference: string;
	id: string;
	preparedAt: string;
	preparerPartyId: string;
	sourceShiftIds: string[];
	state: DepositState;
	version: number;
}

/** WS3 remediation R3b, Item 7 (server-backed discovery). */
export interface PriceOverrideView {
	approvedAt: string | null;
	id: string;
	lineId: string;
	reason: string;
	requestedAt: string;
	requestedPrice: { amountMinor: number; currency: string };
	saleId: string;
	state: PriceOverrideRecord["state"];
	version: number;
}

function priceOverrideView(record: PriceOverrideRecord): PriceOverrideView {
	return {
		approvedAt: record.approvedAt?.toISOString() ?? null,
		id: record.id,
		lineId: record.lineId,
		reason: record.reason,
		requestedAt: record.requestedAt.toISOString(),
		requestedPrice: {
			amountMinor: record.requestedPriceMinor,
			currency: record.currency,
		},
		saleId: record.saleId,
		state: record.state,
		version: record.version,
	};
}

export interface ReturnLineView {
	discount: { amountMinor: number; currency: string };
	gross: { amountMinor: number; currency: string };
	id: string;
	lineTotal: { amountMinor: number; currency: string };
	nonStatutory: true;
	productId: string;
	productName: string;
	quantity: string;
	saleLineId: string;
	tax: { amountMinor: number; currency: string };
	taxableBase: { amountMinor: number; currency: string };
	taxCategory: SaleLineTaxCategory;
	unit: string;
	unitPrice: { amountMinor: number; currency: string };
	variantId: string | null;
}

export interface ReturnView {
	approvedAt: string | null;
	createdAt: string;
	currency: string;
	exchangeSaleId: string | null;
	id: string;
	lines: ReturnLineView[];
	mode: ReturnMode;
	reason: string;
	receiptId: string | null;
	registerId: string;
	saleId: string;
	state: ReturnState;
	totalRefundable: { amountMinor: number; currency: string };
	version: number;
}

export interface RefundView {
	amount: { amountMinor: number; currency: string };
	approvedAt: string | null;
	cashMovementId: string | null;
	id: string;
	registerId: string;
	requestedAt: string;
	returnId: string;
	state: RefundState;
	version: number;
}

/**
 * WS3 PR3's compensating stock effect (frozen control plan §6.3, "Read
 * first" — "via the same Inventory contract path PR2 chose"). Mirrors
 * `SaleInventoryMovementPort` exactly: composition binds an Inventory
 * service instance to the SAME transactional `PoolClient` as the return's
 * own unit of work. Unlike `recordSaleMovement`, this can never observe
 * `"negative_stock"` (the posted quantity always adds stock back IN), so
 * the port has no failure variant to thread through.
 */
export interface ReturnInventoryMovementPort {
	recordReturnMovement: (input: {
		actorUserId: string;
		correlationId: string;
		locationId: string;
		organizationId: string;
		productId: string;
		quantity: string;
		/** The ORIGINAL Sale movement this compensates — required by
		 * Inventory's own `inventory_stock_movement_reversal_check` CHECK
		 * constraint on `movementType = 'Reversal'`. Sourced from
		 * `SaleLineRecord.inventoryMovementId`. */
		reversalOfMovementId: string;
		returnId: string;
		tenantId: string;
		unit: string;
		variantId: string | null;
	}) => Promise<{ movementId: string }>;
}

export interface PosReturnTransactionScope extends PosTransactionScope {
	inventory: ReturnInventoryMovementPort;
	numbering: ReceiptNumberAllocatorPort;
}
export interface PosReturnUnitOfWork {
	execute: <T>(
		operation: (scope: PosReturnTransactionScope) => Promise<T>
	) => Promise<T>;
}

/**
 * The Deposit human-reference allocation path (WS3 PR4). Scoped per
 * ORGANIZATION (not per register, unlike `ReceiptNumberAllocatorPort`) —
 * a deposit draws safe custody from a set of register sessions, not one
 * register, so the reference sequence is organization-wide.
 */
export interface DepositReferenceAllocatorPort {
	allocate: (input: {
		actorUserId: string;
		correlationId: string;
		depositId: string;
		idempotencyKey: string;
		organizationId: string;
		tenantId: string;
	}) => Promise<{ value: string }>;
}

export interface PosDepositTransactionScope extends PosTransactionScope {
	numbering: DepositReferenceAllocatorPort;
}
export interface PosDepositUnitOfWork {
	execute: <T>(
		operation: (scope: PosDepositTransactionScope) => Promise<T>
	) => Promise<T>;
}

function returnView(record: ReturnRecord): ReturnView {
	return {
		approvedAt: record.approvedAt?.toISOString() ?? null,
		createdAt: record.createdAt.toISOString(),
		currency: record.currency,
		exchangeSaleId: record.exchangeSaleId,
		id: record.id,
		lines: record.lines.map((line) => ({
			discount: { amountMinor: line.discountMinor, currency: record.currency },
			gross: { amountMinor: line.grossMinor, currency: record.currency },
			id: line.id,
			lineTotal: {
				amountMinor: line.lineTotalMinor,
				currency: record.currency,
			},
			nonStatutory: line.nonStatutory,
			productId: line.productId,
			productName: line.productName,
			quantity: line.quantity,
			saleLineId: line.saleLineId,
			tax: { amountMinor: line.taxAmountMinor, currency: record.currency },
			taxableBase: {
				amountMinor: line.taxableBaseMinor,
				currency: record.currency,
			},
			taxCategory: line.taxCategory,
			unit: line.unit,
			unitPrice: {
				amountMinor: line.unitPriceMinor,
				currency: record.currency,
			},
			variantId: line.variantId,
		})),
		mode: record.mode,
		reason: record.reason,
		receiptId: record.receiptId,
		registerId: record.registerId,
		saleId: record.saleId,
		state: record.state,
		totalRefundable: {
			amountMinor: record.totalRefundableMinor,
			currency: record.currency,
		},
		version: record.version,
	};
}

function refundView(record: RefundRecord): RefundView {
	return {
		amount: { amountMinor: record.amountMinor, currency: record.currency },
		approvedAt: record.approvedAt?.toISOString() ?? null,
		cashMovementId: record.cashMovementId,
		id: record.id,
		registerId: record.registerId,
		requestedAt: record.requestedAt.toISOString(),
		returnId: record.returnId,
		state: record.state,
		version: record.version,
	};
}

function depositView(record: DepositRecord): DepositView {
	return {
		amount: { amountMinor: record.amountMinor, currency: record.currency },
		confirmedAt: record.confirmedAt?.toISOString() ?? null,
		confirmerPartyId: record.confirmedByPartyId,
		depositReference: record.depositReference,
		id: record.id,
		preparedAt: record.preparedAt.toISOString(),
		preparerPartyId: record.preparedByPartyId,
		sourceShiftIds: record.sourceShiftIds,
		state: record.state,
		version: record.version,
	};
}

const RETURN_QUANTITY_SCALE = 1_000_000n;
const RETURN_QUANTITY_TRAILING_ZERO_PATTERN = /0+$/;

/** Converts a Sale-line quantity decimal string into the same fixed-point
 * scale `@meridian/domain-inventory`'s `quantityToMinor` uses, purely so
 * this local proportion helper can do exact integer arithmetic — NOT an
 * import of that function. `packages/domains/pos` may not import
 * `@meridian/domain-inventory` (a `domains -> domains` cross-package
 * import is as forbidden as the `domains -> engines` edge this file's
 * `PosPricingPort`/`PosTaxPort` doc comment already documents). */
function returnQuantityToScaled(value: string): bigint {
	const [whole = "0", fraction = ""] = value.split(".");
	return (
		BigInt(whole) * RETURN_QUANTITY_SCALE + BigInt(fraction.padEnd(6, "0"))
	);
}

function scaledToReturnQuantity(value: bigint): string {
	const whole = value / RETURN_QUANTITY_SCALE;
	const fraction = (value % RETURN_QUANTITY_SCALE)
		.toString()
		.padStart(6, "0")
		.replace(RETURN_QUANTITY_TRAILING_ZERO_PATTERN, "");
	return `${whole}${fraction ? `.${fraction}` : ""}`;
}

/** Rounds `originalAmountMinor * partScaled / wholeScaled` half-up on
 * integer minor units (matching this file's other money arithmetic).
 * Scaled-bigint building block for `proportionalMinor` — never called on
 * its own with an independently-chosen `partScaled`, because rounding a
 * fresh fraction on every call is exactly the defect `proportionalMinor`'s
 * doc comment explains. */
function roundedShareMinor(
	originalAmountMinor: number,
	partScaled: bigint,
	wholeScaled: bigint
): number {
	if (wholeScaled === 0n) {
		return 0;
	}
	const numerator = BigInt(originalAmountMinor) * partScaled;
	return Number((numerator + wholeScaled / 2n) / wholeScaled);
}

/** Prices one returned line's INCREMENT of the ORIGINAL sale line's amount:
 * the delta between the cumulative proportional share owed at
 * `priorReturnedQuantity + returnedQuantity` and the share already
 * attributed to `priorReturnedQuantity` — never an independently-rounded
 * fraction of `returnedQuantity` alone. A return never re-runs
 * `engine.pricing`/`engine.tax`, it apportions the already-locked
 * sale-line amounts.
 *
 * This is deliberately NOT `roundedShareMinor(originalAmountMinor,
 * returnedQuantity, originalQuantity)`: rounding each partial return's own
 * slice independently lets round-half-up systematically overstate or
 * understate the total across a SEQUENCE of separate partial returns on
 * the same line (e.g. three independent 1-of-3 returns on a 100-minor-unit
 * line round to 33 each, refunding 99 total — one minor unit permanently
 * unaccounted for, even though a single return of all 3 units at once
 * apportions to exactly 100). Pricing the cumulative running total instead
 * and taking the delta against what prior returns on this line already
 * consumed makes every sequence of partial returns telescope back to
 * `roundedShareMinor(originalAmountMinor, totalReturnedQuantity,
 * originalQuantity)` regardless of how it was split across calls — in
 * particular, once a line's returns collectively reach its full original
 * quantity, `partScaled === wholeScaled` and the sum of every partial
 * return's amount equals `originalAmountMinor` exactly, no rounding
 * remainder lost or invented. */
function proportionalMinor(
	originalAmountMinor: number,
	priorReturnedQuantity: string,
	returnedQuantity: string,
	originalQuantity: string
): number {
	const whole = returnQuantityToScaled(originalQuantity);
	const priorScaled = returnQuantityToScaled(priorReturnedQuantity);
	const cumulativeScaled =
		priorScaled + returnQuantityToScaled(returnedQuantity);
	const priorShare = roundedShareMinor(originalAmountMinor, priorScaled, whole);
	const cumulativeShare = roundedShareMinor(
		originalAmountMinor,
		cumulativeScaled,
		whole
	);
	return cumulativeShare - priorShare;
}

function priceReturnLine(
	saleLine: SaleLineRecord,
	priorReturnedQuantity: string,
	returnedQuantity: string,
	ids: PosIdFactory
): ReturnLineRecord {
	return {
		discountMinor: proportionalMinor(
			saleLine.discountMinor,
			priorReturnedQuantity,
			returnedQuantity,
			saleLine.quantity
		),
		grossMinor: proportionalMinor(
			saleLine.grossMinor,
			priorReturnedQuantity,
			returnedQuantity,
			saleLine.quantity
		),
		id: ids.create("return-line"),
		lineTotalMinor: proportionalMinor(
			saleLine.lineTotalMinor,
			priorReturnedQuantity,
			returnedQuantity,
			saleLine.quantity
		),
		nonStatutory: true,
		productId: saleLine.productId,
		productName: saleLine.productName,
		quantity: returnedQuantity,
		saleLineId: saleLine.id,
		taxAmountMinor: proportionalMinor(
			saleLine.taxAmountMinor,
			priorReturnedQuantity,
			returnedQuantity,
			saleLine.quantity
		),
		taxableBaseMinor: proportionalMinor(
			saleLine.taxableBaseMinor,
			priorReturnedQuantity,
			returnedQuantity,
			saleLine.quantity
		),
		taxCategory: saleLine.taxCategory,
		unit: saleLine.unit,
		unitPriceMinor: saleLine.unitPriceMinor,
		variantId: saleLine.variantId,
	};
}

/** How much of one Sale line remains unreturned, cumulative across every
 * prior `Pending`/`Completed` return (see `PosRepository.sumReturnedQuantity`'s
 * doc comment for the concurrency discipline this depends on). Returns
 * `"0"` (never negative) once fully returned. */
async function remainingReturnableQuantity(
	repository: PosRepository,
	tenantId: string,
	saleLine: SaleLineRecord
): Promise<string> {
	const priorReturned = await repository.sumReturnedQuantity(
		tenantId,
		saleLine.id
	);
	const remainingScaled =
		returnQuantityToScaled(saleLine.quantity) -
		returnQuantityToScaled(priorReturned);
	return remainingScaled > 0n ? scaledToReturnQuantity(remainingScaled) : "0";
}

/** Validates and prices every requested line for a NEW return, cumulative
 * against every prior return (`Pending` or `Completed`) on the SAME sale
 * line. Callers MUST already hold the owning Sale row's lock (`getSale`'s
 * `SELECT ... FOR UPDATE`) — see `PosRepository.sumReturnedQuantity`'s doc
 * comment for why that lock is what makes this race-free. Shared by
 * `createReturn` (partial/full, caller-chosen lines) and `voidReceipt`
 * (every line's full REMAINING quantity). */
async function buildReturnLines(
	repository: PosRepository,
	ids: PosIdFactory,
	sale: SaleRecord,
	requestedLines: Array<{ quantity: string; saleLineId: string }>
): Promise<ReturnLineRecord[]> {
	const lines: ReturnLineRecord[] = [];
	for (const requested of requestedLines) {
		const saleLine = sale.lines.find(
			(candidate) => candidate.id === requested.saleLineId
		);
		if (!saleLine) {
			throw new PosError("invalid_reference", "Sale line was not found");
		}
		requireSaleQuantity(requested.quantity);
		if (!saleLine.inventoryMovementId) {
			throw new PosError(
				"invalid_state",
				"Sale line has no recorded stock movement to compensate"
			);
		}
		// biome-ignore lint/performance/noAwaitInLoops: each sum depends on the Sale row lock already held by the caller; sequential is required for correctness, not merely convenient.
		const priorReturned = await repository.sumReturnedQuantity(
			sale.tenantId,
			saleLine.id
		);
		const priorReturnedScaled = returnQuantityToScaled(priorReturned);
		const requestedScaled = returnQuantityToScaled(requested.quantity);
		const originalScaled = returnQuantityToScaled(saleLine.quantity);
		if (priorReturnedScaled + requestedScaled > originalScaled) {
			throw new PosError(
				"validation",
				`Return quantity for product ${saleLine.productId} exceeds what remains unreturned on the original sale line`
			);
		}
		lines.push(
			priceReturnLine(saleLine, priorReturned, requested.quantity, ids)
		);
	}
	if (lines.length === 0) {
		throw new PosError("validation", "A return requires at least one line");
	}
	return lines;
}

/** Loads and validates a Pending return before it may be approved: exists,
 * still Pending, the approver differs from the creator (self-approval
 * denial, frozen control plan §6), and its original Sale still exists.
 * Mirrors `requireApprovableOverride`'s discipline for the price-override
 * pair.
 *
 * WS3 remediation R2, Finding C: the separation check resolves BOTH sides
 * through canonical Party identity (see `requireApprovableOverride`'s doc
 * comment for the full rationale). Returns the resolved `approverPartyId`
 * so the caller does not re-resolve it. */
async function requireApprovableReturn(
	repository: PosRepository,
	parties: PosPartyPort,
	tenantId: string,
	organizationId: string,
	returnId: string,
	actorUserId: string,
	locationId?: string
): Promise<{
	approverPartyId: string;
	current: ReturnRecord;
	sale: SaleRecord;
}> {
	const current = await repository.getReturn(
		tenantId,
		organizationId,
		returnId
	);
	if (!current) {
		throw new PosError("not_found", "Return was not found");
	}
	if (current.state !== "Pending") {
		throw new PosError(
			"invalid_state",
			"Only a Pending return can be approved"
		);
	}
	const approverPartyId = await parties.requireActorPartyId({
		authUserId: actorUserId,
		organizationId,
		tenantId,
	});
	if (current.createdByPartyId === approverPartyId) {
		throw new PosError(
			"approval_separation",
			"The creator cannot approve their own return"
		);
	}
	const sale = await repository.getSale(
		tenantId,
		organizationId,
		current.saleId,
		locationId
	);
	if (!sale) {
		throw new PosError("not_found", "Original sale was not found");
	}
	return { approverPartyId, current, sale };
}

/** Loads and validates the original Sale a `receipt.void` targets: the
 * receipt must be a Sale-kind receipt, its Sale must be Completed, and the
 * Sale's register session must still be the currently open one (the
 * open-session realization of "same-day/open-session", per `voidReceipt`'s
 * own doc comment). `getSale` locks the row for the rest of the caller's
 * transaction — the same concurrency guard `createReturn` relies on. */
async function requireVoidableSale(
	repository: PosRepository,
	tenantId: string,
	organizationId: string,
	receiptId: string,
	locationId?: string
): Promise<{
	receipt: ReceiptRecord;
	sale: SaleRecord;
	session: RegisterSessionRecord;
}> {
	const receipt = await repository.getReceipt(
		tenantId,
		organizationId,
		receiptId
	);
	if (!receipt) {
		throw new PosError("not_found", "Receipt was not found");
	}
	if (receipt.kind !== "Sale" || !receipt.saleId) {
		throw new PosError("invalid_state", "Only a Sale receipt can be voided");
	}
	const sale = await repository.getSale(
		tenantId,
		organizationId,
		receipt.saleId,
		locationId
	);
	if (!sale) {
		throw new PosError("not_found", "Sale was not found");
	}
	if (sale.state !== "Completed") {
		throw new PosError("invalid_state", "Only a completed sale can be voided");
	}
	const session = await repository.getOpenSession(
		tenantId,
		organizationId,
		sale.registerId,
		locationId
	);
	if (!session || session.id !== sale.sessionId) {
		throw new PosError(
			"invalid_state",
			"A sale can only be voided while its register session is still open"
		);
	}
	return { receipt, sale, session };
}

/** Every sale line's REMAINING (unreturned) quantity, priced through
 * `buildReturnLines` exactly as a caller-chosen partial return would be —
 * `voidReceipt` always voids the full remainder, never double-compensating
 * whatever was already returned earlier in the same session. Throws if
 * nothing remains (the sale has already been fully returned). */
async function buildVoidLines(
	repository: PosRepository,
	ids: PosIdFactory,
	sale: SaleRecord
): Promise<ReturnLineRecord[]> {
	const remaining: Array<{ quantity: string; saleLineId: string }> = [];
	for (const line of sale.lines) {
		// biome-ignore lint/performance/noAwaitInLoops: each sum depends on the Sale row lock the caller already holds; sequential is required for correctness.
		const quantity = await remainingReturnableQuantity(
			repository,
			sale.tenantId,
			line
		);
		if (quantity !== "0") {
			remaining.push({ quantity, saleLineId: line.id });
		}
	}
	if (remaining.length === 0) {
		throw new PosError(
			"invalid_state",
			"Sale has already been fully returned; nothing remains to void"
		);
	}
	return buildReturnLines(repository, ids, sale, remaining);
}

/** Posts one compensating `Reversal` movement per Return line, inside the
 * Return's own shared transaction — the mirror of `postSaleLineMovements`
 * for the compensating direction. Shared by `approveReturn` and
 * `voidReceipt`, the two places a Return's lines ever get their Inventory
 * effect posted. Deliberately sequential (shares one transactional
 * `PoolClient`), matching `postSaleLineMovements`'s own discipline. */
async function postReturnCompensatingMovements(
	inventory: ReturnInventoryMovementPort,
	sale: SaleRecord,
	lines: ReturnLineRecord[],
	input: {
		actorUserId: string;
		correlationId: string;
		returnId: string;
		tenantId: string;
	}
): Promise<void> {
	for (const line of lines) {
		const saleLine = sale.lines.find(
			(candidate) => candidate.id === line.saleLineId
		);
		if (!saleLine?.inventoryMovementId) {
			throw new PosError(
				"invalid_state",
				"Original sale line's stock movement could not be located"
			);
		}
		// biome-ignore lint/performance/noAwaitInLoops: sequential by necessity, shares one transactional PoolClient.
		await inventory.recordReturnMovement({
			actorUserId: input.actorUserId,
			correlationId: input.correlationId,
			locationId: sale.locationId,
			organizationId: sale.organizationId,
			productId: line.productId,
			quantity: line.quantity,
			returnId: input.returnId,
			reversalOfMovementId: saleLine.inventoryMovementId,
			tenantId: input.tenantId,
			unit: line.unit,
			variantId: line.variantId,
		});
	}
}

/** Builds the immutable Return-kind receipt snapshot shared by
 * `approveReturn` and `voidReceipt` — both post a compensating receipt
 * with the same line-snapshot shape (discount/tax/total per line, no
 * tenders, `kind: "Return"`), differing only in which original receipt and
 * return metadata they reference. */
function buildReturnReceiptRecord(input: {
	cashierPartyId: string;
	currency: string;
	id: string;
	issuedAt: Date;
	lines: ReturnLineRecord[];
	organizationId: string;
	originalReceiptId: string;
	receiptNumber: string;
	registerId: string;
	returnId: string;
	saleId: string;
	tenantId: string;
	totalMinor: number;
}): ReceiptRecord {
	return {
		cashierPartyId: input.cashierPartyId,
		createdAt: input.issuedAt,
		currency: input.currency,
		id: input.id,
		issuedAt: input.issuedAt,
		kind: "Return",
		lines: input.lines.map((line) => ({
			discountMinor: line.discountMinor,
			lineTotalMinor: line.lineTotalMinor,
			nonStatutory: line.nonStatutory,
			productName: line.productName,
			quantity: line.quantity,
			taxAmountMinor: line.taxAmountMinor,
			taxableBaseMinor: line.taxableBaseMinor,
			taxCategory: line.taxCategory,
			unit: line.unit,
			unitPriceMinor: line.unitPriceMinor,
		})),
		organizationId: input.organizationId,
		originalReceiptId: input.originalReceiptId,
		priceSuppressed: false,
		receiptNumber: input.receiptNumber,
		registerId: input.registerId,
		returnId: input.returnId,
		saleId: input.saleId,
		tenantId: input.tenantId,
		tenders: [],
		totalMinor: input.totalMinor,
	};
}

/** Emits the `commerce.return.completed.v1` + `commerce.receipt.issued.v1`
 * event pair shared by `approveReturn` and `voidReceipt` — the exact two
 * facts §6.3's Completed transition requires, atomic with the state
 * change/receipt insert already committed earlier in the same transaction. */
async function emitReturnCompletionEvents(
	events: PosEventAppendPort,
	ids: PosIdFactory,
	savedReturn: ReturnRecord,
	receiptRecord: ReceiptRecord,
	input: {
		actorUserId: string;
		correlationId: string;
		idempotencyKey: string;
		now: Date;
	}
): Promise<void> {
	await events.append(
		saleEvent({
			actorUserId: input.actorUserId,
			aggregateId: savedReturn.id,
			capabilityId: "commerce.returns",
			correlationId: input.correlationId,
			data: {
				approverPartyId: savedReturn.approvedByPartyId,
				exchangeSaleId: null,
				lines: savedReturn.lines.map((line) => ({
					productId: line.productId,
					quantity: line.quantity,
					variantId: line.variantId,
				})),
				mode: savedReturn.mode,
				registerId: savedReturn.registerId,
				returnId: savedReturn.id,
				saleId: savedReturn.saleId,
			},
			eventId: ids.create("event"),
			idempotencyKey: input.idempotencyKey,
			name: "commerce.return.completed.v1",
			now: input.now,
			organizationId: savedReturn.organizationId,
			schemaRef: "schemas/events/commerce.return.completed.v1.schema.json",
			tenantId: savedReturn.tenantId,
		})
	);
	await events.append(
		saleEvent({
			actorUserId: input.actorUserId,
			aggregateId: receiptRecord.id,
			capabilityId: "commerce.receipts",
			correlationId: input.correlationId,
			data: {
				currency: receiptRecord.currency,
				kind: "Return",
				originalReceiptId: receiptRecord.originalReceiptId,
				priceSuppressed: false,
				receiptId: receiptRecord.id,
				receiptNumber: receiptRecord.receiptNumber,
				registerId: receiptRecord.registerId,
				returnId: savedReturn.id,
				saleId: savedReturn.saleId,
				totalMinor: receiptRecord.totalMinor,
			},
			eventId: ids.create("event"),
			idempotencyKey: `${input.idempotencyKey}:receipt`,
			name: "commerce.receipt.issued.v1",
			now: input.now,
			organizationId: receiptRecord.organizationId,
			schemaRef: "schemas/events/commerce.receipt.issued.v1.schema.json",
			tenantId: receiptRecord.tenantId,
		})
	);
}

/** Validates a `completeSale` caller's optional `exchangeOfReturnId`
 * (frozen control plan §6.5): the referenced Return must be a Completed,
 * unconsumed `"Return"`-mode Return sharing this sale's register and
 * currency. Returns `null` when no exchange was requested (the ordinary
 * `sale.complete` path). */
async function requireExchangeReturn(
	repository: PosRepository,
	tenantId: string,
	exchangeOfReturnId: string,
	sale: SaleRecord
): Promise<ReturnRecord> {
	const exchangeReturn = await repository.getReturn(
		tenantId,
		sale.organizationId,
		exchangeOfReturnId
	);
	if (
		exchangeReturn?.state !== "Completed" ||
		exchangeReturn.mode !== "Return"
	) {
		throw new PosError(
			"invalid_reference",
			"Exchange requires a Completed return"
		);
	}
	if (exchangeReturn.exchangeSaleId) {
		throw new PosError(
			"invalid_state",
			"Return has already been consumed by an exchange"
		);
	}
	if (exchangeReturn.registerId !== sale.registerId) {
		throw new PosError(
			"invalid_state",
			"Exchange requires the replacement sale to share the return's register"
		);
	}
	requireMatchingCurrency(exchangeReturn.currency, sale.currency);
	return exchangeReturn;
}

/** Marks the exchanged Return consumed and emits the correlating
 * `commerce.exchange.completed.v1` fact, once the replacement Sale has
 * already committed within the SAME `completeSale` transaction. `mode`/
 * `exchangeSaleId` deliberately stay `"Return"`/`null` on the ALREADY-
 * EMITTED `commerce.return.completed.v1` event from `return.approve` — that
 * event cannot be amended after the fact, and at the time it was emitted
 * this replacement sale did not exist yet (§6.5's ordering: the return leg
 * completes BEFORE the replacement sale does). The correlating fact lives
 * ENTIRELY on `commerce.exchange.completed.v1`, the registered event for
 * exactly this purpose. */
async function linkExchange(
	repository: PosRepository,
	events: PosEventAppendPort,
	ids: PosIdFactory,
	exchangeReturn: ReturnRecord,
	savedSale: SaleRecord,
	input: {
		actorUserId: string;
		correlationId: string;
		idempotencyKey: string;
		now: Date;
	}
): Promise<void> {
	const updatedReturn: ReturnRecord = {
		...exchangeReturn,
		exchangeSaleId: savedSale.id,
		updatedAt: input.now,
		version: exchangeReturn.version + 1,
	};
	const savedReturn = await repository.updateReturn(
		updatedReturn,
		exchangeReturn.version
	);
	if (savedReturn === "version_conflict") {
		throw new PosError(
			"version_conflict",
			"Return was consumed by another exchange concurrently"
		);
	}
	const exchangeId = ids.create("exchange");
	await events.append(
		saleEvent({
			actorUserId: input.actorUserId,
			aggregateId: exchangeId,
			capabilityId: "commerce.exchanges",
			correlationId: input.correlationId,
			data: {
				balanceDueMinor:
					savedSale.totalMinor - savedReturn.totalRefundableMinor,
				currency: savedSale.currency,
				exchangeId,
				newSaleId: savedSale.id,
				registerId: savedSale.registerId,
				returnId: savedReturn.id,
			},
			eventId: ids.create("event"),
			idempotencyKey: `${input.idempotencyKey}:exchange`,
			name: "commerce.exchange.completed.v1",
			now: input.now,
			organizationId: savedSale.organizationId,
			schemaRef: "schemas/events/commerce.exchange.completed.v1.schema.json",
			tenantId: savedSale.tenantId,
		})
	);
}

export interface PosServiceOptions {
	clock: () => Date;
	/** Used ONLY by `createDeposit`: the organization-scoped deposit-
	 * reference-number allocation seam (WS3 PR4, mirrors `saleUnitOfWork`'s
	 * "one shared unit of work" discipline). `confirmDeposit` never touches
	 * Numbering — it uses the plain `unitOfWork` instead. */
	depositUnitOfWork: PosDepositUnitOfWork;
	ids: PosIdFactory;
	parties: PosPartyPort;
	pricing: PosPricingPort;
	products: PosCatalogPort;
	/** Used by `approveReturn`, `voidReceipt`, and `reissueReceipt`: the
	 * compensating-Inventory-movement and receipt-numbering seam WS3 PR3's
	 * frozen control plan §6.3 requires, mirroring `saleUnitOfWork`'s "one
	 * shared unit of work" discipline exactly. `reissueReceipt` never
	 * touches `inventory` (only `numbering`); the port is still present on
	 * every call because splitting a third unit-of-work shape purely to
	 * omit one unused port would duplicate composition wiring for no
	 * behavioral gain. */
	returnUnitOfWork: PosReturnUnitOfWork;
	/** Used ONLY by `completeSale`: the frozen control plan's ONE shared
	 * unit of work spanning the sale commit, receipt numbering, and the
	 * synchronous Inventory stock movement (§ "Read first" — one
	 * `createPostgresUnitOfWork`, one client, one transaction). Every other
	 * Sale/PriceOverride/Receipt command below uses the plain `unitOfWork`
	 * (repository + events only) because it never touches Numbering or
	 * Inventory. */
	saleUnitOfWork: PosSaleUnitOfWork;
	tax: PosTaxPort;
	unitOfWork: PosUnitOfWork;
}

export function createPosService(options: PosServiceOptions) {
	return {
		async approveCashVariance(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			sessionId: string;
			tenantId: string;
			version: number;
		}): Promise<RegisterSessionView> {
			const requestFingerprint = await fingerprint({
				sessionId: input.sessionId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.cash-variance.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getSession(
					input.tenantId,
					input.organizationId,
					input.sessionId,
					input.locationId
				);
				if (!current) {
					throw new PosError("not_found", "Register session was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Closing") {
					throw new PosError(
						"invalid_state",
						"Only a session pending variance approval can be approved"
					);
				}
				// WS3 remediation R2, Finding C: compares canonical Party
				// identity, not the Better Auth `actorUserId` — two different
				// auth accounts linked to the SAME Party must still be denied
				// self-approval. `requireActorPartyId` resolves (or safely
				// denies, via `PosError("invalid_reference", ...)`) the
				// approver's Party BEFORE the separation check runs, so the
				// comparison below is always Party-to-Party.
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				if (current.closedByPartyId === approverPartyId) {
					throw new PosError(
						"approval_separation",
						"The closer cannot approve their own cash variance"
					);
				}
				const now = options.clock();
				const updated: RegisterSessionRecord = {
					...current,
					closedAt: now,
					state: "Closed",
					updatedAt: now,
					varianceApprovedAt: now,
					varianceApprovedByActorUserId: input.actorUserId,
					varianceApprovedByPartyId: approverPartyId,
					version: current.version + 1,
				};
				const saved = await repository.updateSession(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError(
						"version_conflict",
						"Register session version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.register-management",
						correlationId: input.correlationId,
						data: {
							closerPartyId: saved.closedByPartyId,
							countedCashMinor: saved.countedCashMinor,
							currency: saved.currency,
							expectedCashMinor: saved.expectedCashMinor,
							registerId: saved.registerId,
							varianceApprovalRequired: true,
							varianceApproverPartyId: approverPartyId,
							varianceMinor: saved.varianceMinor,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.register.closed.v1",
						now,
						organizationId: saved.organizationId,
						schemaRef: "schemas/events/commerce.register.closed.v1.schema.json",
						tenantId: saved.tenantId,
					})
				);
				const result = registerSessionView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.cash-variance.approve",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		// -- WS3 PR2: Sale, PriceOverride, Receipt -------------------------------

		async approvePriceOverride(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			overrideId: string;
			saleId: string;
			tenantId: string;
		}): Promise<SaleView> {
			const requestFingerprint = await fingerprint({
				overrideId: input.overrideId,
				saleId: input.saleId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<SaleView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.price-override.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const { approverPartyId, line, override, sale } =
					await requireApprovableOverride(
						repository,
						options.parties,
						input.tenantId,
						input.organizationId,
						input.saleId,
						input.overrideId,
						input.actorUserId,
						input.locationId
					);
				const now = options.clock();

				const updatedLine = await computeOverriddenLine(
					options,
					line,
					override.requestedPriceMinor
				);
				const updatedSale = applySaleLineUpdate(sale, updatedLine, now);
				const savedSale = await repository.updateSale(
					updatedSale,
					sale.version
				);
				if (savedSale === "version_conflict") {
					throw new PosError("version_conflict", "Sale version is stale");
				}

				const updatedOverride: PriceOverrideRecord = {
					...override,
					approvedAt: now,
					approvedByActorUserId: input.actorUserId,
					approvedByPartyId: approverPartyId,
					state: "Approved",
					version: override.version + 1,
				};
				const savedOverride = await repository.updatePriceOverride(
					updatedOverride,
					override.version
				);
				if (savedOverride === "version_conflict") {
					throw new PosError(
						"version_conflict",
						"Price override version is stale"
					);
				}

				// No dedicated event is registered for this transition (frozen
				// control plan §6.2); none is invented.
				const result = saleView(savedSale);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.price-override.approve",
						requestFingerprint,
						resourceId: override.id,
						tenantId: sale.tenantId,
					},
					result,
					now
				);
			});
		},

		// -- WS3 PR3: Return, Refund ----------------------------------------------

		async approveRefund(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			refundId: string;
			tenantId: string;
		}): Promise<RefundView> {
			const requestFingerprint = await fingerprint({
				refundId: input.refundId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RefundView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.refund.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getRefund(
					input.tenantId,
					input.organizationId,
					input.refundId
				);
				if (!current) {
					throw new PosError("not_found", "Refund was not found");
				}
				if (current.state !== "Requested") {
					throw new PosError(
						"invalid_state",
						"Only a Requested refund can be approved"
					);
				}
				// WS3 remediation R2, Finding C: compares canonical Party
				// identity, not the Better Auth `actorUserId` — resolve (or
				// safely deny) the approver's Party BEFORE the separation
				// check, then compare Party-to-Party against the maker's
				// already-persisted `requestedByPartyId`.
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				if (current.requestedByPartyId === approverPartyId) {
					throw new PosError(
						"approval_separation",
						"The requester cannot approve their own refund"
					);
				}
				// Cross-register denial by construction (Scope: cross-register
				// refunds are rejected at the boundary unless PR0 explicitly
				// scoped otherwise, which it does not): `refund.create` never
				// accepted a caller-supplied register, so `current.registerId`
				// IS the original sale's register; the only thing left to
				// validate is that THAT register's session is still open
				// (frozen control plan §6.4: "posts ... on the referenced open
				// register").
				const session = await repository.getOpenSession(
					input.tenantId,
					input.organizationId,
					current.registerId,
					input.locationId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Refund requires its register session to still be open"
					);
				}
				const now = options.clock();

				// Refund-exceeds-register-cash (frozen control plan Tests:
				// "record variance vs reject — whichever PR0 declared"). SUPERSEDED
				// by WS3 remediation R1, Finding E: this refund posting no longer
				// "always posts" regardless of drawer cash. `requireCashOutWithinExpectedCash`
				// rejects BEFORE any ledger row, event, or state change if this
				// refund would drive the register's authoritative expected cash
				// (Finding A's ledger, computed by `currentExpectedCashMinor`)
				// below zero — the fail-closed guard `schemas/events/commerce.
				// register.closed.v1.schema.json`'s `expectedCashMinor minimum: 0`
				// requires, applying the SAME disclosed-prototype-limit pattern
				// `WS3_POS_CASH_IMPLEMENTATION_PLAN.md` §10.3 already established
				// (see `remediation-dispositions.md` "## E"). A refund that keeps
				// expected cash at or above zero still always posts; only a
				// refund that would breach zero is denied — no variance is ever
				// silently accepted at close time for that shortfall, because it
				// is never posted in the first place.
				const expectedCashBeforeRefund = await currentExpectedCashMinor(
					repository,
					input.tenantId,
					session
				);
				requireCashOutWithinExpectedCash(
					expectedCashBeforeRefund,
					current.amountMinor
				);
				const movementId = options.ids.create("movement");
				const movement: CashMovementRecord = {
					actorPartyId: approverPartyId,
					actorUserId: input.actorUserId,
					amountMinor: current.amountMinor,
					createdAt: now,
					currency: current.currency,
					direction: "PaidOut",
					id: movementId,
					note: null,
					organizationId: input.organizationId,
					reasonCode: "Refund",
					referenceId: current.id,
					registerId: current.registerId,
					sessionId: session.id,
					tenantId: input.tenantId,
				};
				const savedMovement = await repository.createCashMovement(movement);
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: savedMovement.id,
						capabilityId: "commerce.cash-management",
						correlationId: input.correlationId,
						data: {
							actorPartyId: approverPartyId,
							amountMinor: savedMovement.amountMinor,
							currency: savedMovement.currency,
							direction: savedMovement.direction,
							movementId: savedMovement.id,
							reasonCode: savedMovement.reasonCode,
							referenceId: savedMovement.referenceId,
							registerId: savedMovement.registerId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: `${input.idempotencyKey}:cash-movement`,
						name: "commerce.cash-movement.posted.v1",
						now,
						organizationId: input.organizationId,
						schemaRef:
							"schemas/events/commerce.cash-movement.posted.v1.schema.json",
						tenantId: input.tenantId,
					})
				);

				const updated: RefundRecord = {
					...current,
					approvedAt: now,
					approvedByActorUserId: input.actorUserId,
					approvedByPartyId: approverPartyId,
					cashMovementId: savedMovement.id,
					state: "Posted",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateRefund(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError("version_conflict", "Refund version is stale");
				}
				const result = refundView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.refund.approve",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async approveReturn(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			returnId: string;
			tenantId: string;
		}): Promise<ReturnView> {
			const requestFingerprint = await fingerprint({
				returnId: input.returnId,
			});
			return options.returnUnitOfWork.execute(
				async ({ events, inventory, numbering, repository }) => {
					const prior = await replay<ReturnView>(repository, {
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.return.approve",
						requestFingerprint,
						tenantId: input.tenantId,
					});
					if (prior) {
						return prior;
					}
					const { approverPartyId, current, sale } =
						await requireApprovableReturn(
							repository,
							options.parties,
							input.tenantId,
							input.organizationId,
							input.returnId,
							input.actorUserId,
							input.locationId
						);
					const now = options.clock();

					await postReturnCompensatingMovements(
						inventory,
						sale,
						current.lines,
						{
							actorUserId: input.actorUserId,
							correlationId: input.correlationId,
							returnId: current.id,
							tenantId: current.tenantId,
						}
					);

					const allocation = await numbering.allocate({
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						idempotencyKey: input.idempotencyKey,
						organizationId: current.organizationId,
						registerId: current.registerId,
						saleId: current.id,
						tenantId: current.tenantId,
					});
					const receiptId = options.ids.create("receipt");
					const receiptRecord = buildReturnReceiptRecord({
						cashierPartyId: approverPartyId,
						currency: current.currency,
						id: receiptId,
						issuedAt: now,
						lines: current.lines,
						organizationId: current.organizationId,
						originalReceiptId: sale.receiptId as string,
						receiptNumber: allocation.value,
						registerId: current.registerId,
						returnId: current.id,
						saleId: current.saleId,
						tenantId: current.tenantId,
						totalMinor: current.totalRefundableMinor,
					});
					await repository.createReceipt(receiptRecord);

					const updated: ReturnRecord = {
						...current,
						approvedAt: now,
						approvedByActorUserId: input.actorUserId,
						approvedByPartyId: approverPartyId,
						receiptId,
						state: "Completed",
						updatedAt: now,
						version: current.version + 1,
					};
					const savedReturn = await repository.updateReturn(
						updated,
						current.version
					);
					if (savedReturn === "version_conflict") {
						throw new PosError("version_conflict", "Return version is stale");
					}

					await emitReturnCompletionEvents(
						events,
						options.ids,
						savedReturn,
						receiptRecord,
						{
							actorUserId: input.actorUserId,
							correlationId: input.correlationId,
							idempotencyKey: input.idempotencyKey,
							now,
						}
					);

					const result = returnView(savedReturn);
					return recordResult(
						repository,
						{
							idempotencyKey: input.idempotencyKey,
							operation: "commerce.return.approve",
							requestFingerprint,
							resourceId: savedReturn.id,
							tenantId: savedReturn.tenantId,
						},
						result,
						now
					);
				}
			);
		},

		async closeRegister(input: {
			actorUserId: string;
			correlationId: string;
			countedCash: { amountMinor: number; currency: string };
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			reason?: string | null;
			registerId: string;
			tenantId: string;
		}): Promise<RegisterSessionView> {
			requireNonNegativeMinor(
				input.countedCash.amountMinor,
				"countedCash.amountMinor"
			);
			const requestFingerprint = await fingerprint({
				countedCash: input.countedCash,
				reason: input.reason ?? null,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.register.close",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getOpenSession(
					input.tenantId,
					input.organizationId,
					input.registerId,
					input.locationId
				);
				if (!current) {
					throw new PosError(
						"invalid_state",
						"Register has no open session to close"
					);
				}
				requireMatchingCurrency(current.currency, input.countedCash.currency);
				// WS3 remediation R1, Finding A: `expectedCashMinor` is derived
				// from the authoritative cash ledger — `openingFloatMinor` plus
				// every signed `CashMovement` row this session has accumulated.
				// Before this remediation, `completeSale` and `approveRefund`
				// were the only two writers of Sale/Refund business effects and
				// only `approveRefund` ever posted to this ledger, so this
				// formula silently excluded every cash sale's proceeds and
				// change. `completeSale` now posts its own `PaidIn` entry
				// atomically with sale completion (see that method's own
				// remediation comment), so this SAME formula — unchanged here —
				// is now genuinely authoritative rather than a partial
				// reconstruction. Finding E's fail-closed guard on every cash-OUT
				// posting (`requireCashOutWithinExpectedCash`) is what keeps this
				// value non-negative, satisfying `schemas/events/commerce.
				// register.closed.v1.schema.json`'s `expectedCashMinor minimum:
				// 0` — never by weakening the schema.
				const expectedCashMinor = await currentExpectedCashMinor(
					repository,
					input.tenantId,
					current
				);
				const varianceMinor = input.countedCash.amountMinor - expectedCashMinor;
				const now = options.clock();
				const closerPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const zeroVariance = varianceMinor === 0;
				const updated: RegisterSessionRecord = {
					...current,
					closedAt: zeroVariance ? now : null,
					closedByActorUserId: input.actorUserId,
					closedByPartyId: closerPartyId,
					closeReason: input.reason ?? null,
					closeRequestedAt: now,
					countedCashMinor: input.countedCash.amountMinor,
					expectedCashMinor,
					state: zeroVariance ? "Closed" : "Closing",
					updatedAt: now,
					varianceApprovalRequired: !zeroVariance,
					varianceMinor,
					version: current.version + 1,
				};
				const saved = await repository.updateSession(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError(
						"version_conflict",
						"Register session version is stale"
					);
				}
				if (zeroVariance) {
					await events.append(
						event({
							actorUserId: input.actorUserId,
							aggregateId: saved.id,
							capabilityId: "commerce.register-management",
							correlationId: input.correlationId,
							data: {
								closerPartyId,
								countedCashMinor: saved.countedCashMinor,
								currency: saved.currency,
								expectedCashMinor: saved.expectedCashMinor,
								registerId: saved.registerId,
								varianceApprovalRequired: false,
								varianceApproverPartyId: null,
								varianceMinor: saved.varianceMinor,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: input.idempotencyKey,
							name: "commerce.register.closed.v1",
							now,
							organizationId: saved.organizationId,
							schemaRef:
								"schemas/events/commerce.register.closed.v1.schema.json",
							tenantId: saved.tenantId,
						})
					);
				}
				const result = registerSessionView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.register.close",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async completeSale(input: {
			actorUserId: string;
			correlationId: string;
			/** Realizes `commerce.exchanges` (frozen control plan §6.5): NOT a
			 * new permission or endpoint — an ordinary `sale.complete` whose
			 * caller additionally names the ALREADY-`Completed` compensating
			 * Return it replaces. Both legs keep their own maker/checker
			 * discipline (the return's own approver ≠ creator rule already
			 * ran at `return.approve` time; this replacement sale needs no
			 * approval beyond ordinary `sale.complete` authority, exactly as
			 * §6.5 specifies). */
			exchangeOfReturnId?: string | null;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			saleId: string;
			tenders: Array<{
				amountMinor: number;
				currency: string;
				referenceId?: string | null;
				type: "Cash" | "PaymentIntent" | "StoredValue";
			}>;
			tenantId: string;
		}): Promise<SaleView> {
			requireCashOnlyTenders(input.tenders);
			const requestFingerprint = await fingerprint({
				exchangeOfReturnId: input.exchangeOfReturnId ?? null,
				saleId: input.saleId,
				tenders: input.tenders,
			});
			return options.saleUnitOfWork.execute(
				async ({ events, inventory, numbering, repository }) => {
					const prior = await replay<SaleView>(repository, {
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.sale.complete",
						requestFingerprint,
						tenantId: input.tenantId,
					});
					if (prior) {
						return prior;
					}
					const sale = await requireCompletableSale(
						repository,
						input.tenantId,
						input.organizationId,
						input.saleId,
						input.locationId
					);
					requireMatchingTenderCurrencies(sale.currency, input.tenders);

					const exchangeReturn = input.exchangeOfReturnId
						? await requireExchangeReturn(
								repository,
								input.tenantId,
								input.exchangeOfReturnId,
								sale
							)
						: null;
					const tenderedMinor = input.tenders.reduce(
						(sum, tender) => sum + tender.amountMinor,
						0
					);
					if (tenderedMinor < sale.totalMinor) {
						throw new PosError(
							"validation",
							"Cash tendered is less than the sale total"
						);
					}
					const changeMinor = tenderedMinor - sale.totalMinor;
					const now = options.clock();
					const cashierPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});

					const linesWithMovements = await postSaleLineMovements(
						inventory,
						sale,
						input.actorUserId,
						input.correlationId
					);
					sale.lines = linesWithMovements;

					const allocation = await numbering.allocate({
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						idempotencyKey: input.idempotencyKey,
						organizationId: sale.organizationId,
						registerId: sale.registerId,
						saleId: sale.id,
						tenantId: sale.tenantId,
					});

					const tenders: TenderRecord[] = input.tenders.map((tender) => ({
						amountMinor: tender.amountMinor,
						referenceId: tender.referenceId ?? null,
						type: tender.type,
					}));

					const receiptId = options.ids.create("receipt");
					const receiptRecord: ReceiptRecord = {
						cashierPartyId,
						createdAt: now,
						currency: sale.currency,
						id: receiptId,
						issuedAt: now,
						kind: "Sale",
						lines: sale.lines.map((line) => ({
							discountMinor: line.discountMinor,
							lineTotalMinor: line.lineTotalMinor,
							nonStatutory: line.nonStatutory,
							productName: line.productName,
							quantity: line.quantity,
							taxAmountMinor: line.taxAmountMinor,
							taxableBaseMinor: line.taxableBaseMinor,
							taxCategory: line.taxCategory,
							unit: line.unit,
							unitPriceMinor: line.unitPriceMinor,
						})),
						organizationId: sale.organizationId,
						originalReceiptId: null,
						priceSuppressed: false,
						receiptNumber: allocation.value,
						registerId: sale.registerId,
						returnId: null,
						saleId: sale.id,
						tenantId: sale.tenantId,
						tenders,
						totalMinor: sale.totalMinor,
					};
					await repository.createReceipt(receiptRecord);

					const updatedSale: SaleRecord = {
						...sale,
						changeMinor,
						completedAt: now,
						receiptId,
						state: "Completed",
						tenderedMinor,
						tendersMinor: tenders,
						updatedAt: now,
						version: sale.version + 1,
					};
					const savedSale = await repository.updateSale(
						updatedSale,
						sale.version
					);
					if (savedSale === "version_conflict") {
						throw new PosError("version_conflict", "Sale version is stale");
					}

					// WS3 remediation R1, Finding A: a completed cash sale's net
					// cash-in must post to the SAME authoritative cash ledger
					// `approveRefund` already posts a `PaidOut` entry to —
					// atomically inside THIS transaction (`saleUnitOfWork`, no
					// separate follow-up write; CLAUDE.md §5's "explicit
					// application contracts" discipline) — so `closeRegister`'s
					// `netCashMovements`-derived `expectedCashMinor` stops
					// excluding sale proceeds. `requireCashOnlyTenders` has
					// already rejected every tender that is not `Cash`, so the
					// drawer's net cash effect (every cash tender received minus
					// change handed back) is algebraically always exactly
					// `savedSale.totalMinor`: `tenderedMinor - changeMinor
					// == tenderedMinor - (tenderedMinor - totalMinor) ==
					// totalMinor`. `commerce.cash-movement.posted.v1` is a frozen
					// PR0 `v1` event (`additionalProperties: false`, `reasonCode`
					// enum fixed to `["PaidIn","PaidOut","SafeDrop","Refund",
					// "Other"]`) — it has no `"Sale"` reason code to mint without
					// an unauthorized `v2`, so this files under the schema's
					// existing `"Other"` catch-all with `referenceId` naming this
					// Sale, exactly the un-enumerated-cash-cause escape hatch PR0
					// left available. A zero-total sale (e.g. every line fully
					// discounted) has no cash effect and posts nothing —
					// `requirePositiveMinor`-equivalent zero-amount ledger rows
					// are never valid.
					if (savedSale.totalMinor > 0) {
						const saleCashMovementId = options.ids.create("movement");
						const saleCashMovement: CashMovementRecord = {
							actorPartyId: cashierPartyId,
							actorUserId: input.actorUserId,
							amountMinor: savedSale.totalMinor,
							createdAt: now,
							currency: savedSale.currency,
							direction: "PaidIn",
							id: saleCashMovementId,
							note: "Cash sale proceeds",
							organizationId: savedSale.organizationId,
							reasonCode: "Other",
							referenceId: savedSale.id,
							registerId: savedSale.registerId,
							sessionId: savedSale.sessionId,
							tenantId: savedSale.tenantId,
						};
						const savedSaleCashMovement =
							await repository.createCashMovement(saleCashMovement);
						await events.append(
							event({
								actorUserId: input.actorUserId,
								aggregateId: savedSaleCashMovement.id,
								capabilityId: "commerce.cash-management",
								correlationId: input.correlationId,
								data: {
									actorPartyId: cashierPartyId,
									amountMinor: savedSaleCashMovement.amountMinor,
									currency: savedSaleCashMovement.currency,
									direction: savedSaleCashMovement.direction,
									movementId: savedSaleCashMovement.id,
									reasonCode: savedSaleCashMovement.reasonCode,
									referenceId: savedSaleCashMovement.referenceId,
									registerId: savedSaleCashMovement.registerId,
								},
								eventId: options.ids.create("event"),
								idempotencyKey: `${input.idempotencyKey}:cash-movement`,
								name: "commerce.cash-movement.posted.v1",
								now,
								organizationId: savedSale.organizationId,
								schemaRef:
									"schemas/events/commerce.cash-movement.posted.v1.schema.json",
								tenantId: savedSale.tenantId,
							})
						);
					}

					// CONFORMANCE DECISION (recorded here, not silently applied): the
					// `nonStatutory` marker restored elsewhere in this branch
					// (SaleLineRecord/ReceiptLineSnapshot/SaleLineView/ReceiptLineView)
					// does NOT extend onto `commerce.sale.completed.v1`'s aggregate
					// `taxMinor` below, or onto `commerce.receipt.issued.v1` (which
					// carries no tax field at all — nothing to mark). Both event
					// schemas were frozen in PR0 with `additionalProperties: false`;
					// `commerce.sale.completed.v1` is a registered `v1` name (CLAUDE.md
					// §6: `<namespace>.<entity>.<past-tense-fact>.v<major>`), so adding
					// a new REQUIRED field would be a breaking change demanding a `v2`
					// event this stage is not authorized to mint. The schema's existing
					// OPTIONAL `taxSnapshotVersion` field is left `null` rather than
					// repurposed to signal non-statutory provenance: its semantics were
					// never defined by PR0 (no doc references it), and guessing a
					// reading here risks colliding with whatever a later, real
					// tax-snapshot-versioning feature needs it to mean. Every consumer
					// of `taxMinor` from this event is, for the whole WS3 controlled-
					// prototype branch, implicitly reading `engine.tax`'s
					// `NON_STATUTORY_NOTICE` output (registered at `prototype` depth in
					// `registry/first-slice.json`) — this is a branch-wide disposition,
					// not a per-event fact this schema shape can carry without a
					// version bump. Flagged for the orchestrator/founder decision on
					// whether PR0's event contract should gain a `v2` or a defined
					// `taxSnapshotVersion` convention; this PR2 remediation does not
					// unilaterally amend a frozen event schema to force the point.
					await events.append(
						saleEvent({
							actorUserId: input.actorUserId,
							aggregateId: savedSale.id,
							capabilityId: "commerce.order-management",
							correlationId: input.correlationId,
							data: {
								completionMode: "Online",
								currency: savedSale.currency,
								customerPartyId: savedSale.customerPartyId,
								discountMinor: savedSale.discountMinor,
								grossMinor: savedSale.grossMinor,
								receiptId,
								registerId: savedSale.registerId,
								saleId: savedSale.id,
								taxMinor: savedSale.taxMinor,
								taxSnapshotVersion: null,
								tenders: tenders.map((tender) => ({
									amountMinor: tender.amountMinor,
									referenceId: tender.referenceId,
									type: tender.type,
								})),
								totalMinor: savedSale.totalMinor,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: input.idempotencyKey,
							name: "commerce.sale.completed.v1",
							now,
							organizationId: savedSale.organizationId,
							schemaRef:
								"schemas/events/commerce.sale.completed.v1.schema.json",
							tenantId: savedSale.tenantId,
						})
					);

					await events.append(
						saleEvent({
							actorUserId: input.actorUserId,
							aggregateId: receiptId,
							capabilityId: "commerce.receipts",
							correlationId: input.correlationId,
							data: {
								currency: receiptRecord.currency,
								kind: "Sale",
								originalReceiptId: null,
								priceSuppressed: false,
								receiptId,
								receiptNumber: receiptRecord.receiptNumber,
								registerId: receiptRecord.registerId,
								returnId: null,
								saleId: savedSale.id,
								totalMinor: receiptRecord.totalMinor,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: `${input.idempotencyKey}:receipt`,
							name: "commerce.receipt.issued.v1",
							now,
							organizationId: savedSale.organizationId,
							schemaRef:
								"schemas/events/commerce.receipt.issued.v1.schema.json",
							tenantId: savedSale.tenantId,
						})
					);

					if (exchangeReturn) {
						await linkExchange(
							repository,
							events,
							options.ids,
							exchangeReturn,
							savedSale,
							{
								actorUserId: input.actorUserId,
								correlationId: input.correlationId,
								idempotencyKey: input.idempotencyKey,
								now,
							}
						);
					}

					const result = saleView(savedSale);
					return recordResult(
						repository,
						{
							idempotencyKey: input.idempotencyKey,
							operation: "commerce.sale.complete",
							requestFingerprint,
							resourceId: savedSale.id,
							tenantId: savedSale.tenantId,
						},
						result,
						now
					);
				}
			);
		},

		/**
		 * `deposit.confirm` (frozen control plan §6.6): the ONLY method that
		 * ever writes a `pos_deposit_custody_transfer` row — the posted
		 * safe-to-bank custody transfer, atomic with `commerce.deposit.
		 * reconciled.v1`. `getDeposit` locks the row (SELECT ... FOR UPDATE),
		 * so concurrent double-confirm attempts serialize: the second
		 * transaction observes `state: "Reconciled"` already and is rejected,
		 * exactly one ever posts.
		 */
		async confirmDeposit(input: {
			actorUserId: string;
			correlationId: string;
			depositId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<DepositView> {
			const requestFingerprint = await fingerprint({
				depositId: input.depositId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<DepositView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.deposit.confirm",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getDeposit(
					input.tenantId,
					input.organizationId,
					input.depositId
				);
				if (!current) {
					throw new PosError("not_found", "Deposit was not found");
				}
				if (current.state !== "Prepared") {
					throw new PosError(
						"invalid_state",
						"Only a Prepared deposit can be confirmed"
					);
				}
				// WS3 remediation R2, Finding C: compares canonical Party
				// identity, not the Better Auth `actorUserId`.
				const confirmerPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				if (current.preparedByPartyId === confirmerPartyId) {
					throw new PosError(
						"approval_separation",
						"The preparer cannot confirm their own deposit"
					);
				}
				const now = options.clock();
				await repository.createDepositCustodyTransfer({
					amountMinor: current.amountMinor,
					confirmedByActorUserId: input.actorUserId,
					confirmedByPartyId: confirmerPartyId,
					currency: current.currency,
					depositId: current.id,
					id: options.ids.create("deposit-custody-transfer"),
					organizationId: input.organizationId,
					postedAt: now,
					tenantId: input.tenantId,
				});
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: current.id,
						capabilityId: "commerce.cash-management",
						correlationId: input.correlationId,
						data: {
							amountMinor: current.amountMinor,
							confirmerPartyId,
							currency: current.currency,
							depositId: current.id,
							depositReference: current.depositReference,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.deposit.reconciled.v1",
						now,
						organizationId: input.organizationId,
						schemaRef:
							"schemas/events/commerce.deposit.reconciled.v1.schema.json",
						tenantId: input.tenantId,
					})
				);
				const updated: DepositRecord = {
					...current,
					confirmedAt: now,
					confirmedByActorUserId: input.actorUserId,
					confirmedByPartyId: confirmerPartyId,
					state: "Reconciled",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateDeposit(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError("version_conflict", "Deposit version is stale");
				}
				const result = depositView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.deposit.confirm",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async createCashMovement(input: {
			actorUserId: string;
			amount: { amountMinor: number; currency: string };
			correlationId: string;
			direction: CashMovementDirection;
			idempotencyKey: string;
			locationId?: string;
			note?: string | null;
			organizationId: string;
			reasonCode: CashMovementReasonCode;
			referenceId?: string | null;
			registerId: string;
			tenantId: string;
		}): Promise<CashMovementView> {
			requirePositiveMinor(input.amount.amountMinor, "amount.amountMinor");
			requireDirectionReasonPairing(input.direction, input.reasonCode);
			const requestFingerprint = await fingerprint({
				amount: input.amount,
				direction: input.direction,
				note: input.note ?? null,
				reasonCode: input.reasonCode,
				referenceId: input.referenceId ?? null,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<CashMovementView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.cash-movement.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const session = await repository.getOpenSession(
					input.tenantId,
					input.organizationId,
					input.registerId,
					input.locationId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Register has no open session accepting cash movements"
					);
				}
				requireMatchingCurrency(session.currency, input.amount.currency);
				// WS3 remediation R1, Finding E: `PaidOut` is the only direction
				// that can drive the register's authoritative expected cash
				// (Finding A's ledger) negative — `PaidIn` never can. This covers
				// EVERY reason code this command accepts with `PaidOut` (`PaidOut`
				// itself, `SafeDrop`, and an `Other` posted with a `PaidOut`
				// direction), not just one named reason code. See
				// `requireCashOutWithinExpectedCash`'s doc comment and
				// `remediation-dispositions.md` "## E".
				if (input.direction === "PaidOut") {
					const expectedCashBeforeMovement = await currentExpectedCashMinor(
						repository,
						input.tenantId,
						session
					);
					requireCashOutWithinExpectedCash(
						expectedCashBeforeMovement,
						input.amount.amountMinor
					);
				}
				const now = options.clock();
				const actorPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const record: CashMovementRecord = {
					actorPartyId,
					actorUserId: input.actorUserId,
					amountMinor: input.amount.amountMinor,
					createdAt: now,
					currency: input.amount.currency,
					direction: input.direction,
					id: options.ids.create("movement"),
					note: input.note ?? null,
					organizationId: input.organizationId,
					reasonCode: input.reasonCode,
					referenceId: input.referenceId ?? null,
					registerId: input.registerId,
					sessionId: session.id,
					tenantId: input.tenantId,
				};
				const saved = await repository.createCashMovement(record);
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.cash-management",
						correlationId: input.correlationId,
						data: {
							actorPartyId,
							amountMinor: saved.amountMinor,
							currency: saved.currency,
							direction: saved.direction,
							movementId: saved.id,
							reasonCode: saved.reasonCode,
							referenceId: saved.referenceId,
							registerId: saved.registerId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.cash-movement.posted.v1",
						now,
						organizationId: saved.organizationId,
						schemaRef:
							"schemas/events/commerce.cash-movement.posted.v1.schema.json",
						tenantId: saved.tenantId,
					})
				);
				const result = cashMovementView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.cash-movement.create",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		// -- WS3 PR4: Deposit, Finance handoff -----------------------------------

		/**
		 * `deposit.create` (frozen control plan §6.6): EFFECT-FREE preparation.
		 * Reserves `countedAmountMinor` against the available safe custody
		 * carried by `sourceShiftIds` and posts NO custody transfer — no row
		 * is ever written to `pos_deposit_custody_transfer` from this method.
		 * The reservation itself is race-safe: `lockSessionsForDeposit` locks
		 * every referenced session row (always sorted ascending, deadlock-free
		 * under concurrent overlapping requests) BEFORE summing the safe-drop
		 * pool and existing reservations, serializing concurrent preparations
		 * against the same sessions exactly like `return.create`'s
		 * `getSale`-then-`sumReturnedQuantity` pattern (round-3 P1-4).
		 */
		async createDeposit(input: {
			actorUserId: string;
			correlationId: string;
			countedAmountMinor: number;
			currency: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			sourceShiftIds: string[];
			tenantId: string;
		}): Promise<DepositView> {
			requireCurrency(input.currency);
			requirePositiveMinor(
				input.countedAmountMinor,
				"countedAmount.amountMinor"
			);
			if (input.sourceShiftIds.length === 0) {
				throw new PosError(
					"validation",
					"A deposit requires at least one source shift"
				);
			}
			const sortedShiftIds = [...new Set(input.sourceShiftIds)].sort();
			const requestFingerprint = await fingerprint({
				countedAmountMinor: input.countedAmountMinor,
				currency: input.currency,
				sourceShiftIds: sortedShiftIds,
			});
			return options.depositUnitOfWork.execute(
				async ({ events, numbering, repository }) => {
					const prior = await replay<DepositView>(repository, {
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.deposit.create",
						requestFingerprint,
						tenantId: input.tenantId,
					});
					if (prior) {
						return prior;
					}
					const sessions = await repository.lockSessionsForDeposit(
						input.tenantId,
						input.organizationId,
						sortedShiftIds,
						input.locationId
					);
					if (sessions.length !== sortedShiftIds.length) {
						throw new PosError(
							"invalid_reference",
							"One or more source shifts were not found"
						);
					}
					for (const session of sessions) {
						requireMatchingCurrency(input.currency, session.currency);
					}
					const safeDropTotalMinor = await repository.sumSafeDropForSessions(
						input.tenantId,
						sortedShiftIds
					);
					const reservedMinor = await repository.sumReservedDepositsForSessions(
						input.tenantId,
						sortedShiftIds
					);
					const availableMinor = safeDropTotalMinor - reservedMinor;
					if (input.countedAmountMinor > availableMinor) {
						throw new PosError(
							"validation",
							"Deposit exceeds available safe custody"
						);
					}
					const now = options.clock();
					const preparerPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});
					const id = options.ids.create("deposit");
					const allocation = await numbering.allocate({
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						depositId: id,
						idempotencyKey: input.idempotencyKey,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});
					const record: DepositRecord = {
						amountMinor: input.countedAmountMinor,
						confirmedAt: null,
						confirmedByActorUserId: null,
						confirmedByPartyId: null,
						createdAt: now,
						currency: input.currency,
						depositReference: allocation.value,
						id,
						organizationId: input.organizationId,
						preparedAt: now,
						preparedByActorUserId: input.actorUserId,
						preparedByPartyId: preparerPartyId,
						sourceShiftIds: sortedShiftIds,
						state: "Prepared",
						tenantId: input.tenantId,
						updatedAt: now,
						version: 1,
					};
					const saved = await repository.createDeposit(record);
					await events.append(
						event({
							actorUserId: input.actorUserId,
							aggregateId: saved.id,
							capabilityId: "commerce.cash-management",
							correlationId: input.correlationId,
							data: {
								amountMinor: saved.amountMinor,
								currency: saved.currency,
								depositId: saved.id,
								depositReference: saved.depositReference,
								preparerPartyId,
								sourceShiftIds: saved.sourceShiftIds,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: input.idempotencyKey,
							name: "commerce.deposit.prepared.v1",
							now,
							organizationId: input.organizationId,
							schemaRef:
								"schemas/events/commerce.deposit.prepared.v1.schema.json",
							tenantId: input.tenantId,
						})
					);
					const result = depositView(saved);
					return recordResult(
						repository,
						{
							idempotencyKey: input.idempotencyKey,
							operation: "commerce.deposit.create",
							requestFingerprint,
							resourceId: saved.id,
							tenantId: saved.tenantId,
						},
						result,
						now
					);
				}
			);
		},

		async createRefund(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			returnId: string;
			tenantId: string;
		}): Promise<RefundView> {
			const requestFingerprint = await fingerprint({
				returnId: input.returnId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RefundView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.refund.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const returnRecord = await repository.getReturn(
					input.tenantId,
					input.organizationId,
					input.returnId
				);
				if (!returnRecord) {
					throw new PosError("not_found", "Return was not found");
				}
				if (returnRecord.state !== "Completed") {
					throw new PosError(
						"invalid_state",
						"Only a Completed return can be refunded"
					);
				}
				if (!returnRecord.receiptId) {
					// Structural refund-without-receipt boundary (Scope: rejected
					// unless PR0 scoped otherwise, which it does not). A
					// Completed return always has a receiptId; this is a
					// defensive backstop, not a reachable path.
					throw new PosError(
						"invalid_reference",
						"Return has no associated receipt"
					);
				}
				const now = options.clock();
				const requesterPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const id = options.ids.create("refund");
				// `amountMinor` is ALWAYS derived from the Return itself, never
				// caller input (frozen control plan §6.4: "requests a cash
				// refund referencing an approved return") — there is no
				// partial-refund amount to validate, and `pos_refund_tenant_
				// return_uidx` caps a Return at exactly one Refund ever, so a
				// second `refund.create` against the same Return fails at the
				// persistence layer rather than silently double-paying.
				const record: RefundRecord = {
					amountMinor: returnRecord.totalRefundableMinor,
					approvedAt: null,
					approvedByActorUserId: null,
					approvedByPartyId: null,
					cashMovementId: null,
					createdAt: now,
					currency: returnRecord.currency,
					id,
					organizationId: input.organizationId,
					registerId: returnRecord.registerId,
					requestedAt: now,
					requestedByActorUserId: input.actorUserId,
					requestedByPartyId: requesterPartyId,
					returnId: returnRecord.id,
					state: "Requested",
					tenantId: input.tenantId,
					updatedAt: now,
					version: 1,
				};
				const saved = await repository.createRefund(record);
				await events.append(
					saleEvent({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.refunds",
						correlationId: input.correlationId,
						data: {
							amountMinor: saved.amountMinor,
							currency: saved.currency,
							reason: returnRecord.reason,
							refundId: saved.id,
							registerId: saved.registerId,
							requesterPartyId,
							returnId: saved.returnId,
							saleId: returnRecord.saleId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.refund.requested.v1",
						now,
						organizationId: input.organizationId,
						schemaRef:
							"schemas/events/commerce.refund.requested.v1.schema.json",
						tenantId: input.tenantId,
					})
				);
				const result = refundView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.refund.create",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async createReturn(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			lines: Array<{ quantity: string; saleLineId: string }>;
			locationId?: string;
			organizationId: string;
			reason: string;
			saleId: string;
			tenantId: string;
		}): Promise<ReturnView> {
			if (input.reason.trim().length === 0) {
				throw new PosError("validation", "A return requires a reason");
			}
			const requestFingerprint = await fingerprint({
				lines: input.lines,
				reason: input.reason,
				saleId: input.saleId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<ReturnView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.return.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				// `getSale` locks the row (`SELECT ... FOR UPDATE`) for the rest
				// of this transaction — the concurrency guard `buildReturnLines`'
				// cumulative-quantity check depends on (see its doc comment and
				// `PosRepository.sumReturnedQuantity`'s).
				const sale = await repository.getSale(
					input.tenantId,
					input.organizationId,
					input.saleId,
					input.locationId
				);
				if (!sale) {
					throw new PosError("not_found", "Sale was not found");
				}
				if (sale.state !== "Completed") {
					throw new PosError(
						"invalid_state",
						"Only a completed sale can be returned"
					);
				}
				const lines = await buildReturnLines(
					repository,
					options.ids,
					sale,
					input.lines
				);
				const now = options.clock();
				const creatorPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const id = options.ids.create("return");
				const record: ReturnRecord = {
					approvedAt: null,
					approvedByActorUserId: null,
					approvedByPartyId: null,
					createdAt: now,
					createdByActorUserId: input.actorUserId,
					createdByPartyId: creatorPartyId,
					currency: sale.currency,
					exchangeSaleId: null,
					id,
					lines,
					mode: "Return",
					organizationId: input.organizationId,
					reason: input.reason,
					receiptId: null,
					registerId: sale.registerId,
					saleId: sale.id,
					state: "Pending",
					tenantId: input.tenantId,
					totalRefundableMinor: lines.reduce(
						(sum, line) => sum + line.lineTotalMinor,
						0
					),
					updatedAt: now,
					version: 1,
				};
				const saved = await repository.createReturn(record);
				const result = returnView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.return.create",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async createSale(input: {
			actorUserId: string;
			correlationId: string;
			currency: string;
			customerPartyId?: string | null;
			idempotencyKey: string;
			lines: Array<{
				discountAmount?: { amountMinor: number; currency: string } | null;
				productId: string;
				quantity: string;
				taxCategory?: SaleLineTaxCategory;
				unit: string;
				unitPrice: { amountMinor: number; currency: string };
				variantId?: string | null;
			}>;
			locationId?: string;
			organizationId: string;
			registerId: string;
			tenantId: string;
		}): Promise<SaleView> {
			requireCurrency(input.currency);
			if (input.lines.length === 0) {
				throw new PosError("validation", "A sale requires at least one line");
			}
			for (const line of input.lines) {
				requireSaleQuantity(line.quantity);
				requireMatchingCurrency(input.currency, line.unitPrice.currency);
				if (line.discountAmount) {
					requireMatchingCurrency(input.currency, line.discountAmount.currency);
				}
			}
			const requestFingerprint = await fingerprint({
				currency: input.currency,
				customerPartyId: input.customerPartyId ?? null,
				lines: input.lines,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<SaleView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.sale.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const session = await repository.getOpenSession(
					input.tenantId,
					input.organizationId,
					input.registerId,
					input.locationId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Sale requires an open register session"
					);
				}
				requireMatchingCurrency(session.currency, input.currency);
				const now = options.clock();
				const creatorPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const lines = await Promise.all(
					input.lines.map((lineInput) =>
						priceSaleLine(options, input.tenantId, lineInput)
					)
				);
				const id = options.ids.create("sale");
				const record: SaleRecord = {
					changeMinor: null,
					completedAt: null,
					createdAt: now,
					createdByActorUserId: input.actorUserId,
					createdByPartyId: creatorPartyId,
					currency: input.currency,
					customerPartyId: input.customerPartyId ?? null,
					discountMinor: lines.reduce(
						(sum, line) => sum + line.discountMinor,
						0
					),
					grossMinor: lines.reduce((sum, line) => sum + line.grossMinor, 0),
					heldAt: null,
					id,
					lines,
					locationId: session.locationId,
					organizationId: input.organizationId,
					receiptId: null,
					registerId: input.registerId,
					sessionId: session.id,
					state: "Open",
					taxMinor: lines.reduce((sum, line) => sum + line.taxAmountMinor, 0),
					tenantId: input.tenantId,
					tenderedMinor: null,
					tendersMinor: null,
					totalMinor: lines.reduce((sum, line) => sum + line.lineTotalMinor, 0),
					updatedAt: now,
					version: 1,
				};
				const saved = await repository.createSale(record);
				const result = saleView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.sale.create",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		/** WS3 remediation R3, Finding I. */
		async getDeposit(
			tenantId: string,
			organizationId: string,
			depositId: string
		): Promise<DepositView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getDeposit(tenantId, organizationId, depositId)
			);
			if (!record) {
				throw new PosError("not_found", "Deposit was not found");
			}
			return depositView(record);
		},

		async getReceipt(
			tenantId: string,
			organizationId: string,
			receiptId: string
		): Promise<ReceiptView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getReceipt(tenantId, organizationId, receiptId)
			);
			if (!record) {
				throw new PosError("not_found", "Receipt was not found");
			}
			return receiptView(record);
		},

		/** WS3 remediation R3, Finding J. */
		async getReceiptByNumber(
			tenantId: string,
			organizationId: string,
			registerId: string,
			receiptNumber: string
		): Promise<ReceiptView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getReceiptByNumber(
					tenantId,
					organizationId,
					registerId,
					receiptNumber
				)
			);
			if (!record) {
				throw new PosError("not_found", "Receipt was not found");
			}
			return receiptView(record);
		},

		/** WS3 remediation R3, Finding I. */
		async getRefund(
			tenantId: string,
			organizationId: string,
			refundId: string
		): Promise<RefundView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getRefund(tenantId, organizationId, refundId)
			);
			if (!record) {
				throw new PosError("not_found", "Refund was not found");
			}
			return refundView(record);
		},

		/** WS3 remediation R3b cycle 1 (adversarial re-review): `locationId` is
		 * optional and, like `approveCashVariance`'s identical parameter,
		 * MUST be threaded by every caller that has an active
		 * location-scoped context — `repository.getSession` already treats
		 * `undefined` as a no-op filter (R2, Finding B), so an org-wide
		 * caller passing nothing is unaffected. Before this fix neither
		 * application-layer preview read below (`getCashVariance`,
		 * `getRegisterSession`) could pass a location at all, so a
		 * location-scoped approver could read (though not approve) another
		 * location's full session detail — expected cash, variance amount —
		 * by ID. */
		async getRegisterSession(
			tenantId: string,
			organizationId: string,
			sessionId: string,
			locationId?: string
		): Promise<RegisterSessionView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getSession(tenantId, organizationId, sessionId, locationId)
			);
			if (!record) {
				throw new PosError("not_found", "Register session was not found");
			}
			return registerSessionView(record);
		},

		/** WS3 remediation R3, Finding I. Same pre-commit consequence-preview
		 * read `getReceipt` already realizes for void/reissue, applied to
		 * Return so `commerce.return.approve`'s approver sees server-derived
		 * context before committing rather than only the ID they typed. */
		async getReturn(
			tenantId: string,
			organizationId: string,
			returnId: string
		): Promise<ReturnView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getReturn(tenantId, organizationId, returnId)
			);
			if (!record) {
				throw new PosError("not_found", "Return was not found");
			}
			return returnView(record);
		},

		/** WS3 remediation R3, Finding J (part 2): resolves a receiptNumber +
		 * registerId (both printed on `ReceiptLayout`) all the way to the
		 * originating Sale — `getReceiptByNumber` above stops at the Receipt,
		 * which is not enough to build a return (see the contract's doc
		 * comment). Mirrors `requireVoidableSale`'s exact
		 * "receipt.kind !== 'Sale' || !receipt.saleId" validity check, and
		 * `createReturn`'s own `repository.getSale(..., locationId)` call —
		 * a location-scoped actor previewing a sale here sees exactly the
		 * scope they could actually return against. */
		getSaleForReturn(
			tenantId: string,
			organizationId: string,
			locationId: string | undefined,
			registerId: string,
			receiptNumber: string
		): Promise<SaleView> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const receipt = await repository.getReceiptByNumber(
					tenantId,
					organizationId,
					registerId,
					receiptNumber
				);
				if (!receipt) {
					throw new PosError("not_found", "Receipt was not found");
				}
				if (receipt.kind !== "Sale" || !receipt.saleId) {
					throw new PosError(
						"invalid_state",
						"Only a Sale receipt has a returnable sale"
					);
				}
				const sale = await repository.getSale(
					tenantId,
					organizationId,
					receipt.saleId,
					locationId
				);
				if (!sale) {
					throw new PosError("not_found", "Sale was not found");
				}
				return saleView(sale);
			});
		},

		async holdSale(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			reason?: string | null;
			saleId: string;
			tenantId: string;
		}): Promise<SaleView> {
			const requestFingerprint = await fingerprint({
				reason: input.reason ?? null,
				saleId: input.saleId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<SaleView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.sale.hold",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getSale(
					input.tenantId,
					input.organizationId,
					input.saleId,
					input.locationId
				);
				if (!current) {
					throw new PosError("not_found", "Sale was not found");
				}
				if (current.state !== "Open") {
					throw new PosError("invalid_state", "Only an Open sale can be held");
				}
				const now = options.clock();
				const actorPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const updated: SaleRecord = {
					...current,
					heldAt: now,
					state: "Held",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateSale(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError("version_conflict", "Sale version is stale");
				}
				await events.append(
					saleEvent({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.order-management",
						correlationId: input.correlationId,
						data: {
							actorPartyId,
							reason: input.reason ?? null,
							registerId: saved.registerId,
							saleId: saved.id,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.sale.held.v1",
						now,
						organizationId: saved.organizationId,
						schemaRef: "schemas/events/commerce.sale.held.v1.schema.json",
						tenantId: saved.tenantId,
					})
				);
				const result = saleView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.sale.hold",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		/** WS3 remediation R3b, Item 7 (server-backed discovery). */
		async listDeposits(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: DepositRecord["state"] }
		): Promise<PosPage<DepositView>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listDeposits(tenantId, organizationId, page, filters)
			);
			return {
				items: result.items.map(depositView),
				nextCursor: result.nextCursor,
			};
		},

		/** WS3 remediation R3b, Item 7 (server-backed discovery). */
		async listPriceOverrides(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: PriceOverrideRecord["state"] }
		): Promise<PosPage<PriceOverrideView>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listPriceOverrides(tenantId, organizationId, page, filters)
			);
			return {
				items: result.items.map(priceOverrideView),
				nextCursor: result.nextCursor,
			};
		},

		/** WS3 remediation R3b, Item 7 (server-backed discovery). */
		async listRefunds(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: RefundRecord["state"] }
		): Promise<PosPage<RefundView>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listRefunds(tenantId, organizationId, page, filters)
			);
			return {
				items: result.items.map(refundView),
				nextCursor: result.nextCursor,
			};
		},

		/** WS3 remediation R3b, Item 7 (server-backed discovery). */
		async listReturns(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: ReturnRecord["state"] }
		): Promise<PosPage<ReturnView>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listReturns(tenantId, organizationId, page, filters)
			);
			return {
				items: result.items.map(returnView),
				nextCursor: result.nextCursor,
			};
		},

		/** WS3 remediation R3b, Item 7 (server-backed discovery). */
		async listSessions(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: {
				locationId?: string;
				state?: RegisterSessionRecord["state"];
			}
		): Promise<PosPage<RegisterSessionView>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listSessions(tenantId, organizationId, page, filters)
			);
			return {
				items: result.items.map(registerSessionView),
				nextCursor: result.nextCursor,
			};
		},

		async openRegister(input: {
			actorUserId: string;
			correlationId: string;
			currency: string;
			idempotencyKey: string;
			locationId: string;
			openingFloat: { amountMinor: number; currency: string };
			organizationId: string;
			registerId: string;
			tenantId: string;
		}): Promise<RegisterSessionView> {
			requireCurrency(input.currency);
			requireMatchingCurrency(input.currency, input.openingFloat.currency);
			requireNonNegativeMinor(
				input.openingFloat.amountMinor,
				"openingFloat.amountMinor"
			);
			const requestFingerprint = await fingerprint({
				currency: input.currency,
				locationId: input.locationId,
				openingFloat: input.openingFloat,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.register.open",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const openerPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const id = options.ids.create("session");
				const record: RegisterSessionRecord = {
					closedAt: null,
					closedByActorUserId: null,
					closedByPartyId: null,
					closeReason: null,
					closeRequestedAt: null,
					countedCashMinor: null,
					createdAt: now,
					currency: input.currency,
					expectedCashMinor: null,
					id,
					locationId: input.locationId,
					openedAt: now,
					openedByActorUserId: input.actorUserId,
					openedByPartyId: openerPartyId,
					openingFloatMinor: input.openingFloat.amountMinor,
					organizationId: input.organizationId,
					registerId: input.registerId,
					state: "Open",
					tenantId: input.tenantId,
					updatedAt: now,
					varianceApprovalRequired: false,
					varianceApprovedAt: null,
					varianceApprovedByActorUserId: null,
					varianceApprovedByPartyId: null,
					varianceMinor: null,
					version: 1,
				};
				const inserted = await repository.openRegister(record);
				if (inserted === "already_open") {
					throw new PosError(
						"invalid_state",
						"Register already has an open session"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: inserted.id,
						capabilityId: "commerce.register-management",
						correlationId: input.correlationId,
						data: {
							currency: inserted.currency,
							locationId: inserted.locationId,
							openerPartyId,
							openingFloatMinor: inserted.openingFloatMinor,
							registerId: inserted.registerId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.register.opened.v1",
						now,
						organizationId: inserted.organizationId,
						schemaRef: "schemas/events/commerce.register.opened.v1.schema.json",
						tenantId: inserted.tenantId,
					})
				);
				const result = registerSessionView(inserted);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.register.open",
						requestFingerprint,
						resourceId: inserted.id,
						tenantId: inserted.tenantId,
					},
					result,
					now
				);
			});
		},

		/**
		 * Bounded read used ONLY by the accountant handoff export composition
		 * (WS3 PR4 §8.1) — not a permissioned POS command in its own right;
		 * the caller's `platform.export.create`/`.read` authorization already
		 * gates access before this is ever invoked, mirroring how `products`
		 * (in `apps/server/composition/pos.ts`) is an unauthenticated
		 * cross-domain read protected by its OWN caller's permission check.
		 */
		queryFinanceHandoffSourceData(input: {
			organizationId: string;
			periodEndUtc: Date;
			periodStartUtc: Date;
			tenantId: string;
		}): Promise<PosFinanceHandoffSourceData> {
			return options.unitOfWork.execute(({ repository }) =>
				repository.queryFinanceHandoffSourceData(input)
			);
		},

		// -- WS3 PR3: Receipt reissue and gift receipt ---------------------------

		/** Reprints an existing receipt as a new numbered `Reissue`-kind
		 * artifact linked to the original — own permission
		 * (`commerce.receipt.reissue`), no monetary effect on the Sale/Return
		 * it references. `priceSuppressed: true` realizes `commerce.gift-
		 * receipts` (frozen control plan §5 capability table): the SAME
		 * command, with the reissued copy's monetary line fields zeroed and
		 * its `totalMinor`/`tenders` suppressed, per the stage file's "price-
		 * suppressed receipt variant" framing — no separate gift-receipt
		 * command exists, and none is invented. */
		async reissueReceipt(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			priceSuppressed?: boolean;
			receiptId: string;
			tenantId: string;
		}): Promise<ReceiptView> {
			const priceSuppressed = input.priceSuppressed ?? false;
			const requestFingerprint = await fingerprint({
				priceSuppressed,
				receiptId: input.receiptId,
			});
			return options.returnUnitOfWork.execute(
				async ({ events, numbering, repository }) => {
					const prior = await replay<ReceiptView>(repository, {
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.receipt.reissue",
						requestFingerprint,
						tenantId: input.tenantId,
					});
					if (prior) {
						return prior;
					}
					const original = await repository.getReceipt(
						input.tenantId,
						input.organizationId,
						input.receiptId
					);
					if (!original) {
						throw new PosError("not_found", "Receipt was not found");
					}
					if (original.kind === "Reissue") {
						throw new PosError(
							"invalid_state",
							"A Reissue receipt cannot itself be reissued; reissue the original"
						);
					}
					const now = options.clock();
					const actorPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});
					const allocation = await numbering.allocate({
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						idempotencyKey: input.idempotencyKey,
						organizationId: input.organizationId,
						registerId: original.registerId,
						saleId: original.id,
						tenantId: input.tenantId,
					});
					const receiptId = options.ids.create("receipt");
					const record: ReceiptRecord = {
						cashierPartyId: actorPartyId,
						createdAt: now,
						currency: original.currency,
						id: receiptId,
						issuedAt: now,
						kind: "Reissue",
						lines: original.lines.map((line) =>
							priceSuppressed
								? {
										...line,
										discountMinor: 0,
										lineTotalMinor: 0,
										taxAmountMinor: 0,
										taxableBaseMinor: 0,
										unitPriceMinor: 0,
									}
								: line
						),
						organizationId: input.organizationId,
						originalReceiptId: original.id,
						priceSuppressed,
						receiptNumber: allocation.value,
						registerId: original.registerId,
						returnId: original.returnId,
						saleId: original.saleId,
						tenantId: input.tenantId,
						tenders: priceSuppressed ? [] : original.tenders,
						totalMinor: priceSuppressed ? null : original.totalMinor,
					};
					const saved = await repository.createReceipt(record);
					await events.append(
						saleEvent({
							actorUserId: input.actorUserId,
							aggregateId: saved.id,
							capabilityId: "commerce.receipts",
							correlationId: input.correlationId,
							data: {
								currency: saved.currency,
								kind: "Reissue",
								originalReceiptId: original.id,
								priceSuppressed,
								receiptId: saved.id,
								receiptNumber: saved.receiptNumber,
								registerId: saved.registerId,
								returnId: saved.returnId,
								saleId: saved.saleId,
								totalMinor: saved.totalMinor,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: input.idempotencyKey,
							name: "commerce.receipt.issued.v1",
							now,
							organizationId: input.organizationId,
							schemaRef:
								"schemas/events/commerce.receipt.issued.v1.schema.json",
							tenantId: input.tenantId,
						})
					);
					const result = receiptView(saved);
					return recordResult(
						repository,
						{
							idempotencyKey: input.idempotencyKey,
							operation: "commerce.receipt.reissue",
							requestFingerprint,
							resourceId: saved.id,
							tenantId: saved.tenantId,
						},
						result,
						now
					);
				}
			);
		},

		async requestPriceOverride(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			lineId: string;
			locationId?: string;
			organizationId: string;
			reason: string;
			requestedPrice: { amountMinor: number; currency: string };
			saleId: string;
			tenantId: string;
		}): Promise<SaleView> {
			const requestFingerprint = await fingerprint({
				lineId: input.lineId,
				reason: input.reason,
				requestedPrice: input.requestedPrice,
				saleId: input.saleId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<SaleView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.price-override.request",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const sale = await repository.getSale(
					input.tenantId,
					input.organizationId,
					input.saleId,
					input.locationId
				);
				if (!sale) {
					throw new PosError("not_found", "Sale was not found");
				}
				if (sale.state === "Completed") {
					throw new PosError(
						"invalid_state",
						"A completed sale cannot receive a price override"
					);
				}
				const line = sale.lines.find(
					(candidate) => candidate.id === input.lineId
				);
				if (!line) {
					throw new PosError("invalid_reference", "Sale line was not found");
				}
				requireMatchingCurrency(sale.currency, input.requestedPrice.currency);
				const now = options.clock();
				const requesterPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const overrideId = options.ids.create("price-override");
				const overrideRecord: PriceOverrideRecord = {
					approvedAt: null,
					approvedByActorUserId: null,
					approvedByPartyId: null,
					currency: input.requestedPrice.currency,
					id: overrideId,
					lineId: input.lineId,
					organizationId: input.organizationId,
					reason: input.reason,
					requestedAt: now,
					requestedByActorUserId: input.actorUserId,
					requestedByPartyId: requesterPartyId,
					requestedPriceMinor: input.requestedPrice.amountMinor,
					saleId: sale.id,
					state: "Pending",
					tenantId: input.tenantId,
					version: 1,
				};
				await repository.createPriceOverride(overrideRecord);
				const updatedLines = sale.lines.map((candidate) =>
					candidate.id === input.lineId
						? {
								...candidate,
								priceOverrideId: overrideId,
								priceOverrideState: "Pending" as const,
							}
						: candidate
				);
				const updatedSale: SaleRecord = {
					...sale,
					lines: updatedLines,
					state: sale.state === "Held" ? "Open" : sale.state,
					updatedAt: now,
					version: sale.version + 1,
				};
				const saved = await repository.updateSale(updatedSale, sale.version);
				if (saved === "version_conflict") {
					throw new PosError("version_conflict", "Sale version is stale");
				}
				const result = saleView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.price-override.request",
						requestFingerprint,
						resourceId: overrideId,
						tenantId: sale.tenantId,
					},
					result,
					now
				);
			});
		},

		// -- WS3 PR3: Void ---------------------------------------------------------

		/** Same-day/open-session administrative reversal of a Sale (frozen
		 * control plan Scope) — a full compensation with its own permission
		 * (`commerce.receipt.void`), NOT a maker/checker pair and NOT a
		 * delete: the original Sale row is untouched, and this posts exactly
		 * the same Inventory-compensation + Return-receipt shape
		 * `approveReturn` does, atomically, in one call. "Same-day" is
		 * realized as the open-session boundary (no timezone port exists on
		 * this branch — a disclosed prototype-depth decision, not an
		 * invented one: in practice a register session never spans more than
		 * one business day, so requiring the ORIGINAL sale's register
		 * session to still be open is the same custody-linked boundary
		 * `sale.complete` itself already enforces via
		 * `requireCompletableSale`, reused here rather than inventing a
		 * separate calendar-date comparison this branch cannot honor
		 * correctly across timezones). Voids whatever quantity REMAINS
		 * unreturned per line (so a sale partially returned earlier in the
		 * same session voids only its remainder, never double-compensating
		 * the portion already returned). WS3 remediation R1 cycle 2: since
		 * every voidable sale is, by construction, a completed CASH sale
		 * (Finding A posted its `PaidIn` proceeds), this also posts the
		 * mirror `PaidOut` cash-ledger entry for the voided remainder,
		 * guarded by Finding E's fail-closed
		 * `requireCashOutWithinExpectedCash` check, atomically in the SAME
		 * transaction — see the inline comment at the posting site and
		 * `remediation-dispositions.md` "## A". */
		async voidReceipt(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			locationId?: string;
			organizationId: string;
			reason?: string | null;
			receiptId: string;
			tenantId: string;
		}): Promise<ReturnView> {
			const requestFingerprint = await fingerprint({
				reason: input.reason ?? null,
				receiptId: input.receiptId,
			});
			return options.returnUnitOfWork.execute(
				async ({ events, inventory, numbering, repository }) => {
					const prior = await replay<ReturnView>(repository, {
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.receipt.void",
						requestFingerprint,
						tenantId: input.tenantId,
					});
					if (prior) {
						return prior;
					}
					const { receipt, sale, session } = await requireVoidableSale(
						repository,
						input.tenantId,
						input.organizationId,
						input.receiptId,
						input.locationId
					);
					const lines = await buildVoidLines(repository, options.ids, sale);
					const now = options.clock();
					const actorPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});
					const returnId = options.ids.create("return");
					const totalRefundableMinor = lines.reduce(
						(sum, line) => sum + line.lineTotalMinor,
						0
					);

					// WS3 remediation R1 cycle 2 (closes the gap the adversarial
					// re-review found in Finding A's original fix): every sale
					// `voidReceipt` can reach is `state === "Completed"`, and
					// `completeSale` accepts ONLY `Cash` tenders at this
					// prototype depth (`requireCashOnlyTenders`) — so every
					// voidable sale already has a `PaidIn` cash-ledger entry
					// (Finding A) sitting in `netCashMovements` for its full
					// proceeds. `pr3-returns.md` describes void as "a full
					// compensation," explicitly distinct from receipt reissue,
					// which the same spec marks "no monetary effect" — so void
					// must reverse that same cash-in on the SAME authoritative
					// ledger `closeRegister`/`currentExpectedCashMinor` reads,
					// exactly as `approveRefund` reverses a sale's proceeds via
					// its own `Refund`/`PaidOut` posting. Without this, the
					// voided sale's `PaidIn` entry stays in the ledger forever
					// and `closeRegister` overstates expected cash by exactly
					// the voided sale's proceeds for the rest of the session —
					// a direct violation of Finding A's own closing criterion.
					// Reuses Finding E's fail-closed guard
					// (`requireCashOutWithinExpectedCash`), checked and posted
					// BEFORE the Inventory reversal, numbering allocation, or
					// any receipt/Return write below — not merely before the
					// cash-ledger row itself — so a rejected void leaves
					// GENUINELY zero side effects rather than relying solely
					// on the surrounding DB transaction's rollback to erase
					// work already dispatched to other ports. Posts under
					// `reasonCode: "Refund"` (the schema's existing reason for
					// a cash-out compensating a prior sale — `approveRefund`
					// uses the same code for the same reason) with
					// `referenceId: returnId` naming this void's own Return
					// record, and mirrors `completeSale`'s own zero-amount
					// guard: a void with nothing left to refund (a
					// fully-discounted remainder) posts no ledger row.
					if (totalRefundableMinor > 0) {
						const expectedCashBeforeVoid = await currentExpectedCashMinor(
							repository,
							input.tenantId,
							session
						);
						requireCashOutWithinExpectedCash(
							expectedCashBeforeVoid,
							totalRefundableMinor
						);
						const voidCashMovementId = options.ids.create("movement");
						const voidCashMovement = await repository.createCashMovement({
							actorPartyId,
							actorUserId: input.actorUserId,
							amountMinor: totalRefundableMinor,
							createdAt: now,
							currency: sale.currency,
							direction: "PaidOut",
							id: voidCashMovementId,
							note: "Void of completed sale",
							organizationId: input.organizationId,
							reasonCode: "Refund",
							referenceId: returnId,
							registerId: sale.registerId,
							sessionId: session.id,
							tenantId: input.tenantId,
						});
						await events.append(
							event({
								actorUserId: input.actorUserId,
								aggregateId: voidCashMovement.id,
								capabilityId: "commerce.cash-management",
								correlationId: input.correlationId,
								data: {
									actorPartyId,
									amountMinor: voidCashMovement.amountMinor,
									currency: voidCashMovement.currency,
									direction: voidCashMovement.direction,
									movementId: voidCashMovement.id,
									reasonCode: voidCashMovement.reasonCode,
									referenceId: voidCashMovement.referenceId,
									registerId: voidCashMovement.registerId,
								},
								eventId: options.ids.create("event"),
								idempotencyKey: `${input.idempotencyKey}:cash-movement`,
								name: "commerce.cash-movement.posted.v1",
								now,
								organizationId: input.organizationId,
								schemaRef:
									"schemas/events/commerce.cash-movement.posted.v1.schema.json",
								tenantId: input.tenantId,
							})
						);
					}

					await postReturnCompensatingMovements(inventory, sale, lines, {
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						returnId,
						tenantId: input.tenantId,
					});

					const allocation = await numbering.allocate({
						actorUserId: input.actorUserId,
						correlationId: input.correlationId,
						idempotencyKey: input.idempotencyKey,
						organizationId: input.organizationId,
						registerId: sale.registerId,
						saleId: returnId,
						tenantId: input.tenantId,
					});

					const receiptId = options.ids.create("receipt");
					const voidReceiptRecord = buildReturnReceiptRecord({
						cashierPartyId: actorPartyId,
						currency: sale.currency,
						id: receiptId,
						issuedAt: now,
						lines,
						organizationId: input.organizationId,
						originalReceiptId: receipt.id,
						receiptNumber: allocation.value,
						registerId: sale.registerId,
						returnId,
						saleId: sale.id,
						tenantId: input.tenantId,
						totalMinor: totalRefundableMinor,
					});
					await repository.createReceipt(voidReceiptRecord);

					const returnRecord: ReturnRecord = {
						approvedAt: now,
						approvedByActorUserId: input.actorUserId,
						approvedByPartyId: actorPartyId,
						createdAt: now,
						createdByActorUserId: input.actorUserId,
						createdByPartyId: actorPartyId,
						currency: sale.currency,
						exchangeSaleId: null,
						id: returnId,
						lines,
						mode: "Void",
						organizationId: input.organizationId,
						reason: (input.reason ?? "").trim() || "Void",
						receiptId,
						registerId: sale.registerId,
						saleId: sale.id,
						state: "Completed",
						tenantId: input.tenantId,
						totalRefundableMinor,
						updatedAt: now,
						version: 1,
					};
					const savedReturn = await repository.createReturn(returnRecord);

					await emitReturnCompletionEvents(
						events,
						options.ids,
						savedReturn,
						voidReceiptRecord,
						{
							actorUserId: input.actorUserId,
							correlationId: input.correlationId,
							idempotencyKey: input.idempotencyKey,
							now,
						}
					);

					const result = returnView(savedReturn);
					return recordResult(
						repository,
						{
							idempotencyKey: input.idempotencyKey,
							operation: "commerce.receipt.void",
							requestFingerprint,
							resourceId: savedReturn.id,
							tenantId: savedReturn.tenantId,
						},
						result,
						now
					);
				}
			);
		},
	};
}

// ---------------------------------------------------------------------------
// Application layer: active-context, permission, and entitlement enforcement
// BEFORE service dispatch (WS1/WS2 pattern; CLAUDE.md §5).
// ---------------------------------------------------------------------------

export interface PosActiveContextPort {
	/** `locationId` (WS3 remediation R2, Finding B) is present only when the
	 * caller's active tenancy context is scoped to a specific location
	 * (`@meridian/platform-tenancy`'s `ActiveContextRecord.locationId`,
	 * already optional there) — an organization-scoped-only actor has none,
	 * and every location filter downstream treats `undefined` as a no-op,
	 * never as "deny everything" or "allow everything." */
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{
		locationId?: string;
		organizationId: string;
		tenantId: string;
	}>;
}

export type PosPermission =
	| "commerce.cash-movement.create"
	| "commerce.cash-variance.approve"
	| "commerce.deposit.confirm"
	| "commerce.deposit.create"
	| "commerce.price-override.approve"
	| "commerce.price-override.request"
	| "commerce.receipt.read"
	| "commerce.receipt.reissue"
	| "commerce.receipt.void"
	| "commerce.refund.approve"
	| "commerce.refund.create"
	| "commerce.register.close"
	| "commerce.register.open"
	| "commerce.return.approve"
	| "commerce.return.create"
	| "commerce.sale.complete"
	| "commerce.sale.create"
	| "commerce.sale.hold";

export interface PosPermissionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PosPermission;
		sessionId: string;
	}) => Promise<unknown>;
}

export interface PosEntitlementPort {
	requireEntitlement: (input: {
		access: "Read" | "Write";
		capabilityId:
			| "commerce.cash-management"
			| "commerce.order-management"
			| "commerce.receipts"
			| "commerce.refunds"
			| "commerce.register-management"
			| "commerce.returns";
		organizationId: string;
		tenantId: string;
	}) => Promise<unknown>;
}

export function createPosApplication(options: {
	activeContexts: PosActiveContextPort;
	entitlements: PosEntitlementPort;
	permissions: PosPermissionPort;
	service: ReturnType<typeof createPosService>;
}) {
	async function authorize(input: {
		access?: "Read" | "Write";
		assuranceLevel?: string;
		authUserId: string;
		capabilityId: Parameters<
			PosEntitlementPort["requireEntitlement"]
		>[0]["capabilityId"];
		contextId: string;
		permission: PosPermission;
		sessionId: string;
	}) {
		const context = await options.activeContexts.requireActiveContext(input);
		await options.permissions.requirePermission({
			assuranceLevel: input.assuranceLevel ?? "aal1",
			authUserId: input.authUserId,
			contextId: input.contextId,
			permission: input.permission,
			sessionId: input.sessionId,
		});
		await options.entitlements.requireEntitlement({
			access: input.access ?? "Write",
			capabilityId: input.capabilityId,
			organizationId: context.organizationId,
			tenantId: context.tenantId,
		});
		return context;
	}

	return {
		async approveCashVariance(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			registerSessionId: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.cash-variance.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveCashVariance({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				sessionId: input.registerSessionId,
				tenantId: context.tenantId,
				version: input.version,
			});
		},

		// -- WS3 PR2: Sale, PriceOverride, Receipt -------------------------------

		async approvePriceOverride(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			overrideId: string;
			saleId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.price-override.approve",
				sessionId: input.sessionId,
			});
			return options.service.approvePriceOverride({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				overrideId: input.overrideId,
				saleId: input.saleId,
				tenantId: context.tenantId,
			});
		},
		async approveRefund(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			refundId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.refunds",
				contextId: input.contextId,
				permission: "commerce.refund.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveRefund({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				refundId: input.refundId,
				tenantId: context.tenantId,
			});
		},
		async approveReturn(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			returnId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.returns",
				contextId: input.contextId,
				permission: "commerce.return.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveReturn({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				returnId: input.returnId,
				tenantId: context.tenantId,
			});
		},
		async closeRegister(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			countedCash: { amountMinor: number; currency: string };
			idempotencyKey: string;
			reason?: string | null;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.register.close",
				sessionId: input.sessionId,
			});
			return options.service.closeRegister({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				countedCash: input.countedCash,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				reason: input.reason,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
		async completeSale(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			exchangeOfReturnId?: string | null;
			idempotencyKey: string;
			saleId: string;
			sessionId: string;
			tenders: Array<{
				amountMinor: number;
				currency: string;
				referenceId?: string | null;
				type: "Cash" | "PaymentIntent" | "StoredValue";
			}>;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.sale.complete",
				sessionId: input.sessionId,
			});
			return options.service.completeSale({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				exchangeOfReturnId: input.exchangeOfReturnId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				saleId: input.saleId,
				tenantId: context.tenantId,
				tenders: input.tenders,
			});
		},

		// -- WS3 PR4: Deposit -----------------------------------------------------

		async confirmDeposit(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			depositId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.deposit.confirm",
				sessionId: input.sessionId,
			});
			return options.service.confirmDeposit({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				depositId: input.depositId,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async createCashMovement(input: {
			actorUserId: string;
			amount: { amountMinor: number; currency: string };
			contextId: string;
			correlationId: string;
			direction: CashMovementDirection;
			idempotencyKey: string;
			note?: string | null;
			reasonCode: CashMovementReasonCode;
			referenceId?: string | null;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.cash-movement.create",
				sessionId: input.sessionId,
			});
			return options.service.createCashMovement({
				actorUserId: input.actorUserId,
				amount: input.amount,
				correlationId: input.correlationId,
				direction: input.direction,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				note: input.note,
				organizationId: context.organizationId,
				reasonCode: input.reasonCode,
				referenceId: input.referenceId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},

		async createDeposit(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			countedAmountMinor: number;
			currency: string;
			idempotencyKey: string;
			sessionId: string;
			sourceShiftIds: string[];
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.deposit.create",
				sessionId: input.sessionId,
			});
			return options.service.createDeposit({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				countedAmountMinor: input.countedAmountMinor,
				currency: input.currency,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				sourceShiftIds: input.sourceShiftIds,
				tenantId: context.tenantId,
			});
		},
		async createRefund(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			returnId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.refunds",
				contextId: input.contextId,
				permission: "commerce.refund.create",
				sessionId: input.sessionId,
			});
			return options.service.createRefund({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				returnId: input.returnId,
				tenantId: context.tenantId,
			});
		},
		async createReturn(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			lines: Array<{ quantity: string; saleLineId: string }>;
			reason: string;
			saleId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.returns",
				contextId: input.contextId,
				permission: "commerce.return.create",
				sessionId: input.sessionId,
			});
			return options.service.createReturn({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				lines: input.lines,
				locationId: context.locationId,
				organizationId: context.organizationId,
				reason: input.reason,
				saleId: input.saleId,
				tenantId: context.tenantId,
			});
		},
		async createSale(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			currency: string;
			customerPartyId?: string | null;
			idempotencyKey: string;
			lines: Array<{
				discountAmount?: { amountMinor: number; currency: string } | null;
				productId: string;
				quantity: string;
				taxCategory?: SaleLineTaxCategory;
				unit: string;
				unitPrice: { amountMinor: number; currency: string };
				variantId?: string | null;
			}>;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.sale.create",
				sessionId: input.sessionId,
			});
			return options.service.createSale({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				currency: input.currency,
				customerPartyId: input.customerPartyId,
				idempotencyKey: input.idempotencyKey,
				lines: input.lines,
				locationId: context.locationId,
				organizationId: context.organizationId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
		/** WS3 remediation R3, Finding I: the SAME register-session read as
		 * `getRegisterSession` above, but gated on `commerce.cash-variance.
		 * approve` instead — the variance approver and the closer are
		 * different Parties by Finding C's separation-of-duties rule and are
		 * not guaranteed to hold each other's permission, so this is a
		 * second thin operation over the identical underlying read rather
		 * than one operation gated on either permission (this codebase's
		 * permission check is single-permission-per-procedure throughout;
		 * see `PosPermissionPort`/`requirePermission`). `varianceId` IS the
		 * register session id, matching `approveCashVariance`'s existing
		 * `{varianceId}` route param and `VarianceApproveForm`'s "Variance /
		 * register session ID" field exactly. */
		async getCashVariance(input: {
			actorUserId: string;
			contextId: string;
			sessionId: string;
			varianceId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.cash-variance.approve",
				sessionId: input.sessionId,
			});
			return options.service.getRegisterSession(
				context.tenantId,
				context.organizationId,
				input.varianceId,
				context.locationId
			);
		},
		/** WS3 remediation R3, Finding I. */
		async getDeposit(input: {
			actorUserId: string;
			contextId: string;
			depositId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.deposit.confirm",
				sessionId: input.sessionId,
			});
			return options.service.getDeposit(
				context.tenantId,
				context.organizationId,
				input.depositId
			);
		},
		async getReceipt(input: {
			actorUserId: string;
			contextId: string;
			receiptId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.receipts",
				contextId: input.contextId,
				permission: "commerce.receipt.read",
				sessionId: input.sessionId,
			});
			return options.service.getReceipt(
				context.tenantId,
				context.organizationId,
				input.receiptId
			);
		},
		/** WS3 remediation R3, Finding J: resolves a human-legible printed
		 * reference (receiptNumber + registerId, both on `ReceiptLayout`) to
		 * the receipt (and, via its `saleId`, the return path) — the SAME
		 * `commerce.receipt.read` permission `getReceipt` already requires,
		 * no new permission invented. */
		async getReceiptByNumber(input: {
			actorUserId: string;
			contextId: string;
			receiptNumber: string;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.receipts",
				contextId: input.contextId,
				permission: "commerce.receipt.read",
				sessionId: input.sessionId,
			});
			return options.service.getReceiptByNumber(
				context.tenantId,
				context.organizationId,
				input.registerId,
				input.receiptNumber
			);
		},
		/** WS3 remediation R3, Finding I. */
		async getRefund(input: {
			actorUserId: string;
			contextId: string;
			refundId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.refunds",
				contextId: input.contextId,
				permission: "commerce.refund.approve",
				sessionId: input.sessionId,
			});
			return options.service.getRefund(
				context.tenantId,
				context.organizationId,
				input.refundId
			);
		},
		/** WS3 remediation R3, Finding I: pre-commit consequence preview for
		 * `commerce.register.close` (the closer's own upcoming action). */
		async getRegisterSession(input: {
			actorUserId: string;
			contextId: string;
			registerSessionId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.register.close",
				sessionId: input.sessionId,
			});
			return options.service.getRegisterSession(
				context.tenantId,
				context.organizationId,
				input.registerSessionId,
				context.locationId
			);
		},
		/** WS3 remediation R3, Finding I: pre-commit consequence preview for
		 * `commerce.return.approve` — reuses that exact permission (an
		 * approver may, by definition, also preview) rather than inventing a
		 * dedicated read permission. */
		async getReturn(input: {
			actorUserId: string;
			contextId: string;
			returnId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.returns",
				contextId: input.contextId,
				permission: "commerce.return.approve",
				sessionId: input.sessionId,
			});
			return options.service.getReturn(
				context.tenantId,
				context.organizationId,
				input.returnId
			);
		},
		/** WS3 remediation R3, Finding J (part 2): completes the
		 * receipt-to-return path — gated on `commerce.return.create` (the
		 * permission the return this preview leads to actually requires),
		 * matching Finding I's "the consuming mutation's own permission also
		 * authorizes the preview read" pattern, not `commerce.receipt.read`.
		 * See the contract's doc comment for why a second Receipt-only
		 * lookup cannot substitute for this. */
		async getSaleForReturn(input: {
			actorUserId: string;
			contextId: string;
			receiptNumber: string;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.returns",
				contextId: input.contextId,
				permission: "commerce.return.create",
				sessionId: input.sessionId,
			});
			return options.service.getSaleForReturn(
				context.tenantId,
				context.organizationId,
				context.locationId,
				input.registerId,
				input.receiptNumber
			);
		},
		async holdSale(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			reason?: string | null;
			saleId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.sale.hold",
				sessionId: input.sessionId,
			});
			return options.service.holdSale({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				reason: input.reason,
				saleId: input.saleId,
				tenantId: context.tenantId,
			});
		},
		/** WS3 remediation R3b, Item 7 (server-backed discovery): reuses
		 * `commerce.cash-variance.approve` exactly, the SAME permission
		 * `getCashVariance` above already requires — no new identifier
		 * invented. A session only ever holds `state="Closing"` while a
		 * non-zero close variance awaits approval, so filtering to that
		 * state IS the pending-variance queue (see
		 * `listCashVariancesContract`'s doc comment in `packages/contracts/
		 * platform-api`).
		 *
		 * WS3 remediation R3b cycle 1 (adversarial re-review): unlike every
		 * other by-ID read/write in this file, `pos_register_session` is the
		 * ONE Item-7 queue resource that actually carries `locationId`
		 * (`packages/persistence/pos-postgres/src/schema/pos.ts`), and
		 * `approveCashVariance`'s own write path already threads
		 * `context.locationId` into `repository.getSession` so a
		 * location-scoped approver cannot approve another location's
		 * session. This read path must enforce the identical boundary: when
		 * the caller's active context IS location-scoped,
		 * `context.locationId` — never a client-supplied value, which would
		 * let a location-scoped actor simply ask for a different location —
		 * ALWAYS wins. Only an org-wide actor (no `context.locationId`) may
		 * use `input.filters.locationId` to narrow the queue; that is a
		 * convenience narrowing, not a scope escalation, since such an actor
		 * could already see every location's sessions with no filter at
		 * all. */
		async listCashVariances(input: {
			actorUserId: string;
			contextId: string;
			filters?: {
				locationId?: string;
				state?: RegisterSessionRecord["state"];
			};
			page: PosPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.cash-variance.approve",
				sessionId: input.sessionId,
			});
			return options.service.listSessions(
				context.tenantId,
				context.organizationId,
				input.page,
				{
					locationId: context.locationId ?? input.filters?.locationId,
					state: input.filters?.state,
				}
			);
		},
		/** WS3 remediation R3b, Item 7 (server-backed discovery): reuses
		 * `commerce.deposit.confirm` exactly, the SAME permission `getDeposit`
		 * above already requires — no new identifier invented. */
		async listDeposits(input: {
			actorUserId: string;
			contextId: string;
			filters?: { state?: DepositRecord["state"] };
			page: PosPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.deposit.confirm",
				sessionId: input.sessionId,
			});
			return options.service.listDeposits(
				context.tenantId,
				context.organizationId,
				input.page,
				input.filters
			);
		},
		/** WS3 remediation R3b, Item 7 (server-backed discovery): reuses
		 * `commerce.price-override.approve` exactly, the SAME permission
		 * `approvePriceOverride` already requires — no new identifier
		 * invented. */
		async listPriceOverrides(input: {
			actorUserId: string;
			contextId: string;
			filters?: { state?: PriceOverrideRecord["state"] };
			page: PosPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.price-override.approve",
				sessionId: input.sessionId,
			});
			return options.service.listPriceOverrides(
				context.tenantId,
				context.organizationId,
				input.page,
				input.filters
			);
		},
		/** WS3 remediation R3b, Item 7 (server-backed discovery): reuses
		 * `commerce.refund.approve` exactly, the SAME permission `getRefund`
		 * above already requires — no new identifier invented. */
		async listRefunds(input: {
			actorUserId: string;
			contextId: string;
			filters?: { state?: RefundRecord["state"] };
			page: PosPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.refunds",
				contextId: input.contextId,
				permission: "commerce.refund.approve",
				sessionId: input.sessionId,
			});
			return options.service.listRefunds(
				context.tenantId,
				context.organizationId,
				input.page,
				input.filters
			);
		},
		/** WS3 remediation R3b, Item 7 (server-backed discovery): reuses
		 * `commerce.return.approve` exactly, the SAME permission `getReturn`
		 * above already requires — no new identifier invented. */
		async listReturns(input: {
			actorUserId: string;
			contextId: string;
			filters?: { state?: ReturnRecord["state"] };
			page: PosPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.actorUserId,
				capabilityId: "commerce.returns",
				contextId: input.contextId,
				permission: "commerce.return.approve",
				sessionId: input.sessionId,
			});
			return options.service.listReturns(
				context.tenantId,
				context.organizationId,
				input.page,
				input.filters
			);
		},
		async openRegister(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			currency: string;
			idempotencyKey: string;
			locationId: string;
			openingFloat: { amountMinor: number; currency: string };
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.register.open",
				sessionId: input.sessionId,
			});
			return options.service.openRegister({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				currency: input.currency,
				idempotencyKey: input.idempotencyKey,
				locationId: input.locationId,
				openingFloat: input.openingFloat,
				organizationId: context.organizationId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
		async reissueReceipt(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			priceSuppressed?: boolean;
			receiptId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.receipts",
				contextId: input.contextId,
				permission: "commerce.receipt.reissue",
				sessionId: input.sessionId,
			});
			return options.service.reissueReceipt({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				priceSuppressed: input.priceSuppressed,
				receiptId: input.receiptId,
				tenantId: context.tenantId,
			});
		},
		async requestPriceOverride(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			lineId: string;
			reason: string;
			requestedPrice: { amountMinor: number; currency: string };
			saleId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.order-management",
				contextId: input.contextId,
				permission: "commerce.price-override.request",
				sessionId: input.sessionId,
			});
			return options.service.requestPriceOverride({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				lineId: input.lineId,
				locationId: context.locationId,
				organizationId: context.organizationId,
				reason: input.reason,
				requestedPrice: input.requestedPrice,
				saleId: input.saleId,
				tenantId: context.tenantId,
			});
		},
		async voidReceipt(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			reason?: string | null;
			receiptId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.receipts",
				contextId: input.contextId,
				permission: "commerce.receipt.void",
				sessionId: input.sessionId,
			});
			return options.service.voidReceipt({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				locationId: context.locationId,
				organizationId: context.organizationId,
				reason: input.reason,
				receiptId: input.receiptId,
				tenantId: context.tenantId,
			});
		},
	};
}
