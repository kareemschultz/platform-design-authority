"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMINISTRATION_NAVIGATION, isNavigationCurrent } from "@/lib/shell";

export function AdministrationNavigation() {
	const pathname = usePathname();
	return (
		<nav aria-label="Administration" className="border-b">
			<div className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto px-4 py-2">
				{ADMINISTRATION_NAVIGATION.map((item) => (
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
