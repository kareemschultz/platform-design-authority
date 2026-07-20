"use client";

import { Button, buttonVariants } from "@meridian/ui-web/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@meridian/ui-web/components/dropdown-menu";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link
				className={buttonVariants({
					className: "min-h-10",
					variant: "outline",
				})}
				href="/login"
			>
				Sign In
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button className="min-h-10 max-w-40" variant="outline" />}
			>
				{/* WS3 remediation R4, P2 item 10 / second-review item 13 (WCAG
				 * 1.4.10 zoom reflow, discovered via close-register's new
				 * 320-CSS-px reflow test): an unbounded, untruncated account
				 * name in the Header (shared, platform-wide chrome, not
				 * POS-specific) was the single largest contributor forcing
				 * `document.documentElement.scrollWidth` past the viewport at
				 * a 320px effective width — the accessible name (screen
				 * readers, `aria-label`) is UNCHANGED by a purely visual
				 * `truncate`; the full name remains reachable in the opened
				 * dropdown menu's own content below. */}
				<span className="truncate">{session.user.name}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										router.push("/");
									},
								},
							});
						}}
						variant="destructive"
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
