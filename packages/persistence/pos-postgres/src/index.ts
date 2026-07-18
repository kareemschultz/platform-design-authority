import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	CashMovementNetTotals,
	CashMovementRecord,
	PosCommandReceipt,
	PosRepository,
	RegisterSessionRecord,
} from "@meridian/domain-pos";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	posCashMovements,
	posCommandReceipts,
	posRegisterSessions,
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

export function createPosRepository(
	connection: PosPostgresConnection
): PosRepository {
	const database = drizzle(connection);

	return {
		async acquireCommandLock(tenantId, operation, idempotencyKey) {
			const lockIdentity = `${tenantId}${operation}${idempotencyKey}`;
			await database.execute(
				sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockIdentity}, 0))`
			);
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
