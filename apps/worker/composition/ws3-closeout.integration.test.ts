import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	CATALOG_SEARCH_CONSUMER,
	createEventConsumerRegistry,
	INVENTORY_RECONCILIATION_CONSUMER,
	type OutboxEvent,
	processClaimedEvent,
} from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

/**
 * WS3 PR6 item 4's worker replay-safety lane: its own SEPARATE isolated
 * database (the operational landmine from the fifth audit — the worker
 * guard checks outbox `count==0` at start, so this file never points at
 * `apps/server/composition/ws3-closeout.integration.test.ts`'s database).
 *
 * The frozen control plan §7/§10.4 and `apps/server/composition/pos.ts`'s
 * real wiring establish that WS3 PR2/PR3's stock movement is SYNCHRONOUS,
 * inside the sale/return's own transaction via `SaleInventoryMovementPort`/
 * `ReturnInventoryMovementPort` calling Inventory's application command
 * directly — never a worker-consumed event. PR6 item 4's conditional ("if
 * PR2 chose event-consumer stock movement, prove replay safety") is
 * therefore NOT met on this branch; there is no worker-side stock-movement
 * consumer that could double-move stock from a duplicate delivery, so that
 * specific proof obligation does not apply. What this file proves instead,
 * turning that N/A into positive evidence rather than a silent gap: WS3's
 * `commerce.*` events land in the SAME shared outbox/delivery pipeline
 * WS2's worker already owns, using the SAME registered-consumer registry
 * (`CATALOG_SEARCH_CONSUMER`, `INVENTORY_RECONCILIATION_CONSUMER` — no
 * commerce-named consumer exists), and the delivery pipeline's documented
 * `no_consumers` disposition (`processClaimedEvent` marks the row
 * `delivered` with zero consumer executions) handles that correctly and
 * exactly once — so even if a duplicate `commerce.sale.completed.v1`
 * delivery occurred, there is no consumer path left to double-move
 * anything. `packages/platform/events/src/delivery.ts`'s `no_consumers`
 * branch had no executable test anywhere in the repository before this
 * file (verified by repository-wide search for `no_consumers` inside a
 * `*.test.ts` file).
 */
