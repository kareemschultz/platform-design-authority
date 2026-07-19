"use client";

import type { Product, Sale } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	type CartLineDraft,
	canCompleteSale,
	canEditSaleLines,
	cartLineEstimatedSubtotalMinor,
	cartSubtotalEstimateMinor,
	changeDueMinor,
	formatMoneyMinor,
	isKnownSelfApproval,
	isSufficientCashTender,
	isValidCartLineDraft,
	loadSaleWorkspace,
	parseMoneyInputToMinor,
	recordMakerActor,
	SALE_TAX_CATEGORIES,
	SALE_TAX_CATEGORY_LABELS,
	saleHasPendingPriceOverride,
	saveSaleWorkspace,
	toSaleLineInput,
} from "@/lib/pos";
import { workspaceWorkState } from "@/lib/workspace-change";
import { orpc } from "@/utils/orpc";
import {
	MutationError,
	OperationsPageFrame,
	StateBadge,
} from "./operations-shared";
import {
	CopyableId,
	PosMoneyField,
	PosSectionCard,
	PosTextField,
} from "./pos-shared";
import { EmptyState } from "./query-state";
import { useWorkspace, useWorkspaceWorkGuard } from "./workspace-context";

/** Debounces a value used to drive the sale screen's product-search query.
 * The scanned-code path never debounces (a barcode scanner submits a
 * complete code in one keystroke burst followed by Enter) — only the
 * free-text search field routes through this, keeping the 100ms p95
 * scanned-item lookup budget (stage spec) achievable: a debounce only ever
 * delays the FIRST keystroke of a typed search, never a scan. */
function useDebouncedValue(value: string, delayMs: number): string {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);
	return debounced;
}

function newCartLineKey(): string {
	return `cart_${crypto.randomUUID()}`;
}

function draftFromProduct(
	product: Product,
	variantId: string | null
): CartLineDraft {
	return {
		discountAmountMinor: 0,
		key: newCartLineKey(),
		productId: product.id,
		productName: product.name,
		quantity: "1",
		taxCategory: "GY_STANDARD_14",
		unit: "each",
		unitPriceInput: "",
		variantId,
	};
}

function ProductLookup({
	contextId,
	isOnline,
	onAdd,
}: {
	contextId: string | null;
	isOnline: boolean;
	onAdd: (line: CartLineDraft) => void;
}) {
	const [barcode, setBarcode] = useState("");
	const [queryText, setQueryText] = useState("");
	const debouncedQuery = useDebouncedValue(queryText, 200);
	const enabled =
		Boolean(contextId) && (barcode.length > 0 || debouncedQuery.length > 0);
	const results = useQuery({
		...orpc.catalog.products.list.queryOptions({
			input: {
				headers: { "x-active-context-id": contextId ?? "" },
				query: {
					barcode: barcode || undefined,
					limit: 10,
					query: debouncedQuery || undefined,
					state: "Active",
				},
			},
		}),
		enabled,
		retry: false,
		staleTime: 5000,
	});

	function addSingleVariant(products: Product[]): boolean {
		if (products.length !== 1 || products[0].variants.length !== 1) {
			return false;
		}
		onAdd(draftFromProduct(products[0], products[0].variants[0].id));
		return true;
	}

	return (
		<PosSectionCard
			description="Realizes the sale screen's product add surface. Exact barcode lookup on Enter auto-adds a single unambiguous match; otherwise choose a variant below. catalog.product.read — Catalog does not carry a sale price, so unit price is entered per line."
			title="Add a product"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-1">
					<Label htmlFor="pos-scan-barcode">Scan or enter barcode</Label>
					<Input
						autoFocus
						id="pos-scan-barcode"
						inputMode="numeric"
						onChange={(event) => setBarcode(event.target.value)}
						onKeyDown={(event) => {
							if (event.key !== "Enter") {
								return;
							}
							event.preventDefault();
							if (results.data && addSingleVariant(results.data.items)) {
								setBarcode("");
								toast.success("Product added");
							}
						}}
						placeholder="e.g. 7501234567890"
						value={barcode}
					/>
				</div>
				<div className="grid gap-1">
					<Label htmlFor="pos-search-query">Search by name or SKU</Label>
					<Input
						id="pos-search-query"
						onChange={(event) => setQueryText(event.target.value)}
						placeholder="Product name"
						value={queryText}
					/>
				</div>
			</div>
			{!isOnline && (
				<p className="text-muted-foreground text-sm">
					You are offline. Product lookup is unavailable until you reconnect.
				</p>
			)}
			{isOnline && results.isPending && enabled ? (
				<div aria-label="Looking up products" role="status">
					<Skeleton className="h-10 w-full" />
				</div>
			) : null}
			{results.isError ? (
				<p className="text-destructive text-sm" role="alert">
					Product lookup failed. Try a different search.
				</p>
			) : null}
			{isOnline &&
			results.data &&
			enabled &&
			results.data.items.length === 0 ? (
				<EmptyState>No matching Active products.</EmptyState>
			) : null}
			{isOnline && results.data && enabled && results.data.items.length > 0 ? (
				<ul aria-label="Product search results" className="grid gap-2">
					{results.data.items.flatMap((product) =>
						product.variants.map((variant) => (
							<li
								className="flex items-center justify-between rounded-xl border p-3 text-sm"
								key={variant.id}
							>
								<span>
									{product.name}
									{product.variants.length > 1 ? ` — ${variant.name}` : ""}
								</span>
								<Button
									onClick={() => {
										onAdd(draftFromProduct(product, variant.id));
										toast.success("Product added");
									}}
									size="sm"
									type="button"
									variant="outline"
								>
									Add
								</Button>
							</li>
						))
					)}
				</ul>
			) : null}
		</PosSectionCard>
	);
}

