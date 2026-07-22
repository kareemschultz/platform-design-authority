"use client";

import type { Receipt } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	addMinor,
	changeDueMinor,
	formatMoneyMinor,
	SALE_TAX_CATEGORY_LABELS,
} from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import { ConsequencePreviewDialog } from "./consequence-preview-dialog";
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
					{/* WS3 remediation R4, P2 item 6: change due is derivable
					 * from the receipt's own already-present `total`/`tenders`
					 * (no new field invented) — shown only when a Cash tender
					 * is present, since a card/stored-value tender never
					 * produces physical change. Reuses the SAME
					 * `changeDueMinor` the sale-completion cart builder already
					 * uses (apps/web/src/lib/pos.ts), never negative. */}
					{receipt.total && receipt.tenders.some((t) => t.type === "Cash") ? (
						<p>
							Change due:{" "}
							{formatMoneyMinor(
								changeDueMinor(
									addMinor(...receipt.tenders.map((t) => t.amount.amountMinor)),
									receipt.total.amountMinor
								),
								receipt.currency
							)}
						</p>
					) : null}
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

function VoidReceiptSection({ receipt }: { receipt: Receipt }) {
	const workspace = useWorkspace();
	const voidMutation = useOnlineGatedMutation(
		orpc.commerce.receipts.void.mutationOptions(),
		workspace.isOnline
	);
	const [voided, setVoided] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmReason, setConfirmReason] = useState<string | undefined>();
	const form = useForm({
		defaultValues: { reason: "" },
		// WS3 remediation R3, Finding I: submitting the form no longer
		// commits directly — it opens the consequence-preview dialog. Void
		// already shows the full receipt above this control (partial
		// credit per the finding text); this dialog adds the explicit
		// restatement AT THE POINT OF COMMIT the other five flows get, for
		// consistency, plus the required non-destructive-focus/Escape/
		// Cancel/keyboard behavior none of the six previously had.
		onSubmit: ({ value }) => {
			setConfirmReason(value.reason.trim() || undefined);
			setConfirmOpen(true);
		},
		validators: { onSubmit: VoidValuesSchema },
	});

	async function commitVoid() {
		await voidMutation.mutateAsync({
			body: { reason: confirmReason },
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { receiptId: receipt.id },
		});
		setConfirmOpen(false);
		setVoided(true);
		toast.success("Receipt voided");
	}

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
				<Button
					className="min-h-12 w-fit"
					disabled={voidMutation.isPending || !workspace.isOnline}
					type="submit"
					variant="destructive"
				>
					Review &amp; void receipt
				</Button>
			</form>
			<ConsequencePreviewDialog
				commitError={voidMutation.error}
				confirming={voidMutation.isPending}
				confirmLabel="Void receipt"
				data={receipt}
				description="This reverses the original sale and cannot be undone from this screen."
				error={undefined}
				isError={false}
				isLoading={false}
				isOnline={workspace.isOnline}
				onConfirm={() => {
					commitVoid().catch(() => undefined);
				}}
				onOpenChange={setConfirmOpen}
				open={confirmOpen}
				renderPreview={(current) => (
					<dl className="grid gap-1">
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Receipt</dt>
							<dd className="font-mono">{current.receiptNumber}</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Amount</dt>
							<dd>
								{current.total
									? formatMoneyMinor(
											current.total.amountMinor,
											current.currency
										)
									: "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Register</dt>
							<dd className="font-mono">{current.registerId}</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Reason</dt>
							<dd>{confirmReason ?? "(none given)"}</dd>
						</div>
						<p className="mt-2 text-destructive text-xs">
							Irreversible from this screen: voiding posts a full compensating
							reversal of the original sale.
						</p>
					</dl>
				)}
				title="Void this receipt?"
			/>
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
			hideHeaderOnPrint
			title="Receipt"
		>
			<div className="grid gap-6 print:gap-3">
				<ReceiptLayout receipt={receipt.data} />
				<div className="print:hidden">
					<ReissueReceiptSection receiptId={receiptId} />
				</div>
				<div className="print:hidden">
					<VoidReceiptSection receipt={receipt.data} />
				</div>
			</div>
		</OperationsPageFrame>
	);
}
