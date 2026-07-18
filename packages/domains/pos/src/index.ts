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
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getOpenSession: (
		tenantId: string,
		registerId: string
	) => Promise<RegisterSessionRecord | null>;
	getPriceOverride: (
		tenantId: string,
		id: string
	) => Promise<PriceOverrideRecord | null>;
	getReceipt: (tenantId: string, id: string) => Promise<ReceiptRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getRefund: (tenantId: string, id: string) => Promise<RefundRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getReturn: (tenantId: string, id: string) => Promise<ReturnRecord | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getSale: (tenantId: string, saleId: string) => Promise<SaleRecord | null>;
	getSession: (
		tenantId: string,
		sessionId: string
	) => Promise<RegisterSessionRecord | null>;
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
	recordCommandReceipt: (
		receipt: PosCommandReceipt
	) => Promise<{ inserted: boolean; record: PosCommandReceipt }>;
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
	saleId: string
): Promise<SaleRecord> {
	const sale = await repository.getSale(tenantId, saleId);
	if (!sale) {
		throw new PosError("not_found", "Sale was not found");
	}
	if (sale.state === "Completed") {
		throw new PosError("invalid_state", "Sale is already completed");
	}
	const session = await repository.getOpenSession(tenantId, sale.registerId);
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
 * §6), the sale is not yet Completed, and its target line still exists. */
