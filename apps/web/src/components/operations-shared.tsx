"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { Badge } from "@meridian/ui-web/components/badge";
import { buttonVariants } from "@meridian/ui-web/components/button";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	type TableDensity,
	TableHead,
	TableHeader,
	TableRow,
} from "@meridian/ui-web/components/table";
import { ArrowLeft, ArrowRight, Clock3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
	appendCursorTrail,
	freshnessState,
	type MutationFailureKind,
	mutationFailurePresentation,
	operationsHref,
	parseCursorTrail,
	previousCursorState,
} from "@/lib/operations";

import { EmptyState, QueryFailure } from "./query-state";

// Checked before SUCCESS_STATE_PATTERN: "PartiallyReceived" contains
// "received" and must classify as pending, not success.
const PENDING_STATE_PATTERN =
	/committing|dispatched|draft|inprogress|invited|partiallyreceived|pending|provisioning|readyforapproval|submitted|uploaded|validating/u;
const WARNING_STATE_PATTERN = /grace|requiresreview|suspended|warning/u;
const NEGATIVE_STATE_PATTERN =
	/cancelled|denied|error|exception|expired|failed|failure|mismatch|rejected|reversed|revoked/u;
// \bactive\b, not a plain substring: "Inactive" must fall through to the
// neutral outline bucket, not match as a false-positive success state.
// "trial" belongs here, not in the pending bucket: the entitlement engine's
// accessStatus() (packages/platform/entitlements/src/index.ts) treats Trial
// identically to Active for access -- badging it as pending would mislead
// operators into thinking a usable capability isn't active yet.
const SUCCESS_STATE_PATTERN =
	/accepted|approved|\bactive\b|completed|current|posted|received|reconciled|success|trial/u;

export interface DataColumn<T> {
	label: string;
	render: (item: T) => React.ReactNode;
}

