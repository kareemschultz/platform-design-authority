"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { Badge } from "@meridian/ui-web/components/badge";
import { buttonVariants } from "@meridian/ui-web/components/button";
import { Card } from "@meridian/ui-web/components/card";
import { Label } from "@meridian/ui-web/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@meridian/ui-web/components/select";
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
import { useCallback, useEffect, useId, useState } from "react";

import {
	appendCursorTrail,
	freshnessState,
	type MutationFailureKind,
	mutationFailurePresentation,
	operationsHref,
	parseCursorTrail,
	previousCursorState,
} from "@/lib/operations";
import { TABLE_DENSITY_STORAGE_KEY } from "@/lib/shell";

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

const DENSITY_LABELS: Record<TableDensity, string> = {
	comfortable: "Comfortable",
	compact: "Compact",
	touch: "Touch",
};

function isTableDensity(value: string | null): value is TableDensity {
	return value === "comfortable" || value === "compact" || value === "touch";
}

/**
 * Density is read from sessionStorage in an effect (not during render) to
 * avoid an SSR/hydration mismatch -- sessionStorage doesn't exist on the
 * server, so the first render always assumes "comfortable" and then
 * reconciles once mounted, matching workspace-context.tsx's
 * storedContextId/persistContext pattern for the same reason.
 */
export function useTableDensityPreference() {
	const [density, setDensityState] = useState<TableDensity>("comfortable");

	useEffect(() => {
		const stored = sessionStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
		if (isTableDensity(stored)) {
			setDensityState(stored);
		}
	}, []);

	const setDensity = useCallback((next: TableDensity) => {
		setDensityState(next);
		sessionStorage.setItem(TABLE_DENSITY_STORAGE_KEY, next);
	}, []);

	return [density, setDensity] as const;
}

export function DensityToggle({
	density,
	onDensityChange,
}: {
	density: TableDensity;
	onDensityChange: (next: TableDensity) => void;
}) {
	const id = useId();
	return (
		<div className="flex items-center gap-2">
			<Label className="text-muted-foreground text-xs" htmlFor={id}>
				Density
			</Label>
			<Select
				items={DENSITY_LABELS}
				onValueChange={(next) => onDensityChange(next as TableDensity)}
				value={density}
			>
				<SelectTrigger className="w-36" id={id} size="sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{(Object.keys(DENSITY_LABELS) as TableDensity[]).map((option) => (
						<SelectItem key={option} value={option}>
							{DENSITY_LABELS[option]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
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
			<Card className="hidden overflow-x-auto py-0 md:block">
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
			</Card>
			<ul aria-label={caption} className="grid gap-3 md:hidden">
				{items.map((item) => (
					<li key={rowKey(item)}>
						<Card className="px-4">
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
						</Card>
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

interface CollectionStateBodyProps<T> {
	caption: string;
	columns: DataColumn<T>[];
	density: TableDensity;
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
}

// Extracted from CollectionState so the density toggle (rendered once, in
// CollectionState below) can wrap every state -- loading/error/empty/
// populated -- without repeating it in each early return.
function CollectionStateBody<T>({
	caption,
	columns,
	density,
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
}: CollectionStateBodyProps<T>) {
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
				density={density}
				items={items}
				rowKey={rowKey}
			/>
			<CursorControls nextCursor={nextCursor ?? null} />
		</>
	);
}

export function CollectionState<T>(props: {
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
	const [density, setDensity] = useTableDensityPreference();
	return (
		<>
			<div className="mb-3 flex justify-end">
				<DensityToggle density={density} onDensityChange={setDensity} />
			</div>
			<CollectionStateBody {...props} density={density} />
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
