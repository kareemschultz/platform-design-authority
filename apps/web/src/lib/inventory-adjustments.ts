import type { InventoryAdjustment } from "@meridian/contracts-platform-api";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{12,64}$/u;

export interface AdjustmentCorrectionPrefill {
	ignored: string[];
	locationId: string;
	productId: string;
	reason: string;
	variantId: string;
}

export function adjustmentCorrectionPrefill(
	search: URLSearchParams,
	permittedLocationIds: readonly string[],
	fallbackLocationId: string
): AdjustmentCorrectionPrefill {
	const ignored: string[] = [];
	const rawLocationId = search.get("locationId") ?? "";
	const rawProductId = search.get("productId") ?? "";
	const rawVariantId = search.get("variantId") ?? "";
	const rawReason = (search.get("reason") ?? "").trim();
	const locationId = permittedLocationIds.includes(rawLocationId)
		? rawLocationId
		: fallbackLocationId;
	if (rawLocationId && locationId !== rawLocationId) {
		ignored.push("location");
	}
	const productId = IDENTIFIER_PATTERN.test(rawProductId) ? rawProductId : "";
	if (rawProductId && !productId) {
		ignored.push("Product");
	}
	const variantId = IDENTIFIER_PATTERN.test(rawVariantId) ? rawVariantId : "";
	if (rawVariantId && !variantId) {
		ignored.push("Variant");
	}
	const reason = rawReason.length <= 500 ? rawReason : "";
	if (rawReason && !reason) {
		ignored.push("reason");
	}
	return { ignored, locationId, productId, reason, variantId };
}

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
