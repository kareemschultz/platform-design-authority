import { describe, expect, test } from "bun:test";
import {
	APPROVAL_STATES,
	type CashMovementRecord,
	createPosApplication,
	createPosService,
	DEPOSIT_STATES,
	type DepositRecord,
	type PendingPosEvent,
	type PosCommandReceipt,
	PosError,
	type PosFinanceHandoffSourceData,
	type PosIdFactory,
	type PosPage,
	type PosPageRequest,
	type PosPermission,
	type PosPricingPort,
	type PosRepository,
	type PosTaxPort,
	type PriceOverrideRecord,
	REFUND_STATES,
	REGISTER_SESSION_STATES,
	RETURN_MODES,
	RETURN_STATES,
	type ReceiptRecord,
	type RefundRecord,
	type RegisterSessionRecord,
	type ReturnRecord,
	SALE_LINE_TAX_CATEGORIES,
	SALE_STATES,
	type SaleRecord,
} from ".";

// Test-local reimplementation of `@meridian/engine-pricing`/
// `@meridian/engine-tax`'s exact formulas (PDA-IND-090's exclusive-rate
// math and the pricing engine's round-half-up cent rounding) — NOT an
// import of either engine package. `packages/domains/pos` (and its
// colocated tests) cannot import `packages/engines/*` directly:
// `registry/architecture-rules.json`'s `family_grants_are_contract_only`
// forbids a `domains` -> `engines` edge without a published
// `packages/contracts/engine-*` package, which neither engine has.
// `scripts/check_architecture.py` enforces this on every source file,
// test files included. The engines' own formula correctness is
// independently asserted by their own colocated test files
// (`packages/engines/pricing/src/index.test.ts`,
// `packages/engines/tax/src/index.test.ts`); this fixture exists only to
// exercise the DOMAIN's own orchestration of a `PosPricingPort`/
// `PosTaxPort` adapter's output.
const TEST_MONEY_SCALE = 100n;
const TEST_QUANTITY_SCALE = 1_000_000n;
const DEPOSIT_REFERENCE_PATTERN = /^DEP-\d{6}$/;
const TEST_CATEGORY_RATES: Record<string, string> = {
	GY_EXEMPT: "0.00",
	GY_OUT_OF_SCOPE: "0.00",
	GY_STANDARD_14: "0.14",
	GY_ZERO_RATED: "0.00",
};

function testMoneyToMinor(value: string): bigint {
	const [whole = "0", fraction = "00"] = value.split(".");
	return BigInt(whole) * TEST_MONEY_SCALE + BigInt(fraction);
}
function testMinorToMoney(value: bigint): string {
	const whole = value / TEST_MONEY_SCALE;
	const fraction = (value % TEST_MONEY_SCALE).toString().padStart(2, "0");
	return `${whole}.${fraction}`;
}
function testQuantityToScaled(value: string): bigint {
	const [whole = "0", fraction = ""] = value.split(".");
	return BigInt(whole) * TEST_QUANTITY_SCALE + BigInt(fraction.padEnd(6, "0"));
}
function testRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator / 2n) / denominator;
}

function createTestPricingEngine(): PosPricingPort {
	return {
		priceLine: (input) => {
			const unitPriceMinor = testMoneyToMinor(input.unitPrice);
			const quantityScaled = testQuantityToScaled(input.quantity);
			const grossMinor = testRoundHalfUp(
				unitPriceMinor * quantityScaled,
				TEST_QUANTITY_SCALE
			);
			const discountMinor = input.discountAmount
				? testMoneyToMinor(input.discountAmount)
				: 0n;
			const netMinor = grossMinor - discountMinor;
			return Promise.resolve({
				discountAmount: testMinorToMoney(discountMinor),
				grossAmount: testMinorToMoney(grossMinor),
				netAmount: testMinorToMoney(netMinor),
			});
		},
	};
}

function createTestTaxEngine(): PosTaxPort {
	return {
		calculateLine: (input) => {
			const rate = TEST_CATEGORY_RATES[input.category] ?? "0.00";
			const rateScaled = testMoneyToMinor(rate);
			const inputMinor = testMoneyToMinor(input.taxableBase);
			if (input.inclusive) {
				const denominatorScaled = TEST_MONEY_SCALE + rateScaled;
				const taxableBaseMinor = testRoundHalfUp(
					inputMinor * TEST_MONEY_SCALE,
					denominatorScaled
				);
				const taxAmountMinor = inputMinor - taxableBaseMinor;
				return Promise.resolve({
					category: input.category,
					nonStatutory: true as const,
					rate,
					taxAmount: testMinorToMoney(taxAmountMinor),
					taxableBase: testMinorToMoney(taxableBaseMinor),
				});
			}
			const taxAmountMinor = testRoundHalfUp(
				inputMinor * rateScaled,
				TEST_MONEY_SCALE
			);
			return Promise.resolve({
				category: input.category,
				nonStatutory: true as const,
				rate,
				taxAmount: testMinorToMoney(taxAmountMinor),
				taxableBase: testMinorToMoney(inputMinor),
			});
		},
	};
}

describe("POS contract scaffold", () => {
	test("register sessions have no reopen transition", () => {
		expect(REGISTER_SESSION_STATES).toEqual(["Open", "Closing", "Closed"]);
		expect(REGISTER_SESSION_STATES).not.toContain("Reopened");
	});

	test("a variance close occupies a distinct pending state from a completed close", () => {
		expect(REGISTER_SESSION_STATES).toContain("Closing");
		expect(REGISTER_SESSION_STATES.indexOf("Closing")).toBeLessThan(
			REGISTER_SESSION_STATES.indexOf("Closed")
		);
	});

	test("a held sale is distinct from a completed sale", () => {
		expect(SALE_STATES).toContain("Held");
		expect(SALE_STATES).toContain("Completed");
		expect(SALE_STATES.indexOf("Held")).toBeLessThan(
			SALE_STATES.indexOf("Completed")
		);
	});

	test("maker/checker approval never starts pre-approved", () => {
		expect(APPROVAL_STATES[0]).toBe("Pending");
		expect(APPROVAL_STATES).toContain("Approved");
	});
});

/** Mirrors the real Postgres repository's `gt(id) … orderBy asc(id) …
 * limit + 1` cursor discipline exactly (see `packages/persistence/
 * pos-postgres/src/index.ts`'s `listDeposits`/`listPriceOverrides`/
 * `listRefunds`/`listReturns`/`listSessions`), so this in-memory fixture
 * cannot silently diverge from the production pagination contract WS3
 * remediation R3b, Item 7 relies on. */
function paginateById<T extends { id: string }>(
	items: T[],
	page: PosPageRequest
): PosPage<T> {
	const sorted = [...items].sort((left, right) =>
		left.id.localeCompare(right.id)
	);
	const afterCursor = page.cursor
		? sorted.filter((item) => item.id > (page.cursor as string))
		: sorted;
	const pageItems = afterCursor.slice(0, page.limit);
	return {
		items: pageItems,
		nextCursor:
			afterCursor.length > page.limit ? (pageItems.at(-1)?.id ?? null) : null,
	};
}

function createInMemoryRepository() {
	const sessions = new Map<string, RegisterSessionRecord>();
	const movements: CashMovementRecord[] = [];
	const commandReceipts = new Map<string, PosCommandReceipt>();
	const sales = new Map<string, SaleRecord>();
	const priceOverrides = new Map<string, PriceOverrideRecord>();
	const saleReceipts = new Map<string, ReceiptRecord>();
	const returns = new Map<string, ReturnRecord>();
	const refunds = new Map<string, RefundRecord>();
	const deposits = new Map<string, DepositRecord>();
	const depositCustodyTransfers: Array<{
		amountMinor: number;
		depositId: string;
		id: string;
	}> = [];

	const repository: PosRepository = {
		acquireCommandLock: () => Promise.resolve(),
		countPendingPriceOverrides: (tenantId, saleId) =>
			Promise.resolve(
				[...priceOverrides.values()].filter(
					(override) =>
						override.tenantId === tenantId &&
						override.saleId === saleId &&
						override.state === "Pending"
				).length
			),
		createCashMovement: (record) => {
			movements.push(record);
			return Promise.resolve(record);
		},

		// -- WS3 PR4: Deposit, Finance handoff -----------------------------------
		createDeposit: (record) => {
			deposits.set(record.id, record);
			return Promise.resolve(record);
		},
		createDepositCustodyTransfer: (record) => {
			depositCustodyTransfers.push({
				amountMinor: record.amountMinor,
				depositId: record.depositId,
				id: record.id,
			});
			return Promise.resolve();
		},
		createPriceOverride: (record) => {
			priceOverrides.set(record.id, record);
			return Promise.resolve(record);
		},
		createReceipt: (record) => {
			saleReceipts.set(record.id, record);
			return Promise.resolve(record);
		},

		// -- WS3 PR3: Return, Refund ----------------------------------------------
		createRefund: (record) => {
			refunds.set(record.id, record);
			return Promise.resolve(record);
		},
		createReturn: (record) => {
			returns.set(record.id, record);
			return Promise.resolve(record);
		},
		createSale: (record) => {
			sales.set(record.id, record);
			return Promise.resolve(record);
		},
		getCommandReceipt: (tenantId, operation, idempotencyKey) =>
			Promise.resolve(
				commandReceipts.get(`${tenantId}${operation}${idempotencyKey}`) ?? null
			),
		// WS3 remediation R2, Finding B: every by-ID lookup below filters by
		// BOTH `tenantId` AND `organizationId` (and, where the record type
		// carries a `locationId`, that too when the caller supplies one) —
		// mirroring the real Postgres repository's SQL `WHERE` clause so this
		// mock cannot silently diverge from the production isolation
		// boundary. A record belonging to a different organization is
		// indistinguishable from a nonexistent one (`null`), never disclosed.
		getDeposit: (tenantId, organizationId, id) => {
			const record = deposits.get(id);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId
					? record
					: null
			);
		},
		getOpenSession: (tenantId, organizationId, registerId, locationId) =>
			Promise.resolve(
				[...sessions.values()].find(
					(session) =>
						session.tenantId === tenantId &&
						session.organizationId === organizationId &&
						session.registerId === registerId &&
						session.state === "Open" &&
						(locationId === undefined || session.locationId === locationId)
				) ?? null
			),
		getPriceOverride: (tenantId, organizationId, id) => {
			const record = priceOverrides.get(id);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId
					? record
					: null
			);
		},
		getReceipt: (tenantId, organizationId, id) => {
			const record = saleReceipts.get(id);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId
					? record
					: null
			);
		},
		getReceiptByNumber: (
			tenantId,
			organizationId,
			registerId,
			receiptNumber
		) => {
			const record = [...saleReceipts.values()].find(
				(candidate) =>
					candidate.tenantId === tenantId &&
					candidate.organizationId === organizationId &&
					candidate.registerId === registerId &&
					candidate.receiptNumber === receiptNumber
			);
			return Promise.resolve(record ?? null);
		},
		getRefund: (tenantId, organizationId, id) => {
			const record = refunds.get(id);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId
					? record
					: null
			);
		},
		getReturn: (tenantId, organizationId, id) => {
			const record = returns.get(id);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId
					? record
					: null
			);
		},
		getSale: (tenantId, organizationId, saleId, locationId) => {
			const record = sales.get(saleId);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(locationId === undefined || record.locationId === locationId)
					? record
					: null
			);
		},
		getSession: (tenantId, organizationId, sessionId, locationId) => {
			const record = sessions.get(sessionId);
			return Promise.resolve(
				record &&
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(locationId === undefined || record.locationId === locationId)
					? record
					: null
			);
		},
		listDeposits: (tenantId, organizationId, page, filters) =>
			Promise.resolve(
				paginateById(
					[...deposits.values()].filter(
						(record) =>
							record.tenantId === tenantId &&
							record.organizationId === organizationId &&
							(filters?.state === undefined || record.state === filters.state)
					),
					page
				)
			),
		listPriceOverrides: (tenantId, organizationId, page, filters) =>
			Promise.resolve(
				paginateById(
					[...priceOverrides.values()].filter(
						(record) =>
							record.tenantId === tenantId &&
							record.organizationId === organizationId &&
							(filters?.state === undefined || record.state === filters.state)
					),
					page
				)
			),
		listRefunds: (tenantId, organizationId, page, filters) =>
			Promise.resolve(
				paginateById(
					[...refunds.values()].filter(
						(record) =>
							record.tenantId === tenantId &&
							record.organizationId === organizationId &&
							(filters?.state === undefined || record.state === filters.state)
					),
					page
				)
			),
		listReturns: (tenantId, organizationId, page, filters) =>
			Promise.resolve(
				paginateById(
					[...returns.values()].filter(
						(record) =>
							record.tenantId === tenantId &&
							record.organizationId === organizationId &&
							(filters?.state === undefined || record.state === filters.state)
					),
					page
				)
			),
		listSessions: (tenantId, organizationId, page, filters) =>
			Promise.resolve(
				paginateById(
					[...sessions.values()].filter(
						(record) =>
							record.tenantId === tenantId &&
							record.organizationId === organizationId &&
							(filters?.locationId === undefined ||
								record.locationId === filters.locationId) &&
							(filters?.state === undefined || record.state === filters.state)
					),
					page
				)
			),
		lockSessionsForDeposit: (
			tenantId,
			organizationId,
			sessionIds,
			locationId
		) =>
			Promise.resolve(
				[...sessionIds]
					.sort()
					.map((id) => sessions.get(id))
					.filter(
						(session): session is RegisterSessionRecord =>
							session !== undefined &&
							session.tenantId === tenantId &&
							session.organizationId === organizationId &&
							(locationId === undefined || session.locationId === locationId)
					)
			),
		netCashMovements: (tenantId, sessionId) => {
			const relevant = movements.filter(
				(movement) =>
					movement.tenantId === tenantId && movement.sessionId === sessionId
			);
			return Promise.resolve({
				paidInMinor: relevant
					.filter((movement) => movement.direction === "PaidIn")
					.reduce((sum, movement) => sum + movement.amountMinor, 0),
				paidOutMinor: relevant
					.filter((movement) => movement.direction === "PaidOut")
					.reduce((sum, movement) => sum + movement.amountMinor, 0),
			});
		},
		openRegister: (record) => {
			// Mirrors the Postgres partial unique index
			// (pos_register_session_open_register_uidx) predicate: a `Closing`
			// session still holds an unreconciled custody position pending
			// commerce.cash-variance.approve, so it blocks a new open exactly
			// like an `Open` session does — not just `Open` itself.
			const existingLive = [...sessions.values()].find(
				(session) =>
					session.tenantId === record.tenantId &&
					session.registerId === record.registerId &&
					(session.state === "Open" || session.state === "Closing")
			);
			if (existingLive) {
				return Promise.resolve("already_open" as const);
			}
			sessions.set(record.id, record);
			return Promise.resolve(record);
		},
		queryFinanceHandoffSourceData: (input) => {
			const inRange = (value: Date | null) =>
				value !== null &&
				value >= input.periodStartUtc &&
				value < input.periodEndUtc;
			const scopedSales = [...sales.values()].filter(
				(sale) =>
					sale.tenantId === input.tenantId &&
					sale.organizationId === input.organizationId &&
					sale.state === "Completed" &&
					inRange(sale.completedAt)
			);
			const scopedReturns = [...returns.values()].filter(
				(candidate) =>
					candidate.tenantId === input.tenantId &&
					candidate.organizationId === input.organizationId &&
					candidate.state === "Completed" &&
					inRange(candidate.updatedAt)
			);
			const scopedRefundMovements = movements.filter(
				(movement) =>
					movement.tenantId === input.tenantId &&
					movement.organizationId === input.organizationId &&
					movement.reasonCode === "Refund" &&
					inRange(movement.createdAt)
			);
			const closedVariances = [...sessions.values()].filter(
				(session) =>
					session.tenantId === input.tenantId &&
					session.organizationId === input.organizationId &&
					session.state === "Closed" &&
					session.varianceMinor !== null &&
					session.varianceMinor !== 0 &&
					inRange(session.closedAt)
			);
			const unresolvedVariances = [...sessions.values()].filter(
				(session) =>
					session.tenantId === input.tenantId &&
					session.organizationId === input.organizationId &&
					session.state === "Closing" &&
					inRange(session.closeRequestedAt)
			);
			const scopedDeposits = [...deposits.values()].filter(
				(deposit) =>
					deposit.tenantId === input.tenantId &&
					deposit.organizationId === input.organizationId
			);
			const result: PosFinanceHandoffSourceData = {
				closedVariances: closedVariances.map((session) => ({
					currency: session.currency,
					occurredAt: session.closedAt as Date,
					registerId: session.registerId,
					sessionId: session.id,
					varianceMinor: session.varianceMinor as number,
				})),
				netInventoryQuantityScaled: "0",
				preparedDeposits: scopedDeposits
					.filter(
						(deposit) =>
							deposit.state === "Prepared" && inRange(deposit.preparedAt)
					)
					.map((deposit) => ({
						amountMinor: deposit.amountMinor,
						currency: deposit.currency,
						depositId: deposit.id,
						depositReference: deposit.depositReference,
						occurredAt: deposit.preparedAt,
					})),
				reconciledDeposits: scopedDeposits
					.filter(
						(deposit) =>
							deposit.state === "Reconciled" && inRange(deposit.confirmedAt)
					)
					.map((deposit) => ({
						amountMinor: deposit.amountMinor,
						currency: deposit.currency,
						depositId: deposit.id,
						depositReference: deposit.depositReference,
						occurredAt: deposit.confirmedAt as Date,
					})),
				refunds: scopedRefundMovements.map((movement) => ({
					amountMinor: movement.amountMinor,
					currency: movement.currency,
					movementId: movement.id,
					postedAt: movement.createdAt,
					refundId: movement.referenceId ?? movement.id,
					// WS3 remediation R1 cycle 2: mirrors the live-Postgres
					// repository's LEFT JOIN — a reasonCode-"Refund" movement
					// whose referenceId does NOT resolve to an actual
					// RefundRecord was posted by voidReceipt (referenceId names
					// the void's Return instead).
					sourceKind:
						movement.referenceId !== null &&
						movement.referenceId !== undefined &&
						refunds.has(movement.referenceId)
							? "Refund"
							: "Void",
				})),
				returnCount: scopedReturns.length,
				sales: scopedSales.map((sale) => ({
					completedAt: sale.completedAt as Date,
					currency: sale.currency,
					discountMinor: sale.discountMinor,
					grossMinor: sale.grossMinor,
					id: sale.id,
					taxMinor: sale.taxMinor,
					totalMinor: sale.totalMinor,
				})),
				unresolvedVariances: unresolvedVariances.map((session) => ({
					closeRequestedAt: session.closeRequestedAt as Date,
					registerId: session.registerId,
					sessionId: session.id,
				})),
			};
			return Promise.resolve(result);
		},
		recordCommandReceipt: (receipt) => {
			const key = `${receipt.tenantId}${receipt.operation}${receipt.idempotencyKey}`;
			const existing = commandReceipts.get(key);
			if (existing) {
				return Promise.resolve({ inserted: false, record: existing });
			}
			commandReceipts.set(key, receipt);
			return Promise.resolve({ inserted: true, record: receipt });
		},
		sumReservedDepositsForSessions: (
			tenantId,
			sessionIds,
			excludeDepositId
		) => {
			const relevant = [...deposits.values()].filter(
				(deposit) =>
					deposit.tenantId === tenantId &&
					deposit.id !== excludeDepositId &&
					(deposit.state === "Prepared" || deposit.state === "Reconciled") &&
					deposit.sourceShiftIds.some((id) => sessionIds.includes(id))
			);
			return Promise.resolve(
				relevant.reduce((sum, deposit) => sum + deposit.amountMinor, 0)
			);
		},
		sumReturnedQuantity: (tenantId, saleLineId) => {
			const total = [...returns.values()]
				.filter((candidate) => candidate.tenantId === tenantId)
				.flatMap((candidate) => candidate.lines)
				.filter((line) => line.saleLineId === saleLineId)
				.reduce((sum, line) => sum + Number(line.quantity), 0);
			return Promise.resolve(total.toString());
		},
		sumSafeDropForSessions: (tenantId, sessionIds) => {
			const relevant = movements.filter(
				(movement) =>
					movement.tenantId === tenantId &&
					movement.reasonCode === "SafeDrop" &&
					sessionIds.includes(movement.sessionId)
			);
			return Promise.resolve(
				relevant.reduce((sum, movement) => sum + movement.amountMinor, 0)
			);
		},
		updateDeposit: (record, expectedVersion) => {
			const current = deposits.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			deposits.set(record.id, record);
			return Promise.resolve(record);
		},
		updatePriceOverride: (record, expectedVersion) => {
			const current = priceOverrides.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			priceOverrides.set(record.id, record);
			return Promise.resolve(record);
		},
		updateRefund: (record, expectedVersion) => {
			const current = refunds.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			refunds.set(record.id, record);
			return Promise.resolve(record);
		},
		updateReturn: (record, expectedVersion) => {
			const current = returns.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			returns.set(record.id, record);
			return Promise.resolve(record);
		},
		updateSale: (record, expectedVersion) => {
			const current = sales.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			sales.set(record.id, record);
			return Promise.resolve(record);
		},
		updateSession: (record, expectedVersion) => {
			const current = sessions.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			sessions.set(record.id, record);
			return Promise.resolve(record);
		},
	};

	return {
		depositCustodyTransfers,
		deposits,
		movements,
		priceOverrides,
		refunds,
		repository,
		returns,
		saleReceipts,
		sales,
		sessions,
	};
}

