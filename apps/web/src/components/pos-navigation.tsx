"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { currentNavigationItem } from "@/lib/shell";

import { POS_NAVIGATION } from "./pos-shared";
import { useWorkspace } from "./workspace-context";

/**
 * WS3 remediation R3b, Item 9 (POS workspace/navigation).
 *
 * Before this fix, `POS_NAVIGATION` (pos-shared.tsx) was rendered ONLY as
 * a set of cross-links on the POS overview page (`pos-overview.tsx`) —
 * every deep POS route (an individual sale, a register session, a
 * receipt, a return/refund approval screen) had NO persistent POS
 * navigation at all; the only way back to another POS section was the
 * browser back button or re-navigating through the overview page. This
 * component is mounted once by `apps/web/src/app/operations/pos/layout.tsx`
 * (a nested Next.js layout, which persists across in-app navigation
 * within `/operations/pos/*`), so it is present on every POS route,
 * including ones reached by a direct URL/deep link.
 *
 * Also carries a lightweight persistent actor-identity strip ("Signed in
 * as ..."). This intentionally shows the Better Auth session identity,
 * NOT a resolved business role label (per CLAUDE.md §5, a Better Auth
 * user is not a Party or domain role) — showing "Cashier" or "Store
 * Manager" verbatim would require a role-assignment lookup scoped to the
 * active organization/location that does not exist as a cheap client
 * read in this contract surface yet; disclosed here rather than
 * fabricated. `authClient.useSession()` is the SAME hook `UserMenu`
 * already calls in the header, so this adds no new network request (its
 * TanStack Query-backed cache is shared).
 */
export function PosNavigation() {
	const pathname = usePathname();
	const router = useRouter();
	const workspace = useWorkspace();
	const { data: session } = authClient.useSession();
	// `POS_NAVIGATION`'s "Overview" href (`/operations/pos`) is a path
	// PREFIX of every other entry — `currentNavigationItem` (not each
	// item independently checking `isNavigationCurrent`) is what
	// guarantees exactly one entry is ever marked current instead of
	// "Overview" always matching alongside whichever section is actually
	// current.
	const current = currentNavigationItem(pathname, POS_NAVIGATION);

	return (
		<nav aria-label="POS" className="border-b bg-muted/20">
			<div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-4 py-2 lg:flex-row lg:items-center lg:justify-between">
				<div className="sm:hidden">
					<label
						className="grid gap-1 font-medium text-sm"
						htmlFor="pos-section"
					>
						POS section
						<select
							className="min-h-12 rounded-xl border bg-background px-3 font-normal"
							id="pos-section"
							onChange={(event) => {
								const destination = POS_NAVIGATION.find(
									(item) => item.href === event.target.value
								);
								if (destination) {
									router.push(destination.href);
								}
							}}
							value={current.href}
						>
							{POS_NAVIGATION.map((item) => (
								<option key={item.href} value={item.href}>
									{item.label}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="hidden gap-1 overflow-x-auto sm:flex">
					{POS_NAVIGATION.map((item) => (
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
				{session?.user && workspace.contextId ? (
					<p className="text-muted-foreground text-sm">
						Signed in as{" "}
						<span className="font-medium text-foreground">
							{session.user.name}
						</span>
					</p>
				) : null}
			</div>
		</nav>
	);
}
