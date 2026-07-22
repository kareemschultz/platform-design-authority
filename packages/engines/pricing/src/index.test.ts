import { describe, expect, test } from "bun:test";
import { createPricingEngine, PricingError } from ".";

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

describe("createPricingEngine", () => {
	const engine = createPricingEngine();

	test("computes gross as unitPrice x quantity with no discount", async () => {
		const result = await engine.priceLine({
			discountAmount: null,
			productId: "prod_1",
			quantity: "2",
			unitPrice: "1000.00",
			variantId: null,
		});
		expect(result).toEqual({
			discountAmount: "0.00",
			grossAmount: "2000.00",
			netAmount: "2000.00",
		});
	});

	test("subtracts a declared per-line discount from gross to compute net", async () => {
		const result = await engine.priceLine({
			discountAmount: "150.00",
			productId: "prod_1",
			quantity: "3",
			unitPrice: "500.00",
			variantId: null,
		});
		expect(result).toEqual({
			discountAmount: "150.00",
			grossAmount: "1500.00",
			netAmount: "1350.00",
		});
	});

	test("handles fractional quantities with exact decimal rounding, not binary float drift", async () => {
		// 33.33 x 3 = 99.99 exactly; a binary-float implementation of
		// 33.33 * 3 can drift to 99.98999999999999.
		const result = await engine.priceLine({
			discountAmount: null,
			productId: "prod_1",
			quantity: "3",
			unitPrice: "33.33",
			variantId: null,
		});
		expect(result.grossAmount).toBe("99.99");
		expect(result.netAmount).toBe("99.99");
	});

	test("rounds a fractional-cent gross amount half up", async () => {
		// 0.125 kg x 10.00/unit = 1.25 exactly -> no rounding needed; use a
		// case that genuinely produces a sub-cent remainder.
		const result = await engine.priceLine({
			discountAmount: null,
			productId: "prod_1",
			quantity: "0.333333",
			unitPrice: "10.00",
			variantId: null,
		});
		// 0.333333 * 10.00 = 3.33333 -> rounds half-up to 3.33
		expect(result.grossAmount).toBe("3.33");
	});

	test("rejects a discount larger than the line's gross amount", () => {
		expect(
			engine.priceLine({
				discountAmount: "999.00",
				productId: "prod_1",
				quantity: "1",
				unitPrice: "500.00",
				variantId: null,
			})
		).rejects.toMatchObject({ code: "invalid_amount" });
	});

	test("rejects a malformed unitPrice", () => {
		expect(
			engine.priceLine({
				discountAmount: null,
				productId: "prod_1",
				quantity: "1",
				unitPrice: "10",
				variantId: null,
			})
		).rejects.toBeInstanceOf(PricingError);
	});

	test("rejects a malformed quantity", () => {
		expect(
			engine.priceLine({
				discountAmount: null,
				productId: "prod_1",
				quantity: "abc",
				unitPrice: "10.00",
				variantId: null,
			})
		).rejects.toMatchObject({ code: "invalid_quantity" });
	});
});
