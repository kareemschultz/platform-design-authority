"use client";

import type { Receipt } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { formatMoneyMinor, SALE_TAX_CATEGORY_LABELS } from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import { MutationError, OperationsPageFrame } from "./operations-shared";
import { PosSectionCard, PosTextField } from "./pos-shared";
import { QueryFailure } from "./query-state";
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace } from "./workspace-context";

function ReceiptLayout({ receipt }: { receipt: Receipt }) {
	return (
		<PosSectionCard title={`Receipt ${receipt.receiptNumber}`}>
			<p className="text-muted-foreground text-sm">
				{receipt.kind} · issued{" "}
				{new Intl.DateTimeFormat(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(new Date(receipt.issuedAt))}
			</p>
			<ul
				aria-label="Receipt lines"
				className="grid gap-2 rounded-xl border p-4"
			>
				{receipt.lines.map((line, index) => (
					<li
						className="flex justify-between border-b py-1 text-sm last:border-b-0"
						// biome-ignore lint/suspicious/noArrayIndexKey: an issued receipt's line order is immutable and ReceiptLineSchema carries no line id (prototype scope).
						key={index}
					>
						<span>
							{receipt.priceSuppressed
								? line.productName
								: `${line.productName} × ${line.quantity}`}
						</span>
						{receipt.priceSuppressed ? null : (
							<span>
								{formatMoneyMinor(line.lineTotal.amountMinor, receipt.currency)}
							</span>
						)}
					</li>
				))}
			</ul>
			{receipt.priceSuppressed ? (
				<p className="text-muted-foreground text-sm">
					Gift receipt: prices are suppressed on this artifact.
				</p>
			) : (
				<>
					<p className="text-muted-foreground text-sm">
						Tax breakdown (prototype, non-statutory) —{" "}
						{[...new Set(receipt.lines.map((line) => line.taxCategory))]
							.map((category) => SALE_TAX_CATEGORY_LABELS[category])
							.join(", ") || "none"}
					</p>
					{receipt.total ? (
						<p className="font-medium text-lg">
							Total:{" "}
							{formatMoneyMinor(receipt.total.amountMinor, receipt.currency)}
						</p>
					) : null}
					{receipt.tenders.map((tender, index) => (
						<p
							// biome-ignore lint/suspicious/noArrayIndexKey: tender list order is immutable on an already-issued receipt.
							key={index}
						>
							{tender.type} tendered:{" "}
							{formatMoneyMinor(tender.amount.amountMinor, receipt.currency)}
						</p>
					))}
				</>
			)}
			<p className="text-muted-foreground text-xs">
				Register: <span className="font-mono">{receipt.registerId}</span>
			</p>
		</PosSectionCard>
	);
}

const VoidValuesSchema = z.object({
	reason: z.string().max(500),
});

function VoidReceiptSection({ receiptId }: { receiptId: string }) {
	const workspace = useWorkspace();
	const voidMutation = useOnlineGatedMutation(
		orpc.commerce.receipts.void.mutationOptions(),
		workspace.isOnline
	);
	const [voided, setVoided] = useState(false);
	const form = useForm({
		defaultValues: { reason: "" },
		onSubmit: async ({ value }) => {
			await voidMutation.mutateAsync({
				body: { reason: value.reason.trim() || undefined },
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { receiptId },
			});
			setVoided(true);
			toast.success("Receipt voided");
		},
		validators: { onSubmit: VoidValuesSchema },
	});

	if (voided) {
		return (
			<PosSectionCard title="Receipt voided">
				<p>This receipt's sale has been reversed.</p>
			</PosSectionCard>
		);
	}

	return (
		<PosSectionCard
			description="commerce.receipt.void — same-day/open-session administrative reversal. Own authority, not a maker/checker pair."
			title="Void this receipt"
		>
			<form
				className="grid max-w-md gap-4"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field name="reason">
					{(field) => <PosTextField field={field} label="Reason (optional)" />}
				</form.Field>
				<MutationError
					error={voidMutation.error}
					isOnline={workspace.isOnline}
				/>
				<Button
					className="w-fit"
					disabled={voidMutation.isPending || !workspace.isOnline}
					type="submit"
					variant="destructive"
				>
					{voidMutation.isPending ? "Voiding…" : "Void receipt"}
				</Button>
			</form>
		</PosSectionCard>
	);
}

function ReissueReceiptSection({ receiptId }: { receiptId: string }) {
	const workspace = useWorkspace();
	const router = useRouter();
	const reissue = useOnlineGatedMutation(
		orpc.commerce.receipts.reissue.mutationOptions(),
		workspace.isOnline
	);

	async function reissueReceipt(priceSuppressed: boolean) {
		const reissued = await reissue.mutateAsync({
			body: { priceSuppressed },
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { receiptId },
		});
		toast.success(`Receipt reissued as ${reissued.receiptNumber}`);
		router.push(`/operations/pos/receipts/${encodeURIComponent(reissued.id)}`);
	}

	return (
		<PosSectionCard
			description="commerce.receipt.reissue — reprints this receipt as a new numbered artifact. Own authority, not a maker/checker pair."
			title="Reissue this receipt"
		>
			<MutationError error={reissue.error} isOnline={workspace.isOnline} />
			<div className="flex flex-wrap gap-2">
				<Button
					disabled={reissue.isPending || !workspace.isOnline}
					onClick={() => reissueReceipt(false)}
					type="button"
					variant="outline"
				>
					{reissue.isPending ? "Reissuing…" : "Reissue"}
				</Button>
				<Button
					disabled={reissue.isPending || !workspace.isOnline}
					onClick={() => reissueReceipt(true)}
					type="button"
					variant="outline"
				>
					Reissue as gift receipt (prices suppressed)
				</Button>
			</div>
		</PosSectionCard>
	);
}

export function ReceiptLookupPage() {
	const router = useRouter();
	const [receiptId, setReceiptId] = useState("");
	return (
		<OperationsPageFrame
			description="Realizes commerce.receipt.read. Enter a receipt ID (from a completed sale, a return, or a reissue) to view, reissue, or void it."
			title="Look up a receipt"
		>
			<PosSectionCard title="Receipt lookup">
				<div className="grid max-w-md gap-4">
					<PosTextField
						field={{
							handleBlur: () => undefined,
							handleChange: setReceiptId,
							name: "receiptId",
							state: { meta: { errors: [] }, value: receiptId },
						}}
						label="Receipt ID"
					/>
					<Button
						className="w-fit"
						disabled={!receiptId}
						onClick={() =>
							router.push(
								`/operations/pos/receipts/${encodeURIComponent(receiptId)}`
							)
						}
						type="button"
					>
						View receipt
					</Button>
				</div>
			</PosSectionCard>
		</OperationsPageFrame>
	);
}

export function ReceiptViewPage({ receiptId }: { receiptId: string }) {
	const workspace = useWorkspace();
	const receipt = useQuery({
		...orpc.commerce.receipts.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { receiptId },
			},
		}),
		enabled: Boolean(workspace.contextId && receiptId),
		retry: false,
	});

	if (!workspace.contextId || receipt.isLoading) {
		return (
			<OperationsPageFrame description="Loading this receipt." title="Receipt">
				<p role="status">Loading receipt…</p>
			</OperationsPageFrame>
		);
	}

	if (receipt.isError || !receipt.data) {
		return (
			<OperationsPageFrame
				description="The receipt could not be loaded in the current tenant."
				title="Receipt"
			>
				<QueryFailure
					error={receipt.error}
					isOnline={workspace.isOnline}
					onRetry={() => receipt.refetch()}
				/>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.receipt.read. Printable layout: use your browser's print function."
			title="Receipt"
		>
			<div className="grid gap-6 print:gap-3">
				<ReceiptLayout receipt={receipt.data} />
				<div className="print:hidden">
					<ReissueReceiptSection receiptId={receiptId} />
				</div>
				<div className="print:hidden">
					<VoidReceiptSection receiptId={receiptId} />
				</div>
			</div>
		</OperationsPageFrame>
	);
}
