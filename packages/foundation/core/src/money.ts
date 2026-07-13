/**
 * Authoritative money type and arithmetic.
 *
 * CLAUDE.md §7 "Money, Time, Quantity, and Identity": "Authoritative money
 * uses explicit currency and approved decimal/integer semantics, never
 * binary floating point" and "GYD is first-class; USD and other currencies
 * require explicit policy." Every {@link Money} value pairs a currency code
 * with an exact integer count of minor units (bigint) — there is no
 * floating-point number anywhere on the arithmetic path, so values cannot
 * accumulate representation error the way `0.1 + 0.2` does in IEEE 754.
 */

import {
	err,
	ok,
	type PlatformError,
	type Result,
	validationError,
} from "./result";

/**
 * A branded currency code, valid only once verified against
 * {@link registerCurrency}'s registry via {@link toCurrencyCode}.
 */
export type CurrencyCode = string & { readonly __brand: "CurrencyCode" };

/**
 * Authoritative money: an exact currency and an exact integer count of minor
 * units (e.g. cents for GYD/USD). `amountMinor` is a `bigint`, never a
 * `number`, so there is no floating-point step in any arithmetic path and no
 * upper bound imposed by `Number.MAX_SAFE_INTEGER`.
 */
export interface Money {
	readonly amountMinor: bigint;
	readonly currency: CurrencyCode;
}

/**
 * Registry of known currencies to their minor-unit exponent (the number of
 * digits after the decimal point one minor unit represents — 2 for cents-based
 * currencies). Seeded with GYD (first-class per CLAUDE.md §7) and USD.
 * Extensible at runtime via {@link registerCurrency}; any currency code not
 * present here is treated as unknown and rejected rather than defaulted.
 */
const currencyRegistry = new Map<string, number>([
	["GYD", 2],
	["USD", 2],
]);

/**
 * Register (or re-register with the same exponent) a currency's minor-unit
 * exponent. "Unknown currency = error" only holds until a currency is
 * registered; this is the explicit policy step CLAUDE.md §7 requires for any
 * currency beyond GYD's first-class status.
 *
 * Throws if an already-registered currency is re-registered with a
 * different exponent, since that would silently change the meaning of
 * every previously-constructed {@link Money} value in that currency.
 */
export function registerCurrency(
	code: string,
	minorUnitExponent: number
): void {
	const normalized = code.toUpperCase();
	const existing = currencyRegistry.get(normalized);
	if (existing !== undefined && existing !== minorUnitExponent) {
		throw new Error(
			`Currency "${normalized}" is already registered with minor-unit exponent ${existing}, cannot re-register with ${minorUnitExponent}`
		);
	}
	currencyRegistry.set(normalized, minorUnitExponent);
}

function lookupExponent(code: string): number | undefined {
	return currencyRegistry.get(code.toUpperCase());
}

/**
 * Validate and brand a currency code string against the registry. Returns a
 * `validation` {@link PlatformError} for any code not in
 * {@link registerCurrency}'s registry — an unknown currency is always an
 * error, never a silently-accepted default.
 */
export function toCurrencyCode(
	code: string
): Result<CurrencyCode, PlatformError> {
	if (lookupExponent(code) === undefined) {
		return err(
			validationError(`Unknown currency code "${code}"`, {
				details: { code },
			})
		);
	}
	return ok(code.toUpperCase() as CurrencyCode);
}

function exponentOf(currency: CurrencyCode): number {
	const exponent = lookupExponent(currency);
	if (exponent === undefined) {
		// Unreachable in practice: CurrencyCode values only originate from
		// toCurrencyCode, which already validated registry membership.
		throw new Error(`Unregistered currency code "${currency}"`);
	}
	return exponent;
}

/**
 * Construct a {@link Money} value directly from an integer minor-unit
 * amount. Use this when the minor-unit amount is already known exactly
 * (e.g. read back from a database column); use {@link fromDecimalString}
 * when parsing external decimal input.
 */
export function fromMinor(currency: CurrencyCode, amountMinor: bigint): Money {
	return { amountMinor, currency };
}

const DECIMAL_STRING_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

/**
 * Parse a decimal string (e.g. `"1000.00"`, `"-5.5"`, `"12"`) into a
 * {@link Money} value. String parsing only — this deliberately has no
 * overload accepting `number`, because a `number` input would already have
 * been through an IEEE 754 binary-floating-point representation before
 * reaching this function, defeating the purpose of exact bigint arithmetic
 * (e.g. `0.1 + 0.2 !== 0.3` as a `number`, but as strings `"0.1"` and
 * `"0.2"` parse to exact minor-unit integers).
 *
 * Rejects (as `validation` errors):
 * - Any non-decimal-string shape (scientific notation, thousands separators,
 *   `Infinity`/`NaN`, leading `+`, etc.)
 * - More fractional digits than the currency's minor-unit exponent allows —
 *   silently truncating or rounding user-supplied money input is exactly
 *   the kind of silent behavior CLAUDE.md §7 prohibits, so an
 *   over-precise input is a hard error, not a rounding decision made on the
 *   caller's behalf.
 */
