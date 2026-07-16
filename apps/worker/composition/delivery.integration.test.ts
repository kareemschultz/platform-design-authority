import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import type { OutboxEvent } from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

const databaseName = `meridian_events_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(workerEnv.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(workerEnv.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let firstWorkerPool: Pool;
let secondWorkerPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function event(id: string, aggregateId: string, tenantId = "tenant_events_a") {
	return {
		aggregateId,
		classification: "Internal",
		data: { productId: aggregateId },
		id,
		name: "catalog.product.created.v1",
		occurredAt: "2026-07-15T12:00:00.000Z",
		producerNamespace: "catalog",
		retentionClass: "transaction-operational",
		schemaRef: "schemas/events/catalog.product.created.v1.schema.json",
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		tenantId,
	} satisfies OutboxEvent;
}

async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
	} catch (error) {
		return error;
	}
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	firstWorkerPool = new Pool({ connectionString: testUrl.toString(), max: 5 });
	secondWorkerPool = new Pool({ connectionString: testUrl.toString(), max: 5 });
	await migratePlatformEvents(firstWorkerPool);
});

afterAll(async () => {
	await firstWorkerPool.end();
	await secondWorkerPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("Event Backbone PostgreSQL delivery", () => {
	test("repeats the owner migration without drift", async () => {
		await migratePlatformEvents(firstWorkerPool);
		const tables = await firstWorkerPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'platform_event_%' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"platform_event_consumer_receipt",
			"platform_event_dead_letter",
			"platform_event_delivery_attempt",
			"platform_event_outbox",
			"platform_event_replay_request",
		]);
	});

	test("prevents a later sequence overtaking an earlier nonterminal stream row", async () => {
		const outbox = createPostgresOutbox(firstWorkerPool);
		await outbox.append(event("event_order_1", "product_order"));
		await outbox.append(event("event_order_2", "product_order"));
		const firstStore = createPostgresDeliveryStore(firstWorkerPool);
		const secondStore = createPostgresDeliveryStore(secondWorkerPool);
		const first = await firstStore.claimNext({
			claimToken: "claim-order-first",
			leaseExpiresAt: "2100-07-15T12:00:30.000Z",
			now: "2100-07-15T12:00:00.000Z",
		});
		expect(first?.event.id).toBe("event_order_1");
		expect(
			await secondStore.claimNext({
				claimToken: "claim-order-second",
				leaseExpiresAt: "2100-07-15T12:00:30.000Z",
				now: "2100-07-15T12:00:00.000Z",
			})
		).toBeUndefined();
		expect(
			await firstStore.markDelivered({
				claimToken: "claim-order-first",
				eventId: "event_order_1",
				publishedAt: "2100-07-15T12:00:01.000Z",
			})
		).toBe(true);
		const second = await secondStore.claimNext({
			claimToken: "claim-order-second",
			leaseExpiresAt: "2100-07-15T12:00:31.000Z",
			now: "2100-07-15T12:00:01.000Z",
		});
		expect(second?.event.id).toBe("event_order_2");
		expect(
			await secondStore.markDelivered({
				claimToken: "claim-order-second",
				eventId: "event_order_2",
				publishedAt: "2100-07-15T12:00:02.000Z",
			})
		).toBe(true);
	});

	test("claims distinct streams concurrently across two workers", async () => {
		const outbox = createPostgresOutbox(firstWorkerPool);
		await outbox.append(event("event_concurrent_a", "product_concurrent_a"));
		await outbox.append(event("event_concurrent_b", "product_concurrent_b"));
		const [left, right] = await Promise.all([
			createPostgresDeliveryStore(firstWorkerPool).claimNext({
				claimToken: "claim-concurrent-left",
				leaseExpiresAt: "2100-07-15T12:01:30.000Z",
				now: "2100-07-15T12:01:00.000Z",
			}),
			createPostgresDeliveryStore(secondWorkerPool).claimNext({
				claimToken: "claim-concurrent-right",
				leaseExpiresAt: "2100-07-15T12:01:30.000Z",
				now: "2100-07-15T12:01:00.000Z",
			}),
		]);
		expect(new Set([left?.event.id, right?.event.id])).toEqual(
			new Set(["event_concurrent_a", "event_concurrent_b"])
		);
		if (!(left && right)) {
			throw new Error("both workers must claim one event");
		}
		expect(
			await createPostgresDeliveryStore(firstWorkerPool).markDelivered({
				claimToken: "claim-concurrent-left",
				eventId: left.event.id,
				publishedAt: "2100-07-15T12:01:01.000Z",
			})
		).toBe(true);
		expect(
			await createPostgresDeliveryStore(secondWorkerPool).markDelivered({
				claimToken: "claim-concurrent-right",
				eventId: right.event.id,
				publishedAt: "2100-07-15T12:01:01.000Z",
			})
		).toBe(true);
	});

	test("recovers an expired lease and rejects the stale claim token", async () => {
		const outbox = createPostgresOutbox(firstWorkerPool);
		await outbox.append(event("event_recovery", "product_recovery"));
		const firstStore = createPostgresDeliveryStore(firstWorkerPool);
		const secondStore = createPostgresDeliveryStore(secondWorkerPool);
		await firstStore.claimNext({
			claimToken: "claim-recovery-stale",
			leaseExpiresAt: "2100-07-15T12:02:30.000Z",
			now: "2100-07-15T12:02:00.000Z",
		});
		const recovered = await secondStore.claimNext({
			claimToken: "claim-recovery-current",
			leaseExpiresAt: "2100-07-15T12:03:31.000Z",
			now: "2100-07-15T12:03:01.000Z",
		});
		expect(recovered?.event.id).toBe("event_recovery");
		expect(
			await firstStore.releaseForRetry({
				claimToken: "claim-recovery-stale",
				eventId: "event_recovery",
				nextAttemptAt: "2100-07-15T12:04:00.000Z",
				reasonCode: "stale_worker",
			})
		).toBe(false);
	});

	test("deduplicates consumer receipts and rejects a cross-tenant receipt", async () => {
		const store = createPostgresDeliveryStore(firstWorkerPool);
		const receipt = {
			consumerId: "catalog-search-projection",
			consumerSchemaVersion: "1.0.0",
			eventId: "event_recovery",
			processedAt: "2100-07-15T12:03:02.000Z",
			resultCode: "processed",
			tenantId: "tenant_events_a",
		};
		expect(await store.recordReceipt(receipt)).toBe("inserted");
		expect(await store.recordReceipt(receipt)).toBe("duplicate");
		const error = await captureError(
			store.recordReceipt({
				...receipt,
				consumerId: "foreign-tenant-consumer",
				tenantId: "tenant_events_b",
			})
		);
		expect((error as { code?: string }).code).toBe("23503");
	});
});
