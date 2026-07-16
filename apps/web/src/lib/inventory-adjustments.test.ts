import { describe, expect, test } from "bun:test";

import {
	adjustmentCanApprove,
	adjustmentCanReverse,
	adjustmentStateFromSearch,
	formatAdjustmentQuantity,
} from "./inventory-adjustments";

const adjustment = {
	conversionSourceId: null,
	id: "adjustment_123456",
	locationId: "location_12345678",
	movementId: null,
	productId: "product_123456789",
	quantity: "4.5",
	reason: "Cycle review",
	reversalMovementId: null,
	state: "PendingApproval" as const,
	unit: "each",
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
});
