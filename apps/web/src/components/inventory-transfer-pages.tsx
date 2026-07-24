"use client";

import type { StockTransfer } from "@meridian/contracts-platform-api";
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
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
	outstandingTransferLineId,
	receiptIntentAfterDraftReset,
} from "@/lib/inventory-transfers";
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

const TRANSFER_STATES = [
	"Draft",
	"Dispatched",
	"PartiallyReceived",
	"Received",
	"Exception",
	"Cancelled",
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

function versionedCommandHeaders(
	contextId: string | null,
	version: number,
	idempotencyKey?: string
) {
	return {
		...commandHeaders(contextId, idempotencyKey),
		"if-match": String(version),
	};
}

function TransferFilters() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [locationId, setLocationId] = useState(
		searchParams.get("locationId") ?? ""
	);
	const [state, setState] = useState(searchParams.get("state") ?? "");
	return (
		<form
			aria-label="Transfer filters"
			className="mb-5 grid gap-3 rounded-2xl p-4 ring-(--border-strong) ring-1 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					operationsHref(pathname, searchParams, {
						cursor: null,
						cursorTrail: null,
						locationId: locationId || null,
						state: state || null,
					})
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="transfer-location-filter">Location</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="transfer-location-filter"
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
				<Label htmlFor="transfer-state-filter">State</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="transfer-state-filter"
					onChange={(event) => setState(event.target.value)}
					value={state}
				>
					<option value="">All states</option>
					{TRANSFER_STATES.map((item) => (
						<option key={item}>{item}</option>
					))}
				</select>
			</div>
			<Button type="submit" variant="outline">
				Apply filters
			</Button>
		</form>
	);
}

export function TransferListPage() {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const locationId = searchParams.get("locationId") ?? undefined;
	const rawState = searchParams.get("state");
	const state = TRANSFER_STATES.find((item) => item === rawState);
	const transfers = useQuery({
		...orpc.inventory.transfers.list.queryOptions({
			input: {
				headers: activeHeaders(workspace.contextId),
				query: { cursor, limit: 50, locationId, state },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
		staleTime: 10_000,
	});
	const columns: DataColumn<StockTransfer>[] = [
		{
			label: "Transfer",
			render: (transfer) => (
				<Link
					className="font-medium underline-offset-4 hover:underline"
					href={`/operations/inventory/transfers/${encodeURIComponent(transfer.id)}`}
				>
					{transfer.id}
				</Link>
			),
		},
		{
			label: "Route",
			render: (transfer) => (
				<span className="text-sm">
					{transfer.sourceLocationId} <ArrowRight className="inline size-4" />{" "}
					{transfer.destinationLocationId}
				</span>
			),
		},
		{
			label: "State",
			render: (transfer) => <StateBadge state={transfer.state} />,
		},
		{ label: "Lines", render: (transfer) => transfer.lines.length },
		{ label: "Version", render: (transfer) => transfer.version },
	];
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants()}
					href="/operations/inventory/transfers/new"
				>
					<Plus /> Create transfer
				</Link>
			}
			description="Track immutable custody facts through dispatch, partial receipt, final receipt, or an explicit exception."
			title="Stock transfers"
		>
			<TransferFilters />
			<CollectionState
				caption="Transfers in the current tenant"
				columns={columns}
				empty="No transfers match the current filters."
				error={transfers.error}
				isError={transfers.isError}
				isFetching={transfers.isFetching}
				isLoading={transfers.isLoading}
				isOnline={workspace.isOnline}
				items={transfers.data?.items}
				nextCursor={transfers.data?.nextCursor}
				onRetry={() => transfers.refetch()}
				rowKey={(transfer) => transfer.id}
			/>
		</OperationsPageFrame>
	);
}

