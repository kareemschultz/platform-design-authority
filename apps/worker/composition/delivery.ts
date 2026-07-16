import { randomUUID } from "node:crypto";
import { createPostgresDeliveryStore } from "@meridian/persistence-platform-events-postgres";
import {
	createEventConsumerRegistry,
	processClaimedEvent,
	WS2_DELIVERY_POLICY,
} from "@meridian/platform-events";

import { workerDatabasePool } from "./postgres";

const store = createPostgresDeliveryStore(workerDatabasePool);
const registry = createEventConsumerRegistry([]);
const clock = { now: () => new Date() };

export async function runDeliveryCycle(): Promise<boolean> {
	const now = clock.now();
	const claim = await store.claimNext({
		claimToken: randomUUID(),
		leaseExpiresAt: new Date(
			now.getTime() + WS2_DELIVERY_POLICY.claimLeaseMs
		).toISOString(),
		now: now.toISOString(),
	});
	if (!claim) {
		return false;
	}
	await processClaimedEvent(claim, {
		clock,
		idFactory: randomUUID,
		jitter: { next: Math.random },
		registry,
		store,
	});
	return true;
}
