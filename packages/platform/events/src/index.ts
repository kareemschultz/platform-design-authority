import type { EventEnvelope } from "@meridian/contracts-events";

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
