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

import { isNavigationCurrent } from "@/lib/shell";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();
	const links = [
		{ label: "Home", to: "/" },
		{ label: "Administration", to: "/administration" },
	] as const;

	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-between gap-3 px-4">
				<nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
					{links.map(({ to, label }) => (
						<Link
							aria-current={
								isNavigationCurrent(pathname, to) ? "page" : undefined
							}
							className="flex min-h-10 items-center rounded-xl px-3 font-medium text-sm hover:bg-muted aria-[current=page]:bg-muted"
							href={to}
							key={to}
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
							{links.map(({ to, label }) => (
								<Link
									aria-current={
										isNavigationCurrent(pathname, to) ? "page" : undefined
									}
									className="flex min-h-12 items-center rounded-xl px-3 font-medium hover:bg-muted aria-[current=page]:bg-muted"
									href={to}
									key={to}
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
