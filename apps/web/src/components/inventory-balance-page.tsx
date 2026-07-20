"use client";

import type { StockBalance } from "@meridian/contracts-platform-api";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { operationsHref } from "@/lib/operations";
import { orpc } from "@/utils/orpc";

import {
	CollectionState,
	type DataColumn,
	FreshnessBadge,
	OperationsPageFrame,
} from "./operations-shared";
import { useWorkspace } from "./workspace-context";

export function balanceFiltersHref(
	pathname: string,
	searchParams: URLSearchParams,
	locationId: string,
	productId: string
) {
	return operationsHref(pathname, searchParams, {
		cursor: null,
		cursorTrail: null,
		locationId,
		productId: productId.trim() || null,
	});
}

function BalanceFilters() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [locationId, setLocationId] = useState(
		searchParams.get("locationId") ??
			workspace.identity?.activeContext?.locationId ??
			""
	);
	const [productId, setProductId] = useState(
		searchParams.get("productId") ?? ""
	);
	return (
		<form
			aria-label="Balance filters"
			className="mb-5 grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					balanceFiltersHref(pathname, searchParams, locationId, productId)
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="balance-location">Location</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="balance-location"
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
			<div className="grid gap-1">
				<Label htmlFor="balance-product">Exact Product ID (optional)</Label>
				<Input
					id="balance-product"
					onChange={(event) => setProductId(event.target.value)}
					value={productId}
				/>
			</div>
			<Button
				className="min-h-10"
				disabled={!locationId}
				type="submit"
				variant="outline"
			>
				Load projection
			</Button>
		</form>
	);
}

export function InventoryBalancePage() {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const locationId = searchParams.get("locationId") ?? "";
	const productId = searchParams.get("productId") ?? undefined;
	const balances = useQuery({
		...orpc.inventory.balances.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50, locationId, productId },
			},
		}),
		enabled: Boolean(workspace.contextId && locationId),
		retry: false,
		staleTime: 5000,
	});
	const columns: DataColumn<StockBalance>[] = [
		{ label: "Product", render: (balance) => balance.productId },
		{
			label: "Variant",
			render: (balance) => balance.variantId ?? "Aggregate Product balance",
		},
		{
			label: "Quantity",
			render: (balance) => (
				<dl className="grid gap-1 text-sm">
					<div className="flex gap-2">
						<dt>On hand</dt>
						<dd>
							{balance.onHand} {balance.unit}
						</dd>
					</div>
					<div className="flex gap-2">
						<dt>Reserved</dt>
						<dd>{balance.reserved}</dd>
					</div>
					<div className="flex gap-2 font-medium">
						<dt>Available</dt>
						<dd>{balance.available}</dd>
					</div>
				</dl>
			),
		},
		{
			label: "Projection evidence",
			render: (balance) => (
				<div className="grid gap-1">
					<FreshnessBadge asOf={balance.asOf} reconciled={balance.reconciled} />
					<span className="text-muted-foreground text-xs">
						Source: {balance.source}
					</span>
				</div>
			),
		},
	];
	return (
		<OperationsPageFrame
			description="A cursor-backed location projection with explicit source, timestamp, and reconciliation state. It is not current command authority."
			title="Inventory balances"
		>
			<div className="mb-4 flex flex-wrap gap-2">
				<Badge variant="outline">Projection</Badge>
				<Badge variant="outline">Current authority rechecked on commands</Badge>
			</div>
			<BalanceFilters />
			{locationId ? (
				<CollectionState
					caption="Stock balances at the selected location"
					columns={columns}
					empty="No balance projection rows match this location and Product."
					error={balances.error}
					isError={balances.isError}
					isFetching={balances.isFetching}
					isLoading={balances.isLoading}
					isOnline={workspace.isOnline}
					items={balances.data?.items}
					nextCursor={balances.data?.nextCursor}
					onRetry={() => balances.refetch()}
					rowKey={(balance) =>
						`${balance.locationId}:${balance.productId}:${balance.variantId ?? "product"}:${balance.unit}`
					}
				/>
			) : (
				<p className="rounded-2xl border p-5 text-muted-foreground">
					Select one authorized location to load its projection.
				</p>
			)}
		</OperationsPageFrame>
	);
}
