"use client";

import type { Product } from "@meridian/contracts-platform-api";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button, buttonVariants } from "@meridian/ui-web/components/button";
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
import { ArrowLeft, PackagePlus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	isVersionConflict,
	operationsHref,
	safeOperationsReturn,
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

const DIGITS_ONLY_PATTERN = /^\d+$/u;
const PRODUCT_STATES = [
	"Draft",
	"Active",
	"Suspended",
	"Discontinued",
	"Archived",
] as const satisfies readonly Product["state"][];
const PRODUCT_STATE_SET = new Set<string>(PRODUCT_STATES);

const productStateFromSearch = (value: string | null) =>
	value && PRODUCT_STATE_SET.has(value)
		? (value as Product["state"])
		: undefined;

function ProductFilters() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("query") ?? "");
	const [sku, setSku] = useState(searchParams.get("sku") ?? "");
	const [barcode, setBarcode] = useState(searchParams.get("barcode") ?? "");
	const [state, setState] = useState(searchParams.get("state") ?? "");
	return (
		<form
			aria-label="Product filters"
			className="mb-5 grid gap-3 rounded-2xl border p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					operationsHref(pathname, searchParams, {
						barcode: barcode.trim() || null,
						cursor: null,
						cursorTrail: null,
						query: query.trim() || null,
						sku: sku.trim() || null,
						state: productStateFromSearch(state) ?? null,
					})
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="product-query">Product text</Label>
				<Input
					id="product-query"
					maxLength={200}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search permitted Product text"
					value={query}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="product-sku">Exact tenant SKU</Label>
				<Input
					id="product-sku"
					maxLength={64}
					onChange={(event) => setSku(event.target.value)}
					placeholder="Enter the complete SKU"
					value={sku}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="product-barcode">Exact barcode</Label>
				<Input
					id="product-barcode"
					maxLength={64}
					onChange={(event) => setBarcode(event.target.value)}
					placeholder="Enter a complete GTIN"
					value={barcode}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="product-state">Lifecycle state</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="product-state"
					onChange={(event) => setState(event.target.value)}
					value={state}
				>
					<option value="">All states</option>
					{PRODUCT_STATES.map((item) => (
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

export function ProductsPage() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const barcode = searchParams.get("barcode") ?? undefined;
	const queryText = searchParams.get("query") ?? undefined;
	const sku = searchParams.get("sku") ?? undefined;
	const state = productStateFromSearch(searchParams.get("state"));
	const products = useQuery({
		...orpc.catalog.products.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { barcode, cursor, limit: 50, query: queryText, sku, state },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
		staleTime: 15_000,
	});
	const returnTo = operationsHref(pathname, searchParams, {});
	const columns: DataColumn<Product>[] = [
		{
			label: "Product",
			render: (product) => (
				<>
					<Link
						className="font-medium underline-offset-4 hover:underline"
						href={`/operations/products/${encodeURIComponent(product.id)}?returnTo=${encodeURIComponent(returnTo)}`}
					>
						{product.name}
					</Link>
					<span className="block text-muted-foreground text-xs">
						{product.variants.length} variant
						{product.variants.length === 1 ? "" : "s"}
					</span>
				</>
			),
		},
		{
			label: "State",
			render: (product) => <StateBadge state={product.state} />,
		},
		{
			label: "Identifiers",
			render: (product) => {
				const identifiers = product.variants.flatMap(
					(variant) => variant.identifiers
				);
				return identifiers.length
					? identifiers
							.slice(0, 3)
							.map((item) => item.value)
							.join(", ")
					: "Identifierless";
			},
		},
		{ label: "Version", render: (product) => product.version },
	];
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ className: "min-h-10" })}
					href="/operations/products/new"
				>
					<PackagePlus /> Create Product
				</Link>
			}
			description="Cursor-backed Catalog search. Exact barcode lookup does not disclose foreign-tenant identifiers."
			title="Products"
		>
			<ProductFilters />
			<CollectionState
				caption="Products in the current tenant"
				columns={columns}
				empty={
					queryText || barcode || sku || state
						? "No Products match these filters."
						: "No Products are available in this tenant."
				}
				error={products.error}
				isError={products.isError}
				isFetching={products.isFetching}
				isLoading={products.isLoading}
				isOnline={workspace.isOnline}
				items={products.data?.items}
				nextCursor={products.data?.nextCursor}
				onRetry={() => products.refetch()}
				rowKey={(product) => product.id}
			/>
		</OperationsPageFrame>
	);
}

