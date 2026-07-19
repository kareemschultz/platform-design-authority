"use client";

import { OperationsPageFrame } from "@/components/operations-shared";
import { PosCrossLink } from "@/components/pos-shared";

export default function Page() {
	return (
		<OperationsPageFrame
			description="commerce.deposit.create / commerce.deposit.confirm. No commerce.deposit.* read/list endpoint is registered in this contract surface."
			title="Deposits"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<PosCrossLink
					description="Prepare a bank deposit from one or more closed register sessions."
					href="/operations/pos/deposits/new"
					label="Prepare a deposit"
				/>
				<PosCrossLink
					description="A second authorized identity confirms a prepared deposit by ID."
					href="/operations/pos/deposits/confirm"
					label="Confirm a deposit"
				/>
			</div>
		</OperationsPageFrame>
	);
}
