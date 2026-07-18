/**
 * WS3 PR0 publishes only the runtime-neutral pricing contract boundary.
 * `registry/first-slice.json` registers `engine.pricing` at `full` depth;
 * WS3's own packet framing describes this package's PR0-PR2 fidelity as
 * prototype-equivalent (line price x quantity plus any sale/line discounts
 * the frozen control plan declares, nothing speculative). The WS3 control
 * plan (docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md
 * section "Deviation record") reports this as a known depth gap rather
 * than claiming full-depth completion. Line pricing BEHAVIOR belongs to
 * WS3 PR2, never this package.
 */

export interface PricingLineInput {
	readonly discountAmount: string | null;
	readonly productId: string;
	readonly quantity: string;
	readonly unitPrice: string;
	readonly variantId: string | null;
}

export interface PricingLineResult {
	readonly discountAmount: string;
	readonly grossAmount: string;
	readonly netAmount: string;
}

/**
 * Published port a future PR2 adapter implements. PR0 defines the contract
 * shape only; it never supplies a calculating implementation here.
 */
export interface PricingEnginePort {
	priceLine: (input: PricingLineInput) => Promise<PricingLineResult>;
}

// ---------------------------------------------------------------------------
// WS3 PR2 implementation: unitPrice x quantity plus a declared per-line
// discount (CLAUDE.md §7 — exact decimal money, never binary floating
// point). Money is a two-decimal-place decimal string (matching the
// prototype GYD minor-unit policy in
// docs/blueprint/05-Industry-Packs/GUYANA_RETAIL_PROTOTYPE_TAX_PACK.md);
// quantity follows the same six-decimal-place convention Inventory already
// uses for `DecimalQuantity`. This is the prototype-equivalent fidelity the
// WS3 control plan §10.1 records against the registered full-depth
// `engine.pricing` capability — no sale-level discount, tiered pricing, or
// promotion evaluation is implemented; nothing speculative.
// ---------------------------------------------------------------------------

export const MONEY_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)\.[0-9]{2}$/;
const QUANTITY_DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;
const MONEY_SCALE = 100n;
const QUANTITY_SCALE = 1_000_000n;

export class PricingError extends Error {
	readonly code: "invalid_amount" | "invalid_quantity";
	constructor(code: PricingError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "PricingError";
	}
}

export function moneyToMinor(value: string, field: string): bigint {
	if (!MONEY_DECIMAL_PATTERN.test(value)) {
		throw new PricingError(
			"invalid_amount",
			`${field} must be a non-negative decimal with exactly two places`
		);
	}
	const [whole = "0", fraction = "00"] = value.split(".");
	return BigInt(whole) * MONEY_SCALE + BigInt(fraction);
}

export function minorToMoney(value: bigint): string {
	const whole = value / MONEY_SCALE;
	const fraction = (value % MONEY_SCALE).toString().padStart(2, "0");
	return `${whole}.${fraction}`;
}

function quantityToScaled(value: string): bigint {
	if (!QUANTITY_DECIMAL_PATTERN.test(value)) {
		throw new PricingError(
			"invalid_quantity",
			"quantity must be a non-negative decimal with at most six places"
		);
	}
	const [whole = "0", fraction = ""] = value.split(".");
	return BigInt(whole) * QUANTITY_SCALE + BigInt(fraction.padEnd(6, "0"));
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator / 2n) / denominator;
}

export function createPricingEngine(): PricingEnginePort {
	return {
		// biome-ignore lint/suspicious/useAwait: kept async so a validation error rejects the returned promise instead of throwing synchronously (the port's contract is Promise-returning).
		async priceLine(input: PricingLineInput): Promise<PricingLineResult> {
			const unitPriceMinor = moneyToMinor(input.unitPrice, "unitPrice");
			const quantityScaled = quantityToScaled(input.quantity);
			const grossMinor = roundHalfUp(
				unitPriceMinor * quantityScaled,
				QUANTITY_SCALE
			);
			const discountMinor = input.discountAmount
				? moneyToMinor(input.discountAmount, "discountAmount")
				: 0n;
			if (discountMinor > grossMinor) {
				throw new PricingError(
					"invalid_amount",
					"discountAmount cannot exceed the line's gross amount"
				);
			}
			const netMinor = grossMinor - discountMinor;
			return {
				discountAmount: minorToMoney(discountMinor),
				grossAmount: minorToMoney(grossMinor),
				netAmount: minorToMoney(netMinor),
			};
		},
	};
}