async function requireApprovableOverride(
	repository: PosRepository,
	tenantId: string,
	saleId: string,
	overrideId: string,
	actorUserId: string
): Promise<{
	line: SaleLineRecord;
	override: PriceOverrideRecord;
	sale: SaleRecord;
}> {
	const override = await repository.getPriceOverride(tenantId, overrideId);
	if (!override || override.saleId !== saleId) {
		throw new PosError("not_found", "Price override was not found");
	}
	if (override.state !== "Pending") {
		throw new PosError(
			"invalid_state",
			"Only a Pending price override can be approved"
		);
	}
	if (override.requestedByActorUserId === actorUserId) {
		throw new PosError(
			"approval_separation",
			"The requester cannot approve their own price override"
		);
	}
	const sale = await repository.getSale(tenantId, saleId);
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
	return { line, override, sale };
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

/** Prices one returned line proportionally to how much of the ORIGINAL
 * sale line's quantity it returns (round-half-up on integer minor units,
 * matching this file's other money arithmetic) — a return never re-runs
 * `engine.pricing`/`engine.tax`, it apportions the already-locked sale-line
 * amounts, so a return can never disagree with what the customer was
 * actually charged. */
function proportionalMinor(
	originalAmountMinor: number,
	returnedQuantity: string,
	originalQuantity: string
): number {
	const part = returnQuantityToScaled(returnedQuantity);
	const whole = returnQuantityToScaled(originalQuantity);
	if (whole === 0n) {
		return 0;
	}
	const numerator = BigInt(originalAmountMinor) * part;
	return Number((numerator + whole / 2n) / whole);
}

function priceReturnLine(
	saleLine: SaleLineRecord,
	returnedQuantity: string,
	ids: PosIdFactory
): ReturnLineRecord {
	return {
		discountMinor: proportionalMinor(
			saleLine.discountMinor,
			returnedQuantity,
			saleLine.quantity
		),
		grossMinor: proportionalMinor(
			saleLine.grossMinor,
			returnedQuantity,
			saleLine.quantity
		),
		id: ids.create("return-line"),
		lineTotalMinor: proportionalMinor(
			saleLine.lineTotalMinor,
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
			returnedQuantity,
			saleLine.quantity
		),
		taxableBaseMinor: proportionalMinor(
			saleLine.taxableBaseMinor,
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
		lines.push(priceReturnLine(saleLine, requested.quantity, ids));
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
 * pair. */
async function requireApprovableReturn(
	repository: PosRepository,
	tenantId: string,
	returnId: string,
	actorUserId: string
): Promise<{ current: ReturnRecord; sale: SaleRecord }> {
	const current = await repository.getReturn(tenantId, returnId);
	if (!current) {
		throw new PosError("not_found", "Return was not found");
	}
	if (current.state !== "Pending") {
		throw new PosError(
			"invalid_state",
			"Only a Pending return can be approved"
		);
	}
	if (current.createdByActorUserId === actorUserId) {
		throw new PosError(
			"approval_separation",
			"The creator cannot approve their own return"
		);
	}
	const sale = await repository.getSale(tenantId, current.saleId);
	if (!sale) {
		throw new PosError("not_found", "Original sale was not found");
	}
	return { current, sale };
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
	receiptId: string
): Promise<{ receipt: ReceiptRecord; sale: SaleRecord }> {
	const receipt = await repository.getReceipt(tenantId, receiptId);
	if (!receipt) {
		throw new PosError("not_found", "Receipt was not found");
	}
	if (receipt.kind !== "Sale" || !receipt.saleId) {
		throw new PosError("invalid_state", "Only a Sale receipt can be voided");
	}
	const sale = await repository.getSale(tenantId, receipt.saleId);
	if (!sale) {
		throw new PosError("not_found", "Sale was not found");
	}
	if (sale.state !== "Completed") {
		throw new PosError("invalid_state", "Only a completed sale can be voided");
	}
	const session = await repository.getOpenSession(tenantId, sale.registerId);
	if (!session || session.id !== sale.sessionId) {
		throw new PosError(
			"invalid_state",
			"A sale can only be voided while its register session is still open"
		);
	}
	return { receipt, sale };
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
					input.sessionId
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
				if (current.closedByActorUserId === input.actorUserId) {
					throw new PosError(
						"approval_separation",
						"The closer cannot approve their own cash variance"
					);
				}
				const now = options.clock();
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
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
				const { line, override, sale } = await requireApprovableOverride(
					repository,
					input.tenantId,
					input.saleId,
					input.overrideId,
					input.actorUserId
				);
				const now = options.clock();
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});

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
				if (current.requestedByActorUserId === input.actorUserId) {
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
					current.registerId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Refund requires its register session to still be open"
					);
				}
				const now = options.clock();
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});

				// Refund-exceeds-register-cash (frozen control plan Tests:
				// "record variance vs reject — whichever PR0 declared"). PR1's
				// `createCashMovement` never checks cash sufficiency for any
				// PaidOut reason code (paid-out, safe-drop); a shortfall only
				// ever surfaces as a counted-vs-expected variance at
				// `register.close` (`cash-variance.approve`). This refund
				// posting follows that SAME established semantics rather than
				// inventing a reject path PR1 never had: it always posts, and
				// any resulting shortfall is recorded — never rejected —
				// through the ordinary close/variance flow.
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
					const { current, sale } = await requireApprovableReturn(
						repository,
						input.tenantId,
						input.returnId,
						input.actorUserId
					);
					const now = options.clock();
					const approverPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});

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
					input.registerId
				);
				if (!current) {
					throw new PosError(
						"invalid_state",
						"Register has no open session to close"
					);
				}
				requireMatchingCurrency(current.currency, input.countedCash.currency);
				const totals = await repository.netCashMovements(
					input.tenantId,
					current.id
				);
				const expectedCashMinor =
					current.openingFloatMinor + totals.paidInMinor - totals.paidOutMinor;
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
						input.saleId
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

		async createCashMovement(input: {
			actorUserId: string;
			amount: { amountMinor: number; currency: string };
			correlationId: string;
			direction: CashMovementDirection;
			idempotencyKey: string;
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
					input.registerId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Register has no open session accepting cash movements"
					);
				}
				requireMatchingCurrency(session.currency, input.amount.currency);
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
				const sale = await repository.getSale(input.tenantId, input.saleId);
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
					input.registerId
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

		async getReceipt(
			tenantId: string,
			receiptId: string
		): Promise<ReceiptView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getReceipt(tenantId, receiptId)
			);
			if (!record) {
				throw new PosError("not_found", "Receipt was not found");
			}
			return receiptView(record);
		},

		async getRegisterSession(
			tenantId: string,
			sessionId: string
		): Promise<RegisterSessionView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getSession(tenantId, sessionId)
			);
			if (!record) {
				throw new PosError("not_found", "Register session was not found");
			}
			return registerSessionView(record);
		},

		async holdSale(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
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
				const current = await repository.getSale(input.tenantId, input.saleId);
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
				const sale = await repository.getSale(input.tenantId, input.saleId);
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
		 * the portion already returned). */
		async voidReceipt(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
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
					const { receipt, sale } = await requireVoidableSale(
						repository,
						input.tenantId,
						input.receiptId
					);
					const lines = await buildVoidLines(repository, options.ids, sale);
					const now = options.clock();
					const actorPartyId = await options.parties.requireActorPartyId({
						authUserId: input.actorUserId,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					});
					const returnId = options.ids.create("return");

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
					const totalRefundableMinor = lines.reduce(
						(sum, line) => sum + line.lineTotalMinor,
						0
					);
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
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}

export type PosPermission =
	| "commerce.cash-movement.create"
	| "commerce.cash-variance.approve"
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
				organizationId: context.organizationId,
				saleId: input.saleId,
				tenantId: context.tenantId,
				tenders: input.tenders,
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
				note: input.note,
				organizationId: context.organizationId,
				reasonCode: input.reasonCode,
				referenceId: input.referenceId,
				registerId: input.registerId,
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
				organizationId: context.organizationId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
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
			return options.service.getReceipt(context.tenantId, input.receiptId);
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
				organizationId: context.organizationId,
				reason: input.reason,
				saleId: input.saleId,
				tenantId: context.tenantId,
			});
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
				organizationId: context.organizationId,
				reason: input.reason,
				receiptId: input.receiptId,
				tenantId: context.tenantId,
			});
		},
	};
}
