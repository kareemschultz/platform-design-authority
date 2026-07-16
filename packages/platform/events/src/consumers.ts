export const CATALOG_SEARCH_CONSUMER = {
	eventNames: [
		"catalog.product.created.v1",
		"catalog.product.changed.v1",
		"catalog.product.activated.v1",
		"catalog.product.archived.v1",
		"catalog.product.discontinued.v1",
		"catalog.variant.created.v1",
		"catalog.identifier.assigned.v1",
	] as const,
	eventSchemaVersions: ["1.0.0"] as const,
	id: "catalog-search-projection",
	replayRetentionClasses: ["catalog-operational-event"] as const,
	schemaVersion: "1.0.0",
} as const;

export const INVENTORY_RECONCILIATION_CONSUMER = {
	eventNames: [
		"inventory.stock.adjusted.v1",
		"inventory.stock-movement.reversed.v1",
		"inventory.stock-count.posted.v1",
		"inventory.stock-transfer.dispatched.v1",
		"inventory.stock-transfer.received.v1",
	] as const,
	eventSchemaVersions: ["1.0.0"] as const,
	id: "inventory-availability-reconciliation",
	replayRetentionClasses: ["inventory-operational-event"] as const,
	schemaVersion: "1.0.0",
} as const;

export const WS2_EVENT_CONSUMER_DECLARATIONS = [
	CATALOG_SEARCH_CONSUMER,
	INVENTORY_RECONCILIATION_CONSUMER,
] as const;
