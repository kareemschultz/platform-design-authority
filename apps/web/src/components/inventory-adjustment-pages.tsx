"use client";

import type { InventoryAdjustment } from "@meridian/contracts-platform-api";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button, buttonVariants } from "@meridian/ui-web/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@meridian/ui-web/components/card";
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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle2,
	CircleAlert,
	CloudOff,
	Plus,
	RotateCcw,
	Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	adjustmentCanApprove,
	adjustmentCanReverse,
	adjustmentCorrectionPrefill,
	adjustmentStateFromSearch,
	formatAdjustmentQuantity,
	INVENTORY_ADJUSTMENT_STATES,
} from "@/lib/inventory-adjustments";
import {
	isVersionConflict,
	operationsHref,
	safeOperationsReturn,
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

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{12,64}$/u;
const QUANTITY_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/u;

const AdjustmentCreateValuesSchema = z.object({
	conversionSourceId: z
		.string()
		.refine((value) => !value || IDENTIFIER_PATTERN.test(value), {
			message: "Use a valid conversion source identifier",
		}),
	locationId: z.string().regex(IDENTIFIER_PATTERN, "Choose a location"),
	productId: z.string().regex(IDENTIFIER_PATTERN, "Enter a valid Product ID"),
	quantity: z.string().regex(QUANTITY_PATTERN, {
		message: "Use a signed decimal with no more than 6 decimal places",
	}),
	reason: z.string().trim().min(1, "Reason is required").max(500),
	unit: z.string().trim().min(1, "Unit is required").max(50),
	variantId: z
		.string()
		.refine((value) => !value || IDENTIFIER_PATTERN.test(value), {
			message: "Use a valid Variant ID",
		}),
});

interface TextFieldAdapter {
	handleBlur: () => void;
	handleChange: (value: string) => void;
	name: string;
	state: {
		meta: { errors: Array<{ message?: string } | string | undefined> };
		value: string;
	};
}

function FieldErrors({ field }: { field: TextFieldAdapter }) {
	const messages = field.state.meta.errors
		.map((error) => (typeof error === "string" ? error : error?.message))
		.filter(Boolean);
	return messages.length ? (
		<p
			className="text-destructive text-sm"
			id={`${field.name}-error`}
			role="alert"
		>
			{messages.join(", ")}
		</p>
	) : null;
}

function TextField({
	description,
	field,
	inputMode,
	label,
	placeholder,
}: {
	description?: string;
	field: TextFieldAdapter;
	inputMode?: "decimal";
	label: string;
	placeholder?: string;
}) {
	const hasErrors = field.state.meta.errors.length > 0;
	const describedBy = [
		description ? `${field.name}-description` : null,
		hasErrors ? `${field.name}-error` : null,
	]
		.filter(Boolean)
		.join(" ");
	return (
		<div className="grid gap-1">
			<Label htmlFor={field.name}>{label}</Label>
			{description ? (
				<p
					className="text-muted-foreground text-sm"
					id={`${field.name}-description`}
				>
					{description}
				</p>
			) : null}
			<Input
				aria-describedby={describedBy || undefined}
				aria-invalid={hasErrors}
				id={field.name}
				inputMode={inputMode}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={placeholder}
				value={field.state.value}
			/>
			<FieldErrors field={field} />
		</div>
	);
}

function ScopeSummary({ locationId }: { locationId?: string | null }) {
	const workspace = useWorkspace();
	const context = workspace.identity?.activeContext;
	const organization = workspace.organizations.find(
		(item) => item.id === context?.organizationId
	);
	const location = workspace.locations.find((item) => item.id === locationId);
	return (
		<dl className="grid gap-3 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2">
			<div>
				<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
					Organization scope
				</dt>
				<dd className="mt-1 break-words">
					{organization?.name ?? context?.organizationId ?? "No active context"}
				</dd>
			</div>
			<div>
				<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
					Location scope
				</dt>
				<dd className="mt-1 break-words">
					{location?.name ?? locationId ?? "All permitted locations"}
				</dd>
			</div>
		</dl>
	);
}

function OfflineMutationAlert() {
	return (
		<Alert role="status">
			<CloudOff />
			<AlertTitle>Changes require a connection</AlertTitle>
			<AlertDescription>
				Previously loaded adjustment details may remain visible, but creating,
				approving, and reversing require fresh server authority.
			</AlertDescription>
		</Alert>
	);
}

function AdjustmentFilters() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [locationId, setLocationId] = useState(
		searchParams.get("locationId") ?? ""
	);
	const [state, setState] = useState(
		adjustmentStateFromSearch(searchParams.get("state")) ?? ""
	);
	return (
		<form
			aria-label="Inventory Adjustment filters"
			className="mb-5 grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					operationsHref(pathname, searchParams, {
						cursor: null,
						locationId: locationId || null,
						state: state || null,
					})
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="adjustment-location-filter">Location</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="adjustment-location-filter"
					onChange={(event) => setLocationId(event.target.value)}
					value={locationId}
				>
					<option value="">All permitted locations</option>
					{workspace.locations.map((location) => (
						<option key={location.id} value={location.id}>
							{location.name}
						</option>
					))}
				</select>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="adjustment-state-filter">State</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="adjustment-state-filter"
					onChange={(event) => setState(event.target.value)}
					value={state}
				>
					<option value="">All states</option>
					{INVENTORY_ADJUSTMENT_STATES.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
			<Button className="min-h-10" type="submit" variant="outline">
				<Search /> Apply filters
			</Button>
		</form>
	);
}

