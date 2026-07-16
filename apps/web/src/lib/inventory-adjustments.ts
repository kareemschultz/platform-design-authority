import type { InventoryAdjustment } from "@meridian/contracts-platform-api";

export const INVENTORY_ADJUSTMENT_STATES = [
	"Draft",
	"PendingApproval",
	"Approved",
	"Posted",
	"Reversed",
	"Rejected",
] as const satisfies readonly InventoryAdjustment["state"][];

export function adjustmentStateFromSearch(
	value: string | null
): InventoryAdjustment["state"] | undefined {
	return INVENTORY_ADJUSTMENT_STATES.find((state) => state === value);
}

export function adjustmentCanApprove(adjustment: InventoryAdjustment): boolean {
	return adjustment.state === "PendingApproval";
}

export function adjustmentCanReverse(adjustment: InventoryAdjustment): boolean {
	return adjustment.state === "Posted" && Boolean(adjustment.movementId);
}

export function formatAdjustmentQuantity(
	quantity: string,
	unit: string
): string {
	const signed = quantity.startsWith("-") ? quantity : `+${quantity}`;
	return `${signed} ${unit}`;
}