const ProductCreateValuesSchema = z
	.object({
		barcode: z.string().max(64),
		barcodeScheme: z.enum(["GTIN-8", "GTIN-12", "GTIN-13", "GTIN-14"]),
		name: z.string().min(1, "Product name is required").max(300),
		sku: z.string().max(128),
		variantName: z.string().min(1, "Variant name is required").max(300),
	})
	.refine(
		(value) => !(value.barcode && !DIGITS_ONLY_PATTERN.test(value.barcode)),
		{
			message: "Barcode must contain digits only",
			path: ["barcode"],
		}
	);

function ProductCreateForm() {
	const workspace = useWorkspace();
	const router = useRouter();
	const create = useMutation(orpc.catalog.products.create.mutationOptions());
	const [isDirty, setIsDirty] = useState(false);
	const createIntent = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	useWorkspaceWorkGuard(workspaceWorkState(create.isPending, isDirty));
	const form = useForm({
		defaultValues: {
			barcode: "",
			barcodeScheme: "GTIN-13" as "GTIN-8" | "GTIN-12" | "GTIN-13" | "GTIN-14",
			name: "",
			sku: "",
			variantName: "Default",
		},
		onSubmit: async ({ value }) => {
			const identifiers: Array<{
				scheme: "Tenant" | "GTIN-8" | "GTIN-12" | "GTIN-13" | "GTIN-14";
				type: "SKU" | "GTIN";
				value: string;
			}> = [];
			if (value.sku.trim()) {
				identifiers.push({
					scheme: "Tenant",
					type: "SKU",
					value: value.sku.trim(),
				});
			}
			if (value.barcode.trim()) {
				identifiers.push({
					scheme: value.barcodeScheme,
					type: "GTIN",
					value: value.barcode.trim(),
				});
			}
			const body = {
				name: value.name.trim(),
				variants: [{ identifiers, name: value.variantName.trim() }],
			};
			const intent = stableIntentKey(
				createIntent.current,
				JSON.stringify({ body, contextId: workspace.contextId }),
				() => crypto.randomUUID()
			);
			createIntent.current = intent;
			const result = await create.mutateAsync({
				body,
				headers: {
					"idempotency-key": intent.key,
					"x-active-context-id": workspace.contextId ?? "",
				},
			});
			createIntent.current = null;
			toast.success("Product draft created");
			router.push(`/operations/products/${encodeURIComponent(result.id)}`);
		},
		onSubmitInvalid: () => {
			requestAnimationFrame(() =>
				document
					.querySelector<HTMLElement>(
						'#product-create-form [aria-invalid="true"]'
					)
					?.focus()
			);
		},
		validators: { onSubmit: ProductCreateValuesSchema },
	});
	return (
		<form
			className="grid max-w-2xl gap-5"
			id="product-create-form"
			noValidate
			onChangeCapture={() => setIsDirty(true)}
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => <TextField field={field} label="Product name" />}
			</form.Field>
			<form.Field name="variantName">
				{(field) => <TextField field={field} label="Variant name" />}
			</form.Field>
			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field name="sku">
					{(field) => <TextField field={field} label="Tenant SKU (optional)" />}
				</form.Field>
				<div className="grid gap-1">
					<form.Field name="barcodeScheme">
						{(field) => (
							<>
								<Label htmlFor={field.name}>GTIN scheme</Label>
								<select
									className="min-h-10 rounded-xl border bg-background px-3 text-sm"
									id={field.name}
									onChange={(event) =>
										field.handleChange(
											event.target.value as typeof field.state.value
										)
									}
									value={field.state.value}
								>
									<option>GTIN-8</option>
									<option>GTIN-12</option>
									<option>GTIN-13</option>
									<option>GTIN-14</option>
								</select>
							</>
						)}
					</form.Field>
				</div>
			</div>
			<form.Field name="barcode">
				{(field) => (
					<TextField
						field={field}
						inputMode="numeric"
						label="Barcode (optional)"
					/>
				)}
			</form.Field>
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
						{isSubmitting ? "Creating Product…" : "Create Product draft"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

interface TextFieldAdapter {
	handleBlur: () => void;
	handleChange: (value: string) => void;
	name: string;
	state: {
		meta: { errors: Array<{ message?: string } | string | undefined> };
		value: string;
	};
}

function TextField({
	field,
	inputMode,
	label,
}: {
	field: TextFieldAdapter;
	inputMode?: "decimal" | "numeric";
	label: string;
}) {
	const { errors } = field.state.meta;
	return (
		<div className="grid gap-1">
			<Label htmlFor={field.name}>{label}</Label>
			<Input
				aria-describedby={errors.length ? `${field.name}-error` : undefined}
				aria-invalid={errors.length > 0}
				id={field.name}
				inputMode={inputMode}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				value={field.state.value}
			/>
			{errors.length ? (
				<p
					className="text-destructive text-sm"
					id={`${field.name}-error`}
					role="alert"
				>
					{errors
						.map((error) =>
							typeof error === "string" ? error : error?.message
						)
						.filter(Boolean)
						.join(", ")}
				</p>
			) : null}
		</div>
	);
}

export function ProductCreatePage() {
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ variant: "outline" })}
					href="/operations/products"
				>
					<ArrowLeft /> Back to Products
				</Link>
			}
			description="Create one governed Product aggregate. Identifierless Variants are supported; identifiers can be added when known."
			title="Create Product"
		>
			<ProductCreateForm />
		</OperationsPageFrame>
	);
}

