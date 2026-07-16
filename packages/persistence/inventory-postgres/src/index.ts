import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	InventoryAdjustmentFilters,
	InventoryAdjustmentRecord,
	InventoryBalanceFilters,
	InventoryBalanceRecord,
	InventoryCommandOperation,
	InventoryCommandReceipt,
	InventoryCountFilters,
	InventoryCountLineRecord,
	InventoryCountRecord,
	InventoryMovementRecord,
	InventoryPage,
	InventoryPageRequest,
	InventoryRepository,
	InventoryReservationRecord,
	InventoryTransferFilters,
	InventoryTransferLineRecord,
	InventoryTransferRecord,
} from "@meridian/domain-inventory";
import { quantityToMinor } from "@meridian/domain-inventory";
import { and, asc, eq, gt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	inventoryAdjustments,
	inventoryCommandReceipts,
	inventoryCountLines,
	inventoryCounts,
	inventoryReservations,
	inventoryStockBalances,
	inventoryStockMovements,
	inventoryTransferLines,
	inventoryTransfers,
} from "./schema";

export type InventoryPostgresConnection = Pool | PoolClient;
export const INVENTORY_MIGRATION_TABLE = "inventory_migrations";

export function createInventoryReconciliationAdapter(
	connection: InventoryPostgresConnection
) {
	return {
		async reconcileTenant(tenantId: string): Promise<void> {
			await connection.query(
				`WITH ledger AS (
				   SELECT tenant_id, location_id, item_key, unit,
				          max(organization_id) AS organization_id,
				          max(product_id) AS product_id,
				          max(variant_id) AS variant_id,
				          sum(quantity) AS on_hand,
				          max(occurred_at) AS as_of,
				          count(*)::integer AS version
				   FROM inventory_stock_movement
				   WHERE tenant_id = $1
				   GROUP BY tenant_id, location_id, item_key, unit
				 )
				 INSERT INTO inventory_stock_balance (
				   tenant_id, location_id, item_key, unit, organization_id,
				   product_id, variant_id, on_hand, as_of, classification,
				   reconciliation_state, version, updated_at
				 )
				 SELECT tenant_id, location_id, item_key, unit, organization_id,
				        product_id, variant_id, on_hand, as_of, 'Confidential',
				        'Current', version, now()
				 FROM ledger
				 WHERE on_hand >= 0
				 ON CONFLICT (tenant_id, location_id, item_key, unit) DO NOTHING`,
				[tenantId]
			);
			await connection.query(
				`UPDATE inventory_stock_balance AS balance
				 SET reconciliation_state = CASE
				       WHEN balance.on_hand = COALESCE((
				         SELECT sum(movement.quantity)
				         FROM inventory_stock_movement AS movement
				         WHERE movement.tenant_id = balance.tenant_id
				           AND movement.location_id = balance.location_id
				           AND movement.item_key = balance.item_key
				           AND movement.unit = balance.unit
				       ), 0) THEN 'Current'
				       ELSE 'RequiresReview'
				     END,
				     updated_at = now()
				 WHERE balance.tenant_id = $1`,
				[tenantId]
			);
			const unresolved = await connection.query<{ count: number }>(
				`WITH ledger AS (
				   SELECT tenant_id, location_id, item_key, unit
				   FROM inventory_stock_movement
				   WHERE tenant_id = $1
				   GROUP BY tenant_id, location_id, item_key, unit
				 )
				 SELECT count(*)::int AS count
				 FROM ledger
				 LEFT JOIN inventory_stock_balance AS balance
				   USING (tenant_id, location_id, item_key, unit)
				 WHERE balance.tenant_id IS NULL`,
				[tenantId]
			);
			if ((unresolved.rows[0]?.count ?? 0) > 0) {
				const error = new Error("inventory reconciliation requires review");
				Object.assign(error, { code: "inventory_projection_divergence" });
				throw error;
			}
		},
	};
}

function isConstraintViolation(error: unknown, constraint: string): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}
	if (
		"code" in error &&
		(error as { code?: unknown }).code === "23514" &&
		"constraint" in error &&
		(error as { constraint?: unknown }).constraint === constraint
	) {
		return true;
	}
	return "cause" in error && isConstraintViolation(error.cause, constraint);
}

