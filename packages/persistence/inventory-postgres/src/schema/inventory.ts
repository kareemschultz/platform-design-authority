import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

const classification = () =>
	text("classification").default("Confidential").notNull();
const createdAt = () =>
	timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
	timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const quantity = (name: string) =>
	numeric(name, { precision: 38, scale: 6 }).notNull();

export const inventoryStockBalances = pgTable(
	"inventory_stock_balance",
	{
		asOf: timestamp("as_of", { withTimezone: true }).notNull(),
		classification: classification(),
		itemKey: text("item_key").notNull(),
		locationId: text("location_id").notNull(),
		onHand: quantity("on_hand"),
		organizationId: text("organization_id").notNull(),
		productId: text("product_id").notNull(),
		reconciliationState: text("reconciliation_state")
			.default("Current")
			.notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		updatedAt: updatedAt(),
		variantId: text("variant_id"),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"inventory_stock_balance_nonnegative_check",
			sql`${table.onHand} >= 0`
		),
		check(
			"inventory_stock_balance_reconciliation_state_check",
			sql`${table.reconciliationState} in ('Current', 'RequiresReview')`
		),
		check("inventory_stock_balance_version_check", sql`${table.version} >= 1`),
		primaryKey({
			columns: [table.tenantId, table.locationId, table.itemKey, table.unit],
			name: "inventory_stock_balance_pk",
		}),
		index("inventory_stock_balance_tenant_product_idx").on(
			table.tenantId,
			table.productId,
			table.locationId
		),
	]
);

export const inventoryStockMovements = pgTable(
	"inventory_stock_movement",
	{
		actorUserId: text("actor_user_id").notNull(),
		causationId: text("causation_id"),
		classification: classification(),
		conversionSourceId: text("conversion_source_id"),
		correlationId: text("correlation_id").notNull(),
		createdAt: createdAt(),
		decisionId: text("decision_id"),
		id: text("id").notNull(),
		itemKey: text("item_key").notNull(),
		locationId: text("location_id").notNull(),
		movementType: text("movement_type").notNull(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		organizationId: text("organization_id").notNull(),
		productId: text("product_id").notNull(),
		quantity: quantity("quantity"),
		reversalOfMovementId: text("reversal_of_movement_id"),
		sourceId: text("source_id").notNull(),
		sourceType: text("source_type").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		variantId: text("variant_id"),
	},
	(table) => [
		check(
			"inventory_stock_movement_type_check",
			sql`${table.movementType} in ('Adjustment', 'CountVariance', 'TransferOut', 'TransferIn', 'Reversal', 'Offline', 'Sale')`
		),
		check(
			"inventory_stock_movement_source_type_check",
			sql`${table.sourceType} in ('Adjustment', 'Count', 'Transfer', 'OfflineCommand', 'Sale')`
		),
		check(
			"inventory_stock_movement_reversal_check",
			sql`(${table.movementType} = 'Reversal' and ${table.reversalOfMovementId} is not null) or (${table.movementType} <> 'Reversal' and ${table.reversalOfMovementId} is null)`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_stock_movement_pk",
		}),
		// Caps an Adjustment's posted movement at exactly one reversal ever
		// (`reverseAdjustment`'s "full reversal only, once" semantics, WS2).
		// WS3 PR3 deliberately EXEMPTS `sourceType = 'Sale'` from this cap:
		// a Sale's single posted movement legitimately gets MULTIPLE,
		// separate compensating `Reversal` movements over time — one per
		// partial Return that references the same original sale line,
		// cumulatively bounded by the quantity check in
		// `@meridian/domain-pos`'s `buildReturnLines`, not by a one-shot DB
		// constraint designed for Adjustment's different (single, full)
		// reversal shape.
		uniqueIndex("inventory_stock_movement_tenant_reversal_uidx")
			.on(table.tenantId, table.reversalOfMovementId)
			.where(
				sql`${table.reversalOfMovementId} is not null and ${table.sourceType} <> 'Sale'`
			),
		index("inventory_stock_movement_tenant_item_time_idx").on(
			table.tenantId,
			table.locationId,
			table.itemKey,
			table.unit,
			table.occurredAt,
			table.id
		),
		index("inventory_stock_movement_tenant_source_idx").on(
			table.tenantId,
			table.sourceType,
			table.sourceId
		),
	]
);