export function fromDecimalString(
	currency: CurrencyCode,
	decimal: string
): Result<Money, PlatformError> {
	const match = DECIMAL_STRING_PATTERN.exec(decimal);
	if (!match) {
		return err(
			validationError(`"${decimal}" is not a valid decimal money string`, {
				details: { currency, decimal },
			})
		);
	}

	const [, sign, wholePart, fractionPart = ""] = match;
	const exponent = exponentOf(currency);
	if (fractionPart.length > exponent) {
		return err(
			validationError(
				`"${decimal}" has more fractional digits than ${currency} allows (max ${exponent})`,
				{ details: { currency, decimal, maxFractionDigits: exponent } }
			)
		);
	}

	const paddedFraction = fractionPart.padEnd(exponent, "0");
	const magnitude = BigInt(wholePart + paddedFraction);
	const amountMinor = sign === "-" ? -magnitude : magnitude;
	return ok({ amountMinor, currency });
}

function requireSameCurrency(
	a: Money,
	b: Money
): Result<CurrencyCode, PlatformError> {
	if (a.currency !== b.currency) {
		return err(
			validationError(`Currency mismatch: "${a.currency}" vs "${b.currency}"`, {
				details: { left: a.currency, right: b.currency },
			})
		);
	}
	return ok(a.currency);
}

/**
 * Add two {@link Money} values. Returns a `validation` {@link PlatformError}
 * (never a silent coercion) if the currencies differ.
 */
export function add(a: Money, b: Money): Result<Money, PlatformError> {
	const currency = requireSameCurrency(a, b);
	if (!currency.ok) {
		return currency;
	}
	return ok({
		amountMinor: a.amountMinor + b.amountMinor,
		currency: currency.value,
	});
}

/**
 * Subtract `b` from `a`. Returns a `validation` {@link PlatformError} if the
 * currencies differ.
 */
export function subtract(a: Money, b: Money): Result<Money, PlatformError> {
	const currency = requireSameCurrency(a, b);
	if (!currency.ok) {
		return currency;
	}
	return ok({
		amountMinor: a.amountMinor - b.amountMinor,
		currency: currency.value,
	});
}

/**
 * Negate a {@link Money} value (flip the sign of its minor-unit amount).
 */
export function negate(money: Money): Money {
	return { amountMinor: -money.amountMinor, currency: money.currency };
}

/**
 * Compare two same-currency {@link Money} values: negative if `a` < `b`,
 * positive if `a` > `b`, zero if equal. Returns a `validation`
 * {@link PlatformError} if the currencies differ.
 */
export function compare(a: Money, b: Money): Result<number, PlatformError> {
	const currency = requireSameCurrency(a, b);
	if (!currency.ok) {
		return currency;
	}
	if (a.amountMinor < b.amountMinor) {
		return ok(-1);
	}
	if (a.amountMinor > b.amountMinor) {
		return ok(1);
	}
	return ok(0);
}

/**
 * Rounding policy for {@link multiplyByRatio}. `"down"` truncates toward
 * zero, `"up"` rounds away from zero, `"half-even"` (banker's rounding)
 * rounds a value that lands exactly halfway to the nearest even result —
 * the standard policy for repeated aggregate rounding (e.g. tax
 * calculations) because it does not bias the sum upward or downward over
 * many roundings the way half-up does.
 */
export type RoundingMode = "half-even" | "down" | "up";

function divideWithRounding(
	numerator: bigint,
	denominator: bigint,
	rounding: RoundingMode
): bigint {
	if (denominator === 0n) {
		throw new RangeError("Cannot divide by a zero denominator");
	}

	// Normalize so denominator is positive, folding its sign into numerator;
	// simplifies every rounding-mode branch below to a single sign check.
	let n = numerator;
	let d = denominator;
	if (d < 0n) {
		n = -n;
		d = -d;
	}

	const quotient = n / d;
	const remainder = n % d;
	if (remainder === 0n) {
		return quotient;
	}

	const isNegative = n < 0n;
	const absRemainder = isNegative ? -remainder : remainder;
	const twiceRemainder = absRemainder * 2n;

	switch (rounding) {
		case "down":
			return quotient;
		case "up":
			return isNegative ? quotient - 1n : quotient + 1n;
		case "half-even": {
			if (twiceRemainder < d) {
				return quotient;
			}
			if (twiceRemainder > d) {
				return isNegative ? quotient - 1n : quotient + 1n;
			}
			// Exactly halfway: round to even.
			const isQuotientEven = quotient % 2n === 0n;
			if (isQuotientEven) {
				return quotient;
			}
			return isNegative ? quotient - 1n : quotient + 1n;
		}
		default: {
			const exhaustiveCheck: never = rounding;
			throw new Error(`Unhandled rounding mode: ${String(exhaustiveCheck)}`);
		}
	}
}

