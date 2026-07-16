import { sql } from "drizzle-orm";
import {
	bigserial,
	check,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
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
		claimedAt: timestamp("claimed_at", {
			mode: "string",
			withTimezone: true,
		}),
		claimTokenDigest: text("claim_token_digest"),
		classification: text("classification").notNull(),
		correlationId: text("correlation_id"),
		data: jsonb("data").notNull(),
		deliverySequence: bigserial("delivery_sequence", {
			mode: "bigint",
		}).notNull(),
		firstAttemptedAt: timestamp("first_attempted_at", {
			mode: "string",
			withTimezone: true,
		}),
		id: text("id").primaryKey(),
		idempotencyKey: text("idempotency_key"),
		lastAttemptedAt: timestamp("last_attempted_at", {
			mode: "string",
			withTimezone: true,
		}),
		lastErrorCode: text("last_error_code"),
		leaseExpiresAt: timestamp("lease_expires_at", {
			mode: "string",
			withTimezone: true,
		}),
		legalEntityId: text("legal_entity_id"),
		locationId: text("location_id"),
		// Retained during the controlled-prototype rolling migration. New claim
		// ownership uses claimedAt + leaseExpiresAt + claimTokenDigest exclusively.
		lockedAt: timestamp("locked_at", {
			mode: "string",
			withTimezone: true,
		}),
		name: text("name").notNull(),
		nextAttemptAt: timestamp("next_attempt_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
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
		scopeKey: text("scope_key")
			.generatedAlwaysAs(() => sql`coalesce("tenant_id", 'platform')`)
			.notNull(),
		scopeType: text("scope_type").default("Tenant").notNull(),
		sourceChannel: text("source_channel"),
		status: text("status").default("pending").notNull(),
		tenantId: text("tenant_id"),
		terminalReason: text("terminal_reason"),
		traceId: text("trace_id"),
	},
	(table) => [
		index("platform_event_outbox_delivery_idx").on(
			table.status,
			table.nextAttemptAt,
			table.deliverySequence
		),
		index("platform_event_outbox_stream_idx").on(
			table.scopeKey,
			table.producerNamespace,
			table.aggregateId,
			table.deliverySequence
		),
		index("platform_event_outbox_tenant_idx").on(
			table.tenantId,
			table.occurredAt
		),
		check(
			"platform_event_outbox_scope_ck",
			sql`(${table.scopeType} = 'Tenant' AND ${table.tenantId} IS NOT NULL AND ${table.scopeKey} = ${table.tenantId}) OR (${table.scopeType} = 'Platform' AND ${table.tenantId} IS NULL AND ${table.organizationId} IS NULL AND ${table.legalEntityId} IS NULL AND ${table.locationId} IS NULL AND ${table.scopeKey} = 'platform')`
		),
		check(
			"platform_event_outbox_delivery_status_ck",
			sql`${table.status} IN ('pending', 'claimed', 'retrying', 'delivered', 'dead_lettered')`
		),
		check(
			"platform_event_outbox_attempt_count_ck",
			sql`${table.attemptCount} >= 0 AND ${table.attemptCount} <= 20`
		),
		check(
			"platform_event_outbox_claim_pair_ck",
			sql`(${table.claimTokenDigest} IS NULL AND ${table.claimedAt} IS NULL AND ${table.leaseExpiresAt} IS NULL) OR (${table.claimTokenDigest} IS NOT NULL AND ${table.claimedAt} IS NOT NULL AND ${table.leaseExpiresAt} IS NOT NULL AND ${table.leaseExpiresAt} > ${table.claimedAt})`
		),
		uniqueIndex("platform_event_outbox_logical_idempotency_uidx")
			.on(table.scopeType, table.scopeKey, table.name, table.idempotencyKey)
			.where(sql`${table.idempotencyKey} is not null`),
		unique("platform_event_outbox_tenant_reference_uq").on(
			table.id,
			table.tenantId
		),
	]
);
