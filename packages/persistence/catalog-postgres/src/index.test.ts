import { describe, expect, test } from "bun:test";
import { CATALOG_MIGRATION_TABLE } from ".";

describe("Catalog persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(CATALOG_MIGRATION_TABLE).toBe("catalog_migrations");
	});
});
