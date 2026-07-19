"use client";

import type { Refund } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	formatMoneyMinor,
	isKnownSelfApproval,
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
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace } from "./workspace-context";

export function RefundNewPage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const create = useOnlineGatedMutation(
		orpc.commerce.refunds.create.mutationOptions(),
		workspace.isOnline
	);
	const [returnId, setReturnId] = useState("");
	const [created, setCreated] = useState<Refund | null>(null);

	async function createRefund() {
		if (!returnId) {
			return;
		}
		const refund = await create.mutateAsync({
			body: { returnId },
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
		});
		if (identity?.authUserId) {
			recordMakerActor("refund", refund.id, identity.authUserId);
		}
		recordCreatedResource("refund", {
			createdAt: refund.requestedAt,
			id: refund.id,
			label: `Refund for return ${returnId}`,
		});
		setCreated(refund);
		toast.success("Refund requested; pending approval");
	}

	if (created) {
		return (
			<OperationsPageFrame
				description="Requested: no register cash effect has posted yet (frozen control plan §6.4)."
				title="Refund requested"
			>
				<PosSectionCard title="Requested refund">
					<p>
						<StateBadge state={created.state} /> ·{" "}
						{formatMoneyMinor(created.amount.amountMinor, "GYD")}
					</p>
					<CopyableId id={created.id} label="Refund ID" />
					<p className="text-muted-foreground text-sm">
						A second authorized identity must approve this refund before the
						cash-out posts to the register.
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.refund.create against an already-approved return."
			title="Request a refund"
		>
			<PosSectionCard title="Request a cash refund">
				<div className="grid max-w-md gap-4">
					<PosTextField
						field={{
							handleBlur: () => undefined,
							handleChange: setReturnId,
							name: "returnId",
							state: { meta: { errors: [] }, value: returnId },
						}}
						label="Approved return ID"
					/>
					<MutationError error={create.error} isOnline={workspace.isOnline} />
					<Button
						className="w-fit"
						disabled={
							create.isPending || !workspace.contextId || !workspace.isOnline
						}
						onClick={createRefund}
						type="button"
					>
						{create.isPending ? "Requesting…" : "Request refund"}
					</Button>
				</div>
			</PosSectionCard>
		</OperationsPageFrame>
	);
}

export function RefundApprovePage() {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const approve = useOnlineGatedMutation(
		orpc.commerce.refunds.approve.mutationOptions(),
		workspace.isOnline
	);
	const [refundId, setRefundId] = useState("");
	const [approved, setApproved] = useState<Refund | null>(null);
	const [selfApproval, setSelfApproval] = useState(false);
	useEffect(() => {
		setSelfApproval(
			isKnownSelfApproval("refund", refundId, identity?.authUserId ?? null)
		);
	}, [refundId, identity?.authUserId]);

	// WS3 remediation R3, Finding I: pre-commit consequence preview.
	const [confirmOpen, setConfirmOpen] = useState(false);
	const preview = useQuery({
		...orpc.commerce.refunds.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { refundId },
			},
		}),
		enabled: confirmOpen && Boolean(workspace.contextId && refundId),
		retry: false,
	});

	async function commitApproveRefund() {
		if (!refundId) {
			return;
		}
		const refund = await approve.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { refundId },
		});
		setConfirmOpen(false);
		setApproved(refund);
		toast.success("Refund approved; cash posted");
	}

	if (approved) {
		return (
			<OperationsPageFrame
				description="commerce.cash-movement.posted.v1 emitted (paid-out, reason Refund)."
				title="Refund approved"
			>
				<PosSectionCard title={`Refund ${approved.id}`}>
					<p>
						<StateBadge state={approved.state} /> ·{" "}
						{formatMoneyMinor(approved.amount.amountMinor, "GYD")}
					</p>
					<p className="text-muted-foreground text-sm">
						Register: <span className="font-mono">{approved.registerId}</span>
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="commerce.refund.approve. The approver must be a different authorized identity than whoever requested the refund — self-approval is hidden in this browser when it requested the refund."
			title="Approve a refund"
		>
			<PosSectionCard title="Approve a pending refund">
				{refundId && selfApproval ? (
					<p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
						This browser requested this refund, so it cannot approve its own
						request. Ask a second authorized identity to complete this step.
					</p>
				) : (
					<div className="grid max-w-md gap-4">
						<PosTextField
							field={{
								handleBlur: () => undefined,
								handleChange: setRefundId,
								name: "refundId",
								state: { meta: { errors: [] }, value: refundId },
							}}
							label="Refund ID"
						/>
						<Button
							className="w-fit"
							disabled={!(refundId && workspace.isOnline)}
							onClick={() => setConfirmOpen(true)}
							type="button"
						>
							Review &amp; approve refund
						</Button>
					</div>
				)}
				<ConsequencePreviewDialog
					commitError={approve.error}
					confirming={approve.isPending}
					confirmLabel="Approve refund"
					data={preview.data}
					description="Approving posts a paid-out cash movement (reason Refund) on the referenced open register and cannot be undone from this screen."
					error={preview.error}
					isError={preview.isError}
					isLoading={preview.isLoading}
					isOnline={workspace.isOnline}
					onConfirm={() => {
						commitApproveRefund().catch(() => undefined);
					}}
					onOpenChange={setConfirmOpen}
					open={confirmOpen}
					renderPreview={(refund) => (
						<dl className="grid gap-1">
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Refund</dt>
								<dd className="font-mono">{refund.id}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Return</dt>
								<dd className="font-mono">{refund.returnId}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Register</dt>
								<dd className="font-mono">{refund.registerId}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Amount</dt>
								<dd>{formatMoneyMinor(refund.amount.amountMinor, "GYD")}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">State</dt>
								<dd>{refund.state}</dd>
							</div>
						</dl>
					)}
					title="Approve this refund?"
				/>
			</PosSectionCard>
		</OperationsPageFrame>
	);
}
