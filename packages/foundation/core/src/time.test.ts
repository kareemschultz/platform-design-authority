import { describe, expect, test } from "bun:test";
import type { BusinessDate } from "./time";
import {
	addDays,
	compareBusinessDate,
	compareInstant,
	fromInstant,
	fromIso,
	isBusinessDate,
	now,
	parseBusinessDate,
	toIso,
} from "./time";

function businessDate(value: string): BusinessDate {
	const result = parseBusinessDate(value);
	if (!result.ok) {
		throw new Error(`test fixture "${value}" is not a valid BusinessDate`);
	}
	return result.value;
}

describe("Instant: now/toIso/fromIso", () => {
	test("now() returns a value close to Date.now()", () => {
		const before = Date.now();
		const instant = now();
		const after = Date.now();
		expect(instant).toBeGreaterThanOrEqual(before);
		expect(instant).toBeLessThanOrEqual(after);
	});

	test("toIso formats as a UTC ISO-8601 string", () => {
		expect(toIso(0)).toBe("1970-01-01T00:00:00.000Z");
		expect(toIso(Date.UTC(2026, 6, 12, 3, 4, 5))).toBe(
			"2026-07-12T03:04:05.000Z"
		);
	});

	test("fromIso parses a valid ISO string back to the same instant", () => {
		const result = fromIso("2026-07-12T03:04:05.000Z");
		expect(result).toEqual({
			ok: true,
			value: Date.UTC(2026, 6, 12, 3, 4, 5),
		});
	});

	test("toIso and fromIso round-trip", () => {
		const instant = Date.UTC(2025, 11, 31, 23, 59, 59, 999);
		const result = fromIso(toIso(instant));
		expect(result).toEqual({ ok: true, value: instant });
	});

	test("fromIso rejects an unparseable string", () => {
		const result = fromIso("not-a-date");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("validation");
			expect(result.error.retriable).toBe(false);
		}
	});
});

describe("compareInstant", () => {
	test("orders instants correctly", () => {
		expect(compareInstant(1, 2)).toBeLessThan(0);
		expect(compareInstant(2, 1)).toBeGreaterThan(0);
		expect(compareInstant(5, 5)).toBe(0);
	});
});

describe("BusinessDate: isBusinessDate / parseBusinessDate", () => {
	test("accepts a YYYY-MM-DD shaped string", () => {
		expect(isBusinessDate("2026-07-12")).toBe(true);
	});

	test("rejects malformed shapes", () => {
		expect(isBusinessDate("2026-7-12")).toBe(false);
		expect(isBusinessDate("07/12/2026")).toBe(false);
		expect(isBusinessDate("2026-07-12T00:00:00Z")).toBe(false);
	});

	test("parseBusinessDate returns validation error for malformed input", () => {
		const result = parseBusinessDate("not-a-date");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("validation");
		}
	});

	test("parseBusinessDate accepts well-formed input", () => {
		const result = parseBusinessDate("2026-07-12");
		expect(result).toEqual({ ok: true, value: businessDate("2026-07-12") });
	});
});

describe("fromInstant: timezone-aware business date derivation", () => {
	test("America/Guyana is a fixed UTC-04:00 offset (no DST)", () => {
		// 03:59 UTC on Jan 1 is 23:59 local on Dec 31 in Guyana (UTC-4).
		const beforeMidnightUtc = Date.UTC(2026, 0, 1, 3, 59, 0);
		expect(String(fromInstant(beforeMidnightUtc, "America/Guyana"))).toBe(
			"2025-12-31"
		);

		// 04:00 UTC on Jan 1 is exactly 00:00 local on Jan 1 in Guyana.
		const atMidnightLocal = Date.UTC(2026, 0, 1, 4, 0, 0);
		expect(String(fromInstant(atMidnightLocal, "America/Guyana"))).toBe(
			"2026-01-01"
		);
	});

	test("the same instant can fall on different business dates in different timezones", () => {
		const instant = Date.UTC(2026, 0, 1, 2, 0, 0); // 2026-01-01T02:00:00Z
		expect(String(fromInstant(instant, "UTC"))).toBe("2026-01-01");
		expect(String(fromInstant(instant, "America/Guyana"))).toBe("2025-12-31");
	});

	test("mid-day instants land on the same date in both UTC and Guyana", () => {
		const instant = Date.UTC(2026, 5, 15, 18, 30, 0);
		expect(String(fromInstant(instant, "UTC"))).toBe("2026-06-15");
		expect(String(fromInstant(instant, "America/Guyana"))).toBe("2026-06-15");
	});
});

describe("addDays", () => {
	test("adds a positive number of days", () => {
		expect(String(addDays(businessDate("2026-07-12"), 1))).toBe("2026-07-13");
	});

	test("subtracts with a negative number of days", () => {
		expect(String(addDays(businessDate("2026-07-12"), -1))).toBe("2026-07-11");
	});

	test("rolls over a month boundary", () => {
		expect(String(addDays(businessDate("2026-01-31"), 1))).toBe("2026-02-01");
	});

	test("rolls over a year boundary", () => {
		expect(String(addDays(businessDate("2025-12-31"), 1))).toBe("2026-01-01");
	});

	test("handles the leap-day case (2028 is a leap year)", () => {
		expect(String(addDays(businessDate("2028-02-28"), 1))).toBe("2028-02-29");
		expect(String(addDays(businessDate("2028-02-29"), 1))).toBe("2028-03-01");
	});

	test("adding zero days is a no-op", () => {
		expect(String(addDays(businessDate("2026-07-12"), 0))).toBe("2026-07-12");
	});
});

describe("compareBusinessDate", () => {
	test("orders business dates lexicographically/chronologically", () => {
		const a = businessDate("2026-07-12");
		const b = businessDate("2026-07-13");
		expect(compareBusinessDate(a, b)).toBeLessThan(0);
		expect(compareBusinessDate(b, a)).toBeGreaterThan(0);
		expect(compareBusinessDate(a, a)).toBe(0);
	});
});