export function TransferCreatePage() {
	const workspace = useWorkspace();
	const router = useRouter();
	const create = useMutation(orpc.inventory.transfers.create.mutationOptions());
	const [sourceLocationId, setSourceLocationId] = useState("");
	const [destinationLocationId, setDestinationLocationId] = useState("");
	const [productId, setProductId] = useState("");
	const [variantId, setVariantId] = useState("");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("each");
	const createIntent = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	useWorkspaceWorkGuard(
		workspaceWorkState(
			create.isPending,
			Boolean(
				sourceLocationId ||
					destinationLocationId ||
					productId ||
					variantId ||
					quantity ||
					unit !== "each"
			)
		)
	);
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ variant: "outline" })}
					href="/operations/inventory/transfers"
				>
					<ArrowLeft /> Back to transfers
				</Link>
			}
			description="Create a one-line controlled-prototype transfer. Dispatch remains a separate current-authority action."
			title="Create stock transfer"
		>
			<form
				className="grid max-w-2xl gap-4"
				onSubmit={async (event) => {
					event.preventDefault();
					const body = {
						destinationLocationId,
						lines: [
							{
								productId: productId.trim(),
								quantity: quantity.trim(),
								unit: unit.trim(),
								variantId: variantId.trim() || null,
							},
						],
						sourceLocationId,
					};
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
					toast.success("Transfer draft created");
					router.push(
						`/operations/inventory/transfers/${encodeURIComponent(result.id)}`
					);
				}}
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<LocationField
						id="transfer-source"
						label="Source location"
						locations={workspace.locations}
						onChange={setSourceLocationId}
						value={sourceLocationId}
					/>
					<LocationField
						id="transfer-destination"
						label="Destination location"
						locations={workspace.locations}
						onChange={setDestinationLocationId}
						value={destinationLocationId}
					/>
				</div>
				<TextInput
					id="transfer-product"
					label="Product ID"
					onChange={setProductId}
					value={productId}
				/>
				<TextInput
					id="transfer-variant"
					label="Variant ID (optional)"
					onChange={setVariantId}
					value={variantId}
				/>
				<div className="grid gap-4 sm:grid-cols-2">
					<TextInput
						id="transfer-quantity"
						inputMode="decimal"
						label="Requested quantity"
						onChange={setQuantity}
						value={quantity}
					/>
					<TextInput
						id="transfer-unit"
						label="Unit"
						onChange={setUnit}
						value={unit}
					/>
				</div>
				<p className="text-muted-foreground text-sm">
					The source and destination must differ. Quantities and unit conversion
					are revalidated by Inventory.
				</p>
				<MutationError error={create.error} isOnline={workspace.isOnline} />
				<Button
					className="w-fit"
					disabled={
						create.isPending ||
						!workspace.contextId ||
						!workspace.isOnline ||
						!sourceLocationId ||
						!destinationLocationId ||
						sourceLocationId === destinationLocationId ||
						!productId.trim() ||
						!quantity.trim() ||
						!unit.trim()
					}
					type="submit"
				>
					{create.isPending ? "Creating…" : "Create transfer draft"}
				</Button>
			</form>
		</OperationsPageFrame>
	);
}

function LocationField({
	id,
	label,
	locations,
	onChange,
	value,
}: {
	id: string;
	label: string;
	locations: Array<{ id: string; name: string }>;
	onChange: (value: string) => void;
	value: string;
}) {
	return (
		<div className="grid gap-1">
			<Label htmlFor={id}>{label}</Label>
			<select
				className="min-h-10 rounded-xl border bg-background px-3 text-sm"
				id={id}
				onChange={(event) => onChange(event.target.value)}
				required
				value={value}
			>
				<option value="">Select a location</option>
				{locations.map((location) => (
					<option key={location.id} value={location.id}>
						{location.name}
					</option>
				))}
			</select>
		</div>
	);
}

function TextInput({
	id,
	inputMode,
	label,
	onChange,
	value,
}: {
	id: string;
	inputMode?: "decimal" | "numeric";
	label: string;
	onChange: (value: string) => void;
	value: string;
}) {
	return (
		<div className="grid gap-1">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				inputMode={inputMode}
				onChange={(event) => onChange(event.target.value)}
				required={!label.includes("optional")}
				value={value}
			/>
		</div>
	);
}

