import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const auditRecord = pgTable(
	"platform_audit_record",
	{
		action: text("action").notNull(),
		actorPartyId: text("actor_party_id"),
		actorType: text("actor_type").notNull(),
		actorUserId: text("actor_user_id"),
		approvalId: text("approval_id"),
		causationId: text("causation_id"),
		changeSummary: jsonb("change_summary"),
		classification: text("classification").notNull(),
		correlationId: text("correlation_id").notNull(),
		delegationId: text("delegation_id"),
		id: text("id").primaryKey(),
		legalHoldId: text("legal_hold_id"),
		locationId: text("location_id"),
		metadata: jsonb("metadata").notNull(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		organizationId: text("organization_id"),
		originalActorId: text("original_actor_id"),
		outcome: text("outcome").notNull(),
		previousHash: text("previous_hash"),
		privacyCaseId: text("privacy_case_id"),
		privacyTransformationVersion: text("privacy_transformation_version"),
		reasonCode: text("reason_code"),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		recordHash: text("record_hash").notNull(),
		retentionClass: text("retention_class").notNull(),
		retentionUntil: timestamp("retention_until", { withTimezone: true }),
		scopeKey: text("scope_key").notNull(),
		scopeType: text("scope_type").notNull(),
		sequence: integer("sequence").notNull(),
		sourceChannel: text("source_channel").notNull(),
		sourceEventId: text("source_event_id"),
		targetId: text("target_id"),
		targetType: text("target_type").notNull(),
		tenantId: text("tenant_id"),
	},
	(table) => [
		check(
			"platform_audit_record_scope_ck",
			sql`(${table.scopeType} = 'Tenant' AND ${table.tenantId} IS NOT NULL AND ${table.scopeKey} = ${table.tenantId}) OR (${table.scopeType} = 'Platform' AND ${table.tenantId} IS NULL AND ${table.organizationId} IS NULL AND ${table.locationId} IS NULL AND ${table.scopeKey} = 'platform')`
		),
		index("platform_audit_record_tenant_occurred_idx").on(
			table.tenantId,
			table.occurredAt
		),
		index("platform_audit_record_tenant_actor_idx").on(
			table.tenantId,
			table.actorUserId
		),
		uniqueIndex("platform_audit_record_scope_sequence_uidx").on(
			table.scopeKey,
			table.sequence
		),
		uniqueIndex("platform_audit_record_hash_uidx").on(table.recordHash),
		uniqueIndex("platform_audit_record_source_event_uidx")
			.on(table.sourceEventId)
			.where(sql`${table.sourceEventId} is not null`),
	]
);

export const auditPrivacyOverlay = pgTable(
	"platform_audit_privacy_overlay",
	{
		id: text("id").primaryKey(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		privacyCaseId: text("privacy_case_id").notNull(),
		pseudonym: text("pseudonym").notNull(),
		scopeKey: text("scope_key").notNull(),
		subjectDigest: text("subject_digest").notNull(),
		subjectType: text("subject_type").notNull(),
		transformationVersion: text("transformation_version").notNull(),
	},
	(table) => [
		uniqueIndex("platform_audit_privacy_subject_uidx").on(
			table.scopeKey,
			table.subjectType,
			table.subjectDigest
		),
	]
);
