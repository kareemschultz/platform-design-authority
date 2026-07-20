"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { currentNavigationItem, OPERATIONS_NAVIGATION } from "@/lib/shell";

export function OperationsNavigation() {
	const pathname = usePathname();
	const router = useRouter();
	// WS3 remediation R3b, Item 9: resolves EXACTLY ONE current item (see
	// `currentNavigationItem`'s doc comment) rather than each link
	// independently re-deciding its own `aria-current` — both the mobile
	// `<select>`'s value and the desktop links' `aria-current` now derive
	// from this single source of truth.
	const current = currentNavigationItem(pathname, OPERATIONS_NAVIGATION);
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
			<div className="mx-auto hidden max-w-screen-2xl gap-1 overflow-x-auto px-4 py-2 sm:flex">
				{OPERATIONS_NAVIGATION.map((item) => (
					<Link
						aria-current={item.href === current.href ? "page" : undefined}
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
