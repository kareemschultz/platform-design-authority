"use client";

import { OperationsPageFrame } from "@/components/operations-shared";
import { PosCrossLink } from "@/components/pos-shared";

export default function Page() {
	return (
		<OperationsPageFrame
			description="No commerce.register.* read/list endpoint is registered in this contract surface (frozen control plan §8); a register session is tracked by the browser that opened it."
			title="Registers"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<PosCrossLink
					description="Enter a register ID and opening float."
					href="/operations/pos/registers/new"
					label="Open a register"
				/>
			</div>
		</OperationsPageFrame>
	);
}