export function InventoryAdjustmentsPage() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const locationId = searchParams.get("locationId") ?? undefined;
	const state = adjustmentStateFromSearch(searchParams.get("state"));
	const adjustments = useQuery({
		...orpc.inventory.adjustments.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50, locationId, state },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
		staleTime: 15_000,
	});
	const returnTo = operationsHref(pathname, searchParams, {});
	const columns: DataColumn<InventoryAdjustment>[] = [
		{
			label: "Adjustment",
			render: (adjustment) => (
				<>
					<Link
						className="font-medium underline-offset-4 hover:underline"
						href={`/operations/inventory/adjustments/${encodeURIComponent(adjustment.id)}?returnTo=${encodeURIComponent(returnTo)}`}
					>
						{adjustment.reason}
					</Link>
					<span className="block break-all font-mono text-muted-foreground text-xs">
						{adjustment.id}
					</span>
				</>
			),
		},
		{
			label: "State",
			render: (adjustment) => <StateBadge state={adjustment.state} />,
		},
		{
			label: "Quantity",
			render: (adjustment) => (
				<span className="font-medium tabular-nums">
					{formatAdjustmentQuantity(adjustment.quantity, adjustment.unit)}
				</span>
			),
		},
		{
			label: "Location",
			render: (adjustment) =>
				workspace.locations.find(
					(location) => location.id === adjustment.locationId
				)?.name ?? adjustment.locationId,
		},
		{
			label: "Product / Variant",
			render: (adjustment) => (
				<span className="break-all font-mono text-xs">
					{adjustment.productId}
					{adjustment.variantId
						? ` / ${adjustment.variantId}`
						: " / no Variant"}
				</span>
			),
		},
		{ label: "Version", render: (adjustment) => adjustment.version },
	];
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ className: "min-h-10" })}
					href="/operations/inventory/adjustments/new"
				>
					<Plus /> Create Adjustment
				</Link>
			}
			description="Current-authority Inventory corrections. Filters are shareable in the URL and remain bounded to the active tenant and organization."
			title="Inventory Adjustments"
		>
			<ScopeSummary locationId={locationId} />
			<div className="mt-5">
				<AdjustmentFilters />
				<CollectionState
					caption="Inventory Adjustments in the current authority scope"
					columns={columns}
					empty={
						state || locationId
							? "No Inventory Adjustments match these filters."
							: "No Inventory Adjustments are available in this scope."
					}
					error={adjustments.error}
					isError={adjustments.isError}
					isFetching={adjustments.isFetching}
					isLoading={adjustments.isLoading}
					isOnline={workspace.isOnline}
					items={adjustments.data?.items}
					nextCursor={adjustments.data?.nextCursor}
					onRetry={() => adjustments.refetch()}
					rowKey={(adjustment) => adjustment.id}
				/>
			</div>
		</OperationsPageFrame>
	);
}

