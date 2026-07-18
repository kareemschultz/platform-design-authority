import { describe, expect, test } from "bun:test";
import {
	APPROVAL_STATES,
	type CashMovementRecord,
	createPosApplication,
	createPosService,
	type PendingPosEvent,
	type PosCommandReceipt,
	PosError,
	type PosIdFactory,
	type PosPermission,
	type PosPricingPort,
	type PosRepository,
	type PosTaxPort,
	type PriceOverrideRecord,
	REGISTER_SESSION_STATES,
	type ReceiptRecord,
	type RegisterSessionRecord,
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

function createInMemoryRepository() {
	const sessions = new Map<string, RegisterSessionRecord>();
	const movements: CashMovementRecord[] = [];
	const commandReceipts = new Map<string, PosCommandReceipt>();
	const sales = new Map<string, SaleRecord>();
	const priceOverrides = new Map<string, PriceOverrideRecord>();
	const saleReceipts = new Map<string, ReceiptRecord>();

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
		createPriceOverride: (record) => {
			priceOverrides.set(record.id, record);
			return Promise.resolve(record);
		},
		createReceipt: (record) => {
			saleReceipts.set(record.id, record);
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
		getOpenSession: (tenantId, registerId) =>
			Promise.resolve(
				[...sessions.values()].find(
					(session) =>
						session.tenantId === tenantId &&
						session.registerId === registerId &&
						session.state === "Open"
				) ?? null
			),
		getPriceOverride: (tenantId, id) => {
			const record = priceOverrides.get(id);
			return Promise.resolve(
				record && record.tenantId === tenantId ? record : null
			);
		},
		getReceipt: (tenantId, id) => {
			const record = saleReceipts.get(id);
			return Promise.resolve(
				record && record.tenantId === tenantId ? record : null
			);
		},
		getSale: (tenantId, saleId) => {
			const record = sales.get(saleId);
			return Promise.resolve(
				record && record.tenantId === tenantId ? record : null
			);
		},
		getSession: (tenantId, sessionId) => {
			const record = sessions.get(sessionId);
			return Promise.resolve(
				record && record.tenantId === tenantId ? record : null
			);
		},
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
		recordCommandReceipt: (receipt) => {
			const key = `${receipt.tenantId}${receipt.operation}${receipt.idempotencyKey}`;
			const existing = commandReceipts.get(key);
			if (existing) {
				return Promise.resolve({ inserted: false, record: existing });
			}
			commandReceipts.set(key, receipt);
			return Promise.resolve({ inserted: true, record: receipt });
		},
		updatePriceOverride: (record, expectedVersion) => {
			const current = priceOverrides.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			priceOverrides.set(record.id, record);
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
		movements,
		priceOverrides,
		repository,
		saleReceipts,
		sales,
		sessions,
	};
}

function createHarness() {
	const {
		movements,
		priceOverrides,
		repository,
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
	const service = createPosService({
		clock: () => new Date("2026-07-18T12:00:00.000Z"),
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		pricing: createTestPricingEngine(),
		products: {
			requireProduct: ({ productId }) =>
				Promise.resolve({ productName: `Product ${productId}` }),
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
		events,
		ids,
		movements,
		negativeStockProductIds,
		priceOverrides,
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
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reversal-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
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
			countedCash: { amountMinor: 0, currency: "GYD" },
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
