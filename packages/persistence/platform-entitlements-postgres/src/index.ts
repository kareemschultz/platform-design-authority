import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	EntitlementCommandReceipt,
	EntitlementRecord,
	EntitlementRepository,
} from "@meridian/platform-entitlements";
import { and, asc, eq, gt, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	entitlementChanges,
	entitlementCommandReceipts,
	entitlements,
} from "./schema";

export type EntitlementsPostgresConnection = Pool | PoolClient;

function mapEntitlement(
	row: typeof entitlements.$inferSelect
): EntitlementRecord {
	return {
		capabilityId: row.capabilityId as EntitlementRecord["capabilityId"],
		dependencies: row.dependencies as EntitlementRecord["dependencies"],
		...(row.endsAt ? { endsAt: row.endsAt } : {}),
		exclusions: row.exclusions as EntitlementRecord["exclusions"],
		id: row.id,
		limits: row.limits,
		...(row.organizationId ? { organizationId: row.organizationId } : {}),
		source: row.source as EntitlementRecord["source"],
		startsAt: row.startsAt,
		state: row.state as EntitlementRecord["state"],
		tenantId: row.tenantId,
		version: row.version,
	};
}

function mapReceipt(
	row: typeof entitlementCommandReceipts.$inferSelect
): EntitlementCommandReceipt {
	return {
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as EntitlementCommandReceipt["operation"],
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result,
		tenantId: row.tenantId,
	};
}

function values(record: EntitlementRecord) {
	return {
		capabilityId: record.capabilityId,
		dependencies: record.dependencies,
		endsAt: record.endsAt ?? null,
		exclusions: record.exclusions,
		id: record.id,
		limits: record.limits,
		organizationId: record.organizationId ?? null,
		scopeKey: record.organizationId ?? "__tenant__",
		source: record.source,
		startsAt: record.startsAt,
		state: record.state,
		tenantId: record.tenantId,
		updatedAt: new Date(),
		version: record.version,
	};
}

export function createEntitlementRepository(
	connection: EntitlementsPostgresConnection
): EntitlementRepository {
	const database = drizzle(connection);
	return {
		async completeCommandReceipt(record) {
			const [row] = await database
				.update(entitlementCommandReceipts)
				.set({ result: record.result })
				.where(
					and(
						eq(entitlementCommandReceipts.tenantId, record.tenantId),
						eq(entitlementCommandReceipts.operation, record.operation),
						eq(
							entitlementCommandReceipts.idempotencyKey,
							record.idempotencyKey
						),
						eq(
							entitlementCommandReceipts.requestFingerprint,
							record.requestFingerprint
						)
					)
				)
				.returning();
			if (!row) {
				throw new Error("Entitlement command receipt completion failed");
			}
			return mapReceipt(row);
		},

		async getByScope(input) {
			const [row] = await database
				.select()
				.from(entitlements)
				.where(
					and(
						eq(entitlements.tenantId, input.tenantId),
						eq(entitlements.capabilityId, input.capabilityId),
						eq(entitlements.scopeKey, input.organizationId ?? "__tenant__")
					)
				)
				.limit(1);
			return row ? mapEntitlement(row) : null;
		},

		async getCommandReceipt(input) {
			const [row] = await database
				.select()
				.from(entitlementCommandReceipts)
				.where(
					and(
						eq(entitlementCommandReceipts.tenantId, input.tenantId),
						eq(entitlementCommandReceipts.operation, input.operation),
						eq(entitlementCommandReceipts.idempotencyKey, input.idempotencyKey)
					)
				)
				.limit(1);
			return row ? mapReceipt(row) : null;
		},

		async list(tenantId, page) {
			const rows = await database
				.select()
				.from(entitlements)
				.where(
					and(
						eq(entitlements.tenantId, tenantId),
						page.cursor ? gt(entitlements.id, page.cursor) : undefined
					)
				)
				.orderBy(asc(entitlements.id))
				.limit(page.limit + 1);
			const hasMore = rows.length > page.limit;
			const items = (hasMore ? rows.slice(0, page.limit) : rows).map(
				mapEntitlement
			);
			return {
				items,
				nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
			};
		},

		async listCurrent(input) {
			const rows = await database
				.select()
				.from(entitlements)
				.where(
					and(
						eq(entitlements.tenantId, input.tenantId),
						input.organizationId
							? or(
									isNull(entitlements.organizationId),
									eq(entitlements.organizationId, input.organizationId)
								)
							: isNull(entitlements.organizationId)
					)
				);
			return rows.map(mapEntitlement);
		},

		async recordChange(record) {
			await database.insert(entitlementChanges).values({
				actorId: record.actorId,
				changedFields: record.changedFields,
				entitlementId: record.entitlementId,
				entitlementVersion: record.entitlementVersion,
				id: record.id,
				newState: record.newState,
				occurredAt: record.occurredAt,
				previousState: record.previousState ?? null,
				reason: record.reason,
				snapshot: record.snapshot as unknown as Record<string, unknown>,
				tenantId: record.tenantId,
			});
		},

		async recordCommandReceipt(record) {
			const [inserted] = await database
				.insert(entitlementCommandReceipts)
				.values(record)
				.onConflictDoNothing()
				.returning();
			if (inserted) {
				return { inserted: true, record: mapReceipt(inserted) };
			}
			const existing = await this.getCommandReceipt(record);
			if (!existing) {
				throw new Error("Entitlement idempotency lookup failed");
			}
			return { inserted: false, record: existing };
		},

		async save(record, expectedVersion) {
			if (expectedVersion === null) {
				const [row] = await database
					.insert(entitlements)
					.values(values(record))
					.onConflictDoNothing()
					.returning();
				return row ? mapEntitlement(row) : "version_conflict";
			}
			const [row] = await database
				.update(entitlements)
				.set(values(record))
				.where(
					and(
						eq(entitlements.tenantId, record.tenantId),
						eq(entitlements.id, record.id),
						eq(entitlements.version, expectedVersion)
					)
				)
				.returning();
			return row ? mapEntitlement(row) : "version_conflict";
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformEntitlements(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_entitlements_migrations",
	});
}

// biome-ignore lint/performance/noBarrelFile: this is the persistence package's deliberate public schema and adapter surface.
export * from "./schema";
