import type { EventEnvelope } from "@meridian/contracts-events";

export type CommittedEventEnvelope = Omit<EventEnvelope, "publishedAt">;

export const WS2_DELIVERY_POLICY = {
	claimLeaseMs: 30_000,
	initialRetryMs: 1000,
	maxAttempts: 20,
	maxRetryAgeMs: 24 * 60 * 60 * 1000,
	maxRetryMs: 5 * 60 * 1000,
} as const;

export type DeliveryFailureDisposition =
	| { kind: "retry"; nextAttemptAt: string }
	| { kind: "terminal"; reason: "attempt_limit" | "retry_horizon" };

export interface DeliveryClock {
	now: () => Date;
}

export interface DeliveryJitter {
	next: () => number;
}

export interface DeliveryPolicyInput {
	attemptCount: number;
	firstAttemptedAt: string;
}

export interface ClaimedOutboxEvent {
	attemptCount: number;
	claimToken: string;
	deliverySequence: string;
	event: CommittedEventEnvelope;
	firstAttemptedAt: string;
}

export interface ClaimEventInput {
	claimToken: string;
	leaseExpiresAt: string;
	now: string;
	pausedTenantIds?: readonly string[];
}

export interface DeliveryAttemptRecord {
	attemptNumber: number;
	consumerId: string;
	consumerSchemaVersion: string;
	eventId: string;
	finishedAt?: string;
	id: string;
	nextAttemptAt?: string;
	outcome: "succeeded" | "retryable_failure" | "terminal_failure";
	reasonCode?: string;
	retryDelayMs?: number;
	startedAt: string;
	tenantId: string;
}

export interface ConsumerReceiptRecord {
	consumerId: string;
	consumerSchemaVersion: string;
	effectReference?: string;
	eventId: string;
	processedAt: string;
	replayRequestId?: string;
	resultCode: string;
	tenantId: string;
}

export interface DeadLetterRecord {
	attemptCount: number;
	consumerId: string;
	consumerSchemaVersion: string;
	deliverySequence: string;
	envelopeSummary: Record<string, unknown>;
	eventId: string;
	failureClassification: string;
	firstAttemptedAt: string;
	id: string;
	lastAttemptedAt: string;
	retentionClass: string;
	schemaRef: string;
	tenantId: string;
	terminalReason: string;
}

export interface DeliveryStorePort {
	claimNext: (
		input: ClaimEventInput
	) => Promise<ClaimedOutboxEvent | undefined>;
	getHealthSnapshot: (now: string) => Promise<DeliveryHealthSnapshot>;
	hasReceipt: (input: {
		consumerId: string;
		consumerSchemaVersion: string;
		eventId: string;
		replayRequestId?: string;
	}) => Promise<boolean>;
	markDeadLettered: (input: {
		claimToken: string;
		eventId: string;
		terminalReason: string;
	}) => Promise<boolean>;
	markDelivered: (input: {
		claimToken: string;
		eventId: string;
		publishedAt: string;
	}) => Promise<boolean>;
	recordAttempt: (attempt: DeliveryAttemptRecord) => Promise<void>;
	recordDeadLetter: (
		record: DeadLetterRecord
	) => Promise<"inserted" | "duplicate">;
	recordReceipt: (
		receipt: ConsumerReceiptRecord
	) => Promise<"inserted" | "duplicate">;
	releaseForRetry: (input: {
		claimToken: string;
		eventId: string;
		nextAttemptAt: string;
		reasonCode: string;
	}) => Promise<boolean>;
	renewClaim: (input: {
		claimToken: string;
		eventId: string;
		leaseExpiresAt: string;
		now: string;
	}) => Promise<boolean>;
}

export interface DeliveryHealthSnapshot {
	attemptsLastHour: number;
	claimed: number;
	deadLettered: number;
	deliveredLastHour: number;
	failuresLastHour: number;
	oldestEligibleAgeMs: number;
	pending: number;
	retrying: number;
}

export class DeliveryConsumerError extends Error {
	readonly reasonCode: string;
	readonly retryable: boolean;

	constructor(reasonCode: string, retryable: boolean) {
		super("event consumer failed");
		this.name = "DeliveryConsumerError";
		this.reasonCode = reasonCode;
		this.retryable = retryable;
	}
}

