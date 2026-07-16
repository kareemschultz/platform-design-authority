import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	NumberAllocation,
	NumberingRepository,
} from "@meridian/platform-numbering";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import { numberAllocations, numberSequences } from "./schema/numbering";

export const PLATFORM_NUMBERING_MIGRATION_TABLE =
	"platform_numbering_migrations";

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformNumbering(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: PLATFORM_NUMBERING_MIGRATION_TABLE,
	});
}

function mapAllocation(
	row: typeof numberAllocations.$inferSelect
): NumberAllocation {
	return {
		businessRecordId: row.businessRecordId,
		counterValue: row.counterValue,
		id: row.id,
		idempotencyKey: row.idempotencyKey,
		issuedAt: row.issuedAt,
		organizationId: row.organizationId,
		requestFingerprint: row.requestFingerprint,
		sequenceId: row.sequenceId,
		sequenceKey: row.sequenceKey,
		sequenceVersion: row.sequenceVersion,
		sourceCommandId: row.sourceCommandId,
		state: row.state as "Issued",
		tenantId: row.tenantId,
		value: row.value,
	};
}

export function createNumberingRepository(
	client: PoolClient
): NumberingRepository {
	const database = drizzle(client);
	return {
		async allocateLocked(input) {
			const locked = await client.query<{
				increment: number;
				next_value: string;
				padding: number;
				prefix: string;
				sequence_key: string;
				version: number;
				state: "Active" | "Suspended";
			}>(
				`SELECT increment, next_value, padding, prefix, sequence_key, state, version
				 FROM platform_number_sequence
				 WHERE tenant_id = $1 AND id = $2 AND organization_id = $3
				 FOR UPDATE`,
				[input.tenantId, input.sequenceId, input.organizationId]
			);
			const [sequence] = locked.rows;
			if (!sequence) {
				return "not_found";
			}
			if (sequence.state !== "Active") {
				return "suspended";
			}
			const prior = await this.findAllocation(input);
			if (prior) {
				return prior;
			}
			const counterValue = BigInt(sequence.next_value);
			const value = `${sequence.prefix}${String(counterValue).padStart(sequence.padding, "0")}`;
			const inserted = await database
				.insert(numberAllocations)
				.values({
					allocatedByUserId: input.actorUserId,
					businessRecordId: input.businessRecordId,
					counterValue,
					id: input.allocationId,
					idempotencyKey: input.idempotencyKey,
					issuedAt: input.now,
					organizationId: input.organizationId,
					requestFingerprint: input.requestFingerprint,
					sequenceId: input.sequenceId,
					sequenceKey: sequence.sequence_key,
					sequenceVersion: sequence.version,
					sourceCommandId: input.sourceCommandId,
					state: "Issued",
					tenantId: input.tenantId,
					value,
				})
				.returning();
			await database
				.update(numberSequences)
				.set({
					currentValue: counterValue,
					nextValue: counterValue + BigInt(sequence.increment),
					updatedAt: input.now,
					version: sql`${numberSequences.version} + 1`,
				})
				.where(
					and(
						eq(numberSequences.tenantId, input.tenantId),
						eq(numberSequences.id, input.sequenceId)
					)
				);
			const [allocation] = inserted;
			if (!allocation) {
				throw new Error("Number allocation insert returned no row");
			}
			return mapAllocation(allocation);
		},
		async ensureSystemSequence(input) {
			await database
				.insert(numberSequences)
				.values({
					classification: "Confidential",
					createdAt: input.createdAt,
					currentValue: 0n,
					gapPolicy: "AllowedWithEvidence",
					id: input.id,
					increment: 1,
					nextValue: 1n,
					organizationId: input.organizationId,
					ownerNamespace: input.ownerNamespace,
					padding: input.padding,
					prefix: input.prefix,
					recordType: input.recordType,
					resetPolicy: "None",
					sequenceKey: input.sequenceKey,
					state: "Active",
					tenantId: input.tenantId,
					updatedAt: input.createdAt,
					version: 1,
					voidPolicy: "NotSupportedPrototype",
				})
				.onConflictDoNothing();
			const rows = await database
				.select()
				.from(numberSequences)
				.where(
					and(
						eq(numberSequences.tenantId, input.tenantId),
						eq(numberSequences.id, input.id)
					)
				)
				.limit(1);
			const [sequence] = rows;
			if (
				!sequence ||
				sequence.organizationId !== input.organizationId ||
				sequence.ownerNamespace !== input.ownerNamespace ||
				sequence.recordType !== input.recordType ||
				sequence.sequenceKey !== input.sequenceKey ||
				sequence.prefix !== input.prefix ||
				sequence.padding !== input.padding ||
				sequence.increment !== 1 ||
				sequence.resetPolicy !== "None" ||
				sequence.state !== "Active"
			) {
				return "configuration_conflict";
			}
			return "ready";
		},
		async findAllocation(input) {
			const rows = await database
				.select()
				.from(numberAllocations)
				.where(
					and(
						eq(numberAllocations.tenantId, input.tenantId),
						eq(numberAllocations.sequenceId, input.sequenceId),
						eq(numberAllocations.idempotencyKey, input.idempotencyKey)
					)
				)
				.limit(1);
			return rows[0] ? mapAllocation(rows[0]) : null;
		},
	};
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema/numbering";
