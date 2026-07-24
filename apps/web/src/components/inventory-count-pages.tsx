"use client";

import type { StockCount } from "@meridian/contracts-platform-api";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button, buttonVariants } from "@meridian/ui-web/components/button";
import { Card } from "@meridian/ui-web/components/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@meridian/ui-web/components/dialog";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
	isVersionConflict,
	operationsHref,
	stableIntentKey,
} from "@/lib/operations";
import { workspaceWorkState } from "@/lib/workspace-change";
import { orpc } from "@/utils/orpc";

import {
	CollectionState,
	type DataColumn,
	MutationError,
	OperationsPageFrame,
	StateBadge,
} from "./operations-shared";
import { QueryFailure } from "./query-state";
import { useWorkspace, useWorkspaceWorkGuard } from "./workspace-context";

const COUNT_STATES = [
	"Draft",
	"InProgress",
	"Submitted",
	"Approved",
	"Posted",
	"Rejected",
] as const;

function activeHeaders(contextId: string | null) {
	return { "x-active-context-id": contextId ?? "" };
}

function commandHeaders(
	contextId: string | null,
	idempotencyKey = crypto.randomUUID()
) {
	return {
		"idempotency-key": idempotencyKey,
		"x-active-context-id": contextId ?? "",
	};
}

function versionedCommandHeaders(contextId: string | null, version: number) {
	return {
		...commandHeaders(contextId),
		"if-match": String(version),
	};
}

function actorLabel(
	value: string | null,
	currentActorId: string | undefined,
	emptyLabel: string
) {
	if (!value) {
		return emptyLabel;
	}
	return value === currentActorId ? "You" : "Another operator";
}

function CountFilters() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [locationId, setLocationId] = useState(
		searchParams.get("locationId") ?? ""
	);
	const [state, setState] = useState(searchParams.get("state") ?? "");
	return (
		<form
			aria-label="Stock Count filters"
			className="mb-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					operationsHref(pathname, searchParams, {
						cursor: null,
						cursorTrail: null,
						locationId: locationId || null,
						state: COUNT_STATES.find((item) => item === state) ?? null,
					})
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="count-filter-location">Location</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="count-filter-location"
					onChange={(event) => setLocationId(event.target.value)}
					value={locationId}
				>
					<option value="">All authorized locations</option>
					{workspace.locations.map((location) => (
						<option key={location.id} value={location.id}>
							{location.name}
						</option>
					))}
				</select>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="count-filter-state">State</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="count-filter-state"
					onChange={(event) => setState(event.target.value)}
					value={state}
				>
					<option value="">All states</option>
					{COUNT_STATES.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
			<Button type="submit" variant="outline">
				Apply filters
			</Button>
		</form>
	);
}

export function CountListPage() {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const locationId = searchParams.get("locationId") ?? undefined;
	const rawState = searchParams.get("state");
	const state = COUNT_STATES.find((item) => item === rawState);
	const counts = useQuery({
		...orpc.inventory.counts.list.queryOptions({
			input: {
				headers: activeHeaders(workspace.contextId),
				query: { cursor, limit: 50, locationId, state },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
		staleTime: 10_000,
	});
	const columns: DataColumn<StockCount>[] = [
		{
			label: "Count",
			render: (count) => (
				<Link
					className="font-medium underline-offset-4 hover:underline"
					href={`/operations/inventory/counts/${encodeURIComponent(count.id)}`}
				>
					{count.id}
				</Link>
			),
		},
		{ label: "Location", render: (count) => count.locationId },
		{ label: "State", render: (count) => <StateBadge state={count.state} /> },
		{ label: "Observations", render: (count) => count.lines.length },
		{ label: "Version", render: (count) => count.version },
	];
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants()}
					href="/operations/inventory/counts/new"
				>
					<Plus /> Create count
				</Link>
			}
			description="Durable blind-count drafts preserve observations across reloads. Expected authority appears only after posting."
			title="Stock counts"
		>
			<CountFilters />
			<CollectionState
				caption="Stock counts in the current tenant"
				columns={columns}
				empty="No Stock Counts match this location and state."
				error={counts.error}
				isError={counts.isError}
				isFetching={counts.isFetching}
				isLoading={counts.isLoading}
				isOnline={workspace.isOnline}
				items={counts.data?.items}
				nextCursor={counts.data?.nextCursor}
				onRetry={() => counts.refetch()}
				rowKey={(count) => count.id}
			/>
		</OperationsPageFrame>
	);
}

