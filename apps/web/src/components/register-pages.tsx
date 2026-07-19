"use client";

import type { RegisterSession } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { Label } from "@meridian/ui-web/components/label";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { stableIntentKey } from "@/lib/operations";
import {
	type CashLedgerEntry,
	clearRegisterWorkspace,
	formatMoneyMinor,
	isKnownSelfApproval,
	ledgerEntryMinor,
	loadRegisterWorkspace,
	openingLedgerEntry,
	parseMoneyInputToMinor,
	type RegisterWorkspace,
	recordMakerActor,
	runningExpectedCashMinor,
	saveRegisterWorkspace,
} from "@/lib/pos";
import { workspaceWorkState } from "@/lib/workspace-change";
import { orpc } from "@/utils/orpc";

import { ConsequencePreviewDialog } from "./consequence-preview-dialog";
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
	posHref,
} from "./pos-shared";
import { useOnlineGatedMutation } from "./use-online-gated-mutation";
import { useWorkspace, useWorkspaceWorkGuard } from "./workspace-context";

const RegisterOpenValuesSchema = z.object({
	openingFloat: z
		.string()
		.refine((value) => parseMoneyInputToMinor(value) !== null, {
			message: "Enter a non-negative amount with up to 2 decimal places",
		}),
	registerId: z
		.string()
		.min(12, "Register ID must be at least 12 characters")
		.max(64)
		.regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, _ and - only"),
});