function TransferActions({ transfer }: { transfer: StockTransfer }) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const dispatch = useMutation(
		orpc.inventory.transfers.dispatch.mutationOptions()
	);
	const receive = useMutation(
		orpc.inventory.transfers.receive.mutationOptions()
	);
	const [lineId, setLineId] = useState(transfer.lines[0]?.id ?? "");
	const [receivedQuantity, setReceivedQuantity] = useState("");
	const [outcome, setOutcome] = useState<"Accepted" | "Exception">("Accepted");
	const [exceptionReason, setExceptionReason] = useState("");
	const [receiveOpen, setReceiveOpen] = useState(false);
	const receiptIntentKey = useRef<ReturnType<typeof stableIntentKey> | null>(
		null
	);
	const selectedLineId = outstandingTransferLineId(transfer.lines, lineId);
	useEffect(() => {
		if (lineId !== selectedLineId) {
			setLineId(selectedLineId);
		}
	}, [lineId, selectedLineId]);
	useWorkspaceWorkGuard(
		workspaceWorkState(
			dispatch.isPending || receive.isPending,
			Boolean(receivedQuantity || exceptionReason || outcome !== "Accepted")
		)
	);
	const resetReceiptDraft = (confirmedSuccess = false) => {
		setLineId(outstandingTransferLineId(transfer.lines, ""));
		setReceivedQuantity("");
		setOutcome("Accepted");
		setExceptionReason("");
		receiptIntentKey.current = receiptIntentAfterDraftReset(
			receiptIntentKey.current,
			confirmedSuccess
		);
	};
	const refresh = async () =>
		queryClient.invalidateQueries({ queryKey: orpc.inventory.transfers.key() });
	return (
		<div className="flex flex-wrap gap-2">
			{transfer.state === "Draft" ? (
				<Dialog>
					<DialogTrigger render={<Button />}>Review dispatch</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Dispatch this transfer?</DialogTitle>
							<DialogDescription>
								Dispatch records custody leaving {transfer.sourceLocationId}. It
								is not a reversible edit.
							</DialogDescription>
						</DialogHeader>
						<MutationError
							error={dispatch.error}
							isOnline={workspace.isOnline}
						/>
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Keep draft
							</DialogClose>
							<Button
								disabled={dispatch.isPending || !workspace.isOnline}
								onClick={async () => {
									await dispatch.mutateAsync({
										headers: versionedCommandHeaders(
											workspace.contextId,
											transfer.version
										),
										params: { id: transfer.id },
									});
									await refresh();
									toast.success("Transfer dispatched");
								}}
							>
								{dispatch.isPending ? "Dispatching…" : "Dispatch transfer"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
			{transfer.state === "Dispatched" ||
			transfer.state === "PartiallyReceived" ? (
				<Dialog
					onOpenChange={(open) => {
						if (!open && receive.isPending) {
							return;
						}
						setReceiveOpen(open);
						if (!open) {
							resetReceiptDraft();
						}
					}}
					open={receiveOpen}
				>
					<DialogTrigger render={<Button />}>Receive stock</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Record a receipt</DialogTitle>
							<DialogDescription>
								Use a stable transfer line. A partial accepted quantity leaves
								the remainder in transit; an exception is terminal and
								correction uses an Adjustment.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-3">
							<div className="grid gap-1">
								<Label htmlFor="receive-line">Transfer line</Label>
								<select
									className="min-h-10 rounded-xl border bg-background px-3 text-sm"
									id="receive-line"
									onChange={(event) => setLineId(event.target.value)}
									value={selectedLineId}
								>
									{transfer.lines
										.filter((line) => line.remainingQuantity !== "0")
										.map((line) => (
											<option key={line.id} value={line.id}>
												{line.productId} · remaining {line.remainingQuantity}{" "}
												{line.unit}
											</option>
										))}
								</select>
							</div>
							<TextInput
								id="receive-quantity"
								inputMode="decimal"
								label="Received quantity"
								onChange={setReceivedQuantity}
								value={receivedQuantity}
							/>
							<div className="grid gap-1">
								<Label htmlFor="receive-outcome">Outcome</Label>
								<select
									className="min-h-10 rounded-xl border bg-background px-3 text-sm"
									id="receive-outcome"
									onChange={(event) =>
										setOutcome(event.target.value as "Accepted" | "Exception")
									}
									value={outcome}
								>
									<option>Accepted</option>
									<option>Exception</option>
								</select>
							</div>
							{outcome === "Exception" ? (
								<TextInput
									id="receive-exception"
									label="Exception reason"
									onChange={setExceptionReason}
									value={exceptionReason}
								/>
							) : null}
						</div>
						{isVersionConflict(receive.error) ? (
							<p className="text-destructive text-sm" role="alert">
								The transfer changed while this receipt was open. Your entered
								quantity remains visible; close, refresh, and compare before
								retrying.
							</p>
						) : (
							<MutationError
								error={receive.error}
								isOnline={workspace.isOnline}
							/>
						)}
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Cancel
							</DialogClose>
							<Button
								disabled={
									receive.isPending ||
									!workspace.isOnline ||
									!selectedLineId ||
									!receivedQuantity.trim() ||
									(outcome === "Exception" && !exceptionReason.trim())
								}
								onClick={async () => {
									const body = {
										exceptionReason:
											outcome === "Exception" ? exceptionReason.trim() : null,
										lines: [
											{
												lineId: selectedLineId,
												receivedQuantity: receivedQuantity.trim(),
											},
										],
										outcome,
									};
									const intent = stableIntentKey(
										receiptIntentKey.current,
										JSON.stringify({
											body,
											contextId: workspace.contextId,
											transferVersion: transfer.version,
										}),
										() => crypto.randomUUID()
									);
									receiptIntentKey.current = intent;
									await receive.mutateAsync({
										body,
										headers: versionedCommandHeaders(
											workspace.contextId,
											transfer.version,
											intent.key
										),
										params: { id: transfer.id },
									});
									await refresh();
									resetReceiptDraft(true);
									setReceiveOpen(false);
									toast.success("Receipt recorded");
								}}
							>
								{receive.isPending ? "Recording…" : "Record receipt"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}

export function TransferDetailPage({ transferId }: { transferId: string }) {
	const workspace = useWorkspace();
	const transfer = useQuery({
		...orpc.inventory.transfers.get.queryOptions({
			input: {
				headers: activeHeaders(workspace.contextId),
				params: { id: transferId },
			},
		}),
		enabled: Boolean(workspace.contextId && transferId),
		retry: false,
	});
	if (transfer.isLoading) {
		return (
			<OperationsPageFrame
				description="Loading current custody state."
				title="Stock transfer"
			>
				<p role="status">Loading transfer…</p>
			</OperationsPageFrame>
		);
	}
	if (transfer.isError || !transfer.data) {
		return (
			<OperationsPageFrame
				description="The transfer could not be loaded in the current tenant."
				title="Stock transfer"
			>
				<QueryFailure
					error={transfer.error}
					isOnline={workspace.isOnline}
					onRetry={() => transfer.refetch()}
				/>
			</OperationsPageFrame>
		);
	}
	return (
		<OperationsPageFrame
			actions={
				<>
					<Link
						className={buttonVariants({ variant: "outline" })}
						href="/operations/inventory/transfers"
					>
						<ArrowLeft /> Back to transfers
					</Link>
					<TransferActions transfer={transfer.data} />
				</>
			}
			description="Current Inventory transfer state. Custody facts are corrected through receipts, exceptions, and compensating adjustments—not destructive edits."
			title={`Transfer ${transfer.data.id}`}
		>
			<div className="mb-5 flex flex-wrap gap-2">
				<StateBadge state={transfer.data.state} />
				<Badge variant="outline">Version {transfer.data.version}</Badge>
			</div>
			<Card className="mb-6 px-4">
				<dl className="grid gap-3 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-sm">Source</dt>
						<dd>{transfer.data.sourceLocationId}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Destination</dt>
						<dd>{transfer.data.destinationLocationId}</dd>
					</div>
					{transfer.data.exceptionReason ? (
						<div className="sm:col-span-2">
							<dt className="text-muted-foreground text-sm">
								Exception reason
							</dt>
							<dd>{transfer.data.exceptionReason}</dd>
						</div>
					) : null}
				</dl>
			</Card>
			<section aria-labelledby="transfer-lines-heading">
				<h2
					className="font-heading font-semibold text-xl"
					id="transfer-lines-heading"
				>
					Transfer lines
				</h2>
				<ul className="mt-3 grid gap-3">
					{transfer.data.lines.map((line) => (
						<li key={line.id}>
							<Card className="px-4">
								<div>
									<p className="font-medium">{line.productId}</p>
									<p className="text-muted-foreground text-sm">
										Line {line.id}
									</p>
								</div>
								<dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
									<div>
										<dt>Requested</dt>
										<dd>
											{line.requestedQuantity} {line.unit}
										</dd>
									</div>
									<div>
										<dt>Dispatched</dt>
										<dd>{`${line.dispatchedQuantity} ${line.unit}`}</dd>
									</div>
									<div>
										<dt>Received</dt>
										<dd>{`${line.receivedQuantity} ${line.unit}`}</dd>
									</div>
									<div>
										<dt>Exception</dt>
										<dd>{`${line.exceptionQuantity} ${line.unit}`}</dd>
									</div>
									<div>
										<dt>Remaining</dt>
										<dd>{`${line.remainingQuantity} ${line.unit}`}</dd>
									</div>
								</dl>
								{transfer.data.state === "Exception" ? (
									<Link
										className="inline-flex underline"
										href={`/operations/inventory/adjustments/new?locationId=${encodeURIComponent(transfer.data.destinationLocationId)}&productId=${encodeURIComponent(line.productId)}${line.variantId ? `&variantId=${encodeURIComponent(line.variantId)}` : ""}&reason=${encodeURIComponent(`Correction for transfer ${transfer.data.id}, line ${line.id}`)}`}
									>
										Create compensating Adjustment
									</Link>
								) : null}
							</Card>
						</li>
					))}
				</ul>
			</section>
		</OperationsPageFrame>
	);
}