/** WS3 remediation R2, Finding C: `createHarness`'s default `parties` mock
 * is a pure bijection (`authUserId -> "party_" + authUserId"`), which can
 * never express "two different auth accounts resolve to the same Party" —
 * the exact scenario the maker/checker self-approval guards must reject.
 * `partyResolution`, when supplied, overrides that default per-`authUserId`
 * so a test can map two distinct `actorUserId`s onto one Party id, or
 * return `null` to simulate a missing/ambiguous Party link (mirrors
 * `apps/server/composition/pos.ts`'s real `requireActorPartyId`, which
 * throws `PosError("invalid_reference", ...)` in that case). Every existing
 * call site omits this option and keeps the original bijective behavior. */
function createHarness(options?: {
	partyResolution?: (authUserId: string) => string | null;
}) {
	const {
		deposits,
		depositCustodyTransfers,
		movements,
		priceOverrides,
		refunds,
		repository,
		returns,
		saleReceipts,
		sales,
		sessions,
	} = createInMemoryRepository();
	const events: PendingPosEvent[] = [];
	let sequence = 0;
	const ids: PosIdFactory = {
		create(kind) {
			sequence += 1;
			return `${kind}_${sequence.toString().padStart(6, "0")}`;
		},
	};
	const seenEventIds = new Set<string>();
	const stockMovements: Array<{ productId: string; quantity: string }> = [];
	const returnMovements: Array<{
		productId: string;
		quantity: string;
		reversalOfMovementId: string;
	}> = [];
	const negativeStockProductIds = new Set<string>();
	const scope = {
		events: {
			append: (envelope: PendingPosEvent) => {
				if (seenEventIds.has(envelope.id)) {
					return Promise.resolve("duplicate" as const);
				}
				seenEventIds.add(envelope.id);
				events.push(envelope);
				return Promise.resolve("inserted" as const);
			},
		},
		repository,
	};
	let receiptCounter = 0;
	let depositReferenceCounter = 0;
	const service = createPosService({
		clock: () => new Date("2026-07-18T12:00:00.000Z"),
		depositUnitOfWork: {
			execute: (operation) =>
				operation({
					...scope,
					numbering: {
						allocate: () => {
							depositReferenceCounter += 1;
							return Promise.resolve({
								value: `DEP-${depositReferenceCounter.toString().padStart(6, "0")}`,
							});
						},
					},
				}),
		},
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) => {
				if (!options?.partyResolution) {
					return Promise.resolve(`party_${authUserId}`);
				}
				const resolved = options.partyResolution(authUserId);
				if (resolved === null) {
					return Promise.reject(
						new PosError(
							"invalid_reference",
							"Actor has no active Party identity link for the active organization"
						)
					);
				}
				return Promise.resolve(resolved);
			},
		},
		pricing: createTestPricingEngine(),
		products: {
			requireProduct: ({ productId }) =>
				Promise.resolve({ productName: `Product ${productId}` }),
		},
		returnUnitOfWork: {
			execute: (operation) =>
				operation({
					...scope,
					inventory: {
						recordReturnMovement: (input) => {
							returnMovements.push({
								productId: input.productId,
								quantity: input.quantity,
								reversalOfMovementId: input.reversalOfMovementId,
							});
							return Promise.resolve({
								movementId: `return_movement_${input.productId}`,
							});
						},
					},
					numbering: {
						allocate: (input) => {
							receiptCounter += 1;
							return Promise.resolve({
								value: `R-${input.registerId}-${receiptCounter.toString().padStart(6, "0")}`,
							});
						},
					},
				}),
		},
		saleUnitOfWork: {
			execute: (operation) =>
				operation({
					...scope,
					inventory: {
						recordSaleMovement: (input) => {
							stockMovements.push({
								productId: input.productId,
								quantity: input.quantity,
							});
							if (negativeStockProductIds.has(input.productId)) {
								return Promise.resolve("negative_stock" as const);
							}
							return Promise.resolve({
								movementId: `movement_${input.productId}`,
							});
						},
					},
					numbering: {
						allocate: (input) => {
							receiptCounter += 1;
							return Promise.resolve({
								value: `R-${input.registerId}-${receiptCounter.toString().padStart(6, "0")}`,
							});
						},
					},
				}),
		},
		tax: createTestTaxEngine(),
		unitOfWork: { execute: (operation) => operation(scope) },
	});
	return {
		depositCustodyTransfers,
		deposits,
		events,
		ids,
		movements,
		negativeStockProductIds,
		priceOverrides,
		refunds,
		returnMovements,
		returns,
		saleReceipts,
		sales,
		service,
		sessions,
		stockMovements,
	};
}

const RECEIPT_NUMBER_PATTERN_SALE = /^R-register_sale-\d{6}$/;
const RECEIPT_NUMBER_PATTERN_RECEIPT_READ = /^R-register_receipt_read-\d{6}$/;

const base = {
	actorUserId: "user_maker",
	correlationId: "correlation_pos_unit",
	locationId: "location_a",
	organizationId: "organization_a",
	registerId: "register_a",
	tenantId: "tenant_a",
};

