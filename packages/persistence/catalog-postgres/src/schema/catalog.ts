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
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";

const auditColumns = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
};

export const catalogProducts = pgTable(
	"catalog_product",
	{
		...auditColumns,
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		archiveReason: text("archive_reason"),
		classification: text("classification").default("Confidential").notNull(),
		id: text("id").notNull(),
		name: text("name").notNull(),
		organizationId: text("organization_id").notNull(),
		state: text("state").default("Draft").notNull(),
		tenantId: text("tenant_id").notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"catalog_product_state_check",
			sql`${table.state} in ('Draft', 'Active', 'Suspended', 'Discontinued', 'Archived')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "catalog_product_pk",
		}),
		index("catalog_product_tenant_name_id_idx").on(
			table.tenantId,
			table.name,
			table.id
		),
		index("catalog_product_tenant_state_id_idx").on(
			table.tenantId,
			table.state,
			table.id
		),
	]
);

export const catalogVariants = pgTable(
	"catalog_variant",
	{
		...auditColumns,
		id: text("id").notNull(),
		name: text("name").notNull(),
		position: integer("position").notNull(),
		productId: text("product_id").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "catalog_variant_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.productId],
			foreignColumns: [catalogProducts.tenantId, catalogProducts.id],
			name: "catalog_variant_product_fk",
		}).onDelete("cascade"),
		unique("catalog_variant_tenant_product_id_key").on(
			table.tenantId,
			table.productId,
			table.id
		),
		index("catalog_variant_tenant_product_position_idx").on(
			table.tenantId,
			table.productId,
			table.position
		),
	]
);

export const catalogIdentifiers = pgTable(
	"catalog_identifier",
	{
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		id: text("id").notNull(),
		normalizationVersion: text("normalization_version").notNull(),
		normalizedValue: text("normalized_value").notNull(),
		productId: text("product_id").notNull(),
		scheme: text("scheme").notNull(),
		tenantId: text("tenant_id").notNull(),
		type: text("type").notNull(),
		uniquenessScope: text("uniqueness_scope").notNull(),
		value: text("value").notNull(),
		variantId: text("variant_id").notNull(),
	},
	(table) => [
		check(
			"catalog_identifier_scheme_check",
			sql`${table.scheme} in ('Tenant', 'GTIN-8', 'GTIN-12', 'GTIN-13', 'GTIN-14')`
		),
		check(
			"catalog_identifier_type_check",
			sql`${table.type} in ('SKU', 'GTIN', 'UPC', 'EAN', 'Alias', 'External')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "catalog_identifier_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.productId, table.variantId],
			foreignColumns: [
				catalogVariants.tenantId,
				catalogVariants.productId,
				catalogVariants.id,
			],
			name: "catalog_identifier_variant_fk",
		}).onDelete("cascade"),
		uniqueIndex("catalog_identifier_tenant_scope_normalized_uidx").on(
			table.tenantId,
			table.uniquenessScope,
			table.normalizedValue
		),
		index("catalog_identifier_tenant_normalized_idx").on(
			table.tenantId,
			table.normalizedValue,
			table.productId
		),
		index("catalog_identifier_tenant_product_idx").on(
			table.tenantId,
			table.productId
		),
	]
);

export const catalogCommandReceipts = pgTable(
	"catalog_product_command_receipt",
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
			name: "catalog_product_command_receipt_pk",
		}),
		index("catalog_product_command_receipt_resource_idx").on(
			table.tenantId,
			table.operation,
			table.resourceId
		),
	]
);
