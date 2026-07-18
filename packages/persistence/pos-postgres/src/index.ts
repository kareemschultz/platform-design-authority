import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

export const POS_MIGRATION_TABLE = "pos_migrations";

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

/**
 * PR0 registers an empty owner migration stream so history ownership,
 * ordering, and CI migration-freshness coverage are executable before PR1
 * adds the RegisterSession/CashMovement schema. The worker never calls
 * this: only `apps/server/composition` runs owner migrations (ADR-0027).
 */
export async function migratePos(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: POS_MIGRATION_TABLE,
	});
}
