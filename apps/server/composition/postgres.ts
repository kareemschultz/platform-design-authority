import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

/** The process's only PostgreSQL pool; lifecycle belongs to this composition root. */
export const databasePool = new Pool({
	connectionString: env.DATABASE_URL,
	connectionTimeoutMillis: 10_000,
	idleTimeoutMillis: 30_000,
	max: 10,
});

databasePool.on("error", (error) => {
	console.error("PostgreSQL idle client error:", error.message);
});

export async function closeDatabaseComposition(): Promise<void> {
	await databasePool.end();
}
