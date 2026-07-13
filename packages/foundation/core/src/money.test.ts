import { describe, expect, test } from "bun:test";
import {
	add,
	allocate,
	type CurrencyCode,
	compare,
	fromDecimalString,
	fromMinor,
	multiplyByRatio,
	negate,
	registerCurrency,
	subtract,
	toCurrencyCode,
	toDecimalString,
} from "./money";

function currency(code: string): CurrencyCode {
	const result = toCurrencyCode(code);
	if (!result.ok) {
		throw new Error(`test fixture currency "${code}" failed to validate`);
	}
	return result.value;
}

const GYD = currency("GYD");
const USD = currency("USD");

describe("toCurrencyCode / registerCurrency", () => {
	test("accepts the seeded GYD and USD currencies", () => {
		expect(toCurrencyCode("GYD")).toEqual({ ok: true, value: GYD });
		expect(toCurrencyCode("usd")).toEqual({ ok: true, value: USD });
	});

	test("rejects an unknown currency code", () => {
		const result = toCurrencyCode("XYZ");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("validation");
		}
	});

	test("registerCurrency extends the registry", () => {
		registerCurrency("JPY", 0);
		expect(toCurrencyCode("JPY")).toEqual({ ok: true, value: currency("JPY") });
	});

	test("re-registering the same currency with the same exponent is idempotent", () => {
		registerCurrency("EUR", 2);
		registerCurrency("EUR", 2);
		expect(toCurrencyCode("EUR")).toEqual({ ok: true, value: currency("EUR") });
	});

	test("re-registering with a different exponent throws", () => {
		registerCurrency("BHD_TEST", 3);
		expect(() => registerCurrency("BHD_TEST", 2)).toThrow();
	});

	test("rejects negative and non-integer currency exponents", () => {
		expect(() => registerCurrency("NEG_TEST", -1)).toThrow(
			"non-negative integer"
		);
		expect(() => registerCurrency("FRACTION_TEST", 1.5)).toThrow(
			"non-negative integer"
		);
		expect(() => registerCurrency("NAN_TEST", Number.NaN)).toThrow(
			"non-negative integer"
		);
		expect(toCurrencyCode("NEG_TEST").ok).toBe(false);
		expect(toCurrencyCode("FRACTION_TEST").ok).toBe(false);
		expect(toCurrencyCode("NAN_TEST").ok).toBe(false);
	});
});

describe("fromMinor / toDecimalString", () => {
	test("round-trips a whole-number GYD amount", () => {
		const money = fromMinor(GYD, 100_000n);
		expect(toDecimalString(money)).toBe("1000.00");
	});

	test("formats a zero-exponent currency without a decimal point", () => {
		const jpy = currency("JPY");
		expect(toDecimalString(fromMinor(jpy, 500n))).toBe("500");
	});

	test("formats a negative amount with a leading minus sign", () => {
		expect(toDecimalString(fromMinor(GYD, -150n))).toBe("-1.50");
	});

	test("formats an amount smaller than one major unit with leading zero", () => {
		expect(toDecimalString(fromMinor(GYD, 5n))).toBe("0.05");
	});
});

describe("fromDecimalString", () => {
	test("parses a plain decimal amount", () => {
		const result = fromDecimalString(GYD, "1000.00");
		expect(result).toEqual({
			ok: true,
			value: { amountMinor: 100_000n, currency: GYD },
		});
	});

	test("parses an integer amount without a fractional part", () => {
		const result = fromDecimalString(GYD, "1000");
		expect(result).toEqual({
			ok: true,
			value: { amountMinor: 100_000n, currency: GYD },
		});
	});

	test("parses a negative amount", () => {
		const result = fromDecimalString(GYD, "-5.50");
		expect(result).toEqual({
			ok: true,
			value: { amountMinor: -550n, currency: GYD },
		});
	});

	test("pads a shorter fractional part with trailing zeros", () => {
		const result = fromDecimalString(GYD, "1.5");
		expect(result).toEqual({
			ok: true,
			value: { amountMinor: 150n, currency: GYD },
		});
	});

	test("rejects a fractional part longer than the currency's exponent", () => {
		const result = fromDecimalString(GYD, "1.005");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("validation");
		}
	});

	test("rejects scientific notation", () => {
		const result = fromDecimalString(GYD, "1e3");
		expect(result.ok).toBe(false);
	});

	test("rejects thousands separators", () => {
		const result = fromDecimalString(GYD, "1,000.00");
		expect(result.ok).toBe(false);
	});

	test("rejects a leading plus sign", () => {
		const result = fromDecimalString(GYD, "+5.00");
		expect(result.ok).toBe(false);
	});

	test("rejects empty string, whitespace, and non-numeric input", () => {
		expect(fromDecimalString(GYD, "").ok).toBe(false);
		expect(fromDecimalString(GYD, "   ").ok).toBe(false);
		expect(fromDecimalString(GYD, "abc").ok).toBe(false);
		expect(fromDecimalString(GYD, "NaN").ok).toBe(false);
		expect(fromDecimalString(GYD, "Infinity").ok).toBe(false);
	});

	test("handles a very large amount exactly (beyond Number.MAX_SAFE_INTEGER)", () => {
		const huge = "90071992547409910.12";
		const result = fromDecimalString(GYD, huge);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.amountMinor).toBe(9_007_199_254_740_991_012n);
			expect(toDecimalString(result.value)).toBe(huge);
		}
	});
});