describe("POS domain: RegisterSession lifecycle", () => {
	test("opens a register and rejects a concurrent second open on the same register", async () => {
		const { service } = createHarness();
		const opened = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "open-1",
			openingFloat: { amountMinor: 50_000, currency: "GYD" },
		});
		expect(opened.state).toBe("Open");
		expect(opened.registerId).toBe(base.registerId);

		const secondOpen = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "open-2",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
		});
		await expect(secondOpen).rejects.toMatchObject({ code: "invalid_state" });
		await expect(secondOpen).rejects.toBeInstanceOf(PosError);
	});

	test("rejects opening a register while a prior session on it is Closing, pending variance approval", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closing-race-open-1",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
		});
		const closing = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 9500, currency: "GYD" },
			idempotencyKey: "closing-race-close-1",
		});
		expect(closing.state).toBe("Closing");

		const openWhileClosing = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closing-race-open-2",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
		});
		await expect(openWhileClosing).rejects.toMatchObject({
			code: "invalid_state",
		});
		await expect(openWhileClosing).rejects.toBeInstanceOf(PosError);
	});

	test("opens a new session after a prior session on the same register closed", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reopen-open-1",
			openingFloat: { amountMinor: 0, currency: "GYD" },
		});
		await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "reopen-close-1",
		});
		const second = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reopen-open-2",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
		});
		expect(second.state).toBe("Open");
	});

	test("rejects a cash movement once the register has no open session", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closed-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
		});
		await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "closed-close",
		});
		const movement = service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "closed-movement",
			reasonCode: "PaidIn",
		});
		await expect(movement).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("computes zero, short, and over cash variance and gates approval only on non-zero", async () => {
		const { service } = createHarness();

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-zero-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_zero",
		});
		const zero = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1000, currency: "GYD" },
			idempotencyKey: "variance-zero-close",
			registerId: "register_zero",
		});
		expect(zero.state).toBe("Closed");
		expect(zero.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(zero.varianceApprovalRequired).toBe(false);

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-short-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_short",
		});
		const short = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 800, currency: "GYD" },
			idempotencyKey: "variance-short-close",
			registerId: "register_short",
		});
		expect(short.state).toBe("Closing");
		expect(short.variance).toEqual({ amountMinor: -200, currency: "GYD" });
		expect(short.varianceApprovalRequired).toBe(true);

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-over-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_over",
		});
		const over = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1300, currency: "GYD" },
			idempotencyKey: "variance-over-close",
			registerId: "register_over",
		});
		expect(over.state).toBe("Closing");
		expect(over.variance).toEqual({ amountMinor: 300, currency: "GYD" });
		expect(over.varianceApprovalRequired).toBe(true);
	});

	test("factors posted cash movements into expected cash before computing variance", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "movement-open",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
			registerId: "register_movements",
		});
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 2000, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "movement-paid-in",
			reasonCode: "PaidIn",
			registerId: "register_movements",
		});
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 1500, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: "movement-safe-drop",
			reasonCode: "SafeDrop",
			registerId: "register_movements",
		});
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 5500, currency: "GYD" },
			idempotencyKey: "movement-close",
			registerId: "register_movements",
		});
		expect(closed.expectedCash).toEqual({
			amountMinor: 5500,
			currency: "GYD",
		});
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("keeps posted cash movements append-only: a correction is a new opposite movement, never an edit", async () => {
		const { movements, service } = createHarness();
		// Opening float 1000 (WS3 remediation R1, Finding E: the original
		// version of this test opened at float 0 and posted a 500 PaidOut
		// first — that is now correctly REJECTED by
		// `requireCashOutWithinExpectedCash` as a cash-out that would drive
		// expected cash negative, so the fixture now opens with cash on
		// hand sufficient for the erroneous paid-out, keeping this test's
		// actual subject — append-only correction, never an edit — intact).
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reversal-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_reversal",
		});
		const posted = await service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: "reversal-original",
			reasonCode: "Other",
			registerId: "register_reversal",
		});
		const correction = await service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "reversal-correction",
			note: "correction of erroneous paid-out",
			reasonCode: "Other",
			registerId: "register_reversal",
		});
		expect(posted.id).not.toBe(correction.id);
		expect(movements).toHaveLength(2);
		expect(
			movements.every((movement) => movement.registerId === "register_reversal")
		).toBe(true);
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1000, currency: "GYD" },
			idempotencyKey: "reversal-close",
			registerId: "register_reversal",
		});
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("denies self-approval of a cash variance and allows a different approver to close it", async () => {
		const { events, service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "self-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_self_approval",
		});
		const closing = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 900, currency: "GYD" },
			idempotencyKey: "self-close",
			registerId: "register_self_approval",
		});
		expect(closing.state).toBe("Closing");

		const selfApproval = service.approveCashVariance({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			idempotencyKey: "self-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		await expect(selfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(
			events.some((envelope) => envelope.name === "commerce.register.closed.v1")
		).toBe(false);

		const approved = await service.approveCashVariance({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			idempotencyKey: "checker-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		expect(approved.state).toBe("Closed");
		expect(approved.varianceApproverPartyId).toBe("party_user_checker");
		const closedEvents = events.filter(
			(envelope) => envelope.name === "commerce.register.closed.v1"
		);
		expect(closedEvents).toHaveLength(1);
		expect(closedEvents[0]?.data).toMatchObject({
			varianceApprovalRequired: true,
			varianceApproverPartyId: "party_user_checker",
			varianceMinor: -100,
		});
	});

	test("WS3 remediation R2, Finding C: denies cash-variance self-approval across TWO DIFFERENT auth accounts that resolve to the SAME Party, with no state change", async () => {
		// Non-bijective harness: "user_closer" and "user_alt_login" are two
		// different Better Auth accounts, both linked to "party_shared" — the
		// scenario a raw `actorUserId` comparison structurally cannot catch.
		const { events, service, sessions } = createHarness({
			partyResolution: (authUserId) =>
				authUserId === "user_closer" || authUserId === "user_alt_login"
					? "party_shared"
					: `party_${authUserId}`,
		});
		await service.openRegister({
			...base,
			actorUserId: "user_closer",
			currency: "GYD",
			idempotencyKey: "finding-c-variance-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_finding_c_variance",
		});
		const closing = await service.closeRegister({
			...base,
			actorUserId: "user_closer",
			countedCash: { amountMinor: 900, currency: "GYD" },
			idempotencyKey: "finding-c-variance-close",
			registerId: "register_finding_c_variance",
		});
		expect(closing.state).toBe("Closing");
		const sessionBefore = sessions.get(closing.id);
		const eventCountBefore = events.length;

		const crossAccountSelfApproval = service.approveCashVariance({
			actorUserId: "user_alt_login",
			correlationId: base.correlationId,
			idempotencyKey: "finding-c-variance-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		await expect(crossAccountSelfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		// No business effect: the session row is byte-for-byte unchanged and
		// no `commerce.register.closed.v1` event was appended.
		expect(sessions.get(closing.id)).toEqual(sessionBefore);
		expect(events).toHaveLength(eventCountBefore);

		// A genuinely different Party can still approve it.
		const approved = await service.approveCashVariance({
			actorUserId: "user_real_checker",
			correlationId: base.correlationId,
			idempotencyKey: "finding-c-variance-approve-real",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		expect(approved.state).toBe("Closed");
	});

	test("WS3 remediation R2, Finding C: a missing/ambiguous Party mapping is a safe denial for cash-variance approval, with no state change", async () => {
		const { events, service, sessions } = createHarness({
			partyResolution: (authUserId) =>
				authUserId === "user_no_party" ? null : `party_${authUserId}`,
		});
		await service.openRegister({
			...base,
			actorUserId: "user_closer_np",
			currency: "GYD",
			idempotencyKey: "finding-c-variance-np-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_finding_c_variance_np",
		});
		const closing = await service.closeRegister({
			...base,
			actorUserId: "user_closer_np",
			countedCash: { amountMinor: 900, currency: "GYD" },
			idempotencyKey: "finding-c-variance-np-close",
			registerId: "register_finding_c_variance_np",
		});
		const sessionBefore = sessions.get(closing.id);
		const eventCountBefore = events.length;

		const attempt = service.approveCashVariance({
			actorUserId: "user_no_party",
			correlationId: base.correlationId,
			idempotencyKey: "finding-c-variance-np-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_reference" });
		expect(sessions.get(closing.id)).toEqual(sessionBefore);
		expect(events).toHaveLength(eventCountBefore);
	});

	test("replays an idempotent open and cash-movement command without duplicating effects", async () => {
		const { events, movements, service, sessions } = createHarness();
		const first = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "replay-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_replay",
		});
		const replayed = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "replay-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_replay",
		});
		expect(replayed).toEqual(first);
		expect(sessions.size).toBe(1);
		expect(
			events.filter(
				(envelope) => envelope.name === "commerce.register.opened.v1"
			)
		).toHaveLength(1);

		const firstMovement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 250, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "replay-movement",
			reasonCode: "PaidIn",
			registerId: "register_replay",
		});
		const replayedMovement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 250, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "replay-movement",
			reasonCode: "PaidIn",
			registerId: "register_replay",
		});
		expect(replayedMovement).toEqual(firstMovement);
		expect(movements).toHaveLength(1);
	});

	test("rejects a different request body reusing an already-claimed idempotency key", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "conflict-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_conflict",
		});
		const conflicting = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "conflict-open",
			openingFloat: { amountMinor: 999, currency: "GYD" },
			registerId: "register_conflict_other",
		});
		await expect(conflicting).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
	});

	test("validates money and direction/reason-code pairing at the domain boundary", async () => {
		const { service } = createHarness();
		await expect(
			service.openRegister({
				...base,
				currency: "GY",
				idempotencyKey: "validation-bad-currency",
				openingFloat: { amountMinor: 100, currency: "GY" },
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "validation-negative-float",
				openingFloat: { amountMinor: -1, currency: "GYD" },
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "validation-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: "register_validation",
		});

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 0, currency: "GYD" },
				direction: "PaidIn",
				idempotencyKey: "validation-zero-amount",
				reasonCode: "PaidIn",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 100, currency: "USD" },
				direction: "PaidIn",
				idempotencyKey: "validation-currency-mismatch",
				reasonCode: "PaidIn",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 100, currency: "GYD" },
				direction: "PaidIn",
				idempotencyKey: "validation-safe-drop-direction",
				reasonCode: "SafeDrop",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });
	});
});

describe("POS domain: Register cash-ledger integrity (WS3 remediation R1, Finding A + Finding E)", () => {
	/** Opens `registerId` with `openingFloatMinor`, completes ONE cash sale
	 * of a single `unitPriceMinor` line at the untaxed `GY_EXEMPT` category
	 * (so `sale.total === unitPriceMinor` exactly, keeping the ledger
	 * arithmetic in every test below trivially checkable), tendered with
	 * `tenderedMinor` in cash. Returns the sale so callers can compute the
	 * expected change/net-cash-in themselves. */
	async function openAndCompleteExemptSale(
		service: ReturnType<typeof createHarness>["service"],
		input: {
			openingFloatMinor: number;
			registerId: string;
			tenderedMinor: number;
			unitPriceMinor: number;
		}
	) {
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${input.registerId}-open`,
			openingFloat: { amountMinor: input.openingFloatMinor, currency: "GYD" },
			registerId: input.registerId,
		});
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${input.registerId}-sale-create`,
			lines: [
				{
					productId: "prod_ledger",
					quantity: "1",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: input.unitPriceMinor, currency: "GYD" },
				},
			],
			registerId: input.registerId,
		});
		expect(sale.total).toEqual({
			amountMinor: input.unitPriceMinor,
			currency: "GYD",
		});
		const completed = await service.completeSale({
			...base,
			idempotencyKey: `${input.registerId}-sale-complete`,
			saleId: sale.id,
			tenders: [
				{ amountMinor: input.tenderedMinor, currency: "GYD", type: "Cash" },
			],
		});
		return { completed, sale };
	}

	test("Finding A: opening float 100 + a cash sale tendered 20 against a total of 9 (change 11) => expected cash 109, posted atomically with sale completion", async () => {
		const { movements, service } = createHarness();
		const { completed } = await openAndCompleteExemptSale(service, {
			openingFloatMinor: 100,
			registerId: "register_ledger_expected_109",
			tenderedMinor: 20,
			unitPriceMinor: 9,
		});
		expect(completed.change).toEqual({ amountMinor: 11, currency: "GYD" });

		// Atomic with `sale.complete` itself (Finding A: "no separate
		// follow-up write") — the movement already exists by the time
		// `completeSale` has returned, referencing the sale.
		const saleMovement = movements.find(
			(movement) => movement.referenceId === completed.id
		);
		expect(saleMovement).toMatchObject({
			amountMinor: 9,
			direction: "PaidIn",
			reasonCode: "Other",
		});

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 109, currency: "GYD" },
			idempotencyKey: "register_ledger_expected_109-close",
			registerId: "register_ledger_expected_109",
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 109, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("Finding A: counting only the original float (100) in the same 20-tender/9-total/11-change scenario surfaces a -9 variance — PROVEN failing pre-fix: before Finding A the sale's cash-in was excluded from expectedCashMinor, so this would have read variance 0 (100 counted - 100 expected), not -9", async () => {
		const { service } = createHarness();
		await openAndCompleteExemptSale(service, {
			openingFloatMinor: 100,
			registerId: "register_ledger_variance_neg9",
			tenderedMinor: 20,
			unitPriceMinor: 9,
		});
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 100, currency: "GYD" },
			idempotencyKey: "register_ledger_variance_neg9-close",
			registerId: "register_ledger_variance_neg9",
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 109, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: -9, currency: "GYD" });
		expect(closed.varianceApprovalRequired).toBe(true);
		expect(closed.state).toBe("Closing");
	});

	test("Finding A: a posted cash refund reduces expected cash by exactly the refunded amount (partial return, non-boundary)", async () => {
		const harness = createHarness();
		const { movements, service } = harness;
		const registerId = "register_ledger_refund_reduces";
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId,
		});
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-sale-create`,
			lines: [
				{
					productId: "prod_ledger_refund",
					quantity: "2",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: 9, currency: "GYD" },
				},
			],
			registerId,
		});
		expect(sale.total).toEqual({ amountMinor: 18, currency: "GYD" });
		const completed = await service.completeSale({
			...base,
			idempotencyKey: `${registerId}-sale-complete`,
			saleId: sale.id,
			tenders: [{ amountMinor: 18, currency: "GYD", type: "Cash" }],
		});
		const lineId = completed.lines[0]?.id as string;

		// Half of the 2-unit line: refund = 9, half of the 18 total.
		const created = await service.createReturn({
			...base,
			idempotencyKey: "ledger-refund-reduces-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Partial return, Finding A ledger check",
			saleId: sale.id,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "ledger-refund-reduces-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "ledger-refund-reduces-refund-create",
			returnId: approvedReturn.id,
		});
		expect(refund.amount).toEqual({ amountMinor: 9, currency: "GYD" });
		const posted = await service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "ledger-refund-reduces-refund-approve",
			refundId: refund.id,
		});
		expect(posted.state).toBe("Posted");
		expect(
			movements.filter((movement) => movement.referenceId === refund.id)
		).toHaveLength(1);

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 9, currency: "GYD" },
			idempotencyKey: "ledger-refund-reduces-close",
			registerId,
		});
		// 18 (sale) - 9 (refund) = 9: expected cash dropped by exactly the
		// refund amount, not merely "some" reduction.
		expect(closed.expectedCash).toEqual({ amountMinor: 9, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("Finding A: paid-in, paid-out, safe-drop, deposit, sale, refund, and a reversal-correction all compose into one correct final expected cash in a single register session", async () => {
		const harness = createHarness();
		const { depositCustodyTransfers, movements, service } = harness;
		const registerId = "register_ledger_signs_compose";
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId,
		});
		// running expected cash starts at 1000.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 200, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: `${registerId}-paid-in`,
			reasonCode: "PaidIn",
			registerId,
		});
		// running: 1200.
		const sale1 = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-sale1-create`,
			lines: [
				{
					productId: "prod_signs_1",
					quantity: "1",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: 500, currency: "GYD" },
				},
			],
			registerId,
		});
		await service.completeSale({
			...base,
			idempotencyKey: `${registerId}-sale1-complete`,
			saleId: sale1.id,
			tenders: [{ amountMinor: 500, currency: "GYD", type: "Cash" }],
		});
		// running: 1700.
		const sale2 = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-sale2-create`,
			lines: [
				{
					productId: "prod_signs_2",
					quantity: "1",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: 100, currency: "GYD" },
				},
			],
			registerId,
		});
		const completedSale2 = await service.completeSale({
			...base,
			idempotencyKey: `${registerId}-sale2-complete`,
			saleId: sale2.id,
			tenders: [{ amountMinor: 100, currency: "GYD", type: "Cash" }],
		});
		// running: 1800.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 150, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-paid-out`,
			reasonCode: "PaidOut",
			registerId,
		});
		// running: 1650.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 300, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-safe-drop`,
			reasonCode: "SafeDrop",
			registerId,
		});
		// running: 1350.

		// Refund (full return of sale2, 100): running 1350 -> 1250.
		const sale2LineId = completedSale2.lines[0]?.id as string;
		const return2 = await service.createReturn({
			...base,
			idempotencyKey: `${registerId}-return2-create`,
			lines: [{ quantity: "1", saleLineId: sale2LineId }],
			reason: "Full return of sale2",
			saleId: sale2.id,
		});
		const approvedReturn2 = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: `${registerId}-return2-approve`,
			returnId: return2.id,
		});
		const refund2 = await service.createRefund({
			...base,
			idempotencyKey: `${registerId}-refund2-create`,
			returnId: approvedReturn2.id,
		});
		expect(refund2.amount).toEqual({ amountMinor: 100, currency: "GYD" });
		await service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: `${registerId}-refund2-approve`,
			refundId: refund2.id,
		});
		// running: 1250.

		// Reversal/correction pair (CLAUDE.md §5: corrections are a NEW
		// opposite entry, never an edit): an erroneous paid-out immediately
		// corrected by an opposite paid-in nets to zero without disturbing
		// the running total.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 50, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-erroneous-paid-out`,
			reasonCode: "Other",
			registerId,
		});
		// running: 1200.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 50, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: `${registerId}-reversal-correction`,
			note: "correction of erroneous paid-out",
			reasonCode: "Other",
			registerId,
		});
		// running: 1250.

		// Deposit: reserves against the 300 safe-drop and confirms a
		// custody transfer OUT of the safe (never the drawer) — this must
		// NOT further move the register's own expected cash; the safe-drop
		// already accounted for it.
		const sessionId = movements.find(
			(movement) => movement.reasonCode === "SafeDrop"
		)?.sessionId as string;
		const deposit = await service.createDeposit({
			...base,
			countedAmountMinor: 300,
			currency: "GYD",
			idempotencyKey: `${registerId}-deposit-create`,
			sourceShiftIds: [sessionId],
		});
		await service.confirmDeposit({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			depositId: deposit.id,
			idempotencyKey: `${registerId}-deposit-confirm`,
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		expect(depositCustodyTransfers).toHaveLength(1);

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1250, currency: "GYD" },
			idempotencyKey: `${registerId}-close`,
			registerId,
		});
		// 1000 (float) + 200 (paid-in) + 500 (sale1) + 100 (sale2) - 150
		// (paid-out) - 300 (safe-drop) - 100 (refund) - 50 (erroneous
		// paid-out) + 50 (correction) = 1250. Deposit confirmation
		// contributes nothing further.
		expect(closed.expectedCash).toEqual({
			amountMinor: 1250,
			currency: "GYD",
		});
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("Finding A: a sale rejected for negative stock (rolled back) posts NO cash-ledger entry and does not change drawer cash", async () => {
		const harness = createHarness();
		const { movements, negativeStockProductIds, service } = harness;
		const registerId = "register_ledger_sale_rollback";
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 500, currency: "GYD" },
			registerId,
		});
		negativeStockProductIds.add("prod_oversold");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-sale-create`,
			lines: [
				{
					productId: "prod_oversold",
					quantity: "1",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: 50, currency: "GYD" },
				},
			],
			registerId,
		});
		const attempt = service.completeSale({
			...base,
			idempotencyKey: `${registerId}-sale-complete`,
			saleId: sale.id,
			tenders: [{ amountMinor: 50, currency: "GYD", type: "Cash" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "negative_stock" });

		// The failed sale's inventory check runs BEFORE any cash-ledger
		// write (Finding A posts only after `updateSale` succeeds), so
		// nothing was ever appended for it.
		expect(
			movements.find((movement) => movement.referenceId === sale.id)
		).toBeUndefined();
		expect(movements).toHaveLength(0);

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 500, currency: "GYD" },
			idempotencyKey: `${registerId}-close`,
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 500, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("Finding A: a repeated/idempotent close command does not double-post or re-derive expected cash", async () => {
		const harness = createHarness();
		const { movements, service, sessions } = harness;
		const registerId = "register_ledger_idempotent_close";
		await openAndCompleteExemptSale(service, {
			openingFloatMinor: 100,
			registerId,
			tenderedMinor: 20,
			unitPriceMinor: 9,
		});
		const movementCountAfterSale = movements.length;

		const first = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 109, currency: "GYD" },
			idempotencyKey: `${registerId}-close-repeat`,
			registerId,
		});
		expect(first.state).toBe("Closed");
		expect(first.version).toBe(2);
		const versionAfterFirstClose = sessions.get(first.id)?.version;

		// Same idempotency key AND the same request fingerprint (identical
		// countedCash/reason/registerId): must short-circuit to the exact
		// prior result via `replay`, never re-run the close logic.
		const second = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 109, currency: "GYD" },
			idempotencyKey: `${registerId}-close-repeat`,
			registerId,
		});
		expect(second).toEqual(first);
		expect(sessions.get(first.id)?.version).toBe(versionAfterFirstClose);
		// The sale's own cash-ledger entry is untouched — closing never
		// posts to the ledger itself, and replay never re-executes the
		// handler that would have looked up the sale ledger again.
		expect(movements).toHaveLength(movementCountAfterSale);
	});

	test("Finding E: a manual cash-out that would drive expected cash negative is rejected with no ledger entry, no event, and no state change", async () => {
		const harness = createHarness();
		const { events, movements, service, sessions } = harness;
		const registerId = "register_ledger_e_reject";
		const opened = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId,
		});
		const versionBefore = opened.version;
		const movementsBefore = movements.length;
		const eventsBefore = events.length;

		const attempt = service.createCashMovement({
			...base,
			amount: { amountMinor: 150, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-over-drawn`,
			reasonCode: "PaidOut",
			registerId,
		});
		await expect(attempt).rejects.toMatchObject({ code: "insufficient_cash" });
		await expect(attempt).rejects.toBeInstanceOf(PosError);

		expect(movements).toHaveLength(movementsBefore);
		expect(events).toHaveLength(eventsBefore);
		expect(sessions.get(opened.id)?.version).toBe(versionBefore);

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 100, currency: "GYD" },
			idempotencyKey: `${registerId}-close`,
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 100, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("Finding E: a manual cash-out that keeps expected cash at or above zero still succeeds normally", async () => {
		const { events, movements, service } = createHarness();
		const registerId = "register_ledger_e_allow";
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId,
		});
		const movement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 60, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-within-bounds`,
			reasonCode: "PaidOut",
			registerId,
		});
		expect(movement.amount).toEqual({ amountMinor: 60, currency: "GYD" });
		expect(movements).toHaveLength(1);
		expect(
			events.some(
				(envelope) => envelope.name === "commerce.cash-movement.posted.v1"
			)
		).toBe(true);

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 40, currency: "GYD" },
			idempotencyKey: `${registerId}-close`,
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 40, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("Finding E: a manual cash-out landing EXACTLY at the zero boundary succeeds (schema minimum:0 satisfied, not weakened)", async () => {
		const { service } = createHarness();
		const registerId = "register_ledger_e_boundary";
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId,
		});
		const movement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 100, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-exact-drain`,
			reasonCode: "PaidOut",
			registerId,
		});
		expect(movement.amount).toEqual({ amountMinor: 100, currency: "GYD" });

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: `${registerId}-close`,
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});
});

