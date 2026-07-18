import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	CashMovementNetTotals,
	CashMovementRecord,
	PosCommandReceipt,
	PosRepository,
	PriceOverrideRecord,
	ReceiptRecord,
	RefundRecord,
	RegisterSessionRecord,
	ReturnLineRecord,
	ReturnRecord,
	SaleLineRecord,
	SaleRecord,
} from "@meridian/domain-pos";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	posCashMovements,
	posCommandReceipts,
	posPriceOverrides,
	posReceipts,
	posRefunds,
	posRegisterSessions,
	posReturnLines,
	posReturns,
	posSaleLines,
	posSales,
} from "./schema";

export type PosPostgresConnection = Pool | PoolClient;
export const POS_MIGRATION_TABLE = "pos_migrations";

function isUniqueViolation(error: unknown, indexName: string): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}
	if (
		"code" in error &&
		(error as { code?: unknown }).code === "23505" &&
		"constraint" in error &&
		(error as { constraint?: unknown }).constraint === indexName
	) {
		return true;
	}
	return "cause" in error && isUniqueViolation(error.cause, indexName);
}

function mapSession(
	row: typeof posRegisterSessions.$inferSelect
): RegisterSessionRecord {
	return {
		closedAt: row.closedAt,
		closedByActorUserId: row.closedByActorUserId,
		closedByPartyId: row.closedByPartyId,
		closeReason: row.closeReason,
		closeRequestedAt: row.closeRequestedAt,
		countedCashMinor: row.countedCashMinor,
		createdAt: row.createdAt,
		currency: row.currency,
		expectedCashMinor: row.expectedCashMinor,
		id: row.id,
		locationId: row.locationId,
		openedAt: row.openedAt,
		openedByActorUserId: row.openedByActorUserId,
		openedByPartyId: row.openedByPartyId,
		openingFloatMinor: row.openingFloatMinor,
		organizationId: row.organizationId,
		registerId: row.registerId,
		state: row.state as RegisterSessionRecord["state"],
		tenantId: row.tenantId,
		updatedAt: row.updatedAt,
		varianceApprovalRequired: row.varianceApprovalRequired,
		varianceApprovedAt: row.varianceApprovedAt,
		varianceApprovedByActorUserId: row.varianceApprovedByActorUserId,
		varianceApprovedByPartyId: row.varianceApprovedByPartyId,
		varianceMinor: row.varianceMinor,
		version: row.version,
	};
}

function mapMovement(
	row: typeof posCashMovements.$inferSelect
): CashMovementRecord {
	return {
		actorPartyId: row.actorPartyId,
		actorUserId: row.actorUserId,
		amountMinor: row.amountMinor,
		createdAt: row.createdAt,
		currency: row.currency,
		direction: row.direction as CashMovementRecord["direction"],
		id: row.id,
		note: row.note,
		organizationId: row.organizationId,
		reasonCode: row.reasonCode as CashMovementRecord["reasonCode"],
		referenceId: row.referenceId,
		registerId: row.registerId,
		sessionId: row.sessionId,
		tenantId: row.tenantId,
	};
}

function mapReceipt(
	row: typeof posCommandReceipts.$inferSelect
): PosCommandReceipt {
	return {
		createdAt: row.createdAt,
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as PosCommandReceipt["operation"],
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result,
		tenantId: row.tenantId,
	};
}

function sessionValues(
	record: RegisterSessionRecord
): typeof posRegisterSessions.$inferInsert {
	return record;
}

function movementValues(
	record: CashMovementRecord
): typeof posCashMovements.$inferInsert {
	return record;
}

// ---------------------------------------------------------------------------
// WS3 PR2: Sale, PriceOverride, Receipt mappers and value builders.
// ---------------------------------------------------------------------------

function mapSaleLine(row: typeof posSaleLines.$inferSelect): SaleLineRecord {
	return {
		discountMinor: row.discountMinor,
		grossMinor: row.grossMinor,
		id: row.id,
		inventoryMovementId: row.inventoryMovementId,
		lineTotalMinor: row.lineTotalMinor,
		nonStatutory: row.nonStatutory as true,
		priceOverrideId: row.priceOverrideId,
		priceOverrideState:
			row.priceOverrideState as SaleLineRecord["priceOverrideState"],
		productId: row.productId,
		productName: row.productName,
		quantity: row.quantity,
		taxAmountMinor: row.taxAmountMinor,
		taxableBaseMinor: row.taxableBaseMinor,
		taxCategory: row.taxCategory as SaleLineRecord["taxCategory"],
		unit: row.unit,
		unitPriceMinor: row.unitPriceMinor,
		variantId: row.variantId,
	};
}