function CartLineRow({
	line,
	onChange,
	onRemove,
}: {
	line: CartLineDraft;
	onChange: (next: CartLineDraft) => void;
	onRemove: () => void;
}) {
	const quantityId = useId();
	const priceId = useId();
	const taxId = useId();
	return (
		<li className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
			<div>
				<p className="font-medium">{line.productName}</p>
				<p className="text-muted-foreground text-sm">
					Estimated subtotal:{" "}
					{formatMoneyMinor(cartLineEstimatedSubtotalMinor(line), "GYD")}
				</p>
			</div>
			<div className="grid gap-1">
				<Label htmlFor={quantityId}>Quantity</Label>
				<Input
					id={quantityId}
					inputMode="decimal"
					onChange={(event) =>
						onChange({ ...line, quantity: event.target.value })
					}
					value={line.quantity}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor={priceId}>Unit price (GYD)</Label>
				<Input
					id={priceId}
					inputMode="decimal"
					onChange={(event) =>
						onChange({ ...line, unitPriceInput: event.target.value })
					}
					placeholder="0.00"
					value={line.unitPriceInput}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor={taxId}>Tax category</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-2 text-sm"
					id={taxId}
					onChange={(event) =>
						onChange({
							...line,
							taxCategory: event.target.value as CartLineDraft["taxCategory"],
						})
					}
					value={line.taxCategory}
				>
					{SALE_TAX_CATEGORIES.map((category) => (
						<option key={category} value={category}>
							{SALE_TAX_CATEGORY_LABELS[category]}
						</option>
					))}
				</select>
			</div>
			<Button onClick={onRemove} type="button" variant="ghost">
				Remove
			</Button>
		</li>
	);
}

