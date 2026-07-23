"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { Button, buttonVariants } from "@meridian/ui-web/components/button";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import {
	CircleAlert,
	KeyRound,
	PackageX,
	ShieldX,
	WifiOff,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	classifyShellFailure,
	type ShellFailure,
	sectionOverviewPath,
} from "@/lib/shell";

const copy: Record<ShellFailure, { description: string; title: string }> = {
	"approval-required": {
		description: "This action requires an approval before it can continue.",
		title: "Approval required",
	},
	"entitlement-unavailable": {
		description:
			"Your organization has not been provisioned for this capability.",
		title: "Capability unavailable",
	},
	offline: {
		description:
			"Reconnect before loading current authority or making changes.",
		title: "You are offline",
	},
	"permission-denied": {
		description: "Your current role and scope do not permit this operation.",
		title: "Permission denied",
	},
	reauthenticate: {
		description: "Your session is no longer valid. Sign in again to continue.",
		title: "Sign in again",
	},
	"step-up-required": {
		description:
			"A stronger authentication factor is required for this operation.",
		title: "Additional verification required",
	},
	unavailable: {
		description: "The service could not load this information. Try again.",
		title: "Information unavailable",
	},
};

export const reauthenticateLinkClassName = buttonVariants();

export function QueryFailure({
	error,
	isOnline,
	onRetry,
}: {
	error: unknown;
	isOnline: boolean;
	onRetry: () => void;
}) {
	const kind = classifyShellFailure(error, isOnline);
	const overviewHref = sectionOverviewPath(usePathname());
	const iconByFailure: Record<ShellFailure, typeof CircleAlert> = {
		"approval-required": CircleAlert,
		"entitlement-unavailable": PackageX,
		offline: WifiOff,
		"permission-denied": ShieldX,
		reauthenticate: KeyRound,
		"step-up-required": KeyRound,
		unavailable: CircleAlert,
	};
	const variantByFailure: Record<
		ShellFailure,
		React.ComponentProps<typeof Alert>["variant"]
	> = {
		"approval-required": "pending",
		"entitlement-unavailable": "warning",
		offline: "offline",
		"permission-denied": "destructive",
		reauthenticate: "warning",
		"step-up-required": "warning",
		unavailable: "warning",
	};
	const Icon = iconByFailure[kind];
	return (
		<Alert variant={variantByFailure[kind]}>
			<Icon />
			<AlertTitle>{copy[kind].title}</AlertTitle>
			<AlertDescription>
				<p>{copy[kind].description}</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{kind === "reauthenticate" ? (
						<Link
							className={reauthenticateLinkClassName}
							href={`/login?returnTo=${overviewHref}`}
						>
							Go to sign in
						</Link>
					) : (
						<Button onClick={onRetry} variant="outline">
							Try again
						</Button>
					)}
					<Link
						className={buttonVariants({ variant: "ghost" })}
						href={overviewHref}
					>
						Return to overview
					</Link>
				</div>
			</AlertDescription>
		</Alert>
	);
}

export function ListSkeleton() {
	return (
		<div aria-label="Loading" className="grid gap-3" role="status">
			<Skeleton className="h-14 w-full" />
			<Skeleton className="h-14 w-full" />
			<Skeleton className="h-14 w-full" />
		</div>
	);
}

export function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<p className="rounded-2xl border border-dashed p-6 text-muted-foreground">
			{children}
		</p>
	);
}
