"use client";

import type { Return, Sale } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	formatMoneyMinor,
	isKnownSelfApproval,
	loadSaleWorkspace,
	outstandingReturnableQuantity,
	recordCreatedResource,
	recordMakerActor,
} from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import {
	MutationError,
	OperationsPageFrame,
	StateBadge,
} from "./operations-shared";
import { CopyableId, PosSectionCard, PosTextField } from "./pos-shared";
import { EmptyState } from "./query-state";
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace } from "./workspace-context";

function SaleLineReturnRow({
	line,
	onChange,
	selected,
}: {
	line: Sale["lines"][number];
	onChange: (quantity: string) => void;
	selected: string;
}) {
	// This browser only knows quantities THIS browser has already returned
	// against this line in this tab (no server read exists to reconcile
	// cross-browser returns); the bound is a client-side convenience, not
	// authoritative — commerce.return.create performs the real cumulative
	// check server-side (frozen control plan §6.3).
	const max = outstandingReturnableQuantity(line.quantity, "0");
	return (
		<li className="grid gap-2 rounded-xl border p-4 sm:grid-cols-[2fr_1fr] sm:items-end">
			<div>
				<p className="font-medium">{line.productName}</p>
				<p className="text-muted-foreground text-sm">
					Sold quantity: {line.quantity} · line ID{" "}
					<span className="font-mono">{line.id}</span>
				</p>
			</div>
			<div className="grid gap-1">
				<Label htmlFor={`return-qty-${line.id}`}>
					Return quantity (0 = skip)
				</Label>
				<Input
					id={`return-qty-${line.id}`}
					inputMode="decimal"
					max={max}
					onChange={(event) => onChange(event.target.value)}
					value={selected}
				/>
			</div>
		</li>
	);
}

/** Validates only the return form's own field. Sale ID is looked up via
 * separate page-level state (`useState`, not a `form.Field`) — the form
 * itself is gated on `sale && sale.state === "Completed"` already being
 * true before it renders, so a Sale ID requirement in this schema would
 * validate a key the form's value object never contains and block every
 * submission unconditionally. */
const ReturnFormSchema = z.object({
	reason: z.string().min(1, "A reason is required").max(500),
});

export function ReturnNewPage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const create = useOnlineGatedMutation(
		orpc.commerce.returns.create.mutationOptions(),
		workspace.isOnline
	);
	const [saleId, setSaleId] = useState("");
	const [sale, setSale] = useState<Sale | null | undefined>(undefined);
	const [selections, setSelections] = useState<Record<string, string>>({});
	const [created, setCreated] = useState<Return | null>(null);

	useEffect(() => {
		if (!saleId) {
			setSale(undefined);
			return;
		}
		setSale(loadSaleWorkspace(saleId));
	}, [saleId]);

	const form = useForm({
		defaultValues: { reason: "" },
		onSubmit: async ({ value }) => {
			if (!sale) {
				return;
			}
			const lines = Object.entries(selections)
				.filter(([, quantity]) => Number.parseFloat(quantity) > 0)
				.map(([saleLineId, quantity]) => ({ quantity, saleLineId }));
			if (lines.length === 0) {
				return;
			}
			const returnRecord = await create.mutateAsync({
				body: { lines, reason: value.reason.trim(), saleId: sale.id },
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
			});
			if (identity?.authUserId) {
				recordMakerActor("return", returnRecord.id, identity.authUserId);
			}
			recordCreatedResource("return", {
				createdAt: returnRecord.createdAt,
				id: returnRecord.id,
				label: `Return on sale ${sale.id}`,
			});
			setCreated(returnRecord);
			toast.success("Return created; pending approval");
		},
		validators: { onSubmit: ReturnFormSchema },
	});

	if (created) {
		return (
			<OperationsPageFrame
				description="Pending: no inventory effect has posted yet (frozen control plan §6.3)."
				title="Return created"
			>
				<PosSectionCard title="Pending return">
					<p>
						<StateBadge state={created.state} />
					</p>
					<CopyableId id={created.id} label="Return ID" />
					<p className="text-muted-foreground text-sm">
						A second authorized identity (not this browser) must approve this
						return from the Returns page before compensating inventory posts.
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.return.create. Enter the Sale ID from the original receipt — this browser can only look up a sale it completed or previously cached locally (no commerce.sale.* read endpoint is registered in this contract surface)."
			title="Create a return"
		>
			<div className="grid gap-6">
				<PosSectionCard title="Original sale lookup">
					<div className="grid max-w-md gap-1">
						<Label htmlFor="return-sale-id">Sale ID</Label>
						<Input
							autoFocus
							id="return-sale-id"
							onChange={(event) => setSaleId(event.target.value.trim())}
							value={saleId}
						/>
					</div>
					{saleId && sale === null ? (
						<p className="mt-3 text-muted-foreground text-sm">
							This sale is not available in this browser. Ask the cashier who
							completed it to process the return from that browser.
						</p>
					) : null}
				</PosSectionCard>

				{sale && sale.state !== "Completed" ? (
					<EmptyState>
						Sale {sale.id} is {sale.state}, not Completed — only a completed
						sale can be returned.
					</EmptyState>
				) : null}

				{sale && sale.state === "Completed" ? (
					<form
						noValidate
						onSubmit={(event) => {
							event.preventDefault();
							form.handleSubmit();
						}}
					>
						<PosSectionCard title="Lines to return">
							<ul aria-label="Returnable lines" className="grid gap-3">
								{sale.lines.map((line) => (
									<SaleLineReturnRow
										key={line.id}
										line={line}
										onChange={(quantity) =>
											setSelections((current) => ({
												...current,
												[line.id]: quantity,
											}))
										}
										selected={selections[line.id] ?? "0"}
									/>
								))}
							</ul>
							<form.Field name="reason">
								{(field) => <PosTextField field={field} label="Reason" />}
							</form.Field>
							<MutationError
								error={create.error}
								isOnline={workspace.isOnline}
							/>
							<Button
								className="w-fit"
								disabled={
									create.isPending ||
									!workspace.contextId ||
									!workspace.isOnline
								}
								type="submit"
							>
								{create.isPending ? "Creating return…" : "Create return"}
							</Button>
						</PosSectionCard>
					</form>
				) : null}
			</div>
		</OperationsPageFrame>
	);
}