describe("add / subtract / negate / compare", () => {
	test("adds two same-currency amounts", () => {
		const result = add(fromMinor(GYD, 100n), fromMinor(GYD, 50n));
		expect(result).toEqual({ ok: true, value: fromMinor(GYD, 150n) });
	});

	test("subtracts two same-currency amounts", () => {
		const result = subtract(fromMinor(GYD, 100n), fromMinor(GYD, 30n));
		expect(result).toEqual({ ok: true, value: fromMinor(GYD, 70n) });
	});

	test("negate flips the sign", () => {
		expect(negate(fromMinor(GYD, 100n))).toEqual(fromMinor(GYD, -100n));
		expect(negate(fromMinor(GYD, -100n))).toEqual(fromMinor(GYD, 100n));
	});

	test("compare orders same-currency amounts", () => {
		expect(compare(fromMinor(GYD, 1n), fromMinor(GYD, 2n))).toEqual({
			ok: true,
			value: -1,
		});
		expect(compare(fromMinor(GYD, 2n), fromMinor(GYD, 1n))).toEqual({
			ok: true,
			value: 1,
		});
		expect(compare(fromMinor(GYD, 2n), fromMinor(GYD, 2n))).toEqual({
			ok: true,
			value: 0,
		});
	});

	test("add returns a validation error on currency mismatch, never a silent coercion", () => {
		const result = add(fromMinor(GYD, 100n), fromMinor(USD, 100n));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("validation");
			expect(result.error.retriable).toBe(false);
		}
	});

	test("subtract returns a validation error on currency mismatch", () => {
		const result = subtract(fromMinor(GYD, 100n), fromMinor(USD, 100n));
		expect(result.ok).toBe(false);
	});

	test("compare returns a validation error on currency mismatch", () => {
		const result = compare(fromMinor(GYD, 100n), fromMinor(USD, 100n));
		expect(result.ok).toBe(false);
	});
});

describe("multiplyByRatio: rounding table", () => {
	// 10.005 GYD (1000.5 minor units after *1/100... use clean cases below)
	test("half-even rounds a true tie to the nearest even result", () => {
		// 5n / 2n = 2.5 -> half-even rounds to 2 (even)
		const money = fromMinor(GYD, 5n);
		expect(multiplyByRatio(money, 1n, 2n, "half-even").amountMinor).toBe(2n);
		// 7n / 2n = 3.5 -> half-even rounds to 4 (even)
		const money2 = fromMinor(GYD, 7n);
		expect(multiplyByRatio(money2, 1n, 2n, "half-even").amountMinor).toBe(4n);
	});

	test("half-even rounds a non-tie normally (nearest)", () => {
		// 10n * 1/3 = 3.333 -> rounds down to 3
		expect(
			multiplyByRatio(fromMinor(GYD, 10n), 1n, 3n, "half-even").amountMinor
		).toBe(3n);
		// 10n * 2/3 = 6.666 -> rounds up to 7
		expect(
			multiplyByRatio(fromMinor(GYD, 10n), 2n, 3n, "half-even").amountMinor
		).toBe(7n);
	});

	test("down truncates toward zero regardless of remainder", () => {
		expect(
			multiplyByRatio(fromMinor(GYD, 5n), 1n, 2n, "down").amountMinor
		).toBe(2n);
		expect(
			multiplyByRatio(fromMinor(GYD, -5n), 1n, 2n, "down").amountMinor
		).toBe(-2n);
	});

	test("up rounds away from zero regardless of remainder", () => {
		expect(multiplyByRatio(fromMinor(GYD, 5n), 1n, 2n, "up").amountMinor).toBe(
			3n
		);
		expect(multiplyByRatio(fromMinor(GYD, -5n), 1n, 2n, "up").amountMinor).toBe(
			-3n
		);
	});

	test("exact (no-remainder) ratios are unaffected by rounding mode", () => {
		for (const rounding of ["half-even", "down", "up"] as const) {
			expect(
				multiplyByRatio(fromMinor(GYD, 100n), 1n, 4n, rounding).amountMinor
			).toBe(25n);
		}
	});

	test("14% VAT on 1000.00 GYD (tax pack example)", () => {
		const price = fromDecimalString(GYD, "1000.00");
		expect(price.ok).toBe(true);
		if (!price.ok) {
			return;
		}
		const vat = multiplyByRatio(price.value, 14n, 100n, "half-even");
		expect(toDecimalString(vat)).toBe("140.00");
	});

	test("14% VAT on an amount producing a fractional minor unit", () => {
		// 1050.55 GYD * 14% = 147.077 -> minor units 14707.7 -> half-even -> 14708
		const price = fromDecimalString(GYD, "1050.55");
		expect(price.ok).toBe(true);
		if (!price.ok) {
			return;
		}
		const vat = multiplyByRatio(price.value, 14n, 100n, "half-even");
		expect(vat.amountMinor).toBe(14_708n);
	});
});