/**
 * Multiply a {@link Money} value by an exact rational ratio
 * (`numerator / denominator`), applying `rounding` to resolve the result to
 * an integer minor-unit amount. Used for e.g. applying a tax rate expressed
 * as an exact fraction (14% VAT as `14n / 100n`) without ever going through
 * a floating-point multiplication.
 */
export function multiplyByRatio(
	money: Money,
	numerator: bigint,
	denominator: bigint,
	rounding: RoundingMode
): Money {
	const scaledNumerator = money.amountMinor * numerator;
	const amountMinor = divideWithRounding(
		scaledNumerator,
		denominator,
		rounding
	);
	return { amountMinor, currency: money.currency };
}

/**
 * Split `money` into `parts.length` shares proportional to the (non-negative)
 * weights in `parts`, using the largest-remainder method: each share is
 * floor-divided first, then the leftover minor units (guaranteed fewer than
 * `parts.length`) are distributed one-by-one, in descending order of
 * discarded remainder (ties broken by ascending index), to the shares
 * closest to rounding up. This guarantees the shares sum to exactly
 * `money.amountMinor` — no minor unit is ever created or lost to rounding,
 * which a naive per-share rounding (e.g. rounding each share independently)
 * cannot guarantee.
 *
 * Requires `money.amountMinor >= 0` and every weight in `parts` to be `>= 0`
 * with at least one positive weight; returns a `validation`
 * {@link PlatformError} otherwise. (Allocating a negative or all-zero-weight
 * total is not a meaningful operation for this method.)
 */
export function allocate(
	money: Money,
	parts: readonly bigint[]
): Result<Money[], PlatformError> {
	if (money.amountMinor < 0n) {
		return err(
			validationError("allocate requires a non-negative amount", {
				details: { amountMinor: money.amountMinor.toString() },
			})
		);
	}
	if (parts.length === 0) {
		return err(validationError("allocate requires at least one part"));
	}
	if (parts.some((part) => part < 0n)) {
		return err(
			validationError("allocate requires all parts to be non-negative")
		);
	}

	const totalWeight = parts.reduce((sum, part) => sum + part, 0n);
	if (totalWeight === 0n) {
		return err(
			validationError("allocate requires at least one positive-weight part")
		);
	}

	const floorShares: bigint[] = [];
	const remainders: { index: number; remainder: bigint }[] = [];
	let allocatedSoFar = 0n;

	for (const [index, weight] of parts.entries()) {
		const rawShare = money.amountMinor * weight;
		const share = rawShare / totalWeight;
		const remainder = rawShare % totalWeight;
		floorShares.push(share);
		remainders.push({ index, remainder });
		allocatedSoFar += share;
	}

	let leftover = money.amountMinor - allocatedSoFar;

	// Largest remainder first; stable tie-break on original index since
	// Array#sort is stable and we sort a copy that still carries `index`.
	const byDescendingRemainder = [...remainders].sort((a, b) => {
		if (a.remainder === b.remainder) {
			return a.index - b.index;
		}
		return a.remainder > b.remainder ? -1 : 1;
	});

	for (const { index } of byDescendingRemainder) {
		if (leftover <= 0n) {
			break;
		}
		const current = floorShares[index];
		if (current === undefined) {
			continue;
		}
		floorShares[index] = current + 1n;
		leftover -= 1n;
	}

	return ok(
		floorShares.map((share) => ({
			amountMinor: share,
			currency: money.currency,
		}))
	);
}

/**
 * Format a {@link Money} value as a decimal string (e.g. `1000n` minor units
 * of a 2-exponent currency becomes `"10.00"`), the inverse of
 * {@link fromDecimalString}.
 */
export function toDecimalString(money: Money): string {
	const exponent = exponentOf(money.currency);
	const isNegative = money.amountMinor < 0n;
	const magnitude = isNegative ? -money.amountMinor : money.amountMinor;
	const digits = magnitude.toString().padStart(exponent + 1, "0");
	if (exponent === 0) {
		return `${isNegative ? "-" : ""}${digits}`;
	}
	const wholePart = digits.slice(0, digits.length - exponent);
	const fractionPart = digits.slice(digits.length - exponent);
	return `${isNegative ? "-" : ""}${wholePart}.${fractionPart}`;
}
