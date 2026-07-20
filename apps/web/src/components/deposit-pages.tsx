"use client";

import type { Deposit } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	formatMoneyMinor,
	isKnownSelfApproval,
	parseMoneyInputToMinor,
	recordCreatedResource,
	recordMakerActor,
} from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import { ConsequencePreviewDialog } from "./consequence-preview-dialog";
import {
	CollectionState,
	type DataColumn,
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
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace } from "./workspace-context";

const DepositValuesSchema = z.object({
	countedAmount: z.string().refine((value) => {
		const parsed = parseMoneyInputToMinor(value);
		return parsed !== null && parsed > 0;
	}, "Enter a positive amount with up to 2 decimal places"),
	sourceShiftIds: z.string().min(1, "Enter at least one register session ID"),
});

export function DepositNewPage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const create = useOnlineGatedMutation(
		orpc.commerce.deposits.create.mutationOptions(),
		workspace.isOnline
	);
	const [created, setCreated] = useState<Deposit | null>(null);

	const form = useForm({
		defaultValues: { countedAmount: "0.00", sourceShiftIds: "" },
		onSubmit: async ({ value }) => {
			const countedAmountMinor = parseMoneyInputToMinor(value.countedAmount);
			if (countedAmountMinor === null) {
				return;
			}
			const sourceShiftIds = value.sourceShiftIds
				.split(",")
				.map((id) => id.trim())
				.filter((id) => id.length > 0);
			if (sourceShiftIds.length === 0) {
				return;
			}
			const deposit = await create.mutateAsync({
				body: {
					countedAmount: { amountMinor: countedAmountMinor, currency: "GYD" },
					currency: "GYD",
					sourceShiftIds,
				},
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
			});
			if (identity?.authUserId) {
				recordMakerActor("deposit", deposit.id, identity.authUserId);
			}
			recordCreatedResource("deposit", {
				createdAt: deposit.preparedAt,
				id: deposit.id,
				label: `Deposit ${formatMoneyMinor(deposit.amount.amountMinor, deposit.amount.currency)}`,
			});
			setCreated(deposit);
			toast.success("Deposit prepared; pending confirmation");
		},
		validators: { onSubmit: DepositValuesSchema },
	});

	if (created) {
		return (
			<OperationsPageFrame
				description="Prepared: this reserves the amount against available safe custody. No custody transfer has posted yet (frozen control plan §6.6)."
				title="Deposit prepared"
			>
				<PosSectionCard title="Prepared deposit">
					<p>
						<StateBadge state={created.state} /> ·{" "}
						{formatMoneyMinor(
							created.amount.amountMinor,
							created.amount.currency
						)}
					</p>
					<CopyableId
						id={created.id}
						label="Deposit ID"
						note="A second authorized identity can find this deposit in the Confirm a deposit queue below — copying this ID is optional."
					/>
					<p className="text-muted-foreground text-sm">
						A second authorized identity must confirm this deposit before the
						safe-to-bank custody transfer posts.
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.deposit.create."
			title="Prepare a deposit"
		>
			<PosSectionCard title="Prepare a bank deposit">
				<form
					className="grid max-w-xl gap-4"
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.Field name="countedAmount">
						{(field) => (
							<PosMoneyField field={field} label="Counted amount (GYD)" />
						)}
					</form.Field>
					<form.Field name="sourceShiftIds">
						{(field) => (
							<PosTextField
								field={field}
								label="Source register session IDs (comma-separated)"
								placeholder="register_session_..., register_session_..."
							/>
						)}
					</form.Field>
					<MutationError error={create.error} isOnline={workspace.isOnline} />
					<Button
						className="w-fit"
						disabled={
							create.isPending || !workspace.contextId || !workspace.isOnline
						}
						type="submit"
					>
						{create.isPending ? "Preparing…" : "Prepare deposit"}
					</Button>
				</form>
			</PosSectionCard>
		</OperationsPageFrame>
	);
}

/** WS3 remediation R3b, Item 7 (server-backed discovery). Reuses
 * `commerce.deposit.confirm` (the same permission the manual-entry field
 * below already requires) via `commerce.deposits.list`, filtered to
 * `state=Prepared` — the pending-confirmation queue. Cursor pagination
 * follows WS2's own `cursor`/`cursorTrail` URL-param convention, the SAME
 * `CollectionState` component Inventory's list pages already use. */
