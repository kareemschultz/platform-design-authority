"use client";

import { buttonVariants } from "@meridian/ui-web/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@meridian/ui-web/components/card";
import { ArrowRight, Boxes, ClipboardCheck, PackageSearch } from "lucide-react";
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
			<Card aria-labelledby="scope-heading" className="mb-6" role="region">
				<CardHeader>
					<h2
						className="cn-font-heading font-medium text-sm"
						data-slot="card-title"
						id="scope-heading"
					>
						Current operating scope
					</h2>
					<CardDescription className="text-sm">
						{organization?.name ?? "No active organization"} ·{" "}
						{location?.name ?? "All authorized locations"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm">
						Projection timestamps are evidence only; commands always re-check
						current authority and owner state.
					</p>
				</CardContent>
			</Card>
			<div className="grid gap-4 lg:grid-cols-3">
				{workspaces.map((item) => {
					const Icon = item.icon;
					return (
						<Card className="flex flex-col" key={item.href}>
							<CardHeader>
								<Icon aria-hidden="true" className="mb-1 text-primary" />
								<h2
									className="cn-font-heading font-medium text-sm"
									data-slot="card-title"
								>
									{item.label}
								</h2>
								<CardDescription className="text-sm">
									{item.description}
								</CardDescription>
							</CardHeader>
							<CardFooter className="mt-auto border-t-0 pt-0">
								<Link
									className={buttonVariants({ className: "w-full" })}
									href={item.href}
								>
									Open {item.label.toLowerCase()} <ArrowRight />
								</Link>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</OperationsPageFrame>
	);
}
