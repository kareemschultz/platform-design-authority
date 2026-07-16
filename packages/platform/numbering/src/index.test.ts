import { describe, expect, test } from "bun:test";
import {
	createNumberingService,
	type NumberAllocation,
	NumberingError,
	type NumberingTransactionScope,
} from ".";

function harness() {
	let next = 1;
	const allocations = new Map<string, NumberAllocation>();
	const events: unknown[] = [];
	const scope: NumberingTransactionScope = {
		events: {
			append(event) {
				events.push(event);
				return Promise.resolve("inserted");
			},
		},
		repository: {
			allocateLocked(input) {
				const value = next;
				next += 1;
				const result: NumberAllocation = {
					allocatedAt: input.now,
					formattedValue: `INV-${String(value).padStart(6, "0")}`,
					id: input.allocationId,
					idempotencyKey: input.idempotencyKey,
					organizationId: input.organizationId,
					requestFingerprint: input.requestFingerprint,
					sequenceId: input.sequenceId,
					tenantId: input.tenantId,
					value,
				};
				allocations.set(
					`${input.tenantId}:${input.sequenceId}:${input.idempotencyKey}`,
					result
				);
				return Promise.resolve(result);
			},
			findAllocation(input) {
				return Promise.resolve(
					allocations.get(
						`${input.tenantId}:${input.sequenceId}:${input.idempotencyKey}`
					) ?? null
				);
			},
		},
	};
	let id = 0;
	const service = createNumberingService({
		clock: () => new Date("2026-07-16T12:00:00Z"),
		ids: {
			create: (kind) => {
				id += 1;
				return `${kind}_${id}`;
			},
		},
		unitOfWork: { execute: (operation) => operation(scope) },
	});
	return { events, service };
}

describe("Numbering service", () => {
	test("allocates once and replays an identical idempotent request", async () => {
		const { events, service } = harness();
		const input = {
			actorUserId: "user_1",
			correlationId: "corr_1",
			idempotencyKey: "key_1",
			organizationId: "org_1",
			sequenceId: "seq_1",
			tenantId: "tenant_1",
		};
		const first = await service.allocate(input);
		const replay = await service.allocate(input);
		expect(replay).toEqual(first);
		expect(first.formattedValue).toBe("INV-000001");
		expect(events).toHaveLength(1);
	});

	test("rejects reuse of an idempotency key for another sequence scope", async () => {
		const { service } = harness();
		await service.allocate({
			actorUserId: "user_1",
			correlationId: "corr_1",
			idempotencyKey: "key_1",
			organizationId: "org_1",
			sequenceId: "seq_1",
			tenantId: "tenant_1",
		});
		await expect(
			service.allocate({
				actorUserId: "user_1",
				correlationId: "corr_2",
				idempotencyKey: "key_1",
				organizationId: "org_2",
				sequenceId: "seq_1",
				tenantId: "tenant_1",
			})
		).rejects.toBeInstanceOf(NumberingError);
	});
});
