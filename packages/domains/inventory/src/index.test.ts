// biome-ignore-all lint/suspicious/useAwait: the in-memory adapter intentionally mirrors asynchronous production port signatures.
import { describe, expect, test } from "bun:test";
import {
	addQuantities,
	createInventoryApplication,
	createInventoryService,
	DECIMAL_QUANTITY_PATTERN,
	evaluateOfflineCommand,
	type InventoryAdjustmentRecord,
	type InventoryBalanceRecord,
	type InventoryCommandOperation,
	type InventoryCommandReceipt,
	type InventoryCountRecord,
	InventoryError,
	type InventoryEventAppendPort,
	type InventoryMovementRecord,
	type InventoryPage,
	type InventoryPageRequest,
	type InventoryRepository,
	type InventoryReservationRecord,
	type InventoryTransferRecord,
	minorToQuantity,
	POSITIVE_DECIMAL_QUANTITY_PATTERN,
	quantityToMinor,
	subtractQuantities,
} from ".";

class MemoryInventoryRepository implements InventoryRepository {
	readonly adjustments = new Map<string, InventoryAdjustmentRecord>();
	readonly balances = new Map<string, InventoryBalanceRecord>();
	readonly counts = new Map<string, InventoryCountRecord>();
	readonly movements: InventoryMovementRecord[] = [];
	readonly receipts = new Map<string, InventoryCommandReceipt>();
	readonly reservations = new Map<string, InventoryReservationRecord>();
	readonly transfers = new Map<string, InventoryTransferRecord>();

	private key(tenantId: string, id: string): string {
		return `${tenantId}:${id}`;
	}
	private balanceKey(
		tenantId: string,
		locationId: string,
		itemKey: string,
		unit: string
	): string {
		return `${tenantId}:${locationId}:${itemKey}:${unit}`;
	}
	private receiptKey(
		tenantId: string,
		operation: InventoryCommandOperation,
		idempotencyKey: string
	): string {
		return `${tenantId}:${operation}:${idempotencyKey}`;
	}
	async acquireCommandLock() {
		// Single-threaded memory tests do not need a transaction lock.
	}

