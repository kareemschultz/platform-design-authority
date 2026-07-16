import { sql } from "drizzle-orm";
import {
	bigint,
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
		currentValue: bigint("current_value", { mode: "bigint" })
			.default(sql`0`)
			.notNull(),
		gapPolicy: text("gap_policy"),
		id: text("id").notNull(),
		increment: integer("increment").default(1).notNull(),
		nextValue: bigint("next_value", { mode: "bigint" })
			.default(sql`1`)
			.notNull(),
		organizationId: text("organization_id").notNull(),
		ownerNamespace: text("owner_namespace").notNull(),
		padding: integer("padding").default(6).notNull(),
		prefix: text("prefix").default("").notNull(),
		recordType: text("record_type").notNull(),
		resetPolicy: text("reset_policy").default("None").notNull(),
		sequenceKey: text("sequence_key").notNull(),
		state: text("state").default("Active").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
		version: integer("version").default(1).notNull(),
		voidPolicy: text("void_policy"),
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
			sql`${table.padding} >= 1 AND ${table.padding} <= 18`
		),
		check(
			"platform_number_sequence_prototype_policy_ck",
			sql`${table.increment} = 1 AND ${table.resetPolicy} = 'None'`
		),
		check(
			"platform_number_sequence_contract_ck",
			sql`length(${table.sequenceKey}) BETWEEN 1 AND 100 AND length(${table.ownerNamespace}) BETWEEN 1 AND 100 AND length(${table.recordType}) BETWEEN 1 AND 100 AND length(${table.prefix}) <= 50 AND (${table.gapPolicy} IS NULL OR length(${table.gapPolicy}) BETWEEN 1 AND 100) AND (${table.voidPolicy} IS NULL OR length(${table.voidPolicy}) BETWEEN 1 AND 100)`
		),
		check("platform_number_sequence_version_ck", sql`${table.version} > 0`),
	]
);

export const numberAllocations = pgTable(
	"platform_number_allocation",
	{
		allocatedByUserId: text("allocated_by_user_id").notNull(),
		businessRecordId: text("business_record_id"),
		classification: text("classification").default("Confidential").notNull(),
		counterValue: bigint("counter_value", { mode: "bigint" }).notNull(),
		id: text("id").notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
		organizationId: text("organization_id").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		sequenceId: text("sequence_id").notNull(),
		sequenceKey: text("sequence_key").notNull(),
		sequenceVersion: integer("sequence_version").notNull(),
		sourceCommandId: text("source_command_id").notNull(),
		state: text("state").default("Issued").notNull(),
		tenantId: text("tenant_id").notNull(),
		value: text("value").notNull(),
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
			table.counterValue
		),
		uniqueIndex("platform_number_allocation_idempotency_uidx").on(
			table.tenantId,
			table.sequenceId,
			table.idempotencyKey
		),
		index("platform_number_allocation_lookup_idx").on(
			table.tenantId,
			table.organizationId,
			table.value
		),
		check(
			"platform_number_allocation_counter_ck",
			sql`${table.counterValue} > 0 AND ${table.sequenceVersion} > 0`
		),
		check(
			"platform_number_allocation_state_ck",
			sql`${table.state} = 'Issued'`
		),
		check(
			"platform_number_allocation_source_ck",
			sql`length(${table.sourceCommandId}) BETWEEN 1 AND 128`
		),
		check(
			"platform_number_allocation_contract_ck",
			sql`length(${table.sequenceKey}) BETWEEN 1 AND 100 AND length(${table.value}) BETWEEN 1 AND 100 AND (${table.businessRecordId} IS NULL OR length(${table.businessRecordId}) BETWEEN 1 AND 128)`
		),
	]
);