export interface DeliveryProcessorDependencies {
	clock: DeliveryClock;
	idFactory: () => string;
	jitter: DeliveryJitter;
	registry: EventConsumerRegistry;
	store: DeliveryStorePort;
}

export type DeliveryProcessResult =
	| "delivered"
	| "dead_lettered"
	| "lease_lost"
	| "no_consumers"
	| "retry_scheduled";

function safeConsumerFailure(error: unknown): {
	reasonCode: string;
	retryable: boolean;
} {
	return error instanceof DeliveryConsumerError
		? { reasonCode: error.reasonCode, retryable: error.retryable }
		: { reasonCode: "consumer_failure", retryable: true };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the explicit fail-closed branches mirror the governed receipt/retry/dead-letter state machine.
export async function processClaimedEvent(
	claim: ClaimedOutboxEvent,
	dependencies: DeliveryProcessorDependencies
): Promise<DeliveryProcessResult> {
	const consumers = dependencies.registry.consumersFor(claim.event.name);
	if (consumers.length === 0) {
		const marked = await dependencies.store.markDelivered({
			claimToken: claim.claimToken,
			eventId: claim.event.id,
			publishedAt: dependencies.clock.now().toISOString(),
		});
		return marked ? "no_consumers" : "lease_lost";
	}
	const { tenantId } = claim.event;
	if (!tenantId) {
		throw new DeliveryConsumerError("tenant_scope_required", false);
	}
	let terminalCount = 0;
	for (const consumer of consumers) {
		if (
			// biome-ignore lint/performance/noAwaitInLoops: consumer receipts are evaluated sequentially so one retry cannot race sibling terminal state.
			await dependencies.store.hasReceipt({
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				eventId: claim.event.id,
			})
		) {
			continue;
		}
		const startedAt = dependencies.clock.now().toISOString();
		try {
			if (!consumer.eventSchemaVersions.includes(claim.event.schemaVersion)) {
				throw new DeliveryConsumerError("schema_incompatible", false);
			}
			await consumer.consume(claim.event);
			const finishedAt = dependencies.clock.now().toISOString();
			await dependencies.store.recordReceipt({
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				eventId: claim.event.id,
				processedAt: finishedAt,
				resultCode: "processed",
				tenantId,
			});
			await dependencies.store.recordAttempt({
				attemptNumber: claim.attemptCount,
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				eventId: claim.event.id,
				finishedAt,
				id: dependencies.idFactory(),
				outcome: "succeeded",
				startedAt,
				tenantId,
			});
		} catch (error) {
			const failure = safeConsumerFailure(error);
			const now = dependencies.clock.now().toISOString();
			const disposition = failure.retryable
				? decideDeliveryFailure(
						{
							attemptCount: claim.attemptCount,
							firstAttemptedAt: claim.firstAttemptedAt,
						},
						dependencies.clock,
						dependencies.jitter
					)
				: { kind: "terminal" as const, reason: "attempt_limit" as const };
			if (disposition.kind === "retry") {
				await dependencies.store.recordAttempt({
					attemptNumber: claim.attemptCount,
					consumerId: consumer.id,
					consumerSchemaVersion: consumer.schemaVersion,
					eventId: claim.event.id,
					finishedAt: now,
					id: dependencies.idFactory(),
					nextAttemptAt: disposition.nextAttemptAt,
					outcome: "retryable_failure",
					reasonCode: failure.reasonCode,
					retryDelayMs:
						new Date(disposition.nextAttemptAt).getTime() -
						new Date(now).getTime(),
					startedAt,
					tenantId,
				});
				const released = await dependencies.store.releaseForRetry({
					claimToken: claim.claimToken,
					eventId: claim.event.id,
					nextAttemptAt: disposition.nextAttemptAt,
					reasonCode: failure.reasonCode,
				});
				return released ? "retry_scheduled" : "lease_lost";
			}
			terminalCount += 1;
			await dependencies.store.recordAttempt({
				attemptNumber: claim.attemptCount,
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				eventId: claim.event.id,
				finishedAt: now,
				id: dependencies.idFactory(),
				outcome: "terminal_failure",
				reasonCode: failure.reasonCode,
				startedAt,
				tenantId,
			});
			await dependencies.store.recordDeadLetter({
				attemptCount: claim.attemptCount,
				consumerId: consumer.id,
				consumerSchemaVersion: consumer.schemaVersion,
				deliverySequence: claim.deliverySequence,
				envelopeSummary: {
					classification: claim.event.classification,
					id: claim.event.id,
					name: claim.event.name,
					retentionClass: claim.event.retentionClass,
					schemaVersion: claim.event.schemaVersion,
				},
				eventId: claim.event.id,
				failureClassification: "consumer",
				firstAttemptedAt: claim.firstAttemptedAt,
				id: dependencies.idFactory(),
				lastAttemptedAt: now,
				retentionClass: claim.event.retentionClass,
				schemaRef: claim.event.schemaRef,
				tenantId,
				terminalReason: disposition.reason,
			});
		}
	}
	if (terminalCount > 0) {
		const marked = await dependencies.store.markDeadLettered({
			claimToken: claim.claimToken,
			eventId: claim.event.id,
			terminalReason: "consumer_terminal_failure",
		});
		return marked ? "dead_lettered" : "lease_lost";
	}
	const marked = await dependencies.store.markDelivered({
		claimToken: claim.claimToken,
		eventId: claim.event.id,
		publishedAt: dependencies.clock.now().toISOString(),
	});
	return marked ? "delivered" : "lease_lost";
}

export function calculateRetryDelayMs(
	attemptCount: number,
	jitter: DeliveryJitter
): number {
	const exponent = Math.max(0, attemptCount - 1);
	const ceiling = Math.min(
		WS2_DELIVERY_POLICY.initialRetryMs * 2 ** exponent,
		WS2_DELIVERY_POLICY.maxRetryMs
	);
	const sample = Math.min(1, Math.max(0, jitter.next()));
	return Math.floor(ceiling * sample);
}

export function decideDeliveryFailure(
	input: DeliveryPolicyInput,
	clock: DeliveryClock,
	jitter: DeliveryJitter
): DeliveryFailureDisposition {
	if (input.attemptCount >= WS2_DELIVERY_POLICY.maxAttempts) {
		return { kind: "terminal", reason: "attempt_limit" };
	}
	const now = clock.now();
	const firstAttempt = new Date(input.firstAttemptedAt);
	if (
		Number.isNaN(firstAttempt.getTime()) ||
		now.getTime() - firstAttempt.getTime() >= WS2_DELIVERY_POLICY.maxRetryAgeMs
	) {
		return { kind: "terminal", reason: "retry_horizon" };
	}
	const retryAt = new Date(
		now.getTime() + calculateRetryDelayMs(input.attemptCount, jitter)
	);
	if (
		retryAt.getTime() - firstAttempt.getTime() >
		WS2_DELIVERY_POLICY.maxRetryAgeMs
	) {
		return { kind: "terminal", reason: "retry_horizon" };
	}
	return { kind: "retry", nextAttemptAt: retryAt.toISOString() };
}

export interface RegisteredEventConsumer {
	consume: (event: CommittedEventEnvelope) => Promise<void>;
	eventNames: readonly string[];
	eventSchemaVersions: readonly string[];
	id: string;
	replayRetentionClasses?: readonly string[];
	schemaVersion: string;
}

export interface EventConsumerRegistry {
	consumersFor: (eventName: string) => readonly RegisteredEventConsumer[];
	find: (
		consumerId: string,
		consumerSchemaVersion: string
	) => RegisteredEventConsumer | undefined;
}

export function createEventConsumerRegistry(
	consumers: readonly RegisteredEventConsumer[]
): EventConsumerRegistry {
	const byIdentity = new Map<string, RegisteredEventConsumer>();
	for (const consumer of consumers) {
		const key = `${consumer.id}\u0000${consumer.schemaVersion}`;
		if (byIdentity.has(key)) {
			throw new Error("duplicate event consumer identity");
		}
		byIdentity.set(key, consumer);
	}
	return {
		consumersFor(eventName) {
			return consumers.filter((consumer) =>
				consumer.eventNames.includes(eventName)
			);
		},
		find(consumerId, consumerSchemaVersion) {
			return byIdentity.get(`${consumerId}\u0000${consumerSchemaVersion}`);
		},
	};
}
