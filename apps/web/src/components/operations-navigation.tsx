"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { isNavigationCurrent, OPERATIONS_NAVIGATION } from "@/lib/shell";

export function OperationsNavigation() {
	const pathname = usePathname();
	const router = useRouter();
	const current =
		OPERATIONS_NAVIGATION.find((item) =>
			isNavigationCurrent(pathname, item.href)
		) ?? OPERATIONS_NAVIGATION[0];
	return (
		<nav aria-label="Operations" className="border-b">
			<div className="mx-auto max-w-screen-2xl px-4 py-2 sm:hidden">
				<label
					className="grid gap-1 font-medium text-sm"
					htmlFor="operations-section"
				>
					Operations section
					<select
						className="min-h-12 rounded-xl border bg-background px-3 font-normal"
						id="operations-section"
						onChange={(event) => {
							const destination = OPERATIONS_NAVIGATION.find(
								(item) => item.href === event.target.value
							);
							if (destination) {
								router.push(destination.href);
							}
						}}
						value={current.href}
					>
						{OPERATIONS_NAVIGATION.map((item) => (
							<option key={item.href} value={item.href}>
								{item.label}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="mx-auto hidden max-w-screen-2xl gap-1 px-4 py-2 sm:flex">
				{OPERATIONS_NAVIGATION.map((item) => (
					<Link
						aria-current={
							isNavigationCurrent(pathname, item.href) ? "page" : undefined
						}
						className="flex min-h-10 shrink-0 items-center rounded-xl px-3 font-medium text-sm hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
						href={item.href}
						key={item.href}
					>
						{item.label}
					</Link>
				))}
			</div>
		</nav>
	);
}
