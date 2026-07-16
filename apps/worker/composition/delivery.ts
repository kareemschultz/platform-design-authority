import { randomUUID } from "node:crypto";
import { createCatalogSearchProjectionAdapter } from "@meridian/persistence-catalog-postgres";
import { createInventoryReconciliationAdapter } from "@meridian/persistence-inventory-postgres";
import {
	createPostgresDeliveryStore,
	createPostgresReplayExecutionStore,
} from "@meridian/persistence-platform-events-postgres";
import {
	CATALOG_SEARCH_CONSUMER,
	createEventConsumerRegistry,
	DeliveryConsumerError,
	INVENTORY_RECONCILIATION_CONSUMER,
	processClaimedEvent,
	processNextReplayRequest,
	WS2_DELIVERY_POLICY,
} from "@meridian/platform-events";
import { workerEnv } from "@meridian/tooling-env/worker";
import { workerDatabasePool } from "./postgres";

const store = createPostgresDeliveryStore(workerDatabasePool);
const replayStore = createPostgresReplayExecutionStore(workerDatabasePool);
const catalogProjection =
	createCatalogSearchProjectionAdapter(workerDatabasePool);
const inventoryReconciliation =
	createInventoryReconciliationAdapter(workerDatabasePool);

function requiredProductId(data: Record<string, unknown>): string {
	const { productId } = data;
	if (typeof productId !== "string" || productId.length === 0) {
		throw new DeliveryConsumerError("invalid_event_payload", false);
	}
	return productId;
}

const registry = createEventConsumerRegistry([
	{
		...CATALOG_SEARCH_CONSUMER,
		async consume(event) {
			if (!event.tenantId) {
				throw new DeliveryConsumerError("tenant_scope_required", false);
			}
			await catalogProjection.rebuildProduct({
				eventId: event.id,
				productId: requiredProductId(event.data),
				projectedAt: clock.now().toISOString(),
				tenantId: event.tenantId,
			});
		},
	},
	{
		...INVENTORY_RECONCILIATION_CONSUMER,
		async consume(event) {
			if (!event.tenantId) {
				throw new DeliveryConsumerError("tenant_scope_required", false);
			}
			await inventoryReconciliation.reconcileTenant(event.tenantId);
		},
	},
]);
const clock = { now: () => new Date() };
const pausedTenantIds = workerEnv.WORKER_PAUSED_TENANT_IDS?.split(",") ?? [];

export async function runDeliveryCycle(): Promise<boolean> {
	const replayResult = await processNextReplayRequest({
		clock: () => new Date(),
		registry,
		store: replayStore,
	});
	if (replayResult !== "idle") {
		return true;
	}
	const now = clock.now();
	const claim = await store.claimNext({
		claimToken: randomUUID(),
		leaseExpiresAt: new Date(
			now.getTime() + WS2_DELIVERY_POLICY.claimLeaseMs
		).toISOString(),
		now: now.toISOString(),
		pausedTenantIds,
	});
	if (!claim) {
		return false;
	}
	const heartbeat = setInterval(() => {
		const heartbeatNow = clock.now();
		store
			.renewClaim({
				claimToken: claim.claimToken,
				eventId: claim.event.id,
				leaseExpiresAt: new Date(
					heartbeatNow.getTime() + WS2_DELIVERY_POLICY.claimLeaseMs
				).toISOString(),
				now: heartbeatNow.toISOString(),
			})
			.catch(() => false);
	}, WS2_DELIVERY_POLICY.claimLeaseMs / 3);
	try {
		await processClaimedEvent(claim, {
			clock,
			idFactory: randomUUID,
			jitter: { next: Math.random },
			registry,
			store,
		});
	} finally {
		clearInterval(heartbeat);
	}
	return true;
}

export function readDeliveryHealth() {
	return store.getHealthSnapshot(clock.now().toISOString());
}
