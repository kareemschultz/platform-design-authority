import { describe, expect, test } from "bun:test";
import { GY_STANDARD_RATE, NON_STATUTORY_NOTICE, TAX_CATEGORIES } from ".";

describe("Tax engine contract scaffold", () => {
	test("carries the fixed prototype Guyana categories from the tax pack", () => {
		expect(TAX_CATEGORIES).toEqual([
			"GY_STANDARD_14",
			"GY_ZERO_RATED",
			"GY_EXEMPT",
			"GY_OUT_OF_SCOPE",
		]);
	});

	test("standard rate matches the dated prototype tax pack value", () => {
		expect(GY_STANDARD_RATE).toBe("0.14");
	});

	test("every computed line carries an explicit non-statutory notice", () => {
		expect(NON_STATUTORY_NOTICE.toLowerCase()).toContain("not");
		expect(NON_STATUTORY_NOTICE.toLowerCase()).toContain("statutory");
	});
});