function ProductNameEditor({ product }: { product: Product }) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const update = useMutation(orpc.catalog.products.update.mutationOptions());
	const [name, setName] = useState(product.name);
	useWorkspaceWorkGuard(
		workspaceWorkState(update.isPending, name !== product.name)
	);
	return (
		<form
			className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_auto] sm:items-end"
			onSubmit={async (event) => {
				event.preventDefault();
				const result = await update.mutateAsync({
					body: { name: name.trim() },
					headers: {
						"idempotency-key": crypto.randomUUID(),
						"if-match": String(product.version),
						"x-active-context-id": workspace.contextId ?? "",
					},
					params: { productId: product.id },
				});
				setName(result.name);
				await queryClient.invalidateQueries({
					queryKey: orpc.catalog.products.key(),
				});
				toast.success("Product updated");
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="product-name-edit">Product name</Label>
				<Input
					id="product-name-edit"
					maxLength={300}
					onChange={(event) => setName(event.target.value)}
					required
					value={name}
				/>
			</div>
			<Button
				className="min-h-10"
				disabled={update.isPending || !name.trim() || !workspace.isOnline}
				type="submit"
			>
				{update.isPending ? "Saving…" : "Save name"}
			</Button>
			{isVersionConflict(update.error) ? (
				<p className="text-destructive text-sm sm:col-span-2" role="alert">
					This Product changed after you opened it. Your proposed name is
					preserved; refresh to compare with version {product.version + 1} or
					later.
				</p>
			) : (
				<MutationError error={update.error} isOnline={workspace.isOnline} />
			)}
		</form>
	);
}

