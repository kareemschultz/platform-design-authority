import { describe, expect, test } from "bun:test";
import { DECIMAL_QUANTITY_PATTERN } from ".";

describe("Inventory quantity contract", () => {
	test("accepts exact decimal strings and rejects exponent notation", () => {
		expect(DECIMAL_QUANTITY_PATTERN.test("123.456789")).toBe(true);
		expect(DECIMAL_QUANTITY_PATTERN.test("1e3")).toBe(false);
		expect(DECIMAL_QUANTITY_PATTERN.test("0.0000001")).toBe(false);
	});
});