export function RegisterOpenPage() {
	const workspace = useWorkspace();
	const router = useRouter();
	const open = useMutation(orpc.commerce.registers.open.mutationOptions());
	const [isDirty, setIsDirty] = useState(false);
	const intentRef = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	const [opened, setOpened] = useState<RegisterSession | null>(null);
	useWorkspaceWorkGuard(workspaceWorkState(open.isPending, isDirty));
	// A register is a physical, location-scoped device; commerce.register.open
	// rejects an "all locations" active context server-side. Surface that as
	// guidance here rather than letting the command round-trip fail.
	const hasLocationScope = Boolean(
		workspace.identity?.activeContext?.locationId
	);

	const form = useForm({
		defaultValues: { openingFloat: "0.00", registerId: "" },
		onSubmit: async ({ value }) => {
			const openingFloatMinor = parseMoneyInputToMinor(value.openingFloat);
			if (openingFloatMinor === null) {
				return;
			}
			const body = {
				currency: "GYD" as const,
				openingFloat: { amountMinor: openingFloatMinor, currency: "GYD" },
			};
			const intent = stableIntentKey(
				intentRef.current,
				JSON.stringify({
					body,
					contextId: workspace.contextId,
					registerId: value.registerId,
				}),
				() => crypto.randomUUID()
			);
			intentRef.current = intent;
			const session = await open.mutateAsync({
				body,
				headers: {
					"idempotency-key": intent.key,
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { registerId: value.registerId },
			});
			intentRef.current = null;
			const ledger: CashLedgerEntry[] = [openingLedgerEntry(session)];
			saveRegisterWorkspace({ ledger, session });
			setOpened(session);
			toast.success(`Register ${session.registerId} opened`);
		},
		onSubmitInvalid: () => {
			requestAnimationFrame(() =>
				document
					.querySelector<HTMLElement>(
						'#register-open-form [aria-invalid="true"]'
					)
					?.focus()
			);
		},
		validators: { onSubmit: RegisterOpenValuesSchema },
	});

	if (opened) {
		return (
			<OperationsPageFrame
				description="The register is open. This session's cash workspace lives in this browser tab until it is closed."
				title="Register opened"
			>
				<PosSectionCard title={`Register ${opened.registerId}`}>
					<p>
						Opening float:{" "}
						{formatMoneyMinor(opened.openingFloat.amountMinor, opened.currency)}
					</p>
					<CopyableId id={opened.id} label="Register session ID" />
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() =>
								router.push(
									`/operations/pos/registers/${encodeURIComponent(opened.id)}`
								)
							}
						>
							Go to session view
						</Button>
					</div>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.register.open. Every register-affecting command is re-checked server-side regardless of this form's contents."
			title="Open register"
		>
			{hasLocationScope ? null : (
				<p className="mb-5 rounded-2xl border border-dashed p-4 text-muted-foreground text-sm">
					A register belongs to one physical location. Choose a specific
					location (not "All locations") in the workspace switcher above before
					opening a register.
				</p>
			)}
			<form
				className="grid max-w-xl gap-5"
				id="register-open-form"
				noValidate
				onChangeCapture={() => setIsDirty(true)}
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field name="registerId">
					{(field) => (
						<PosTextField
							autoFocus
							field={field}
							label="Register ID"
							placeholder="e.g. register_till_0001"
						/>
					)}
				</form.Field>
				<form.Field name="openingFloat">
					{(field) => (
						<PosMoneyField field={field} label="Opening float (GYD)" />
					)}
				</form.Field>
				<MutationError error={open.error} isOnline={workspace.isOnline} />
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
								!workspace.isOnline ||
								!hasLocationScope
							}
							type="submit"
						>
							{isSubmitting ? "Opening…" : "Open register"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</OperationsPageFrame>
	);
}

function CashMovementForm({
	onPosted,
	registerId,
	registerSessionId,
}: {
	onPosted: (entry: CashLedgerEntry) => void;
	registerId: string;
	registerSessionId: string;
}) {
	const workspace = useWorkspace();
	const create = useOnlineGatedMutation(
		orpc.commerce.cashMovements.create.mutationOptions(),
		workspace.isOnline
	);
	const intentRef = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	const form = useForm({
		defaultValues: {
			amount: "0.00",
			direction: "PaidIn" as "PaidIn" | "PaidOut",
			note: "",
		},
		onSubmit: async ({ value }) => {
			const amountMinor = parseMoneyInputToMinor(value.amount);
			if (amountMinor === null || amountMinor <= 0) {
				return;
			}
			const body = {
				amount: { amountMinor, currency: "GYD" as const },
				direction: value.direction,
				note: value.note.trim() || undefined,
				reasonCode: value.direction,
			};
			const intent = stableIntentKey(
				intentRef.current,
				JSON.stringify({ body, registerSessionId }),
				() => crypto.randomUUID()
			);
			intentRef.current = intent;
			const movement = await create.mutateAsync({
				body,
				headers: {
					"idempotency-key": intent.key,
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { registerId },
			});
			intentRef.current = null;
			onPosted({
				amountMinor: ledgerEntryMinor(
					value.direction,
					movement.amount.amountMinor
				),
				id: movement.id,
				kind: value.direction,
				occurredAt: movement.createdAt,
			});
			form.reset();
			toast.success(`${value.direction} recorded`);
		},
		validators: {
			onSubmit: z.object({
				amount: z.string().refine((value) => {
					const parsed = parseMoneyInputToMinor(value);
					return parsed !== null && parsed > 0;
				}, "Enter a positive amount"),
				direction: z.enum(["PaidIn", "PaidOut"]),
				note: z.string().max(500),
			}),
		},
	});
	return (
		<form
			className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="direction">
				{(field) => (
					<div className="grid gap-1">
						<Label htmlFor="cash-movement-direction">Direction</Label>
						<select
							className="min-h-10 rounded-xl border bg-background px-3 text-sm"
							id="cash-movement-direction"
							onChange={(event) =>
								field.handleChange(event.target.value as "PaidIn" | "PaidOut")
							}
							value={field.state.value}
						>
							<option value="PaidIn">Paid in</option>
							<option value="PaidOut">Paid out</option>
						</select>
					</div>
				)}
			</form.Field>
			<form.Field name="amount">
				{(field) => (
					<PosMoneyField
						field={field}
						id="cash-movement-amount"
						label="Amount (GYD)"
					/>
				)}
			</form.Field>
			<form.Field name="note">
				{(field) => (
					<PosTextField
						field={field}
						id="cash-movement-note"
						label="Note (optional)"
					/>
				)}
			</form.Field>
			<MutationError error={create.error} isOnline={workspace.isOnline} />
			<Button disabled={create.isPending || !workspace.isOnline} type="submit">
				{create.isPending ? "Recording…" : "Record movement"}
			</Button>
		</form>
	);
}

function SafeDropForm({
	onPosted,
	registerId,
}: {
	onPosted: (entry: CashLedgerEntry) => void;
	registerId: string;
}) {
	const workspace = useWorkspace();
	const create = useOnlineGatedMutation(
		orpc.commerce.safeDrops.create.mutationOptions(),
		workspace.isOnline
	);
	const intentRef = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	const form = useForm({
		defaultValues: { amount: "0.00", note: "" },
		onSubmit: async ({ value }) => {
			const amountMinor = parseMoneyInputToMinor(value.amount);
			if (amountMinor === null || amountMinor <= 0) {
				return;
			}
			const body = {
				amount: { amountMinor, currency: "GYD" as const },
				note: value.note.trim() || undefined,
			};
			const intent = stableIntentKey(
				intentRef.current,
				JSON.stringify({ body, registerId }),
				() => crypto.randomUUID()
			);
			intentRef.current = intent;
			const movement = await create.mutateAsync({
				body,
				headers: {
					"idempotency-key": intent.key,
					"x-active-context-id": workspace.contextId ?? "",
				},
				params: { registerId },
			});
			intentRef.current = null;
			onPosted({
				amountMinor: ledgerEntryMinor("SafeDrop", movement.amount.amountMinor),
				id: movement.id,
				kind: "SafeDrop",
				occurredAt: movement.createdAt,
			});
			form.reset();
			toast.success("Safe drop recorded");
		},
		validators: {
			onSubmit: z.object({
				amount: z.string().refine((value) => {
					const parsed = parseMoneyInputToMinor(value);
					return parsed !== null && parsed > 0;
				}, "Enter a positive amount"),
				note: z.string().max(500),
			}),
		},
	});
	return (
		<form
			className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="amount">
				{(field) => (
					<PosMoneyField
						field={field}
						id="safe-drop-amount"
						label="Safe drop amount (GYD)"
					/>
				)}
			</form.Field>
			<form.Field name="note">
				{(field) => (
					<PosTextField
						field={field}
						id="safe-drop-note"
						label="Note (optional)"
					/>
				)}
			</form.Field>
			<MutationError error={create.error} isOnline={workspace.isOnline} />
			<Button
				disabled={create.isPending || !workspace.isOnline}
				type="submit"
				variant="outline"
			>
				{create.isPending ? "Recording…" : "Record safe drop"}
			</Button>
		</form>
	);
}

export function RegisterSessionPage({
	registerSessionId,
}: {
	registerSessionId: string;
}) {
	const router = useRouter();
	// sessionStorage does not exist during server rendering; reading it in the
	// render body would produce a server/client hydration mismatch (null on
	// the server, real data on the client). Load it post-mount instead, with
	// an explicit loading state in between.
	const [workspaceState, setWorkspaceState] =
		useState<RegisterWorkspace | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	useEffect(() => {
		setWorkspaceState(loadRegisterWorkspace(registerSessionId));
		setHasLoaded(true);
	}, [registerSessionId]);

	if (!hasLoaded) {
		return (
			<OperationsPageFrame
				description="Loading this browser's register workspace."
				title="Loading"
			>
				<div
					aria-label="Loading register session"
					className="grid gap-3"
					role="status"
				>
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
			</OperationsPageFrame>
		);
	}

	if (!workspaceState) {
		return (
			<OperationsPageFrame
				description="This register session is not held by this browser. No commerce.register.* read endpoint is registered in this contract surface, so a session can only be viewed by the browser that opened or last acted on it."
				title="Session not available in this browser"
			>
				<p className="rounded-2xl border border-dashed p-6 text-muted-foreground">
					Open a register from this browser, or ask the browser that opened
					register session {registerSessionId} to continue this workflow.
				</p>
			</OperationsPageFrame>
		);
	}

	const { session } = workspaceState;
	const expected = runningExpectedCashMinor(workspaceState.ledger);

	function appendLedger(entry: CashLedgerEntry) {
		setWorkspaceState((current) => {
			if (!current) {
				return current;
			}
			const next: RegisterWorkspace = {
				ledger: [...current.ledger, entry],
				session: current.session,
			};
			saveRegisterWorkspace(next);
			return next;
		});
	}

	return (
		<OperationsPageFrame
			description="Movements, safe drops, and a running expected-cash tally for this browser's open session."
			title={`Register ${session.registerId}`}
		>
			<div className="grid gap-6">
				<PosSectionCard title="Session status">
					<p>
						<StateBadge state={session.state} /> · opened{" "}
						{new Intl.DateTimeFormat(undefined, {
							dateStyle: "medium",
							timeStyle: "short",
						}).format(new Date(session.openedAt))}
					</p>
					<p className="font-medium text-lg">
						Running expected cash:{" "}
						{formatMoneyMinor(expected, session.currency)}
					</p>
					<p className="text-muted-foreground text-sm">
						This total is this browser's own running tally, seeded from the
						opening float and updated as this browser records movements, safe
						drops, cash sales, and posted cash refunds. It is not a server
						aggregate — no such read endpoint is registered.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() =>
								router.push(
									posHref("/operations/pos/sales/new", {
										registerId: session.registerId,
										registerSessionId: session.id,
									})
								)
							}
						>
							Start a sale
						</Button>
						<Button
							onClick={() =>
								router.push(
									posHref(
										`/operations/pos/registers/${encodeURIComponent(session.id)}/close`
									)
								)
							}
							variant="outline"
						>
							Close register
						</Button>
					</div>
				</PosSectionCard>

				<PosSectionCard
					description="Realizes commerce.cash-movement.create (paid-in/paid-out share this permission)."
					title="Record a cash movement"
				>
					<CashMovementForm
						onPosted={appendLedger}
						registerId={session.registerId}
						registerSessionId={session.id}
					/>
				</PosSectionCard>

				<PosSectionCard
					description="Realizes commerce.cash-movement.create (safe-drop reason code)."
					title="Record a safe drop"
				>
					<SafeDropForm
						onPosted={appendLedger}
						registerId={session.registerId}
					/>
				</PosSectionCard>

				<PosSectionCard title="Session ledger">
					{workspaceState.ledger.length === 0 ? (
						<p className="text-muted-foreground">
							No cash movements recorded yet.
						</p>
					) : (
						<ul aria-label="Cash ledger entries" className="grid gap-2">
							{workspaceState.ledger.map((entry) => (
								<li
									className="flex justify-between rounded-xl border p-3 text-sm"
									key={entry.id}
								>
									<span>{entry.kind}</span>
									<span>
										{formatMoneyMinor(entry.amountMinor, session.currency)}
									</span>
								</li>
							))}
						</ul>
					)}
				</PosSectionCard>
			</div>
		</OperationsPageFrame>
	);
}

const CloseValuesSchema = z.object({
	countedCash: z
		.string()
		.refine((value) => parseMoneyInputToMinor(value) !== null, {
			message: "Enter a non-negative amount with up to 2 decimal places",
		}),
	reason: z.string().max(500),
});

export function RegisterClosePage({
	registerSessionId,
}: {
	registerSessionId: string;
}) {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const close = useOnlineGatedMutation(
		orpc.commerce.registers.close.mutationOptions(),
		workspace.isOnline
	);
	const [isDirty, setIsDirty] = useState(false);
	const intentRef = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	const [result, setResult] = useState<RegisterSession | null>(null);
	useWorkspaceWorkGuard(workspaceWorkState(close.isPending, isDirty));

	// WS3 remediation R3, Finding I: pre-commit consequence preview. Fetched
	// only once the dialog is actually open (not eagerly on page load) so
	// the shown data is as fresh as possible at the moment of review.
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingClose, setPendingClose] = useState<{
		countedCashMinor: number;
		reason?: string;
	} | null>(null);
	const preview = useQuery({
		...orpc.commerce.registerSessions.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { sessionId: registerSessionId },
			},
		}),
		enabled: confirmOpen && Boolean(workspace.contextId),
		retry: false,
	});

	// See RegisterSessionPage: sessionStorage is read post-mount only, to
	// avoid a server/client hydration mismatch.
	const [registerId, setRegisterId] = useState("");
	useEffect(() => {
		const workspaceState = loadRegisterWorkspace(registerSessionId);
		setRegisterId(workspaceState ? workspaceState.session.registerId : "");
	}, [registerSessionId]);

	// `identity` loads asynchronously (it is `undefined` on this page's very
	// first render); TanStack Form's `useForm` binds `onSubmit` once at
	// mount rather than re-binding it every render, so a plain closure over
	// `identity` inside `onSubmit` below can stay permanently stale at
	// `undefined` even after the identity query resolves. A ref sidesteps
	// this — `onSubmit` reads `identityRef.current` fresh on every call
	// regardless of when the closure itself was created. Assigned directly
	// in the render body (a documented-safe React pattern for keeping a ref
	// current), not inside `useEffect`: an effect only runs after paint,
	// leaving a real window in which the "Close register" button is already
	// enabled (computed straight from `identity` in this same render) but
	// the ref has not caught up yet — exactly the race this stage's own
	// e2e suite caught.
	const identityRef = useRef(identity);
	identityRef.current = identity;

	const form = useForm({
		defaultValues: { countedCash: "0.00", reason: "" },
		// WS3 remediation R3, Finding I: submitting no longer commits
		// directly — it opens the consequence-preview dialog. The actual
		// close.mutateAsync call moves to `commitClose`, fired only from
		// the dialog's explicit Confirm control.
		onSubmit: ({ value }) => {
			const countedCashMinor = parseMoneyInputToMinor(value.countedCash);
			if (countedCashMinor === null) {
				return;
			}
			setPendingClose({
				countedCashMinor,
				reason: value.reason.trim() || undefined,
			});
			setConfirmOpen(true);
		},
		validators: { onSubmit: CloseValuesSchema },
	});

	async function commitClose() {
		if (!pendingClose) {
			return;
		}
		const body = {
			countedCash: {
				amountMinor: pendingClose.countedCashMinor,
				currency: "GYD" as const,
			},
			reason: pendingClose.reason,
		};
		const intent = stableIntentKey(
			intentRef.current,
			JSON.stringify({ body, registerSessionId }),
			() => crypto.randomUUID()
		);
		intentRef.current = intent;
		const session = await close.mutateAsync({
			body,
			headers: {
				"idempotency-key": intent.key,
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { registerId },
		});
		intentRef.current = null;
		setConfirmOpen(false);
		setResult(session);
		const currentAuthUserId = identityRef.current?.authUserId;
		if (session.state === "Closing" && currentAuthUserId) {
			// This browser performed the close (the maker for the pending
			// variance approval): record it so THIS browser hides its own
			// approve control (session-local best-effort — see pos.ts).
			recordMakerActor("cash-variance", session.id, currentAuthUserId);
		} else if (session.state === "Closed") {
			clearRegisterWorkspace(session.id);
			toast.success("Register closed");
		}
	}

	if (result?.state === "Closing") {
		const { variance } = result;
		return (
			<OperationsPageFrame
				description="Non-zero variance: the register stays in a pending-approval state for read/audit only. No further cash movements are accepted here and no commerce.register.closed.v1 event has been emitted yet (frozen control plan §6.1)."
				title="Variance approval required"
			>
				<div className="grid gap-6">
					<PosSectionCard title="Pending variance">
						<p>
							Variance:{" "}
							{variance
								? formatMoneyMinor(variance.amountMinor, result.currency)
								: "unknown"}
						</p>
						<CopyableId id={result.id} label="Variance / register session ID" />
						<p className="text-muted-foreground text-sm">
							Version: <span className="font-mono">{result.version}</span>
						</p>
					</PosSectionCard>
					<VarianceApprovalSection
						// A different `key` than the standalone-view instance below
						// forces React to mount a FRESH component instance for this
						// branch rather than reusing one across the transition (both
						// branches render the same `<div className="grid gap-6">
						// <PosSectionCard/><VarianceApprovalSection/></div>` shape at
						// the same tree position, which React would otherwise treat
						// as the same instance and preserve its state — including a
						// `useEffect` whose dependencies never change across the
						// transition, so it would never re-read the sessionStorage
						// write `recordMakerActor` just made). This was a real,
						// e2e-caught defect, not a hypothetical.
						key={`post-close-${result.id}`}
						registerSessionId={result.id}
					/>
				</div>
			</OperationsPageFrame>
		);
	}

	if (result?.state === "Closed") {
		return (
			<OperationsPageFrame
				description="The register is closed."
				title="Register closed"
			>
				<PosSectionCard title={`Register ${result.registerId}`}>
					<p>
						Counted cash:{" "}
						{result.countedCash
							? formatMoneyMinor(
									result.countedCash.amountMinor,
									result.currency
								)
							: "—"}
					</p>
					<p>
						Variance:{" "}
						{result.variance
							? formatMoneyMinor(result.variance.amountMinor, result.currency)
							: formatMoneyMinor(0, result.currency)}
					</p>
				</PosSectionCard>
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes commerce.register.close. A zero-variance count closes immediately; a non-zero count routes to commerce.cash-variance.approve (frozen control plan §6.1)."
			title="Close register"
		>
			<div className="grid gap-6">
				<PosSectionCard title="Close this browser's register">
					<form
						className="grid max-w-xl gap-5"
						noValidate
						onChangeCapture={() => setIsDirty(true)}
						onSubmit={(event) => {
							event.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field name="countedCash">
							{(field) => (
								<PosMoneyField field={field} label="Counted cash (GYD)" />
							)}
						</form.Field>
						<form.Field name="reason">
							{(field) => (
								<PosTextField field={field} label="Reason (optional)" />
							)}
						</form.Field>
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
										!workspace.isOnline ||
										!registerId ||
										// Guards against submitting before `identityRef` (used to
										// record the maker for self-approval hiding, above) has
										// resolved past its pre-hydration initial value — a real
										// race on a fresh full navigation, not merely a test
										// artifact.
										!identity?.authUserId
									}
									type="submit"
								>
									Review &amp; close register
								</Button>
							)}
						</form.Subscribe>
						{registerId ? null : (
							<p className="text-muted-foreground text-sm">
								This browser has no local record of this register session; open
								it from this browser first, or use variance approval below if
								you are the second authorized identity.
							</p>
						)}
					</form>
					<ConsequencePreviewDialog
						commitError={close.error}
						confirming={close.isPending}
						confirmLabel="Close register"
						data={preview.data}
						description="Counted cash is compared against the register's authoritative expected cash. A match closes the register immediately; a difference routes to a second approver before it closes."
						error={preview.error}
						isError={preview.isError}
						isLoading={preview.isLoading}
						isOnline={workspace.isOnline}
						onConfirm={() => {
							commitClose().catch(() => undefined);
						}}
						onOpenChange={setConfirmOpen}
						open={confirmOpen}
						renderPreview={(session) => (
							<dl className="grid gap-1">
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Register</dt>
									<dd className="font-mono">{session.registerId}</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Location</dt>
									<dd className="font-mono">{session.locationId}</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">
										Server expected cash
									</dt>
									<dd>
										{session.expectedCash
											? formatMoneyMinor(
													session.expectedCash.amountMinor,
													session.currency
												)
											: "—"}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Your counted cash</dt>
									<dd>
										{pendingClose
											? formatMoneyMinor(
													pendingClose.countedCashMinor,
													session.currency
												)
											: "—"}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">State</dt>
									<dd>{session.state}</dd>
								</div>
							</dl>
						)}
						title="Close this register?"
					/>
				</PosSectionCard>
				<VarianceApprovalSection
					key={`standalone-${registerSessionId}`}
					registerSessionId={registerSessionId}
				/>
			</div>
		</OperationsPageFrame>
	);
}

