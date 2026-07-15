import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

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