function PendingDepositsQueue({
	isOnline,
	onSelect,
}: {
	isOnline: boolean;
	onSelect: (deposit: Deposit) => void;
}) {
	const workspace = useWorkspace();
	const searchParams = useSearchParams();
	const cursor = searchParams.get("cursor") ?? undefined;
	const pending = useQuery({
		...orpc.commerce.deposits.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50, state: "Prepared" },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
		staleTime: 15_000,
	});
	const columns: DataColumn<Deposit>[] = [
		{
			label: "Deposit",
			render: (deposit) => (
				<span className="break-all font-mono text-xs">{deposit.id}</span>
			),
		},
		{ label: "Reference", render: (deposit) => deposit.depositReference },
		{
			label: "Amount",
			render: (deposit) =>
				formatMoneyMinor(deposit.amount.amountMinor, deposit.amount.currency),
		},
		{
			label: "Prepared",
			render: (deposit) =>
				new Intl.DateTimeFormat(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(new Date(deposit.preparedAt)),
		},
		{
			label: "Action",
			render: (deposit) => (
				<Button
					className="min-h-10"
					disabled={!isOnline}
					onClick={() => onSelect(deposit)}
					type="button"
					variant="outline"
				>
					Review
				</Button>
			),
		},
	];
	return (
		<PosSectionCard
			description="Every deposit this identity is authorized to confirm, awaiting action. Select one instead of typing its ID."
			title="Pending deposits"
		>
			<CollectionState
				caption="Deposits awaiting confirmation"
				columns={columns}
				empty="No deposits are awaiting confirmation in this scope."
				error={pending.error}
				isError={pending.isError}
				isFetching={pending.isFetching}
				isLoading={pending.isLoading}
				isOnline={isOnline}
				items={pending.data?.items}
				nextCursor={pending.data?.nextCursor}
				onRetry={() => pending.refetch()}
				rowKey={(deposit) => deposit.id}
			/>
		</PosSectionCard>
	);
}

export function DepositConfirmPage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const confirm = useOnlineGatedMutation(
		orpc.commerce.deposits.confirm.mutationOptions(),
		workspace.isOnline
	);
	const [depositId, setDepositId] = useState("");
	const [confirmed, setConfirmed] = useState<Deposit | null>(null);
	const [selfApproval, setSelfApproval] = useState(false);
	useEffect(() => {
		setSelfApproval(
			isKnownSelfApproval("deposit", depositId, identity?.authUserId ?? null)
		);
	}, [depositId, identity?.authUserId]);

	// WS3 remediation R3, Finding I: pre-commit consequence preview.
	const [confirmOpen, setConfirmOpen] = useState(false);
	const preview = useQuery({
		...orpc.commerce.deposits.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { depositId },
			},
		}),
		enabled: confirmOpen && Boolean(workspace.contextId && depositId),
		retry: false,
	});

	async function commitConfirmDeposit() {
		if (!depositId) {
			return;
		}
		const deposit = await confirm.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { depositId },
		});
		setConfirmOpen(false);
		setConfirmed(deposit);
		toast.success("Deposit reconciled");
	}

	if (confirmed) {
		return (
			<OperationsPageFrame
				description="commerce.deposit.reconciled.v1 emitted; the safe-to-bank custody transfer has posted."
				title="Deposit reconciled"
			>
				<PosSectionCard title={`Deposit ${confirmed.id}`}>
					<p>
						<StateBadge state={confirmed.state} /> ·{" "}
						{formatMoneyMinor(
							confirmed.amount.amountMinor,
							confirmed.amount.currency
						)}
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="commerce.deposit.confirm. The confirmer must be a different authorized identity than whoever prepared the deposit — self-approval is hidden in this browser when it prepared the deposit."
			title="Confirm a deposit"
		>
			<div className="grid gap-6">
				<PendingDepositsQueue
					isOnline={workspace.isOnline}
					onSelect={(deposit) => {
						setDepositId(deposit.id);
						setConfirmOpen(true);
					}}
				/>
				<PosSectionCard title="Confirm a prepared deposit">
					{depositId && selfApproval ? (
						<p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
							This browser prepared this deposit, so it cannot confirm its own
							request. Ask a second authorized identity to complete this step.
						</p>
					) : (
						<div className="grid max-w-md gap-4">
							<PosTextField
								field={{
									handleBlur: () => undefined,
									handleChange: setDepositId,
									name: "depositId",
									state: { meta: { errors: [] }, value: depositId },
								}}
								label="Deposit ID"
							/>
							<Button
								className="min-h-12 w-fit"
								disabled={!(depositId && workspace.isOnline)}
								onClick={() => setConfirmOpen(true)}
								type="button"
							>
								Review &amp; confirm deposit
							</Button>
						</div>
					)}
					<ConsequencePreviewDialog
						commitError={confirm.error}
						confirming={confirm.isPending}
						confirmLabel="Confirm deposit"
						data={preview.data}
						description="Confirming posts the safe-to-bank custody transfer atomically and cannot be undone from this screen."
						error={preview.error}
						isError={preview.isError}
						isLoading={preview.isLoading}
						isOnline={workspace.isOnline}
						onConfirm={() => {
							commitConfirmDeposit().catch(() => undefined);
						}}
						onOpenChange={setConfirmOpen}
						open={confirmOpen}
						renderPreview={(deposit) => (
							<dl className="grid gap-1">
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Deposit</dt>
									<dd className="font-mono">{deposit.id}</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Preparer (Party)</dt>
									<dd className="font-mono">{deposit.preparerPartyId}</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Amount</dt>
									<dd>
										{formatMoneyMinor(
											deposit.amount.amountMinor,
											deposit.amount.currency
										)}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">State</dt>
									<dd>{deposit.state}</dd>
								</div>
							</dl>
						)}
						title="Confirm this deposit?"
					/>
				</PosSectionCard>
			</div>
		</OperationsPageFrame>
	);
}
