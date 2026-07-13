/**
 * Time primitives: {@link Instant} (an absolute point in time) and
 * {@link BusinessDate} (a legally/business relevant calendar date in a
 * specific timezone).
 *
 * CLAUDE.md §7 "Money, Time, Quantity, and Identity": "Preserve timezone and
 * legally relevant local dates." An {@link Instant} alone (an absolute UTC
 * instant) cannot answer "what calendar date was this for the business" —
 * that depends on which timezone applies (a sale at 2026-01-01T02:00:00Z is
 * "2025-12-31" in Georgetown, Guyana but "2026-01-01" in UTC). Records where
 * the calendar date has legal or business significance (invoice date, tax
 * period, business-day cutoffs) must store the derived {@link BusinessDate}
 * alongside the {@link Instant} it was derived from and the timezone used,
 * rather than re-deriving the date later from the instant in whatever
 * timezone happens to be ambient at read time.
 */

import {
	err,
	ok,
	type PlatformError,
	type Result,
	validationError,
} from "./result";

/**
 * An absolute point in time, represented as epoch milliseconds (the same
 * representation `Date.now()` and `Date#getTime()` use).
 *
 * Design choice, documented per the instruction to record it explicitly:
 * epoch-milliseconds-as-number is adopted for the prototype because (a) it
 * round-trips losslessly through `Date`, `JSON`, and every database driver
 * this platform targets without a custom serializer, and (b) millisecond
 * resolution is sufficient for every first-slice business requirement (audit
 * ordering, business-date derivation, token expiry). It is explicitly a
 * prototype-depth choice: it does not model leap seconds, does not carry
 * sub-millisecond precision, and loses safe-integer precision far beyond any
 * realistic date (safe until year ~287396), which is acceptable for this
 * platform's horizon. A future ADR may promote this to a bigint-nanosecond
 * or dedicated temporal type if a concrete requirement needs it.
 */
export type Instant = number;

/**
 * The current instant.
 */
export function now(): Instant {
	return Date.now();
}

/**
 * Format an {@link Instant} as an ISO-8601 UTC string
 * (e.g. `2026-07-12T03:04:05.000Z`).
 */
export function toIso(instant: Instant): string {
	return new Date(instant).toISOString();
}

/**
 * Parse an ISO-8601 string into an {@link Instant}. Returns a `validation`
 * {@link PlatformError} rather than throwing or returning `NaN` when `iso`
 * does not parse to a valid instant.
 */
export function fromIso(iso: string): Result<Instant, PlatformError> {
	const parsed = Date.parse(iso);
	if (Number.isNaN(parsed)) {
		return err(
			validationError(`"${iso}" is not a parseable ISO-8601 instant`, {
				details: { iso },
			})
		);
	}
	return ok(parsed);
}

/**
 * A calendar date (`YYYY-MM-DD`) that is legally or operationally
 * significant independent of any particular instant's wall-clock time —
 * e.g. an invoice date, a tax period boundary, or a business-day cutoff.
 * Always derived from an {@link Instant} plus an explicit IANA timezone
 * identifier; never derived from an ambient/implicit timezone.
 */
export type BusinessDate = string & { readonly __brand: "BusinessDate" };

const BUSINESS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Structural check for `YYYY-MM-DD` shape (does not validate that the date
 * is a real calendar date, e.g. `2026-02-30` passes the shape check).
 */
export function isBusinessDate(value: string): value is BusinessDate {
	return BUSINESS_DATE_PATTERN.test(value);
}

/**
 * Brand a `YYYY-MM-DD` string as a {@link BusinessDate}. Returns a
 * `validation` {@link PlatformError} if the shape does not match.
 */
export function parseBusinessDate(
	value: string
): Result<BusinessDate, PlatformError> {
	if (!isBusinessDate(value)) {
		return err(
			validationError(`"${value}" is not a YYYY-MM-DD business date`, {
				details: { value },
			})
		);
	}
	return ok(value);
}

// en-CA formats as YYYY-MM-DD, which matches BusinessDate's wire format
// exactly and avoids hand-rolling zero-padding/locale-punctuation logic.
const BUSINESS_DATE_LOCALE = "en-CA";

/**
 * Derive the {@link BusinessDate} in effect for `instant` in the IANA
 * timezone `timeZoneId` (e.g. `"America/Guyana"`). This is the only
 * supported way to obtain a `BusinessDate` from an `Instant` — callers must
 * supply the timezone explicitly per CLAUDE.md §7 rather than relying on a
 * server/process default timezone.
 */
export function fromInstant(
	instant: Instant,
	timeZoneId: string
): BusinessDate {
	const formatter = new Intl.DateTimeFormat(BUSINESS_DATE_LOCALE, {
		day: "2-digit",
		month: "2-digit",
		timeZone: timeZoneId,
		year: "numeric",
	});
	// en-CA renders as "YYYY-MM-DD" already; formatToParts avoids depending on
	// that string layout remaining stable across Intl implementations.
	const parts = formatter.formatToParts(new Date(instant));
	const year = partValue(parts, "year");
	const month = partValue(parts, "month");
	const day = partValue(parts, "day");
	return `${year}-${month}-${day}` as BusinessDate;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
	const part = parts.find((candidate) => candidate.type === type);
	if (!part) {
		throw new Error(`Intl.DateTimeFormat did not produce a "${type}" part`);
	}
	return part.value;
}

function toUtcNoonDate(date: BusinessDate): Date {
	// Anchor at UTC noon (not midnight) so that adding/subtracting whole days
	// can never cross a UTC calendar boundary due to DST-unrelated rounding;
	// BusinessDate is a pure calendar date with no timezone attached once
	// derived, so all arithmetic on it is UTC calendar-day arithmetic.
	return new Date(`${date}T12:00:00.000Z`);
}

/**
 * Add (or, with a negative value, subtract) whole calendar days to a
 * {@link BusinessDate}. This is pure calendar-day arithmetic — it has no
 * timezone parameter because a `BusinessDate`, once derived, is just a
 * calendar date.
 */
export function addDays(date: BusinessDate, days: number): BusinessDate {
	const anchored = toUtcNoonDate(date);
	anchored.setUTCDate(anchored.getUTCDate() + days);
	const year = String(anchored.getUTCFullYear()).padStart(4, "0");
	const month = String(anchored.getUTCMonth() + 1).padStart(2, "0");
	const day = String(anchored.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}` as BusinessDate;
}

/**
 * Compare two {@link BusinessDate}s: negative if `a` is before `b`, positive
 * if `a` is after `b`, zero if equal. `YYYY-MM-DD` is lexicographically
 * sortable, so this is a plain string comparison.
 */
export function compareBusinessDate(a: BusinessDate, b: BusinessDate): number {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
}

/**
 * Compare two {@link Instant}s: negative if `a` is before `b`, positive if
 * `a` is after `b`, zero if equal.
 */
export function compareInstant(a: Instant, b: Instant): number {
	return a - b;
}