function VarianceApprovalSection({
	registerSessionId,
}: {
	registerSessionId: string;
}) {
	const workspace = useWorkspace();
	const { identity } = workspace;
	const approve = useOnlineGatedMutation(
		orpc.commerce.cashVariances.approve.mutationOptions(),
		workspace.isOnline
	);
	const [varianceId, setVarianceId] = useState(registerSessionId);
	const [approved, setApproved] = useState<RegisterSession | null>(null);
	// `isKnownSelfApproval` reads sessionStorage, an impure external mutable
	// source — calling it directly in the render body is unsafe with the
	// React Compiler's render-purity assumption (a memoized render can miss
	// a sessionStorage write that happened between renders, exactly as
	// `RegisterSessionPage`/`RegisterClosePage` already had to guard against
	// for hydration). Compute it in an effect and hold it in state instead.
	const [selfApproval, setSelfApproval] = useState(false);
	useEffect(() => {
		setSelfApproval(
			isKnownSelfApproval(
				"cash-variance",
				varianceId,
				identity?.authUserId ?? null
			)
		);
	}, [varianceId, identity?.authUserId]);

	// WS3 remediation R3, Finding I: pre-commit consequence preview,
	// gated on commerce.cash-variance.approve (the SAME permission the
	// commit itself requires) via getCashVariance — a separate operation
	// from close-register's getRegisterSession even though both read the
	// identical RegisterSession row (see the domain-layer doc comment).
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingApproval, setPendingApproval] = useState<{
		varianceId: string;
		version: string;
	} | null>(null);
	const preview = useQuery({
		...orpc.commerce.cashVariances.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { varianceId: pendingApproval?.varianceId ?? "" },
			},
		}),
		enabled: confirmOpen && Boolean(workspace.contextId && pendingApproval),
		retry: false,
	});

	function reviewVariance(id: string, version: string) {
		setPendingApproval({ varianceId: id, version });
		setConfirmOpen(true);
	}

	async function commitApproveVariance() {
		if (!pendingApproval) {
			return;
		}
		const session = await approve.mutateAsync({
			headers: {
				"idempotency-key": crypto.randomUUID(),
				"if-match": pendingApproval.version,
				"x-active-context-id": workspace.contextId ?? "",
			},
			params: { varianceId: pendingApproval.varianceId },
		});
		clearRegisterWorkspace(session.id);
		setConfirmOpen(false);
		setApproved(session);
		toast.success("Variance approved; register closed");
	}

	if (approved) {
		return (
			<PosSectionCard title="Variance approved">
				<p>
					Register {approved.registerId} is now Closed. Counted cash:{" "}
					{approved.countedCash
						? formatMoneyMinor(
								approved.countedCash.amountMinor,
								approved.currency
							)
						: "—"}
					.
				</p>
			</PosSectionCard>
		);
	}

	return (
		<PosSectionCard
			description="commerce.cash-variance.approve: use the register session ID and version the closer's screen displayed. The approver must be a different authorized identity than whoever closed the register — this control is not available in a browser that closed a pending variance itself."
			title="Approve a pending variance"
		>
			{selfApproval ? (
				<p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
					This browser closed this register, so it cannot approve its own
					variance. Ask a second authorized identity to complete this step.
				</p>
			) : (
				<VarianceApproveForm
					initialVarianceId={varianceId}
					initialVersion=""
					isOnline={workspace.isOnline}
					onApprove={reviewVariance}
					onVarianceIdChange={setVarianceId}
					pending={approve.isPending}
				/>
			)}
			<ConsequencePreviewDialog
				commitError={approve.error}
				confirming={approve.isPending}
				confirmLabel="Approve variance"
				data={preview.data}
				description="Approving posts the register as Closed and emits commerce.register.closed.v1. This cannot be undone from this screen."
				error={preview.error}
				isError={preview.isError}
				isLoading={preview.isLoading}
				isOnline={workspace.isOnline}
				onConfirm={() => {
					commitApproveVariance().catch(() => undefined);
				}}
				onOpenChange={setConfirmOpen}
				open={confirmOpen}
				renderPreview={(session) => (
					<dl className="grid gap-1">
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Register</dt>
							<dd className="font-mono">{session.registerId}</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Location</dt>
							<dd className="font-mono">{session.locationId}</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Counted cash</dt>
							<dd>
								{session.countedCash
									? formatMoneyMinor(
											session.countedCash.amountMinor,
											session.currency
										)
									: "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">Variance</dt>
							<dd>
								{session.variance
									? formatMoneyMinor(
											session.variance.amountMinor,
											session.currency
										)
									: "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">State</dt>
							<dd>{session.state}</dd>
						</div>
					</dl>
				)}
				title="Approve this cash variance?"
			/>
		</PosSectionCard>
	);
}

function VarianceApproveForm({
	initialVarianceId,
	initialVersion,
	isOnline = true,
	onApprove,
	onVarianceIdChange,
	pending,
}: {
	initialVarianceId: string;
	initialVersion: string;
	isOnline?: boolean;
	onApprove: (varianceId: string, version: string) => void;
	onVarianceIdChange?: (value: string) => void;
	pending: boolean;
}) {
	const form = useForm({
		defaultValues: { varianceId: initialVarianceId, version: initialVersion },
		onSubmit: ({ value }) => {
			onApprove(value.varianceId, value.version);
		},
	});
	return (
		<form
			className="grid gap-4"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="varianceId">
				{(field) => (
					<PosTextField
						field={{
							handleBlur: field.handleBlur,
							handleChange: (value: string) => {
								field.handleChange(value);
								onVarianceIdChange?.(value);
							},
							name: field.name,
							state: field.state,
						}}
						label="Variance / register session ID"
					/>
				)}
			</form.Field>
			<form.Field name="version">
				{(field) => (
					<PosTextField field={field} inputMode="numeric" label="Version" />
				)}
			</form.Field>
			<Button className="w-fit" disabled={pending || !isOnline} type="submit">
				Review &amp; approve variance
			</Button>
		</form>
	);
}
