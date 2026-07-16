export interface EventReplayRequestInput {
	actorUserId: string;
	consumerId: string;
	consumerSchemaVersion: string;
	contextId: string;
	correlationId: string;
	eventNames: string[];
	firstSequence: string;
	idempotencyKey: string;
	lastSequence: string;
	purpose: string;
	sessionId: string;
	tenantId: string;
}

export const WS2_REPLAY_POLICY = {
	runningRecoveryMs: 15 * 60 * 1000,
} as const;

export interface EventReplayRequestResult {
	consumerId: string;
	consumerSchemaVersion: string;
	eventNames: string[];
	firstSequence: string;
	id: string;
	lastSequence: string;
	requestedAt: string;
	state:
		| "Pending"
		| "Running"
		| "Completed"
		| "PartiallyCompleted"
		| "Rejected"
		| "Failed";
}

export interface EventReplayStoredRequest {
	approvedBy: string;
	auditRecordId: string;
	compatibilityResult: "compatible";
	consumerId: string;
	consumerSchemaVersion: string;
	eventNames: string[];
	firstSequence: string;
	id: string;
	idempotencyKey: string;
	lastSequence: string;
	permissionDecisionId: string;
	purpose: string;
	requestedAt: string;
	requestedBy: string;
	state: "queued";
	tenantId: string;
}

export interface EventReplayStorePort {
	createRequest: (
		request: EventReplayStoredRequest
	) => Promise<EventReplayStoredRequest>;
	inspectRange: (input: {
		eventNames: string[];
		firstSequence: string;
		lastSequence: string;
		tenantId: string;
	}) => Promise<{
		count: number;
		eventNames: string[];
		eventSchemaVersions: string[];
		retentionClasses: string[];
	}>;
}

export interface ClaimedEventReplayRequest {
	consumerId: string;
	consumerSchemaVersion: string;
	eventNames: string[];
	firstSequence: string;
	id: string;
	lastSequence: string;
	tenantId: string;
}

export interface EventReplayExecutionStorePort {
	claimNext: (input: {
		reclaimBefore: string;
		startedAt: string;
	}) => Promise<ClaimedEventReplayRequest | undefined>;
	complete: (input: { completedAt: string; id: string }) => Promise<void>;
	fail: (input: { failureCode: string; id: string }) => Promise<void>;
	loadEvents: (
		request: ClaimedEventReplayRequest
	) => Promise<import("./delivery").CommittedEventEnvelope[]>;
}

export interface EventReplayReceiptStorePort {
	hasReceipt: (input: {
		consumerId: string;
		consumerSchemaVersion: string;
		eventId: string;
		replayRequestId: string;
	}) => Promise<boolean>;
	recordReceipt: (
		receipt: import("./delivery").ConsumerReceiptRecord & {
			replayRequestId: string;
		}
	) => Promise<"duplicate" | "inserted">;
}

export interface EventReplayAuthorizationPort {
	decide: (input: {
		actorUserId: string;
		contextId: string;
		permission: "platform.event.replay";
		sessionId: string;
		tenantId: string;
	}) => Promise<{ decisionId: string; outcome: "allow" | "deny" }>;
}

export interface EventReplayAuditPort {
	appendAccepted: (input: {
		actorUserId: string;
		correlationId: string;
		decisionId: string;
		idempotencyKey: string;
		purpose: string;
		replayRequestId: string;
		tenantId: string;
	}) => Promise<{ id: string }>;
}

export interface EventReplayConsumerRegistryPort {
	accepts: (input: {
		consumerId: string;
		consumerSchemaVersion: string;
		eventNames: string[];
		eventSchemaVersions?: string[];
		retentionClasses?: string[];
	}) => boolean;
}

export class EventReplayError extends Error {
	readonly code: "authorization_denied" | "idempotency_conflict" | "validation";

	constructor(code: EventReplayError["code"], options?: ErrorOptions) {
		super("event replay request rejected", options);
		this.name = "EventReplayError";
		this.code = code;
	}
}

function publicResult(
	request: EventReplayStoredRequest
): EventReplayRequestResult {
	return {
		consumerId: request.consumerId,
		consumerSchemaVersion: request.consumerSchemaVersion,
		eventNames: request.eventNames,
		firstSequence: request.firstSequence,
		id: request.id,
		lastSequence: request.lastSequence,
		requestedAt: request.requestedAt,
		state: "Pending",
	};
}