export const inventoryReservations = pgTable(
	"inventory_reservation",
	{
		classification: classification(),
		createdAt: createdAt(),
		createdByUserId: text("created_by_user_id").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		id: text("id").notNull(),
		itemKey: text("item_key").notNull(),
		locationId: text("location_id").notNull(),
		organizationId: text("organization_id").notNull(),
		productId: text("product_id").notNull(),
		quantity: quantity("quantity"),
		reason: text("reason"),
		releasedAt: timestamp("released_at", { withTimezone: true }),
		sourceId: text("source_id"),
		state: text("state").default("Active").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		updatedAt: updatedAt(),
		variantId: text("variant_id"),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check("inventory_reservation_quantity_check", sql`${table.quantity} > 0`),
		check(
			"inventory_reservation_state_check",
			sql`${table.state} in ('Active', 'Released', 'Expired')`
		),
		check(
			"inventory_reservation_release_check",
			sql`(${table.state} = 'Active' and ${table.releasedAt} is null) or (${table.state} <> 'Active')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_reservation_pk",
		}),
		index("inventory_reservation_tenant_item_state_idx").on(
			table.tenantId,
			table.locationId,
			table.itemKey,
			table.unit,
			table.state,
			table.expiresAt
		),
	]
);

export const inventoryAdjustments = pgTable(
	"inventory_adjustment",
	{
		approvedByUserId: text("approved_by_user_id"),
		classification: classification(),
		conversionSourceId: text("conversion_source_id"),
		createdAt: createdAt(),
		createdByUserId: text("created_by_user_id").notNull(),
		id: text("id").notNull(),
		itemKey: text("item_key").notNull(),
		locationId: text("location_id").notNull(),
		movementId: text("movement_id"),
		organizationId: text("organization_id").notNull(),
		postedAt: timestamp("posted_at", { withTimezone: true }),
		productId: text("product_id").notNull(),
		quantity: quantity("quantity"),
		reason: text("reason").notNull(),
		reversalMovementId: text("reversal_movement_id"),
		state: text("state").default("PendingApproval").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		updatedAt: updatedAt(),
		variantId: text("variant_id"),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"inventory_adjustment_state_check",
			sql`${table.state} in ('Draft', 'PendingApproval', 'Approved', 'Posted', 'Reversed', 'Rejected')`
		),
		check(
			"inventory_adjustment_posted_check",
			sql`(${table.state} in ('Posted', 'Reversed') and ${table.movementId} is not null and ${table.postedAt} is not null and ${table.approvedByUserId} is not null) or (${table.state} not in ('Posted', 'Reversed'))`
		),
		check(
			"inventory_adjustment_reversed_check",
			sql`(${table.state} = 'Reversed' and ${table.reversalMovementId} is not null) or (${table.state} <> 'Reversed' and ${table.reversalMovementId} is null)`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_adjustment_pk",
		}),
		index("inventory_adjustment_tenant_state_idx").on(
			table.tenantId,
			table.state,
			table.id
		),
	]
);

export const inventoryCounts = pgTable(
	"inventory_count",
	{
		approvedByUserId: text("approved_by_user_id"),
		blind: boolean("blind").default(true).notNull(),
		classification: classification(),
		createdAt: createdAt(),
		createdByUserId: text("created_by_user_id").notNull(),
		id: text("id").notNull(),
		locationId: text("location_id").notNull(),
		organizationId: text("organization_id").notNull(),
		postedAt: timestamp("posted_at", { withTimezone: true }),
		state: text("state").default("Draft").notNull(),
		submittedByUserId: text("submitted_by_user_id"),
		tenantId: text("tenant_id").notNull(),
		updatedAt: updatedAt(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"inventory_count_state_check",
			sql`${table.state} in ('Draft', 'InProgress', 'Submitted', 'Approved', 'Posted', 'Rejected')`
		),
		check(
			"inventory_count_posted_check",
			sql`(${table.state} = 'Posted' and ${table.postedAt} is not null and ${table.approvedByUserId} is not null) or (${table.state} <> 'Posted')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_count_pk",
		}),
		index("inventory_count_tenant_location_state_idx").on(
			table.tenantId,
			table.locationId,
			table.state,
			table.id
		),
	]
);

export const inventoryCountLines = pgTable(
	"inventory_count_line",
	{
		classification: classification(),
		conversionSourceId: text("conversion_source_id"),
		countId: text("count_id").notNull(),
		createdAt: createdAt(),
		expectedQuantity: numeric("expected_quantity", { precision: 38, scale: 6 }),
		id: text("id").notNull(),
		itemKey: text("item_key").notNull(),
		movementId: text("movement_id"),
		observedQuantity: quantity("observed_quantity"),
		productId: text("product_id").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		updatedAt: updatedAt(),
		varianceQuantity: numeric("variance_quantity", { precision: 38, scale: 6 }),
		variantId: text("variant_id"),
	},
	(table) => [
		check(
			"inventory_count_line_observed_check",
			sql`${table.observedQuantity} >= 0`
		),
		check(
			"inventory_count_line_variance_pair_check",
			sql`(${table.expectedQuantity} is null and ${table.varianceQuantity} is null and ${table.movementId} is null) or (${table.expectedQuantity} is not null and ${table.varianceQuantity} is not null)`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_count_line_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.countId],
			foreignColumns: [inventoryCounts.tenantId, inventoryCounts.id],
			name: "inventory_count_line_count_fk",
		}).onDelete("cascade"),
		uniqueIndex("inventory_count_line_tenant_item_uidx").on(
			table.tenantId,
			table.countId,
			table.itemKey,
			table.unit
		),
	]
);