export function OperationsPageFrame({
	actions,
	children,
	description,
	title,
}: {
	actions?: React.ReactNode;
	children: React.ReactNode;
	description: string;
	title: string;
}) {
	return (
		<div className="mx-auto max-w-screen-2xl px-4 py-6">
			<header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 max-w-3xl">
					<h1 className="break-words font-heading font-semibold text-2xl">
						{title}
					</h1>
					<p className="mt-1 text-muted-foreground">{description}</p>
				</div>
				{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
			</header>
			{children}
		</div>
	);
}

export function ResponsiveDataList<T>({
	caption,
	columns,
	density = "comfortable",
	items,
	rowKey,
}: {
	caption: string;
	columns: DataColumn<T>[];
	density?: TableDensity;
	items: T[];
	rowKey: (item: T) => string;
}) {
	return (
		<>
			<div className="hidden overflow-x-auto rounded-2xl border md:block">
				<Table density={density}>
					<TableCaption className="sr-only">{caption}</TableCaption>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead key={column.label}>{column.label}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item) => (
							<TableRow key={rowKey(item)}>
								{columns.map((column) => (
									<TableCell key={column.label}>
										{column.render(item)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<ul aria-label={caption} className="grid gap-3 md:hidden">
				{items.map((item) => (
					<li className="rounded-2xl border p-4" key={rowKey(item)}>
						<dl className="grid gap-3">
							{columns.map((column) => (
								<div className="grid gap-1" key={column.label}>
									<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										{column.label}
									</dt>
									<dd>{column.render(item)}</dd>
								</div>
							))}
						</dl>
					</li>
				))}
			</ul>
		</>
	);
}

export function CursorControls({ nextCursor }: { nextCursor: string | null }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentCursor = searchParams.get("cursor");
	const cursorTrail = parseCursorTrail(searchParams.get("cursorTrail"));
	const previous = previousCursorState(cursorTrail);
	if (!(previous || nextCursor)) {
		return null;
	}
	return (
		<nav aria-label="Result pages" className="mt-4 flex justify-between gap-3">
			{previous ? (
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={operationsHref(pathname, searchParams, previous)}
				>
					<ArrowLeft /> Previous page
				</Link>
			) : (
				<span />
			)}
			{nextCursor ? (
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={operationsHref(pathname, searchParams, {
						cursor: nextCursor,
						cursorTrail: appendCursorTrail(cursorTrail, currentCursor),
					})}
				>
					Next page <ArrowRight />
				</Link>
			) : null}
		</nav>
	);
}

export function CollectionState<T>({
	caption,
	columns,
	empty,
	error,
	isError,
	isFetching,
	isLoading,
	isOnline,
	items,
	nextCursor,
	onRetry,
	rowKey,
}: {
	caption: string;
	columns: DataColumn<T>[];
	empty: string;
	error: unknown;
	isError: boolean;
	isFetching: boolean;
	isLoading: boolean;
	isOnline: boolean;
	items: T[] | undefined;
	nextCursor: string | null | undefined;
	onRetry: () => void;
	rowKey: (item: T) => string;
}) {
	if (isLoading) {
		return (
			<div aria-label="Loading results" className="grid gap-3" role="status">
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		);
	}
	if (isError) {
		return <QueryFailure error={error} isOnline={isOnline} onRetry={onRetry} />;
	}
	if (!items?.length) {
		return <EmptyState>{empty}</EmptyState>;
	}
	return (
		<>
			<p aria-live="polite" className="sr-only" role="status">
				Result page loaded with {items.length} item
				{items.length === 1 ? "" : "s"}.
			</p>
			{isFetching ? (
				<p
					className="mb-3 flex items-center gap-2 text-muted-foreground text-sm"
					role="status"
				>
					<RefreshCw aria-hidden="true" className="size-4" /> Refreshing without
					changing your current selection.
				</p>
			) : null}
			<ResponsiveDataList
				caption={caption}
				columns={columns}
				items={items}
				rowKey={rowKey}
			/>
			<CursorControls nextCursor={nextCursor ?? null} />
		</>
	);
}

export function StateBadge({ state }: { state: string }) {
	const lowered = state.toLowerCase();
	let variant: React.ComponentProps<typeof Badge>["variant"] = "outline";
	if (PENDING_STATE_PATTERN.test(lowered)) {
		variant = "pending";
	} else if (WARNING_STATE_PATTERN.test(lowered)) {
		variant = "warning";
	} else if (NEGATIVE_STATE_PATTERN.test(lowered)) {
		variant = "destructive";
	} else if (SUCCESS_STATE_PATTERN.test(lowered)) {
		variant = "success";
	} else if (lowered === "info") {
		variant = "info";
	}
	return <Badge variant={variant}>{state}</Badge>;
}

export function FreshnessBadge({
	asOf,
	reconciled,
}: {
	asOf: string;
	reconciled?: boolean;
}) {
	const state = freshnessState(asOf, reconciled);
	let label = "Unreconciled projection";
	if (state === "current") {
		label = "Current projection";
	} else if (state === "stale") {
		label = "Stale projection";
	}
	return (
		<span className="inline-flex items-center gap-1 text-sm">
			<Clock3 aria-hidden="true" className="size-4" />
			{label} ·{" "}
			{new Intl.DateTimeFormat(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(new Date(asOf))}
		</span>
	);
}

const VARIANT_BY_MUTATION_FAILURE_KIND: Record<
	MutationFailureKind,
	React.ComponentProps<typeof Alert>["variant"]
> = {
	"approval-required": "pending",
	conflict: "warning",
	domain: "warning",
	entitlement: "warning",
	network: "offline",
	permission: "destructive",
	reauthenticate: "warning",
	"step-up": "warning",
	unavailable: "warning",
	validation: "destructive",
};

export function MutationError({
	error,
	isOnline = true,
}: {
	error: unknown;
	isOnline?: boolean;
}) {
	const presentation = mutationFailurePresentation(error, isOnline);
	if (!presentation) {
		return null;
	}
	return (
		<Alert
			role="alert"
			variant={VARIANT_BY_MUTATION_FAILURE_KIND[presentation.kind]}
		>
			<AlertTitle>{presentation.title}</AlertTitle>
			<AlertDescription>
				<p>{presentation.description}</p>
				{presentation.correlationId ? (
					<p className="mt-2 break-all font-mono text-xs">
						Reference: {presentation.correlationId}
					</p>
				) : null}
			</AlertDescription>
		</Alert>
	);
}
