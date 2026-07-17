import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createCatalogSearchProjectionAdapter,
	migrateCatalog,
} from "@meridian/persistence-catalog-postgres";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	CATALOG_SEARCH_CONSUMER,
	createEventConsumerRegistry,
	type OutboxEvent,
	processClaimedEvent,
} from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

const databaseName = `meridian_ws2_delivery_metrics_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(workerEnv.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(workerEnv.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function percentile(samples: readonly number[], quantile: number): number {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? 0;
}

function metricSummary(samples: readonly number[]) {
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
				"isolated local PostgreSQL 18 database; one in-process worker",
			limitation,
			metric: name,
			unit: "milliseconds",
			...metricSummary(samples),
		})}\n`
	);
}

function productCreatedEvent(
	id: string,
	productId: string,
	tenantId: string
): OutboxEvent {
	return {
		aggregateId: productId,
		classification: "Confidential",
		data: { productId },
		id,
		name: "catalog.product.created.v1",
		occurredAt: new Date().toISOString(),
		producerNamespace: "catalog",
		retentionClass: "transaction-operational",
		schemaRef: "schemas/events/catalog.product.created.v1.schema.json",
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		tenantId,
	};
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 5 });
	await migratePlatformEvents(testPool);
	await migrateCatalog(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("WS2 Event Backbone closeout measurements", () => {
	test("retains end-to-end delivery and Catalog projection samples without overclaiming reliability", async () => {
		const store = createPostgresDeliveryStore(testPool);
		const outbox = createPostgresOutbox(testPool);
		const projection = createCatalogSearchProjectionAdapter(testPool);
		const registry = createEventConsumerRegistry([
			{
				...CATALOG_SEARCH_CONSUMER,
				async consume(event) {
					if (!event.tenantId) {
						throw new Error("tenant scope required");
					}
					const { productId } = event.data;
					if (typeof productId !== "string") {
						throw new Error("product id required");
					}
					await projection.rebuildProduct({
						eventId: event.id,
						productId,
						projectedAt: new Date().toISOString(),
						tenantId: event.tenantId,
					});
				},
			},
		]);
		const deliveryDurations: number[] = [];
		const projectionDurations: number[] = [];
		for (let index = 0; index < 20; index += 1) {
			const tenantId =
				index % 2 === 0 ? "tenant_ws2_delivery_a" : "tenant_ws2_delivery_b";
			const productId = `product_ws2_delivery_${index}`;
			const eventId = `event_ws2_delivery_${index}`;
			// biome-ignore lint/performance/noAwaitInLoops: fixtures are committed before each measured delivery cycle.
			await testPool.query(
				`INSERT INTO catalog_product
				 (id, tenant_id, organization_id, name, state, classification, version)
				 VALUES ($1,$2,$3,$4,'Active','Confidential',1)`,
				[
					productId,
					tenantId,
					"organization_ws2_delivery",
					`Delivery Product ${index}`,
				]
			);
			const startedAt = performance.now();
			await outbox.append(productCreatedEvent(eventId, productId, tenantId));
			// Eligibility is persisted from the database clock; use that same authority
			// so container clock skew cannot turn a delivery measurement into a retry.
			const clock = await testPool.query<{ now: Date }>(
				"SELECT clock_timestamp() AS now"
			);
			const now = clock.rows[0]?.now;
			if (!now) {
				throw new Error("database clock did not return an instant");
			}
			const claim = await store.claimNext({
				claimToken: `claim_ws2_delivery_${index}`,
				leaseExpiresAt: new Date(now.getTime() + 30_000).toISOString(),
				now: now.toISOString(),
			});
			expect(claim?.event.id).toBe(eventId);
			if (!claim) {
				throw new Error("closeout event was not claimed");
			}
			expect(
				await processClaimedEvent(claim, {
					clock: { now: () => new Date() },
					idFactory: () => crypto.randomUUID(),
					jitter: { next: () => 0.5 },
					registry,
					store,
				})
			).toBe("delivered");
			deliveryDurations.push(performance.now() - startedAt);
			const deliveredAt = performance.now();
			const projected = await testPool.query<{ tenant_id: string }>(
				"SELECT tenant_id FROM catalog_product_search_projection WHERE tenant_id = $1 AND product_id = $2",
				[tenantId, productId]
			);
			projectionDurations.push(performance.now() - deliveredAt);
			expect(projected.rows).toEqual([{ tenant_id: tenantId }]);
			const otherTenant =
				tenantId === "tenant_ws2_delivery_a"
					? "tenant_ws2_delivery_b"
					: "tenant_ws2_delivery_a";
			expect(
				await testPool.query(
					"SELECT 1 FROM catalog_product_search_projection WHERE tenant_id = $1 AND product_id = $2",
					[otherTenant, productId]
				)
			).toHaveProperty("rowCount", 0);
		}

		const delivery = metricSummary(deliveryDurations);
		const searchProjection = metricSummary(projectionDurations);
		expect(delivery.sampleSize).toBe(20);
		expect(searchProjection.sampleSize).toBe(20);
		expect(searchProjection.p95).toBeLessThanOrEqual(60_000);
		expect(
			await testPool.query(
				"SELECT count(*)::int AS count FROM platform_event_outbox WHERE id LIKE 'event_ws2_delivery_%' AND status = 'delivered'"
			)
		).toHaveProperty("rows.0.count", 20);
		reportMetric(
			"event-append-to-delivery-and-consumption",
			deliveryDurations,
			"20 successful local samples cannot substantiate the 99.99% retry-horizon reliability target"
		);
		reportMetric(
			"catalog-search-projection-post-delivery-read",
			projectionDurations,
			"consumer updates the projection before delivery completion; measures visibility through a fresh SQL read"
		);
	});
});