function SaleCartBuilder({
	registerId,
	registerSessionId,
}: {
	registerId: string;
	registerSessionId: string;
}) {
	const workspace = useWorkspace();
	const router = useRouter();
	const [lines, setLines] = useState<CartLineDraft[]>([]);
	const [isDirty, setIsDirty] = useState(false);
	const create = useMutation(orpc.commerce.sales.create.mutationOptions());
	useWorkspaceWorkGuard(
		workspaceWorkState(create.isPending, isDirty || lines.length > 0)
	);

	const allValid =
		lines.length > 0 && lines.every((line) => isValidCartLineDraft(line));
	const estimate = cartSubtotalEstimateMinor(lines);

	async function createSale() {
		if (!(allValid && workspace.contextId)) {
			return;
		}
		const sale = await create.mutateAsync({
			body: {
				currency: "GYD",
				lines: lines.map(toSaleLineInput),
				registerId,
			},
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId,
			},
		});
		saveSaleWorkspace(sale);
		router.push(`/operations/pos/sales/${encodeURIComponent(sale.id)}`);
	}

	return (
		<div className="grid gap-6">
			<ProductLookup
				contextId={workspace.contextId}
				isOnline={workspace.isOnline}
				onAdd={(line) => {
					setLines((current) => [...current, line]);
					setIsDirty(true);
				}}
			/>
			<PosSectionCard
				description="Local to this browser tab only, until Create sale submits it as one commerce.sale.create call — the contract surface has no add/remove/edit-line endpoint against an already-created sale."
				title="Cart"
			>
				{lines.length === 0 ? (
					<EmptyState>
						No lines yet. Add a product above, or enter a line manually.
					</EmptyState>
				) : (
					<ul aria-label="Cart lines" className="grid gap-3">
						{lines.map((line) => (
							<CartLineRow
								key={line.key}
								line={line}
								onChange={(next) =>
									setLines((current) =>
										current.map((item) => (item.key === next.key ? next : item))
									)
								}
								onRemove={() =>
									setLines((current) =>
										current.filter((item) => item.key !== line.key)
									)
								}
							/>
						))}
					</ul>
				)}
				<p className="font-medium">
					Estimated subtotal: {formatMoneyMinor(estimate, "GYD")}
				</p>
				<p className="text-muted-foreground text-sm">
					Estimate only, prototype/non-statutory — the server computes the
					authoritative total and tax breakdown when the sale is created.
				</p>
				<MutationError error={create.error} isOnline={workspace.isOnline} />
				<Button
					disabled={
						!allValid ||
						create.isPending ||
						!workspace.contextId ||
						!workspace.isOnline
					}
					onClick={createSale}
					type="button"
				>
					{create.isPending ? "Creating sale…" : "Create sale"}
				</Button>
				{!allValid && lines.length > 0 ? (
					<p className="text-muted-foreground text-sm">
						Every line needs a positive quantity and a positive unit price
						before the sale can be created.
					</p>
				) : null}
			</PosSectionCard>
			<p className="text-muted-foreground text-xs">
				Register session: <span className="font-mono">{registerSessionId}</span>
			</p>
		</div>
	);
}

export function SaleNewPage() {
	const searchParams = useSearchParams();
	const registerId = searchParams.get("registerId") ?? "";
	const registerSessionId = searchParams.get("registerSessionId") ?? "";
	if (!(registerId && registerSessionId)) {
		return (
			<OperationsPageFrame
				description="Start a sale from an open register's session view — this screen needs the register ID and register session ID in the URL."
				title="Start a sale"
			>
				<EmptyState>
					Open a register first, then choose "Start a sale" from the session
					view.
				</EmptyState>
			</OperationsPageFrame>
		);
	}
	return (
		<OperationsPageFrame
			description="Realizes commerce.sale.create over a local cart. Every completing command is re-checked server-side regardless of this screen's contents."
			title="New sale"
		>
			<SaleCartBuilder
				registerId={registerId}
				registerSessionId={registerSessionId}
			/>
		</OperationsPageFrame>
	);
}

const PriceOverrideValuesSchema = z.object({
	reason: z.string().min(1, "A reason is required").max(500),
	requestedPrice: z
		.string()
		.refine((value) => parseMoneyInputToMinor(value) !== null, {
			message: "Enter a non-negative amount with up to 2 decimal places",
		}),
});

