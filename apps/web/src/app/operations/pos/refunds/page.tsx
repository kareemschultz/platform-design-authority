"use client";

import { OperationsPageFrame } from "@/components/operations-shared";
import { PosCrossLink } from "@/components/pos-shared";

export default function Page() {
	return (
		<OperationsPageFrame
			description="commerce.refund.create / commerce.refund.approve — cash refunds against an approved return. No commerce.refund.* read/list endpoint is registered in this contract surface."
			title="Refunds"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<PosCrossLink
					description="Request a cash refund against an approved return."
					href="/operations/pos/refunds/new"
					label="Request a refund"
				/>
				<PosCrossLink
					description="A second authorized identity approves a pending refund by ID."
					href="/operations/pos/refunds/approve"
					label="Approve a refund"
				/>
			</div>
		</OperationsPageFrame>
	);
}