	async applyMovement(movement: InventoryMovementRecord) {
		const key = this.balanceKey(
			movement.tenantId,
			movement.locationId,
			movement.itemKey,
			movement.unit
		);
		const prior = this.balances.get(key);
		const onHand = addQuantities(prior?.onHand ?? "0", movement.quantity);
		if (quantityToMinor(onHand) < 0n) {
			return "negative_stock" as const;
		}
		const balance: InventoryBalanceRecord = {
			asOf: movement.occurredAt,
			classification: "Confidential",
			itemKey: movement.itemKey,
			locationId: movement.locationId,
			onHand,
			organizationId: movement.organizationId,
			productId: movement.productId,
			reconciliationState: "Current",
			tenantId: movement.tenantId,
			unit: movement.unit,
			updatedAt: movement.createdAt,
			variantId: movement.variantId,
			version: (prior?.version ?? 0) + 1,
		};
		this.balances.set(key, balance);
		this.movements.push(movement);
		return { balance, movement };
	}
	async createAdjustment(record: InventoryAdjustmentRecord) {
		this.adjustments.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async createCount(record: InventoryCountRecord) {
		this.counts.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async createReservation(record: InventoryReservationRecord) {
		this.reservations.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async createTransfer(record: InventoryTransferRecord) {
		this.transfers.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async getAdjustment(tenantId: string, organizationId: string, id: string) {
		const record = this.adjustments.get(this.key(tenantId, id));
		return structuredClone(
			record && record.organizationId === organizationId ? record : null
		);
	}
	async getBalance(
		tenantId: string,
		locationId: string,
		itemKey: string,
		unit: string
	) {
		return structuredClone(
			this.balances.get(this.balanceKey(tenantId, locationId, itemKey, unit)) ??
				null
		);
	}
	async getCommandReceipt(
		tenantId: string,
		operation: InventoryCommandOperation,
		idempotencyKey: string
	) {
		return structuredClone(
			this.receipts.get(this.receiptKey(tenantId, operation, idempotencyKey)) ??
				null
		);
	}
	async getCount(tenantId: string, organizationId: string, id: string) {
		const record = this.counts.get(this.key(tenantId, id));
		return structuredClone(
			record && record.organizationId === organizationId ? record : null
		);
	}
	async getTransfer(tenantId: string, organizationId: string, id: string) {
		const record = this.transfers.get(this.key(tenantId, id));
		return structuredClone(
			record && record.organizationId === organizationId ? record : null
		);
	}
	async listAdjustments(
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listAdjustments"]>[3]
	) {
		return this.page(
			[...this.adjustments.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.state || record.state === filters.state)
			),
			page,
			(record) => record.id
		);
	}
	async listBalances(
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: { locationId?: string; productId?: string }
	) {
		return this.page(
			[...this.balances.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.productId || record.productId === filters.productId)
			),
			page,
			(record) => `${record.locationId}:${record.itemKey}:${record.unit}`
		);
	}
	async listCounts(
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listCounts"]>[3]
	) {
		return this.page(
			[...this.counts.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.state || record.state === filters.state)
			),
			page,
			(record) => record.id
		);
	}
	async listTransfers(
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listTransfers"]>[3]
	) {
		return this.page(
			[...this.transfers.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					record.organizationId === organizationId &&
					(!filters?.locationId ||
						record.sourceLocationId === filters.locationId ||
						record.destinationLocationId === filters.locationId) &&
					(!filters?.state || record.state === filters.state)
			),
			page,
			(record) => record.id
		);
	}
	private page<T>(
		records: T[],
		page: InventoryPageRequest,
		identity: (record: T) => string
	): InventoryPage<T> {
		const start = page.cursor
			? records.findIndex((record) => identity(record) === page.cursor) + 1
			: 0;
		const items = records.slice(start, start + page.limit);
		return {
			items: structuredClone(items),
			nextCursor:
				records.length > start + page.limit && items.length > 0
					? identity(items.at(-1) as T)
					: null,
		};
	}
	async recordCommandReceipt(receipt: InventoryCommandReceipt) {
		const key = this.receiptKey(
			receipt.tenantId,
			receipt.operation,
			receipt.idempotencyKey
		);
		const current = this.receipts.get(key);
		if (current) {
			return { inserted: false, record: structuredClone(current) };
		}
		this.receipts.set(key, structuredClone(receipt));
		return { inserted: true, record: receipt };
	}
	async rebuildBalances(tenantId: string, rebuiltAt: Date) {
		for (const [key, balance] of this.balances) {
			if (balance.tenantId === tenantId) {
				this.balances.delete(key);
			}
		}
		for (const movement of this.movements.filter(
			(entry) => entry.tenantId === tenantId
		)) {
			const key = this.balanceKey(
				movement.tenantId,
				movement.locationId,
				movement.itemKey,
				movement.unit
			);
			const current = this.balances.get(key);
			this.balances.set(key, {
				asOf: movement.occurredAt,
				classification: "Confidential",
				itemKey: movement.itemKey,
				locationId: movement.locationId,
				onHand: addQuantities(current?.onHand ?? "0", movement.quantity),
				organizationId: movement.organizationId,
				productId: movement.productId,
				reconciliationState: "Current",
				tenantId,
				unit: movement.unit,
				updatedAt: rebuiltAt,
				variantId: movement.variantId,
				version: (current?.version ?? 0) + 1,
			});
		}
		return [...this.balances.values()].filter(
			(balance) => balance.tenantId === tenantId
		).length;
	}
	async releaseReservation(input: {
		id: string;
		organizationId: string;
		reason: string;
		releasedAt: Date;
		state: "Expired" | "Released";
		tenantId: string;
		version: number;
	}) {
		const current = this.reservations.get(this.key(input.tenantId, input.id));
		if (
			!current ||
			current.organizationId !== input.organizationId ||
			current.version !== input.version
		) {
			return "version_conflict" as const;
		}
		const updated = {
			...current,
			reason: input.reason,
			releasedAt: input.releasedAt,
			state: input.state,
			updatedAt: input.releasedAt,
			version: current.version + 1,
		};
		this.reservations.set(this.key(input.tenantId, input.id), updated);
		return updated;
	}
	async reservedQuantity(
		tenantId: string,
		locationId: string,
		itemKey: string,
		unit: string,
		at: Date
	) {
		return [...this.reservations.values()]
			.filter(
				(record) =>
					record.tenantId === tenantId &&
					record.locationId === locationId &&
					record.itemKey === itemKey &&
					record.unit === unit &&
					record.state === "Active" &&
					(!record.expiresAt || record.expiresAt > at)
			)
			.reduce((total, record) => addQuantities(total, record.quantity), "0");
	}
	async updateAdjustment(
		record: InventoryAdjustmentRecord,
		expectedVersion: number
	) {
		const current = this.adjustments.get(this.key(record.tenantId, record.id));
		if (!current || current.version !== expectedVersion) {
			return "version_conflict" as const;
		}
		this.adjustments.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async updateCount(record: InventoryCountRecord, expectedVersion: number) {
		const current = this.counts.get(this.key(record.tenantId, record.id));
		if (!current || current.version !== expectedVersion) {
			return "version_conflict" as const;
		}
		this.counts.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
	async updateTransfer(
		record: InventoryTransferRecord,
		expectedVersion: number
	) {
		const current = this.transfers.get(this.key(record.tenantId, record.id));
		if (!current || current.version !== expectedVersion) {
			return "version_conflict" as const;
		}
		this.transfers.set(
			this.key(record.tenantId, record.id),
			structuredClone(record)
		);
		return record;
	}
}

function harness() {
	const repository = new MemoryInventoryRepository();
	const events: Parameters<InventoryEventAppendPort["append"]>[0][] = [];
	let sequence = 0;
	const service = createInventoryService({
		clock: () => new Date("2026-07-15T12:00:00.000Z"),
		ids: {
			create: (kind) => {
				sequence += 1;
				return `${kind}_${sequence}`;
			},
		},
		references: {
			requireLocation: async () => undefined,
			requireProduct: async () => undefined,
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: {
						async append(value) {
							events.push(value);
							return "inserted";
						},
					},
					repository,
				}),
		},
	});
	return { events, repository, service };
}

const adjustment = {
	locationId: "loc_a",
	productId: "prod_a",
	quantity: "10.125",
	reason: "opening correction",
	unit: "each",
};
const command = {
	actorUserId: "user_creator",
	correlationId: "correlation_123",
	idempotencyKey: "key_create",
	organizationId: "org_a",
	tenantId: "tenant_a",
};

describe("Inventory exact quantity contract", () => {
	test("round-trips exact six-place arithmetic beyond Number safe range", () => {
		const value = "9007199254740993.123456";
		expect(minorToQuantity(quantityToMinor(value))).toBe(value);
		expect(addQuantities("0.100001", "0.200002")).toBe("0.300003");
		expect(subtractQuantities("1", "1.000001")).toBe("-0.000001");
		expect(DECIMAL_QUANTITY_PATTERN.test("1e3")).toBe(false);
		expect(POSITIVE_DECIMAL_QUANTITY_PATTERN.test("0.000001")).toBe(true);
		expect(POSITIVE_DECIMAL_QUANTITY_PATTERN.test("0")).toBe(false);
	});
});

describe("Inventory adjustment ledger", () => {
	test("enforces maker-checker, posts once, replays idempotently, and reverses by linked inverse", async () => {
		const { events, repository, service } = harness();
		const created = await service.createAdjustment({
			...command,
			body: adjustment,
		});
		expect(created.state).toBe("PendingApproval");
		await expect(
			service.approveAdjustment({
				actorUserId: command.actorUserId,
				adjustmentId: created.id,
				correlationId: command.correlationId,
				idempotencyKey: "approve-self",
				organizationId: command.organizationId,
				tenantId: command.tenantId,
				version: 1,
			})
		).rejects.toMatchObject({ code: "approval_separation" });
		const approved = await service.approveAdjustment({
			actorUserId: "user_approver",
			adjustmentId: created.id,
			correlationId: command.correlationId,
			idempotencyKey: "approve",
			organizationId: command.organizationId,
			tenantId: command.tenantId,
			version: 1,
		});
		expect(approved).toMatchObject({ state: "Posted", version: 2 });
		expect(repository.movements).toHaveLength(1);
		const replay = await service.approveAdjustment({
			actorUserId: "user_approver",
			adjustmentId: created.id,
			correlationId: command.correlationId,
			idempotencyKey: "approve",
			organizationId: command.organizationId,
			tenantId: command.tenantId,
			version: 1,
		});
		expect(replay).toEqual(approved);
		expect(repository.movements).toHaveLength(1);
		const reversed = await service.reverseAdjustment({
			actorUserId: "user_reverser",
			adjustmentId: created.id,
			body: { reason: "approved in error" },
			correlationId: command.correlationId,
			idempotencyKey: "reverse",
			organizationId: command.organizationId,
			tenantId: command.tenantId,
			version: 2,
		});
		expect(reversed.state).toBe("Reversed");
		expect(repository.movements.at(-1)).toMatchObject({
			quantity: "-10.125",
			reversalOfMovementId: approved.movementId,
		});
		expect([...repository.balances.values()][0]?.onHand).toBe("0");
		expect(events.map((entry) => entry.name)).toEqual([
			"inventory.stock.adjusted.v1",
			"inventory.stock-movement.reversed.v1",
		]);
	});

	test("denies a stock-reducing adjustment that would cross below zero", async () => {
		const { service } = harness();
		const created = await service.createAdjustment({
			...command,
			body: { ...adjustment, quantity: "-1" },
		});
		await expect(
			service.approveAdjustment({
				actorUserId: "user_approver",
				adjustmentId: created.id,
				correlationId: command.correlationId,
				idempotencyKey: "negative",
				organizationId: command.organizationId,
				tenantId: command.tenantId,
				version: 1,
			})
		).rejects.toMatchObject({ code: "negative_stock" });
	});

	test("rejects idempotency-key reuse with a different command", async () => {
		const { service } = harness();
		await service.createAdjustment({ ...command, body: adjustment });
		await expect(
			service.createAdjustment({
				...command,
				body: { ...adjustment, quantity: "2" },
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
	});
});

describe("Inventory Return compensating movement (WS3 PR3)", () => {
	test("posts a positive Reversal movement referencing the original Sale movement, restoring on-hand stock", async () => {
		const { repository, service } = harness();
		// Seed positive on-hand stock via an ordinary Adjustment (a Sale
		// movement itself only ever decrements) so the subsequent Sale
		// movement below has stock to draw down without crossing negative.
		const openingAdjustment = await service.createAdjustment({
			...command,
			body: adjustment,
		});
		await service.approveAdjustment({
			actorUserId: "user_approver",
			adjustmentId: openingAdjustment.id,
			correlationId: command.correlationId,
			idempotencyKey: "approve-opening",
			organizationId: command.organizationId,
			tenantId: command.tenantId,
			version: 1,
		});
		expect([...repository.balances.values()][0]?.onHand).toBe("10.125");

		const sale = await service.recordSaleMovement({
			actorUserId: "user_cashier",
			correlationId: "correlation_sale",
			locationId: "loc_a",
			organizationId: "org_a",
			productId: "prod_a",
			quantity: "3",
			saleId: "sale_1",
			tenantId: "tenant_a",
			unit: "each",
		});
		if (sale === "negative_stock") {
			throw new Error("unexpected negative_stock");
		}
		expect([...repository.balances.values()][0]?.onHand).toBe("7.125");

		const reversal = await service.recordReturnMovement({
			actorUserId: "user_checker",
			correlationId: "correlation_return",
			locationId: "loc_a",
			organizationId: "org_a",
			productId: "prod_a",
			quantity: "1",
			returnId: "return_1",
			reversalOfMovementId: sale.id,
			tenantId: "tenant_a",
			unit: "each",
		});
		expect(reversal).toMatchObject({
			movementType: "Reversal",
			quantity: "1",
			reversalOfMovementId: sale.id,
			sourceId: "return_1",
			sourceType: "Sale",
		});
		expect([...repository.balances.values()][0]?.onHand).toBe("8.125");
		expect(repository.movements.at(-1)).toMatchObject({
			movementType: "Reversal",
			reversalOfMovementId: sale.id,
		});
	});

	test("requires a positive quantity", async () => {
		const { service } = harness();
		await expect(
			service.recordReturnMovement({
				actorUserId: "user_checker",
				correlationId: "correlation_return",
				locationId: "loc_a",
				organizationId: "org_a",
				productId: "prod_a",
				quantity: "0",
				returnId: "return_1",
				reversalOfMovementId: "movement_x",
				tenantId: "tenant_a",
				unit: "each",
			})
		).rejects.toMatchObject({ code: "invalid_quantity" });
	});
});

describe("Inventory blind counts", () => {
	test("durably replaces open draft lines with version and idempotency guards", async () => {
		const { repository, service } = harness();
		const count = await service.createCount({
			actorUserId: "counter_a",
			body: { blind: true, locationId: "loc_a" },
			idempotencyKey: "count-draft-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		const input = {
			actorUserId: "counter_a",
			body: {
				lines: [
					{ observedQuantity: "7.500001", productId: "prod_a", unit: "each" },
				],
			},
			countId: count.id,
			idempotencyKey: "count-draft-save",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: 1,
		};
		const saved = await service.saveCountDraft(input);
		expect(saved).toMatchObject({ state: "InProgress", version: 2 });
		expect(saved.lines[0]).toMatchObject({
			expectedQuantity: null,
			observedQuantity: "7.500001",
			varianceQuantity: null,
		});
		expect(await service.getCount("tenant_a", "org_a", count.id)).toEqual(
			saved
		);
		expect(await service.saveCountDraft(input)).toEqual(saved);
		expect(repository.counts.size).toBe(1);
		await expect(
			service.saveCountDraft({
				...input,
				body: {
					lines: [{ observedQuantity: "8", productId: "prod_a", unit: "each" }],
				},
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
		await expect(
			service.saveCountDraft({
				...input,
				idempotencyKey: "count-draft-stale",
			})
		).rejects.toMatchObject({ code: "version_conflict" });
		await expect(
			service.getCount("tenant_b", "org_a", count.id)
		).rejects.toMatchObject({
			code: "not_found",
		});
		const submitted = await service.submitCount({
			actorUserId: "counter_a",
			body: input.body,
			countId: count.id,
			idempotencyKey: "count-submit-after-draft",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: 2,
		});
		await expect(
			service.saveCountDraft({
				...input,
				idempotencyKey: "count-draft-terminal",
				version: submitted.version,
			})
		).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("captures observations without expected stock and derives exact variances only at independent approval", async () => {
		const { repository, service } = harness();
		const seed = await service.createAdjustment({
			...command,
			body: adjustment,
		});
		await service.approveAdjustment({
			actorUserId: "seed_approver",
			adjustmentId: seed.id,
			correlationId: command.correlationId,
			idempotencyKey: "seed",
			organizationId: command.organizationId,
			tenantId: command.tenantId,
			version: 1,
		});
		const count = await service.createCount({
			actorUserId: "counter_a",
			body: { blind: true, locationId: "loc_a" },
			idempotencyKey: "count-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		const submitted = await service.submitCount({
			actorUserId: "counter_b",
			body: {
				lines: [
					{ observedQuantity: "8.125", productId: "prod_a", unit: "each" },
				],
			},
			countId: count.id,
			idempotencyKey: "count-submit",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: 1,
		});
		expect(submitted.lines[0]).toMatchObject({
			expectedQuantity: null,
			varianceQuantity: null,
		});
		await expect(
			service.approveCount({
				actorUserId: "counter_b",
				correlationId: "corr_count",
				countId: count.id,
				idempotencyKey: "count-self",
				organizationId: "org_a",
				tenantId: "tenant_a",
				version: 2,
			})
		).rejects.toMatchObject({ code: "approval_separation" });
		const posted = await service.approveCount({
			actorUserId: "count_approver",
			correlationId: "corr_count",
			countId: count.id,
			idempotencyKey: "count-post",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: 2,
		});
		expect(posted).toMatchObject({ state: "Posted", version: 3 });
		expect(posted.lines[0]).toMatchObject({
			expectedQuantity: "10.125",
			varianceQuantity: "-2",
		});
		expect([...repository.balances.values()][0]?.onHand).toBe("8.125");
	});
});

describe("Inventory transfer conservation", () => {
	async function seededTransfer() {
		const value = harness();
		const seed = await value.service.createAdjustment({
			...command,
			body: adjustment,
		});
		await value.service.approveAdjustment({
			actorUserId: "seed_approver",
			adjustmentId: seed.id,
			correlationId: "seed",
			idempotencyKey: "seed",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: 1,
		});
		const transfer = await value.service.createTransfer({
			actorUserId: "dispatcher",
			body: {
				destinationLocationId: "loc_b",
				lines: [{ productId: "prod_a", quantity: "6", unit: "each" }],
				sourceLocationId: "loc_a",
			},
			correlationId: "transfer",
			idempotencyKey: "transfer-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		return { ...value, transfer };
	}

	test("keeps stable line identity through dispatch and partial then final receipt", async () => {
		const { repository, service, transfer } = await seededTransfer();
		const lineId = transfer.lines[0]?.id ?? "";
		const dispatched = await service.dispatchTransfer({
			actorUserId: "dispatcher",
			correlationId: "transfer",
			idempotencyKey: "dispatch",
			organizationId: "org_a",
			tenantId: "tenant_a",
			transferId: transfer.id,
			version: 1,
		});
		expect(dispatched.lines[0]).toMatchObject({
			dispatchedQuantity: "6",
			id: lineId,
			remainingQuantity: "6",
		});
		const partial = await service.receiveTransfer({
			actorUserId: "receiver",
			body: { lines: [{ lineId, receivedQuantity: "2" }], outcome: "Accepted" },
			correlationId: "receive",
			idempotencyKey: "receive-1",
			organizationId: "org_a",
			tenantId: "tenant_a",
			transferId: transfer.id,
			version: 2,
		});
		expect(partial).toMatchObject({ state: "PartiallyReceived", version: 3 });
		expect(partial.lines[0]?.remainingQuantity).toBe("4");
		const received = await service.receiveTransfer({
			actorUserId: "receiver",
			body: { lines: [{ lineId, receivedQuantity: "4" }], outcome: "Accepted" },
			correlationId: "receive",
			idempotencyKey: "receive-2",
			organizationId: "org_a",
			tenantId: "tenant_a",
			transferId: transfer.id,
			version: 3,
		});
		expect(received.state).toBe("Received");
		const balances = [...repository.balances.values()];
		expect(balances.find((entry) => entry.locationId === "loc_a")?.onHand).toBe(
			"4.125"
		);
		expect(balances.find((entry) => entry.locationId === "loc_b")?.onHand).toBe(
			"6"
		);
	});

	test("records a explained terminal exception without fabricating received stock", async () => {
		const { repository, service, transfer } = await seededTransfer();
		const lineId = transfer.lines[0]?.id ?? "";
		await service.dispatchTransfer({
			actorUserId: "dispatcher",
			correlationId: "transfer",
			idempotencyKey: "dispatch",
			organizationId: "org_a",
			tenantId: "tenant_a",
			transferId: transfer.id,
			version: 1,
		});
		const exception = await service.receiveTransfer({
			actorUserId: "receiver",
			body: {
				exceptionReason: "four units damaged in transit",
				lines: [{ lineId, receivedQuantity: "2" }],
				outcome: "Exception",
			},
			correlationId: "receive",
			idempotencyKey: "exception",
			organizationId: "org_a",
			tenantId: "tenant_a",
			transferId: transfer.id,
			version: 2,
		});
		expect(exception).toMatchObject({
			exceptionReason: "four units damaged in transit",
			state: "Exception",
		});
		expect(exception.lines[0]).toMatchObject({
			exceptionQuantity: "4",
			receivedQuantity: "2",
			remainingQuantity: "0",
		});
		expect(
			[...repository.balances.values()].find(
				(entry) => entry.locationId === "loc_b"
			)?.onHand
		).toBe("2");
	});
});

describe("Inventory tenancy, application authority, and offline seam", () => {
	test("does not disclose another tenant's aggregate", async () => {
		const { service } = harness();
		const created = await service.createAdjustment({
			...command,
			body: adjustment,
		});
		await expect(
			service.getAdjustment("tenant_b", "org_a", created.id)
		).rejects.toMatchObject({ code: "not_found" });
	});

	test("WS3 remediation R2, Finding B: two organizations in the SAME tenant — org_b cannot read or approve org_a's adjustment, cannot read org_a's count, and cannot read or dispatch org_a's transfer, using their real known ids; every org_a record is left completely unchanged", async () => {
		const { repository, service } = harness();

		// -- Adjustment: create under org_a, attempt cross-org read + approve
		// (mutation) from org_b in the SAME tenant, using the real known id.
		const createdAdjustment = await service.createAdjustment({
			...command,
			body: adjustment,
		});
		await expect(
			service.getAdjustment("tenant_a", "org_b", createdAdjustment.id)
		).rejects.toMatchObject({ code: "not_found" });
		await expect(
			service.approveAdjustment({
				actorUserId: "org_b_approver",
				adjustmentId: createdAdjustment.id,
				correlationId: "cross-org-correlation",
				idempotencyKey: "cross-org-approve-adjustment",
				organizationId: "org_b",
				tenantId: "tenant_a",
				version: createdAdjustment.version,
			})
		).rejects.toMatchObject({ code: "not_found" });
		// org_a's adjustment is completely unchanged: still PendingApproval,
		// same version, never posted to the balance ledger.
		const adjustmentAfter = await repository.getAdjustment(
			"tenant_a",
			"org_a",
			createdAdjustment.id
		);
		expect(adjustmentAfter?.state).toBe("PendingApproval");
		expect(adjustmentAfter?.version).toBe(createdAdjustment.version);
		expect(repository.balances.size).toBe(0);

		// -- Count: create under org_a, attempt cross-org read from org_b.
		const createdCount = await service.createCount({
			actorUserId: command.actorUserId,
			body: { blind: true, locationId: "loc_a" },
			idempotencyKey: "cross-org-count-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		await expect(
			service.getCount("tenant_a", "org_b", createdCount.id)
		).rejects.toMatchObject({ code: "not_found" });

		// -- Transfer: create (dispatch) under org_a, attempt cross-org read +
		// dispatch (mutation) from org_b using the real known id.
		const openingForTransfer = await service.createAdjustment({
			actorUserId: command.actorUserId,
			body: { ...adjustment, quantity: "10" },
			correlationId: "cross-org-transfer-seed",
			idempotencyKey: "cross-org-transfer-seed",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		await service.approveAdjustment({
			actorUserId: "org_a_approver",
			adjustmentId: openingForTransfer.id,
			correlationId: "cross-org-transfer-seed",
			idempotencyKey: "cross-org-transfer-seed-approve",
			organizationId: "org_a",
			tenantId: "tenant_a",
			version: openingForTransfer.version,
		});
		const createdTransfer = await service.createTransfer({
			actorUserId: command.actorUserId,
			body: {
				destinationLocationId: "loc_b",
				lines: [{ productId: "prod_a", quantity: "3", unit: "each" }],
				sourceLocationId: "loc_a",
			},
			correlationId: "cross-org-transfer",
			idempotencyKey: "cross-org-transfer-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		await expect(
			service.getTransfer("tenant_a", "org_b", createdTransfer.id)
		).rejects.toMatchObject({ code: "not_found" });
		await expect(
			service.dispatchTransfer({
				actorUserId: "org_b_dispatcher",
				correlationId: "cross-org-transfer-dispatch",
				idempotencyKey: "cross-org-transfer-cross-dispatch",
				organizationId: "org_b",
				tenantId: "tenant_a",
				transferId: createdTransfer.id,
				version: createdTransfer.version,
			})
		).rejects.toMatchObject({ code: "not_found" });
		const transferAfter = await repository.getTransfer(
			"tenant_a",
			"org_a",
			createdTransfer.id
		);
		expect(transferAfter?.state).toBe("Draft");
		expect(transferAfter?.version).toBe(createdTransfer.version);
	});

	test("WS3 remediation R2 cycle 2, Finding B (list surface): listAdjustments, listCounts, listTransfers, and listBalances do not leak another organization's rows in the same tenant when the caller omits any locationId filter", async () => {
		const { service } = harness();
		let activeOrganizationId = "org_a";
		const application = createInventoryApplication({
			activeContexts: {
				// Mirrors the real composition layer: `organizationId` comes
				// ONLY from the caller's own active tenancy context, never
				// from anything the request body supplies.
				async requireActiveContext() {
					return { organizationId: activeOrganizationId, tenantId: "tenant_a" };
				},
			},
			// Both ports are no-ops here: this test proves data-layer
			// (SQL/repository) organization scoping, not permission or
			// entitlement evaluation, which are covered elsewhere.
			entitlements: {
				async requireEntitlement() {
					// Always authorized; not under test here.
				},
			},
			permissions: {
				async requirePermission() {
					// Always authorized; not under test here.
				},
			},
			service,
		});
		const seed = async (organizationId: "org_a" | "org_b") => {
			activeOrganizationId = organizationId;
			const locationId = organizationId === "org_a" ? "loc_a" : "loc_b";
			const createdAdjustment = await application.createAdjustment({
				actorUserId: `${organizationId}_creator`,
				body: {
					locationId,
					productId: "prod_shared",
					quantity: "5",
					reason: `${organizationId} list-leak seed`,
					unit: "each",
				},
				contextId: "context",
				correlationId: `list-leak-${organizationId}`,
				idempotencyKey: `list-leak-adjustment-${organizationId}`,
				sessionId: "session",
			});
			await application.approveAdjustment({
				actorUserId: `${organizationId}_approver`,
				adjustmentId: createdAdjustment.id,
				contextId: "context",
				correlationId: `list-leak-${organizationId}`,
				idempotencyKey: `list-leak-adjustment-${organizationId}-approve`,
				sessionId: "session",
				version: createdAdjustment.version,
			});
			const count = await application.createCount({
				actorUserId: `${organizationId}_counter`,
				body: { blind: true, locationId },
				contextId: "context",
				idempotencyKey: `list-leak-count-${organizationId}`,
				sessionId: "session",
			});
			const transfer = await application.createTransfer({
				actorUserId: `${organizationId}_transfer_maker`,
				body: {
					destinationLocationId: `${locationId}_dest`,
					lines: [{ productId: "prod_shared", quantity: "1", unit: "each" }],
					sourceLocationId: locationId,
				},
				contextId: "context",
				correlationId: `list-leak-transfer-${organizationId}`,
				idempotencyKey: `list-leak-transfer-${organizationId}`,
				sessionId: "session",
			});
			return { adjustment: createdAdjustment, count, transfer };
		};
		const seededA = await seed("org_a");
		const seededB = await seed("org_b");

		// The exploit shape the finding describes: the caller supplies NO
		// locationId filter at all (a normal, unprivileged request) while
		// authenticated into org_b's own active context.
		activeOrganizationId = "org_b";
		const listInput = {
			authUserId: "org_b_reader",
			contextId: "context",
			page: { limit: 50 },
			sessionId: "session",
		};
		const adjustments = await application.listAdjustments(listInput);
		expect(adjustments.items.map((item) => item.id)).toContain(
			seededB.adjustment.id
		);
		expect(adjustments.items.map((item) => item.id)).not.toContain(
			seededA.adjustment.id
		);

		const counts = await application.listCounts(listInput);
		expect(counts.items.map((item) => item.id)).toContain(seededB.count.id);
		expect(counts.items.map((item) => item.id)).not.toContain(seededA.count.id);

		const transfers = await application.listTransfers(listInput);
		expect(transfers.items.map((item) => item.id)).toContain(
			seededB.transfer.id
		);
		expect(transfers.items.map((item) => item.id)).not.toContain(
			seededA.transfer.id
		);

		const balances = await application.listBalances({
			authUserId: "org_b_reader",
			contextId: "context",
			page: { limit: 50 },
			sessionId: "session",
		});
		expect(balances.items.some((item) => item.locationId === "loc_b")).toBe(
			true
		);
		expect(balances.items.some((item) => item.locationId === "loc_a")).toBe(
			false
		);
	});

	test("evaluates active context, permission, and entitlement separately", async () => {
		const { service } = harness();
		const calls: string[] = [];
		const application = createInventoryApplication({
			activeContexts: {
				async requireActiveContext() {
					calls.push("context");
					return { organizationId: "org_a", tenantId: "tenant_a" };
				},
			},
			entitlements: {
				async requireEntitlement(input) {
					calls.push(`entitlement:${input.capabilityId}`);
				},
			},
			permissions: {
				async requirePermission(input) {
					calls.push(`permission:${input.permission}`);
				},
			},
			service,
		});
		await application.createAdjustment({
			actorUserId: "user",
			body: adjustment,
			contextId: "context",
			correlationId: "correlation",
			idempotencyKey: "application",
			sessionId: "session",
		});
		expect(calls).toEqual([
			"context",
			"permission:inventory.adjustment.create",
			"entitlement:inventory.adjustments",
		]);
	});

	test("authorizes internal Reservation create and release with separate permission and entitlement checks", async () => {
		const { repository, service } = harness();
		const calls: string[] = [];
		const application = createInventoryApplication({
			activeContexts: {
				async requireActiveContext() {
					calls.push("context");
					return { organizationId: "org_a", tenantId: "tenant_a" };
				},
			},
			entitlements: {
				async requireEntitlement(input) {
					calls.push(`entitlement:${input.capabilityId}`);
				},
			},
			permissions: {
				async requirePermission(input) {
					calls.push(`permission:${input.permission}`);
				},
			},
			service,
		});
		const reservation = await application.createReservation({
			actorUserId: "reservation_creator",
			contextId: "context",
			correlationId: "reservation-authority",
			expiresAt: new Date("2026-07-15T13:00:00.000Z"),
			idempotencyKey: "reservation-authority-create",
			locationId: "loc_a",
			productId: "prod_a",
			quantity: "2",
			sessionId: "session",
			unit: "each",
		});
		expect(reservation).toMatchObject({
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		expect(calls).toEqual([
			"context",
			"permission:inventory.reservation.create",
			"entitlement:inventory.reservations",
		]);

		calls.length = 0;
		const released = await application.releaseReservation({
			actorUserId: "reservation_releaser",
			contextId: "context",
			correlationId: "reservation-authority",
			idempotencyKey: "reservation-authority-release",
			reason: "Cancelled",
			reservation,
			sessionId: "session",
		});
		expect(released).toMatchObject({ state: "Released", tenantId: "tenant_a" });
		expect(
			repository.reservations.get(`tenant_a:${reservation.id}`)
		).toMatchObject({ state: "Released" });
		expect(calls).toEqual([
			"context",
			"permission:inventory.reservation.release",
			"entitlement:inventory.reservations",
		]);
	});

	test("fails Reservation commands closed before owner mutation on permission, entitlement, or context mismatch", async () => {
		await Promise.all(
			(["permission", "entitlement"] as const).map(async (deniedAt) => {
				const { repository, service } = harness();
				const application = createInventoryApplication({
					activeContexts: {
						async requireActiveContext() {
							return { organizationId: "org_a", tenantId: "tenant_a" };
						},
					},
					entitlements: {
						async requireEntitlement() {
							if (deniedAt === "entitlement") {
								throw Object.assign(new Error("not provisioned"), {
									code: "entitlement_denied",
								});
							}
						},
					},
					permissions: {
						async requirePermission() {
							if (deniedAt === "permission") {
								throw Object.assign(new Error("not assigned"), {
									code: "authorization_denied",
								});
							}
						},
					},
					service,
				});
				await expect(
					application.createReservation({
						actorUserId: "reservation_creator",
						contextId: "context",
						correlationId: "reservation-denial",
						expiresAt: new Date("2026-07-15T13:00:00.000Z"),
						idempotencyKey: `reservation-${deniedAt}-denial`,
						locationId: "loc_a",
						productId: "prod_a",
						quantity: "2",
						sessionId: "session",
						unit: "each",
					})
				).rejects.toMatchObject({
					code:
						deniedAt === "permission"
							? "authorization_denied"
							: "entitlement_denied",
				});
				expect(repository.reservations.size).toBe(0);
			})
		);

		const { repository, service } = harness();
		const foreignReservation = await service.createReservation({
			actorUserId: "foreign_creator",
			correlationId: "reservation-context-denial",
			expiresAt: new Date("2026-07-15T13:00:00.000Z"),
			idempotencyKey: "foreign-reservation",
			locationId: "loc_b",
			organizationId: "org_b",
			productId: "prod_b",
			quantity: "1",
			tenantId: "tenant_b",
			unit: "each",
		});
		const application = createInventoryApplication({
			activeContexts: {
				async requireActiveContext() {
					return { organizationId: "org_a", tenantId: "tenant_a" };
				},
			},
			entitlements: {
				async requireEntitlement() {
					// Authorization succeeds so this branch isolates context non-disclosure.
				},
			},
			permissions: {
				async requirePermission() {
					// Authorization succeeds so this branch isolates context non-disclosure.
				},
			},
			service,
		});
		await expect(
			application.releaseReservation({
				actorUserId: "tenant_a_actor",
				contextId: "context",
				correlationId: "reservation-context-denial",
				idempotencyKey: "foreign-reservation-release",
				reason: "Cancelled",
				reservation: foreignReservation,
				sessionId: "session",
			})
		).rejects.toMatchObject({ code: "not_found" });
		expect(
			repository.reservations.get(`tenant_b:${foreignReservation.id}`)
		).toMatchObject({ state: "Active" });
	});

	test("fails closed at the application boundary for permission and entitlement denial", async () => {
		await Promise.all(
			(["permission", "entitlement"] as const).map(async (deniedAt) => {
				const { repository, service } = harness();
				const calls: string[] = [];
				const application = createInventoryApplication({
					activeContexts: {
						async requireActiveContext() {
							calls.push("context");
							return { organizationId: "org_a", tenantId: "tenant_a" };
						},
					},
					entitlements: {
						async requireEntitlement() {
							calls.push("entitlement");
							if (deniedAt === "entitlement") {
								throw Object.assign(new Error("commercial plan secret"), {
									code: "entitlement_denied",
								});
							}
						},
					},
					permissions: {
						async requirePermission() {
							calls.push("permission");
							if (deniedAt === "permission") {
								throw Object.assign(new Error("role assignment secret"), {
									code: "authorization_denied",
								});
							}
						},
					},
					service,
				});
				await expect(
					application.createAdjustment({
						actorUserId: "direct_api_actor",
						body: adjustment,
						contextId: "context",
						correlationId: "direct_api_denial",
						idempotencyKey: `direct-api-${deniedAt}`,
						sessionId: "session",
					})
				).rejects.toMatchObject({
					code:
						deniedAt === "permission"
							? "authorization_denied"
							: "entitlement_denied",
				});
				expect(repository.adjustments.size).toBe(0);
				expect(calls).toEqual(
					deniedAt === "permission"
						? ["context", "permission"]
						: ["context", "permission", "entitlement"]
				);
			})
		);
	});

	test("authorizes draft-line persistence with count create authority", async () => {
		const { service } = harness();
		const count = await service.createCount({
			actorUserId: "counter_a",
			body: { blind: true, locationId: "loc_a" },
			idempotencyKey: "count-app-create",
			organizationId: "org_a",
			tenantId: "tenant_a",
		});
		const calls: string[] = [];
		const application = createInventoryApplication({
			activeContexts: {
				async requireActiveContext() {
					calls.push("context");
					return { organizationId: "org_a", tenantId: "tenant_a" };
				},
			},
			entitlements: {
				async requireEntitlement(input) {
					calls.push(`entitlement:${input.capabilityId}`);
				},
			},
			permissions: {
				async requirePermission(input) {
					calls.push(`permission:${input.permission}`);
				},
			},
			service,
		});
		await application.saveCountDraft({
			actorUserId: "counter_a",
			body: { lines: [] },
			contextId: "context",
			countId: count.id,
			idempotencyKey: "count-app-save",
			sessionId: "session",
			version: 1,
		});
		expect(calls).toEqual([
			"context",
			"permission:inventory.count.create",
			"entitlement:inventory.counts",
		]);
	});

	test("maps only verified lease facts to deterministic transport-neutral outcomes", () => {
		const facts = {
			commandId: "offline-1",
			expiresAt: new Date("2026-07-15T13:00:00Z"),
			sequence: 7,
			startsAt: new Date("2026-07-15T11:00:00Z"),
			tenantId: "tenant_a",
			verified: true as const,
		};
		expect(
			evaluateOfflineCommand({
				at: new Date("2026-07-15T12:00:00Z"),
				expectedNextSequence: 7,
				facts,
				tenantId: "tenant_a",
			})
		).toBe("accepted");
		expect(
			evaluateOfflineCommand({
				at: new Date("2026-07-15T12:00:00Z"),
				expectedNextSequence: 8,
				facts,
				tenantId: "tenant_a",
			})
		).toBe("duplicate");
		expect(
			evaluateOfflineCommand({
				at: new Date("2026-07-15T12:00:00Z"),
				expectedNextSequence: 6,
				facts,
				tenantId: "tenant_a",
			})
		).toBe("conflict");
		expect(
			evaluateOfflineCommand({
				at: new Date("2026-07-15T14:00:00Z"),
				expectedNextSequence: 7,
				facts,
				tenantId: "tenant_a",
			})
		).toBe("review_required");
		expect(
			evaluateOfflineCommand({
				at: new Date("2026-07-15T12:00:00Z"),
				expectedNextSequence: 7,
				facts,
				tenantId: "tenant_b",
			})
		).toBe("rejected");
	});

	test("applies an accepted verified offline command once and rebuilds balance from its immutable movement", async () => {
		const { repository, service } = harness();
		const facts = {
			commandId: "offline-apply-1",
			expiresAt: new Date("2026-07-15T13:00:00Z"),
			sequence: 7,
			startsAt: new Date("2026-07-15T11:00:00Z"),
			tenantId: "tenant_a",
			verified: true as const,
		};
		const input = {
			actorUserId: "offline_actor",
			correlationId: "offline_correlation",
			expectedNextSequence: 7,
			facts,
			locationId: "loc_offline",
			organizationId: "org_a",
			productId: "prod_offline",
			quantity: "4.000001",
			tenantId: "tenant_a",
			unit: "each",
		};
		const accepted = await service.applyOfflineMovement(input);
		expect(accepted).toMatchObject({ outcome: "accepted" });
		expect(await service.applyOfflineMovement(input)).toMatchObject({
			movementId: accepted.movementId,
			outcome: "duplicate",
		});
		expect(repository.movements).toHaveLength(1);
		const [key] = repository.balances.keys();
		const balance = key ? repository.balances.get(key) : undefined;
		if (!(key && balance)) {
			throw new Error("expected offline balance");
		}
		repository.balances.set(key, { ...balance, onHand: "99" });
		expect(await service.rebuildBalances("tenant_a")).toBe(1);
		expect(repository.balances.get(key)?.onHand).toBe("4.000001");
	});

	test("rejects an offline movement that would create negative stock without appending a fact", async () => {
		const { repository, service } = harness();
		const result = await service.applyOfflineMovement({
			actorUserId: "offline_actor",
			correlationId: "offline_negative_stock",
			expectedNextSequence: 9,
			facts: {
				commandId: "offline-negative-9",
				expiresAt: new Date("2026-07-15T13:00:00Z"),
				sequence: 9,
				startsAt: new Date("2026-07-15T11:00:00Z"),
				tenantId: "tenant_a",
				verified: true,
			},
			locationId: "loc_offline_negative",
			organizationId: "org_a",
			productId: "prod_offline_negative",
			quantity: "-1",
			tenantId: "tenant_a",
			unit: "each",
		});
		expect(result).toEqual({ outcome: "rejected" });
		expect(repository.movements).toHaveLength(0);
		expect(repository.balances.size).toBe(0);
	});

	test("exposes stable domain error codes", () => {
		expect(new InventoryError("invalid_state", "bad")).toMatchObject({
			code: "invalid_state",
			name: "InventoryError",
		});
	});
});
