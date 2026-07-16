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
	async getAdjustment(tenantId: string, id: string) {
		return structuredClone(
			this.adjustments.get(this.key(tenantId, id)) ?? null
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
	async getCount(tenantId: string, id: string) {
		return structuredClone(this.counts.get(this.key(tenantId, id)) ?? null);
	}
	async getTransfer(tenantId: string, id: string) {
		return structuredClone(this.transfers.get(this.key(tenantId, id)) ?? null);
	}
	async listAdjustments(
		tenantId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listAdjustments"]>[2]
	) {
		return this.page(
			[...this.adjustments.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.state || record.state === filters.state)
			),
			page,
			(record) => record.id
		);
	}
	async listBalances(
		tenantId: string,
		page: InventoryPageRequest,
		filters?: { locationId?: string; productId?: string }
	) {
		return this.page(
			[...this.balances.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.productId || record.productId === filters.productId)
			),
			page,
			(record) => `${record.locationId}:${record.itemKey}:${record.unit}`
		);
	}
	async listCounts(
		tenantId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listCounts"]>[2]
	) {
		return this.page(
			[...this.counts.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
					(!filters?.locationId || record.locationId === filters.locationId) &&
					(!filters?.state || record.state === filters.state)
			),
			page,
			(record) => record.id
		);
	}
	async listTransfers(
		tenantId: string,
		page: InventoryPageRequest,
		filters?: Parameters<InventoryRepository["listTransfers"]>[2]
	) {
		return this.page(
			[...this.transfers.values()].filter(
				(record) =>
					record.tenantId === tenantId &&
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
		reason: string;
		releasedAt: Date;
		tenantId: string;
		version: number;
	}) {
		const current = this.reservations.get(this.key(input.tenantId, input.id));
		if (!current || current.version !== input.version) {
			return "version_conflict" as const;
		}
		const updated = {
			...current,
			reason: input.reason,
			releasedAt: input.releasedAt,
			state: "Released" as const,
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
				tenantId: command.tenantId,
				version: 1,
			})
		).rejects.toMatchObject({ code: "approval_separation" });
		const approved = await service.approveAdjustment({
			actorUserId: "user_approver",
			adjustmentId: created.id,
			correlationId: command.correlationId,
			idempotencyKey: "approve",
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
		expect(await service.getCount("tenant_a", count.id)).toEqual(saved);
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
		await expect(service.getCount("tenant_b", count.id)).rejects.toMatchObject({
			code: "not_found",
		});
		const submitted = await service.submitCount({
			actorUserId: "counter_a",
			body: input.body,
			countId: count.id,
			idempotencyKey: "count-submit-after-draft",
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
				tenantId: "tenant_a",
				version: 2,
			})
		).rejects.toMatchObject({ code: "approval_separation" });
		const posted = await service.approveCount({
			actorUserId: "count_approver",
			correlationId: "corr_count",
			countId: count.id,
			idempotencyKey: "count-post",
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
			service.getAdjustment("tenant_b", created.id)
		).rejects.toMatchObject({ code: "not_found" });
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
