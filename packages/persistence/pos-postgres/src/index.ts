import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	CashMovementNetTotals,
	CashMovementRecord,
	DepositRecord,
	PosCommandReceipt,
	PosFinanceHandoffSourceData,
	PosPage,
	PosPageRequest,
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
import { and, asc, eq, gt, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	posCashMovements,
	posCommandReceipts,
	posDepositCustodyTransfers,
	posDepositSourceShifts,
	posDeposits,
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

/** Matches domain-pos's `RETURN_QUANTITY_SCALE` fixed-point convention
 * (WS3 PR4 finance-handoff net-inventory-quantity control total). Postgres
 * returns a `numeric(38,6)` SUM as decimal text; this converts it to the
 * same signed fixed-point integer string scale the domain layer already
 * uses, doing exact integer arithmetic — never binary floating point
 * (CLAUDE.md §7). */
const FINANCE_QUANTITY_SCALE = 1_000_000n;
function decimalTextToScaledQuantity(value: string): bigint {
	const trimmed = value.trim();
	const negative = trimmed.startsWith("-");
	const unsigned = negative ? trimmed.slice(1) : trimmed;
	const [whole = "0", fraction = ""] = unsigned.split(".");
	const fractionPadded = `${fraction}000000`.slice(0, 6);
	const scaled =
		BigInt(whole || "0") * FINANCE_QUANTITY_SCALE + BigInt(fractionPadded);
	return negative ? -scaled : scaled;
}

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

// ---------------------------------------------------------------------------
// WS3 PR4: Deposit mappers and value builders.
// ---------------------------------------------------------------------------

function mapDeposit(
	row: typeof posDeposits.$inferSelect,
	sourceShiftIds: string[]
): DepositRecord {
	return {
		amountMinor: row.amountMinor,
		confirmedAt: row.confirmedAt,
		confirmedByActorUserId: row.confirmedByActorUserId,
		confirmedByPartyId: row.confirmedByPartyId,
		createdAt: row.createdAt,
		currency: row.currency,
		depositReference: row.depositReference,
		id: row.id,
		organizationId: row.organizationId,
		preparedAt: row.preparedAt,
		preparedByActorUserId: row.preparedByActorUserId,
		preparedByPartyId: row.preparedByPartyId,
		sourceShiftIds,
		state: row.state as DepositRecord["state"],
		tenantId: row.tenantId,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function depositValues(record: DepositRecord): typeof posDeposits.$inferInsert {
	return {
		amountMinor: record.amountMinor,
		confirmedAt: record.confirmedAt,
		confirmedByActorUserId: record.confirmedByActorUserId,
		confirmedByPartyId: record.confirmedByPartyId,
		createdAt: record.createdAt,
		currency: record.currency,
		depositReference: record.depositReference,
		id: record.id,
		organizationId: record.organizationId,
		preparedAt: record.preparedAt,
		preparedByActorUserId: record.preparedByActorUserId,
		preparedByPartyId: record.preparedByPartyId,
		state: record.state,
		tenantId: record.tenantId,
		updatedAt: record.updatedAt,
		version: record.version,
	};
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

	async function loadDepositSourceShiftIds(
		tenantId: string,
		depositId: string
	): Promise<string[]> {
		const rows = await database
			.select({ sessionId: posDepositSourceShifts.sessionId })
			.from(posDepositSourceShifts)
			.where(
				and(
					eq(posDepositSourceShifts.tenantId, tenantId),
					eq(posDepositSourceShifts.depositId, depositId)
				)
			)
			.orderBy(posDepositSourceShifts.sessionId);
		return rows.map((row) => row.sessionId);
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

		// -- WS3 PR4: Deposit, Finance handoff -----------------------------------
		async createDeposit(record) {
			const rows = await database
				.insert(posDeposits)
				.values(depositValues(record))
				.returning();
			const [row] = rows;
			if (!row) {
				throw new Error("POS deposit insert returned no row");
			}
			if (record.sourceShiftIds.length > 0) {
				await database.insert(posDepositSourceShifts).values(
					record.sourceShiftIds.map((sessionId) => ({
						depositId: record.id,
						sessionId,
						tenantId: record.tenantId,
					}))
				);
			}
			return mapDeposit(row, record.sourceShiftIds);
		},
		async createDepositCustodyTransfer(record) {
			await database.insert(posDepositCustodyTransfers).values({
				amountMinor: record.amountMinor,
				confirmedByActorUserId: record.confirmedByActorUserId,
				confirmedByPartyId: record.confirmedByPartyId,
				currency: record.currency,
				depositId: record.depositId,
				id: record.id,
				organizationId: record.organizationId,
				postedAt: record.postedAt,
				tenantId: record.tenantId,
			});
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
		async getDeposit(tenantId, organizationId, id) {
			const rows = await database
				.select()
				.from(posDeposits)
				.where(
					and(
						eq(posDeposits.tenantId, tenantId),
						eq(posDeposits.organizationId, organizationId),
						eq(posDeposits.id, id)
					)
				)
				.limit(1)
				.for("update");
			const [row] = rows;
			if (!row) {
				return null;
			}
			const sourceShiftIds = await loadDepositSourceShiftIds(tenantId, id);
			return mapDeposit(row, sourceShiftIds);
		},
		async getOpenSession(tenantId, organizationId, registerId, locationId) {
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						eq(posRegisterSessions.registerId, registerId),
						eq(posRegisterSessions.state, "Open"),
						locationId
							? eq(posRegisterSessions.locationId, locationId)
							: undefined
					)
				)
				.limit(1)
				.for("update");
			return rows[0] ? mapSession(rows[0]) : null;
		},
		async getPriceOverride(tenantId, organizationId, id) {
			const rows = await database
				.select()
				.from(posPriceOverrides)
				.where(
					and(
						eq(posPriceOverrides.tenantId, tenantId),
						eq(posPriceOverrides.organizationId, organizationId),
						eq(posPriceOverrides.id, id)
					)
				)
				.limit(1);
			return rows[0] ? mapPriceOverride(rows[0]) : null;
		},
		async getReceipt(tenantId, organizationId, id) {
			const rows = await database
				.select()
				.from(posReceipts)
				.where(
					and(
						eq(posReceipts.tenantId, tenantId),
						eq(posReceipts.organizationId, organizationId),
						eq(posReceipts.id, id)
					)
				)
				.limit(1);
			return rows[0] ? mapSaleReceipt(rows[0]) : null;
		},
		/** WS3 remediation R3, Finding J: `pos_receipt_tenant_register_number_
		 * uidx` is the actual authoritative uniqueness scope for `receiptNumber`
		 * — (tenantId, registerId, receiptNumber), NOT (tenantId,
		 * organizationId, receiptNumber). `registerId` is REQUIRED here (not
		 * an optional disambiguator) so this can never silently pick an
		 * arbitrary one of several same-numbered receipts across different
		 * registers in the same organization. Both `receiptNumber` and
		 * `registerId` are printed on `ReceiptLayout` (apps/web), so a cashier
		 * reading a physical/on-screen receipt in a genuinely fresh browser
		 * always has both values. `organizationId` is filtered too, matching
		 * every other by-ID lookup's non-disclosing cross-org denial (Finding
		 * B) even though `registerId` alone already implies one organization. */
		async getReceiptByNumber(
			tenantId,
			organizationId,
			registerId,
			receiptNumber
		) {
			const rows = await database
				.select()
				.from(posReceipts)
				.where(
					and(
						eq(posReceipts.tenantId, tenantId),
						eq(posReceipts.organizationId, organizationId),
						eq(posReceipts.registerId, registerId),
						eq(posReceipts.receiptNumber, receiptNumber)
					)
				)
				.limit(1);
			return rows[0] ? mapSaleReceipt(rows[0]) : null;
		},
		async getRefund(tenantId, organizationId, id) {
			const rows = await database
				.select()
				.from(posRefunds)
				.where(
					and(
						eq(posRefunds.tenantId, tenantId),
						eq(posRefunds.organizationId, organizationId),
						eq(posRefunds.id, id)
					)
				)
				.limit(1)
				.for("update");
			return rows[0] ? mapRefund(rows[0]) : null;
		},
		async getReturn(tenantId, organizationId, id) {
			const rows = await database
				.select()
				.from(posReturns)
				.where(
					and(
						eq(posReturns.tenantId, tenantId),
						eq(posReturns.organizationId, organizationId),
						eq(posReturns.id, id)
					)
				)
				.limit(1)
				.for("update");
			const [row] = rows;
			if (!row) {
				return null;
			}
			const lines = await loadReturnLines(tenantId, id);
			return mapReturnHeader(row, lines);
		},
		async getSale(tenantId, organizationId, saleId, locationId) {
			const rows = await database
				.select()
				.from(posSales)
				.where(
					and(
						eq(posSales.tenantId, tenantId),
						eq(posSales.organizationId, organizationId),
						eq(posSales.id, saleId),
						locationId ? eq(posSales.locationId, locationId) : undefined
					)
				)
				.limit(1)
				.for("update");
			const [row] = rows;
			if (!row) {
				return null;
			}
			const lines = await loadSaleLines(tenantId, saleId);
			return mapSaleHeader(row, lines);
		},
		async getSession(tenantId, organizationId, sessionId, locationId) {
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						eq(posRegisterSessions.id, sessionId),
						locationId
							? eq(posRegisterSessions.locationId, locationId)
							: undefined
					)
				)
				.limit(1)
				.for("update");
			return rows[0] ? mapSession(rows[0]) : null;
		},
		/** WS3 remediation R3b, Item 7: org-scoped exactly like `getDeposit`
		 * above; cursor discipline mirrors `listAdjustments` in
		 * `packages/persistence/inventory-postgres` (`gt(id)` … `orderBy
		 * asc(id)` … `limit + 1`). */
		async listDeposits(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: DepositRecord["state"] }
		): Promise<PosPage<DepositRecord>> {
			const rows = await database
				.select()
				.from(posDeposits)
				.where(
					and(
						eq(posDeposits.tenantId, tenantId),
						eq(posDeposits.organizationId, organizationId),
						filters?.state ? eq(posDeposits.state, filters.state) : undefined,
						page.cursor ? gt(posDeposits.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(posDeposits.id))
				.limit(page.limit + 1);
			const pageRows = rows.slice(0, page.limit);
			const items = await Promise.all(
				pageRows.map(async (row) => {
					const sourceShiftIds = await loadDepositSourceShiftIds(
						tenantId,
						row.id
					);
					return mapDeposit(row, sourceShiftIds);
				})
			);
			return {
				items,
				nextCursor:
					rows.length > page.limit ? (pageRows.at(-1)?.id ?? null) : null,
			};
		},
		/** WS3 remediation R3b, Item 7: org-scoped exactly like
		 * `getPriceOverride` above. */
		async listPriceOverrides(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: PriceOverrideRecord["state"] }
		): Promise<PosPage<PriceOverrideRecord>> {
			const rows = await database
				.select()
				.from(posPriceOverrides)
				.where(
					and(
						eq(posPriceOverrides.tenantId, tenantId),
						eq(posPriceOverrides.organizationId, organizationId),
						filters?.state
							? eq(posPriceOverrides.state, filters.state)
							: undefined,
						page.cursor ? gt(posPriceOverrides.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(posPriceOverrides.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapPriceOverride),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		/** WS3 remediation R3b, Item 7: org-scoped exactly like `getRefund`
		 * above. No `.for("update")` — list reads for a queue view are not
		 * part of an approval transaction. */
		async listRefunds(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: RefundRecord["state"] }
		): Promise<PosPage<RefundRecord>> {
			const rows = await database
				.select()
				.from(posRefunds)
				.where(
					and(
						eq(posRefunds.tenantId, tenantId),
						eq(posRefunds.organizationId, organizationId),
						filters?.state ? eq(posRefunds.state, filters.state) : undefined,
						page.cursor ? gt(posRefunds.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(posRefunds.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapRefund),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		/** WS3 remediation R3b, Item 7: org-scoped exactly like `getReturn`
		 * above. Deliberately omits per-item `loadReturnLines` — a queue
		 * listing does not need each return's full line detail, only enough
		 * to let the actor pick the right one before opening the existing
		 * server-derived `getReturn` consequence preview (Finding I). */
		async listReturns(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: { state?: ReturnRecord["state"] }
		): Promise<PosPage<ReturnRecord>> {
			const rows = await database
				.select()
				.from(posReturns)
				.where(
					and(
						eq(posReturns.tenantId, tenantId),
						eq(posReturns.organizationId, organizationId),
						filters?.state ? eq(posReturns.state, filters.state) : undefined,
						page.cursor ? gt(posReturns.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(posReturns.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map((row) => mapReturnHeader(row, [])),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		/** WS3 remediation R3b, Item 7: org- and (optionally) location-scoped
		 * exactly like `getSession` above. No `.for("update")` — list reads
		 * for a queue view are not part of an approval transaction. */
		async listSessions(
			tenantId: string,
			organizationId: string,
			page: PosPageRequest,
			filters?: {
				locationId?: string;
				state?: RegisterSessionRecord["state"];
			}
		): Promise<PosPage<RegisterSessionRecord>> {
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						filters?.locationId
							? eq(posRegisterSessions.locationId, filters.locationId)
							: undefined,
						filters?.state
							? eq(posRegisterSessions.state, filters.state)
							: undefined,
						page.cursor ? gt(posRegisterSessions.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(posRegisterSessions.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapSession),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},
		async lockSessionsForDeposit(
			tenantId,
			organizationId,
			sessionIds,
			locationId
		) {
			if (sessionIds.length === 0) {
				return [];
			}
			const rows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						inArray(posRegisterSessions.id, sessionIds),
						locationId
							? eq(posRegisterSessions.locationId, locationId)
							: undefined
					)
				)
				.orderBy(posRegisterSessions.id)
				.for("update");
			return rows.map(mapSession);
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
		async queryFinanceHandoffSourceData(input) {
			const { organizationId, periodEndUtc, periodStartUtc, tenantId } = input;

			const saleRows = await database
				.select()
				.from(posSales)
				.where(
					and(
						eq(posSales.tenantId, tenantId),
						eq(posSales.organizationId, organizationId),
						eq(posSales.state, "Completed"),
						gte(posSales.completedAt, periodStartUtc),
						lt(posSales.completedAt, periodEndUtc)
					)
				)
				.orderBy(posSales.id);

			// WS3 remediation R1 cycle 2: `reasonCode: "Refund"` now has TWO
			// distinct producers — `approveRefund` (referenceId names a real
			// `pos_refund` row) and `voidReceipt`'s cash reversal (referenceId
			// names the void's `pos_return` row instead; no `pos_refund` row
			// exists for a Void, by design — see `remediation-dispositions.md`
			// "## A" cycle-2 correction). Both belong in this Finance-handoff
			// category (the cash effect is economically identical: cash out,
			// contra-revenue up), but `buildAccountantHandoffPayload`
			// (`@meridian/platform-import-export`) must not mislabel a Void's
			// posting-line `sourceType`/`sourceId` as a `pos_refund` reference
			// that does not exist. The LEFT JOIN distinguishes the two: a
			// matched `posRefunds` row means a real Refund; no match means
			// this reasonCode-"Refund" movement was posted by `voidReceipt`
			// (the only other producer, by construction — no third writer of
			// this reasonCode exists in `packages/domains/pos`).
			const refundRows = await database
				.select({
					amountMinor: posCashMovements.amountMinor,
					createdAt: posCashMovements.createdAt,
					currency: posCashMovements.currency,
					id: posCashMovements.id,
					isVoidReversal: sql<boolean>`${posRefunds.id} is null`,
					referenceId: posCashMovements.referenceId,
				})
				.from(posCashMovements)
				.leftJoin(
					posRefunds,
					and(
						eq(posRefunds.tenantId, posCashMovements.tenantId),
						eq(posRefunds.id, posCashMovements.referenceId)
					)
				)
				.where(
					and(
						eq(posCashMovements.tenantId, tenantId),
						eq(posCashMovements.organizationId, organizationId),
						eq(posCashMovements.reasonCode, "Refund"),
						gte(posCashMovements.createdAt, periodStartUtc),
						lt(posCashMovements.createdAt, periodEndUtc)
					)
				)
				.orderBy(posCashMovements.id);

			const closedVarianceRows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						eq(posRegisterSessions.state, "Closed"),
						ne(posRegisterSessions.varianceMinor, 0),
						gte(posRegisterSessions.closedAt, periodStartUtc),
						lt(posRegisterSessions.closedAt, periodEndUtc)
					)
				)
				.orderBy(posRegisterSessions.id);

			const unresolvedVarianceRows = await database
				.select()
				.from(posRegisterSessions)
				.where(
					and(
						eq(posRegisterSessions.tenantId, tenantId),
						eq(posRegisterSessions.organizationId, organizationId),
						eq(posRegisterSessions.state, "Closing"),
						gte(posRegisterSessions.closeRequestedAt, periodStartUtc),
						lt(posRegisterSessions.closeRequestedAt, periodEndUtc)
					)
				)
				.orderBy(posRegisterSessions.id);

			const preparedDepositRows = await database
				.select()
				.from(posDeposits)
				.where(
					and(
						eq(posDeposits.tenantId, tenantId),
						eq(posDeposits.organizationId, organizationId),
						eq(posDeposits.state, "Prepared"),
						gte(posDeposits.preparedAt, periodStartUtc),
						lt(posDeposits.preparedAt, periodEndUtc)
					)
				)
				.orderBy(posDeposits.id);

			const reconciledDepositRows = await database
				.select()
				.from(posDeposits)
				.where(
					and(
						eq(posDeposits.tenantId, tenantId),
						eq(posDeposits.organizationId, organizationId),
						eq(posDeposits.state, "Reconciled"),
						gte(posDeposits.confirmedAt, periodStartUtc),
						lt(posDeposits.confirmedAt, periodEndUtc)
					)
				)
				.orderBy(posDeposits.id);

			const returnCountRows = await database
				.select({ count: sql<string>`count(*)::text` })
				.from(posReturns)
				.where(
					and(
						eq(posReturns.tenantId, tenantId),
						eq(posReturns.organizationId, organizationId),
						eq(posReturns.state, "Completed"),
						gte(posReturns.approvedAt, periodStartUtc),
						lt(posReturns.approvedAt, periodEndUtc)
					)
				);

			const saleQuantityRows = await database
				.select({
					total: sql<string>`coalesce(sum(${posSaleLines.quantity}), 0)::text`,
				})
				.from(posSaleLines)
				.innerJoin(
					posSales,
					and(
						eq(posSaleLines.tenantId, posSales.tenantId),
						eq(posSaleLines.saleId, posSales.id)
					)
				)
				.where(
					and(
						eq(posSales.tenantId, tenantId),
						eq(posSales.organizationId, organizationId),
						eq(posSales.state, "Completed"),
						gte(posSales.completedAt, periodStartUtc),
						lt(posSales.completedAt, periodEndUtc)
					)
				);

			const returnQuantityRows = await database
				.select({
					total: sql<string>`coalesce(sum(${posReturnLines.quantity}), 0)::text`,
				})
				.from(posReturnLines)
				.innerJoin(
					posReturns,
					and(
						eq(posReturnLines.tenantId, posReturns.tenantId),
						eq(posReturnLines.returnId, posReturns.id)
					)
				)
				.where(
					and(
						eq(posReturns.tenantId, tenantId),
						eq(posReturns.organizationId, organizationId),
						eq(posReturns.state, "Completed"),
						gte(posReturns.approvedAt, periodStartUtc),
						lt(posReturns.approvedAt, periodEndUtc)
					)
				);

			const saleQuantityScaled = decimalTextToScaledQuantity(
				saleQuantityRows[0]?.total ?? "0"
			);
			const returnQuantityScaled = decimalTextToScaledQuantity(
				returnQuantityRows[0]?.total ?? "0"
			);

			const result: PosFinanceHandoffSourceData = {
				closedVariances: closedVarianceRows.map((row) => ({
					currency: row.currency,
					occurredAt: row.closedAt as Date,
					registerId: row.registerId,
					sessionId: row.id,
					varianceMinor: row.varianceMinor as number,
				})),
				netInventoryQuantityScaled: (
					saleQuantityScaled - returnQuantityScaled
				).toString(),
				preparedDeposits: preparedDepositRows.map((row) => ({
					amountMinor: row.amountMinor,
					currency: row.currency,
					depositId: row.id,
					depositReference: row.depositReference,
					occurredAt: row.preparedAt,
				})),
				reconciledDeposits: reconciledDepositRows.map((row) => ({
					amountMinor: row.amountMinor,
					currency: row.currency,
					depositId: row.id,
					depositReference: row.depositReference,
					occurredAt: row.confirmedAt as Date,
				})),
				refunds: refundRows.map((row) => ({
					amountMinor: row.amountMinor,
					currency: row.currency,
					movementId: row.id,
					postedAt: row.createdAt,
					refundId: row.referenceId ?? row.id,
					sourceKind: row.isVoidReversal ? "Void" : "Refund",
				})),
				returnCount: Number(returnCountRows[0]?.count ?? "0"),
				sales: saleRows.map((row) => ({
					completedAt: row.completedAt as Date,
					currency: row.currency,
					discountMinor: row.discountMinor,
					grossMinor: row.grossMinor,
					id: row.id,
					taxMinor: row.taxMinor,
					totalMinor: row.totalMinor,
				})),
				unresolvedVariances: unresolvedVarianceRows.map((row) => ({
					closeRequestedAt: row.closeRequestedAt as Date,
					registerId: row.registerId,
					sessionId: row.id,
				})),
			};
			return result;
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
		async sumReservedDepositsForSessions(
			tenantId,
			sessionIds,
			excludeDepositId
		) {
			if (sessionIds.length === 0) {
				return 0;
			}
			const shiftRows = await database
				.selectDistinct({ depositId: posDepositSourceShifts.depositId })
				.from(posDepositSourceShifts)
				.where(
					and(
						eq(posDepositSourceShifts.tenantId, tenantId),
						inArray(posDepositSourceShifts.sessionId, sessionIds)
					)
				);
			const depositIds = shiftRows
				.map((row) => row.depositId)
				.filter((id) => id !== excludeDepositId);
			if (depositIds.length === 0) {
				return 0;
			}
			const rows = await database
				.select({
					total: sql<string>`coalesce(sum(${posDeposits.amountMinor}), 0)::text`,
				})
				.from(posDeposits)
				.where(
					and(
						eq(posDeposits.tenantId, tenantId),
						inArray(posDeposits.id, depositIds),
						inArray(posDeposits.state, ["Prepared", "Reconciled"])
					)
				);
			return Number(rows[0]?.total ?? "0");
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
		async sumSafeDropForSessions(tenantId, sessionIds) {
			if (sessionIds.length === 0) {
				return 0;
			}
			const rows = await database
				.select({
					total: sql<string>`coalesce(sum(${posCashMovements.amountMinor}), 0)::text`,
				})
				.from(posCashMovements)
				.where(
					and(
						eq(posCashMovements.tenantId, tenantId),
						eq(posCashMovements.reasonCode, "SafeDrop"),
						inArray(posCashMovements.sessionId, sessionIds)
					)
				);
			return Number(rows[0]?.total ?? "0");
		},
		async updateDeposit(record, expectedVersion) {
			const rows = await database
				.update(posDeposits)
				.set(depositValues(record))
				.where(
					and(
						eq(posDeposits.tenantId, record.tenantId),
						eq(posDeposits.id, record.id),
						eq(posDeposits.version, expectedVersion)
					)
				)
				.returning();
			const [row] = rows;
			if (!row) {
				return "version_conflict" as const;
			}
			return mapDeposit(row, record.sourceShiftIds);
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
