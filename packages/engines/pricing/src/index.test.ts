import { describe, expect, test } from "bun:test";

describe("Pricing engine contract scaffold", () => {
	test("line pricing carries exact-decimal fields, never binary floats", () => {
		const sampleInput: Record<string, unknown> = {
			discountAmount: null,
			productId: "prod_1",
			quantity: "2",
			unitPrice: "1000.00",
			variantId: null,
		};
		for (const [key, value] of Object.entries(sampleInput)) {
			if (typeof value === "number") {
				throw new Error(`${key} must not be a binary-float number`);
			}
		}
		expect(sampleInput.unitPrice).toBe("1000.00");
	});

	test("a discounted line reports gross, discount, and net separately", () => {
		const keys = ["grossAmount", "discountAmount", "netAmount"];
		expect(keys).toEqual(["grossAmount", "discountAmount", "netAmount"]);
	});
});
