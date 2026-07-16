import { describe, expect, test } from "bun:test";
import {
	INVENTORY_MIGRATION_TABLE,
	parseInventoryStockBalanceCursor,
	serializeInventoryStockBalanceCursor,
} from ".";

describe("Inventory persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(INVENTORY_MIGRATION_TABLE).toBe("inventory_migrations");
	});

	test("round-trips every unit character through the versioned balance cursor", () => {
		const value = {
			itemKey: "product_cursor",
			locationId: "location_cursor",
			unit: "case\u001feach",
		};
		const serialized = serializeInventoryStockBalanceCursor(value);

		expect(serialized).not.toContain("product_cursor\u001flocation_cursor");
		expect(parseInventoryStockBalanceCursor(serialized)).toEqual({
			...value,
			version: 1,
		});
		expect(parseInventoryStockBalanceCursor("not-json")).toBeNull();
		expect(
			parseInventoryStockBalanceCursor(JSON.stringify({ ...value, version: 2 }))
		).toBeNull();
	});
});
