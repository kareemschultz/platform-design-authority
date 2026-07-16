import { sql } from "drizzle-orm";
import {
	bigint,
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { eventOutbox } from "./outbox";

export const eventDeliveryAttempt = pgTable(
	"platform_event_delivery_attempt",
	{
		attemptNumber: integer("attempt_number").notNull(),
		consumerId: text("consumer_id").notNull(),
		consumerSchemaVersion: text("consumer_schema_version").notNull(),
		eventId: text("event_id").notNull(),
		finishedAt: timestamp("finished_at", {
			mode: "string",
			withTimezone: true,
		}),
		id: text("id").primaryKey(),
		nextAttemptAt: timestamp("next_attempt_at", {
			mode: "string",
			withTimezone: true,
		}),
		outcome: text("outcome").notNull(),
		reasonCode: text("reason_code"),
		retryDelayMs: integer("retry_delay_ms"),
		startedAt: timestamp("started_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		index("platform_event_delivery_attempt_lookup_idx").on(
			table.tenantId,
			table.eventId,
			table.consumerId,
			table.attemptNumber
		),
		foreignKey({
			columns: [table.eventId, table.tenantId],
			foreignColumns: [eventOutbox.id, eventOutbox.tenantId],
			name: "platform_event_delivery_attempt_scope_fk",
		}).onDelete("restrict"),
		check(
			"platform_event_delivery_attempt_number_ck",
			sql`${table.attemptNumber} > 0 AND ${table.attemptNumber} <= 20`
		),
		check(
			"platform_event_delivery_attempt_outcome_ck",
			sql`${table.outcome} IN ('succeeded', 'retryable_failure', 'terminal_failure')`
		),
		check(
			"platform_event_delivery_attempt_retry_delay_ck",
			sql`${table.retryDelayMs} IS NULL OR (${table.retryDelayMs} >= 0 AND ${table.retryDelayMs} <= 300000)`
		),
	]
);

export const eventDeadLetter = pgTable(
	"platform_event_dead_letter",
	{
		attemptCount: integer("attempt_count").notNull(),
		consumerId: text("consumer_id").notNull(),
		consumerSchemaVersion: text("consumer_schema_version").notNull(),
		deliverySequence: bigint("delivery_sequence", { mode: "bigint" }).notNull(),
		encryptedPayload: text("encrypted_payload"),
		envelopeSummary: jsonb("envelope_summary").notNull(),
		eventId: text("event_id").notNull(),
		expiresAt: timestamp("expires_at", {
			mode: "string",
			withTimezone: true,
		}),
		failureClassification: text("failure_classification").notNull(),
		firstAttemptedAt: timestamp("first_attempted_at", {
			mode: "string",
			withTimezone: true,
		}).notNull(),
		id: text("id").primaryKey(),
		lastAttemptedAt: timestamp("last_attempted_at", {
			mode: "string",
			withTimezone: true,
		}).notNull(),
		payloadKeyReference: text("payload_key_reference"),
		privacyState: text("privacy_state").default("retained").notNull(),
		resolutionCode: text("resolution_code"),
		resolvedAt: timestamp("resolved_at", {
			mode: "string",
			withTimezone: true,
		}),
		retentionClass: text("retention_class").notNull(),
		schemaRef: text("schema_ref").notNull(),
		tenantId: text("tenant_id").notNull(),
		terminalReason: text("terminal_reason").notNull(),
	},
	(table) => [
		uniqueIndex("platform_event_dead_letter_consumer_uidx").on(
			table.eventId,
			table.consumerId,
			table.consumerSchemaVersion
		),
		index("platform_event_dead_letter_review_idx").on(
			table.tenantId,
			table.resolvedAt,
			table.deliverySequence
		),
		foreignKey({
			columns: [table.eventId, table.tenantId],
			foreignColumns: [eventOutbox.id, eventOutbox.tenantId],
			name: "platform_event_dead_letter_scope_fk",
		}).onDelete("restrict"),
		check(
			"platform_event_dead_letter_attempt_count_ck",
			sql`${table.attemptCount} > 0 AND ${table.attemptCount} <= 20`
		),
		check(
			"platform_event_dead_letter_payload_pair_ck",
			sql`(${table.encryptedPayload} IS NULL AND ${table.payloadKeyReference} IS NULL) OR (${table.encryptedPayload} IS NOT NULL AND ${table.payloadKeyReference} IS NOT NULL)`
		),
		check(
			"platform_event_dead_letter_privacy_state_ck",
			sql`${table.privacyState} IN ('retained', 'minimized', 'erased')`
		),
	]
);

export const eventReplayRequest = pgTable(
	"platform_event_replay_request",
	{
		approvedBy: text("approved_by").notNull(),
		auditRecordId: text("audit_record_id").notNull(),
		compatibilityResult: text("compatibility_result").notNull(),
		completedAt: timestamp("completed_at", {
			mode: "string",
			withTimezone: true,
		}),
		consumerId: text("consumer_id").notNull(),
		consumerSchemaVersion: text("consumer_schema_version").notNull(),
		eventNames: jsonb("event_names").notNull(),
		failureCode: text("failure_code"),
		firstSequence: bigint("first_sequence", { mode: "bigint" }).notNull(),
		id: text("id").primaryKey(),
		idempotencyKey: text("idempotency_key").notNull(),
		lastSequence: bigint("last_sequence", { mode: "bigint" }).notNull(),
		permissionDecisionId: text("permission_decision_id").notNull(),
		purpose: text("purpose").notNull(),
		requestedAt: timestamp("requested_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
		requestedBy: text("requested_by").notNull(),
		startedAt: timestamp("started_at", {
			mode: "string",
			withTimezone: true,
		}),
		state: text("state").default("queued").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		uniqueIndex("platform_event_replay_request_idempotency_uidx").on(
			table.tenantId,
			table.idempotencyKey
		),
		unique("platform_event_replay_request_tenant_reference_uq").on(
			table.id,
			table.tenantId
		),
		index("platform_event_replay_request_state_idx").on(
			table.tenantId,
			table.state,
			table.requestedAt
		),
		check(
			"platform_event_replay_request_range_ck",
			sql`${table.firstSequence} > 0 AND ${table.lastSequence} >= ${table.firstSequence} AND (${table.lastSequence} - ${table.firstSequence}) < 1000`
		),
		check(
			"platform_event_replay_request_state_ck",
			sql`${table.state} IN ('queued', 'running', 'completed', 'failed', 'cancelled')`
		),
	]
);

export const eventConsumerReceipt = pgTable(
	"platform_event_consumer_receipt",
	{
		consumerId: text("consumer_id").notNull(),
		consumerSchemaVersion: text("consumer_schema_version").notNull(),
		effectReference: text("effect_reference"),
		eventId: text("event_id").notNull(),
		processedAt: timestamp("processed_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
		replayRequestId: text("replay_request_id"),
		resultCode: text("result_code").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.consumerId, table.eventId, table.consumerSchemaVersion],
			name: "platform_event_consumer_receipt_pk",
		}),
		index("platform_event_consumer_receipt_tenant_idx").on(
			table.tenantId,
			table.processedAt
		),
		foreignKey({
			columns: [table.eventId, table.tenantId],
			foreignColumns: [eventOutbox.id, eventOutbox.tenantId],
			name: "platform_event_consumer_receipt_scope_fk",
		}).onDelete("restrict"),
		foreignKey({
			columns: [table.replayRequestId, table.tenantId],
			foreignColumns: [eventReplayRequest.id, eventReplayRequest.tenantId],
			name: "platform_event_consumer_receipt_replay_scope_fk",
		}).onDelete("restrict"),
	]
);
