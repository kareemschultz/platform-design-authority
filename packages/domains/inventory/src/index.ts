export const DECIMAL_QUANTITY_PATTERN =
	/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;

export type DecimalQuantity = string;

export interface QuantityContract {
	conversionSourceId?: string;
	unit: string;
	value: DecimalQuantity;
}

/**
 * PR1 publishes only the runtime-neutral persistence boundary. Ledger
 * behavior and its concrete adapter are implemented in WS2 PR3.
 */
export interface InventoryPersistencePort {
	readonly owner: "inventory";
}
