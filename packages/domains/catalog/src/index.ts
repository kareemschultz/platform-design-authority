export const PRODUCT_STATES = [
	"Draft",
	"Active",
	"Suspended",
	"Discontinued",
	"Archived",
] as const;

export type ProductState = (typeof PRODUCT_STATES)[number];

/**
 * PR1 publishes only the runtime-neutral persistence boundary. Product
 * behavior and its concrete adapter are implemented in WS2 PR2.
 */
export interface CatalogPersistencePort {
	readonly owner: "catalog";
}
