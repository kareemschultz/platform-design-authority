"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@meridian/ui-web/components/alert-dialog";
import { Button } from "@meridian/ui-web/components/button";
import { useRef } from "react";

/**
 * WS3 remediation R3, Finding I: the ONE consequence-preview dialog every
 * close-register / refund-approve / deposit-confirm / return-approve /
 * variance-approve / receipt-void control shares. Fetches and displays
 * REAL server-derived data (never values the approval form itself
 * supplied) before the actual commit mutation fires.
 *
 * Second independent review's supplemental requirement, satisfied by
 * construction rather than per-call-site wiring:
 * - Non-destructive initial focus: `AlertDialogContent`'s `initialFocus`
 *   always points at the Cancel button below, never the commit control.
 * - Escape and an explicit Cancel both work: Base UI's `AlertDialog`
 *   closes on Escape by default; `AlertDialogCancel` is a real `Close`.
 * - Focus is restored to the triggering element on close: Base UI's
 *   `finalFocus` default (unchanged here).
 * - Full keyboard operability: every control below is a real
 *   button/native element, no custom key handling needed.
 */
export function ConsequencePreviewDialog<TData>({
	confirmDisabled,
	confirmLabel,
	confirming,
	confirmVariant = "destructive",
	data,
	description,
	error,
	isError,
	isLoading,
	onConfirm,
	onOpenChange,
	open,
	renderPreview,
	title,
}: {
	/** Disables the confirm control for a reason OTHER than
	 * loading/error/confirming (e.g. a required reason field is still
	 * empty) — merged with the built-in loading/error/confirming gates. */
	confirmDisabled?: boolean;
	confirmLabel: string;
	confirming: boolean;
	confirmVariant?: "default" | "destructive";
	/** The already-fetched server record, or `undefined` while
	 * loading/errored — `renderPreview` is only ever called once this is
	 * present. */
	data: TData | undefined;
	description: string;
	error: unknown;
	isError: boolean;
	isLoading: boolean;
	onConfirm: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	renderPreview: (data: TData) => React.ReactNode;
	title: string;
}) {
	const cancelRef = useRef<HTMLButtonElement>(null);
	const confirmButtonLabel = confirming ? "Working…" : confirmLabel;
	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent initialFocus={cancelRef}>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="grid gap-2 rounded-xl border p-4 text-sm">
					{isLoading ? (
						<p role="status">Loading current details from the server…</p>
					) : null}
					{isError ? (
						<p role="alert">
							Could not load current details
							{error instanceof Error ? `: ${error.message}` : "."} Close this
							dialog and try again.
						</p>
					) : null}
					{!(isLoading || isError) && data ? renderPreview(data) : null}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel ref={cancelRef}>Cancel</AlertDialogCancel>
					<Button
						disabled={isLoading || isError || confirming || confirmDisabled}
						onClick={onConfirm}
						variant={confirmVariant}
					>
						{confirmButtonLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