function mapBalance(
	row: typeof inventoryStockBalances.$inferSelect
): InventoryBalanceRecord {
	return {
		asOf: row.asOf,
		classification: row.classification as "Confidential",
		itemKey: row.itemKey,
		locationId: row.locationId,
		onHand: row.onHand,
		organizationId: row.organizationId,
		productId: row.productId,
		reconciliationState:
			row.reconciliationState as InventoryBalanceRecord["reconciliationState"],
		tenantId: row.tenantId,
		unit: row.unit,
		updatedAt: row.updatedAt,
		variantId: row.variantId,
		version: row.version,
	};
}

function mapAdjustment(
	row: typeof inventoryAdjustments.$inferSelect
): InventoryAdjustmentRecord {
	return {
		approvedByUserId: row.approvedByUserId,
		classification: row.classification as "Confidential",
		conversionSourceId: row.conversionSourceId,
		createdAt: row.createdAt,
		createdByUserId: row.createdByUserId,
		id: row.id,
		locationId: row.locationId,
		movementId: row.movementId,
		organizationId: row.organizationId,
		postedAt: row.postedAt,
		productId: row.productId,
		quantity: row.quantity,
		reason: row.reason,
		reversalMovementId: row.reversalMovementId,
		state: row.state as InventoryAdjustmentRecord["state"],
		tenantId: row.tenantId,
		unit: row.unit,
		updatedAt: row.updatedAt,
		variantId: row.variantId,
		version: row.version,
	};
}

function mapCountLine(
	row: typeof inventoryCountLines.$inferSelect
): InventoryCountLineRecord {
	return {
		classification: row.classification as "Confidential",
		conversionSourceId: row.conversionSourceId,
		countId: row.countId,
		createdAt: row.createdAt,
		expectedQuantity: row.expectedQuantity,
		id: row.id,
		itemKey: row.itemKey,
		movementId: row.movementId,
		observedQuantity: row.observedQuantity,
		productId: row.productId,
		tenantId: row.tenantId,
		unit: row.unit,
		updatedAt: row.updatedAt,
		varianceQuantity: row.varianceQuantity,
		variantId: row.variantId,
	};
}

function mapTransferLine(
	row: typeof inventoryTransferLines.$inferSelect
): InventoryTransferLineRecord {
	return {
		classification: row.classification as "Confidential",
		conversionSourceId: row.conversionSourceId,
		createdAt: row.createdAt,
		dispatchedQuantity: row.dispatchedQuantity,
		exceptionQuantity: row.exceptionQuantity,
		id: row.id,
		itemKey: row.itemKey,
		productId: row.productId,
		receivedQuantity: row.receivedQuantity,
		requestedQuantity: row.requestedQuantity,
		sourceMovementId: row.sourceMovementId,
		tenantId: row.tenantId,
		transferId: row.transferId,
		unit: row.unit,
		updatedAt: row.updatedAt,
		variantId: row.variantId,
	};
}

function mapReceipt(
	row: typeof inventoryCommandReceipts.$inferSelect
): InventoryCommandReceipt {
	return {
		createdAt: row.createdAt,
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as InventoryCommandOperation,
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result,
		sourceChannel: row.sourceChannel as "api" | "offline",
		sourceCommandId: row.sourceCommandId,
		sourceSequence: row.sourceSequence,
		tenantId: row.tenantId,
	};
}

function movementValues(
	record: InventoryMovementRecord
): typeof inventoryStockMovements.$inferInsert {
	return record;
}

function adjustmentValues(
	record: InventoryAdjustmentRecord
): typeof inventoryAdjustments.$inferInsert {
	return {
		...record,
		itemKey: record.variantId
			? `${record.productId}:${record.variantId}`
			: record.productId,
	};
}

function countValues(
	record: InventoryCountRecord
): typeof inventoryCounts.$inferInsert {
	const { lines: _lines, ...header } = record;
	return header;
}

function countLineValues(
	record: InventoryCountLineRecord
): typeof inventoryCountLines.$inferInsert {
	return record;
}

function transferValues(
	record: InventoryTransferRecord
): typeof inventoryTransfers.$inferInsert {
	const { lines: _lines, ...header } = record;
	return header;
}

function transferLineValues(
	record: InventoryTransferLineRecord
): typeof inventoryTransferLines.$inferInsert {
	return record;
}