export function createEventReplayService(options: {
	audit: EventReplayAuditPort;
	authorization: EventReplayAuthorizationPort;
	clock: () => Date;
	consumers: EventReplayConsumerRegistryPort;
	ids: { create: () => string };
	store: EventReplayStorePort;
}) {
	return {
		async create(
			input: EventReplayRequestInput
		): Promise<EventReplayRequestResult> {
			let first: bigint;
			let last: bigint;
			try {
				first = BigInt(input.firstSequence);
				last = BigInt(input.lastSequence);
			} catch (error) {
				throw new EventReplayError("validation", { cause: error });
			}
			if (first <= 0n || last < first || last - first >= 1000n) {
				throw new EventReplayError("validation");
			}
			const decision = await options.authorization.decide({
				actorUserId: input.actorUserId,
				contextId: input.contextId,
				permission: "platform.event.replay",
				sessionId: input.sessionId,
				tenantId: input.tenantId,
			});
			if (decision.outcome !== "allow") {
				throw new EventReplayError("authorization_denied");
			}
			const inspected = await options.store.inspectRange({
				eventNames: input.eventNames,
				firstSequence: input.firstSequence,
				lastSequence: input.lastSequence,
				tenantId: input.tenantId,
			});
			if (
				inspected.count === 0 ||
				!options.consumers.accepts({
					consumerId: input.consumerId,
					consumerSchemaVersion: input.consumerSchemaVersion,
					eventNames: input.eventNames,
					eventSchemaVersions: inspected.eventSchemaVersions,
					retentionClasses: inspected.retentionClasses,
				})
			) {
				throw new EventReplayError("validation");
			}
			const replayRequestId = options.ids.create();
			const audit = await options.audit.appendAccepted({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				decisionId: decision.decisionId,
				idempotencyKey: input.idempotencyKey,
				purpose: input.purpose,
				replayRequestId,
				tenantId: input.tenantId,
			});
			return publicResult(
				await options.store.createRequest({
					approvedBy: input.actorUserId,
					auditRecordId: audit.id,
					compatibilityResult: "compatible",
					consumerId: input.consumerId,
					consumerSchemaVersion: input.consumerSchemaVersion,
					eventNames: input.eventNames,
					firstSequence: input.firstSequence,
					id: replayRequestId,
					idempotencyKey: input.idempotencyKey,
					lastSequence: input.lastSequence,
					permissionDecisionId: decision.decisionId,
					purpose: input.purpose,
					requestedAt: options.clock().toISOString(),
					requestedBy: input.actorUserId,
					state: "queued",
					tenantId: input.tenantId,
				})
			);
		},
	};
}

export async function processNextReplayRequest(options: {
	clock: () => Date;
	idFactory: () => string;
	receipts: EventReplayReceiptStorePort;
	registry: import("./delivery").EventConsumerRegistry;
	store: EventReplayExecutionStorePort;
}): Promise<"completed" | "failed" | "idle"> {
	const now = options.clock();
	const request = await options.store.claimNext({
		reclaimBefore: new Date(
			now.getTime() - WS2_REPLAY_POLICY.runningRecoveryMs
		).toISOString(),
		startedAt: now.toISOString(),
	});
	if (!request) {
		return "idle";
	}
	const consumer = options.registry.find(
		request.consumerId,
		request.consumerSchemaVersion
	);
	if (
		!consumer ||
		request.eventNames.some((name) => !consumer.eventNames.includes(name))
	) {
		await options.store.fail({
			failureCode: "consumer_incompatible",
			id: request.id,
		});
		return "failed";
	}
	try {
		const events = await options.store.loadEvents(request);
		if (
			events.some(
				(event) =>
					!(
						consumer.eventSchemaVersions.includes(event.schemaVersion) &&
						consumer.replayRetentionClasses?.includes(event.retentionClass)
					)
			)
		) {
			await options.store.fail({
				failureCode: "producer_schema_incompatible",
				id: request.id,
			});
			return "failed";
		}
		for (const event of events) {
			if (
				// biome-ignore lint/performance/noAwaitInLoops: replay receipts are checked in committed order so stale recovery skips each completed event deterministically.
				await options.receipts.hasReceipt({
					consumerId: consumer.id,
					consumerSchemaVersion: consumer.schemaVersion,
					eventId: event.id,
					replayRequestId: request.id,
				})
			) {
				continue;
			}
			await consumer.consume(event);
			await options.receipts.recordReceipt({
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				effectReference: options.idFactory(),
				eventId: event.id,
				processedAt: options.clock().toISOString(),
				replayRequestId: request.id,
				resultCode: "replayed",
				tenantId: request.tenantId,
			});
		}
		await options.store.complete({
			completedAt: options.clock().toISOString(),
			id: request.id,
		});
		return "completed";
	} catch {
		await options.store.fail({
			failureCode: "consumer_failure",
			id: request.id,
		});
		return "failed";
	}
}
