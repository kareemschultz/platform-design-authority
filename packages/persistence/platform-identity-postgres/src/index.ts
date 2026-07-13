import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	bindIdentityPersistence,
	type IdentityPersistence,
} from "@meridian/platform-identity";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

// biome-ignore lint/performance/noNamespaceImport: Better Auth's Drizzle adapter expects a schema object namespace.
import * as schema from "./schema";

export type IdentityPostgresConnection = Pool | PoolClient;

export function createIdentityPersistence(
	connection: IdentityPostgresConnection
): IdentityPersistence {
	const database = drizzle(connection, { schema });
	return bindIdentityPersistence(
		drizzleAdapter(database, {
			provider: "pg",
			schema,
		})
	);
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformIdentity(pool: Pool): Promise<void> {
	await migrate(drizzle(pool, { schema }), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_identity_migrations",
	});
}
