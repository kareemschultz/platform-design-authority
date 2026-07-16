import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import {
	eventConsumerReceipt,
	eventDeadLetter,
	eventDeliveryAttempt,
	eventOutbox,
	eventReplayRequest,
} from "./schema";

describe("Platform Event Backbone PostgreSQL ownership", () => {
	test("declares the canonical outbox identity and discriminated scope columns", () => {
		expect(getTableName(eventOutbox)).toBe("platform_event_outbox");
		const columns = getTableColumns(eventOutbox);
		expect(columns.id.primary).toBe(true);
		expect(columns.scopeType.notNull).toBe(true);
		expect(columns.scopeKey.notNull).toBe(true);
		expect(columns.tenantId.notNull).toBe(false);
		expect(columns.data.notNull).toBe(true);
		expect(columns.publishedAt.notNull).toBe(false);
		expect(columns.status.notNull).toBe(true);
		expect(columns.deliverySequence.notNull).toBe(true);
		expect(columns.claimTokenDigest.notNull).toBe(false);
		expect(columns.nextAttemptAt.notNull).toBe(true);
	});

	test("declares every classified PR4 delivery-state table", () => {
		expect(
			[
				eventOutbox,
				eventDeliveryAttempt,
				eventDeadLetter,
				eventReplayRequest,
				eventConsumerReceipt,
			].map(getTableName)
		).toEqual([
			"platform_event_outbox",
			"platform_event_delivery_attempt",
			"platform_event_dead_letter",
			"platform_event_replay_request",
			"platform_event_consumer_receipt",
		]);
		const receipt = getTableColumns(eventConsumerReceipt);
		expect(receipt.receiptScope.notNull).toBe(true);
		expect(receipt.replayRequestId.notNull).toBe(false);
	});
});