function InventoryAdjustmentCreateForm() {
	const workspace = useWorkspace();
	const router = useRouter();
	const searchParams = useSearchParams();
	const create = useMutation(
		orpc.inventory.adjustments.create.mutationOptions()
	);
	const activeLocationId = workspace.identity?.activeContext?.locationId ?? "";
	const initialPrefill = adjustmentCorrectionPrefill(
		searchParams,
		workspace.locations.map((location) => location.id),
		activeLocationId
	);
	const [isDirty, setIsDirty] = useState(
		Boolean(
			searchParams.get("locationId") ||
				searchParams.get("productId") ||
				searchParams.get("variantId") ||
				searchParams.get("reason")
		)
	);
	const [locationTouched, setLocationTouched] = useState(false);
	useWorkspaceWorkGuard(workspaceWorkState(create.isPending, isDirty));
	const form = useForm({
		defaultValues: {
			conversionSourceId: "",
			locationId: initialPrefill.locationId,
			productId: initialPrefill.productId,
			quantity: "",
			reason: initialPrefill.reason,
			unit: "each",
			variantId: initialPrefill.variantId,
		},
		onSubmit: async ({ value }) => {
			const result = await create.mutateAsync({
				body: {
					conversionSourceId: value.conversionSourceId.trim() || null,
					locationId: value.locationId,
					productId: value.productId.trim(),
					quantity: value.quantity,
					reason: value.reason.trim(),
					unit: value.unit.trim(),
					variantId: value.variantId.trim() || null,
				},
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
			});
			toast.success("Inventory Adjustment submitted for approval");
			router.push(
				`/operations/inventory/adjustments/${encodeURIComponent(result.id)}`
			);
		},
		onSubmitInvalid: () => {
			requestAnimationFrame(() =>
				document
					.querySelector<HTMLElement>(
						'#inventory-adjustment-create-form [aria-invalid="true"]'
					)
					?.focus()
			);
		},
		validators: { onSubmit: AdjustmentCreateValuesSchema },
	});

	useEffect(() => {
		const prefill = adjustmentCorrectionPrefill(
			searchParams,
			workspace.locations.map((location) => location.id),
			activeLocationId
		);
		if (prefill.locationId && !locationTouched) {
			form.setFieldValue("locationId", prefill.locationId);
		}
	}, [
		activeLocationId,
		form,
		locationTouched,
		searchParams,
		workspace.locations,
	]);

	return (
		<form
			className="grid max-w-3xl gap-5"
			id="inventory-adjustment-create-form"
			noValidate
			onChangeCapture={() => setIsDirty(true)}
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			{initialPrefill.ignored.length ? (
				<Alert role="status">
					<CircleAlert />
					<AlertTitle>Some correction details need review</AlertTitle>
					<AlertDescription>
						The linked {initialPrefill.ignored.join(", ")} value was not
						accepted. Enter it manually in the current workspace.
					</AlertDescription>
				</Alert>
			) : null}
			<form.Field name="locationId">
				{(field) => (
					<div className="grid gap-1">
						<Label htmlFor={field.name}>Location</Label>
						<select
							aria-describedby={
								field.state.meta.errors.length
									? `${field.name}-error`
									: undefined
							}
							aria-invalid={field.state.meta.errors.length > 0}
							className="min-h-10 rounded-xl border bg-background px-3 text-sm"
							id={field.name}
							onBlur={field.handleBlur}
							onChange={(event) => {
								setLocationTouched(true);
								field.handleChange(event.target.value);
							}}
							value={field.state.value}
						>
							<option value="">Choose a location</option>
							{workspace.locations.map((location) => (
								<option key={location.id} value={location.id}>
									{location.name}
								</option>
							))}
						</select>
						<FieldErrors field={field} />
					</div>
				)}
			</form.Field>
			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field name="productId">
					{(field) => <TextField field={field} label="Product ID" />}
				</form.Field>
				<form.Field name="variantId">
					{(field) => (
						<TextField
							description="Leave blank only when the Product operation is not Variant-specific."
							field={field}
							label="Variant ID (optional)"
						/>
					)}
				</form.Field>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field name="quantity">
					{(field) => (
						<TextField
							description="Use a positive value to add stock or a negative value to reduce stock."
							field={field}
							inputMode="decimal"
							label="Signed quantity"
							placeholder="-2 or 4.5"
						/>
					)}
				</form.Field>
				<form.Field name="unit">
					{(field) => (
						<TextField
							description="The unit is part of the authoritative quantity and remains visible during review."
							field={field}
							label="Unit"
						/>
					)}
				</form.Field>
			</div>
			<form.Field name="conversionSourceId">
				{(field) => (
					<TextField
						description="Required only when the quantity depends on a governed unit conversion source."
						field={field}
						label="Conversion source ID (optional)"
					/>
				)}
			</form.Field>
			<form.Field name="reason">
				{(field) => (
					<div className="grid gap-1">
						<Label htmlFor={field.name}>Reason</Label>
						<p
							className="text-muted-foreground text-sm"
							id={`${field.name}-description`}
						>
							Record the operational evidence for this correction. Do not
							include unnecessary personal data.
						</p>
						<textarea
							aria-describedby={`${field.name}-description${field.state.meta.errors.length ? ` ${field.name}-error` : ""}`}
							aria-invalid={field.state.meta.errors.length > 0}
							className="min-h-28 rounded-xl border bg-background px-3 py-2 text-sm"
							id={field.name}
							maxLength={500}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							value={field.state.value}
						/>
						<FieldErrors field={field} />
					</div>
				)}
			</form.Field>
			<Alert>
				<CircleAlert />
				<AlertTitle>Approval is a separate authority action</AlertTitle>
				<AlertDescription>
					Creating this record submits it as Pending Approval. The creator
					cannot approve and post the same adjustment; another currently
					authorized operator must review it.
				</AlertDescription>
			</Alert>
			{workspace.isOnline ? null : <OfflineMutationAlert />}
			<MutationError error={create.error} isOnline={workspace.isOnline} />
			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
			>
				{({ canSubmit, isSubmitting }) => (
					<Button
						className="min-h-10 w-fit"
						disabled={
							!canSubmit ||
							isSubmitting ||
							!workspace.contextId ||
							!workspace.isOnline
						}
						type="submit"
					>
						{isSubmitting ? "Submitting Adjustment…" : "Submit for approval"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

export function InventoryAdjustmentCreatePage() {
	const workspace = useWorkspace();
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ variant: "outline" })}
					href="/operations/inventory/adjustments"
				>
					<ArrowLeft /> Back to Adjustments
				</Link>
			}
			description="Create a bounded, reviewable Inventory correction. Posting occurs only after a separate approval action."
			title="Create Inventory Adjustment"
		>
			<ScopeSummary
				locationId={workspace.identity?.activeContext?.locationId ?? null}
			/>
			<div className="mt-6">
				<InventoryAdjustmentCreateForm />
			</div>
		</OperationsPageFrame>
	);
}

