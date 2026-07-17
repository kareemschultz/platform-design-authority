import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import {
	createInventoryService,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import {
	createInventoryRepository,
	migrateInventory,
	serializeInventoryStockBalanceCursor,
} from "@meridian/persistence-inventory-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import {
	decodeStockBalanceCursor,
	encodeStockBalanceCursor,
} from "./inventory";
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

function service(failEvents = false, clock: () => Date = () => new Date()) {
	return createInventoryService({
		clock,
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
	test("wraps owner cursors in a versioned opaque transport token", () => {
		const raw = serializeInventoryStockBalanceCursor({
			itemKey: "product_a",
			locationId: "location_a",
			unit: "case\u001feach",
		});
		const publicToken = (payload: string) =>
			`sb1_${Buffer.from(payload, "utf8").toString("base64url")}`;
		const encoded = encodeStockBalanceCursor(raw);
		expect(encoded).toStartWith("sb1_");
		expect(encoded).not.toContain("product_a");
		expect(decodeStockBalanceCursor(encoded ?? undefined)).toBe(raw);
		expect(() => decodeStockBalanceCursor("sb2_future")).toThrow(
			"Stock balance cursor is invalid"
		);
		expect(() =>
			decodeStockBalanceCursor("sb1_bm90LWEtcHJvamVjdGlvbi1rZXk")
		).toThrow("Stock balance cursor is invalid");
		expect(() => decodeStockBalanceCursor(publicToken("{"))).toThrow(
			"Stock balance cursor is invalid"
		);
		expect(() =>
			decodeStockBalanceCursor(
				publicToken(
					JSON.stringify({
						itemKey: "product_a",
						locationId: "location_a",
						unit: "each",
						version: 2,
					})
				)
			)
		).toThrow("Stock balance cursor is invalid");
		expect(() =>
			decodeStockBalanceCursor(
				publicToken(
					JSON.stringify({
						itemKey: "product_a",
						locationId: "location_a",
						tenantId: "tenant_smuggled",
						unit: "each",
						version: 1,
					})
				)
			)
		).toThrow("Stock balance cursor is invalid");
		expect(
			decodeStockBalanceCursor(
				publicToken(
					JSON.stringify(
						Object.fromEntries([
							["unit", "case\u001feach"],
							["locationId", "location_a"],
							["itemKey", "product_a"],
							["version", 1],
						])
					)
				)
			)
		).toBe(raw);
	});
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

	test("paginates balances whose contract-valid unit contains the former delimiter", async () => {
		const inventory = service();
		const tenantId = "tenant_inventory_structural_cursor";
		const delimiterUnit = "case\u001feach";
		for (const [index, productId] of [
			"cursor_product_a",
			"cursor_product_z",
		].entries()) {
			// biome-ignore lint/performance/noAwaitInLoops: committed commands create deterministic cursor boundaries.
			const adjustment = await inventory.createAdjustment({
				...base,
				body: {
					locationId: "cursor_location",
					productId,
					quantity: "1",
					reason: "structural cursor proof",
					unit: index === 0 ? delimiterUnit : "each",
				},
				idempotencyKey: `cursor-adjustment-create-${index}`,
				tenantId,
			});
			await inventory.approveAdjustment({
				actorUserId: "cursor_approver",
				adjustmentId: adjustment.id,
				correlationId: base.correlationId,
				idempotencyKey: `cursor-adjustment-approve-${index}`,
				tenantId,
				version: 1,
			});
		}

		const firstPage = await inventory.listBalances({
			page: { limit: 1 },
			tenantId,
		});
		expect(firstPage.items).toHaveLength(1);
		expect(firstPage.items[0]?.unit).toBe(delimiterUnit);
		expect(firstPage.nextCursor).toContain('"version":1');
		const secondPage = await inventory.listBalances({
			page: { cursor: firstPage.nextCursor ?? undefined, limit: 1 },
			tenantId,
		});
		expect(secondPage.items).toHaveLength(1);
		expect(secondPage.items[0]).toMatchObject({
			productId: "cursor_product_z",
			unit: "each",
		});
		expect(secondPage.nextCursor).toBeNull();
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
		const firstCounts = await inventory.listCounts({
			filters: { locationId: "target_location", state: "Draft" },
			page: { limit: 1 },
			tenantId,
		});
		expect(firstCounts.items).toHaveLength(1);
		expect(firstCounts.items[0]?.locationId).toBe("target_location");
		expect(firstCounts.nextCursor).not.toBeNull();
		const secondCounts = await inventory.listCounts({
			filters: { locationId: "target_location", state: "Draft" },
			page: { cursor: firstCounts.nextCursor ?? undefined, limit: 1 },
			tenantId,
		});
		expect(secondCounts.items).toHaveLength(1);
		expect(secondCounts.items[0]?.locationId).toBe("target_location");
		expect(secondCounts.items[0]?.id).not.toBe(firstCounts.items[0]?.id);
		expect(secondCounts.nextCursor).toBeNull();

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
		const firstTransfers = await inventory.listTransfers({
			filters: { locationId: "target_location", state: "Draft" },
			page: { limit: 1 },
			tenantId,
		});
		expect(firstTransfers.items).toHaveLength(1);
		expect(firstTransfers.nextCursor).not.toBeNull();
		const secondTransfers = await inventory.listTransfers({
			filters: { locationId: "target_location", state: "Draft" },
			page: { cursor: firstTransfers.nextCursor ?? undefined, limit: 1 },
			tenantId,
		});
		expect(secondTransfers.items).toHaveLength(1);
		expect(secondTransfers.nextCursor).toBeNull();
		expect(
			[firstTransfers.items[0], secondTransfers.items[0]].every(
				(record) =>
					record?.sourceLocationId === "target_location" ||
					record?.destinationLocationId === "target_location"
			)
		).toBe(true);
		expect(secondTransfers.items[0]?.id).not.toBe(firstTransfers.items[0]?.id);
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
		const events = await testPool.query<{ name: string }>(
			"SELECT name FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id = $2 ORDER BY name",
			[base.tenantId, count.id]
		);
		expect(events.rows.map((event) => event.name)).toEqual(
			expect.arrayContaining(["inventory.stock-count.posted.v1"])
		);
	});

	test("persists draft Count lines atomically and replays a concurrent retry", async () => {
		const first = service();
		const second = service();
		const count = await first.createCount({
			actorUserId: "draft_counter",
			body: { blind: true, locationId: "draft_location" },
			idempotencyKey: "draft-count-create",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		const input = {
			actorUserId: "draft_counter",
			body: {
				lines: [
					{
						observedQuantity: "12.000001",
						productId: "draft_product",
						unit: "each",
					},
				],
			},
			countId: count.id,
			idempotencyKey: "draft-count-save",
			tenantId: base.tenantId,
			version: 1,
		};
		const [left, right] = await Promise.all([
			first.saveCountDraft(input),
			second.saveCountDraft(input),
		]);
		expect(right).toEqual(left);
		expect(left).toMatchObject({ state: "InProgress", version: 2 });
		expect((await second.getCount(base.tenantId, count.id)).lines).toEqual(
			left.lines
		);
		const rows = await testPool.query<{ operation: string; result: unknown }>(
			"SELECT operation, result FROM inventory_command_receipt WHERE tenant_id = $1 AND idempotency_key = $2",
			[base.tenantId, input.idempotencyKey]
		);
		expect(rows.rows).toHaveLength(1);
		expect(rows.rows[0]?.operation).toBe("inventory.count.draft.save");
		expect(
			await captureError(
				second.saveCountDraft({
					...input,
					body: {
						lines: [
							{
								observedQuantity: "13",
								productId: "draft_product",
								unit: "each",
							},
						],
					},
				})
			)
		).toMatchObject({ code: "idempotency_conflict" });
	});

	test("enforces maker/checker separation in the live owner transaction", async () => {
		const inventory = service();
		const adjustment = await inventory.createAdjustment({
			actorUserId: "live_adjustment_maker",
			body: {
				locationId: "separation_location",
				productId: "separation_product",
				quantity: "1",
				reason: "maker checker integration proof",
				unit: "each",
			},
			correlationId: base.correlationId,
			idempotencyKey: "separation-adjustment-create",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		expect(
			await captureError(
				inventory.approveAdjustment({
					actorUserId: "live_adjustment_maker",
					adjustmentId: adjustment.id,
					correlationId: base.correlationId,
					idempotencyKey: "separation-adjustment-self-approve",
					tenantId: base.tenantId,
					version: 1,
				})
			)
		).toMatchObject({ code: "approval_separation" });
		expect(
			await inventory.getAdjustment(base.tenantId, adjustment.id)
		).toMatchObject({ state: "PendingApproval", version: 1 });

		const count = await inventory.createCount({
			actorUserId: "live_count_maker",
			body: { blind: true, locationId: "separation_location" },
			idempotencyKey: "separation-count-create",
			organizationId: base.organizationId,
			tenantId: base.tenantId,
		});
		const submitted = await inventory.submitCount({
			actorUserId: "live_count_maker",
			body: {
				lines: [
					{
						observedQuantity: "1",
						productId: "separation_product",
						unit: "each",
					},
				],
			},
			countId: count.id,
			idempotencyKey: "separation-count-submit",
			tenantId: base.tenantId,
			version: 1,
		});
		expect(
			await captureError(
				inventory.approveCount({
					actorUserId: "live_count_maker",
					correlationId: base.correlationId,
					countId: count.id,
					idempotencyKey: "separation-count-self-approve",
					tenantId: base.tenantId,
					version: submitted.version,
				})
			)
		).toMatchObject({ code: "approval_separation" });
		expect(await inventory.getCount(base.tenantId, count.id)).toMatchObject({
			state: "Submitted",
			version: submitted.version,
		});
	});

	test("conserves a Transfer across partial receipt and explained exception", async () => {
		const inventory = service();
		const startedAt = performance.now();
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
		const events = await testPool.query<{ name: string }>(
			"SELECT name FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id = $2 ORDER BY name",
			[base.tenantId, transfer.id]
		);
		expect(events.rows.map((event) => event.name)).toEqual(
			expect.arrayContaining([
				"inventory.stock-transfer.created.v1",
				"inventory.stock-transfer.dispatched.v1",
				"inventory.stock-transfer.received.v1",
			])
		);
		expect(performance.now() - startedAt).toBeLessThan(5000);
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
		expect(
			await captureError(
				inventory.releaseReservation({
					actorUserId: "reservation_releaser",
					correlationId: base.correlationId,
					idempotencyKey: "reservation-release-foreign-organization",
					reason: "Cancelled",
					reservation: {
						...reservation,
						organizationId: "organization_foreign",
					},
				})
			)
		).toMatchObject({ code: "version_conflict" });
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

	test("expires a Reservation deterministically without physical movement and restores availability", async () => {
		let now = new Date("2026-07-16T12:00:00.000Z");
		const inventory = service(false, () => now);
		const startedAt = performance.now();
		const reservation = await inventory.createReservation({
			...base,
			expiresAt: new Date("2026-07-16T12:01:00.000Z"),
			idempotencyKey: "reservation-expiry-create",
			locationId: "transfer_destination",
			productId: "transfer_product",
			quantity: "2",
			unit: "each",
		});
		expect(
			(
				await inventory.listBalances({
					page: { limit: 50 },
					tenantId: base.tenantId,
				})
			).items.find((entry) => entry.locationId === "transfer_destination")
		).toMatchObject({
			available: "3",
			onHand: "5.000000",
			reserved: "2.000000",
		});

		const movementCountBefore = await testPool.query<{ count: number }>(
			"SELECT count(*)::int AS count FROM inventory_stock_movement WHERE tenant_id = $1",
			[base.tenantId]
		);
		expect(
			await captureError(
				inventory.releaseReservation({
					actorUserId: "reservation_expiry_worker",
					correlationId: base.correlationId,
					idempotencyKey: "reservation-expiry-too-early",
					reason: "Expired",
					reservation,
				})
			)
		).toMatchObject({
			code: "invalid_state",
			message: "Reservation cannot expire before its expiry instant",
		});
		expect(
			await captureError(
				inventory.releaseReservation({
					actorUserId: "reservation_expiry_worker",
					correlationId: base.correlationId,
					idempotencyKey: "reservation-expiry-forged-time",
					reason: "Expired",
					reservation: {
						...reservation,
						expiresAt: new Date("2026-07-16T11:59:00.000Z"),
					},
				})
			)
		).toMatchObject({ code: "version_conflict" });
		now = new Date("2026-07-16T12:01:01.000Z");
		const expiryInput = {
			actorUserId: "reservation_expiry_worker",
			correlationId: base.correlationId,
			idempotencyKey: "reservation-expiry-release",
			reason: "Expired",
			reservation,
		} as const;
		const [expired, retry] = await Promise.all([
			inventory.releaseReservation(expiryInput),
			inventory.releaseReservation(expiryInput),
		]);
		expect(retry).toEqual(expired);
		expect(expired).toMatchObject({
			reason: "Expired",
			state: "Expired",
			version: 2,
		});
		expect(
			(
				await inventory.listBalances({
					page: { limit: 50 },
					tenantId: base.tenantId,
				})
			).items.find((entry) => entry.locationId === "transfer_destination")
		).toMatchObject({ available: "5", onHand: "5.000000", reserved: "0" });
		const facts = await testPool.query<{
			created_events: number;
			released_events: number;
			state: string;
		}>(
			`SELECT reservation.state,
			        (SELECT count(*)::int FROM platform_event_outbox event
			          WHERE event.tenant_id = reservation.tenant_id
			            AND event.aggregate_id = reservation.id
			            AND event.name = 'inventory.reservation.created.v1') AS created_events,
			        (SELECT count(*)::int FROM platform_event_outbox event
			          WHERE event.tenant_id = reservation.tenant_id
			            AND event.aggregate_id = reservation.id
			            AND event.name = 'inventory.reservation.released.v1') AS released_events
			   FROM inventory_reservation reservation
			  WHERE reservation.tenant_id = $1 AND reservation.id = $2`,
			[base.tenantId, reservation.id]
		);
		expect(facts.rows).toEqual([
			{ created_events: 1, released_events: 1, state: "Expired" },
		]);
		expect(
			await testPool.query<{ count: number }>(
				"SELECT count(*)::int AS count FROM inventory_stock_movement WHERE tenant_id = $1",
				[base.tenantId]
			)
		).toMatchObject({ rows: movementCountBefore.rows });
		expect(performance.now() - startedAt).toBeLessThan(5000);
	});

	test("applies an offline-origin command exactly once from pre-verified lease facts", async () => {
		const inventory = service();
		const now = Date.now();
		const startedAt = performance.now();
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
		const results = await Promise.all([
			inventory.applyOfflineMovement(input),
			inventory.applyOfflineMovement(input),
		]);
		expect(results.map((result) => result.outcome).sort()).toEqual([
			"accepted",
			"duplicate",
		]);
		expect(results[0]?.movementId).toBe(results[1]?.movementId);
		const persisted = await testPool.query<{
			movements: string;
			receipts: string;
			source_command_id: string;
			source_sequence: number;
		}>(
			"SELECT (SELECT count(*) FROM inventory_stock_movement WHERE tenant_id = $1 AND source_type = 'OfflineCommand')::text AS movements, count(*)::text AS receipts, min(source_command_id) AS source_command_id, min(source_sequence)::int AS source_sequence FROM inventory_command_receipt WHERE tenant_id = $1 AND source_channel = 'offline'",
			[base.tenantId]
		);
		expect(persisted.rows[0]).toEqual({
			movements: "1",
			receipts: "1",
			source_command_id: input.facts.commandId,
			source_sequence: 11,
		});
		expect(performance.now() - startedAt).toBeLessThan(5000);
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