export function ReturnApprovePage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const approve = useOnlineGatedMutation(
		orpc.commerce.returns.approve.mutationOptions(),
		workspace.isOnline
	);
	const [returnId, setReturnId] = useState("");
	const [approved, setApproved] = useState<Return | null>(null);
	const [selfApproval, setSelfApproval] = useState(false);
	useEffect(() => {
		setSelfApproval(
			isKnownSelfApproval("return", returnId, identity?.authUserId ?? null)
		);
	}, [returnId, identity?.authUserId]);

	async function approveReturn() {
		if (!returnId) {
			return;
		}
		const returnRecord = await approve.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { returnId },
		});
		setApproved(returnRecord);
		toast.success("Return approved; inventory posted");
	}

	if (approved) {
		return (
			<OperationsPageFrame
				description="commerce.return.completed.v1 emitted; compensating inventory has posted."
				title="Return approved"
			>
				<PosSectionCard title={`Return ${approved.id}`}>
					<p>
						<StateBadge state={approved.state} /> · refundable{" "}
						{formatMoneyMinor(
							approved.totalRefundable.amountMinor,
							approved.currency
						)}
					</p>
					{approved.receiptId ? (
						<CopyableId id={approved.receiptId} label="Return receipt ID" />
					) : null}
					<p className="text-muted-foreground text-sm">
						To refund cash, use "Request a refund" on the Returns page with this
						return's ID.
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="commerce.return.approve. The approver must be a different authorized identity than whoever created the return — self-approval is hidden in this browser when it created the return."
			title="Approve a return"
		>
			<PosSectionCard title="Approve a pending return">
				{selfApproval ? (
					<p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
						This browser created this return, so it cannot approve its own
						request. Ask a second authorized identity to complete this step.
					</p>
				) : (
					<div className="grid max-w-md gap-4">
						<PosTextField
							field={{
								handleBlur: () => undefined,
								handleChange: setReturnId,
								name: "returnId",
								state: { meta: { errors: [] }, value: returnId },
							}}
							label="Return ID"
						/>
						<Button
							className="w-fit"
							disabled={approve.isPending || !workspace.isOnline}
							onClick={approveReturn}
							type="button"
						>
							{approve.isPending ? "Approving…" : "Approve return"}
						</Button>
					</div>
				)}
				<MutationError error={approve.error} isOnline={workspace.isOnline} />
			</PosSectionCard>
		</OperationsPageFrame>
	);
}
