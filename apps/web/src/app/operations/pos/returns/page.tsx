"use client";

import { OperationsPageFrame } from "@/components/operations-shared";
import { PosCrossLink } from "@/components/pos-shared";

export default function Page() {
	return (
		<OperationsPageFrame
			description="commerce.return.create / commerce.return.approve. No commerce.return.* read/list endpoint is registered in this contract surface."
			title="Returns"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<PosCrossLink
					description="Look up an original sale and select lines to return."
					href="/operations/pos/returns/new"
					label="Create a return"
				/>
				<PosCrossLink
					description="A second authorized identity approves a pending return by ID."
					href="/operations/pos/returns/approve"
					label="Approve a return"
				/>
			</div>
		</OperationsPageFrame>
	);
}
