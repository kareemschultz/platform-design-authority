"use client";

import { OperationsPageFrame } from "./operations-shared";
import { POS_NAVIGATION, PosCrossLink } from "./pos-shared";

const DESCRIPTIONS: Record<string, string> = {
	"/operations/pos/deposits":
		"Prepare and confirm bank deposits (maker/checker).",
	"/operations/pos/exports":
		"Generate and download an accountant handoff export.",
	"/operations/pos/receipts": "Look up, reissue, or void a receipt.",
	"/operations/pos/refunds":
		"Request and approve cash refunds (maker/checker).",
	"/operations/pos/registers":
		"Open, view, and close a register session with cash movements and safe drops.",
	"/operations/pos/returns": "Create and approve returns (maker/checker).",
	"/operations/pos/sales": "Start a new sale or resume a held one.",
};

export function PosOverviewPage() {
	const links = POS_NAVIGATION.filter(
		(item) => item.href !== "/operations/pos"
	);
	return (
		<OperationsPageFrame
			description="Register open/close, sales, receipts, returns, refunds, deposits, and the accountant handoff export — every commerce.* POS workflow the frozen WS3 control plan assigns to this stage. Every operation is revalidated by the server."
			title="Point of Sale"
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{links.map((item) => (
					<PosCrossLink
						description={DESCRIPTIONS[item.href] ?? item.label}
						href={item.href}
						key={item.href}
						label={item.label}
					/>
				))}
			</div>
		</OperationsPageFrame>
	);
}
