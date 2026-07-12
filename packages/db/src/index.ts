import { env } from "@meridian/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// biome-ignore lint/performance/noNamespaceImport: Drizzle consumes a schema object namespace.
import * as schema from "./schema";

// Single shared pool for the process. Every consumer (server, auth) must use
// this instance so connection limits and graceful shutdown stay coherent.
const pool = new Pool({
	connectionString: env.DATABASE_URL,
	connectionTimeoutMillis: 10_000,
	idleTimeoutMillis: 30_000,
	max: 10,
});

pool.on("error", (error) => {
	// Idle-client errors (for example a database restart) must not crash the
	// process; the next checkout creates a fresh connection.
	console.error("PostgreSQL idle client error:", error.message);
});

export const db = drizzle(pool, { schema });

/** Drain the shared pool. Call exactly once during process shutdown. */
export async function closeDb(): Promise<void> {
	await pool.end();
}