describe("POS domain: Sale, PriceOverride, Receipt", () => {
	function openSaleRegister(
		service: ReturnType<typeof createHarness>["service"],
		registerId = "register_sale"
	) {
		return service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId,
		});
	}

	test("creates a sale, prices and taxes lines against the tax pack, and completes it with cash tender, change, receipt, and inventory movement", async () => {
		const { service, sales, saleReceipts, stockMovements, events } =
			createHarness();
		await openSaleRegister(service);
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-create-1",
			lines: [
				{
					productId: "prod_standard",
					quantity: "2",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" }, // 1000.00 GYD
				},
				{
					productId: "prod_zero_rated",
					quantity: "1",
					taxCategory: "GY_ZERO_RATED",
					unit: "each",
					unitPrice: { amountMinor: 50_000, currency: "GYD" }, // 500.00 GYD
				},
			],
			registerId: "register_sale",
		});
		expect(sale.state).toBe("Open");
		expect(sale.lines).toHaveLength(2);
		// 2 x 1000.00 = 2000.00 gross, 14% VAT = 280.00
		expect(sale.lines[0]?.gross).toEqual({
			amountMinor: 200_000,
			currency: "GYD",
		});
		expect(sale.lines[0]?.tax).toEqual({
			amountMinor: 28_000,
			currency: "GYD",
		});
		expect(sale.lines[0]?.taxCategory).toBe("GY_STANDARD_14");
		// zero-rated line has no tax
		expect(sale.lines[1]?.tax).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(sale.gross).toEqual({ amountMinor: 250_000, currency: "GYD" });
		expect(sale.tax).toEqual({ amountMinor: 28_000, currency: "GYD" });
		expect(sale.total).toEqual({ amountMinor: 278_000, currency: "GYD" });
		expect(sales.get(sale.id)?.state).toBe("Open");

		const completed = await service.completeSale({
			...base,
			idempotencyKey: "sale-complete-1",
			saleId: sale.id,
			tenders: [{ amountMinor: 300_000, currency: "GYD", type: "Cash" }],
		});
		expect(completed.state).toBe("Completed");
		expect(completed.tendered).toEqual({
			amountMinor: 300_000,
			currency: "GYD",
		});
		expect(completed.change).toEqual({ amountMinor: 22_000, currency: "GYD" });
		expect(completed.receiptId).not.toBeNull();

		// Synchronous Inventory stock movement, one per line, positive
		// (sold) quantity — the sign flip to a decrement happens inside
		// Inventory's own `recordSaleMovement`, not here.
		expect(stockMovements).toEqual([
			{ productId: "prod_standard", quantity: "2" },
			{ productId: "prod_zero_rated", quantity: "1" },
		]);

		const receipt = saleReceipts.get(completed.receiptId as string);
		expect(receipt?.receiptNumber).toMatch(RECEIPT_NUMBER_PATTERN_SALE);
		expect(receipt?.kind).toBe("Sale");
		expect(receipt?.totalMinor).toBe(278_000);

		const completedEvent = events.find(
			(envelope) => envelope.name === "commerce.sale.completed.v1"
		);
		expect(completedEvent?.data).toMatchObject({
			completionMode: "Online",
			currency: "GYD",
			discountMinor: 0,
			grossMinor: 250_000,
			receiptId: completed.receiptId,
			registerId: "register_sale",
			saleId: sale.id,
			taxMinor: 28_000,
			totalMinor: 278_000,
		});
		expect(completedEvent?.data.tenders).toEqual([
			{ amountMinor: 300_000, referenceId: null, type: "Cash" },
		]);
		const receiptEvent = events.find(
			(envelope) => envelope.name === "commerce.receipt.issued.v1"
		);
		expect(receiptEvent?.data).toMatchObject({
			kind: "Sale",
			priceSuppressed: false,
			receiptId: completed.receiptId,
			registerId: "register_sale",
			saleId: sale.id,
			totalMinor: 278_000,
		});
	});

	test("applies a per-line discount before computing tax", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_discount");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-discount-1",
			lines: [
				{
					discountAmount: { amountMinor: 20_000, currency: "GYD" }, // 200.00 off
					productId: "prod_discounted",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" },
				},
			],
			registerId: "register_discount",
		});
		expect(sale.lines[0]?.discount).toEqual({
			amountMinor: 20_000,
			currency: "GYD",
		});
		// taxable base = 1000.00 - 200.00 = 800.00; VAT 14% = 112.00
		expect(sale.lines[0]?.taxableBase).toEqual({
			amountMinor: 80_000,
			currency: "GYD",
		});
		expect(sale.lines[0]?.tax).toEqual({
			amountMinor: 11_200,
			currency: "GYD",
		});
	});

	test("rejects sale creation when the register has no open session", async () => {
		const { service } = createHarness();
		const attempt = service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-no-register",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 10_000, currency: "GYD" },
				},
			],
			registerId: "register_never_opened",
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("rejects completion once the sale's register session has been closed (custody link)", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_closed_complete");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-closedcomplete-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 10_000, currency: "GYD" },
				},
			],
			registerId: "register_closed_complete",
		});
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "sale-closedcomplete-close",
			registerId: "register_closed_complete",
		});
		expect(closed.state).toBe("Closed");

		const attempt = service.completeSale({
			...base,
			idempotencyKey: "sale-closedcomplete-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 10_000, currency: "GYD", type: "Cash" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
		await expect(attempt).rejects.toBeInstanceOf(PosError);
	});

	test("rejects a sale with no lines", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_empty");
		const attempt = service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-empty",
			lines: [],
			registerId: "register_empty",
		});
		await expect(attempt).rejects.toMatchObject({ code: "validation" });
	});

	test("rejects a non-Cash tender politely at the completion boundary (WS4/WS6 scope)", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_noncash");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-noncash-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 10_000, currency: "GYD" },
				},
			],
			registerId: "register_noncash",
		});
		const attempt = service.completeSale({
			...base,
			idempotencyKey: "sale-noncash-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 20_000, currency: "GYD", type: "StoredValue" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "validation" });
	});

	test("rejects completion when tendered cash is less than the sale total", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_shorttender");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-shorttender-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" },
				},
			],
			registerId: "register_shorttender",
		});
		const attempt = service.completeSale({
			...base,
			idempotencyKey: "sale-shorttender-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 50_000, currency: "GYD", type: "Cash" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "validation" });
	});

	test("rejects completion when a line's stock movement reports negative stock", async () => {
		const { negativeStockProductIds, service } = createHarness();
		await openSaleRegister(service, "register_negativestock");
		negativeStockProductIds.add("prod_out_of_stock");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-negstock-1",
			lines: [
				{
					productId: "prod_out_of_stock",
					quantity: "5",
					unit: "each",
					unitPrice: { amountMinor: 10_000, currency: "GYD" },
				},
			],
			registerId: "register_negativestock",
		});
		const attempt = service.completeSale({
			...base,
			idempotencyKey: "sale-negstock-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 100_000, currency: "GYD", type: "Cash" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "negative_stock" });
	});

	test("holds an Open sale and completes it after hold via implicit resume", async () => {
		const { service, events } = createHarness();
		await openSaleRegister(service, "register_hold");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-hold-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 50_000, currency: "GYD" },
				},
			],
			registerId: "register_hold",
		});
		const held = await service.holdSale({
			...base,
			idempotencyKey: "sale-hold-op",
			saleId: sale.id,
		});
		expect(held.state).toBe("Held");
		expect(held.heldAt).not.toBeNull();
		expect(
			events.some((envelope) => envelope.name === "commerce.sale.held.v1")
		).toBe(true);

		const completed = await service.completeSale({
			...base,
			idempotencyKey: "sale-hold-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 60_000, currency: "GYD", type: "Cash" }],
		});
		expect(completed.state).toBe("Completed");
	});

	test("rejects holding a sale that is not Open", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_hold_twice");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-hold-twice-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 50_000, currency: "GYD" },
				},
			],
			registerId: "register_hold_twice",
		});
		await service.holdSale({
			...base,
			idempotencyKey: "sale-hold-twice-op1",
			saleId: sale.id,
		});
		const secondHold = service.holdSale({
			...base,
			idempotencyKey: "sale-hold-twice-op2",
			saleId: sale.id,
		});
		await expect(secondHold).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("price override maker/checker: requester cannot self-approve; a different approver applies the requested price and unblocks completion", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_override");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-override-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" },
				},
			],
			registerId: "register_override",
		});
		const lineId = sale.lines[0]?.id as string;

		const requested = await service.requestPriceOverride({
			...base,
			idempotencyKey: "override-request-1",
			lineId,
			reason: "Manager-approved discount for damaged packaging",
			requestedPrice: { amountMinor: 80_000, currency: "GYD" },
			saleId: sale.id,
		});
		expect(requested.lines[0]?.priceOverrideState).toBe("Pending");
		const overrideId = requested.lines[0]?.priceOverrideId as string;
		expect(overrideId).toBeTruthy();
		// Unit price is unchanged until approval.
		expect(requested.lines[0]?.unitPrice).toEqual({
			amountMinor: 100_000,
			currency: "GYD",
		});

		// Sale cannot complete while the override is Pending.
		const blockedCompletion = service.completeSale({
			...base,
			idempotencyKey: "override-blocked-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 200_000, currency: "GYD", type: "Cash" }],
		});
		await expect(blockedCompletion).rejects.toMatchObject({
			code: "invalid_state",
		});

		const selfApproval = service.approvePriceOverride({
			...base,
			idempotencyKey: "override-self-approve",
			overrideId,
			saleId: sale.id,
		});
		await expect(selfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});

		const approved = await service.approvePriceOverride({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			idempotencyKey: "override-approve-1",
			organizationId: base.organizationId,
			overrideId,
			saleId: sale.id,
			tenantId: base.tenantId,
		});
		expect(approved.lines[0]?.priceOverrideState).toBe("Approved");
		expect(approved.lines[0]?.unitPrice).toEqual({
			amountMinor: 80_000,
			currency: "GYD",
		});
		// 800.00 x 14% = 112.00
		expect(approved.lines[0]?.tax).toEqual({
			amountMinor: 11_200,
			currency: "GYD",
		});
		expect(approved.total).toEqual({ amountMinor: 91_200, currency: "GYD" });

		const completed = await service.completeSale({
			...base,
			idempotencyKey: "override-complete-1",
			saleId: sale.id,
			tenders: [{ amountMinor: 91_200, currency: "GYD", type: "Cash" }],
		});
		expect(completed.state).toBe("Completed");
		expect(completed.change).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("WS3 remediation R2, Finding C: denies price-override self-approval across TWO DIFFERENT auth accounts that resolve to the SAME Party, with no state change", async () => {
		const { events, priceOverrides, service } = createHarness({
			partyResolution: (authUserId) =>
				authUserId === "user_requester" || authUserId === "user_alt_login"
					? "party_shared"
					: `party_${authUserId}`,
		});
		await openSaleRegister(service, "register_override_finding_c");
		const sale = await service.createSale({
			...base,
			actorUserId: "user_requester",
			currency: "GYD",
			idempotencyKey: "sale-override-finding-c",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" },
				},
			],
			registerId: "register_override_finding_c",
		});
		const lineId = sale.lines[0]?.id as string;
		const requested = await service.requestPriceOverride({
			...base,
			actorUserId: "user_requester",
			idempotencyKey: "override-request-finding-c",
			lineId,
			reason: "Manager-approved discount for damaged packaging",
			requestedPrice: { amountMinor: 80_000, currency: "GYD" },
			saleId: sale.id,
		});
		const overrideId = requested.lines[0]?.priceOverrideId as string;
		const overrideBefore = priceOverrides.get(overrideId);
		const eventCountBefore = events.length;

		const crossAccountSelfApproval = service.approvePriceOverride({
			actorUserId: "user_alt_login",
			correlationId: base.correlationId,
			idempotencyKey: "override-approve-finding-c",
			organizationId: base.organizationId,
			overrideId,
			saleId: sale.id,
			tenantId: base.tenantId,
		});
		await expect(crossAccountSelfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(priceOverrides.get(overrideId)).toEqual(overrideBefore);
		expect(priceOverrides.get(overrideId)?.state).toBe("Pending");
		expect(events).toHaveLength(eventCountBefore);

		const approved = await service.approvePriceOverride({
			actorUserId: "user_real_checker",
			correlationId: base.correlationId,
			idempotencyKey: "override-approve-finding-c-real",
			organizationId: base.organizationId,
			overrideId,
			saleId: sale.id,
			tenantId: base.tenantId,
		});
		expect(approved.lines[0]?.priceOverrideState).toBe("Approved");
	});

	test("requesting a price override on a Held sale implicitly resumes it to Open (frozen control plan §6.2) with totals unchanged", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_override_held");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-override-held-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 100_000, currency: "GYD" },
				},
			],
			registerId: "register_override_held",
		});
		const lineId = sale.lines[0]?.id as string;

		const held = await service.holdSale({
			...base,
			idempotencyKey: "sale-override-held-op",
			saleId: sale.id,
		});
		expect(held.state).toBe("Held");

		const requested = await service.requestPriceOverride({
			...base,
			idempotencyKey: "override-request-held-1",
			lineId,
			reason: "Manager-approved discount for damaged packaging",
			requestedPrice: { amountMinor: 80_000, currency: "GYD" },
			saleId: sale.id,
		});
		expect(requested.state).toBe("Open");
		expect(requested.lines[0]?.priceOverrideState).toBe("Pending");
		// Requesting an override only stamps markers; price and totals are
		// unchanged until approval.
		expect(requested.lines[0]?.unitPrice).toEqual({
			amountMinor: 100_000,
			currency: "GYD",
		});
		expect(requested.total).toEqual(held.total);
	});

	test("replays an idempotent sale.create and sale.complete without duplicating a receipt or stock movement", async () => {
		const { service, saleReceipts, stockMovements } = createHarness();
		await openSaleRegister(service, "register_sale_replay");
		const createInput = {
			...base,
			currency: "GYD",
			idempotencyKey: "sale-replay-create",
			lines: [
				{
					productId: "prod_replay",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 25_000, currency: "GYD" },
				},
			],
			registerId: "register_sale_replay",
		};
		const [first, replayed] = await Promise.all([
			service.createSale(createInput),
			service.createSale(createInput),
		]);
		expect(replayed).toEqual(first);

		const completeInput = {
			...base,
			idempotencyKey: "sale-replay-complete",
			saleId: first.id,
			tenders: [
				{
					amountMinor: 30_000,
					currency: "GYD" as const,
					type: "Cash" as const,
				},
			],
		};
		const [firstComplete, replayedComplete] = await Promise.all([
			service.completeSale(completeInput),
			service.completeSale(completeInput),
		]);
		expect(replayedComplete).toEqual(firstComplete);
		expect(saleReceipts.size).toBe(1);
		expect(stockMovements).toHaveLength(1);
	});

	test("reads back a persisted receipt by id", async () => {
		const { service } = createHarness();
		await openSaleRegister(service, "register_receipt_read");
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "sale-receipt-read-1",
			lines: [
				{
					productId: "prod_1",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 10_000, currency: "GYD" },
				},
			],
			registerId: "register_receipt_read",
		});
		const completed = await service.completeSale({
			...base,
			idempotencyKey: "sale-receipt-read-complete",
			saleId: sale.id,
			tenders: [{ amountMinor: 20_000, currency: "GYD", type: "Cash" }],
		});
		const receipt = await service.getReceipt(
			base.tenantId,
			base.organizationId,
			completed.receiptId as string
		);
		expect(receipt.receiptNumber).toMatch(RECEIPT_NUMBER_PATTERN_RECEIPT_READ);
		expect(receipt.kind).toBe("Sale");
		expect(receipt.saleId).toBe(sale.id);
	});

	test("uses only the registered prototype tax categories", () => {
		expect(SALE_LINE_TAX_CATEGORIES).toEqual([
			"GY_STANDARD_14",
			"GY_ZERO_RATED",
			"GY_EXEMPT",
			"GY_OUT_OF_SCOPE",
		]);
	});
});

