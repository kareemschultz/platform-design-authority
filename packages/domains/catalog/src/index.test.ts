import { describe, expect, test } from "bun:test";
import { PRODUCT_STATES } from ".";

describe("Catalog contract scaffold", () => {
	test("keeps archive distinct from discontinuation", () => {
		expect(PRODUCT_STATES).toContain("Discontinued");
		expect(PRODUCT_STATES).toContain("Archived");
	});
});
