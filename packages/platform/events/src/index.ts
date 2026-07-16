import type { EventEnvelope } from "@meridian/contracts-events";

export type {
	ClaimEventInput,
	ClaimedOutboxEvent,
	CommittedEventEnvelope,
	ConsumerReceiptRecord,
	DeadLetterRecord,
	DeliveryAttemptRecord,
	DeliveryClock,
	DeliveryFailureDisposition,
	DeliveryJitter,
	DeliveryPolicyInput,
	DeliveryProcessorDependencies,
	DeliveryProcessResult,
	DeliveryStorePort,
	EventConsumerRegistry,
	RegisteredEventConsumer,
} from "./delivery";
// biome-ignore lint/performance/noBarrelFile: this package intentionally exposes one governed Event Backbone public entry point.
export {
	calculateRetryDelayMs,
	createEventConsumerRegistry,
	DeliveryConsumerError,
	decideDeliveryFailure,
	processClaimedEvent,
	WS2_DELIVERY_POLICY,
} from "./delivery";

export type OutboxAppendResult = "inserted" | "duplicate";
export type OutboxEvent<
	TData extends Record<string, unknown> = Record<string, unknown>,
> = Omit<EventEnvelope<TData>, "publishedAt">;

/**
 * Published Event Backbone port. Implementations must preserve event-id
 * idempotency and may bind this port to an owner-scoped transaction without
 * exposing the underlying transaction handle.
 */
export interface OutboxAppendPort {
	append: <TData extends Record<string, unknown>>(
		envelope: OutboxEvent<TData>
	) => Promise<OutboxAppendResult>;
}