export function CountCreatePage() {
	const workspace = useWorkspace();
	const router = useRouter();
	const create = useMutation(orpc.inventory.counts.create.mutationOptions());
	const [locationId, setLocationId] = useState(
		workspace.identity?.activeContext?.locationId ?? ""
	);
	const createIntent = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	useWorkspaceWorkGuard(
		workspaceWorkState(
			create.isPending,
			locationId !== (workspace.identity?.activeContext?.locationId ?? "")
		)
	);
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ variant: "outline" })}
					href="/operations/inventory/counts"
				>
					<ArrowLeft /> Back to counts
				</Link>
			}
			description="Create a blind Count at one authorized location. Scanned observations are saved separately before submission."
			title="Create Stock Count"
		>
			<form
				className="grid max-w-xl gap-4"
				onSubmit={async (event) => {
					event.preventDefault();
					const body = { blind: true as const, locationId };
					const intent = stableIntentKey(
						createIntent.current,
						JSON.stringify({ body, contextId: workspace.contextId }),
						() => crypto.randomUUID()
					);
					createIntent.current = intent;
					const result = await create.mutateAsync({
						body,
						headers: commandHeaders(workspace.contextId, intent.key),
					});
					createIntent.current = null;
					toast.success("Blind Count draft created");
					router.push(
						`/operations/inventory/counts/${encodeURIComponent(result.id)}`
					);
				}}
			>
				<div className="grid gap-1">
					<Label htmlFor="count-location">Location</Label>
					<select
						className="min-h-10 rounded-xl border bg-background px-3 text-sm"
						id="count-location"
						onChange={(event) => setLocationId(event.target.value)}
						required
						value={locationId}
					>
						<option value="">Select a location</option>
						{workspace.locations.map((location) => (
							<option key={location.id} value={location.id}>
								{location.name}
							</option>
						))}
					</select>
				</div>
				<p className="text-muted-foreground text-sm">
					Expected quantities remain hidden while the Count is open and
					submitted.
				</p>
				<MutationError error={create.error} />
				<Button
					className="w-fit"
					disabled={
						create.isPending ||
						!locationId ||
						!workspace.contextId ||
						!workspace.isOnline
					}
					type="submit"
				>
					{create.isPending ? "Creating…" : "Create blind Count"}
				</Button>
			</form>
		</OperationsPageFrame>
	);
}

function countInputLines(count: StockCount) {
	return count.lines.map((line) => ({
		conversionSourceId: line.conversionSourceId ?? null,
		observedQuantity: line.observedQuantity,
		productId: line.productId,
		unit: line.unit,
		variantId: line.variantId ?? null,
	}));
}

