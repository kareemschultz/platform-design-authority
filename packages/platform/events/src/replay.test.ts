import { describe, expect, test } from "bun:test";

import { createEventConsumerRegistry } from "./delivery";
import {
	createEventReplayService,
	EventReplayError,
	type EventReplayStoredRequest,
	processNextReplayRequest,
} from "./replay";

const request = {
	actorUserId: "user_replay_test_0001",
	consumerId: "catalog-search-projection",
	consumerSchemaVersion: "1.0.0",
	contextId: "context_replay_test_0001",
	correlationId: "correlation_replay_test_0001",
	eventNames: ["catalog.product.created.v1"],
	firstSequence: "10",
	idempotencyKey: "replay-idempotency-0001",
	lastSequence: "12",
	purpose: "Rebuild a bounded tenant projection after verification.",
	sessionId: "session_replay_test_0001",
	tenantId: "tenant_replay_test_0001",
};

function service(input?: {
	allowed?: boolean;
	rangeCount?: number;
	retentionClass?: string;
}) {
	const stored: EventReplayStoredRequest[] = [];
	const audited: string[] = [];
	return {
		audited,
		service: createEventReplayService({
			audit: {
				appendAccepted: ({ replayRequestId }) => {
					audited.push(replayRequestId);
					return Promise.resolve({ id: "audit_replay_test_0001" });
				},
			},
			authorization: {
				decide: () =>
					Promise.resolve({
						decisionId: "decision_replay_test_0001",
						outcome: input?.allowed === false ? "deny" : "allow",
					}),
			},
			clock: () => new Date("2026-07-15T12:00:00.000Z"),
			consumers: {
				accepts: ({
					consumerId,
					consumerSchemaVersion,
					eventNames,
					eventSchemaVersions,
					retentionClasses,
				}) =>
					consumerId === "catalog-search-projection" &&
					consumerSchemaVersion === "1.0.0" &&
					eventNames.every((name) => name === "catalog.product.created.v1") &&
					(eventSchemaVersions ?? []).every((version) => version === "1.0.0") &&
					(retentionClasses ?? []).every(
						(retentionClass) => retentionClass === "catalog-operational-event"
					),
			},
			ids: { create: () => "event_replay_test_0001" },
			store: {
				createRequest: (value) => {
					stored.push(value);
					return Promise.resolve(value);
				},
				inspectRange: () =>
					Promise.resolve({
						count: input?.rangeCount ?? 1,
						eventNames: ["catalog.product.created.v1"],
						eventSchemaVersions: ["1.0.0"],
						retentionClasses: [
							input?.retentionClass ?? "catalog-operational-event",
						],
					}),
			},
		}),
		stored,
	};
}

describe("Event Backbone replay authorization", () => {
	test("fails closed before range inspection when application authorization denies", async () => {
		const fixture = service({ allowed: false });
		await expect(fixture.service.create(request)).rejects.toMatchObject({
			code: "authorization_denied",
		});
		expect(fixture.audited).toEqual([]);
		expect(fixture.stored).toEqual([]);
	});

	test("rejects empty tenant ranges and ranges above the 1000-event bound", async () => {
		await expect(
			service({ rangeCount: 0 }).service.create(request)
		).rejects.toBeInstanceOf(EventReplayError);
		await expect(
			service().service.create({ ...request, lastSequence: "1010" })
		).rejects.toMatchObject({ code: "validation" });
	});

	test("rejects a retained event whose class is not replay-eligible", async () => {
		await expect(
			service({ retentionClass: "privacy-erased" }).service.create(request)
		).rejects.toMatchObject({ code: "validation" });
	});

	test("persists only after compatibility, current authorization, and Audit succeed", async () => {
		const fixture = service();
		const result = await fixture.service.create(request);
		expect(result).toMatchObject({
			id: "event_replay_test_0001",
			state: "Pending",
		});
		expect(fixture.audited).toEqual(["event_replay_test_0001"]);
		expect(fixture.stored[0]).toMatchObject({
			auditRecordId: "audit_replay_test_0001",
			permissionDecisionId: "decision_replay_test_0001",
			tenantId: request.tenantId,
		});
	});
});

describe("Event Backbone replay execution", () => {
	test("replays a bounded request in committed order and completes it", async () => {
		const consumed: string[] = [];
		const completed: string[] = [];
		const receipts = new Set(["event_test_0001"]);
		const result = await processNextReplayRequest({
			clock: () => new Date("2026-07-15T12:00:00.000Z"),
			idFactory: () => "effect_replay_test_0001",
			receipts: {
				hasReceipt: ({ eventId }) => Promise.resolve(receipts.has(eventId)),
				recordReceipt: (receipt) => {
					receipts.add(receipt.eventId);
					return Promise.resolve("inserted");
				},
			},
			registry: createEventConsumerRegistry([
				{
					consume: (event) => {
						consumed.push(event.id);
						return Promise.resolve();
					},
					eventNames: ["catalog.product.created.v1"],
					eventSchemaVersions: ["1.0.0"],
					id: "catalog-search-projection",
					replayRetentionClasses: ["catalog-operational-event"],
					schemaVersion: "1.0.0",
				},
			]),
			store: {
				claimNext: () =>
					Promise.resolve({
						consumerId: request.consumerId,
						consumerSchemaVersion: request.consumerSchemaVersion,
						eventNames: request.eventNames,
						firstSequence: request.firstSequence,
						id: "event_replay_test_0001",
						lastSequence: request.lastSequence,
						tenantId: request.tenantId,
					}),
				complete: ({ id }) => {
					completed.push(id);
					return Promise.resolve();
				},
				fail: () => Promise.reject(new Error("must not fail")),
				loadEvents: () =>
					Promise.resolve([
						{
							classification: "Confidential",
							data: { productId: "product_test_0001" },
							id: "event_test_0001",
							name: "catalog.product.created.v1",
							occurredAt: "2026-07-15T11:59:00.000Z",
							producerNamespace: "catalog",
							retentionClass: "catalog-operational-event",
							schemaRef: "catalog.product.created.v1",
							schemaVersion: "1.0.0",
							scopeType: "Tenant",
							tenantId: request.tenantId,
						},
						{
							classification: "Confidential",
							data: { productId: "product_test_0002" },
							id: "event_test_0002",
							name: "catalog.product.created.v1",
							occurredAt: "2026-07-15T11:59:01.000Z",
							producerNamespace: "catalog",
							retentionClass: "catalog-operational-event",
							schemaRef: "catalog.product.created.v1",
							schemaVersion: "1.0.0",
							scopeType: "Tenant",
							tenantId: request.tenantId,
						},
					]),
			},
		});
		expect(result).toBe("completed");
		expect(consumed).toEqual(["event_test_0002"]);
		expect(receipts).toEqual(new Set(["event_test_0001", "event_test_0002"]));
		expect(completed).toEqual(["event_replay_test_0001"]);
	});
});
