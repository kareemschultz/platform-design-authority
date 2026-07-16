export interface NumberSequence {
	createdAt: Date;
	currentValue: number;
	id: string;
	nextValue: number;
	organizationId: string;
	padding: number;
	prefix: string;
	sequenceKey: string;
	state: "Active" | "Suspended";
	tenantId: string;
	updatedAt: Date;
	version: number;
}

export interface NumberAllocationRequest {
	actorUserId: string;
	correlationId: string;
	idempotencyKey: string;
	organizationId: string;
	sequenceId: string;
	tenantId: string;
}

export interface NumberAllocation {
	allocatedAt: Date;
	formattedValue: string;
	id: string;
	idempotencyKey: string;
	organizationId: string;
	requestFingerprint: string;
	sequenceId: string;
	tenantId: string;
	value: number;
}

export interface NumberingRepository {
	allocateLocked: (
		input: NumberAllocationRequest & {
			allocationId: string;
			now: Date;
			requestFingerprint: string;
		}
	) => Promise<NumberAllocation | "not_found" | "suspended">;
	findAllocation: (
		input: Pick<
			NumberAllocationRequest,
			"idempotencyKey" | "sequenceId" | "tenantId"
		>
	) => Promise<NumberAllocation | null>;
}

export interface PendingNumberingEvent {
	actorId: string;
	aggregateId: string;
	capabilityId: "platform.numbering";
	classification: "Confidential";
	correlationId: string;
	data: Record<string, unknown>;
	id: string;
	idempotencyKey: string;
	name: "platform.sequence.number-issued.v1";
	occurredAt: string;
	organizationId: string;
	producerNamespace: "platform";
	purpose: "business-reference-allocation";
	retentionClass: "platform-numbering-event";
	schemaRef: string;
	schemaVersion: "1.0.0";
	scopeType: "Tenant";
	sourceChannel: "api";
	tenantId: string;
}

export interface NumberingTransactionScope {
	events: {
		append: (event: PendingNumberingEvent) => Promise<"inserted" | "duplicate">;
	};
	repository: NumberingRepository;
}

export interface NumberingUnitOfWork {
	execute: <TResult>(
		operation: (scope: NumberingTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export interface NumberingIdFactory {
	create: (kind: "allocation" | "event") => string;
}

export class NumberingError extends Error {
	readonly code: "idempotency_conflict" | "not_found" | "sequence_suspended";

	constructor(
		code: "idempotency_conflict" | "not_found" | "sequence_suspended",
		message: string
	) {
		super(message);
		this.code = code;
	}
}

function fingerprint(input: NumberAllocationRequest): string {
	return JSON.stringify({
		organizationId: input.organizationId,
		sequenceId: input.sequenceId,
		tenantId: input.tenantId,
	});
}

function assertReceipt(
	allocation: NumberAllocation,
	requestFingerprint: string
) {
	if (allocation.requestFingerprint !== requestFingerprint) {
		throw new NumberingError(
			"idempotency_conflict",
			"The idempotency key is already bound to another request"
		);
	}
}

export function createNumberingService(options: {
	clock: () => Date;
	ids: NumberingIdFactory;
	unitOfWork: NumberingUnitOfWork;
}) {
	return {
		allocate(input: NumberAllocationRequest): Promise<NumberAllocation> {
			const requestFingerprint = fingerprint(input);
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await repository.findAllocation(input);
				if (prior) {
					assertReceipt(prior, requestFingerprint);
					return prior;
				}
				const now = options.clock();
				const allocation = await repository.allocateLocked({
					...input,
					allocationId: options.ids.create("allocation"),
					now,
					requestFingerprint,
				});
				if (allocation === "not_found") {
					throw new NumberingError("not_found", "Sequence was not found");
				}
				if (allocation === "suspended") {
					throw new NumberingError(
						"sequence_suspended",
						"Sequence is suspended"
					);
				}
				assertReceipt(allocation, requestFingerprint);
				await events.append({
					actorId: input.actorUserId,
					aggregateId: allocation.id,
					capabilityId: "platform.numbering",
					classification: "Confidential",
					correlationId: input.correlationId,
					data: {
						formattedValue: allocation.formattedValue,
						sequenceId: allocation.sequenceId,
						value: allocation.value,
					},
					id: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "platform.sequence.number-issued.v1",
					occurredAt: now.toISOString(),
					organizationId: input.organizationId,
					producerNamespace: "platform",
					purpose: "business-reference-allocation",
					retentionClass: "platform-numbering-event",
					schemaRef:
						"schemas/events/platform.sequence.number-issued.v1.schema.json",
					schemaVersion: "1.0.0",
					scopeType: "Tenant",
					sourceChannel: "api",
					tenantId: input.tenantId,
				});
				return allocation;
			});
		},
	};
}
