import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createInventoryService,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import {
	createInventoryRepository,
	migrateInventory,
} from "@meridian/persistence-inventory-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_inventory_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}
async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
		return null;
	} catch (error) {
		return error;
	}
}

const ids: InventoryIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

function service(failEvents = false) {
	return createInventoryService({
		clock: () => new Date(),
		ids,
		references: {
			requireLocation: async () => undefined,
			requireProduct: async () => undefined,
		},
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: failEvents
				? { append: () => Promise.reject(new Error("injected outbox failure")) }
				: createPostgresOutbox(client),
			repository: createInventoryRepository(client),
		})),
	});
}

const base = {
	actorUserId: "inventory_creator",
	correlationId: "correlation_inventory_integration",
	organizationId: "organization_inventory",
	tenantId: "tenant_inventory_a",
};

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 4 });
	await migratePlatformEvents(testPool);
	await migrateInventory(testPool);
});
afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("Inventory PostgreSQL controlled prototype", () => {
	test("migrates idempotently through its isolated history and creates only nine owner tables", async () => {
		await migrateInventory(testPool);
		const tables = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'inventory_%' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"inventory_adjustment",
			"inventory_command_receipt",
			"inventory_count",
			"inventory_count_line",
			"inventory_reservation",
			"inventory_stock_balance",
			"inventory_stock_movement",
			"inventory_transfer",
			"inventory_transfer_line",
		]);
	});

	test("posts and reverses immutable Adjustment movements with atomic receipts and events", async () => {
		const inventory = service();
		const created = await inventory.createAdjustment({
			...base,
			body: {
				locationId: "location_a",
				productId: "product_a",
				quantity: "12.500001",
				reason: "opening balance",
				unit: "each",
			},
			idempotencyKey: "adjustment-create",
		});
		const posted = await inventory.approveAdjustment({
			actorUserId: "inventory_approver",
			adjustmentId: created.id,
			correlationId: base.correlationId,
			idempotencyKey: "adjustment-approve",
			tenantId: base.tenantId,
			version: 1,
		});
		const replay = await inventory.approveAdjustment({
			actorUserId: "inventory_approver",
			adjustmentId: created.id,
			correlationId: base.correlationId,
			idempotencyKey: "adjustment-approve",
			tenantId: base.tenantId,
			version: 1,
		});
		expect(replay).toEqual(posted);
		const reversed = await inventory.reverseAdjustment({
			actorUserId: "inventory_reverser",
			adjustmentId: created.id,
			body: { reason: "incorrect opening balance" },
			correlationId: base.correlationId,
			idempotencyKey: "adjustment-reverse",
			tenantId: base.tenantId,
			version: 2,
		});
		expect(reversed).toMatchObject({ state: "Reversed", version: 3 });
		const facts = await testPool.query<{
			balances: string;
			movements: string;
			outbox: string;
			receipts: string;
		}>(
			"SELECT (SELECT count(*) FROM inventory_stock_balance)::text AS balances, (SELECT count(*) FROM inventory_stock_movement)::text AS movements, (SELECT count(*) FROM inventory_command_receipt)::text AS receipts, (SELECT count(*) FROM platform_event_outbox)::text AS outbox"
		);
		expect(facts.rows[0]).toEqual({
			balances: "1",
			movements: "2",
			outbox: "2",
			receipts: "3",
		});
	});

	test("serializes concurrent postings and rebuilds balances exactly from immutable movements", async () => {
		const inventory = service();
		const first = await inventory.createAdjustment({
			...base,
			body: {
				locationId: "concurrent_location",
				productId: "concurrent_product",
				quantity: "1.000001",
				reason: "concurrency first",
				unit: "each",
			},
			idempotencyKey: "concurrent-create-1",
		});
		const second = await inventory.createAdjustment({
			...base,
			body: {
				locationId: "concurrent_location",
				productId: "concurrent_product",
				quantity: "2.000002",
				reason: "concurrency second",
				unit: "each",
			},
			idempotencyKey: "concurrent-create-2",
		});
		await Promise.all([
			inventory.approveAdjustment({
				actorUserId: "concurrent_approver_1",
				adjustmentId: first.id,
				correlationId: base.correlationId,
				idempotencyKey: "concurrent-approve-1",
				tenantId: base.tenantId,
				version: 1,
			}),
			inventory.approveAdjustment({
				actorUserId: "concurrent_approver_2",
				adjustmentId: second.id,
				correlationId: base.correlationId,
				idempotencyKey: "concurrent-approve-2",
				tenantId: base.tenantId,
				version: 1,
			}),
		]);
		let balances = await inventory.listBalances({
			page: { limit: 100 },
			tenantId: base.tenantId,
		});
		expect(
			balances.items.find((entry) => entry.locationId === "concurrent_location")
				?.onHand
		).toBe("3.000003");
		await testPool.query(
			"UPDATE inventory_stock_balance SET on_hand = 99 WHERE tenant_id = $1 AND location_id = 'concurrent_location'",
			[base.tenantId]
		);
		expect(await inventory.rebuildBalances(base.tenantId)).toBeGreaterThan(0);
		balances = await inventory.listBalances({
			page: { limit: 100 },
			tenantId: base.tenantId,
		});
		expect(
			balances.items.find((entry) => entry.locationId === "concurrent_location")
				?.onHand
		).toBe("3.000003");
	});

	test("serializes duplicate command identities before creating owner facts", async () => {
		const inventory = service();
		const input = {
			...base,
			body: {
				locationId: "idempotency_location",
				productId: "idempotency_product",
				quantity: "1",
				reason: "concurrent duplicate proof",
				unit: "each",
			},
			idempotencyKey: "concurrent-duplicate-create",
			tenantId: "tenant_inventory_idempotency",
		};
		const [first, second] = await Promise.all([
			inventory.createAdjustment(input),
			inventory.createAdjustment(input),
		]);
		expect(second).toEqual(first);

		const facts = await testPool.query<{
			adjustments: string;
			receipts: string;
		}>(
			"SELECT (SELECT count(*) FROM inventory_adjustment WHERE tenant_id = $1)::text AS adjustments, (SELECT count(*) FROM inventory_command_receipt WHERE tenant_id = $1 AND operation = 'inventory.adjustment.create' AND idempotency_key = $2)::text AS receipts",
			[input.tenantId, input.idempotencyKey]
		);
		expect(facts.rows[0]).toEqual({ adjustments: "1", receipts: "1" });
	});

	test("applies workflow filters before cursor pagination", async () => {
		const inventory = service();
		const tenantId = "tenant_inventory_filtered_lists";
		for (const [index, locationId] of [
			"other_location",
			"target_location",
			"other_location",
			"target_location",
		].entries()) {
			// biome-ignore lint/performance/noAwaitInLoops: deterministic fixture creation exercises committed command receipts.
			await inventory.createAdjustment({
				...base,
				body: {
					locationId,
					productId: `filtered_product_${index}`,
					quantity: "1",
					reason: `filtered adjustment ${index}`,
					unit: "each",
				},
				idempotencyKey: `filtered-adjustment-${index}`,
				tenantId,
			});
		}
		const firstAdjustments = await inventory.listAdjustments({
			filters: { locationId: "target_location", state: "PendingApproval" },
			page: { limit: 1 },
			tenantId,
		});
		expect(firstAdjustments.items).toHaveLength(1);
		expect(firstAdjustments.items[0]?.locationId).toBe("target_location");
		expect(firstAdjustments.nextCursor).not.toBeNull();
		const secondAdjustments = await inventory.listAdjustments({
			filters: { locationId: "target_location", state: "PendingApproval" },
			page: { cursor: firstAdjustments.nextCursor ?? undefined, limit: 1 },
			tenantId,
		});
		expect(secondAdjustments.items).toHaveLength(1);
		expect(secondAdjustments.items[0]?.locationId).toBe("target_location");
		expect(secondAdjustments.items[0]?.id).not.toBe(
			firstAdjustments.items[0]?.id
		);
		expect(secondAdjustments.nextCursor).toBeNull();

		for (const [index, locationId] of [
			"other_location",
			"target_location",
			"target_location",
		].entries()) {
			// biome-ignore lint/performance/noAwaitInLoops: deterministic fixture creation exercises committed command receipts.
			await inventory.createCount({
				...base,
				body: { blind: true, locationId },
				idempotencyKey: `filtered-count-${index}`,
				tenantId,
			});
		}
		const counts = await inventory.listCounts({
			filters: { locationId: "target_location", state: "Draft" },
			page: { limit: 10 },
			tenantId,
		});
		expect(counts.items).toHaveLength(2);
		expect(
			counts.items.every((record) => record.locationId === "target_location")
		).toBe(true);

		for (const [index, locations] of [
			["other_location", "another_location"],
			["target_location", "another_location"],
			["another_location", "target_location"],
		].entries()) {
			// biome-ignore lint/performance/noAwaitInLoops: deterministic fixture creation exercises committed command receipts and outbox writes.
			await inventory.createTransfer({
				...base,
				body: {
					destinationLocationId: locations[1] ?? "another_location",
					lines: [
						{
							productId: `filtered_transfer_product_${index}`,
							quantity: "1",
							unit: "each",
						},
					],
					sourceLocationId: locations[0] ?? "other_location",
				},
				idempotencyKey: `filtered-transfer-${index}`,
				tenantId,
			});
		}
		const transfers = await inventory.listTransfers({
			filters: { locationId: "target_location", state: "Draft" },
			page: { limit: 10 },
			tenantId,
		});
		expect(transfers.items).toHaveLength(2);
		expect(
			transfers.items.every(
				(record) =>
					record.sourceLocationId === "target_location" ||
					record.destinationLocationId === "target_location"
			)
		).toBe(true);
	});

	test("denies negative source stock and does not persist a partial Transfer dispatch", async () => {
		const inventory = service();
		const transfer = await inventory.createTransfer({
			...base,
			body: {
				destinationLocationId: "location_b",
				lines: [{ productId: "product_b", quantity: "1", unit: "each" }],
				sourceLocationId: "location_a",
			},
			idempotencyKey: "negative-transfer",
		});
		expect(
			await captureError(
				inventory.dispatchTransfer({
					actorUserId: "dispatcher",
					correlationId: base.correlationId,
					idempotencyKey: "negative-dispatch",
					tenantId: base.tenantId,
					transferId: transfer.id,
					version: 1,
				})
			)
		).toMatchObject({ code: "negative_stock" });
		const loaded = await inventory.getTransfer(base.tenantId, transfer.id);
		expect(loaded.state).toBe("Draft");
	});

	test("posts blind Count variance only after independent approval", async () => {
		const inventory = service();
		const count = await inventory.createCount({
			actorUserId: "counter_create",
			body: { blind: true, locationId: "location_a" },
			idempotencyKey: "count-create",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		const submitted = await inventory.submitCount({
			actorUserId: "counter_submit",
			body: {
				lines: [
					{ observedQuantity: "5", productId: "product_a", unit: "each" },
				],
			},
			countId: count.id,
			idempotencyKey: "count-submit",
			tenantId: base.tenantId,
			version: 1,
		});
		expect(submitted.lines[0]?.expectedQuantity).toBeNull();
		const posted = await inventory.approveCount({
			actorUserId: "counter_approve",
			correlationId: base.correlationId,
			countId: count.id,
			idempotencyKey: "count-approve",
			tenantId: base.tenantId,
			version: 2,
		});
		expect(posted).toMatchObject({ state: "Posted", version: 3 });
		expect(posted.lines[0]).toMatchObject({
			expectedQuantity: "0.000000",
			varianceQuantity: "5.000000",
		});
	});

	test("conserves a Transfer across partial receipt and explained exception", async () => {
		const inventory = service();
		const seed = await inventory.createAdjustment({
			...base,
			body: {
				locationId: "transfer_source",
				productId: "transfer_product",
				quantity: "10",
				reason: "transfer seed",
				unit: "each",
			},
			idempotencyKey: "transfer-seed-create",
		});
		await inventory.approveAdjustment({
			actorUserId: "seed_approver",
			adjustmentId: seed.id,
			correlationId: base.correlationId,
			idempotencyKey: "transfer-seed-approve",
			tenantId: base.tenantId,
			version: 1,
		});
		const transfer = await inventory.createTransfer({
			...base,
			body: {
				destinationLocationId: "transfer_destination",
				lines: [{ productId: "transfer_product", quantity: "6", unit: "each" }],
				sourceLocationId: "transfer_source",
			},
			idempotencyKey: "transfer-create",
		});
		const dispatched = await inventory.dispatchTransfer({
			actorUserId: "dispatcher",
			correlationId: base.correlationId,
			idempotencyKey: "transfer-dispatch",
			tenantId: base.tenantId,
			transferId: transfer.id,
			version: 1,
		});
		const lineId = dispatched.lines[0]?.id ?? "";
		const received = await inventory.receiveTransfer({
			actorUserId: "receiver",
			body: {
				exceptionReason: "one unit damaged",
				lines: [{ lineId, receivedQuantity: "5" }],
				outcome: "Exception",
			},
			correlationId: base.correlationId,
			idempotencyKey: "transfer-receive",
			tenantId: base.tenantId,
			transferId: transfer.id,
			version: 2,
		});
		expect(received).toMatchObject({ state: "Exception", version: 3 });
		expect(received.lines[0]).toMatchObject({
			exceptionQuantity: "1.000000",
			receivedQuantity: "5.000000",
			remainingQuantity: "0",
		});
		const balances = await inventory.listBalances({
			page: { limit: 50 },
			tenantId: base.tenantId,
		});
		expect(
			balances.items.find((entry) => entry.locationId === "transfer_source")
				?.onHand
		).toBe("4.000000");
		expect(
			balances.items.find(
				(entry) => entry.locationId === "transfer_destination"
			)?.onHand
		).toBe("5.000000");
		const firstPage = await inventory.listBalances({
			filters: { productId: "transfer_product" },
			page: { limit: 1 },
			tenantId: base.tenantId,
		});
		expect(firstPage.items).toHaveLength(1);
		expect(firstPage.nextCursor).not.toBeNull();
		const secondPage = await inventory.listBalances({
			filters: { productId: "transfer_product" },
			page: { cursor: firstPage.nextCursor ?? undefined, limit: 1 },
			tenantId: base.tenantId,
		});
		expect(
			[firstPage.items[0]?.locationId, secondPage.items[0]?.locationId].sort()
		).toEqual(["transfer_destination", "transfer_source"]);
	});

	test("keeps Reservations out of physical stock while reducing current availability", async () => {
		const inventory = service();
		const reservation = await inventory.createReservation({
			...base,
			expiresAt: new Date(Date.now() + 60_000),
			idempotencyKey: "reservation-create",
			locationId: "transfer_destination",
			productId: "transfer_product",
			quantity: "2",
			unit: "each",
		});
		let balances = await inventory.listBalances({
			page: { limit: 50 },
			tenantId: base.tenantId,
		});
		expect(
			balances.items.find(
				(entry) => entry.locationId === "transfer_destination"
			)
		).toMatchObject({
			available: "3",
			onHand: "5.000000",
			reserved: "2.000000",
		});
		await inventory.releaseReservation({
			actorUserId: "reservation_releaser",
			correlationId: base.correlationId,
			idempotencyKey: "reservation-release",
			reason: "Cancelled",
			reservation,
		});
		balances = await inventory.listBalances({
			page: { limit: 50 },
			tenantId: base.tenantId,
		});
		expect(
			balances.items.find(
				(entry) => entry.locationId === "transfer_destination"
			)
		).toMatchObject({ available: "5", onHand: "5.000000", reserved: "0" });
	});

	test("applies an offline-origin command exactly once from pre-verified lease facts", async () => {
		const inventory = service();
		const now = Date.now();
		const input = {
			actorUserId: "offline_actor",
			correlationId: "offline_integration",
			expectedNextSequence: 11,
			facts: {
				commandId: "offline-integration-11",
				expiresAt: new Date(now + 60_000),
				sequence: 11,
				startsAt: new Date(now - 60_000),
				tenantId: base.tenantId,
				verified: true as const,
			},
			locationId: "offline_location",
			organizationId: base.organizationId,
			productId: "offline_product",
			quantity: "2.000001",
			tenantId: base.tenantId,
			unit: "each",
		};
		const accepted = await inventory.applyOfflineMovement(input);
		expect(accepted).toMatchObject({ outcome: "accepted" });
		expect(await inventory.applyOfflineMovement(input)).toMatchObject({
			movementId: accepted.movementId,
			outcome: "duplicate",
		});
		const persisted = await testPool.query<{
			movements: string;
			receipts: string;
		}>(
			"SELECT (SELECT count(*) FROM inventory_stock_movement WHERE tenant_id = $1 AND source_type = 'OfflineCommand')::text AS movements, (SELECT count(*) FROM inventory_command_receipt WHERE tenant_id = $1 AND source_channel = 'offline')::text AS receipts",
			[base.tenantId]
		);
		expect(persisted.rows[0]).toEqual({ movements: "1", receipts: "1" });
	});

	test("enforces tenant non-disclosure and database CHECK constraints", async () => {
		const inventory = service();
		const [own] = (
			await inventory.listAdjustments({
				page: { limit: 50 },
				tenantId: base.tenantId,
			})
		).items;
		expect(own).toBeDefined();
		expect(
			await captureError(
				inventory.getAdjustment("tenant_inventory_b", own?.id ?? "")
			)
		).toMatchObject({ code: "not_found" });
		const invalid = await captureError(
			testPool.query(
				"UPDATE inventory_transfer_line SET received_quantity = dispatched_quantity + 1 WHERE tenant_id = $1",
				[base.tenantId]
			)
		);
		expect(invalid).toMatchObject({
			code: "23514",
			constraint: "inventory_transfer_line_quantities_check",
		});
	});

	test("rolls owner state, movement, receipt, and outbox back together on append failure", async () => {
		const before = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM inventory_stock_movement"
		);
		const failed = service(true);
		const created = await failed.createAdjustment({
			...base,
			body: {
				locationId: "rollback_location",
				productId: "rollback_product",
				quantity: "1",
				reason: "rollback evidence",
				unit: "each",
			},
			idempotencyKey: "rollback-create",
		});
		expect(
			await captureError(
				failed.approveAdjustment({
					actorUserId: "rollback_approver",
					adjustmentId: created.id,
					correlationId: base.correlationId,
					idempotencyKey: "rollback-approve",
					tenantId: base.tenantId,
					version: 1,
				})
			)
		).toBeInstanceOf(Error);
		const after = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM inventory_stock_movement"
		);
		expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
		expect(
			(await service().getAdjustment(base.tenantId, created.id)).state
		).toBe("PendingApproval");
	});
});
