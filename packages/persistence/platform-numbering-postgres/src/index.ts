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
		allocatedAt: row.allocatedAt,
		formattedValue: row.formattedValue,
		id: row.id,
		idempotencyKey: row.idempotencyKey,
		organizationId: row.organizationId,
		requestFingerprint: row.requestFingerprint,
		sequenceId: row.sequenceId,
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
				current_value: number;
				next_value: number;
				padding: number;
				prefix: string;
				state: "Active" | "Suspended";
			}>(
				`SELECT current_value, next_value, padding, prefix, state
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
			const value = sequence.next_value;
			const formattedValue = `${sequence.prefix}${String(value).padStart(sequence.padding, "0")}`;
			const inserted = await database
				.insert(numberAllocations)
				.values({
					allocatedAt: input.now,
					allocatedByUserId: input.actorUserId,
					formattedValue,
					id: input.allocationId,
					idempotencyKey: input.idempotencyKey,
					organizationId: input.organizationId,
					requestFingerprint: input.requestFingerprint,
					sequenceId: input.sequenceId,
					tenantId: input.tenantId,
					value,
				})
				.returning();
			await database
				.update(numberSequences)
				.set({
					currentValue: value,
					nextValue: value + 1,
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