function VersionConflictMessage({
	adjustment,
	preservedReason,
}: {
	adjustment: InventoryAdjustment;
	preservedReason?: string;
}) {
	return (
		<p className="text-destructive text-sm" role="alert">
			This Adjustment changed after you opened version {adjustment.version}.
			{preservedReason
				? " Your reversal reason is preserved in this dialog."
				: ""}{" "}
			Refresh the record, confirm its current state, and decide again.
		</p>
	);
}

function AdjustmentActions({
	adjustment,
}: {
	adjustment: InventoryAdjustment;
}) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const approve = useMutation(
		orpc.inventory.adjustments.approve.mutationOptions()
	);
	const reverse = useMutation(
		orpc.inventory.adjustments.reverse.mutationOptions()
	);
	const [reversalReason, setReversalReason] = useState("");
	useWorkspaceWorkGuard(
		workspaceWorkState(
			approve.isPending || reverse.isPending,
			Boolean(reversalReason)
		)
	);
	const refresh = async () =>
		queryClient.invalidateQueries({
			queryKey: orpc.inventory.adjustments.key(),
		});
	return (
		<div className="flex flex-wrap gap-2">
			{adjustmentCanApprove(adjustment) ? (
				<Dialog>
					<DialogTrigger render={<Button />}>
						<CheckCircle2 /> Approve and post
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Approve and post this Adjustment?</DialogTitle>
							<DialogDescription>
								Approval posts an immutable Inventory movement for{" "}
								{formatAdjustmentQuantity(adjustment.quantity, adjustment.unit)}
								. The creator cannot approve their own Adjustment, and current
								authority is re-evaluated by the server.
							</DialogDescription>
						</DialogHeader>
						{workspace.isOnline ? null : <OfflineMutationAlert />}
						{isVersionConflict(approve.error) ? (
							<VersionConflictMessage adjustment={adjustment} />
						) : (
							<MutationError
								error={approve.error}
								isOnline={workspace.isOnline}
							/>
						)}
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Cancel
							</DialogClose>
							<Button
								disabled={approve.isPending || !workspace.isOnline}
								onClick={async () => {
									await approve.mutateAsync({
										headers: {
											"idempotency-key": crypto.randomUUID(),
											"if-match": String(adjustment.version),
											"x-active-context-id": workspace.contextId ?? "",
										},
										params: { id: adjustment.id },
									});
									await refresh();
									toast.success("Inventory Adjustment approved and posted");
								}}
							>
								{approve.isPending ? "Approving…" : "Approve and post"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
			{adjustmentCanReverse(adjustment) ? (
				<Dialog>
					<DialogTrigger render={<Button variant="destructive" />}>
						<RotateCcw /> Reverse
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Reverse this posted Adjustment?</DialogTitle>
							<DialogDescription>
								The original movement is never edited. This action creates a
								linked compensating movement for the opposite quantity and may
								be rejected if current stock or authority no longer permits it.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-1">
							<Label htmlFor="adjustment-reversal-reason">
								Reversal reason
							</Label>
							<textarea
								className="min-h-24 rounded-xl border bg-background px-3 py-2 text-sm"
								id="adjustment-reversal-reason"
								maxLength={500}
								onChange={(event) => setReversalReason(event.target.value)}
								value={reversalReason}
							/>
						</div>
						{workspace.isOnline ? null : <OfflineMutationAlert />}
						{isVersionConflict(reverse.error) ? (
							<VersionConflictMessage
								adjustment={adjustment}
								preservedReason={reversalReason}
							/>
						) : (
							<MutationError
								error={reverse.error}
								isOnline={workspace.isOnline}
							/>
						)}
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Keep posted movement
							</DialogClose>
							<Button
								disabled={
									reverse.isPending ||
									!reversalReason.trim() ||
									!workspace.isOnline
								}
								onClick={async () => {
									await reverse.mutateAsync({
										body: { reason: reversalReason.trim() },
										headers: {
											"idempotency-key": crypto.randomUUID(),
											"if-match": String(adjustment.version),
											"x-active-context-id": workspace.contextId ?? "",
										},
										params: { id: adjustment.id },
									});
									await refresh();
									toast.success("Compensating Inventory movement created");
								}}
								variant="destructive"
							>
								{reverse.isPending ? "Reversing…" : "Create reversal"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}

function AdjustmentFacts({ adjustment }: { adjustment: InventoryAdjustment }) {
	const facts = [
		["Adjustment ID", adjustment.id],
		["Location ID", adjustment.locationId],
		["Product ID", adjustment.productId],
		["Variant ID", adjustment.variantId ?? "Not specified"],
		[
			"Quantity",
			formatAdjustmentQuantity(adjustment.quantity, adjustment.unit),
		],
		["Conversion source ID", adjustment.conversionSourceId ?? "Not required"],
		["Posted movement ID", adjustment.movementId ?? "Not posted"],
		["Reversal movement ID", adjustment.reversalMovementId ?? "Not reversed"],
	] as const;
	return (
		<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
			<Card>
				<CardHeader>
					<CardTitle>Adjustment facts</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
						{facts.map(([label, value]) => (
							<div key={label}>
								<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
									{label}
								</dt>
								<dd className="mt-1 break-all">{value}</dd>
							</div>
						))}
					</dl>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Reason</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="whitespace-pre-wrap break-words">{adjustment.reason}</p>
				</CardContent>
			</Card>
		</div>
	);
}

export function InventoryAdjustmentDetailPage({
	adjustmentId,
}: {
	adjustmentId: string;
}) {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const adjustment = useQuery({
		...orpc.inventory.adjustments.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { id: adjustmentId },
			},
		}),
		enabled: Boolean(workspace.contextId && adjustmentId),
		retry: false,
	});
	const returnTo = safeOperationsReturn(
		searchParams.get("returnTo"),
		"/operations/inventory/adjustments"
	);
	if (adjustment.isLoading) {
		return (
			<OperationsPageFrame
				description="Loading current Inventory Adjustment state."
				title="Inventory Adjustment"
			>
				<p role="status">Loading Inventory Adjustment…</p>
			</OperationsPageFrame>
		);
	}
	if (adjustment.isError || !adjustment.data) {
		return (
			<OperationsPageFrame
				description="The Adjustment could not be loaded in the current authority scope."
				title="Inventory Adjustment"
			>
				<QueryFailure
					error={adjustment.error}
					isOnline={workspace.isOnline}
					onRetry={() => adjustment.refetch()}
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
						href={returnTo}
					>
						<ArrowLeft /> Back to results
					</Link>
					<AdjustmentActions adjustment={adjustment.data} />
				</>
			}
			description="Authoritative correction state. Approval posts an immutable movement; reversal creates a linked compensating movement."
			title="Inventory Adjustment"
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<StateBadge state={adjustment.data.state} />
				<Badge variant="outline">Version {adjustment.data.version}</Badge>
				<Badge variant="outline">
					{formatAdjustmentQuantity(
						adjustment.data.quantity,
						adjustment.data.unit
					)}
				</Badge>
			</div>
			<ScopeSummary locationId={adjustment.data.locationId} />
			<div className="mt-5">
				<AdjustmentFacts adjustment={adjustment.data} />
			</div>
			<Alert className="mt-5">
				<CircleAlert />
				<AlertTitle>Segregation of duties is enforced by the server</AlertTitle>
				<AlertDescription>
					Creator and approver activity details are not available in this view.
					The server still rejects self-approval and revalidates current
					permission, entitlement, membership, scope, and record version for
					each action.
				</AlertDescription>
			</Alert>
			{workspace.isOnline ? null : (
				<div className="mt-5">
					<OfflineMutationAlert />
				</div>
			)}
		</OperationsPageFrame>
	);
}
