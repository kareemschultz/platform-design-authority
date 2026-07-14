import { sql } from "drizzle-orm";
import {
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

const auditColumns = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
};

export const tenants = pgTable("platform_tenant", {
	...auditColumns,
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	state: text("state").notNull(),
	version: integer("version").default(1).notNull(),
});

export const organizations = pgTable(
	"platform_organization",
	{
		...auditColumns,
		id: text("id").primaryKey(),
		locale: text("locale"),
		name: text("name").notNull(),
		state: text("state").notNull(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
		timezone: text("timezone"),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		unique("platform_organization_tenant_id_id_key").on(
			table.tenantId,
			table.id
		),
		index("platform_organization_tenant_idx").on(table.tenantId),
	]
);

export const locations = pgTable(
	"platform_location",
	{
		...auditColumns,
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		organizationId: text("organization_id").notNull(),
		state: text("state").notNull(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
		timezone: text("timezone").notNull(),
		type: text("type").notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		unique("platform_location_tenant_id_id_key").on(table.tenantId, table.id),
		foreignKey({
			columns: [table.tenantId, table.organizationId],
			foreignColumns: [organizations.tenantId, organizations.id],
			name: "platform_location_tenant_organization_fk",
		}).onDelete("restrict"),
		index("platform_location_tenant_organization_idx").on(
			table.tenantId,
			table.organizationId
		),
	]
);

export const memberships = pgTable(
	"platform_membership",
	{
		...auditColumns,
		authUserId: text("auth_user_id").notNull(),
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		roleAssignmentIds: jsonb("role_assignment_ids")
			.$type<string[]>()
			.default(sql`'[]'::jsonb`)
			.notNull(),
		state: text("state").notNull(),
		suspensionReason: text("suspension_reason"),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		uniqueIndex("platform_membership_tenant_id_id_uidx").on(
			table.tenantId,
			table.id
		),
		uniqueIndex("platform_membership_tenant_org_user_uidx").on(
			table.tenantId,
			table.organizationId,
			table.authUserId
		),
		foreignKey({
			columns: [table.tenantId, table.organizationId],
			foreignColumns: [organizations.tenantId, organizations.id],
			name: "platform_membership_tenant_organization_fk",
		}).onDelete("restrict"),
		index("platform_membership_tenant_user_idx").on(
			table.tenantId,
			table.authUserId
		),
	]
);

export const invitations = pgTable(
	"platform_membership_invitation",
	{
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		email: text("email").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		failureCode: text("failure_code"),
		id: text("id").primaryKey(),
		idempotencyKey: text("idempotency_key").notNull(),
		inviteeReference: text("invitee_reference").notNull(),
		organizationId: text("organization_id").notNull(),
		partyId: text("party_id"),
		roleIds: jsonb("role_ids").$type<string[]>().notNull(),
		state: text("state").notNull(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("platform_invitation_tenant_idempotency_uidx").on(
			table.tenantId,
			table.idempotencyKey
		),
		foreignKey({
			columns: [table.tenantId, table.organizationId],
			foreignColumns: [organizations.tenantId, organizations.id],
			name: "platform_invitation_tenant_organization_fk",
		}).onDelete("restrict"),
		index("platform_invitation_tenant_email_idx").on(
			table.tenantId,
			table.email
		),
	]
);

export const activeContexts = pgTable(
	"platform_active_context",
	{
		authUserId: text("auth_user_id").notNull(),
		branchId: text("branch_id"),
		contextId: text("id").primaryKey(),
		delegationId: text("delegation_id"),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
		legalEntityId: text("legal_entity_id"),
		locationId: text("location_id"),
		organizationId: text("organization_id").notNull(),
		partyId: text("party_id"),
		sessionId: text("session_id").notNull(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
	},
	(table) => [
		uniqueIndex("platform_active_context_session_idempotency_uidx").on(
			table.sessionId,
			table.idempotencyKey
		),
		foreignKey({
			columns: [table.tenantId, table.organizationId],
			foreignColumns: [organizations.tenantId, organizations.id],
			name: "platform_active_context_tenant_organization_fk",
		}).onDelete("restrict"),
		foreignKey({
			columns: [table.tenantId, table.locationId],
			foreignColumns: [locations.tenantId, locations.id],
			name: "platform_active_context_tenant_location_fk",
		}),
		index("platform_active_context_session_idx").on(table.sessionId),
		index("platform_active_context_tenant_user_idx").on(
			table.tenantId,
			table.authUserId
		),
	]
);

export const commandReceipts = pgTable(
	"platform_tenancy_command_receipt",
	{
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		resourceId: text("resource_id").notNull(),
		result: jsonb("result").$type<Record<string, unknown>>().notNull(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "restrict" }),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "platform_tenancy_command_receipt_pk",
		}),
		index("platform_tenancy_command_resource_idx").on(
			table.tenantId,
			table.operation,
			table.resourceId
		),
	]
);
