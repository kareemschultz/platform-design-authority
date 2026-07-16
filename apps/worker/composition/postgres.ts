import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

export const workerDatabasePool = new Pool({
	connectionString: workerEnv.DATABASE_URL,
	connectionTimeoutMillis: 10_000,
	idleTimeoutMillis: 30_000,
	max: workerEnv.WORKER_DATABASE_POOL_MAX,
});

let databaseHealthy = true;

workerDatabasePool.on("error", () => {
	databaseHealthy = false;
});

export function isWorkerDatabaseHealthy(): boolean {
	return databaseHealthy;
}

export async function closeWorkerDatabase(): Promise<void> {
	await workerDatabasePool.end();
}