function saleLineValues(
	line: SaleLineRecord,
	tenantId: string,
	saleId: string
): typeof posSaleLines.$inferInsert {
	return {
		discountMinor: line.discountMinor,
		grossMinor: line.grossMinor,
		id: line.id,
		inventoryMovementId: line.inventoryMovementId,
		lineTotalMinor: line.lineTotalMinor,
		nonStatutory: line.nonStatutory,
		priceOverrideId: line.priceOverrideId,
		priceOverrideState: line.priceOverrideState,
		productId: line.productId,
		productName: line.productName,
		quantity: line.quantity,
		saleId,
		taxAmountMinor: line.taxAmountMinor,
		taxableBaseMinor: line.taxableBaseMinor,
		taxCategory: line.taxCategory,
		tenantId,
		unit: line.unit,
		unitPriceMinor: line.unitPriceMinor,
		variantId: line.variantId,
	};
}

function mapSaleHeader(
	row: typeof posSales.$inferSelect,
	lines: SaleLineRecord[]
): SaleRecord {
	return {
		changeMinor: row.changeMinor,
		completedAt: row.completedAt,
		createdAt: row.createdAt,
		createdByActorUserId: row.createdByActorUserId,
		createdByPartyId: row.createdByPartyId,
		currency: row.currency,
		customerPartyId: row.customerPartyId,
		discountMinor: row.discountMinor,
		grossMinor: row.grossMinor,
		heldAt: row.heldAt,
		id: row.id,
		lines,
		locationId: row.locationId,
		organizationId: row.organizationId,
		receiptId: row.receiptId,
		registerId: row.registerId,
		sessionId: row.sessionId,
		state: row.state as SaleRecord["state"],
		taxMinor: row.taxMinor,
		tenantId: row.tenantId,
		tenderedMinor: row.tenderedMinor,
		tendersMinor: row.tendersMinor as SaleRecord["tendersMinor"],
		totalMinor: row.totalMinor,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function saleHeaderValues(record: SaleRecord): typeof posSales.$inferInsert {
	return {
		changeMinor: record.changeMinor,
		completedAt: record.completedAt,
		createdAt: record.createdAt,
		createdByActorUserId: record.createdByActorUserId,
		createdByPartyId: record.createdByPartyId,
		currency: record.currency,
		customerPartyId: record.customerPartyId,
		discountMinor: record.discountMinor,
		grossMinor: record.grossMinor,
		heldAt: record.heldAt,
		id: record.id,
		locationId: record.locationId,
		organizationId: record.organizationId,
		receiptId: record.receiptId,
		registerId: record.registerId,
		sessionId: record.sessionId,
		state: record.state,
		taxMinor: record.taxMinor,
		tenantId: record.tenantId,
		tenderedMinor: record.tenderedMinor,
		tendersMinor: record.tendersMinor,
		totalMinor: record.totalMinor,
		updatedAt: record.updatedAt,
		version: record.version,
	};
}

function mapPriceOverride(
	row: typeof posPriceOverrides.$inferSelect
): PriceOverrideRecord {
	return {
		approvedAt: row.approvedAt,
		approvedByActorUserId: row.approvedByActorUserId,
		approvedByPartyId: row.approvedByPartyId,
		currency: row.currency,
		id: row.id,
		lineId: row.lineId,
		organizationId: row.organizationId,
		reason: row.reason,
		requestedAt: row.requestedAt,
		requestedByActorUserId: row.requestedByActorUserId,
		requestedByPartyId: row.requestedByPartyId,
		requestedPriceMinor: row.requestedPriceMinor,
		saleId: row.saleId,
		state: row.state as PriceOverrideRecord["state"],
		tenantId: row.tenantId,
		version: row.version,
	};
}

function priceOverrideValues(
	record: PriceOverrideRecord
): typeof posPriceOverrides.$inferInsert {
	return record;
}

function mapSaleReceipt(row: typeof posReceipts.$inferSelect): ReceiptRecord {
	return {
		cashierPartyId: row.cashierPartyId,
		createdAt: row.createdAt,
		currency: row.currency,
		id: row.id,
		issuedAt: row.issuedAt,
		kind: row.kind as ReceiptRecord["kind"],
		lines: row.lines as unknown as ReceiptRecord["lines"],
		organizationId: row.organizationId,
		originalReceiptId: row.originalReceiptId,
		priceSuppressed: row.priceSuppressed,
		receiptNumber: row.receiptNumber,
		registerId: row.registerId,
		returnId: row.returnId,
		saleId: row.saleId,
		tenantId: row.tenantId,
		tenders: row.tenders as unknown as ReceiptRecord["tenders"],
		totalMinor: row.totalMinor,
	};
}

function saleReceiptValues(
	record: ReceiptRecord
): typeof posReceipts.$inferInsert {
	return {
		...record,
		lines: record.lines as unknown as Record<string, unknown>[],
		tenders: record.tenders as unknown as Record<string, unknown>[],
	};
}

// ---------------------------------------------------------------------------
// WS3 PR3: Return, Refund mappers and value builders.
// ---------------------------------------------------------------------------

function mapReturnLine(
	row: typeof posReturnLines.$inferSelect
): ReturnLineRecord {
	return {
		discountMinor: row.discountMinor,
		grossMinor: row.grossMinor,
		id: row.id,
		lineTotalMinor: row.lineTotalMinor,
		nonStatutory: row.nonStatutory as true,
		productId: row.productId,
		productName: row.productName,
		quantity: row.quantity,
		saleLineId: row.saleLineId,
		taxAmountMinor: row.taxAmountMinor,
		taxableBaseMinor: row.taxableBaseMinor,
		taxCategory: row.taxCategory as ReturnLineRecord["taxCategory"],
		unit: row.unit,
		unitPriceMinor: row.unitPriceMinor,
		variantId: row.variantId,
	};
}

function returnLineValues(
	line: ReturnLineRecord,
	tenantId: string,
	returnId: string
): typeof posReturnLines.$inferInsert {
	return {
		discountMinor: line.discountMinor,
		grossMinor: line.grossMinor,
		id: line.id,
		lineTotalMinor: line.lineTotalMinor,
		nonStatutory: line.nonStatutory,
		productId: line.productId,
		productName: line.productName,
		quantity: line.quantity,
		returnId,
		saleLineId: line.saleLineId,
		taxAmountMinor: line.taxAmountMinor,
		taxableBaseMinor: line.taxableBaseMinor,
		taxCategory: line.taxCategory,
		tenantId,
		unit: line.unit,
		unitPriceMinor: line.unitPriceMinor,
		variantId: line.variantId,
	};
}

function mapReturnHeader(
	row: typeof posReturns.$inferSelect,
	lines: ReturnLineRecord[]
): ReturnRecord {
	return {
		approvedAt: row.approvedAt,
		approvedByActorUserId: row.approvedByActorUserId,
		approvedByPartyId: row.approvedByPartyId,
		createdAt: row.createdAt,
		createdByActorUserId: row.createdByActorUserId,
		createdByPartyId: row.createdByPartyId,
		currency: row.currency,
		exchangeSaleId: row.exchangeSaleId,
		id: row.id,
		lines,
		mode: row.mode as ReturnRecord["mode"],
		organizationId: row.organizationId,
		reason: row.reason,
		receiptId: row.receiptId,
		registerId: row.registerId,
		saleId: row.saleId,
		state: row.state as ReturnRecord["state"],
		tenantId: row.tenantId,
		totalRefundableMinor: row.totalRefundableMinor,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function returnHeaderValues(
	record: ReturnRecord
): typeof posReturns.$inferInsert {
	return {
		approvedAt: record.approvedAt,
		approvedByActorUserId: record.approvedByActorUserId,
		approvedByPartyId: record.approvedByPartyId,
		createdAt: record.createdAt,
		createdByActorUserId: record.createdByActorUserId,
		createdByPartyId: record.createdByPartyId,
		currency: record.currency,
		exchangeSaleId: record.exchangeSaleId,
		id: record.id,
		mode: record.mode,
		organizationId: record.organizationId,
		reason: record.reason,
		receiptId: record.receiptId,
		registerId: record.registerId,
		saleId: record.saleId,
		state: record.state,
		tenantId: record.tenantId,
		totalRefundableMinor: record.totalRefundableMinor,
		updatedAt: record.updatedAt,
		version: record.version,
	};
}

function mapRefund(row: typeof posRefunds.$inferSelect): RefundRecord {
	return {
		amountMinor: row.amountMinor,
		approvedAt: row.approvedAt,
		approvedByActorUserId: row.approvedByActorUserId,
		approvedByPartyId: row.approvedByPartyId,
		cashMovementId: row.cashMovementId,
		createdAt: row.createdAt,
		currency: row.currency,
		id: row.id,
		organizationId: row.organizationId,
		registerId: row.registerId,
		requestedAt: row.requestedAt,
		requestedByActorUserId: row.requestedByActorUserId,
		requestedByPartyId: row.requestedByPartyId,
		returnId: row.returnId,
		state: row.state as RefundRecord["state"],
		tenantId: row.tenantId,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function refundValues(record: RefundRecord): typeof posRefunds.$inferInsert {
	return record;
}

export function createPosRepository(
	connection: PosPostgresConnection
): PosRepository {
	const database = drizzle(connection);

	async function loadSaleLines(
		tenantId: string,
		saleId: string
	): Promise<SaleLineRecord[]> {
		const rows = await database
			.select()
			.from(posSaleLines)
			.where(
				and(
					eq(posSaleLines.tenantId, tenantId),
					eq(posSaleLines.saleId, saleId)
				)
			)
			.orderBy(posSaleLines.createdAt, posSaleLines.id);
		return rows.map(mapSaleLine);
	}

	/** Replaces every line row for a Sale, mirroring
	 * `@meridian/persistence-inventory-postgres`'s `replaceCountLines`
	 * (delete-then-reinsert inside the same transaction) -- the sale's
	 * lines never mutate independently of the sale itself. */
	async function replaceSaleLines(record: SaleRecord): Promise<void> {
		await database
			.delete(posSaleLines)
			.where(
				and(
					eq(posSaleLines.tenantId, record.tenantId),
					eq(posSaleLines.saleId, record.id)
				)
			);
		if (record.lines.length > 0) {
			await database
				.insert(posSaleLines)
				.values(
					record.lines.map((line) =>
						saleLineValues(line, record.tenantId, record.id)
					)
				);
		}
	}

	async function loadReturnLines(
		tenantId: string,
		returnId: string
	): Promise<ReturnLineRecord[]> {
		const rows = await database
			.select()
			.from(posReturnLines)
			.where(
				and(
					eq(posReturnLines.tenantId, tenantId),
					eq(posReturnLines.returnId, returnId)
				)
			)
			.orderBy(posReturnLines.createdAt, posReturnLines.id);
		return rows.map(mapReturnLine);
	}

	return {
		async acquireCommandLock(tenantId, operation, idempotencyKey) {
			const lockIdentity = `${tenantId}${operation}${idempotencyKey}`;
			await database.execute(
				sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockIdentity}, 0))`
			);
		},
		async countPendingPriceOverrides(tenantId, saleId) {
			const rows = await database
				.select({ count: sql<string>`count(*)::text` })
				.from(posPriceOverrides)
				.where(
					and(
						eq(posPriceOverrides.tenantId, tenantId),
						eq(posPriceOverrides.saleId, saleId),
						eq(posPriceOverrides.state, "Pending")
					)
				);
			return Number(rows[0]?.count ?? "0");
		},
		async createCashMovement(record) {
			const rows = await database
				.insert(posCashMovements)
				.values(movementValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS cash movement insert returned no row");
			}
			return mapMovement(row);
		},
		async createPriceOverride(record) {
			const rows = await database
				.insert(posPriceOverrides)
				.values(priceOverrideValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS price override insert returned no row");
			}
			return mapPriceOverride(row);
		},
		async createReceipt(record) {
			const rows = await database
				.insert(posReceipts)
				.values(saleReceiptValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS receipt insert returned no row");
			}
			return mapSaleReceipt(row);
		},
		async createRefund(record) {
			const rows = await database
				.insert(posRefunds)
				.values(refundValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS refund insert returned no row");
			}
			return mapRefund(row);
		},
		async createReturn(record) {
			const rows = await database
				.insert(posReturns)
				.values(returnHeaderValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS return insert returned no row");
			}
			// A Return's lines are inserted ONCE at creation and never
			// replaced (unlike `replaceSaleLines` — a Return, whether
			// created `Pending` via `createReturn` or created already
			// `Completed` via `voidReceipt`, never mutates its own lines
			// after the fact; only header fields transition via
			// `updateReturn`).
			if (record.lines.length > 0) {
				await database
					.insert(posReturnLines)
					.values(
						record.lines.map((line) =>
							returnLineValues(line, record.tenantId, record.id)
						)
					);
			}
			return mapReturnHeader(row, record.lines);
		},
		async createSale(record) {
			const rows = await database
				.insert(posSales)
				.values(saleHeaderValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS sale insert returned no row");
			}
			await replaceSaleLines(record);
			return mapSaleHeader(row, record.lines);
		},
		async getCommandReceipt(tenantId, operation, idempotencyKey) {
			const rows = await database
				.select()
				.from(posCommandReceipts)
				.where(
					and(
						eq(posCommandReceipts.tenantId, tenantId),
						eq(posCommandReceipts.operation, operation),
						eq(posCommandReceipts.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return rows[0] ? mapReceipt(rows[0]) : null;
		},
		async getOpenSession(tenantId, registerId) {
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.registerId, registerId),
						eq(posRegisterSessions.state, "Open")
					)
				)
				.limit(1)
				.for("update");
			return rows[0] ? mapSession(rows[0]) : null;
		},
		async getPriceOverride(tenantId, id) {
			const rows = await database
				.select()
				.from(posPriceOverrides)
				.where(
					and(
						eq(posPriceOverrides.tenantId, tenantId),
						eq(posPriceOverrides.id, id)
					)
				)
				.limit(1);
			return rows[0] ? mapPriceOverride(rows[0]) : null;
		},
		async getReceipt(tenantId, id) {
			const rows = await database
				.select()
				.from(posReceipts)
				.where(and(eq(posReceipts.tenantId, tenantId), eq(posReceipts.id, id)))
				.limit(1);
			return rows[0] ? mapSaleReceipt(rows[0]) : null;
		},
		async getRefund(tenantId, id) {
			const rows = await database
				.select()
				.from(posRefunds)
				.where(and(eq(posRefunds.tenantId, tenantId), eq(posRefunds.id, id)))
				.limit(1)
				.for("update");
			return rows[0] ? mapRefund(rows[0]) : null;
		},
		async getReturn(tenantId, id) {
			const rows = await database
				.select()
				.from(posReturns)
				.where(and(eq(posReturns.tenantId, tenantId), eq(posReturns.id, id)))
				.limit(1)
				.for("update");
			const [row] = rows;
			if (!row) {
				return null;
			}
			const lines = await loadReturnLines(tenantId, id);
			return mapReturnHeader(row, lines);
		},
		async getSale(tenantId, saleId) {
			const rows = await database
				.select()
				.from(posSales)
				.where(and(eq(posSales.tenantId, tenantId), eq(posSales.id, saleId)))
				.limit(1)
				.for("update");
			const [row] = rows;
			if (!row) {
				return null;
			}
			const lines = await loadSaleLines(tenantId, saleId);
			return mapSaleHeader(row, lines);
		},
		async getSession(tenantId, sessionId) {
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.id, sessionId)
					)
				)
				.limit(1)
				.for("update");
			return rows[0] ? mapSession(rows[0]) : null;
		},
		async netCashMovements(
			tenantId,
			sessionId
		): Promise<CashMovementNetTotals> {
			const rows = await database
				.select({
					paidInMinor: sql<string>`coalesce(sum(case when ${posCashMovements.direction} = 'PaidIn' then ${posCashMovements.amountMinor} else 0 end), 0)::text`,
					paidOutMinor: sql<string>`coalesce(sum(case when ${posCashMovements.direction} = 'PaidOut' then ${posCashMovements.amountMinor} else 0 end), 0)::text`,
				})
				.from(posCashMovements)
				.where(
					and(
						eq(posCashMovements.tenantId, tenantId),
						eq(posCashMovements.sessionId, sessionId)
					)
				);
			return {
				paidInMinor: Number(rows[0]?.paidInMinor ?? "0"),
				paidOutMinor: Number(rows[0]?.paidOutMinor ?? "0"),
			};
		},
		async openRegister(record) {
			try {
				const rows = await database
					.insert(posRegisterSessions)
					.values(sessionValues(record))
					.returning();
				const [row] = rows;
				if (!row) {
					throw new Error("POS register session insert returned no row");
				}
				return mapSession(row);
			} catch (error) {
				if (
					isUniqueViolation(error, "pos_register_session_open_register_uidx")
				) {
					return "already_open";
				}
				throw error;
			}
		},
		async recordCommandReceipt(receipt) {
			const rows = await database
				.insert(posCommandReceipts)
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
				throw new Error("POS command receipt conflict could not be loaded");
			}
			return { inserted: false, record: existing };
		},
		async sumReturnedQuantity(tenantId, saleLineId) {
			// Every `pos_return_line` row for a given `saleLineId` counts,
			// regardless of its owning Return's state (`Pending` or
			// `Completed` — the frozen control plan's over-return cap
			// reserves against BOTH, see `PosRepository.sumReturnedQuantity`'s
			// doc comment in `@meridian/domain-pos`). No `Rejected`/denied
			// Return state exists to exclude.
			const rows = await database
				.select({
					total: sql<string>`coalesce(sum(${posReturnLines.quantity}), 0)::text`,
				})
				.from(posReturnLines)
				.where(
					and(
						eq(posReturnLines.tenantId, tenantId),
						eq(posReturnLines.saleLineId, saleLineId)
					)
				);
			return rows[0]?.total ?? "0";
		},
		async updatePriceOverride(record, expectedVersion) {
			const rows = await database
				.update(posPriceOverrides)
				.set(priceOverrideValues(record))
				.where(
					and(
						eq(posPriceOverrides.tenantId, record.tenantId),
						eq(posPriceOverrides.id, record.id),
						eq(posPriceOverrides.version, expectedVersion)
					)
				)
				.returning();
			return rows[0] ? mapPriceOverride(rows[0]) : "version_conflict";
		},
		async updateRefund(record, expectedVersion) {
			const rows = await database
				.update(posRefunds)
				.set(refundValues(record))
				.where(
					and(
						eq(posRefunds.tenantId, record.tenantId),
						eq(posRefunds.id, record.id),
						eq(posRefunds.version, expectedVersion)
					)
				)
				.returning();
			return rows[0] ? mapRefund(rows[0]) : "version_conflict";
		},
		async updateReturn(record, expectedVersion) {
			const rows = await database
				.update(posReturns)
				.set(returnHeaderValues(record))
				.where(
					and(
						eq(posReturns.tenantId, record.tenantId),
						eq(posReturns.id, record.id),
						eq(posReturns.version, expectedVersion)
					)
				)
				.returning();
			const [row] = rows;
			if (!row) {
				return "version_conflict" as const;
			}
			return mapReturnHeader(row, record.lines);
		},
		async updateSale(record, expectedVersion) {
			const rows = await database
				.update(posSales)
				.set(saleHeaderValues(record))
				.where(
					and(
						eq(posSales.tenantId, record.tenantId),
						eq(posSales.id, record.id),
						eq(posSales.version, expectedVersion)
					)
				)
				.returning();
			const [row] = rows;
			if (!row) {
				return "version_conflict" as const;
			}
			await replaceSaleLines(record);
			return mapSaleHeader(row, record.lines);
		},
		async updateSession(record, expectedVersion) {
			const rows = await database
				.update(posRegisterSessions)
				.set(sessionValues(record))
				.where(
					and(
						eq(posRegisterSessions.tenantId, record.tenantId),
						eq(posRegisterSessions.id, record.id),
						eq(posRegisterSessions.version, expectedVersion)
					)
				)
				.returning();
			return rows[0] ? mapSession(rows[0]) : "version_conflict";
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

/**
 * WS3 PR1 gives the POS owner migration stream its first real schema
 * (RegisterSession/CashMovement/command-receipt). Only
 * `apps/server/composition` runs owner migrations (ADR-0027); the worker
 * never calls this.
 */
export async function migratePos(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: POS_MIGRATION_TABLE,
	});
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema";