function PriceOverrideRequestForm({
	lineId,
	onRequested,
	saleId,
}: {
	lineId: string;
	onRequested: (sale: Sale) => void;
	saleId: string;
}) {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const request = useMutation(
		orpc.commerce.priceOverrides.request.mutationOptions()
	);
	const form = useForm({
		defaultValues: { reason: "", requestedPrice: "0.00" },
		onSubmit: async ({ value }) => {
			const requestedPriceMinor = parseMoneyInputToMinor(value.requestedPrice);
			if (requestedPriceMinor === null) {
				return;
			}
			const sale = await request.mutateAsync({
				body: {
					lineId,
					reason: value.reason.trim(),
					requestedPrice: { amountMinor: requestedPriceMinor, currency: "GYD" },
				},
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { saleId },
			});
			const updatedLine = sale.lines.find(
				(candidate) => candidate.id === lineId
			);
			if (updatedLine?.priceOverrideId && identity?.authUserId) {
				recordMakerActor(
					"price-override",
					`${saleId}:${updatedLine.priceOverrideId}`,
					identity.authUserId
				);
			}
			saveSaleWorkspace(sale);
			onRequested(sale);
			form.reset();
			toast.success("Price override requested; pending approval");
		},
		validators: { onSubmit: PriceOverrideValuesSchema },
	});
	return (
		<form
			className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="requestedPrice">
				{(field) => (
					<PosMoneyField field={field} label="Requested price (GYD)" />
				)}
			</form.Field>
			<form.Field name="reason">
				{(field) => <PosTextField field={field} label="Reason" />}
			</form.Field>
			<MutationError error={request.error} isOnline={workspace.isOnline} />
			<Button
				disabled={request.isPending}
				size="sm"
				type="submit"
				variant="outline"
			>
				{request.isPending ? "Requesting…" : "Request override"}
			</Button>
		</form>
	);
}

/** Standalone price-override approval surface: unlike the in-workspace
 * approve section rendered inside an already-loaded Sale (below), this
 * page needs only a Sale ID typed in — the ordinary case for the checker,
 * a genuinely different browser that never held this Sale locally (no
 * commerce.sale.* read endpoint exists to recover it any other way,
 * matching the return/refund/deposit approval pages' own ID-entry
 * pattern). */
export function PriceOverrideApprovePage() {
	const [saleId, setSaleId] = useState("");
	return (
		<OperationsPageFrame
			description="Realizes commerce.price-override.approve. Enter the Sale ID and Price Override ID the requester's screen displayed."
			title="Price override approval"
		>
			<div className="grid gap-6">
				<PosSectionCard title="Sale">
					<PosTextField
						field={{
							handleBlur: () => undefined,
							handleChange: setSaleId,
							name: "saleId",
							state: { meta: { errors: [] }, value: saleId },
						}}
						label="Sale ID"
					/>
				</PosSectionCard>
				{saleId ? <PriceOverrideApproveSection saleId={saleId} /> : null}
			</div>
		</OperationsPageFrame>
	);
}

function PriceOverrideApproveSection({ saleId }: { saleId: string }) {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const approve = useMutation(
		orpc.commerce.priceOverrides.approve.mutationOptions()
	);
	const [overrideId, setOverrideId] = useState("");
	const [approved, setApproved] = useState<Sale | null>(null);
	const [selfApproval, setSelfApproval] = useState(false);
	useEffect(() => {
		setSelfApproval(
			isKnownSelfApproval(
				"price-override",
				`${saleId}:${overrideId}`,
				identity?.authUserId ?? null
			)
		);
	}, [saleId, overrideId, identity?.authUserId]);

	async function approveOverride() {
		if (!overrideId) {
			return;
		}
		const sale = await approve.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { overrideId, saleId },
		});
		setApproved(sale);
		toast.success("Price override approved");
	}

	if (approved) {
		return (
			<PosSectionCard title="Price override approved">
				<p>The requested price is now applied to the sale line.</p>
			</PosSectionCard>
		);
	}

	return (
		<PosSectionCard
			description="commerce.price-override.approve. The approver must be a different authorized identity than whoever requested the override."
			title="Approve a price override"
		>
			{overrideId && selfApproval ? (
				<p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
					This browser requested this override, so it cannot approve its own
					request. Ask a second authorized identity to complete this step.
				</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-[2fr_auto] sm:items-end">
					<PosTextField
						field={{
							handleBlur: () => undefined,
							handleChange: setOverrideId,
							name: "overrideId",
							state: { meta: { errors: [] }, value: overrideId },
						}}
						label="Price override ID"
					/>
					<Button
						disabled={approve.isPending}
						onClick={approveOverride}
						type="button"
					>
						{approve.isPending ? "Approving…" : "Approve override"}
					</Button>
				</div>
			)}
			<MutationError error={approve.error} isOnline={workspace.isOnline} />
		</PosSectionCard>
	);
}