function CountScanner({ count }: { count: StockCount }) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const save = useMutation(orpc.inventory.counts.saveDraft.mutationOptions());
	const productInput = useRef<HTMLInputElement>(null);
	const [productId, setProductId] = useState("");
	const [variantId, setVariantId] = useState("");
	const [observedQuantity, setObservedQuantity] = useState("");
	const [unit, setUnit] = useState("each");
	useWorkspaceWorkGuard(
		workspaceWorkState(
			save.isPending,
			Boolean(
				productId.trim() ||
					variantId.trim() ||
					observedQuantity.trim() ||
					unit !== "each"
			)
		)
	);
	return (
		<form
			aria-labelledby="count-scanner-heading"
			className="rounded-2xl border p-4"
			onSubmit={async (event) => {
				event.preventDefault();
				const key = `${productId.trim()}\u001f${variantId.trim()}\u001f${unit.trim()}`;
				const retained = countInputLines(count).filter(
					(line) =>
						`${line.productId}\u001f${line.variantId ?? ""}\u001f${line.unit}` !==
						key
				);
				await save.mutateAsync({
					body: {
						lines: [
							...retained,
							{
								observedQuantity: observedQuantity.trim(),
								productId: productId.trim(),
								unit: unit.trim(),
								variantId: variantId.trim() || null,
							},
						],
					},
					headers: versionedCommandHeaders(workspace.contextId, count.version),
					params: { id: count.id },
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.inventory.counts.key(),
				});
				setProductId("");
				setVariantId("");
				setObservedQuantity("");
				toast.success("Observation saved to the Count draft");
				requestAnimationFrame(() => productInput.current?.focus());
			}}
		>
			<h2
				className="font-heading font-semibold text-xl"
				id="count-scanner-heading"
			>
				Scan or enter an observation
			</h2>
			<p className="mt-1 text-muted-foreground text-sm">
				External scanners can type a Product ID and press Enter through this
				standard keyboard form. Saving replaces the same Product, Variant, and
				unit observation.
			</p>
			<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div className="grid gap-1">
					<Label htmlFor="count-product">Product ID</Label>
					<Input
						id="count-product"
						onChange={(event) => setProductId(event.target.value)}
						ref={productInput}
						required
						value={productId}
					/>
				</div>
				<div className="grid gap-1">
					<Label htmlFor="count-variant">Variant ID (optional)</Label>
					<Input
						id="count-variant"
						onChange={(event) => setVariantId(event.target.value)}
						value={variantId}
					/>
				</div>
				<div className="grid gap-1">
					<Label htmlFor="count-observed">Observed quantity</Label>
					<Input
						id="count-observed"
						inputMode="decimal"
						onChange={(event) => setObservedQuantity(event.target.value)}
						required
						value={observedQuantity}
					/>
				</div>
				<div className="grid gap-1">
					<Label htmlFor="count-unit">Unit</Label>
					<Input
						id="count-unit"
						onChange={(event) => setUnit(event.target.value)}
						required
						value={unit}
					/>
				</div>
			</div>
			{isVersionConflict(save.error) ? (
				<p className="mt-3 text-destructive text-sm" role="alert">
					The Count changed while this observation was being entered. Your
					values remain visible; refresh and compare before saving again.
				</p>
			) : (
				<MutationError error={save.error} />
			)}
			<Button
				className="mt-4 min-h-12"
				disabled={
					save.isPending ||
					!workspace.isOnline ||
					!productId.trim() ||
					!observedQuantity.trim() ||
					!unit.trim()
				}
				type="submit"
			>
				{save.isPending ? "Saving…" : "Save observation"}
			</Button>
		</form>
	);
}

