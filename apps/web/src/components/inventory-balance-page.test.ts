import { describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { balanceFiltersHref } = await import("./inventory-balance-page");

describe("InventoryBalancePage filters", () => {
	test("clears every cursor state when the projection filters change", () => {
		const current = new URLSearchParams({
			cursor: "old-balance-cursor",
			cursorTrail: '["","previous-balance-cursor"]',
			locationId: "location-old",
			productId: "product-old",
		});

		expect(
			balanceFiltersHref(
				"/operations/inventory/balances",
				current,
				"location-new",
				" product-new "
			)
		).toBe(
			"/operations/inventory/balances?locationId=location-new&productId=product-new"
		);
	});
});
