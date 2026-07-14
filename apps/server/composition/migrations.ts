import { migratePlatformEvents } from "@meridian/persistence-platform-events-postgres";
import { migratePlatformIdentity } from "@meridian/persistence-platform-identity-postgres";
import { migratePlatformTenancy } from "@meridian/persistence-platform-tenancy-postgres";
import type { Pool } from "pg";

export interface MigrationStream {
	id: string;
	migrate: (pool: Pool) => Promise<void>;
}

export const WS1_MIGRATION_STREAMS: readonly MigrationStream[] = [
	{ id: "platform.identity", migrate: migratePlatformIdentity },
	{ id: "platform.tenancy", migrate: migratePlatformTenancy },
	{ id: "platform.events", migrate: migratePlatformEvents },
];

export async function runMigrationStreams(
	pool: Pool,
	streams: readonly MigrationStream[] = WS1_MIGRATION_STREAMS
): Promise<void> {
	for (const stream of streams) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: ADR-0027 requires deterministic serial migration streams.
			await stream.migrate(pool);
		} catch (error) {
			throw new Error(`Migration stream ${stream.id} failed`, { cause: error });
		}
	}
}
