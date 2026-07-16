import { describe, expect, test } from "bun:test";
import type {
	ClaimedOutboxEvent,
	DeadLetterRecord,
	DeliveryStorePort,
} from "./delivery";
import {
	calculateRetryDelayMs,
	createEventConsumerRegistry,
	DeliveryConsumerError,
	decideDeliveryFailure,
	processClaimedEvent,
	WS2_DELIVERY_POLICY,
} from "./delivery";

const clock = { now: () => new Date("2026-07-15T12:00:00.000Z") };

describe("WS2 delivery policy", () => {
	test("uses deterministic injected full jitter and caps exponential retry", () => {
		expect(calculateRetryDelayMs(1, { next: () => 0.5 })).toBe(500);
		expect(calculateRetryDelayMs(2, { next: () => 0.5 })).toBe(1000);
		expect(calculateRetryDelayMs(20, { next: () => 1 })).toBe(
			WS2_DELIVERY_POLICY.maxRetryMs
		);
	});

	test("stops at the attempt limit and at the 24-hour retry horizon", () => {
		expect(
			decideDeliveryFailure(
				{
					attemptCount: 20,
					firstAttemptedAt: "2026-07-15T11:59:00.000Z",
				},
				clock,
				{ next: () => 0 }
			)
		).toEqual({ kind: "terminal", reason: "attempt_limit" });
		expect(
			decideDeliveryFailure(
				{
					attemptCount: 2,
					firstAttemptedAt: "2026-07-14T12:00:00.000Z",
				},
				clock,
				{ next: () => 0 }
			)
		).toEqual({ kind: "terminal", reason: "retry_horizon" });
	});

	test("registers consumers by stable id and schema version", () => {
		const consumer = {
			consume: () => Promise.resolve(),
			eventNames: ["catalog.product.created.v1"],
			id: "catalog-search-projection",
			schemaVersion: "1.0.0",
		};
		const registry = createEventConsumerRegistry([consumer]);
		expect(registry.consumersFor("catalog.product.created.v1")).toEqual([
			consumer,
		]);
		expect(registry.find(consumer.id, consumer.schemaVersion)).toBe(consumer);
		expect(() => createEventConsumerRegistry([consumer, consumer])).toThrow(
			"duplicate event consumer identity"
		);
	});
});

function claimed(attemptCount = 1): ClaimedOutboxEvent {
	return {
		attemptCount,
		claimToken: "opaque-claim-token",
		deliverySequence: "42",
		event: {
			aggregateId: "product_delivery_test",
			classification: "Confidential",
			data: { secretProductText: "must-not-enter-dead-letter-summary" },
			id: "event_delivery_test",
			name: "catalog.product.created.v1",
			occurredAt: "2026-07-15T11:59:00.000Z",
			producerNamespace: "catalog",
			retentionClass: "transaction-operational",
			schemaRef: "schemas/events/catalog.product.created.v1.schema.json",
			schemaVersion: "1.0.0",
			scopeType: "Tenant",
			tenantId: "tenant_delivery_test",
		},
		firstAttemptedAt: "2026-07-15T11:59:00.000Z",
	};
}

function memoryStore() {
	const receipts = new Set<string>();
	const deadLetters: DeadLetterRecord[] = [];
	let delivered = false;
	let retryAt: string | undefined;
	const key = (consumerId: string, eventId: string, version: string) =>
		`${consumerId}:${eventId}:${version}`;
	const store: DeliveryStorePort = {
		claimNext: () => Promise.resolve(undefined),
		hasReceipt: ({ consumerId, consumerSchemaVersion, eventId }) =>
			Promise.resolve(
				receipts.has(key(consumerId, eventId, consumerSchemaVersion))
			),
		markDeadLettered: () => Promise.resolve(true),
		markDelivered: () => {
			delivered = true;
			return Promise.resolve(true);
		},
		recordAttempt: () => Promise.resolve(),
		recordDeadLetter: (record) => {
			deadLetters.push(record);
			return Promise.resolve("inserted");
		},
		recordReceipt: ({ consumerId, consumerSchemaVersion, eventId }) => {
			const receiptKey = key(consumerId, eventId, consumerSchemaVersion);
			const duplicate = receipts.has(receiptKey);
			receipts.add(receiptKey);
			return Promise.resolve(duplicate ? "duplicate" : "inserted");
		},
		releaseForRetry: ({ nextAttemptAt }) => {
			retryAt = nextAttemptAt;
			return Promise.resolve(true);
		},
		renewClaim: () => Promise.resolve(true),
	};
	return {
		deadLetters,
		get delivered() {
			return delivered;
		},
		get retryAt() {
			return retryAt;
		},
		store,
	};
}

describe("Event Backbone consumer processing", () => {
	test("keeps sibling success receipts while one consumer retries", async () => {
		const memory = memoryStore();
		let catalogCalls = 0;
		let inventoryCalls = 0;
		const catalog = {
			consume: () => {
				catalogCalls += 1;
				return Promise.resolve();
			},
			eventNames: ["catalog.product.created.v1"],
			id: "catalog-search-projection",
			schemaVersion: "1.0.0",
		};
		const inventory = {
			consume: () => {
				inventoryCalls += 1;
				return inventoryCalls === 1
					? Promise.reject(
							new DeliveryConsumerError("database_unavailable", true)
						)
					: Promise.resolve();
			},
			eventNames: ["catalog.product.created.v1"],
			id: "inventory-availability-reconciliation",
			schemaVersion: "1.0.0",
		};
		const dependencies = {
			clock,
			idFactory: () => crypto.randomUUID(),
			jitter: { next: () => 0.5 },
			registry: createEventConsumerRegistry([catalog, inventory]),
			store: memory.store,
		};
		expect(await processClaimedEvent(claimed(1), dependencies)).toBe(
			"retry_scheduled"
		);
		expect(memory.retryAt).toBeDefined();
		expect(await processClaimedEvent(claimed(2), dependencies)).toBe(
			"delivered"
		);
		expect(catalogCalls).toBe(1);
		expect(inventoryCalls).toBe(2);
		expect(memory.delivered).toBe(true);
	});

	test("dead-letters only a minimized envelope summary", async () => {
		const memory = memoryStore();
		const registry = createEventConsumerRegistry([
			{
				consume: () =>
					Promise.reject(
						new DeliveryConsumerError("schema_incompatible", false)
					),
				eventNames: ["catalog.product.created.v1"],
				id: "catalog-search-projection",
				schemaVersion: "1.0.0",
			},
		]);
		expect(
			await processClaimedEvent(claimed(), {
				clock,
				idFactory: () => crypto.randomUUID(),
				jitter: { next: () => 0.5 },
				registry,
				store: memory.store,
			})
		).toBe("dead_lettered");
		expect(memory.deadLetters).toHaveLength(1);
		expect(memory.deadLetters[0]?.envelopeSummary).not.toHaveProperty("data");
		expect(JSON.stringify(memory.deadLetters)).not.toContain(
			"must-not-enter-dead-letter-summary"
		);
	});
});
