import { sql } from "drizzle-orm";
import {
	check,
	foreignKey,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const numberSequences = pgTable(
	"platform_number_sequence",
	{
		classification: text("classification").default("Confidential").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		currentValue: integer("current_value").default(0).notNull(),
		id: text("id").notNull(),
		nextValue: integer("next_value").default(1).notNull(),
		organizationId: text("organization_id").notNull(),
		padding: integer("padding").default(6).notNull(),
		prefix: text("prefix").default("").notNull(),
		sequenceKey: text("sequence_key").notNull(),
		state: text("state").default("Active").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_number_sequence_pk",
		}),
		uniqueIndex("platform_number_sequence_key_uidx").on(
			table.tenantId,
			table.organizationId,
			table.sequenceKey
		),
		check(
			"platform_number_sequence_state_ck",
			sql`${table.state} IN ('Active','Suspended')`
		),
		check(
			"platform_number_sequence_value_ck",
			sql`${table.currentValue} >= 0 AND ${table.nextValue} > ${table.currentValue}`
		),
		check(
			"platform_number_sequence_padding_ck",
			sql`${table.padding} >= 1 AND ${table.padding} <= 20`
		),
		check("platform_number_sequence_version_ck", sql`${table.version} > 0`),
	]
);

export const numberAllocations = pgTable(
	"platform_number_allocation",
	{
		allocatedAt: timestamp("allocated_at", { withTimezone: true }).notNull(),
		allocatedByUserId: text("allocated_by_user_id").notNull(),
		classification: text("classification").default("Confidential").notNull(),
		formattedValue: text("formatted_value").notNull(),
		id: text("id").notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		organizationId: text("organization_id").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		sequenceId: text("sequence_id").notNull(),
		tenantId: text("tenant_id").notNull(),
		value: integer("value").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_number_allocation_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.sequenceId],
			foreignColumns: [numberSequences.tenantId, numberSequences.id],
			name: "platform_number_allocation_sequence_fk",
		}),
		uniqueIndex("platform_number_allocation_value_uidx").on(
			table.tenantId,
			table.sequenceId,
			table.value
		),
		uniqueIndex("platform_number_allocation_idempotency_uidx").on(
			table.tenantId,
			table.sequenceId,
			table.idempotencyKey
		),
		index("platform_number_allocation_lookup_idx").on(
			table.tenantId,
			table.organizationId,
			table.formattedValue
		),
		check("platform_number_allocation_value_ck", sql`${table.value} > 0`),
	]
);
