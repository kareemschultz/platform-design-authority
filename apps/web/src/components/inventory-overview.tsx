"use client";

import { buttonVariants } from "@meridian/ui-web/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@meridian/ui-web/components/card";
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
			<Card
				aria-labelledby="inventory-scope-heading"
				className="mb-6"
				role="region"
			>
				<CardHeader>
					<h2
						className="cn-font-heading font-medium text-sm"
						data-slot="card-title"
						id="inventory-scope-heading"
					>
						Selected location
					</h2>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						{location?.name ??
							"All authorized locations. Select a location above for location-specific work."}
					</p>
				</CardContent>
			</Card>
			<div className="grid gap-4 md:grid-cols-2">
				{INVENTORY_TASKS.map((task) => {
					const Icon = task.icon;
					return (
						<Card className="flex flex-col" key={task.href}>
							<CardHeader>
								<Icon aria-hidden="true" className="mb-1 text-primary" />
								<h2
									className="cn-font-heading font-medium text-sm"
									data-slot="card-title"
								>
									{task.label}
								</h2>
								<CardDescription className="text-sm">
									{task.description}
								</CardDescription>
							</CardHeader>
							<CardFooter className="mt-auto border-t-0 pt-0">
								<Link
									className={buttonVariants({
										className: "min-h-10 w-full",
									})}
									href={task.href}
								>
									Open {task.label.toLowerCase()} <ArrowRight />
								</Link>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</OperationsPageFrame>
	);
}
