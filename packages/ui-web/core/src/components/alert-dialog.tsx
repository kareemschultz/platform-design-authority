"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Button } from "@meridian/ui-web/components/button";

import { cn } from "@meridian/ui-web/lib/utils";
import type * as React from "react";

/**
 * WS3 remediation R3, Finding I: the owned dialog primitive every
 * pre-commit consequence-preview control (close-register, refund-approve,
 * deposit-confirm, return-approve, variance-approve, receipt-void) is
 * built on. Base UI's `AlertDialog` (unlike the plain `Dialog` in
 * `dialog.tsx`) never closes on an outside/backdrop press — only an
 * explicit `Close`/Cancel action or Escape — matching the "require an
 * explicit confirmation" requirement directly, without hand-rolled
 * `disablePointerDismissal` wiring. Mirrors `dialog.tsx`'s normalization
 * pattern exactly (copied and normalized into platform-owned source per
 * CLAUDE.md §8), built directly from `@base-ui/react` (already a
 * dependency here) — no Shadcn Studio source needed for this primitive.
 */
function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
	return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
	return (
		<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
	);
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
	return (
		<AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
	);
}

function AlertDialogClose({ ...props }: AlertDialogPrimitive.Close.Props) {
	return (
		<AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
	);
}

function AlertDialogOverlay({
	className,
	...props
}: AlertDialogPrimitive.Backdrop.Props) {
	return (
		<AlertDialogPrimitive.Backdrop
			className={cn(
				"data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/30 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-sm",
				className
			)}
			data-slot="alert-dialog-overlay"
			{...props}
		/>
	);
}

/**
 * `initialFocus` is left to the CALLER (never defaulted to the commit/
 * confirm control) — Finding I's supplemental requirement is
 * non-destructive initial focus, satisfied by every call site passing a
 * ref to its Cancel button (Base UI's own default, first-tabbable-
 * element behavior, already lands on Cancel since it is the first
 * focusable control in every dialog built with this component — but
 * every call site sets it explicitly rather than relying on DOM order).
 * `finalFocus` is intentionally left at Base UI's default (`true`): focus
 * returns to the triggering element on close, satisfying the "focus
 * restored to the triggering element" requirement with no extra wiring.
 */
function AlertDialogContent({
	className,
	children,
	initialFocus,
	...props
}: AlertDialogPrimitive.Popup.Props & {
	initialFocus?: AlertDialogPrimitive.Popup.Props["initialFocus"];
}) {
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Popup
				className={cn(
					"data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed start-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground text-sm shadow-xl outline-none ring-1 ring-foreground/5 duration-100 data-closed:animate-out data-open:animate-in sm:max-w-md rtl:translate-x-1/2 dark:ring-foreground/10",
					className
				)}
				data-slot="alert-dialog-content"
				initialFocus={initialFocus}
				{...props}
			>
				{children}
			</AlertDialogPrimitive.Popup>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col gap-1.5", className)}
			data-slot="alert-dialog-header"
			{...props}
		/>
	);
}

function AlertDialogFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className
			)}
			data-slot="alert-dialog-footer"
			{...props}
		/>
	);
}

function AlertDialogTitle({
	className,
	...props
}: AlertDialogPrimitive.Title.Props) {
	return (
		<AlertDialogPrimitive.Title
			className={cn(
				"font-heading font-medium text-base leading-none",
				className
			)}
			data-slot="alert-dialog-title"
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: AlertDialogPrimitive.Description.Props) {
	return (
		<AlertDialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="alert-dialog-description"
			{...props}
		/>
	);
}

/** Convenience Cancel action pre-wired to `AlertDialogClose` + the
 * `outline` variant every call site uses — a plain Button, never the
 * default/destructive treatment, so it never visually competes with the
 * actual commit control. */
function AlertDialogCancel({
	className,
	ref,
	...props
}: React.ComponentProps<typeof Button> & {
	ref?: React.Ref<HTMLButtonElement>;
}) {
	return (
		<AlertDialogClose
			render={
				<Button className={className} ref={ref} variant="outline" {...props} />
			}
		/>
	);
}

export {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
