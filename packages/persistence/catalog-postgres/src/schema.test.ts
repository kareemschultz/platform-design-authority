import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	catalogCommandReceipts,
	catalogIdentifiers,
	catalogProductSearchProjections,
	catalogProducts,
	catalogVariants,
} from "./schema";

const tables = [
	catalogCommandReceipts,
	catalogIdentifiers,
	catalogProductSearchProjections,
	catalogProducts,
	catalogVariants,
];

describe("Catalog PostgreSQL ownership", () => {
	test("declares the registered Catalog source and PR4 projection tables", () => {
		expect(
			tables
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"catalog_identifier",
			"catalog_product",
			"catalog_product_command_receipt",
			"catalog_product_search_projection",
			"catalog_variant",
		]);
	});

	test("requires tenant scope on every Catalog table", () => {
		for (const table of tables) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});

	test("uses exact data types for classified Catalog fields", () => {
		const product = getTableColumns(catalogProducts);
		const identifier = getTableColumns(catalogIdentifiers);
		const receipt = getTableColumns(catalogCommandReceipts);

		expect(product.version.dataType).toBe("number");
		expect(product.archivedAt.dataType).toBe("date");
		expect(identifier.normalizedValue.notNull).toBe(true);
		expect(identifier.normalizationVersion.notNull).toBe(true);
		expect(identifier.uniquenessScope.notNull).toBe(true);
		expect(receipt.result.dataType).toBe("json");
	});
});
