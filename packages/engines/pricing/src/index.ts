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
