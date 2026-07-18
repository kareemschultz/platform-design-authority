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
