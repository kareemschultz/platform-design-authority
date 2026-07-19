"use client";

import { buttonVariants } from "@meridian/ui-web/components/button";
import {
	ArrowRight,
	Boxes,
	ClipboardCheck,
	PackageSearch,
	ShoppingCart,
} from "lucide-react";
import Link from "next/link";

import { OperationsPageFrame } from "./operations-shared";
import { useWorkspace } from "./workspace-context";

const workspaces = [
	{
		description:
			"Search, create, review, activate, and archive Product aggregates.",
		href: "/operations/products",
		icon: PackageSearch,
		label: "Products",
	},
	{
		description:
			"Review balances and complete adjustment, count, and transfer workflows.",
		href: "/operations/inventory",
		icon: Boxes,
		label: "Inventory",
	},
	{
		description:
			"Upload bounded CSV files, review findings, approve, and reconcile imports.",
		href: "/operations/imports",
		icon: ClipboardCheck,
		label: "Imports",
	},
	{
		description:
			"Registers, sales, receipts, returns, refunds, deposits, and the accountant handoff export.",
		href: "/operations/pos",
		icon: ShoppingCart,
		label: "Point of Sale",
	},
] as const;

export function OperationsOverview() {
	const workspace = useWorkspace();
	const context = workspace.identity?.activeContext;
	const organization = workspace.organizations.find(
		(item) => item.id === context?.organizationId
	);
	const location = workspace.locations.find(
		(item) => item.id === context?.locationId
	);
	return (
		<OperationsPageFrame
			description="Task-focused Catalog and Inventory workflows. Every operation is revalidated by the server."
			title="Operations"
		>
			<section
				aria-labelledby="scope-heading"
				className="mb-6 rounded-2xl border p-5"
			>
				<h2 className="font-medium" id="scope-heading">
					Current operating scope
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{organization?.name ?? "No active organization"} ·{" "}
					{location?.name ?? "All authorized locations"}
				</p>
				<p className="mt-2 text-sm">
					Projection timestamps are evidence only; commands always re-check
					current authority and owner state.
				</p>
			</section>
			<div className="grid gap-4 lg:grid-cols-3">
				{workspaces.map((item) => {
					const Icon = item.icon;
					return (
						<section
							className="flex flex-col rounded-2xl border p-5"
							key={item.href}
						>
							<Icon aria-hidden="true" className="mb-3 text-primary" />
							<h2 className="font-medium">{item.label}</h2>
							<p className="mt-2 flex-1 text-muted-foreground text-sm">
								{item.description}
							</p>
							<Link
								className={buttonVariants({ className: "mt-5 min-h-10" })}
								href={item.href}
							>
								Open {item.label.toLowerCase()} <ArrowRight />
							</Link>
						</section>
					);
				})}
			</div>
		</OperationsPageFrame>
	);
}
