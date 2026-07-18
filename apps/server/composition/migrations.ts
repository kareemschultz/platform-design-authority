import { migrateCatalog } from "@meridian/persistence-catalog-postgres";
import { migrateInventory } from "@meridian/persistence-inventory-postgres";
import { migrateParty } from "@meridian/persistence-party-postgres";
import { migratePlatformAudit } from "@meridian/persistence-platform-audit-postgres";
import { migratePlatformEntitlements } from "@meridian/persistence-platform-entitlements-postgres";
import { migratePlatformEvents } from "@meridian/persistence-platform-events-postgres";
import { migratePlatformIdentity } from "@meridian/persistence-platform-identity-postgres";
import { migratePlatformImportExport } from "@meridian/persistence-platform-import-export-postgres";
import { migratePlatformNumbering } from "@meridian/persistence-platform-numbering-postgres";
import { migratePlatformTenancy } from "@meridian/persistence-platform-tenancy-postgres";
import { migratePos } from "@meridian/persistence-pos-postgres";
import type { Pool } from "pg";

export interface MigrationStream {
	id: string;
	migrate: (pool: Pool) => Promise<void>;
}

export const WS1_MIGRATION_STREAMS: readonly MigrationStream[] = [
	{ id: "platform.identity", migrate: migratePlatformIdentity },
	{ id: "platform.tenancy", migrate: migratePlatformTenancy },
	{ id: "platform.entitlements", migrate: migratePlatformEntitlements },
	{ id: "platform.audit", migrate: migratePlatformAudit },
	{ id: "platform.events", migrate: migratePlatformEvents },
	{ id: "party.records", migrate: migrateParty },
];

/**
 * WS2 owner streams are registered before their first business migrations so
 * history ownership and ordering are executable. Catalog precedes Inventory;
 * Numbering remains a separate Platform owner. The worker never runs them.
 */
export const WS2_MIGRATION_STREAMS: readonly MigrationStream[] = [
	{ id: "platform.import-export", migrate: migratePlatformImportExport },
	{ id: "platform.numbering", migrate: migratePlatformNumbering },
	{ id: "catalog", migrate: migrateCatalog },
	{ id: "inventory", migrate: migrateInventory },
];

/**
 * WS3 PR0 registers the POS owner stream empty (no tables) so migration
 * history ordering and CI freshness coverage are executable ahead of PR1's
 * RegisterSession/CashMovement schema. Controlled prototype per FDR-012;
 * this branch is not merged to main.
 */
export const WS3_MIGRATION_STREAMS: readonly MigrationStream[] = [
	{ id: "pos", migrate: migratePos },
];

export const ALL_MIGRATION_STREAMS: readonly MigrationStream[] = [
	...WS1_MIGRATION_STREAMS,
	...WS2_MIGRATION_STREAMS,
	...WS3_MIGRATION_STREAMS,
];

export async function runMigrationStreams(
	pool: Pool,
	streams: readonly MigrationStream[] = ALL_MIGRATION_STREAMS
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
