import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const eventOutbox = pgTable(
	"platform_event_outbox",
	{
		actorId: text("actor_id"),
		aggregateId: text("aggregate_id"),
		attemptCount: integer("attempt_count").default(0).notNull(),
		availableAt: timestamp("available_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
		capabilityId: text("capability_id"),
		causationId: text("causation_id"),
		classification: text("classification").notNull(),
		correlationId: text("correlation_id"),
		data: jsonb("data").notNull(),
		id: text("id").primaryKey(),
		idempotencyKey: text("idempotency_key"),
		lastErrorCode: text("last_error_code"),
		legalEntityId: text("legal_entity_id"),
		locationId: text("location_id"),
		lockedAt: timestamp("locked_at", {
			mode: "string",
			withTimezone: true,
		}),
		name: text("name").notNull(),
		occurredAt: timestamp("occurred_at", {
			mode: "string",
			withTimezone: true,
		}).notNull(),
		organizationId: text("organization_id"),
		producerNamespace: text("producer_namespace").notNull(),
		publishedAt: timestamp("published_at", {
			mode: "string",
			withTimezone: true,
		}),
		purpose: text("purpose"),
		retentionClass: text("retention_class").notNull(),
		schemaRef: text("schema_ref").notNull(),
		schemaVersion: text("schema_version").notNull(),
		sourceChannel: text("source_channel"),
		status: text("status").default("pending").notNull(),
		tenantId: text("tenant_id").notNull(),
		traceId: text("trace_id"),
	},
	(table) => [
		index("platform_event_outbox_delivery_idx").on(
			table.status,
			table.availableAt
		),
		index("platform_event_outbox_tenant_idx").on(
			table.tenantId,
			table.occurredAt
		),
	]
);
