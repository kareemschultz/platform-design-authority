import { describe, expect, test } from "bun:test";
import {
	createTaxEngine,
	GY_STANDARD_RATE,
	NON_STATUTORY_NOTICE,
	TAX_CATEGORIES,
	TaxError,
} from ".";

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

describe("createTaxEngine", () => {
	const engine = createTaxEngine();

	test("exclusive standard rate matches the tax pack's worked example (net 1000.00 -> VAT 140.00)", async () => {
		const result = await engine.calculateLine({
			category: "GY_STANDARD_14",
			inclusive: false,
			taxableBase: "1000.00",
		});
		expect(result).toEqual({
			category: "GY_STANDARD_14",
			nonStatutory: true,
			rate: "0.14",
			taxAmount: "140.00",
			taxableBase: "1000.00",
		});
	});

	test("inclusive standard rate matches the tax pack's worked example (total 1140.00 -> base 1000.00, VAT 140.00)", async () => {
		const result = await engine.calculateLine({
			category: "GY_STANDARD_14",
			inclusive: true,
			taxableBase: "1140.00",
		});
		expect(result).toEqual({
			category: "GY_STANDARD_14",
			nonStatutory: true,
			rate: "0.14",
			taxAmount: "140.00",
			taxableBase: "1000.00",
		});
	});

	test("zero-rated lines compute a zero VAT amount", async () => {
		const result = await engine.calculateLine({
			category: "GY_ZERO_RATED",
			inclusive: false,
			taxableBase: "500.00",
		});
		expect(result).toEqual({
			category: "GY_ZERO_RATED",
			nonStatutory: true,
			rate: "0.00",
			taxAmount: "0.00",
			taxableBase: "500.00",
		});
	});

	test("exempt lines compute a zero VAT amount (no output VAT)", async () => {
		const result = await engine.calculateLine({
			category: "GY_EXEMPT",
			inclusive: false,
			taxableBase: "250.00",
		});
		expect(result.taxAmount).toBe("0.00");
	});

	test("out-of-scope lines compute a zero VAT amount", async () => {
		const result = await engine.calculateLine({
			category: "GY_OUT_OF_SCOPE",
			inclusive: false,
			taxableBase: "75.00",
		});
		expect(result.taxAmount).toBe("0.00");
	});

	test("mixed basket standard + zero-rated matches the tax pack's worked example", async () => {
		const standard = await engine.calculateLine({
			category: "GY_STANDARD_14",
			inclusive: false,
			taxableBase: "2000.00",
		});
		const zeroRated = await engine.calculateLine({
			category: "GY_ZERO_RATED",
			inclusive: false,
			taxableBase: "500.00",
		});
		expect(standard.taxAmount).toBe("280.00");
		expect(zeroRated.taxAmount).toBe("0.00");
	});

	test("rounds an exclusive fractional-cent tax amount half up", async () => {
		// 33.33 x 0.14 = 4.6662 -> rounds half-up to 4.67
		const result = await engine.calculateLine({
			category: "GY_STANDARD_14",
			inclusive: false,
			taxableBase: "33.33",
		});
		expect(result.taxAmount).toBe("4.67");
	});

	test("rejects a malformed taxableBase", () => {
		expect(
			engine.calculateLine({
				category: "GY_STANDARD_14",
				inclusive: false,
				taxableBase: "1000",
			})
		).rejects.toBeInstanceOf(TaxError);
	});
});
