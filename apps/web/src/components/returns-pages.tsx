"use client";

import type { Return, Sale } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	formatMoneyMinor,
	isKnownSelfApproval,
	outstandingReturnableQuantity,
	recordCreatedResource,
	recordMakerActor,
} from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import { ConsequencePreviewDialog } from "./consequence-preview-dialog";
import {
	MutationError,
	OperationsPageFrame,
	StateBadge,
} from "./operations-shared";
import { CopyableId, PosSectionCard, PosTextField } from "./pos-shared";
import { EmptyState } from "./query-state";
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace } from "./workspace-context";

/** WS3 remediation R3b, Item 6 (validation closure — return quantity). The
 * HTML `max` attribute on this decimal-text input does nothing — the form
 * is `noValidate` and the input isn't `type="number"` — so before this fix
 * a cashier could type any quantity and the ONLY thing that stopped an
 * over-quantity return was a round trip to the server (which does perform
 * the real, authoritative cumulative check — see
 * `packages/domains/pos/src/index.ts`'s `buildReturnLines`). This computes
 * a real, immediate, persistent, accessible field-level error the moment
 * the typed quantity exceeds this browser's best-known bound, disabling
 * submission before any request fires. The server remains the
 * authoritative gate for cross-browser prior returns this bound cannot see
 * (disclosed below and in the page description) — the client bound is a
 * pre-check, not a replacement. */
export function returnQuantityError(
	quantity: string,
	max: number
): string | null {
	const parsed = Number.parseFloat(quantity);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return "Enter a quantity of 0 or more.";
	}
	if (parsed > max) {
		return `Return quantity cannot exceed the outstanding quantity of ${max} known to this browser.`;
	}
	return null;
}

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
	const error = returnQuantityError(selected, max);
	const errorId = `return-qty-${line.id}-error`;
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
					Return quantity (0 = skip, max {max})
				</Label>
				<Input
					aria-describedby={error ? errorId : undefined}
					aria-invalid={error !== null}
					id={`return-qty-${line.id}`}
					inputMode="decimal"
					max={max}
					onChange={(event) => onChange(event.target.value)}
					value={selected}
				/>
				{error ? (
					<p className="text-destructive text-sm" id={errorId} role="alert">
						{error}
					</p>
				) : null}
			</div>
		</li>
	);
}

/** Validates only the return form's own field. The sale to return against is
 * looked up via separate page-level state (`useState`, not a `form.Field`)
 * — the form itself is gated on `sale && sale.state === "Completed"`
 * already being true before it renders, so a lookup-key requirement in this
 * schema would validate a key the form's value object never contains and
 * block every submission unconditionally. */
const ReturnFormSchema = z.object({
	reason: z.string().min(1, "A reason is required").max(500),
});

/** WS3 remediation R3, Finding J: `receiptNumber` + `registerId` — the SAME
 * two values `ReceiptLayout` prints on every receipt (the title and the
 * "Register:" line) — resolved through `commerce.sales.getForReturn`
 * (gated on `commerce.return.create`, the permission this whole page
 * requires) rather than an opaque Sale ID a cashier can only have if it
 * happens to still be cached in THEIR OWN browser's sessionStorage. This
 * closes the receipt-to-return dead end: a fresh browser with no prior
 * session for this sale can still start a return, using only what a real
 * printed receipt shows. */
