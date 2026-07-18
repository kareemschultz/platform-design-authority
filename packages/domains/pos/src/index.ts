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
	| "commerce.register.close"
	| "commerce.register.open"
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
	updatePriceOverride: (
		record: PriceOverrideRecord,
		expectedVersion: number
	) => Promise<PriceOverrideRecord | "version_conflict">;
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
	lineTotalMinor: number;
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
			| "movement"
			| "price-override"
			| "receipt"
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
	capabilityId: "commerce.order-management" | "commerce.receipts";
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
		lineTotalMinor: taxableBaseMinor + taxAmountMinor,
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
 * concurrent queries on one client. */
async function postSaleLineMovements(
	inventory: SaleInventoryMovementPort,
	sale: SaleRecord,
	actorUserId: string,
	correlationId: string
): Promise<void> {
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
	}
}

export interface PosServiceOptions {
	clock: () => Date;
	ids: PosIdFactory;
	parties: PosPartyPort;
	pricing: PosPricingPort;
	products: PosCatalogPort;
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

					await postSaleLineMovements(
						inventory,
						sale,
						input.actorUserId,
						input.correlationId
					);

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
	| "commerce.register.close"
	| "commerce.register.open"
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
			| "commerce.register-management";
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
	};
}
