import { randomUUID } from "node:crypto";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	createEventConsumerRegistry,
	processClaimedEvent,
} from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

const databaseName = `meridian_delivery_node_${randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(workerEnv.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(workerEnv.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString(), max: 1 });
const pool = new Pool({ connectionString: testUrl.toString(), max: 1 });
const eventId = `event_node_${randomUUID()}`;
let databaseCreated = false;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

try {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	databaseCreated = true;
	await migratePlatformEvents(pool);
	await createPostgresOutbox(pool).append({
		aggregateId: `product_node_${randomUUID()}`,
		classification: "Internal",
		data: { productId: "product_node_check" },
		id: eventId,
		name: "catalog.product.created.v1",
		occurredAt: new Date().toISOString(),
		producerNamespace: "catalog",
		retentionClass: "transaction-operational",
		schemaRef: "schemas/events/catalog.product.created.v1.schema.json",
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		tenantId: "tenant_node_delivery_check",
	});
	const store = createPostgresDeliveryStore(pool);
	const claim = await store.claimNext({
		claimToken: randomUUID(),
		leaseExpiresAt: "2100-07-15T12:00:30.000Z",
		now: "2100-07-15T12:00:00.000Z",
	});
	if (claim?.event.id !== eventId) {
		throw new Error("Node delivery check did not claim its event");
	}
	const result = await processClaimedEvent(claim, {
		clock: { now: () => new Date("2100-07-15T12:00:01.000Z") },
		idFactory: randomUUID,
		jitter: { next: () => 0.5 },
		registry: createEventConsumerRegistry([]),
		store,
	});
	if (result !== "no_consumers") {
		throw new Error("Node delivery check did not complete the event");
	}
	const verified = await pool.query<{
		status: string;
		claim_token_digest: string | null;
	}>(
		"SELECT status, claim_token_digest FROM platform_event_outbox WHERE id = $1",
		[eventId]
	);
	if (
		verified.rows[0]?.status !== "delivered" ||
		verified.rows[0]?.claim_token_digest !== null
	) {
		throw new Error("Node delivery check left invalid delivery state");
	}
} finally {
	await pool.end();
	if (databaseCreated) {
		await adminPool.query(
			`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
		);
	}
	await adminPool.end();
}