function ProductLifecycleActions({ product }: { product: Product }) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const activate = useMutation(
		orpc.catalog.products.activate.mutationOptions()
	);
	const archive = useMutation(orpc.catalog.products.archive.mutationOptions());
	const [reason, setReason] = useState("");
	useWorkspaceWorkGuard(
		workspaceWorkState(activate.isPending || archive.isPending, Boolean(reason))
	);
	const headers = {
		"idempotency-key": crypto.randomUUID(),
		"if-match": String(product.version),
		"x-active-context-id": workspace.contextId ?? "",
	};
	const refresh = async () =>
		queryClient.invalidateQueries({ queryKey: orpc.catalog.products.key() });
	return (
		<div className="flex flex-wrap gap-2">
			{product.state === "Draft" ? (
				<Button
					disabled={activate.isPending || !workspace.isOnline}
					onClick={async () => {
						await activate.mutateAsync({
							headers,
							params: { productId: product.id },
						});
						await refresh();
						toast.success("Product activated");
					}}
				>
					{activate.isPending ? "Activating…" : "Activate Product"}
				</Button>
			) : null}
			{product.state === "Archived" ? null : (
				<Dialog>
					<DialogTrigger
						render={<Button disabled={!workspace.isOnline} variant="outline" />}
					>
						Archive
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Archive this Product?</DialogTitle>
							<DialogDescription>
								The Product stops being active. Existing Inventory facts remain
								intact, and restoration requires a governed lifecycle action.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-1">
							<Label htmlFor="archive-reason">Reason</Label>
							<Input
								id="archive-reason"
								maxLength={500}
								onChange={(event) => setReason(event.target.value)}
								value={reason}
							/>
						</div>
						<MutationError
							error={archive.error}
							isOnline={workspace.isOnline}
						/>
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Keep Product
							</DialogClose>
							<Button
								disabled={
									archive.isPending || !reason.trim() || !workspace.isOnline
								}
								onClick={async () => {
									await archive.mutateAsync({
										body: { reason: reason.trim() },
										headers,
										params: { productId: product.id },
									});
									await refresh();
									toast.success("Product archived");
								}}
								variant="destructive"
							>
								{archive.isPending ? "Archiving…" : "Archive Product"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}

export function ProductDetailPage({ productId }: { productId: string }) {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const product = useQuery({
		...orpc.catalog.products.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { productId },
			},
		}),
		enabled: Boolean(workspace.contextId && productId),
		retry: false,
	});
	const returnTo = safeOperationsReturn(
		searchParams.get("returnTo"),
		"/operations/products"
	);
	if (!workspace.contextId || product.isLoading) {
		return (
			<OperationsPageFrame
				description="Loading current Product state."
				title="Product"
			>
				<p role="status">Loading Product…</p>
			</OperationsPageFrame>
		);
	}
	if (product.isError || !product.data) {
		return (
			<OperationsPageFrame
				description="The Product could not be loaded in the current tenant."
				title="Product"
			>
				<QueryFailure
					error={product.error}
					isOnline={workspace.isOnline}
					onRetry={() => product.refetch()}
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
					<ProductLifecycleActions product={product.data} />
				</>
			}
			description="Authoritative Catalog aggregate with stable Variant and Identifier identities."
			title={product.data.name}
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<StateBadge state={product.data.state} />
				<Badge variant="outline">Version {product.data.version}</Badge>
			</div>
			<ProductNameEditor product={product.data} />
			<section aria-labelledby="variants-heading" className="mt-6">
				<h2
					className="font-heading font-semibold text-xl"
					id="variants-heading"
				>
					Variants and identifiers
				</h2>
				<ul className="mt-3 grid gap-3">
					{product.data.variants.map((variant) => (
						<li className="rounded-2xl border p-4" key={variant.id}>
							<h3 className="font-medium">{variant.name}</h3>
							{variant.identifiers.length ? (
								<ul className="mt-2 flex flex-wrap gap-2">
									{variant.identifiers.map((identifier) => (
										<li key={identifier.id}>
											<Badge variant="outline">
												{identifier.type}: {identifier.value}
											</Badge>
										</li>
									))}
								</ul>
							) : (
								<p className="mt-2 text-muted-foreground text-sm">
									Identifierless Variant
								</p>
							)}
						</li>
					))}
				</ul>
			</section>
		</OperationsPageFrame>
	);
}