export function ReturnNewPage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const create = useOnlineGatedMutation(
		orpc.commerce.returns.create.mutationOptions(),
		workspace.isOnline
	);
	const [registerId, setRegisterId] = useState("");
	const [receiptNumber, setReceiptNumber] = useState("");
	const [selections, setSelections] = useState<Record<string, string>>({});
	const [created, setCreated] = useState<Return | null>(null);

	const saleLookup = useQuery({
		...orpc.commerce.sales.getForReturn.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { receiptNumber, registerId },
			},
		}),
		enabled: Boolean(
			workspace.contextId && registerId.trim() && receiptNumber.trim()
		),
		retry: false,
	});
	const sale: Sale | undefined = saleLookup.data;

	// WS3 remediation R3b, Item 6: block submission client-side the same way
	// each row's own field error already does, using the same bound — a
	// belt-and-suspenders guard against submitting with an invalid quantity
	// still showing (e.g. focus never left the field to trigger a re-render
	// elsewhere). The server's cumulative check (buildReturnLines) remains
	// the actual authority; this only prevents an already-visibly-invalid
	// entry from being submitted.
	const hasInvalidSelection = sale
		? sale.lines.some((line) => {
				const selected = selections[line.id] ?? "0";
				const max = outstandingReturnableQuantity(line.quantity, "0");
				return returnQuantityError(selected, max) !== null;
			})
		: false;

	const form = useForm({
		defaultValues: { reason: "" },
		onSubmit: async ({ value }) => {
			if (!sale || hasInvalidSelection) {
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
			description="Realizes commerce.return.create. Enter the register and receipt number printed on the customer's receipt — both are shown on every receipt (the title and the &quot;Register:&quot; line) — to look up the original sale. Works from a fresh browser with no prior local cache of this sale."
			title="Create a return"
		>
			<div className="grid gap-6">
				<PosSectionCard title="Original sale lookup">
					<div className="grid max-w-md gap-4 sm:grid-cols-2">
						<div className="grid gap-1">
							<Label htmlFor="return-register-id">Register</Label>
							<Input
								autoFocus
								id="return-register-id"
								onChange={(event) => setRegisterId(event.target.value.trim())}
								value={registerId}
							/>
						</div>
						<div className="grid gap-1">
							<Label htmlFor="return-receipt-number">Receipt number</Label>
							<Input
								id="return-receipt-number"
								onChange={(event) =>
									setReceiptNumber(event.target.value.trim())
								}
								value={receiptNumber}
							/>
						</div>
					</div>
					{saleLookup.isFetching ? (
						<p className="mt-3 text-muted-foreground text-sm" role="status">
							Looking up the sale for this receipt…
						</p>
					) : null}
					{saleLookup.isError ? (
						<p className="mt-3 text-destructive text-sm" role="alert">
							No sale was found for register {registerId}, receipt{" "}
							{receiptNumber}. Check both values against the printed receipt and
							try again.
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
									!workspace.isOnline ||
									hasInvalidSelection
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

	// WS3 remediation R3, Finding I: pre-commit consequence preview.
	// commerce.return.approve's own permission gates getReturn too — an
	// approver may preview what they can approve.
	const [confirmOpen, setConfirmOpen] = useState(false);
	const preview = useQuery({
		...orpc.commerce.returns.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { returnId },
			},
		}),
		enabled: confirmOpen && Boolean(workspace.contextId && returnId),
		retry: false,
	});

	async function commitApproveReturn() {
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
		setConfirmOpen(false);
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
							disabled={!(returnId && workspace.isOnline)}
							onClick={() => setConfirmOpen(true)}
							type="button"
						>
							Review &amp; approve return
						</Button>
					</div>
				)}
				<ConsequencePreviewDialog
					commitError={approve.error}
					confirming={approve.isPending}
					confirmLabel="Approve return"
					data={preview.data}
					description="Approving posts the compensating Inventory movement and cannot be undone from this screen."
					error={preview.error}
					isError={preview.isError}
					isLoading={preview.isLoading}
					isOnline={workspace.isOnline}
					onConfirm={() => {
						commitApproveReturn().catch(() => undefined);
					}}
					onOpenChange={setConfirmOpen}
					open={confirmOpen}
					renderPreview={(returnRecord) => (
						<dl className="grid gap-1">
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Return</dt>
								<dd className="font-mono">{returnRecord.id}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Sale</dt>
								<dd className="font-mono">{returnRecord.saleId}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Register</dt>
								<dd className="font-mono">{returnRecord.registerId}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Refundable amount</dt>
								<dd>
									{formatMoneyMinor(
										returnRecord.totalRefundable.amountMinor,
										returnRecord.currency
									)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">State</dt>
								<dd>{returnRecord.state}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Reason</dt>
								<dd>{returnRecord.reason}</dd>
							</div>
						</dl>
					)}
					title="Approve this return?"
				/>
			</PosSectionCard>
		</OperationsPageFrame>
	);
}