describe("allocate: largest-remainder conservation", () => {
	test("splits evenly when it divides exactly", () => {
		const result = allocate(fromMinor(GYD, 300n), [1n, 1n, 1n]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.map((m) => m.amountMinor)).toEqual([
				100n,
				100n,
				100n,
			]);
		}
	});

	test("distributes the remainder to the largest-remainder shares (classic 100/3 case)", () => {
		const result = allocate(fromMinor(GYD, 100n), [1n, 1n, 1n]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			const amounts = result.value.map((m) => m.amountMinor);
			expect(amounts).toEqual([34n, 33n, 33n]);
			expect(amounts.reduce((sum, a) => sum + a, 0n)).toBe(100n);
		}
	});

	test("respects unequal weights", () => {
		const result = allocate(fromMinor(GYD, 100n), [1n, 2n, 3n]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			const amounts = result.value.map((m) => m.amountMinor);
			expect(amounts.reduce((sum, a) => sum + a, 0n)).toBe(100n);
			// Weight-3 share should be the largest, weight-1 the smallest.
			expect(amounts[2]).toBeGreaterThanOrEqual(amounts[1] as bigint);
			expect(amounts[1]).toBeGreaterThanOrEqual(amounts[0] as bigint);
		}
	});

	test("conserves the total exactly across many random-ish cases", () => {
		const cases: Array<{ total: bigint; parts: bigint[] }> = [
			{ parts: [1n, 1n, 1n], total: 1n },
			{ parts: [1n, 1n, 1n], total: 2n },
			{ parts: [3n, 3n, 3n], total: 10n },
			{ parts: [1n, 1n, 1n, 1n, 1n, 1n, 1n], total: 101n },
			{ parts: [7n, 11n, 13n, 17n], total: 999_999n },
			{ parts: [1n, 1n], total: 1_000_000_000_000n },
			{ parts: [1n, 1n, 1n], total: 0n },
			{ parts: [1n, 0n, 0n], total: 5n },
		];

		for (const { total, parts } of cases) {
			const result = allocate(fromMinor(GYD, total), parts);
			expect(result.ok).toBe(true);
			if (result.ok) {
				const sum = result.value.reduce((acc, m) => acc + m.amountMinor, 0n);
				expect(sum).toBe(total);
				expect(result.value).toHaveLength(parts.length);
			}
		}
	});

	test("every allocated share is non-negative when the total is non-negative", () => {
		const result = allocate(fromMinor(GYD, 7n), [1n, 1n, 1n, 1n, 1n]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			for (const share of result.value) {
				expect(share.amountMinor).toBeGreaterThanOrEqual(0n);
			}
		}
	});

	test("rejects a negative total", () => {
		const result = allocate(fromMinor(GYD, -10n), [1n, 1n]);
		expect(result.ok).toBe(false);
	});

	test("rejects an empty parts array", () => {
		const result = allocate(fromMinor(GYD, 10n), []);
		expect(result.ok).toBe(false);
	});

	test("rejects a negative weight", () => {
		const result = allocate(fromMinor(GYD, 10n), [1n, -1n]);
		expect(result.ok).toBe(false);
	});

	test("rejects an all-zero-weight parts array", () => {
		const result = allocate(fromMinor(GYD, 10n), [0n, 0n]);
		expect(result.ok).toBe(false);
	});

	test("conserves the total for large bigint amounts", () => {
		const total = 10n ** 18n + 7n;
		const result = allocate(fromMinor(GYD, total), [1n, 1n, 1n]);
		expect(result.ok).toBe(true);
		if (result.ok) {
			const sum = result.value.reduce((acc, m) => acc + m.amountMinor, 0n);
			expect(sum).toBe(total);
		}
	});
});
