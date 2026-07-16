import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createCatalogSearchProjectionAdapter,
	migrateCatalog,
} from "@meridian/persistence-catalog-postgres";
import {
	createInventoryReconciliationAdapter,
	migrateInventory,
} from "@meridian/persistence-inventory-postgres";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
	createPostgresReplayExecutionStore,
	createPostgresReplayStore,
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
	await migrateCatalog(firstWorkerPool);
	await migrateInventory(firstWorkerPool);
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

	test("pauses one tenant without blocking another and resumes after configuration recovery", async () => {
		const outbox = createPostgresOutbox(firstWorkerPool);
		await outbox.append(
			event("event_pause_tenant", "product_pause", "tenant_events_paused")
		);
		await outbox.append(
			event("event_active_tenant", "product_active", "tenant_events_active")
		);
		const store = createPostgresDeliveryStore(firstWorkerPool);
		const active = await store.claimNext({
			claimToken: "claim-active-tenant",
			leaseExpiresAt: "2100-07-15T12:01:40.000Z",
			now: "2100-07-15T12:01:10.000Z",
			pausedTenantIds: ["tenant_events_paused"],
		});
		expect(active?.event.id).toBe("event_active_tenant");
		if (!active) {
			throw new Error("active tenant event must remain claimable");
		}
		await store.markDelivered({
			claimToken: "claim-active-tenant",
			eventId: active.event.id,
			publishedAt: "2100-07-15T12:01:11.000Z",
		});
		const resumed = await store.claimNext({
			claimToken: "claim-resumed-tenant",
			leaseExpiresAt: "2100-07-15T12:01:42.000Z",
			now: "2100-07-15T12:01:12.000Z",
			pausedTenantIds: [],
		});
		expect(resumed?.event.id).toBe("event_pause_tenant");
		if (!resumed) {
			throw new Error("resumed tenant event must become claimable");
		}
		await store.markDelivered({
			claimToken: "claim-resumed-tenant",
			eventId: resumed.event.id,
			publishedAt: "2100-07-15T12:01:13.000Z",
		});
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
		expect(
			await firstStore.renewClaim({
				claimToken: "claim-recovery-stale",
				eventId: "event_recovery",
				leaseExpiresAt: "2100-07-15T12:02:45.000Z",
				now: "2100-07-15T12:02:10.000Z",
			})
		).toBe(true);
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
		expect(
			await firstStore.renewClaim({
				claimToken: "claim-recovery-stale",
				eventId: "event_recovery",
				leaseExpiresAt: "2100-07-15T12:04:00.000Z",
				now: "2100-07-15T12:03:02.000Z",
			})
		).toBe(false);
		expect(
			await secondStore.markDelivered({
				claimToken: "claim-recovery-current",
				eventId: "event_recovery",
				publishedAt: "2100-07-15T12:03:02.000Z",
			})
		).toBe(true);
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

	test("reports safe aggregate delivery health without tenant or payload labels", async () => {
		const snapshot = await createPostgresDeliveryStore(
			firstWorkerPool
		).getHealthSnapshot("2100-07-15T12:04:00.000Z");
		expect(snapshot.claimed).toBe(0);
		expect(snapshot.deliveredLastHour).toBeGreaterThanOrEqual(4);
		expect(snapshot.oldestEligibleAgeMs).toBeGreaterThanOrEqual(0);
		expect(Object.keys(snapshot).sort()).toEqual([
			"attemptsLastHour",
			"claimed",
			"deadLettered",
			"deliveredLastHour",
			"failuresLastHour",
			"oldestEligibleAgeMs",
			"pending",
			"retrying",
		]);
	});

	test("creates a tenant-scoped replay request and executes only its bounded range", async () => {
		const sequence = await firstWorkerPool.query<{ delivery_sequence: string }>(
			"SELECT delivery_sequence::text FROM platform_event_outbox WHERE id = $1",
			["event_recovery"]
		);
		const deliverySequence = sequence.rows[0]?.delivery_sequence;
		if (!deliverySequence) {
			throw new Error("replay source sequence missing");
		}
		const requestStore = createPostgresReplayStore(firstWorkerPool);
		const stored = await requestStore.createRequest({
			approvedBy: "user_replay_integration_0001",
			auditRecordId: "audit_replay_integration_0001",
			compatibilityResult: "compatible",
			consumerId: "catalog-search-projection",
			consumerSchemaVersion: "1.0.0",
			eventNames: ["catalog.product.created.v1"],
			firstSequence: deliverySequence,
			id: "event_replay_integration_0001",
			idempotencyKey: "replay-integration-key-0001",
			lastSequence: deliverySequence,
			permissionDecisionId: "decision_replay_integration_0001",
			purpose: "Verify bounded replay execution.",
			requestedAt: "2100-07-15T12:05:00.000Z",
			requestedBy: "user_replay_integration_0001",
			state: "queued",
			tenantId: "tenant_events_a",
		});
		expect(stored.id).toBe("event_replay_integration_0001");
		expect(
			(
				await requestStore.createRequest({
					...stored,
					state: "queued",
				})
			).id
		).toBe(stored.id);
		const conflict = await captureError(
			requestStore.createRequest({
				...stored,
				purpose: "A conflicting purpose must not reuse the key.",
				state: "queued",
			})
		);
		expect(conflict).toMatchObject({ code: "idempotency_conflict" });
		const foreignInspection = await requestStore.inspectRange({
			eventNames: ["catalog.product.created.v1"],
			firstSequence: deliverySequence,
			lastSequence: deliverySequence,
			tenantId: "tenant_events_b",
		});
		expect(foreignInspection).toEqual({
			count: 0,
			eventNames: [],
			eventSchemaVersions: [],
			retentionClasses: [],
		});
		const execution = createPostgresReplayExecutionStore(firstWorkerPool);
		const claimed = await execution.claimNext({
			reclaimBefore: "2100-07-15T11:50:01.000Z",
			startedAt: "2100-07-15T12:05:01.000Z",
		});
		expect(claimed?.id).toBe("event_replay_integration_0001");
		if (!claimed) {
			throw new Error("replay request was not claimable");
		}
		const replayEvents = await execution.loadEvents(claimed);
		expect(replayEvents.map((item) => item.id)).toEqual(["event_recovery"]);
		await execution.complete({
			completedAt: "2100-07-15T12:05:02.000Z",
			id: claimed.id,
		});
		const state = await firstWorkerPool.query<{ state: string }>(
			"SELECT state FROM platform_event_replay_request WHERE id = $1",
			[claimed.id]
		);
		expect(state.rows[0]?.state).toBe("completed");
		await firstWorkerPool.query(
			`UPDATE platform_event_replay_request
			 SET state = 'running', started_at = $2::timestamptz, completed_at = NULL
			 WHERE id = $1`,
			[claimed.id, "2100-07-15T11:00:00.000Z"]
		);
		const recoveredReplay = await execution.claimNext({
			reclaimBefore: "2100-07-15T11:50:00.000Z",
			startedAt: "2100-07-15T12:05:03.000Z",
		});
		expect(recoveredReplay?.id).toBe(claimed.id);
		if (!recoveredReplay) {
			throw new Error("stale running replay request was not recovered");
		}
		await execution.complete({
			completedAt: "2100-07-15T12:05:04.000Z",
			id: recoveredReplay.id,
		});
	});

	test("persists a minimized terminal dead letter and changes owner state atomically", async () => {
		const outbox = createPostgresOutbox(firstWorkerPool);
		await outbox.append(event("event_dead_letter", "product_dead_letter"));
		const store = createPostgresDeliveryStore(firstWorkerPool);
		const claim = await store.claimNext({
			claimToken: "claim-dead-letter",
			leaseExpiresAt: "2100-07-15T12:05:30.000Z",
			now: "2100-07-15T12:05:00.000Z",
		});
		expect(claim?.event.id).toBe("event_dead_letter");
		if (!claim) {
			throw new Error("terminal event was not claimable");
		}
		expect(
			await store.recordDeadLetter({
				attemptCount: claim.attemptCount,
				consumerId: "catalog-search-projection",
				consumerSchemaVersion: "1.0.0",
				deliverySequence: claim.deliverySequence,
				envelopeSummary: {
					id: claim.event.id,
					name: claim.event.name,
					schemaVersion: claim.event.schemaVersion,
				},
				eventId: claim.event.id,
				failureClassification: "consumer",
				firstAttemptedAt: claim.firstAttemptedAt,
				id: "dead_letter_integration_0001",
				lastAttemptedAt: "2100-07-15T12:05:01.000Z",
				retentionClass: claim.event.retentionClass,
				schemaRef: claim.event.schemaRef,
				tenantId: claim.event.tenantId ?? "",
				terminalReason: "attempt_limit",
			})
		).toBe("inserted");
		expect(
			await store.markDeadLettered({
				claimToken: claim.claimToken,
				eventId: claim.event.id,
				terminalReason: "consumer_terminal_failure",
			})
		).toBe(true);
		const persisted = await firstWorkerPool.query<{
			envelope_summary: Record<string, unknown>;
			status: string;
		}>(
			`SELECT dead_letter.envelope_summary, outbox.status
			 FROM platform_event_dead_letter AS dead_letter
			 JOIN platform_event_outbox AS outbox ON outbox.id = dead_letter.event_id
			 WHERE dead_letter.id = $1`,
			["dead_letter_integration_0001"]
		);
		expect(persisted.rows[0]?.status).toBe("dead_lettered");
		expect(persisted.rows[0]?.envelope_summary).not.toHaveProperty("data");
	});

	test("rebuilds Catalog search projection without crossing tenant scope", async () => {
		await firstWorkerPool.query(
			`INSERT INTO catalog_product
			 (id, tenant_id, organization_id, name, state, classification, version)
			 VALUES ($1,$2,$3,$4,'Active','Confidential',3)`,
			[
				"product_projection_0001",
				"tenant_events_a",
				"organization_events_0001",
				"Projection Product",
			]
		);
		const adapter = createCatalogSearchProjectionAdapter(firstWorkerPool);
		await adapter.rebuildProduct({
			eventId: "event_recovery",
			productId: "product_projection_0001",
			projectedAt: "2100-07-15T12:06:00.000Z",
			tenantId: "tenant_events_a",
		});
		const projection = await firstWorkerPool.query<{
			source_version: number;
			tenant_id: string;
		}>(
			"SELECT tenant_id, source_version FROM catalog_product_search_projection WHERE product_id = $1",
			["product_projection_0001"]
		);
		expect(projection.rows[0]).toEqual({
			source_version: 3,
			tenant_id: "tenant_events_a",
		});
		const foreignTenantError = await captureError(
			adapter.rebuildProduct({
				eventId: "event_recovery",
				productId: "product_projection_0001",
				projectedAt: "2100-07-15T12:06:01.000Z",
				tenantId: "tenant_events_b",
			})
		);
		expect(foreignTenantError).toMatchObject({
			code: "projection_source_unavailable",
		});
	});

	test("marks an Inventory balance for review when it diverges from ledger facts", async () => {
		await firstWorkerPool.query(
			`INSERT INTO inventory_stock_balance
			 (tenant_id, organization_id, location_id, product_id, item_key, unit,
			  on_hand, as_of, reconciliation_state, classification, version)
			 VALUES ($1,$2,$3,$4,$4,'Each',9,$5,'Current','Confidential',1)`,
			[
				"tenant_events_a",
				"organization_events_0001",
				"location_events_0001",
				"product_inventory_projection_0001",
				"2100-07-15T12:07:00.000Z",
			]
		);
		await firstWorkerPool.query(
			`INSERT INTO inventory_stock_movement
			 (id, tenant_id, organization_id, location_id, product_id, item_key, unit,
			  quantity, movement_type, source_type, source_id, actor_user_id,
			  correlation_id, occurred_at, classification)
			 VALUES ($1,$2,$3,$4,$5,$5,'Each',8,'Adjustment','Adjustment',$6,$7,$8,$9,'Confidential')`,
			[
				"movement_projection_0001",
				"tenant_events_a",
				"organization_events_0001",
				"location_events_0001",
				"product_inventory_projection_0001",
				"adjustment_projection_0001",
				"user_projection_0001",
				"correlation_projection_0001",
				"2100-07-15T12:07:00.000Z",
			]
		);
		await createInventoryReconciliationAdapter(firstWorkerPool).reconcileTenant(
			"tenant_events_a"
		);
		const state = await firstWorkerPool.query<{ reconciliation_state: string }>(
			"SELECT reconciliation_state FROM inventory_stock_balance WHERE tenant_id = $1 AND product_id = $2",
			["tenant_events_a", "product_inventory_projection_0001"]
		);
		expect(state.rows[0]?.reconciliation_state).toBe("RequiresReview");
		await firstWorkerPool.query(
			`INSERT INTO inventory_stock_movement
			 (id, tenant_id, organization_id, location_id, product_id, item_key, unit,
			  quantity, movement_type, source_type, source_id, actor_user_id,
			  correlation_id, occurred_at, classification)
			 VALUES ($1,$2,$3,$4,$5,$5,'Each',4,'Adjustment','Adjustment',$6,$7,$8,$9,'Confidential')`,
			[
				"movement_projection_missing_balance_0001",
				"tenant_events_a",
				"organization_events_0001",
				"location_events_0001",
				"product_inventory_projection_0002",
				"adjustment_projection_0002",
				"user_projection_0001",
				"correlation_projection_0002",
				"2100-07-15T12:07:01.000Z",
			]
		);
		await createInventoryReconciliationAdapter(firstWorkerPool).reconcileTenant(
			"tenant_events_a"
		);
		const rebuilt = await firstWorkerPool.query<{
			on_hand: string;
			reconciliation_state: string;
		}>(
			"SELECT on_hand::text, reconciliation_state FROM inventory_stock_balance WHERE tenant_id = $1 AND product_id = $2",
			["tenant_events_a", "product_inventory_projection_0002"]
		);
		expect(rebuilt.rows[0]).toEqual({
			on_hand: "4.000000",
			reconciliation_state: "Current",
		});
	});
});
