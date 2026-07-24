import { describe, expect, test } from "bun:test";

import { isTableDensity } from "./operations-shared";

describe("isTableDensity", () => {
	test("accepts the three known density values", () => {
		expect(isTableDensity("comfortable")).toBe(true);
		expect(isTableDensity("compact")).toBe(true);
		expect(isTableDensity("touch")).toBe(true);
	});

	test("rejects null, empty, and unrelated stored values", () => {
		expect(isTableDensity(null)).toBe(false);
		expect(isTableDensity("")).toBe(false);
		// Guards against a corrupted, stale, or hand-edited sessionStorage
		// value silently coercing to an unintended density.
		expect(isTableDensity("Comfortable")).toBe(false);
		expect(isTableDensity("cozy")).toBe(false);
	});
});
