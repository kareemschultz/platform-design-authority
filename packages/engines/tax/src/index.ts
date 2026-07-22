/**
 * WS3 PR0 publishes only the runtime-neutral tax contract boundary and the
 * fixed prototype categories from
 * `docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_PROTOTYPE_TAX_PACK.md`, as
 * DATA — not a statutory calculation implementation. `engine.tax` is
 * registered at `prototype` depth in `registry/first-slice.json`. Every
 * computed tax line PR2 produces MUST carry `NON_STATUTORY_NOTICE`
 * verbatim or an equivalent explicit prototype marker; this pack is not
 * legal or tax advice and does not authorize production use.
 */

export const NON_STATUTORY_NOTICE =
	"Prototype tax values only; not verified for statutory filing or production use.";

export const GY_STANDARD_RATE = "0.14";

export const TAX_CATEGORIES = [
	"GY_STANDARD_14",
	"GY_ZERO_RATED",
	"GY_EXEMPT",
	"GY_OUT_OF_SCOPE",
] as const;

export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export interface TaxLineInput {
	readonly category: TaxCategory;
	readonly inclusive: boolean;
	readonly taxableBase: string;
}

export interface TaxLineResult {
	readonly category: TaxCategory;
	readonly nonStatutory: true;
	readonly rate: string;
	readonly taxAmount: string;
	readonly taxableBase: string;
}

/**
 * Published port a future PR2 adapter implements against the tax-pack
 * exclusive/inclusive formulas. PR0 defines the contract shape only.
 */
export interface TaxEnginePort {
	calculateLine: (input: TaxLineInput) => Promise<TaxLineResult>;
}

// ---------------------------------------------------------------------------
// WS3 PR2 implementation of the exclusive/inclusive formulas from
// docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_PROTOTYPE_TAX_PACK.md
// §"Prototype Calculation Rules" (CLAUDE.md §7 — exact decimal money, never
// binary floating point):
//
//   Exclusive: tax = round(taxable_base x rate); total = taxable_base + tax
//   Inclusive: taxable_base = round(total / (1 + rate)); tax = total - taxable_base
//
// For the inclusive formula, `TaxLineInput.taxableBase` carries the
// tax-inclusive TOTAL (the pack computes the actual taxable base FROM that
// total); the field name is the one PR0 already froze on `TaxLineInput`, so
// this comment documents the convention rather than renaming it. WS3 PR2's
// own sale flow (`packages/domains/pos`) calls this engine in exclusive
// mode only — `CreateSale`/`SaleLineInput` has no inclusive-pricing flag,
// nothing speculative — but this package still implements both formulas
// because `engine.tax`'s registered prototype depth and the WS3 control
// plan §5.1 require both.
// ---------------------------------------------------------------------------

const MONEY_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)\.[0-9]{2}$/;
const MONEY_SCALE = 100n;
const RATE_SCALE = 100n; // rates are expressed with two decimal places, e.g. "0.14"
const RATE_DECIMAL_PATTERN = /^0\.[0-9]{2}$/;

const CATEGORY_RATES: Record<TaxCategory, string> = {
	GY_EXEMPT: "0.00",
	GY_OUT_OF_SCOPE: "0.00",
	GY_STANDARD_14: GY_STANDARD_RATE,
	GY_ZERO_RATED: "0.00",
};

export class TaxError extends Error {
	readonly code: "invalid_amount" | "invalid_category" | "invalid_rate";
	constructor(code: TaxError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "TaxError";
	}
}

function moneyToMinor(value: string, field: string): bigint {
	if (!MONEY_DECIMAL_PATTERN.test(value)) {
		throw new TaxError(
			"invalid_amount",
			`${field} must be a non-negative decimal with exactly two places`
		);
	}
	const [whole = "0", fraction = "00"] = value.split(".");
	return BigInt(whole) * MONEY_SCALE + BigInt(fraction);
}

function minorToMoney(value: bigint): string {
	const whole = value / MONEY_SCALE;
	const fraction = (value % MONEY_SCALE).toString().padStart(2, "0");
	return `${whole}.${fraction}`;
}

function rateToScaled(value: string): bigint {
	if (!RATE_DECIMAL_PATTERN.test(value)) {
		throw new TaxError(
			"invalid_rate",
			"rate must be a non-negative decimal with exactly two places"
		);
	}
	const [whole = "0", fraction = "00"] = value.split(".");
	return BigInt(whole) * RATE_SCALE + BigInt(fraction);
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator / 2n) / denominator;
}

export function createTaxEngine(): TaxEnginePort {
	return {
		// biome-ignore lint/suspicious/useAwait: kept async so a validation error rejects the returned promise instead of throwing synchronously (the port's contract is Promise-returning).
		async calculateLine(input: TaxLineInput): Promise<TaxLineResult> {
			const rate = CATEGORY_RATES[input.category];
			if (rate === undefined) {
				throw new TaxError(
					"invalid_category",
					`Unknown prototype tax category: ${input.category}`
				);
			}
			const rateScaled = rateToScaled(rate);
			const inputMinor = moneyToMinor(input.taxableBase, "taxableBase");
			if (input.inclusive) {
				// taxable_base = round(total / (1 + rate))
				const denominatorScaled = RATE_SCALE + rateScaled;
				const taxableBaseMinor = roundHalfUp(
					inputMinor * RATE_SCALE,
					denominatorScaled
				);
				const taxAmountMinor = inputMinor - taxableBaseMinor;
				return {
					category: input.category,
					nonStatutory: true,
					rate,
					taxAmount: minorToMoney(taxAmountMinor),
					taxableBase: minorToMoney(taxableBaseMinor),
				};
			}
			// tax = round(taxable_base x rate)
			const taxAmountMinor = roundHalfUp(inputMinor * rateScaled, RATE_SCALE);
			return {
				category: input.category,
				nonStatutory: true,
				rate,
				taxAmount: minorToMoney(taxAmountMinor),
				taxableBase: minorToMoney(inputMinor),
			};
		},
	};
}