describe("POS domain: Return, Refund, Void, Reissue, Exchange", () => {
	async function completedSale(
		harness: ReturnType<typeof createHarness>,
		registerId: string,
		options?: { quantity?: string; unitPriceMinor?: number }
	) {
		const { service } = harness;
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-open`,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId,
		});
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: `${registerId}-sale-create`,
			lines: [
				{
					productId: "prod_returnable",
					quantity: options?.quantity ?? "4",
					unit: "each",
					unitPrice: {
						amountMinor: options?.unitPriceMinor ?? 100_000,
						currency: "GYD",
					}, // 1000.00 GYD, 14% VAT
				},
			],
			registerId,
		});
		const completed = await service.completeSale({
			...base,
			idempotencyKey: `${registerId}-sale-complete`,
			saleId: sale.id,
			tenders: [
				{ amountMinor: sale.total.amountMinor, currency: "GYD", type: "Cash" },
			],
		});
		const lineId = completed.lines[0]?.id as string;
		return { completed, lineId, registerId, saleId: sale.id };
	}

	test("uses Pending -> Completed for a return and Requested -> Posted for a refund, never pre-approved", () => {
		expect(RETURN_STATES).toEqual(["Pending", "Completed"]);
		expect(RETURN_MODES).toEqual(["Return", "Void"]);
		expect(REFUND_STATES).toEqual(["Requested", "Posted"]);
	});

	test("creates a Pending return, rejects self-approval, and approving it by another actor posts the compensating Inventory movement, links a Return receipt, and emits commerce.return.completed.v1", async () => {
		const harness = createHarness();
		const { service, events, returnMovements, saleReceipts } = harness;
		const { completed, lineId, registerId, saleId } = await completedSale(
			harness,
			"register_return_happy"
		);

		const created = await service.createReturn({
			...base,
			idempotencyKey: "return-create-1",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Customer changed mind",
			saleId,
		});
		expect(created.state).toBe("Pending");
		expect(created.mode).toBe("Return");
		expect(created.registerId).toBe(registerId);
		// 1 of 4 units: unit price 1000.00 -> 1000.00 gross + 140.00 (14%)
		// tax = 1140.00 -> 114_000 minor, apportioned from the original
		// line's 4-unit total (4560.00 -> 456_000 minor) at 1/4.
		expect(created.totalRefundable).toEqual({
			amountMinor: 114_000,
			currency: "GYD",
		});

		const selfApprove = service.approveReturn({
			...base,
			idempotencyKey: "return-approve-self",
			returnId: created.id,
		});
		await expect(selfApprove).rejects.toMatchObject({
			code: "approval_separation",
		});

		const approved = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "return-approve-1",
			returnId: created.id,
		});
		expect(approved.state).toBe("Completed");
		expect(approved.receiptId).not.toBeNull();
		expect(returnMovements).toEqual([
			{
				productId: "prod_returnable",
				quantity: "1",
				reversalOfMovementId: "movement_prod_returnable",
			},
		]);
		const returnReceipt = saleReceipts.get(approved.receiptId as string);
		expect(returnReceipt?.kind).toBe("Return");
		expect(returnReceipt?.originalReceiptId).toBe(completed.receiptId);
		expect(returnReceipt?.returnId).toBe(created.id);

		const returnEvent = events.find(
			(envelope) => envelope.name === "commerce.return.completed.v1"
		);
		expect(returnEvent?.data).toMatchObject({
			mode: "Return",
			registerId,
			returnId: created.id,
			saleId,
		});
	});

	test("WS3 remediation R2, Finding C: denies return self-approval across TWO DIFFERENT auth accounts that resolve to the SAME Party, with no state change", async () => {
		const harness = createHarness({
			partyResolution: (authUserId) =>
				authUserId === "user_creator" || authUserId === "user_alt_login"
					? "party_shared"
					: `party_${authUserId}`,
		});
		const { events, returns, service } = harness;
		const { lineId, saleId } = await completedSale(
			harness,
			"register_return_finding_c"
		);
		const created = await service.createReturn({
			...base,
			actorUserId: "user_creator",
			idempotencyKey: "return-create-finding-c",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Customer changed mind",
			saleId,
		});
		const returnBefore = returns.get(created.id);
		const eventCountBefore = events.length;

		const crossAccountSelfApproval = service.approveReturn({
			...base,
			actorUserId: "user_alt_login",
			idempotencyKey: "return-approve-finding-c",
			returnId: created.id,
		});
		await expect(crossAccountSelfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(returns.get(created.id)).toEqual(returnBefore);
		expect(returns.get(created.id)?.state).toBe("Pending");
		expect(events).toHaveLength(eventCountBefore);

		const approved = await service.approveReturn({
			...base,
			actorUserId: "user_real_checker",
			idempotencyKey: "return-approve-finding-c-real",
			returnId: created.id,
		});
		expect(approved.state).toBe("Completed");
	});

	test("prevents an over-return, cumulative across two partial returns", async () => {
		const harness = createHarness();
		const { service } = harness;
		const { lineId, saleId } = await completedSale(
			harness,
			"register_over_return",
			{ quantity: "4" }
		);

		const firstReturn = await service.createReturn({
			...base,
			idempotencyKey: "over-return-1",
			lines: [{ quantity: "2", saleLineId: lineId }],
			reason: "Partial return 1",
			saleId,
		});
		expect(firstReturn.state).toBe("Pending");

		const secondReturn = await service.createReturn({
			...base,
			idempotencyKey: "over-return-2",
			lines: [{ quantity: "2", saleLineId: lineId }],
			reason: "Partial return 2 - exactly the remainder",
			saleId,
		});
		expect(secondReturn.state).toBe("Pending");

		// A third return for even one more unit now exceeds the original
		// quantity of 4, cumulative across the two PENDING returns above
		// (frozen control plan §6.3: the check counts Pending too, not only
		// Completed).
		const thirdReturn = service.createReturn({
			...base,
			idempotencyKey: "over-return-3",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Should be rejected",
			saleId,
		});
		await expect(thirdReturn).rejects.toMatchObject({ code: "validation" });
	});

	test("conserves money across a SEQUENCE of independently-priced partial returns whose per-unit share does not divide evenly (compensation math)", async () => {
		const harness = createHarness();
		const { service } = harness;
		// unitPriceMinor 102 ("1.02") x quantity 3 -> grossMinor 306,
		// taxAmountMinor round-half-up(306 * 0.14) = 43, lineTotalMinor 349 —
		// deliberately NOT a multiple of 3, so apportioning 1-of-3 three
		// times independently (the pre-fix `proportionalMinor`) would round
		// 349/3 -> 116 on every call and refund only 348 total, one minor
		// unit short of what the customer actually paid. The fixed
		// cumulative-delta apportionment must still sum to exactly 349.
		const { completed, lineId, saleId } = await completedSale(
			harness,
			"register_partial_return_rounding",
			{ quantity: "3", unitPriceMinor: 102 }
		);
		const originalLineTotalMinor = completed.lines[0]?.lineTotal.amountMinor;
		if (originalLineTotalMinor === undefined) {
			throw new Error("Completed sale is missing its first line");
		}
		expect(originalLineTotalMinor).toBe(349);

		let refundedMinor = 0;
		for (const [index, idempotencyKey] of [
			"rounding-return-1",
			"rounding-return-2",
			"rounding-return-3",
		].entries()) {
			// biome-ignore lint/performance/noAwaitInLoops: each return must observe the prior one's cumulative-quantity effect before the next is priced.
			const created = await service.createReturn({
				...base,
				idempotencyKey,
				lines: [{ quantity: "1", saleLineId: lineId }],
				reason: `Sequential partial return ${index + 1} of 3`,
				saleId,
			});
			const approved = await service.approveReturn({
				...base,
				actorUserId: "user_checker",
				idempotencyKey: `${idempotencyKey}-approve`,
				returnId: created.id,
			});
			refundedMinor += approved.totalRefundable.amountMinor;
		}

		expect(refundedMinor).toBe(originalLineTotalMinor);
	});

	test("rejects a return referencing a sale that has not yet completed", async () => {
		const harness = createHarness();
		const { service } = harness;
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "register_open_sale_return-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: "register_open_sale_return",
		});
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "register_open_sale_return-sale",
			lines: [
				{
					productId: "prod_x",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 1000, currency: "GYD" },
				},
			],
			registerId: "register_open_sale_return",
		});
		const attempt = service.createReturn({
			...base,
			idempotencyKey: "register_open_sale_return-return",
			lines: [{ quantity: "1", saleLineId: sale.lines[0]?.id as string }],
			reason: "Sale still open",
			saleId: sale.id,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("creates a refund referencing an approved return, rejects self-approval, and approving posts a paid-out cash movement referencing the refund", async () => {
		const harness = createHarness();
		const { service, events, movements } = harness;
		const { lineId, registerId, saleId } = await completedSale(
			harness,
			"register_refund_happy"
		);
		const created = await service.createReturn({
			...base,
			idempotencyKey: "refund-happy-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Refund path",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-happy-return-approve",
			returnId: created.id,
		});

		const refund = await service.createRefund({
			...base,
			idempotencyKey: "refund-create-1",
			returnId: approvedReturn.id,
		});
		expect(refund.state).toBe("Requested");
		expect(refund.amount).toEqual(approvedReturn.totalRefundable);

		const selfApprove = service.approveRefund({
			...base,
			idempotencyKey: "refund-approve-self",
			refundId: refund.id,
		});
		await expect(selfApprove).rejects.toMatchObject({
			code: "approval_separation",
		});

		const posted = await service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-approve-1",
			refundId: refund.id,
		});
		expect(posted.state).toBe("Posted");
		expect(posted.cashMovementId).not.toBeNull();

		const cashMovement = movements.find(
			(movement) => movement.id === posted.cashMovementId
		);
		expect(cashMovement).toMatchObject({
			amountMinor: refund.amount.amountMinor,
			direction: "PaidOut",
			reasonCode: "Refund",
			referenceId: refund.id,
			registerId,
		});
		const requestedEvent = events.find(
			(envelope) => envelope.name === "commerce.refund.requested.v1"
		);
		expect(requestedEvent?.data).toMatchObject({
			refundId: refund.id,
			returnId: approvedReturn.id,
		});
		const cashEvent = events.find(
			(envelope) =>
				envelope.name === "commerce.cash-movement.posted.v1" &&
				(envelope.data as { reasonCode?: string }).reasonCode === "Refund"
		);
		expect(cashEvent?.data).toMatchObject({ referenceId: refund.id });
	});

	test("WS3 remediation R2, Finding C: denies refund self-approval across TWO DIFFERENT auth accounts that resolve to the SAME Party, with no state change, no cash movement, and no event", async () => {
		const harness = createHarness({
			partyResolution: (authUserId) =>
				authUserId === "user_requester" || authUserId === "user_alt_login"
					? "party_shared"
					: `party_${authUserId}`,
		});
		const { events, movements, refunds, service } = harness;
		const { lineId, saleId } = await completedSale(
			harness,
			"register_refund_finding_c"
		);
		const created = await service.createReturn({
			...base,
			idempotencyKey: "refund-finding-c-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Refund path",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-finding-c-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			actorUserId: "user_requester",
			idempotencyKey: "refund-finding-c-create",
			returnId: approvedReturn.id,
		});
		const refundBefore = refunds.get(refund.id);
		const eventCountBefore = events.length;
		const movementCountBefore = movements.length;

		const crossAccountSelfApproval = service.approveRefund({
			...base,
			actorUserId: "user_alt_login",
			idempotencyKey: "refund-finding-c-approve",
			refundId: refund.id,
		});
		await expect(crossAccountSelfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(refunds.get(refund.id)).toEqual(refundBefore);
		expect(refunds.get(refund.id)?.state).toBe("Requested");
		expect(events).toHaveLength(eventCountBefore);
		expect(movements).toHaveLength(movementCountBefore);

		const posted = await service.approveRefund({
			...base,
			actorUserId: "user_real_checker",
			idempotencyKey: "refund-finding-c-approve-real",
			refundId: refund.id,
		});
		expect(posted.state).toBe("Posted");
	});

	test("SUPERSEDED by WS3 remediation R1 (Finding A + E): a full refund of a cash sale's own proceeds lands exactly at the zero boundary and succeeds (record variance vs reject — now reject-before-negative, boundary-inclusive)", async () => {
		// Pre-remediation this test was named "posts a refund even when it
		// would exceed the register's counted cash — records the shortfall
		// as an ordinary close variance rather than rejecting" and asserted
		// `closed.state === "Closing"` / `varianceApprovalRequired === true`
		// on the theory that "this register's session never received any
		// cash beyond the sale tender itself (which is not a paid-in
		// movement)". Finding A makes that theory false: `completeSale` now
		// posts the sale's own net cash-in atomically, so a refund that
		// fully reverses that SAME sale, in the SAME still-open session,
		// lands EXACTLY at the Finding E boundary (expected cash net to
		// zero) rather than going negative — see the new
		// "REJECTS a refund that would drive expected cash negative" test
		// below for the genuinely-exceeds-cash case (Finding E).
		const harness = createHarness();
		const { movements, service } = harness;
		const registerId = "register_refund_exceeds_cash";
		const { lineId, saleId } = await completedSale(harness, registerId, {
			quantity: "1",
			unitPriceMinor: 1_000_000, // 10,000.00 GYD sale, tendered exactly (no change).
		});
		const created = await service.createReturn({
			...base,
			idempotencyKey: "exceeds-cash-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Large refund",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "exceeds-cash-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "exceeds-cash-refund-create",
			returnId: approvedReturn.id,
		});

		const posted = await service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "exceeds-cash-refund-approve",
			refundId: refund.id,
		});
		expect(posted.state).toBe("Posted");
		// The sale's PaidIn entry (Finding A) and the refund's PaidOut entry
		// exactly cancel: this is the Finding E boundary case (result of
		// exactly 0), which succeeds rather than being rejected.
		const saleMovement = movements.find(
			(movement) => movement.referenceId === saleId
		);
		expect(saleMovement).toMatchObject({
			amountMinor: refund.amount.amountMinor,
			direction: "PaidIn",
		});

		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "exceeds-cash-close",
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
		expect(closed.varianceApprovalRequired).toBe(false);
	});

	test("REJECTS a refund that would drive expected cash negative, with no ledger entry, no event, and no state change (WS3 remediation R1, Finding E)", async () => {
		const harness = createHarness();
		const { events, movements, refunds, service } = harness;
		const registerId = "register_refund_insufficient_cash";
		const { lineId, saleId } = await completedSale(harness, registerId, {
			quantity: "1",
			unitPriceMinor: 1_000_000, // sale posts a 1,140,000 (with 14% tax) PaidIn entry.
		});
		// Drain almost all of the sale's own cash-in via a safe-drop BEFORE
		// the refund is attempted, leaving only 100 minor units of expected
		// cash — far short of the refund this full return will demand.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 1_139_900, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: "insufficient-cash-safe-drop",
			reasonCode: "SafeDrop",
			registerId,
		});
		const created = await service.createReturn({
			...base,
			idempotencyKey: "insufficient-cash-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Large refund exceeding remaining drawer cash",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "insufficient-cash-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "insufficient-cash-refund-create",
			returnId: approvedReturn.id,
		});
		expect(refund.amount.amountMinor).toBe(1_140_000);

		const movementsBeforeAttempt = movements.length;
		const eventsBeforeAttempt = events.length;
		const attempt = service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "insufficient-cash-refund-approve",
			refundId: refund.id,
		});
		await expect(attempt).rejects.toMatchObject({ code: "insufficient_cash" });
		await expect(attempt).rejects.toBeInstanceOf(PosError);

		// No ledger entry, no event, and no business-state change: the
		// refund stays exactly `Requested`, never transitions to `Posted`.
		expect(movements).toHaveLength(movementsBeforeAttempt);
		expect(events).toHaveLength(eventsBeforeAttempt);
		const refundRecord = refunds.get(refund.id);
		expect(refundRecord?.state).toBe("Requested");
		expect(refundRecord?.cashMovementId).toBeNull();

		// The register's expected cash is exactly what the safe-drop left
		// behind (100) — completely unaffected by the rejected refund.
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 100, currency: "GYD" },
			idempotencyKey: "insufficient-cash-close",
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 100, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("rejects a refund approval once the referenced register's session is no longer open", async () => {
		const harness = createHarness();
		const { service } = harness;
		const registerId = "register_refund_closed";
		const { lineId, saleId } = await completedSale(harness, registerId);
		const created = await service.createReturn({
			...base,
			idempotencyKey: "refund-closed-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Register closes before refund approval",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-closed-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "refund-closed-refund-create",
			returnId: approvedReturn.id,
		});
		await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "refund-closed-close",
			registerId,
		});

		const attempt = service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-closed-approve",
			refundId: refund.id,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("reissues a receipt as a new numbered Reissue artifact linked to the original, with no monetary effect", async () => {
		const harness = createHarness();
		const { service, events, saleReceipts } = harness;
		const { completed } = await completedSale(
			harness,
			"register_reissue_happy"
		);

		const reissued = await service.reissueReceipt({
			...base,
			idempotencyKey: "reissue-1",
			receiptId: completed.receiptId as string,
		});
		const original = saleReceipts.get(completed.receiptId as string);
		expect(reissued.kind).toBe("Reissue");
		expect(reissued.originalReceiptId).toBe(completed.receiptId);
		expect(reissued.priceSuppressed).toBe(false);
		expect(reissued.total).toEqual({
			amountMinor: original?.totalMinor as number,
			currency: "GYD",
		});
		expect(reissued.receiptNumber).not.toBe(original?.receiptNumber);

		const reissueEvent = events.find(
			(envelope) =>
				envelope.name === "commerce.receipt.issued.v1" &&
				(envelope.data as { kind?: string }).kind === "Reissue"
		);
		expect(reissueEvent?.data).toMatchObject({
			originalReceiptId: completed.receiptId,
			priceSuppressed: false,
		});
	});

	test("realizes a gift receipt as reissueReceipt's priceSuppressed variant — same command, no separate capability implementation", async () => {
		const harness = createHarness();
		const { service } = harness;
		const { completed } = await completedSale(harness, "register_gift_receipt");

		const gift = await service.reissueReceipt({
			...base,
			idempotencyKey: "gift-receipt-1",
			priceSuppressed: true,
			receiptId: completed.receiptId as string,
		});
		expect(gift.kind).toBe("Reissue");
		expect(gift.priceSuppressed).toBe(true);
		expect(gift.total).toBeNull();
		expect(gift.tenders).toEqual([]);
		for (const line of gift.lines) {
			expect(line.unitPrice.amountMinor).toBe(0);
			expect(line.lineTotal.amountMinor).toBe(0);
			expect(line.tax.amountMinor).toBe(0);
		}
	});

	test("rejects reissuing a Reissue receipt", async () => {
		const harness = createHarness();
		const { service } = harness;
		const { completed } = await completedSale(
			harness,
			"register_reissue_of_reissue"
		);
		const reissued = await service.reissueReceipt({
			...base,
			idempotencyKey: "reissue-of-reissue-1",
			receiptId: completed.receiptId as string,
		});
		const attempt = service.reissueReceipt({
			...base,
			idempotencyKey: "reissue-of-reissue-2",
			receiptId: reissued.id,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("voids a completed sale on an open session as a full compensation with its own permission, not a maker/checker pair — WS3 remediation R1 cycle 2: also reverses the voided sale's own cash-ledger proceeds, PROVEN failing pre-fix (git stash-reverting only the voidReceipt cash-posting block: `movements` contained no PaidOut/Refund row for the void at all, and closing at countedCash 0 landed on state 'Closing' with variance -342000, not 'Closed' at variance 0)", async () => {
		const harness = createHarness();
		const { service, events, movements, returnMovements } = harness;
		const { completed, registerId, saleId } = await completedSale(
			harness,
			"register_void_happy",
			{ quantity: "3" }
		);
		// completedSale posts its own Finding A PaidIn proceeds for the full
		// sale total (3 units @ 114_000/unit incl. 14% VAT = 342_000).
		expect(completed.total).toEqual({ amountMinor: 342_000, currency: "GYD" });

		const voided = await service.voidReceipt({
			...base,
			idempotencyKey: "void-1",
			reason: "Cashier error",
			receiptId: completed.receiptId as string,
		});
		expect(voided.state).toBe("Completed");
		expect(voided.mode).toBe("Void");
		expect(voided.saleId).toBe(saleId);
		expect(returnMovements).toEqual([
			{
				productId: "prod_returnable",
				quantity: "3",
				reversalOfMovementId: "movement_prod_returnable",
			},
		]);
		const voidEvent = events.find(
			(envelope) => envelope.name === "commerce.return.completed.v1"
		);
		expect(voidEvent?.data).toMatchObject({ mode: "Void", registerId, saleId });

		// The compensating cash-ledger entry: a PaidOut, reasonCode Refund,
		// referencing the void's own Return id, for the FULL voided amount.
		const voidCashMovement = movements.find(
			(movement) => movement.referenceId === voided.id
		);
		expect(voidCashMovement).toMatchObject({
			amountMinor: 342_000,
			direction: "PaidOut",
			reasonCode: "Refund",
		});
		const voidCashEvent = events.find(
			(envelope) =>
				envelope.name === "commerce.cash-movement.posted.v1" &&
				(envelope.data as { referenceId?: string }).referenceId === voided.id
		);
		expect(voidCashEvent?.data).toMatchObject({
			amountMinor: 342_000,
			direction: "PaidOut",
			reasonCode: "Refund",
		});

		// The actual boundary this remediation closes: closing the register
		// at exactly its opening float (0) now lands at zero variance —
		// the sale's proceeds and the void's reversal net to zero on the
		// SAME authoritative ledger `closeRegister` reads, not a partial
		// reconstruction that still carries the voided sale's proceeds.
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "void-1-close",
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("Finding A cycle 2: voiding only the REMAINING unreturned quantity reverses exactly that remainder's cash, never double-compensating the portion already returned and refunded", async () => {
		const harness = createHarness();
		const { movements, service } = harness;
		const { completed, saleId } = await completedSale(
			harness,
			"register_void_partial",
			{ quantity: "4" }
		);
		// 4 units @ 114_000/unit = 456_000 total, all Cash (Finding A PaidIn).
		expect(completed.total).toEqual({ amountMinor: 456_000, currency: "GYD" });
		const lineId = completed.lines[0]?.id as string;

		// Return + refund 1 of 4 units first (114_000), same session.
		const created = await service.createReturn({
			...base,
			idempotencyKey: "void-partial-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Wrong size",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "void-partial-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "void-partial-refund-create",
			returnId: approvedReturn.id,
		});
		await service.approveRefund({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "void-partial-refund-approve",
			refundId: refund.id,
		});

		// Void the sale: only 3 of the original 4 units remain unreturned,
		// so the void's cash reversal must be 3/4 of the total (342_000),
		// NOT the full 456_000 (which would double-compensate the unit
		// already returned and refunded above).
		const voided = await service.voidReceipt({
			...base,
			idempotencyKey: "void-partial-void-1",
			reason: "Remaining units defective",
			receiptId: completed.receiptId as string,
		});
		const voidCashMovement = movements.find(
			(movement) => movement.referenceId === voided.id
		);
		expect(voidCashMovement).toMatchObject({
			amountMinor: 342_000,
			direction: "PaidOut",
			reasonCode: "Refund",
		});

		// Ledger nets to exactly zero: 456_000 sale in, 114_000 refund out,
		// 342_000 void out.
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "void-partial-close",
			registerId: "register_void_partial",
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("Finding E applies to void's cash-out too: a void that would drive expected cash negative is REJECTED with no cash-ledger entry, no cash event, no Return/receipt, and no Inventory reversal", async () => {
		const harness = createHarness();
		const { events, movements, returns, returnMovements, service } = harness;
		const registerId = "register_void_insufficient_cash";
		const { completed } = await completedSale(harness, registerId, {
			quantity: "3",
		});
		expect(completed.total).toEqual({ amountMinor: 342_000, currency: "GYD" });

		// Drain the drawer below the sale's own proceeds via a safe-drop —
		// expected cash is now 342_000 - 340_000 = 2_000, less than the
		// 342_000 a void of this sale would need to pay back out.
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 340_000, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${registerId}-safe-drop`,
			reasonCode: "SafeDrop",
			registerId,
		});

		const preAttemptMovementCount = movements.length;
		const preAttemptEventCount = events.length;
		const preAttemptReturnCount = returns.size;

		const attempt = service.voidReceipt({
			...base,
			idempotencyKey: "void-insufficient-cash-1",
			reason: "Should be rejected",
			receiptId: completed.receiptId as string,
		});
		await expect(attempt).rejects.toMatchObject({ code: "insufficient_cash" });

		// No partial effects survived: no new cash movement, no new event,
		// no Return row created, no Inventory reversal posted — the
		// transaction rolled back in full, not just the cash step.
		expect(movements).toHaveLength(preAttemptMovementCount);
		expect(events).toHaveLength(preAttemptEventCount);
		expect(returns.size).toBe(preAttemptReturnCount);
		expect(returnMovements).toHaveLength(0);

		// The sale itself is still Completed and its proceeds are still on
		// the ledger untouched — the guard denies, it does not silently
		// half-apply.
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 2000, currency: "GYD" },
			idempotencyKey: "void-insufficient-cash-close",
			registerId,
		});
		expect(closed.expectedCash).toEqual({ amountMinor: 2000, currency: "GYD" });
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("rejects a void once the sale's register session has closed (void-after-close rejection)", async () => {
		const harness = createHarness();
		const { service } = harness;
		const registerId = "register_void_after_close";
		const { completed } = await completedSale(harness, registerId);

		await service.closeRegister({
			...base,
			countedCash: {
				amountMinor: completed.total.amountMinor,
				currency: "GYD",
			},
			idempotencyKey: "void-after-close-close",
			registerId,
		});

		const attempt = service.voidReceipt({
			...base,
			idempotencyKey: "void-after-close-1",
			receiptId: completed.receiptId as string,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("rejects voiding a non-Sale receipt", async () => {
		const harness = createHarness();
		const { service } = harness;
		const { completed } = await completedSale(harness, "register_void_kind");
		const reissued = await service.reissueReceipt({
			...base,
			idempotencyKey: "void-kind-reissue",
			receiptId: completed.receiptId as string,
		});
		const attempt = service.voidReceipt({
			...base,
			idempotencyKey: "void-kind-1",
			receiptId: reissued.id,
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("realizes an exchange by composing an approved return with a new sale.complete call sharing the register, emitting commerce.exchange.completed.v1 without mutating the return's own already-emitted event", async () => {
		const harness = createHarness();
		const { service, events } = harness;
		const registerId = "register_exchange_happy";
		const { lineId, saleId } = await completedSale(harness, registerId, {
			quantity: "2",
			unitPriceMinor: 100_000,
		});

		const created = await service.createReturn({
			...base,
			idempotencyKey: "exchange-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Exchange for a different item",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "exchange-return-approve",
			returnId: created.id,
		});

		const replacementSale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "exchange-replacement-sale-create",
			lines: [
				{
					productId: "prod_replacement",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 150_000, currency: "GYD" },
				},
			],
			registerId,
		});
		const completedReplacement = await service.completeSale({
			...base,
			exchangeOfReturnId: approvedReturn.id,
			idempotencyKey: "exchange-replacement-sale-complete",
			saleId: replacementSale.id,
			tenders: [
				{
					amountMinor: replacementSale.total.amountMinor,
					currency: "GYD",
					type: "Cash",
				},
			],
		});
		expect(completedReplacement.state).toBe("Completed");

		const exchangeEvent = events.find(
			(envelope) => envelope.name === "commerce.exchange.completed.v1"
		);
		expect(exchangeEvent?.data).toMatchObject({
			currency: "GYD",
			newSaleId: replacementSale.id,
			registerId,
			returnId: approvedReturn.id,
		});

		// The return leg's OWN event, already emitted at approve time, is
		// never amended once the exchange's replacement sale exists (§6.5
		// ordering — see completeSale's exchange-linking comment).
		const returnEvents = events.filter(
			(envelope) => envelope.name === "commerce.return.completed.v1"
		);
		expect(returnEvents).toHaveLength(1);
		expect(returnEvents[0]?.data).toMatchObject({
			exchangeSaleId: null,
			mode: "Return",
		});

		// The Return cannot be consumed by a second exchange.
		const anotherSale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "exchange-second-sale-create",
			lines: [
				{
					productId: "prod_replacement_2",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 1000, currency: "GYD" },
				},
			],
			registerId,
		});
		const secondAttempt = service.completeSale({
			...base,
			exchangeOfReturnId: approvedReturn.id,
			idempotencyKey: "exchange-second-sale-complete",
			saleId: anotherSale.id,
			tenders: [{ amountMinor: 1000, currency: "GYD", type: "Cash" }],
		});
		await expect(secondAttempt).rejects.toMatchObject({
			code: "invalid_state",
		});
	});

	test("rejects an exchange whose return is still Pending", async () => {
		const harness = createHarness();
		const { service } = harness;
		const registerId = "register_exchange_pending";
		const { lineId, saleId } = await completedSale(harness, registerId);
		const created = await service.createReturn({
			...base,
			idempotencyKey: "exchange-pending-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Not yet approved",
			saleId,
		});
		const replacementSale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "exchange-pending-sale-create",
			lines: [
				{
					productId: "prod_replacement_pending",
					quantity: "1",
					unit: "each",
					unitPrice: { amountMinor: 1000, currency: "GYD" },
				},
			],
			registerId,
		});
		const attempt = service.completeSale({
			...base,
			exchangeOfReturnId: created.id,
			idempotencyKey: "exchange-pending-sale-complete",
			saleId: replacementSale.id,
			tenders: [{ amountMinor: 1000, currency: "GYD", type: "Cash" }],
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_reference" });
	});

	test("derives a refund's amount solely from the Return, never from caller input", async () => {
		const harness = createHarness();
		const { service } = harness;
		const { lineId, saleId } = await completedSale(
			harness,
			"register_refund_amount_derivation"
		);
		const created = await service.createReturn({
			...base,
			idempotencyKey: "refund-amount-return-create",
			lines: [{ quantity: "1", saleLineId: lineId }],
			reason: "Amount derivation",
			saleId,
		});
		const approvedReturn = await service.approveReturn({
			...base,
			actorUserId: "user_checker",
			idempotencyKey: "refund-amount-return-approve",
			returnId: created.id,
		});
		const refund = await service.createRefund({
			...base,
			idempotencyKey: "refund-amount-create",
			returnId: approvedReturn.id,
		});
		// No amount field exists on `createRefund`'s input at all — this
		// assertion is really a type-level guarantee, restated at runtime:
		// the persisted refund always equals the Return's own total.
		expect(refund.amount).toEqual(approvedReturn.totalRefundable);
	});

	// WS3 remediation R3, Finding J (part 2): `getSaleForReturn` completes
	// the receipt-to-return path `getReceiptByNumber` (Finding J part 1)
	// starts. PRE-FIX, no server operation existed at all that resolved a
	// printed receiptNumber+registerId to a Sale's real line ids — the ONLY
	// path was an opaque Sale ID cached in the browser that completed the
	// sale. These tests could not have "passed against pre-fix code" in the
	// sense of an existing function behaving wrongly; the function did not
	// exist. What they instead prove is the actual boundary this new
	// function enforces: it resolves ONLY a genuine Sale-kind receipt to
	// its exact originating Sale (never a Return/Reissue receipt, never an
	// unrelated Sale, never a different tenant/organization's Sale), with
	// real `lines[].id` values `commerce.return.create`'s own
	// `saleLineId` matching depends on.
	describe("getSaleForReturn (WS3 remediation R3, Finding J part 2)", () => {
		test("resolves a Sale-kind receipt's receiptNumber+registerId to the exact originating Sale, with real line ids matching the completed Sale's own lines", async () => {
			const harness = createHarness();
			const { service } = harness;
			const { completed, registerId, saleId } = await completedSale(
				harness,
				"register_get_sale_for_return_happy"
			);
			const receipt = await service.getReceipt(
				base.tenantId,
				base.organizationId,
				completed.receiptId as string
			);
			expect(receipt.kind).toBe("Sale");

			const resolved = await service.getSaleForReturn(
				base.tenantId,
				base.organizationId,
				base.locationId,
				registerId,
				receipt.receiptNumber
			);
			expect(resolved.id).toBe(saleId);
			expect(resolved.state).toBe("Completed");
			expect(resolved.lines).toEqual(completed.lines);
		});

		test("rejects (invalid_state) resolving a Reissue-kind receipt — only a Sale-kind receipt has a returnable sale", async () => {
			const harness = createHarness();
			const { service } = harness;
			const { completed, registerId } = await completedSale(
				harness,
				"register_get_sale_for_return_reissue"
			);
			const reissued = await service.reissueReceipt({
				...base,
				idempotencyKey: "get-sale-for-return-reissue",
				priceSuppressed: false,
				receiptId: completed.receiptId as string,
			});
			expect(reissued.kind).toBe("Reissue");

			const attempt = service.getSaleForReturn(
				base.tenantId,
				base.organizationId,
				base.locationId,
				registerId,
				reissued.receiptNumber
			);
			await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
		});

		test("rejects (invalid_state) resolving a Return-kind (void) receipt the same way", async () => {
			const harness = createHarness();
			const { service } = harness;
			const { completed, registerId } = await completedSale(
				harness,
				"register_get_sale_for_return_void"
			);
			const voided = await service.voidReceipt({
				...base,
				idempotencyKey: "get-sale-for-return-void",
				reason: "Finding J invalid_state coverage",
				receiptId: completed.receiptId as string,
			});
			const voidReceipt = await service.getReceipt(
				base.tenantId,
				base.organizationId,
				voided.receiptId as string
			);
			expect(voidReceipt.kind).toBe("Return");

			const attempt = service.getSaleForReturn(
				base.tenantId,
				base.organizationId,
				base.locationId,
				registerId,
				voidReceipt.receiptNumber
			);
			await expect(attempt).rejects.toMatchObject({ code: "invalid_state" });
		});

		test("rejects (not_found) an unknown receiptNumber/registerId pair — never falls back to a different register's receipt sharing the same number", async () => {
			const harness = createHarness();
			const { service } = harness;
			await completedSale(harness, "register_get_sale_for_return_unknown");

			const attempt = service.getSaleForReturn(
				base.tenantId,
				base.organizationId,
				base.locationId,
				"register_get_sale_for_return_unknown",
				"RCPT-DOES-NOT-EXIST"
			);
			await expect(attempt).rejects.toMatchObject({ code: "not_found" });
		});
	});
});

