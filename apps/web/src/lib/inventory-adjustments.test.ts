import { describe, expect, test } from "bun:test";

import {
	adjustmentCanApprove,
	adjustmentCanReverse,
	adjustmentCorrectionPrefill,
	adjustmentStateFromSearch,
	formatAdjustmentQuantity,
} from "./inventory-adjustments";

const adjustment = {
	approvedByUserId: null,
	conversionSourceId: null,
	createdAt: "2026-07-16T12:00:00.000Z",
	createdByUserId: "user_maker_123456",
	id: "adjustment_123456",
	locationId: "location_12345678",
	movementId: null,
	postedAt: null,
	productId: "product_123456789",
	quantity: "4.5",
	reason: "Cycle review",
	reversalMovementId: null,
	state: "PendingApproval" as const,
	unit: "each",
	updatedAt: "2026-07-16T12:00:00.000Z",
	variantId: null,
	version: 1,
};

describe("inventory adjustment client state", () => {
	test("accepts only canonical adjustment states from the URL", () => {
		expect(adjustmentStateFromSearch("PendingApproval")).toBe(
			"PendingApproval"
		);
		expect(adjustmentStateFromSearch("pendingapproval")).toBeUndefined();
		expect(adjustmentStateFromSearch("AnythingElse")).toBeUndefined();
	});

	test("exposes actions only for their governed lifecycle states", () => {
		expect(adjustmentCanApprove(adjustment)).toBe(true);
		expect(adjustmentCanReverse(adjustment)).toBe(false);
		expect(
			adjustmentCanReverse({
				...adjustment,
				movementId: "movement_12345678",
				state: "Posted",
			})
		).toBe(true);
	});

	test("keeps the quantity sign and unit visible", () => {
		expect(formatAdjustmentQuantity("4.5", "each")).toBe("+4.5 each");
		expect(formatAdjustmentQuantity("-2", "case")).toBe("-2 case");
	});

	test("accepts only bounded correction-prefill values in the permitted location", () => {
		const valid = adjustmentCorrectionPrefill(
			new URLSearchParams({
				locationId: "location_12345678",
				productId: "product_123456789",
				reason: "Correction for transfer transfer_123456, line line_123456789",
				variantId: "variant_12345678",
			}),
			["location_12345678"],
			"location_87654321"
		);
		expect(valid.ignored).toEqual([]);
		expect(valid.locationId).toBe("location_12345678");
		expect(valid.productId).toBe("product_123456789");
		expect(valid.variantId).toBe("variant_12345678");

		const rejected = adjustmentCorrectionPrefill(
			new URLSearchParams({
				locationId: "location_foreign12",
				productId: "not valid",
				reason: "x".repeat(501),
			}),
			["location_12345678"],
			"location_12345678"
		);
		expect(rejected.locationId).toBe("location_12345678");
		expect(rejected.productId).toBe("");
		expect(rejected.reason).toBe("");
		expect(rejected.ignored).toEqual(["location", "Product", "reason"]);
	});
});
