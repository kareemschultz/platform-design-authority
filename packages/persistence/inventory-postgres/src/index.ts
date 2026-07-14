import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

export const INVENTORY_MIGRATION_TABLE = "inventory_migrations";

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