const databaseName = `meridian_ws3_worker_closeout_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(workerEnv.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(workerEnv.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

/** Mirrors `apps/server/composition/pos.ts`'s real `commerce.sale.
 * completed.v1` envelope shape closely enough to exercise the delivery
 * pipeline's routing decision — this file never asserts business/stock
 * semantics, only delivery-pipeline behavior, so a representative envelope
 * is sufficient. */
function saleCompletedEvent(id: string, saleId: string): OutboxEvent {
	return {
		aggregateId: saleId,
		classification: "Confidential",
		data: { registerId: "register_ws3_worker_closeout", saleId },
		id,
		name: "commerce.sale.completed.v1",
		occurredAt: "2026-07-18T12:00:00.000Z",
		producerNamespace: "commerce",
		retentionClass: "transaction-operational",
		schemaRef: "schemas/events/commerce.sale.completed.v1.schema.json",
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		tenantId: "tenant_ws3_worker_closeout",
	} satisfies OutboxEvent;
}

/** Rebuilds the SAME registry `apps/worker/composition/delivery.ts` wires
 * in production (WS2's two registered consumers, no commerce-named
 * consumer) — mirrors `delivery.integration.test.ts`'s own isolated-pool
 * rebuild discipline rather than importing `./delivery`, which would bind
 * to the shared dev pool as an import side effect. Both stub consumers
 * below are intentionally never invoked by this file's fixtures (a
 * `commerce.*` event name never matches either consumer's registered
 * `eventNames`); the rejecting `consume` bodies exist only to fail loudly
 * if that ever stops being true. */
function registryUnderTest() {
	return createEventConsumerRegistry([
		{
			...CATALOG_SEARCH_CONSUMER,
			consume: () =>
				Promise.reject(
					new Error(
						"CATALOG_SEARCH_CONSUMER must never claim a commerce.* event"
					)
				),
		},
		{
			...INVENTORY_RECONCILIATION_CONSUMER,
			consume: () =>
				Promise.reject(
					new Error(
						"INVENTORY_RECONCILIATION_CONSUMER must never claim a commerce.* event"
					)
				),
		},
	]);
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 5 });
	// Requires ONLY platform-events; WS3's outbox rows never depend on
	// pos-postgres, inventory-postgres, or catalog-postgres tables existing
	// in the SAME database — the outbox is Event-Backbone-owned.
	await migratePlatformEvents(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial(
	"WS3 PR6 closeout: commerce.* event delivery with no registered worker consumer",
	() => {
		test("a commerce.sale.completed.v1 event with no registered consumer is marked delivered exactly once via the no_consumers disposition, proving no worker-side stock-movement path exists to double-move anything on redelivery", async () => {
			const outbox = createPostgresOutbox(testPool);
			const store = createPostgresDeliveryStore(testPool);
			const registry = registryUnderTest();

			await outbox.append(
				saleCompletedEvent("event_ws3_worker_no_consumer", "sale_ws3_worker_1")
			);

			const claim = await store.claimNext({
				claimToken: "claim-ws3-worker-no-consumer",
				leaseExpiresAt: "2100-07-18T12:00:30.000Z",
				now: "2100-07-18T12:00:00.000Z",
			});
			if (!claim) {
				throw new Error("expected the appended commerce event to be claimable");
			}
			expect(claim.event.name).toBe("commerce.sale.completed.v1");

			const result = await processClaimedEvent(claim, {
				clock: { now: () => new Date("2100-07-18T12:00:01.000Z") },
				idFactory: () => "attempt_ws3_worker_no_consumer",
				jitter: { next: () => 0 },
				registry,
				store,
			});
			expect(result).toBe("no_consumers");

			const statusRows = await testPool.query<{ status: string }>(
				"SELECT status FROM platform_event_outbox WHERE id = $1",
				["event_ws3_worker_no_consumer"]
			);
			expect(statusRows.rows[0]?.status).toBe("delivered");

			// No consumer receipt was ever recorded — there was nothing to
			// deduplicate because there was no consumer to execute.
			const receiptRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM platform_event_consumer_receipt WHERE event_id = $1",
				["event_ws3_worker_no_consumer"]
			);
			expect(receiptRows.rows[0]?.count).toBe("0");

			// A second claim attempt against the now-`delivered` row finds
			// nothing left to claim — replay of a delivered event is a no-op at
			// the store layer, not a second execution.
			const secondClaim = await store.claimNext({
				claimToken: "claim-ws3-worker-no-consumer-second",
				leaseExpiresAt: "2100-07-18T12:00:31.000Z",
				now: "2100-07-18T12:00:02.000Z",
			});
			expect(secondClaim).toBeUndefined();
		});

		test("duplicate commerce.sale.completed.v1 delivery (two separately-appended rows for a retried publish) both resolve no_consumers with zero consumer executions and zero duplicate business effects, since no worker consumer path exists to duplicate", async () => {
			const outbox = createPostgresOutbox(testPool);
			const store = createPostgresDeliveryStore(testPool);
			const registry = registryUnderTest();

			await outbox.append(
				saleCompletedEvent("event_ws3_worker_dup_1", "sale_ws3_worker_2")
			);
			await outbox.append(
				saleCompletedEvent("event_ws3_worker_dup_2", "sale_ws3_worker_2")
			);

			const results: string[] = [];
			for (const claimToken of ["claim-ws3-dup-1", "claim-ws3-dup-2"]) {
				// biome-ignore lint/performance/noAwaitInLoops: two sequential claims against a two-row fixture, not a hot loop.
				const claim = await store.claimNext({
					claimToken,
					leaseExpiresAt: "2100-07-18T12:01:30.000Z",
					now: "2100-07-18T12:01:00.000Z",
				});
				if (!claim) {
					throw new Error("expected both duplicate rows to be claimable");
				}
				const result = await processClaimedEvent(claim, {
					clock: { now: () => new Date("2100-07-18T12:01:01.000Z") },
					idFactory: () => `attempt_${claimToken}`,
					jitter: { next: () => 0 },
					registry,
					store,
				});
				results.push(result);
			}

			expect(results).toEqual(["no_consumers", "no_consumers"]);
			const deliveredRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM platform_event_outbox WHERE id = ANY($1) AND status = 'delivered'",
				[["event_ws3_worker_dup_1", "event_ws3_worker_dup_2"]]
			);
			expect(deliveredRows.rows[0]?.count).toBe("2");
			const receiptRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM platform_event_consumer_receipt WHERE event_id = ANY($1)",
				[["event_ws3_worker_dup_1", "event_ws3_worker_dup_2"]]
			);
			expect(receiptRows.rows[0]?.count).toBe("0");
		});
	}
);
