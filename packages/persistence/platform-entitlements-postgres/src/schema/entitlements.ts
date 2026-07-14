import { sql } from "drizzle-orm";
import {
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const entitlements = pgTable(
	"platform_entitlement",
	{
		capabilityId: text("capability_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		dependencies: text("dependencies").array().default([]).notNull(),
		endsAt: timestamp("ends_at", { withTimezone: true }),
		exclusions: text("exclusions").array().default([]).notNull(),
		id: text("id").notNull(),
		limits: jsonb("limits")
			.$type<Record<string, number>>()
			.default({})
			.notNull(),
		organizationId: text("organization_id"),
		scopeKey: text("scope_key").notNull(),
		source: text("source").notNull(),
		startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
		state: text("state").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_entitlement_pk",
		}),
		uniqueIndex("platform_entitlement_scope_capability_uidx").on(
			table.tenantId,
			table.scopeKey,
			table.capabilityId
		),
		index("platform_entitlement_tenant_state_idx").on(
			table.tenantId,
			table.state
		),
		check(
			"platform_entitlement_scope_key_check",
			sql`${table.scopeKey} = coalesce(${table.organizationId}, '__tenant__')`
		),
		check(
			"platform_entitlement_dates_check",
			sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`
		),
		check("platform_entitlement_version_check", sql`${table.version} > 0`),
	]
);

export const entitlementChanges = pgTable(
	"platform_entitlement_change",
	{
		actorId: text("actor_id").notNull(),
		changedFields: text("changed_fields").array().notNull(),
		entitlementId: text("entitlement_id").notNull(),
		entitlementVersion: integer("entitlement_version").notNull(),
		id: text("id").notNull(),
		newState: text("new_state").notNull(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		previousState: text("previous_state"),
		reason: text("reason").notNull(),
		snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_entitlement_change_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.entitlementId],
			foreignColumns: [entitlements.tenantId, entitlements.id],
			name: "platform_entitlement_change_entitlement_fk",
		}).onDelete("restrict"),
		index("platform_entitlement_change_history_idx").on(
			table.tenantId,
			table.entitlementId,
			table.entitlementVersion
		),
	]
);

export const entitlementCommandReceipts = pgTable(
	"platform_entitlement_command_receipt",
	{
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		resourceId: text("resource_id").notNull(),
		result: jsonb("result").$type<Record<string, unknown>>().notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "platform_entitlement_command_receipt_pk",
		}),
	]
);
