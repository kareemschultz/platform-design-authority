import { randomUUID } from "node:crypto";
import {
	createPostgresDeliveryStore,
	createPostgresOutbox,
} from "@meridian/persistence-platform-events-postgres";
import {
	createEventConsumerRegistry,
	processClaimedEvent,
} from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { Pool } from "pg";

const pool = new Pool({ connectionString: workerEnv.DATABASE_URL, max: 1 });
const client = await pool.connect();
const eventId = `event_node_${randomUUID()}`;
let transactionOpen = false;

try {
	await client.query("BEGIN");
	transactionOpen = true;
	await client.query(
		`UPDATE platform_event_outbox
		 SET next_attempt_at = 'infinity'::timestamptz
		 WHERE status IN ('pending', 'retrying', 'claimed')`
	);
	await createPostgresOutbox(client).append({
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
	const store = createPostgresDeliveryStore(client);
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
	const verified = await client.query<{
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
	await client.query("ROLLBACK");
	transactionOpen = false;
} finally {
	if (transactionOpen) {
		await client.query("ROLLBACK");
	}
	client.release();
	await pool.end();
}
