"use client";

import { OperationsPageFrame } from "@/components/operations-shared";
import { PosCrossLink } from "@/components/pos-shared";

export default function Page() {
	return (
		<OperationsPageFrame
			description="No commerce.sale.* read/list endpoint is registered in this contract surface (frozen control plan §8); a sale is tracked by the browser that created it. Start a sale from a register session's view, or resume a held sale at /operations/pos/sales/{saleId} on the browser that holds it."
			title="Sales"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<PosCrossLink
					description='Open registers from the Registers area, then choose "Start a sale" from the session view.'
					href="/operations/pos/registers"
					label="Go to registers"
				/>
				<PosCrossLink
					description="A second authorized identity approves a pending price override by Sale ID and Price Override ID."
					href="/operations/pos/sales/price-overrides/approve"
					label="Approve a price override"
				/>
			</div>
		</OperationsPageFrame>
	);
}