export function createInventoryRepository(
	connection: InventoryPostgresConnection
): InventoryRepository {
	const database = drizzle(connection);

	async function loadCount(
		row: typeof inventoryCounts.$inferSelect
	): Promise<InventoryCountRecord> {
		const lines = await database
			.select()
			.from(inventoryCountLines)
			.where(
				and(
					eq(inventoryCountLines.tenantId, row.tenantId),
					eq(inventoryCountLines.countId, row.id)
				)
			)
			.orderBy(asc(inventoryCountLines.id));
		return {
			approvedByUserId: row.approvedByUserId,
			blind: row.blind,
			classification: row.classification as "Confidential",
			createdAt: row.createdAt,
			createdByUserId: row.createdByUserId,
			id: row.id,
			lines: lines.map(mapCountLine),
			locationId: row.locationId,
			organizationId: row.organizationId,
			postedAt: row.postedAt,
			state: row.state as InventoryCountRecord["state"],
			submittedByUserId: row.submittedByUserId,
			tenantId: row.tenantId,
			updatedAt: row.updatedAt,
			version: row.version,
		};
	}

	async function loadTransfer(
		row: typeof inventoryTransfers.$inferSelect
	): Promise<InventoryTransferRecord> {
		const lines = await database
			.select()
			.from(inventoryTransferLines)
			.where(
				and(
					eq(inventoryTransferLines.tenantId, row.tenantId),
					eq(inventoryTransferLines.transferId, row.id)
				)
			)
			.orderBy(asc(inventoryTransferLines.id));
		return {
			classification: row.classification as "Confidential",
			createdAt: row.createdAt,
			createdByUserId: row.createdByUserId,
			destinationLocationId: row.destinationLocationId,
			dispatchedAt: row.dispatchedAt,
			dispatchedByUserId: row.dispatchedByUserId,
			exceptionReason: row.exceptionReason,
			id: row.id,
			lines: lines.map(mapTransferLine),
			organizationId: row.organizationId,
			receivedAt: row.receivedAt,
			receivedByUserId: row.receivedByUserId,
			sourceLocationId: row.sourceLocationId,
			state: row.state as InventoryTransferRecord["state"],
			tenantId: row.tenantId,
			updatedAt: row.updatedAt,
			version: row.version,
		};
	}

	async function replaceCountLines(
		record: InventoryCountRecord
	): Promise<void> {
		await database
			.delete(inventoryCountLines)
			.where(
				and(
					eq(inventoryCountLines.tenantId, record.tenantId),
					eq(inventoryCountLines.countId, record.id)
				)
			);
		if (record.lines.length > 0) {
			await database
				.insert(inventoryCountLines)
				.values(record.lines.map(countLineValues));
		}
	}

	async function replaceTransferLines(
		record: InventoryTransferRecord
	): Promise<void> {
		await database
			.delete(inventoryTransferLines)
			.where(
				and(
					eq(inventoryTransferLines.tenantId, record.tenantId),
					eq(inventoryTransferLines.transferId, record.id)
				)
			);
		if (record.lines.length > 0) {
			await database
				.insert(inventoryTransferLines)
				.values(record.lines.map(transferLineValues));
		}
	}

	return {
		async acquireCommandLock(tenantId, operation, idempotencyKey) {
			const lockIdentity = `${tenantId}\u001f${operation}\u001f${idempotencyKey}`;
			await database.execute(
				sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockIdentity}, 0))`
			);
		},
		async applyMovement(movement) {
			let rows: (typeof inventoryStockBalances.$inferSelect)[];
			try {
				if (quantityToMinor(movement.quantity) < 0n) {
					rows = await database
						.update(inventoryStockBalances)
						.set({
							asOf: movement.occurredAt,
							onHand: sql`${inventoryStockBalances.onHand} + ${movement.quantity}::numeric`,
							organizationId: movement.organizationId,
							productId: movement.productId,
							updatedAt: movement.createdAt,
							variantId: movement.variantId,
							version: sql`${inventoryStockBalances.version} + 1`,
						})
						.where(
							and(
								eq(inventoryStockBalances.tenantId, movement.tenantId),
								eq(inventoryStockBalances.locationId, movement.locationId),
								eq(inventoryStockBalances.itemKey, movement.itemKey),
								eq(inventoryStockBalances.unit, movement.unit),
								sql`${inventoryStockBalances.onHand} + ${movement.quantity}::numeric >= 0`
							)
						)
						.returning();
				} else {
					rows = await database
						.insert(inventoryStockBalances)
						.values({
							asOf: movement.occurredAt,
							classification: "Confidential",
							itemKey: movement.itemKey,
							locationId: movement.locationId,
							onHand: movement.quantity,
							organizationId: movement.organizationId,
							productId: movement.productId,
							reconciliationState: "Current",
							tenantId: movement.tenantId,
							unit: movement.unit,
							updatedAt: movement.createdAt,
							variantId: movement.variantId,
							version: 1,
						})
						.onConflictDoUpdate({
							set: {
								asOf: movement.occurredAt,
								onHand: sql`${inventoryStockBalances.onHand} + ${movement.quantity}::numeric`,
								organizationId: movement.organizationId,
								productId: movement.productId,
								updatedAt: movement.createdAt,
								variantId: movement.variantId,
								version: sql`${inventoryStockBalances.version} + 1`,
							},
							target: [
								inventoryStockBalances.tenantId,
								inventoryStockBalances.locationId,
								inventoryStockBalances.itemKey,
								inventoryStockBalances.unit,
							],
						})
						.returning();
				}
			} catch (error) {
				if (
					isConstraintViolation(
						error,
						"inventory_stock_balance_nonnegative_check"
					)
				) {
					return "negative_stock";
				}
				throw error;
			}
			const [balance] = rows;
			if (!balance) {
				return "negative_stock";
			}
			await database
				.insert(inventoryStockMovements)
				.values(movementValues(movement));
			return { balance: mapBalance(balance), movement };
		},

		async createAdjustment(record) {
			const rows = await database
				.insert(inventoryAdjustments)
				.values(adjustmentValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("Inventory Adjustment insert returned no row");
			}
			return mapAdjustment(row);
		},
		async createCount(record) {
			const rows = await database
				.insert(inventoryCounts)
				.values(countValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("Inventory Count insert returned no row");
			}
			await replaceCountLines(record);
			return loadCount(row);
		},
		async createReservation(record) {
			const rows = await database
				.insert(inventoryReservations)
				.values(record)
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("Inventory Reservation insert returned no row");
			}
			return {
				...row,
				classification: row.classification as "Confidential",
				state: row.state as InventoryReservationRecord["state"],
			};
		},
		async createTransfer(record) {
			const rows = await database
				.insert(inventoryTransfers)
				.values(transferValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("Inventory Transfer insert returned no row");
			}
			await replaceTransferLines(record);
			return loadTransfer(row);
		},

		async getAdjustment(tenantId, id) {
			const rows = await database
				.select()
				.from(inventoryAdjustments)
				.where(
					and(
						eq(inventoryAdjustments.tenantId, tenantId),
						eq(inventoryAdjustments.id, id)
					)
				)
				.limit(1);
			return rows[0] ? mapAdjustment(rows[0]) : null;
		},
		async getBalance(tenantId, locationId, itemKey, unit) {
			const rows = await database
				.select()
				.from(inventoryStockBalances)
				.where(
					and(
						eq(inventoryStockBalances.tenantId, tenantId),
						eq(inventoryStockBalances.locationId, locationId),
						eq(inventoryStockBalances.itemKey, itemKey),
						eq(inventoryStockBalances.unit, unit)
					)
				)
				.limit(1);
			return rows[0] ? mapBalance(rows[0]) : null;
		},
		async getCommandReceipt(tenantId, operation, idempotencyKey) {
			const rows = await database
				.select()
				.from(inventoryCommandReceipts)
				.where(
					and(
						eq(inventoryCommandReceipts.tenantId, tenantId),
						eq(inventoryCommandReceipts.operation, operation),
						eq(inventoryCommandReceipts.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return rows[0] ? mapReceipt(rows[0]) : null;
		},
		async getCount(tenantId, id) {
			const rows = await database
				.select()
				.from(inventoryCounts)
				.where(
					and(
						eq(inventoryCounts.tenantId, tenantId),
						eq(inventoryCounts.id, id)
					)
				)
				.limit(1);
			return rows[0] ? loadCount(rows[0]) : null;
		},
		async getTransfer(tenantId, id) {
			const rows = await database
				.select()
				.from(inventoryTransfers)
				.where(
					and(
						eq(inventoryTransfers.tenantId, tenantId),
						eq(inventoryTransfers.id, id)
					)
				)
				.limit(1);
			return rows[0] ? loadTransfer(rows[0]) : null;
		},

		async listAdjustments(
			tenantId: string,
			page: InventoryPageRequest,
			filters?: InventoryAdjustmentFilters
		): Promise<InventoryPage<InventoryAdjustmentRecord>> {
			const rows = await database
				.select()
				.from(inventoryAdjustments)
				.where(
					and(
						eq(inventoryAdjustments.tenantId, tenantId),
						filters?.locationId
							? eq(inventoryAdjustments.locationId, filters.locationId)
							: undefined,
						filters?.state
							? eq(inventoryAdjustments.state, filters.state)
							: undefined,
						page.cursor ? gt(inventoryAdjustments.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(inventoryAdjustments.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapAdjustment),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		async listBalances(
			tenantId: string,
			page: InventoryPageRequest,
			filters?: InventoryBalanceFilters
		): Promise<InventoryPage<InventoryBalanceRecord>> {
			const [cursorItemKey, cursorLocationId, cursorUnit] =
				page.cursor?.split("\u001f") ?? [];
			const afterCursor = cursorItemKey
				? or(
						gt(inventoryStockBalances.itemKey, cursorItemKey),
						and(
							eq(inventoryStockBalances.itemKey, cursorItemKey),
							gt(inventoryStockBalances.locationId, cursorLocationId ?? "")
						),
						and(
							eq(inventoryStockBalances.itemKey, cursorItemKey),
							eq(inventoryStockBalances.locationId, cursorLocationId ?? ""),
							gt(inventoryStockBalances.unit, cursorUnit ?? "")
						)
					)
				: undefined;
			const rows = await database
				.select()
				.from(inventoryStockBalances)
				.where(
					and(
						eq(inventoryStockBalances.tenantId, tenantId),
						filters?.locationId
							? eq(inventoryStockBalances.locationId, filters.locationId)
							: undefined,
						filters?.productId
							? eq(inventoryStockBalances.productId, filters.productId)
							: undefined,
						afterCursor
					)
				)
				.orderBy(
					asc(inventoryStockBalances.itemKey),
					asc(inventoryStockBalances.locationId),
					asc(inventoryStockBalances.unit)
				)
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapBalance),
				nextCursor:
					rows.length > page.limit
						? [
								rows[page.limit - 1]?.itemKey,
								rows[page.limit - 1]?.locationId,
								rows[page.limit - 1]?.unit,
							].join("\u001f")
						: null,
			};
		},
		async listCounts(
			tenantId: string,
			page: InventoryPageRequest,
			filters?: InventoryCountFilters
		): Promise<InventoryPage<InventoryCountRecord>> {
			const rows = await database
				.select()
				.from(inventoryCounts)
				.where(
					and(
						eq(inventoryCounts.tenantId, tenantId),
						filters?.locationId
							? eq(inventoryCounts.locationId, filters.locationId)
							: undefined,
						filters?.state
							? eq(inventoryCounts.state, filters.state)
							: undefined,
						page.cursor ? gt(inventoryCounts.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(inventoryCounts.id))
				.limit(page.limit + 1);
			const items = await Promise.all(rows.slice(0, page.limit).map(loadCount));
			return {
				items,
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		async listTransfers(
			tenantId: string,
			page: InventoryPageRequest,
			filters?: InventoryTransferFilters
		): Promise<InventoryPage<InventoryTransferRecord>> {
			const rows = await database
				.select()
				.from(inventoryTransfers)
				.where(
					and(
						eq(inventoryTransfers.tenantId, tenantId),
						filters?.locationId
							? or(
									eq(inventoryTransfers.sourceLocationId, filters.locationId),
									eq(
										inventoryTransfers.destinationLocationId,
										filters.locationId
									)
								)
							: undefined,
						filters?.state
							? eq(inventoryTransfers.state, filters.state)
							: undefined,
						page.cursor ? gt(inventoryTransfers.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(inventoryTransfers.id))
				.limit(page.limit + 1);
			const items = await Promise.all(
				rows.slice(0, page.limit).map(loadTransfer)
			);
			return {
				items,
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		async rebuildBalances(tenantId, rebuiltAt) {
			await database
				.delete(inventoryStockBalances)
				.where(eq(inventoryStockBalances.tenantId, tenantId));
			const result = await database.execute(sql`
				INSERT INTO inventory_stock_balance (
					tenant_id, location_id, item_key, unit, organization_id,
					product_id, variant_id, on_hand, as_of, classification,
					reconciliation_state, version, updated_at
				)
				SELECT tenant_id, location_id, item_key, unit, max(organization_id),
					max(product_id), max(variant_id), sum(quantity), max(occurred_at),
					'Confidential', 'Current', count(*)::integer, ${rebuiltAt}
				FROM inventory_stock_movement
				WHERE tenant_id = ${tenantId}
				GROUP BY tenant_id, location_id, item_key, unit
				RETURNING tenant_id
			`);
			return result.rowCount ?? result.rows.length;
		},

		async recordCommandReceipt(receipt) {
			const rows = await database
				.insert(inventoryCommandReceipts)
				.values(receipt)
				.onConflictDoNothing()
				.returning();
			if (rows[0]) {
				return { inserted: true, record: mapReceipt(rows[0]) };
			}
			const existing = await this.getCommandReceipt(
				receipt.tenantId,
				receipt.operation,
				receipt.idempotencyKey
			);
			if (!existing) {
				throw new Error(
					"Inventory command receipt conflict could not be loaded"
				);
			}
			return { inserted: false, record: existing };
		},
		async releaseReservation(input) {
			const rows = await database
				.update(inventoryReservations)
				.set({
					reason: input.reason,
					releasedAt: input.releasedAt,
					state: "Released",
					updatedAt: input.releasedAt,
					version: input.version + 1,
				})
				.where(
					and(
						eq(inventoryReservations.tenantId, input.tenantId),
						eq(inventoryReservations.id, input.id),
						eq(inventoryReservations.state, "Active"),
						eq(inventoryReservations.version, input.version)
					)
				)
				.returning();
			const [row] = rows;
			return row
				? {
						...row,
						classification: row.classification as "Confidential",
						state: row.state as InventoryReservationRecord["state"],
					}
				: "version_conflict";
		},
		async reservedQuantity(tenantId, locationId, itemKey, unit, at) {
			const rows = await database
				.select({
					total: sql<string>`coalesce(sum(${inventoryReservations.quantity}), 0)::text`,
				})
				.from(inventoryReservations)
				.where(
					and(
						eq(inventoryReservations.tenantId, tenantId),
						eq(inventoryReservations.locationId, locationId),
						eq(inventoryReservations.itemKey, itemKey),
						eq(inventoryReservations.unit, unit),
						eq(inventoryReservations.state, "Active"),
						sql`(${inventoryReservations.expiresAt} is null or ${inventoryReservations.expiresAt} > ${at})`
					)
				);
			return rows[0]?.total ?? "0";
		},

		async updateAdjustment(record, expectedVersion) {
			const rows = await database
				.update(inventoryAdjustments)
				.set(adjustmentValues(record))
				.where(
					and(
						eq(inventoryAdjustments.tenantId, record.tenantId),
						eq(inventoryAdjustments.id, record.id),
						eq(inventoryAdjustments.version, expectedVersion)
					)
				)
				.returning();
			return rows[0] ? mapAdjustment(rows[0]) : "version_conflict";
		},
		async updateCount(record, expectedVersion) {
			const rows = await database
				.update(inventoryCounts)
				.set(countValues(record))
				.where(
					and(
						eq(inventoryCounts.tenantId, record.tenantId),
						eq(inventoryCounts.id, record.id),
						eq(inventoryCounts.version, expectedVersion)
					)
				)
				.returning();
			const [row] = rows;
			if (!row) {
				return "version_conflict";
			}
			await replaceCountLines(record);
			return loadCount(row);
		},
		async updateTransfer(record, expectedVersion) {
			const rows = await database
				.update(inventoryTransfers)
				.set(transferValues(record))
				.where(
					and(
						eq(inventoryTransfers.tenantId, record.tenantId),
						eq(inventoryTransfers.id, record.id),
						eq(inventoryTransfers.version, expectedVersion)
					)
				)
				.returning();
			const [row] = rows;
			if (!row) {
				return "version_conflict";
			}
			await replaceTransferLines(record);
			return loadTransfer(row);
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migrateInventory(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: INVENTORY_MIGRATION_TABLE,
	});
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema";