describe("POS application: permission-before-dispatch and self-approval separation", () => {
	function createApplicationHarness(input: { permissionGranted?: boolean }) {
		const { service } = createHarness();
		let dispatched = false;
		const wrapped = {
			...service,
			openRegister: (args: Parameters<typeof service.openRegister>[0]) => {
				dispatched = true;
				return service.openRegister(args);
			},
		};
		const permissionCalls: PosPermission[] = [];
		const application = createPosApplication({
			activeContexts: {
				requireActiveContext: () =>
					Promise.resolve({
						organizationId: base.organizationId,
						tenantId: base.tenantId,
					}),
			},
			entitlements: {
				requireEntitlement: () => Promise.resolve(),
			},
			permissions: {
				requirePermission: (permissionInput) => {
					permissionCalls.push(permissionInput.permission);
					if (input.permissionGranted === false) {
						return Promise.reject(
							Object.assign(new Error("permission denied"), {
								code: "authorization_denied",
							})
						);
					}
					return Promise.resolve();
				},
			},
			service: wrapped,
		});
		return {
			application,
			isDispatched: () => dispatched,
			permissionCalls,
		};
	}

	test("checks permission before dispatching to the service", async () => {
		const { application, isDispatched, permissionCalls } =
			createApplicationHarness({ permissionGranted: false });
		const attempt = application.openRegister({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "app-denied-open",
			locationId: base.locationId,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: base.registerId,
			sessionId: "session_a",
		});
		await expect(attempt).rejects.toMatchObject({
			code: "authorization_denied",
		});
		expect(permissionCalls).toEqual(["commerce.register.open"]);
		expect(isDispatched()).toBe(false);
	});

	test("dispatches to the service once permission and entitlement are granted", async () => {
		const { application, isDispatched } = createApplicationHarness({
			permissionGranted: true,
		});
		const opened = await application.openRegister({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "app-allowed-open",
			locationId: base.locationId,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: base.registerId,
			sessionId: "session_a",
		});
		expect(opened.state).toBe("Open");
		expect(isDispatched()).toBe(true);
	});
});

