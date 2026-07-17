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

const databaseName = `meridian_ws2_closeout_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

const ids: InventoryIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function service() {
	return createInventoryService({
		clock: () => new Date(),
		ids,
		references: {
			requireLocation: async () => undefined,
			requireProduct: async () => undefined,
		},
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createInventoryRepository(client),
		})),
	});
}

function percentile(samples: readonly number[], quantile: number): number {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? 0;
}

function metrics(samples: readonly number[]) {
	return {
		failures: 0,
		maximum: Math.max(...samples),
		p50: percentile(samples, 0.5),
		p95: percentile(samples, 0.95),
		p99: percentile(samples, 0.99),
		sampleSize: samples.length,
	};
}

function reportMetric(
	name: string,
	samples: readonly number[],
	limitation: string
): void {
	process.stdout.write(
		`${JSON.stringify({
			environment:
				"isolated local PostgreSQL 18 database; warm application process",
			limitation,
			metric: name,
			unit: "milliseconds",
			...metrics(samples),
		})}\n`
	);
}

function normalizedError(error: unknown): {
	code?: unknown;
	message?: unknown;
} {
	if (!(error instanceof Error)) {
		return {};
	}
	return {
		code: "code" in error ? error.code : undefined,
		message: error.message,
	};
}

async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
		return null;
	} catch (error) {
		return error;
	}
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 6 });
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

describe.serial("WS2 Inventory closeout evidence", () => {
	test("isolates balances, counts, transfers, reservations, offline receipts, and safe errors across two tenants", async () => {
		const inventory = service();
		const tenantA = "tenant_ws2_closeout_a";
		const tenantB = "tenant_ws2_closeout_b";
		const shared = {
			locationId: "location_ws2_shared",
			organizationId: "organization_ws2_shared",
			productId: "product_ws2_shared",
		};
		for (const [tenantId, quantity] of [
			[tenantA, "10"],
			[tenantB, "20"],
		] as const) {
			// biome-ignore lint/performance/noAwaitInLoops: tenant fixtures are deliberately committed independently.
			const adjustment = await inventory.createAdjustment({
				actorUserId: `maker_${tenantId}`,
				body: {
					locationId: shared.locationId,
					productId: shared.productId,
					quantity,
					reason: "two-tenant closeout fixture",
					unit: "each",
				},
				correlationId: `correlation_${tenantId}`,
				idempotencyKey: `seed_create_${tenantId}`,
				organizationId: shared.organizationId,
				tenantId,
			});
			await inventory.approveAdjustment({
				actorUserId: `approver_${tenantId}`,
				adjustmentId: adjustment.id,
				correlationId: `correlation_${tenantId}`,
				idempotencyKey: `seed_approve_${tenantId}`,
				tenantId,
				version: 1,
			});
		}

		const countA = await inventory.createCount({
			actorUserId: "counter_tenant_a",
			body: { blind: true, locationId: shared.locationId },
			idempotencyKey: "count_tenant_a",
			organizationId: shared.organizationId,
			tenantId: tenantA,
		});
		const transferA = await inventory.createTransfer({
			actorUserId: "transfer_maker_tenant_a",
			body: {
				destinationLocationId: "location_ws2_destination",
				lines: [{ productId: shared.productId, quantity: "1", unit: "each" }],
				sourceLocationId: shared.locationId,
			},
			correlationId: "correlation_transfer_tenant_a",
			idempotencyKey: "transfer_tenant_a",
			organizationId: shared.organizationId,
			tenantId: tenantA,
		});
		await inventory.createReservation({
			actorUserId: "reservation_maker_tenant_a",
			correlationId: "correlation_reservation_tenant_a",
			expiresAt: new Date(Date.now() + 60_000),
			idempotencyKey: "reservation_tenant_a",
			locationId: shared.locationId,
			organizationId: shared.organizationId,
			productId: shared.productId,
			quantity: "2",
			tenantId: tenantA,
			unit: "each",
		});

		const commandId = "offline_shared_command_0001";
		const offlineNow = Date.now();
		const offlineFacts = {
			[tenantA]: {
				commandId,
				expiresAt: new Date(offlineNow + 60_000),
				sequence: 1,
				startsAt: new Date(offlineNow - 60_000),
				tenantId: tenantA,
				verified: true as const,
			},
			[tenantB]: {
				commandId,
				expiresAt: new Date(offlineNow + 60_000),
				sequence: 1,
				startsAt: new Date(offlineNow - 60_000),
				tenantId: tenantB,
				verified: true as const,
			},
		};
		for (const tenantId of [tenantA, tenantB] as const) {
			expect(
				// biome-ignore lint/performance/noAwaitInLoops: the same command identity is proven independently in each tenant.
				await inventory.applyOfflineMovement({
					actorUserId: `offline_actor_${tenantId}`,
					correlationId: `offline_correlation_${tenantId}`,
					expectedNextSequence: 1,
					facts: offlineFacts[tenantId],
					locationId: shared.locationId,
					organizationId: shared.organizationId,
					productId: shared.productId,
					quantity: "1",
					tenantId,
					unit: "each",
				})
			).toMatchObject({ outcome: "accepted" });
		}
		expect(
			await inventory.applyOfflineMovement({
				actorUserId: "offline_actor_tenant_a",
				correlationId: "offline_correlation_tenant_a",
				expectedNextSequence: 1,
				facts: offlineFacts[tenantA],
				locationId: shared.locationId,
				organizationId: shared.organizationId,
				productId: shared.productId,
				quantity: "1",
				tenantId: tenantA,
				unit: "each",
			})
		).toMatchObject({ outcome: "duplicate" });

		const [balanceA] = (
			await inventory.listBalances({ page: { limit: 10 }, tenantId: tenantA })
		).items;
		const [balanceB] = (
			await inventory.listBalances({ page: { limit: 10 }, tenantId: tenantB })
		).items;
		expect(balanceA).toMatchObject({
			available: "9",
			onHand: "11.000000",
			reserved: "2.000000",
		});
		expect(balanceB).toMatchObject({
			available: "21",
			onHand: "21.000000",
			reserved: "0",
		});
		expect(
			(await inventory.listCounts({ page: { limit: 10 }, tenantId: tenantB }))
				.items
		).toHaveLength(0);
		expect(
			(
				await inventory.listTransfers({
					page: { limit: 10 },
					tenantId: tenantB,
				})
			).items
		).toHaveLength(0);

		const foreignCountError = normalizedError(
			await captureError(inventory.getCount(tenantB, countA.id))
		);
		const missingCountError = normalizedError(
			await captureError(inventory.getCount(tenantB, "count_missing"))
		);
		expect(foreignCountError).toEqual(missingCountError);
		expect(foreignCountError).toMatchObject({ code: "not_found" });
		const foreignTransferError = normalizedError(
			await captureError(inventory.getTransfer(tenantB, transferA.id))
		);
		const missingTransferError = normalizedError(
			await captureError(inventory.getTransfer(tenantB, "transfer_missing"))
		);
		expect(foreignTransferError).toEqual(missingTransferError);
		expect(foreignTransferError).toMatchObject({ code: "not_found" });

		const receipts = await testPool.query<{
			count: number;
			tenant_id: string;
		}>(
			`SELECT tenant_id, count(*)::int AS count
			 FROM inventory_command_receipt
			 WHERE operation = 'inventory.offline.apply' AND idempotency_key = $1
			 GROUP BY tenant_id ORDER BY tenant_id`,
			[commandId]
		);
		expect(receipts.rows).toEqual([
			{ count: 1, tenant_id: tenantA },
			{ count: 1, tenant_id: tenantB },
		]);
	});

	test("measures Adjustment posting and current availability visibility with retained samples", async () => {
		const inventory = service();
		const tenantId = "tenant_ws2_adjustment_metrics";
		const postingDurations: number[] = [];
		const availabilityDurations: number[] = [];
		for (let index = 0; index < 20; index += 1) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential samples model one representative operator without pool fan-out.
			const adjustment = await inventory.createAdjustment({
				actorUserId: `metrics_maker_${index}`,
				body: {
					locationId: `metrics_location_${index}`,
					productId: `metrics_product_${index}`,
					quantity: "1",
					reason: "closeout latency sample",
					unit: "each",
				},
				correlationId: `metrics_correlation_${index}`,
				idempotencyKey: `metrics_create_${index}`,
				organizationId: "organization_ws2_metrics",
				tenantId,
			});
			const postingStartedAt = performance.now();
			await inventory.approveAdjustment({
				actorUserId: `metrics_approver_${index}`,
				adjustmentId: adjustment.id,
				correlationId: `metrics_correlation_${index}`,
				idempotencyKey: `metrics_approve_${index}`,
				tenantId,
				version: 1,
			});
			postingDurations.push(performance.now() - postingStartedAt);
			const committedAt = performance.now();
			const page = await inventory.listBalances({
				filters: { locationId: `metrics_location_${index}` },
				page: { limit: 1 },
				tenantId,
			});
			availabilityDurations.push(performance.now() - committedAt);
			expect(page.items[0]?.onHand).toBe("1.000000");
		}
		const posting = metrics(postingDurations);
		const availability = metrics(availabilityDurations);
		expect(posting.sampleSize).toBe(20);
		expect(posting.p95).toBeLessThanOrEqual(750);
		expect(availability.sampleSize).toBe(20);
		expect(availability.p95).toBeLessThanOrEqual(5000);
		reportMetric(
			"inventory-adjustment-posting",
			postingDurations,
			"service-to-owner-transaction timing; excludes browser and network latency"
		);
		reportMetric(
			"inventory-availability-post-commit-read",
			availabilityDurations,
			"projection is updated in the owner transaction; measures visibility through a fresh repository read"
		);
	});

	test("measures a server-side Count entry command/read proxy without claiming the UX scan budget", async () => {
		const inventory = service();
		const tenantId = "tenant_ws2_count_metrics";
		const durations: number[] = [];
		for (let index = 0; index < 12; index += 1) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential samples model one representative counter.
			const count = await inventory.createCount({
				actorUserId: `count_actor_${index}`,
				body: { blind: true, locationId: `count_location_${index}` },
				idempotencyKey: `count_create_${index}`,
				organizationId: "organization_ws2_count_metrics",
				tenantId,
			});
			const startedAt = performance.now();
			await inventory.saveCountDraft({
				actorUserId: `count_actor_${index}`,
				body: {
					lines: [
						{
							observedQuantity: "1",
							productId: `count_product_${index}`,
							unit: "each",
						},
					],
				},
				countId: count.id,
				idempotencyKey: `count_save_${index}`,
				tenantId,
				version: 1,
			});
			const loaded = await inventory.getCount(tenantId, count.id);
			durations.push(performance.now() - startedAt);
			expect(loaded.lines).toHaveLength(1);
		}
		const result = metrics(durations);
		expect(result.sampleSize).toBe(12);
		expect(result.p50).toBeLessThanOrEqual(5000);
		reportMetric(
			"inventory-count-entry-command-read-proxy",
			durations,
			"not a browser, scanner, or human interaction measurement; does not close the 5 second median scan-interaction target"
		);
	});
});
