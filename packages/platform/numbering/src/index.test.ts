import { describe, expect, test } from "bun:test";
import {
	createNumberingService,
	type NumberAllocation,
	NumberingError,
	type NumberingTransactionScope,
} from ".";

interface SystemSequenceDefinition {
	organizationId: string;
	ownerNamespace: string;
	padding: number;
	prefix: string;
	recordType: string;
	sequenceKey: string;
	tenantId: string;
}

function harness() {
	const allocations = new Map<string, NumberAllocation>();
	const counters = new Map<string, bigint>();
	const events: unknown[] = [];
	const sequenceVersions = new Map<string, number>();
	const systemSequences = new Map<string, SystemSequenceDefinition>();
	const sequenceScope = (tenantId: string, sequenceId: string) =>
		`${tenantId}:${sequenceId}`;
	const allocationScope = (
		tenantId: string,
		sequenceId: string,
		idempotencyKey: string
	) => `${sequenceScope(tenantId, sequenceId)}:${idempotencyKey}`;
	const scope: NumberingTransactionScope = {
		events: {
			append(event) {
				events.push(event);
				return Promise.resolve("inserted");
			},
		},
		repository: {
			allocateLocked(input) {
				const key = sequenceScope(input.tenantId, input.sequenceId);
				const counterValue = counters.get(key) ?? 1n;
				counters.set(key, counterValue + 1n);
				const result: NumberAllocation = {
					businessRecordId: input.businessRecordId,
					counterValue,
					id: input.allocationId,
					idempotencyKey: input.idempotencyKey,
					issuedAt: input.now,
					organizationId: input.organizationId,
					requestFingerprint: input.requestFingerprint,
					sequenceId: input.sequenceId,
					sequenceKey: "invoice",
					sequenceVersion: sequenceVersions.get(key) ?? 1,
					sourceCommandId: input.sourceCommandId,
					state: "Issued",
					tenantId: input.tenantId,
					value: `INV-${String(counterValue).padStart(6, "0")}`,
				};
				allocations.set(
					allocationScope(
						input.tenantId,
						input.sequenceId,
						input.idempotencyKey
					),
					result
				);
				return Promise.resolve(result);
			},
			ensureSystemSequence(input) {
				const key = `${input.tenantId}:${input.id}`;
				const definition: SystemSequenceDefinition = {
					organizationId: input.organizationId,
					ownerNamespace: input.ownerNamespace,
					padding: input.padding,
					prefix: input.prefix,
					recordType: input.recordType,
					sequenceKey: input.sequenceKey,
					tenantId: input.tenantId,
				};
				const existing = systemSequences.get(key);
				if (
					existing &&
					JSON.stringify(existing) !== JSON.stringify(definition)
				) {
					return Promise.resolve("configuration_conflict");
				}
				systemSequences.set(key, definition);
				return Promise.resolve("ready");
			},
			findAllocation(input) {
				return Promise.resolve(
					allocations.get(
						allocationScope(
							input.tenantId,
							input.sequenceId,
							input.idempotencyKey
						)
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
	return {
		allocations,
		events,
		service,
		setSequenceVersion(tenantId: string, sequenceId: string, version: number) {
			sequenceVersions.set(sequenceScope(tenantId, sequenceId), version);
		},
		systemSequences,
	};
}

function allocationRequest(
	overrides: Partial<
		Parameters<ReturnType<typeof harness>["service"]["allocate"]>[0]
	> = {}
) {
	return {
		actorUserId: "user_1",
		businessRecordId: "invoice_1",
		correlationId: "corr_1",
		idempotencyKey: "key_1",
		organizationId: "org_1",
		sequenceId: "seq_1",
		sourceCommandId: "invoice.issue:key_1",
		tenantId: "tenant_1",
		...overrides,
	};
}

describe("Numbering service", () => {
	test("allocates once and replays an identical idempotent request", async () => {
		const { allocations, events, service } = harness();
		const input = allocationRequest();
		const first = await service.allocate(input);
		const replay = await service.allocate(input);
		expect(replay).toEqual(first);
		expect(first.value).toBe("INV-000001");
		expect(allocations).toHaveLength(1);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			data: {
				allocationId: first.id,
				businessRecordId: "invoice_1",
				sequenceId: "seq_1",
				sequenceKey: "invoice",
				sourceCommandId: "invoice.issue:key_1",
				value: "INV-000001",
			},
			name: "platform.sequence.number-issued.v1",
			tenantId: "tenant_1",
		});
	});

	test("rejects reuse of an idempotency key for another request in the same tenant sequence", async () => {
		const { service } = harness();
		await service.allocate(allocationRequest({ businessRecordId: null }));
		const conflict = service.allocate(
			allocationRequest({ businessRecordId: null, organizationId: "org_2" })
		);
		await expect(conflict).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
	});

	test("isolates identical sequence and idempotency keys across tenants", async () => {
		const { allocations, events, service } = harness();
		const firstTenant = await service.allocate(allocationRequest());
		const secondTenant = await service.allocate(
			allocationRequest({
				actorUserId: "user_2",
				businessRecordId: "invoice_2",
				organizationId: "org_2",
				tenantId: "tenant_2",
			})
		);

		expect(firstTenant.tenantId).toBe("tenant_1");
		expect(secondTenant.tenantId).toBe("tenant_2");
		expect(firstTenant.id).not.toBe(secondTenant.id);
		expect(firstTenant.value).toBe("INV-000001");
		expect(secondTenant.value).toBe("INV-000001");
		expect(allocations).toHaveLength(2);
		expect(events).toHaveLength(2);
		expect(
			events.map((event) => (event as { tenantId: string }).tenantId)
		).toEqual(["tenant_1", "tenant_2"]);
	});

	test("snapshots the sequence version on each allocation and preserves it on replay", async () => {
		const { service, setSequenceVersion } = harness();
		setSequenceVersion("tenant_1", "seq_1", 3);
		const first = await service.allocate(allocationRequest());
		setSequenceVersion("tenant_1", "seq_1", 4);
		const replay = await service.allocate(allocationRequest());
		const later = await service.allocate(
			allocationRequest({
				businessRecordId: "invoice_2",
				idempotencyKey: "key_2",
				sourceCommandId: "invoice.issue:key_2",
			})
		);

		expect(first.sequenceVersion).toBe(3);
		expect(replay.sequenceVersion).toBe(3);
		expect(later.sequenceVersion).toBe(4);
	});

	test("idempotently provisions an identical system sequence", async () => {
		const { service, systemSequences } = harness();
		const definition = {
			id: "sequence_import_org_1",
			organizationId: "org_1",
			ownerNamespace: "platform",
			padding: 6,
			prefix: "IMP-",
			recordType: "ImportJob",
			sequenceKey: "platform.import-job",
			tenantId: "tenant_1",
		};

		await service.ensureSystemSequence(definition);
		await service.ensureSystemSequence(definition);

		expect(systemSequences).toHaveLength(1);
		expect(systemSequences.get("tenant_1:sequence_import_org_1")).toEqual({
			organizationId: "org_1",
			ownerNamespace: "platform",
			padding: 6,
			prefix: "IMP-",
			recordType: "ImportJob",
			sequenceKey: "platform.import-job",
			tenantId: "tenant_1",
		});
	});

	test("rejects a conflicting definition for an existing system sequence", async () => {
		const { service } = harness();
		const definition = {
			id: "sequence_import_org_1",
			organizationId: "org_1",
			ownerNamespace: "platform",
			padding: 6,
			prefix: "IMP-",
			recordType: "ImportJob",
			sequenceKey: "platform.import-job",
			tenantId: "tenant_1",
		};
		await service.ensureSystemSequence(definition);

		const conflict = service.ensureSystemSequence({
			...definition,
			prefix: "OTHER-",
		});
		await expect(conflict).rejects.toMatchObject({
			code: "configuration_conflict",
		});
		await expect(conflict).rejects.toBeInstanceOf(NumberingError);
	});
});
