"use client";
import { Button } from "@meridian/ui-web/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@meridian/ui-web/components/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavigationCurrent, PRIMARY_NAVIGATION } from "@/lib/shell";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();
	return (
		// WS3 remediation R3b, Item 12 (print composition): the persistent
		// header is application chrome — never part of a printed receipt or
		// any other printed page.
		<header className="border-b bg-background print:hidden">
			<div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-between gap-3 px-4">
				<nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
					{PRIMARY_NAVIGATION.map(({ href, label }) => (
						<Link
							aria-current={
								isNavigationCurrent(pathname, href) ? "page" : undefined
							}
							className="flex min-h-10 items-center rounded-xl px-3 font-medium text-sm hover:bg-muted aria-[current=page]:bg-muted"
							href={href}
							key={href}
						>
							{label}
						</Link>
					))}
				</nav>
				<Sheet>
					<SheetTrigger
						render={
							<Button
								className="size-10 md:hidden"
								size="icon"
								variant="outline"
							/>
						}
					>
						<Menu />
						<span className="sr-only">Open navigation</span>
					</SheetTrigger>
					<SheetContent side="left">
						<SheetHeader>
							<SheetTitle>Platform prototype</SheetTitle>
							<SheetDescription>Primary navigation</SheetDescription>
						</SheetHeader>
						<nav aria-label="Mobile primary" className="grid gap-1 px-4">
							{PRIMARY_NAVIGATION.map(({ href, label }) => (
								<Link
									aria-current={
										isNavigationCurrent(pathname, href) ? "page" : undefined
									}
									className="flex min-h-12 items-center rounded-xl px-3 font-medium hover:bg-muted aria-[current=page]:bg-muted"
									href={href}
									key={href}
								>
									{label}
								</Link>
							))}
						</nav>
					</SheetContent>
				</Sheet>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