function CountActions({ count }: { count: StockCount }) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const submit = useMutation(orpc.inventory.counts.submit.mutationOptions());
	const approve = useMutation(orpc.inventory.counts.approve.mutationOptions());
	useWorkspaceWorkGuard(
		workspaceWorkState(submit.isPending || approve.isPending, false)
	);
	const refresh = async () =>
		queryClient.invalidateQueries({ queryKey: orpc.inventory.counts.key() });
	return (
		<div className="flex flex-wrap gap-2">
			{count.state === "Draft" || count.state === "InProgress" ? (
				<Dialog>
					<DialogTrigger render={<Button />}>Review submission</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Submit this blind Count?</DialogTitle>
							<DialogDescription>
								{count.lines.length} saved observation
								{count.lines.length === 1 ? "" : "s"} will be locked for
								independent review. Expected quantities remain hidden until
								posting.
							</DialogDescription>
						</DialogHeader>
						<MutationError error={submit.error} />
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Keep editing
							</DialogClose>
							<Button
								disabled={
									submit.isPending ||
									!workspace.isOnline ||
									count.lines.length === 0
								}
								onClick={async () => {
									await submit.mutateAsync({
										body: { lines: countInputLines(count) },
										headers: versionedCommandHeaders(
											workspace.contextId,
											count.version
										),
										params: { id: count.id },
									});
									await refresh();
									toast.success("Count submitted for review");
								}}
							>
								{submit.isPending ? "Submitting…" : "Submit for review"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
			{count.state === "Submitted" ? (
				<Dialog>
					<DialogTrigger render={<Button />}>Review approval</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Approve and post this Count?</DialogTitle>
							<DialogDescription>
								This one atomic command compares the blind observations, posts
								the resulting variances, and records immutable Inventory
								movements. The maker cannot approve their own Count.
							</DialogDescription>
						</DialogHeader>
						<MutationError error={approve.error} />
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Cancel
							</DialogClose>
							<Button
								disabled={approve.isPending || !workspace.isOnline}
								onClick={async () => {
									await approve.mutateAsync({
										headers: versionedCommandHeaders(
											workspace.contextId,
											count.version
										),
										params: { id: count.id },
									});
									await refresh();
									toast.success("Count approved and posted");
								}}
							>
								{approve.isPending ? "Posting…" : "Approve and post"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}

export function CountDetailPage({ countId }: { countId: string }) {
	const workspace = useWorkspace();
	const count = useQuery({
		...orpc.inventory.counts.get.queryOptions({
			input: {
				headers: activeHeaders(workspace.contextId),
				params: { id: countId },
			},
		}),
		enabled: Boolean(workspace.contextId && countId),
		retry: false,
	});
	if (count.isLoading) {
		return (
			<OperationsPageFrame
				description="Loading the current Count."
				title="Stock Count"
			>
				<p role="status">Loading Count…</p>
			</OperationsPageFrame>
		);
	}
	if (count.isError || !count.data) {
		return (
			<OperationsPageFrame
				description="The Count could not be loaded in the current tenant."
				title="Stock Count"
			>
				<QueryFailure
					error={count.error}
					isOnline={workspace.isOnline}
					onRetry={() => count.refetch()}
				/>
			</OperationsPageFrame>
		);
	}
	const current = count.data;
	const actorId = workspace.identity?.authUserId;
	return (
		<OperationsPageFrame
			actions={
				<>
					<Link
						className={buttonVariants({ variant: "outline" })}
						href="/operations/inventory/counts"
					>
						<ArrowLeft /> Back to counts
					</Link>
					<CountActions count={current} />
				</>
			}
			description="Durable blind-count state with explicit maker/checker evidence and atomic approval/posting."
			title={`Count ${current.id}`}
		>
			<div className="mb-5 flex flex-wrap gap-2">
				<StateBadge state={current.state} />
				<Badge variant="outline">Version {current.version}</Badge>
				<Badge variant="outline">
					{current.blind ? "Blind Count" : "Non-blind Count"}
				</Badge>
			</div>
			<Card className="mb-6 px-4">
				<dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<dt className="text-muted-foreground text-sm">Location</dt>
						<dd className="break-all">{current.locationId}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Created by</dt>
						<dd>
							{current.createdByUserId === actorId ? "You" : "Another operator"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Submitted by</dt>
						<dd>
							{actorLabel(current.submittedByUserId, actorId, "Not submitted")}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Approved by</dt>
						<dd>
							{actorLabel(current.approvedByUserId, actorId, "Not approved")}
						</dd>
					</div>
				</dl>
			</Card>
			{current.state === "Draft" || current.state === "InProgress" ? (
				<CountScanner count={current} />
			) : null}
			<section aria-labelledby="count-lines-heading" className="mt-6">
				<h2
					className="font-heading font-semibold text-xl"
					id="count-lines-heading"
				>
					Observations
				</h2>
				{current.lines.length ? (
					<ul className="mt-3 grid gap-3">
						{current.lines.map((line) => (
							<li key={line.id}>
								<Card className="px-4">
									<div>
										<p className="break-all font-medium">{line.productId}</p>
										<p className="text-muted-foreground text-sm">
											Observed {line.observedQuantity} {line.unit}
										</p>
									</div>
									{current.state === "Posted" ? (
										<dl className="grid grid-cols-2 gap-3 text-sm">
											<div>
												<dt>Expected</dt>
												<dd>{line.expectedQuantity}</dd>
											</div>
											<div>
												<dt>Variance</dt>
												<dd>{line.varianceQuantity}</dd>
											</div>
										</dl>
									) : (
										<p className="text-sm">
											Expected quantity remains hidden until posting.
										</p>
									)}
								</Card>
							</li>
						))}
					</ul>
				) : (
					<p className="mt-3 text-muted-foreground">
						No observations have been saved.
					</p>
				)}
			</section>
		</OperationsPageFrame>
	);
}
