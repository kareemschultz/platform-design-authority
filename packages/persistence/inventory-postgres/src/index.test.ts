import { describe, expect, test } from "bun:test";
import { INVENTORY_MIGRATION_TABLE } from ".";

describe("Inventory persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(INVENTORY_MIGRATION_TABLE).toBe("inventory_migrations");
	});
});