describe("POS domain: Deposit (prepare/confirm)", () => {
	test("Prepared precedes Reconciled and preparation never starts confirmed", () => {
		expect(DEPOSIT_STATES).toEqual(["Prepared", "Reconciled"]);
		expect(DEPOSIT_STATES.indexOf("Prepared")).toBeLessThan(
			DEPOSIT_STATES.indexOf("Reconciled")
		);
	});

	async function openAndSafeDrop(
		service: ReturnType<typeof createHarness>["service"],
		input: {
			amountMinor: number;
			idempotencyPrefix: string;
			registerId: string;
		}
	) {
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: `${input.idempotencyPrefix}-open`,
			openingFloat: { amountMinor: 500_000, currency: "GYD" },
			registerId: input.registerId,
		});
		const movement = await service.createCashMovement({
			...base,
			amount: { amountMinor: input.amountMinor, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: `${input.idempotencyPrefix}-safe-drop`,
			reasonCode: "SafeDrop",
			registerId: input.registerId,
		});
		return movement.sessionId;
	}

	test("prepares a deposit that reserves safe custody and posts NO custody transfer", async () => {
		const { depositCustodyTransfers, events, service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 100_000,
			idempotencyPrefix: "dep-happy",
			registerId: "register_dep_happy",
		});

		const prepared = await service.createDeposit({
			...base,
			correlationId: base.correlationId,
			countedAmountMinor: 100_000,
			currency: "GYD",
			idempotencyKey: "dep-happy-create",
			sourceShiftIds: [sessionId],
		});

		expect(prepared.state).toBe("Prepared");
		expect(prepared.amount).toEqual({ amountMinor: 100_000, currency: "GYD" });
		expect(prepared.depositReference).toMatch(DEPOSIT_REFERENCE_PATTERN);
		expect(prepared.confirmedAt).toBeNull();
		expect(depositCustodyTransfers).toHaveLength(0);
		const preparedEvents = events.filter(
			(envelope) => envelope.name === "commerce.deposit.prepared.v1"
		);
		expect(preparedEvents).toHaveLength(1);
		expect(preparedEvents[0]?.data).toMatchObject({
			amountMinor: 100_000,
			depositId: prepared.id,
		});
	});

	test("rejects a deposit that exceeds available safe custody", async () => {
		const { service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 50_000,
			idempotencyPrefix: "dep-over",
			registerId: "register_dep_over",
		});

		const attempt = service.createDeposit({
			...base,
			countedAmountMinor: 50_001,
			currency: "GYD",
			idempotencyKey: "dep-over-create",
			sourceShiftIds: [sessionId],
		});
		await expect(attempt).rejects.toMatchObject({ code: "validation" });
	});

	test("caps cumulative reservation across two deposits against the same safe-drop pool", async () => {
		const { service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 100_000,
			idempotencyPrefix: "dep-cumulative",
			registerId: "register_dep_cumulative",
		});

		const first = await service.createDeposit({
			...base,
			countedAmountMinor: 60_000,
			currency: "GYD",
			idempotencyKey: "dep-cumulative-first",
			sourceShiftIds: [sessionId],
		});
		expect(first.amount.amountMinor).toBe(60_000);

		// 60,000 already reserved of 100,000 available -> only 40,000 remains.
		const secondTooMuch = service.createDeposit({
			...base,
			countedAmountMinor: 40_001,
			currency: "GYD",
			idempotencyKey: "dep-cumulative-second-over",
			sourceShiftIds: [sessionId],
		});
		await expect(secondTooMuch).rejects.toMatchObject({ code: "validation" });

		const secondOk = await service.createDeposit({
			...base,
			countedAmountMinor: 40_000,
			currency: "GYD",
			idempotencyKey: "dep-cumulative-second-ok",
			sourceShiftIds: [sessionId],
		});
		expect(secondOk.amount.amountMinor).toBe(40_000);
	});

	test("rejects preparing a deposit against an unknown source shift", async () => {
		const { service } = createHarness();
		const attempt = service.createDeposit({
			...base,
			countedAmountMinor: 1000,
			currency: "GYD",
			idempotencyKey: "dep-unknown-shift",
			sourceShiftIds: ["session_does_not_exist"],
		});
		await expect(attempt).rejects.toMatchObject({ code: "invalid_reference" });
	});

	test("confirms a deposit by a different actor, posting exactly one custody transfer atomic with commerce.deposit.reconciled.v1", async () => {
		const { depositCustodyTransfers, events, service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 75_000,
			idempotencyPrefix: "dep-confirm",
			registerId: "register_dep_confirm",
		});
		const prepared = await service.createDeposit({
			...base,
			countedAmountMinor: 75_000,
			currency: "GYD",
			idempotencyKey: "dep-confirm-create",
			sourceShiftIds: [sessionId],
		});

		const confirmed = await service.confirmDeposit({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-confirm-confirm",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});

		expect(confirmed.state).toBe("Reconciled");
		expect(confirmed.confirmedAt).not.toBeNull();
		// The financial fact (amount/currency) fixed at preparation never
		// changes across confirmation — a correction would require a NEW
		// deposit record (reversal/compensation, CLAUDE.md §5), never an
		// edit of this one.
		expect(confirmed.amount).toEqual(prepared.amount);
		expect(depositCustodyTransfers).toHaveLength(1);
		expect(depositCustodyTransfers[0]).toMatchObject({
			amountMinor: 75_000,
			depositId: prepared.id,
		});
		const reconciledEvents = events.filter(
			(envelope) => envelope.name === "commerce.deposit.reconciled.v1"
		);
		expect(reconciledEvents).toHaveLength(1);
		expect(reconciledEvents[0]?.data).toMatchObject({
			amountMinor: 75_000,
			depositId: prepared.id,
		});
	});

	test("denies self-confirmation by the preparer", async () => {
		const { depositCustodyTransfers, service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 20_000,
			idempotencyPrefix: "dep-self",
			registerId: "register_dep_self",
		});
		const prepared = await service.createDeposit({
			...base,
			countedAmountMinor: 20_000,
			currency: "GYD",
			idempotencyKey: "dep-self-create",
			sourceShiftIds: [sessionId],
		});

		const attempt = service.confirmDeposit({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-self-confirm",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		await expect(attempt).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(depositCustodyTransfers).toHaveLength(0);
	});

	test("WS3 remediation R2, Finding C: denies deposit self-confirmation across TWO DIFFERENT auth accounts that resolve to the SAME Party, with no state change and no custody transfer", async () => {
		const { deposits, depositCustodyTransfers, events, service } =
			createHarness({
				partyResolution: (authUserId) =>
					authUserId === "user_preparer" || authUserId === "user_alt_login"
						? "party_shared"
						: `party_${authUserId}`,
			});
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 20_000,
			idempotencyPrefix: "dep-finding-c",
			registerId: "register_dep_finding_c",
		});
		const prepared = await service.createDeposit({
			...base,
			actorUserId: "user_preparer",
			countedAmountMinor: 20_000,
			currency: "GYD",
			idempotencyKey: "dep-finding-c-create",
			sourceShiftIds: [sessionId],
		});
		const depositBefore = deposits.get(prepared.id);
		const eventCountBefore = events.length;

		const crossAccountSelfConfirm = service.confirmDeposit({
			actorUserId: "user_alt_login",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-finding-c-confirm",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		await expect(crossAccountSelfConfirm).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(deposits.get(prepared.id)).toEqual(depositBefore);
		expect(deposits.get(prepared.id)?.state).toBe("Prepared");
		expect(depositCustodyTransfers).toHaveLength(0);
		expect(events).toHaveLength(eventCountBefore);

		const confirmed = await service.confirmDeposit({
			actorUserId: "user_real_checker",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-finding-c-confirm-real",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		expect(confirmed.state).toBe("Reconciled");
	});

	test("rejects confirming an already-Reconciled deposit", async () => {
		const { service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 15_000,
			idempotencyPrefix: "dep-double",
			registerId: "register_dep_double",
		});
		const prepared = await service.createDeposit({
			...base,
			countedAmountMinor: 15_000,
			currency: "GYD",
			idempotencyKey: "dep-double-create",
			sourceShiftIds: [sessionId],
		});
		await service.confirmDeposit({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-double-confirm-1",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});

		const secondConfirm = service.confirmDeposit({
			actorUserId: "user_checker_2",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-double-confirm-2",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		await expect(secondConfirm).rejects.toMatchObject({
			code: "invalid_state",
		});
	});

	test("idempotency-key replay returns the identical prepared and confirmed result", async () => {
		const { service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 30_000,
			idempotencyPrefix: "dep-replay",
			registerId: "register_dep_replay",
		});
		const first = await service.createDeposit({
			...base,
			countedAmountMinor: 30_000,
			currency: "GYD",
			idempotencyKey: "dep-replay-create",
			sourceShiftIds: [sessionId],
		});
		const replayed = await service.createDeposit({
			...base,
			countedAmountMinor: 30_000,
			currency: "GYD",
			idempotencyKey: "dep-replay-create",
			sourceShiftIds: [sessionId],
		});
		expect(replayed).toEqual(first);

		const confirmedFirst = await service.confirmDeposit({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			depositId: first.id,
			idempotencyKey: "dep-replay-confirm",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		const confirmedReplayed = await service.confirmDeposit({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			depositId: first.id,
			idempotencyKey: "dep-replay-confirm",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		expect(confirmedReplayed).toEqual(confirmedFirst);
	});

	test("application layer requires permission and denies self-confirmation before dispatch", async () => {
		const { service } = createHarness();
		const sessionId = await openAndSafeDrop(service, {
			amountMinor: 10_000,
			idempotencyPrefix: "dep-app",
			registerId: "register_dep_app",
		});
		const permissionCalls: PosPermission[] = [];
		const application = createPosApplication({
			activeContexts: {
				requireActiveContext: () =>
					Promise.resolve({
						organizationId: base.organizationId,
						tenantId: base.tenantId,
					}),
			},
			entitlements: { requireEntitlement: () => Promise.resolve() },
			permissions: {
				requirePermission: (permissionInput) => {
					permissionCalls.push(permissionInput.permission);
					return Promise.resolve();
				},
			},
			service,
		});

		const prepared = await application.createDeposit({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			countedAmountMinor: 10_000,
			currency: "GYD",
			idempotencyKey: "dep-app-create",
			sessionId: "auth_session_a",
			sourceShiftIds: [sessionId],
		});
		expect(permissionCalls).toEqual(["commerce.deposit.create"]);

		const attempt = application.confirmDeposit({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			depositId: prepared.id,
			idempotencyKey: "dep-app-confirm-self",
			sessionId: "auth_session_a",
		});
		await expect(attempt).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(permissionCalls).toEqual([
			"commerce.deposit.create",
			"commerce.deposit.confirm",
		]);
	});
});

/**
 * WS3 remediation R4B, item 2 (idempotency replay scope, lead-session
 * finding, NOT part of the original A-L directive). Before this fix, every
 * `requestFingerprint` below covered only the command's own business
 * fields — never `organizationId`/`tenantId`/`locationId`. `replay()` looks
 * up a prior command receipt by `(tenantId, operation, idempotencyKey)`
 * ONLY (this in-memory repository's `getCommandReceipt` mirrors the real
 * Postgres table's key exactly — see its own comment above), then compares
 * fingerprints and returns the receipt's PRIOR RESULT if they match — all
 * before the org/location-scoped aggregate lookup
 * (`repository.getSession`/`getSale`/etc.) ever runs. So a same-tenant
 * caller in a DIFFERENT organization who reused another organization's
 * exact `idempotencyKey` AND the exact business-field values that feed the
 * (pre-fix, narrow) fingerprint would fingerprint-match and receive that
 * OTHER organization's result directly out of the replay cache.
 *
 * Each test below: (1) organization A completes a real command under a
 * shared idempotency key, (2) organization B (same tenant) replays that
 * EXACT idempotencyKey with the EXACT fingerprint-covered business fields
 * from organization A's request, only `organizationId` differs. Post-fix,
 * `organizationId` is now itself part of the fingerprint, so organization
 * B's fingerprint can never match organization A's receipt — `replay()`
 * throws `idempotency_conflict` (the SAME safe denial this file's existing
 * "rejects a different request body reusing an already-claimed idempotency
 * key" test already proves for an ordinary same-organization conflict),
 * and organization A's real result is never handed to organization B.
 *
 * PRE-FIX REPRODUCTION (documented, not re-executed here against a
 * checkout): with the pre-fix narrow fingerprint (`{ sessionId, version }`
 * for `approveCashVariance`; `{ exchangeOfReturnId, saleId, tenders }` for
 * `completeSale` — `organizationId` absent from both), organization B's
 * request below would compute the IDENTICAL fingerprint to organization
 * A's already-claimed receipt (nothing in the fingerprinted object differs
 * between the two calls), so `replay()`'s `receipt.requestFingerprint !==
 * input.requestFingerprint` check would be `false` and it would `return
 * receipt.result as T` — organization A's real `RegisterSessionView`/
 * `SaleView` — to organization B, without ever calling
 * `repository.getSession`/`getSale` (which WOULD have denied organization
 * B via the R2 Finding B tenant/organization scoping this same file's mock
 * repository documents above). This was verified directly: temporarily
 * reverting `packages/domains/pos/src/index.ts`'s two fingerprint call
 * sites below to their pre-fix field lists and re-running these exact
 * tests makes both `crossOrg...` calls RESOLVE with organization A's data
 * (not reject) instead of throwing `idempotency_conflict`.
 */
describe("POS domain: WS3 remediation R4B item 2 (idempotency replay cannot cross organizations)", () => {
	test("approveCashVariance: a same-tenant, different-organization replay of a real approved variance's exact idempotencyKey/sessionId/version is denied, never returns organization A's session", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "r4b-item2-cv-open-a",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			organizationId: "organization_r4b_cv_a",
			registerId: "register_r4b_item2_cv",
		});
		const closingA = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 900, currency: "GYD" },
			idempotencyKey: "r4b-item2-cv-close-a",
			organizationId: "organization_r4b_cv_a",
			registerId: "register_r4b_item2_cv",
		});
		expect(closingA.state).toBe("Closing");

		const sharedIdempotencyKey = "r4b-item2-cv-shared-idempotency-key";
		const approvedA = await service.approveCashVariance({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			idempotencyKey: sharedIdempotencyKey,
			organizationId: "organization_r4b_cv_a",
			sessionId: closingA.id,
			tenantId: base.tenantId,
			version: closingA.version,
		});
		expect(approvedA.state).toBe("Closed");
		expect(approvedA.varianceApproverPartyId).toBe("party_user_checker");

		// Organization B (same tenant) reuses the EXACT idempotencyKey AND the
		// EXACT fingerprint-covered fields (sessionId, version) from
		// organization A's request above — only `organizationId` differs, and
		// organization B never actually owns `closingA.id`.
		const crossOrgReplay = service.approveCashVariance({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			idempotencyKey: sharedIdempotencyKey,
			organizationId: "organization_r4b_cv_b",
			sessionId: closingA.id,
			tenantId: base.tenantId,
			version: closingA.version,
		});
		await expect(crossOrgReplay).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
	});

	test("completeSale: a same-tenant, different-organization replay of a real completed sale's exact idempotencyKey/saleId/tenders is denied, never returns organization A's sale", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "r4b-item2-sale-open-a",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			organizationId: "organization_r4b_sale_a",
			registerId: "register_r4b_item2_sale",
		});
		const sale = await service.createSale({
			...base,
			currency: "GYD",
			idempotencyKey: "r4b-item2-sale-create-a",
			lines: [
				{
					productId: "prod_r4b_item2",
					quantity: "1",
					taxCategory: "GY_EXEMPT",
					unit: "each",
					unitPrice: { amountMinor: 25, currency: "GYD" },
				},
			],
			organizationId: "organization_r4b_sale_a",
			registerId: "register_r4b_item2_sale",
		});

		const sharedIdempotencyKey = "r4b-item2-sale-shared-idempotency-key";
		const sharedTenders = [
			{ amountMinor: 25, currency: "GYD", type: "Cash" as const },
		];
		const completedA = await service.completeSale({
			...base,
			idempotencyKey: sharedIdempotencyKey,
			organizationId: "organization_r4b_sale_a",
			saleId: sale.id,
			tenders: sharedTenders,
		});
		expect(completedA.state).toBe("Completed");

		// Organization B (same tenant) reuses the EXACT idempotencyKey AND the
		// EXACT fingerprint-covered fields (saleId, tenders) from organization
		// A's request above — only `organizationId` differs, and organization
		// B never actually owns `sale.id`.
		const crossOrgReplay = service.completeSale({
			...base,
			idempotencyKey: sharedIdempotencyKey,
			organizationId: "organization_r4b_sale_b",
			saleId: sale.id,
			tenders: sharedTenders,
		});
		await expect(crossOrgReplay).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
	});
});
