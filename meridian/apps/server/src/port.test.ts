import { describe, expect, test } from "bun:test";

import { parsePort } from "./port";

describe("Node fallback port parsing", () => {
	test("defaults to 3000 and accepts a valid port", () => {
		expect(parsePort(undefined)).toBe(3000);
		expect(parsePort("8080")).toBe(8080);
	});

	test("rejects malformed and out-of-range ports", () => {
		for (const value of ["0", "65536", "3000junk", "-1", "1.5", "NaN"]) {
			expect(() => parsePort(value)).toThrow("PORT must be an integer");
		}
	});
});
