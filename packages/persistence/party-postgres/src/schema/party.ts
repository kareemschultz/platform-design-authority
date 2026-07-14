import {
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

const auditColumns = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
};

export const parties = pgTable(
	"party_record",
	{
		...auditColumns,
		classification: text("classification").default("Confidential").notNull(),
		displayName: text("display_name").notNull(),
		id: text("id").notNull(),
		privacyState: text("privacy_state").default("Normal").notNull(),
		provenance: text("provenance").notNull(),
		state: text("state").default("Active").notNull(),
		tenantId: text("tenant_id").notNull(),
		type: text("type").notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "party_record_pk",
		}),
		index("party_record_tenant_name_idx").on(table.tenantId, table.displayName),
	]
);

export const personDetails = pgTable(
	"party_person_detail",
	{
		partyId: text("party_id").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.partyId],
			name: "party_person_detail_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.partyId],
			foreignColumns: [parties.tenantId, parties.id],
			name: "party_person_detail_party_fk",
		}).onDelete("cascade"),
	]
);

export const organizationDetails = pgTable(
	"party_organization_detail",
	{
		partyId: text("party_id").notNull(),
		registeredName: text("registered_name"),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.partyId],
			name: "party_organization_detail_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.partyId],
			foreignColumns: [parties.tenantId, parties.id],
			name: "party_organization_detail_party_fk",
		}).onDelete("cascade"),
	]
);

export const contactPoints = pgTable(
	"party_contact_point",
	{
		classification: text("classification").default("Confidential").notNull(),
		displayValue: text("display_value").notNull(),
		id: text("id").notNull(),
		normalizedValue: text("normalized_value").notNull(),
		partyId: text("party_id").notNull(),
		retentionClass: text("retention_class").default("party-profile").notNull(),
		tenantId: text("tenant_id").notNull(),
		type: text("type").notNull(),
		verificationState: text("verification_state")
			.default("Unverified")
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "party_contact_point_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.partyId],
			foreignColumns: [parties.tenantId, parties.id],
			name: "party_contact_point_party_fk",
		}).onDelete("cascade"),
		index("party_contact_point_tenant_party_idx").on(
			table.tenantId,
			table.partyId
		),
	]
);

export const identityLinks = pgTable(
	"party_identity_link",
	{
		authUserId: text("auth_user_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		id: text("id").notNull(),
		membershipId: text("membership_id").notNull(),
		organizationId: text("organization_id").notNull(),
		partyId: text("party_id").notNull(),
		provenance: text("provenance").notNull(),
		state: text("state").default("Active").notNull(),
		tenantId: text("tenant_id").notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "party_identity_link_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.partyId],
			foreignColumns: [parties.tenantId, parties.id],
			name: "party_identity_link_party_fk",
		}).onDelete("restrict"),
		uniqueIndex("party_identity_link_tenant_membership_uidx").on(
			table.tenantId,
			table.membershipId
		),
		index("party_identity_link_tenant_user_idx").on(
			table.tenantId,
			table.authUserId
		),
	]
);

export const commandReceipts = pgTable(
	"party_command_receipt",
	{
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		resourceId: text("resource_id").notNull(),
		result: jsonb("result").$type<unknown>().notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "party_command_receipt_pk",
		}),
		index("party_command_receipt_resource_idx").on(
			table.tenantId,
			table.operation,
			table.resourceId
		),
	]
);
