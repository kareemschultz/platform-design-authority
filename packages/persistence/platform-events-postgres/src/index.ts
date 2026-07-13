import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	OutboxAppendPort,
	OutboxAppendResult,
	OutboxEvent,
} from "@meridian/platform-events";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import { eventOutbox } from "./schema";

export type EventsPostgresConnection = Pool | PoolClient;

function toRecord<TData extends Record<string, unknown>>(
	envelope: OutboxEvent<TData>
) {
	return {
		actorId: envelope.actorId,
		aggregateId: envelope.aggregateId,
		capabilityId: envelope.capabilityId,
		causationId: envelope.causationId,
		classification: envelope.classification,
		correlationId: envelope.correlationId,
		data: envelope.data,
		id: envelope.id,
		idempotencyKey: envelope.idempotencyKey,
		legalEntityId: envelope.legalEntityId,
		locationId: envelope.locationId,
		name: envelope.name,
		occurredAt: envelope.occurredAt,
		organizationId: envelope.organizationId,
		producerNamespace: envelope.producerNamespace,
		purpose: envelope.purpose,
		retentionClass: envelope.retentionClass,
		schemaRef: envelope.schemaRef,
		schemaVersion: envelope.schemaVersion,
		sourceChannel: envelope.sourceChannel,
		tenantId: envelope.tenantId,
		traceId: envelope.traceId,
	};
}

export function createPostgresOutbox(
	connection: EventsPostgresConnection
): OutboxAppendPort {
	const database = drizzle(connection);
	return {
		async append<TData extends Record<string, unknown>>(
			envelope: OutboxEvent<TData>
		): Promise<OutboxAppendResult> {
			const inserted = await database
				.insert(eventOutbox)
				.values(toRecord(envelope))
				.onConflictDoNothing({ target: eventOutbox.id })
				.returning({ id: eventOutbox.id });
			return inserted.length === 0 ? "duplicate" : "inserted";
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformEvents(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_events_migrations",
	});
}
