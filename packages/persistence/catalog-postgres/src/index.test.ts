import { describe, expect, test } from "bun:test";
import {
	CATALOG_MIGRATION_TABLE,
	type CatalogPostgresConnection,
	createCatalogRepository,
} from ".";

describe("Catalog persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(CATALOG_MIGRATION_TABLE).toBe("catalog_migrations");
	});

	test("fails closed before querying for a whitespace-only exact identifier", async () => {
		const connection = {
			query() {
				throw new Error("database query must not run");
			},
		} as unknown as CatalogPostgresConnection;
		const repository = createCatalogRepository(connection);

		expect(
			await repository.listProducts("tenant_catalog_guard", {
				limit: 50,
				sku: "   ",
			})
		).toEqual({ items: [], nextCursor: null });
	});
});