export const inventoryTransfers = pgTable(
	"inventory_transfer",
	{
		classification: classification(),
		createdAt: createdAt(),
		createdByUserId: text("created_by_user_id").notNull(),
		destinationLocationId: text("destination_location_id").notNull(),
		dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
		dispatchedByUserId: text("dispatched_by_user_id"),
		exceptionReason: text("exception_reason"),
		id: text("id").notNull(),
		organizationId: text("organization_id").notNull(),
		receivedAt: timestamp("received_at", { withTimezone: true }),
		receivedByUserId: text("received_by_user_id"),
		sourceLocationId: text("source_location_id").notNull(),
		state: text("state").default("Draft").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: updatedAt(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"inventory_transfer_locations_check",
			sql`${table.sourceLocationId} <> ${table.destinationLocationId}`
		),
		check(
			"inventory_transfer_state_check",
			sql`${table.state} in ('Draft', 'Dispatched', 'PartiallyReceived', 'Received', 'Exception', 'Cancelled')`
		),
		check(
			"inventory_transfer_exception_check",
			sql`(${table.state} = 'Exception' and ${table.exceptionReason} is not null) or (${table.state} <> 'Exception')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_transfer_pk",
		}),
		index("inventory_transfer_tenant_state_idx").on(
			table.tenantId,
			table.state,
			table.id
		),
	]
);

export const inventoryTransferLines = pgTable(
	"inventory_transfer_line",
	{
		classification: classification(),
		conversionSourceId: text("conversion_source_id"),
		createdAt: createdAt(),
		dispatchedQuantity: quantity("dispatched_quantity"),
		exceptionQuantity: quantity("exception_quantity"),
		id: text("id").notNull(),
		itemKey: text("item_key").notNull(),
		productId: text("product_id").notNull(),
		receivedQuantity: quantity("received_quantity"),
		requestedQuantity: quantity("requested_quantity"),
		sourceMovementId: text("source_movement_id"),
		tenantId: text("tenant_id").notNull(),
		transferId: text("transfer_id").notNull(),
		unit: text("unit").notNull(),
		updatedAt: updatedAt(),
		variantId: text("variant_id"),
	},
	(table) => [
		check(
			"inventory_transfer_line_quantities_check",
			sql`${table.requestedQuantity} > 0 and ${table.dispatchedQuantity} >= 0 and ${table.receivedQuantity} >= 0 and ${table.exceptionQuantity} >= 0 and ${table.dispatchedQuantity} <= ${table.requestedQuantity} and (${table.receivedQuantity} + ${table.exceptionQuantity}) <= ${table.dispatchedQuantity}`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "inventory_transfer_line_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.transferId],
			foreignColumns: [inventoryTransfers.tenantId, inventoryTransfers.id],
			name: "inventory_transfer_line_transfer_fk",
		}).onDelete("cascade"),
		uniqueIndex("inventory_transfer_line_tenant_item_uidx").on(
			table.tenantId,
			table.transferId,
			table.itemKey,
			table.unit
		),
	]
);

export const inventoryCommandReceipts = pgTable(
	"inventory_command_receipt",
	{
		createdAt: createdAt(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		resourceId: text("resource_id").notNull(),
		result: jsonb("result").$type<unknown>().notNull(),
		sourceChannel: text("source_channel").default("api").notNull(),
		sourceCommandId: text("source_command_id"),
		sourceSequence: integer("source_sequence"),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		check(
			"inventory_command_receipt_source_check",
			sql`${table.sourceChannel} in ('api', 'offline')`
		),
		check(
			"inventory_command_receipt_offline_check",
			sql`(${table.sourceChannel} = 'api' and ${table.sourceCommandId} is null and ${table.sourceSequence} is null) or (${table.sourceChannel} = 'offline' and ${table.sourceCommandId} is not null and ${table.sourceSequence} is not null and ${table.sourceSequence} >= 0)`
		),
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "inventory_command_receipt_pk",
		}),
		uniqueIndex("inventory_command_receipt_offline_uidx")
			.on(table.tenantId, table.sourceCommandId)
			.where(sql`${table.sourceCommandId} is not null`),
		index("inventory_command_receipt_resource_idx").on(
			table.tenantId,
			table.operation,
			table.resourceId
		),
	]
);
