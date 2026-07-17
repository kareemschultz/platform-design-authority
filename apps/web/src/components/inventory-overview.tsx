"use client";

import { buttonVariants } from "@meridian/ui-web/components/button";
import {
	ArrowRight,
	ClipboardList,
	Scale,
	SlidersHorizontal,
	Truck,
} from "lucide-react";
import Link from "next/link";

import { OperationsPageFrame } from "./operations-shared";
import { useWorkspace } from "./workspace-context";

const INVENTORY_TASKS = [
	{
		description:
			"Read the latest location projection with its timestamp and reconciliation state.",
		href: "/operations/inventory/balances",
		icon: Scale,
		label: "Balances",
	},
	{
		description:
			"Create, approve, and reverse controlled quantity corrections.",
		href: "/operations/inventory/adjustments",
		icon: SlidersHorizontal,
		label: "Adjustments",
	},
	{
		description:
			"Capture blind observations, review variances, then approve and post.",
		href: "/operations/inventory/counts",
		icon: ClipboardList,
		label: "Counts",
	},
	{
		description:
			"Preserve custody through dispatch, partial receipt, final receipt, and exceptions.",
		href: "/operations/inventory/transfers",
		icon: Truck,
		label: "Transfers",
	},
] as const;

export function InventoryOverviewPage() {
	const workspace = useWorkspace();
	const locationId = workspace.identity?.activeContext?.locationId;
	const location = workspace.locations.find((item) => item.id === locationId);
	return (
		<OperationsPageFrame
			description="Task-focused Inventory workflows. Projections are evidence; every command rechecks current authority and owner state."
			title="Inventory"
		>
			<section
				aria-labelledby="inventory-scope-heading"
				className="mb-6 rounded-2xl border p-5"
			>
				<h2 className="font-medium" id="inventory-scope-heading">
					Selected location
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{location?.name ??
						"All authorized locations. Select a location above for location-specific work."}
				</p>
			</section>
			<div className="grid gap-4 md:grid-cols-2">
				{INVENTORY_TASKS.map((task) => {
					const Icon = task.icon;
					return (
						<section
							className="flex flex-col rounded-2xl border p-5"
							key={task.href}
						>
							<Icon aria-hidden="true" className="mb-3 text-primary" />
							<h2 className="font-medium">{task.label}</h2>
							<p className="mt-2 flex-1 text-muted-foreground text-sm">
								{task.description}
							</p>
							<Link
								className={buttonVariants({ className: "mt-5 min-h-10" })}
								href={task.href}
							>
								Open {task.label.toLowerCase()} <ArrowRight />
							</Link>
						</section>
					);
				})}
			</div>
		</OperationsPageFrame>
	);
}