const CashTenderSchema = z.object({
	tendered: z
		.string()
		.refine((value) => parseMoneyInputToMinor(value) !== null, {
			message: "Enter a non-negative amount with up to 2 decimal places",
		}),
});

function SaleWorkspaceView({
	onSaleChange,
	sale,
}: {
	onSaleChange: (sale: Sale) => void;
	sale: Sale;
}) {
	const workspace = useWorkspace();
	const router = useRouter();
	const hold = useMutation(orpc.commerce.sales.hold.mutationOptions());
	const complete = useMutation(orpc.commerce.sales.complete.mutationOptions());

	const form = useForm({
		defaultValues: { tendered: "0.00" },
		onSubmit: async ({ value }) => {
			const tenderedMinor = parseMoneyInputToMinor(value.tendered);
			if (
				tenderedMinor === null ||
				!isSufficientCashTender(tenderedMinor, sale.total.amountMinor)
			) {
				return;
			}
			const completed = await complete.mutateAsync({
				body: {
					tenders: [
						{
							amount: { amountMinor: tenderedMinor, currency: sale.currency },
							type: "Cash",
						},
					],
				},
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { saleId: sale.id },
			});
			// The completed sale's workspace entry is kept (not cleared): the
			// returns/void surfaces need this browser's cached line IDs, since
			// no commerce.sale.* read endpoint exists to recover them later.
			saveSaleWorkspace(completed);
			toast.success("Sale completed");
			if (completed.receiptId) {
				router.push(
					`/operations/pos/receipts/${encodeURIComponent(completed.receiptId)}`
				);
			} else {
				onSaleChange(completed);
			}
		},
		validators: { onSubmit: CashTenderSchema },
	});

	async function holdSale() {
		const held = await hold.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { saleId: sale.id },
		});
		saveSaleWorkspace(held);
		onSaleChange(held);
		toast.success(`Sale held. Resume it from /operations/pos/sales/${held.id}`);
	}

	const editable = canEditSaleLines(sale);
	const pendingOverride = saleHasPendingPriceOverride(sale);

	return (
		<div className="grid gap-6">
			<PosSectionCard title="Sale status">
				<p>
					<StateBadge state={sale.state} />
				</p>
				<CopyableId id={sale.id} label="Sale ID" />
			</PosSectionCard>

			<PosSectionCard title="Lines">
				<ul aria-label="Sale lines" className="grid gap-3">
					{sale.lines.map((line) => (
						<li className="grid gap-2 rounded-xl border p-4" key={line.id}>
							<div className="flex justify-between">
								<span className="font-medium">
									{line.productName} × {line.quantity}
								</span>
								<span>
									{formatMoneyMinor(line.lineTotal.amountMinor, sale.currency)}
								</span>
							</div>
							<p className="text-muted-foreground text-sm">
								Tax ({SALE_TAX_CATEGORY_LABELS[line.taxCategory]}):{" "}
								{formatMoneyMinor(line.tax.amountMinor, sale.currency)}
							</p>
							{line.priceOverrideState === "Pending" ? (
								<p className="text-muted-foreground text-sm">
									Price override pending approval. Sale cannot complete until
									resolved.{" "}
									{line.priceOverrideId ? (
										<span className="font-mono">{line.priceOverrideId}</span>
									) : null}
								</p>
							) : null}
							{editable && line.priceOverrideState !== "Pending" ? (
								<PriceOverrideRequestForm
									lineId={line.id}
									onRequested={onSaleChange}
									saleId={sale.id}
								/>
							) : null}
						</li>
					))}
				</ul>
			</PosSectionCard>

			<PosSectionCard title="Totals (server-authoritative)">
				<p>Gross: {formatMoneyMinor(sale.gross.amountMinor, sale.currency)}</p>
				<p>
					Discount: {formatMoneyMinor(sale.discount.amountMinor, sale.currency)}
				</p>
				<p>
					Tax (prototype, non-statutory):{" "}
					{formatMoneyMinor(sale.tax.amountMinor, sale.currency)}
				</p>
				<p className="font-medium text-lg">
					Total: {formatMoneyMinor(sale.total.amountMinor, sale.currency)}
				</p>
			</PosSectionCard>

			{pendingOverride ? (
				<PriceOverrideApproveSection saleId={sale.id} />
			) : null}

			{editable ? (
				<PosSectionCard
					description="commerce.sale.hold parks this sale; visiting this same URL later resumes it (no separate resume permission exists)."
					title="Hold this sale"
				>
					<MutationError error={hold.error} isOnline={workspace.isOnline} />
					<Button
						disabled={hold.isPending}
						onClick={holdSale}
						type="button"
						variant="outline"
					>
						{hold.isPending ? "Holding…" : "Hold sale"}
					</Button>
				</PosSectionCard>
			) : null}

			{canCompleteSale(sale) ? (
				<PosSectionCard
					description="Cash tender only (non-cash tender UI is out of this stage's scope). Keyboard-first: type the tendered amount and press Enter."
					title="Tender and complete"
				>
					<form
						className="grid max-w-sm gap-4"
						noValidate
						onSubmit={(event) => {
							event.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field name="tendered">
							{(field) => (
								<PosMoneyField field={field} label="Cash tendered (GYD)" />
							)}
						</form.Field>
						<form.Subscribe selector={(state) => state.values.tendered}>
							{(tendered) => {
								const tenderedMinor = parseMoneyInputToMinor(tendered) ?? 0;
								return (
									<p>
										Change due:{" "}
										{formatMoneyMinor(
											changeDueMinor(tenderedMinor, sale.total.amountMinor),
											sale.currency
										)}
									</p>
								);
							}}
						</form.Subscribe>
						<MutationError
							error={complete.error}
							isOnline={workspace.isOnline}
						/>
						<Button
							disabled={
								complete.isPending ||
								!workspace.contextId ||
								!workspace.isOnline
							}
							type="submit"
						>
							{complete.isPending ? "Completing…" : "Complete sale"}
						</Button>
					</form>
				</PosSectionCard>
			) : null}
		</div>
	);
}

export function SaleResumePage({ saleId }: { saleId: string }) {
	const [sale, setSale] = useState<Sale | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	useEffect(() => {
		setSale(loadSaleWorkspace(saleId));
		setHasLoaded(true);
	}, [saleId]);

	if (!hasLoaded) {
		return (
			<OperationsPageFrame
				description="Loading this browser's sale workspace."
				title="Loading"
			>
				<div aria-label="Loading sale" className="grid gap-3" role="status">
					<Skeleton className="h-14 w-full" />
				</div>
			</OperationsPageFrame>
		);
	}

	if (!sale) {
		return (
			<OperationsPageFrame
				description="This sale is not held by this browser. No commerce.sale.* read endpoint is registered in this contract surface, so a sale can only be viewed by the browser that created or last acted on it."
				title="Sale not available in this browser"
			>
				<EmptyState>
					Create or resume this sale from the browser that started it.
				</EmptyState>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description={
				sale.state === "Held"
					? "Resuming a Held sale: any authorized mutation below (a price-override request or completion) implicitly returns it to Open — there is no separate resume permission."
					: "Continue this sale to completion."
			}
			title={`Sale ${sale.id}`}
		>
			<SaleWorkspaceView onSaleChange={setSale} sale={sale} />
		</OperationsPageFrame>
	);
}
