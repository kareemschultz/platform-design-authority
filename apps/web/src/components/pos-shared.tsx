"use client";

import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import type { Route } from "next";
import Link from "next/link";

import { parseMoneyInputToMinor } from "@/lib/pos";

/** Next.js typed routes (next.config.ts `typedRoutes: true`) only accepts a
 * template literal href when every interpolated segment matches a static
 * route pattern — an arbitrary query string built from runtime values (this
 * page's `?registerId=...&registerSessionId=...` pattern) does not satisfy
 * that, so the single trusted construction site casts explicitly, exactly
 * like `operationsHref` in `@/lib/operations`. */
export function posHref(
	pathname: string,
	query?: Record<string, string>
): Route {
	if (!query) {
		return pathname as Route;
	}
	const search = new URLSearchParams(query).toString();
	return (search ? `${pathname}?${search}` : pathname) as Route;
}

export const POS_NAVIGATION = [
	{ href: "/operations/pos", label: "Overview" },
	{ href: "/operations/pos/registers", label: "Registers" },
	{ href: "/operations/pos/sales", label: "Sales" },
	{ href: "/operations/pos/receipts", label: "Receipts" },
	{ href: "/operations/pos/returns", label: "Returns" },
	{ href: "/operations/pos/refunds", label: "Refunds" },
	{ href: "/operations/pos/deposits", label: "Deposits" },
	{ href: "/operations/pos/exports", label: "Handoff export" },
] as const;

export interface TextFieldAdapter {
	handleBlur: () => void;
	handleChange: (value: string) => void;
	name: string;
	state: {
		meta: { errors: Array<{ message?: string } | string | undefined> };
		value: string;
	};
}

function fieldErrorMessage(
	errors: Array<{ message?: string } | string | undefined>
): string | undefined {
	const [first] = errors;
	if (!first) {
		return;
	}
	return typeof first === "string" ? first : first.message;
}

export function PosTextField({
	autoFocus,
	field,
	id,
	inputMode,
	label,
	placeholder,
}: {
	autoFocus?: boolean;
	field: TextFieldAdapter;
	/** Overrides the DOM id (defaults to `field.name`). Required whenever two
	 * forms with a same-named field (e.g. two "amount" fields) render on the
	 * same page — `field.name` alone would produce a duplicate DOM id, which
	 * breaks label association: the browser resolves every `<label for>` for
	 * that id to the first matching element, corrupting both the accessible
	 * name and which input `getByLabel`/assistive tech actually targets. */
	id?: string;
	inputMode?: "decimal" | "numeric" | "text";
	label: string;
	placeholder?: string;
}) {
	const { errors } = field.state.meta;
	const message = fieldErrorMessage(errors);
	const fieldId = id ?? field.name;
	return (
		<div className="grid gap-1">
			<Label htmlFor={fieldId}>{label}</Label>
			<Input
				aria-describedby={message ? `${fieldId}-error` : undefined}
				aria-invalid={errors.length > 0}
				autoFocus={autoFocus}
				id={fieldId}
				inputMode={inputMode}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder={placeholder}
				value={field.state.value}
			/>
			{message ? (
				// WS3 remediation R3b, Item 6: a field validation error must be
				// announced, not visual-only. `role="alert"` (an assertive live
				// region) makes a screen reader announce this text the moment it
				// mounts — including when it appears in place after a failed
				// submit, not just on first paint — and it persists in the DOM
				// until the field's own error clears (re-validates clean), so it
				// is never a one-shot toast a user could miss.
				<p
					className="text-destructive text-sm"
					id={`${fieldId}-error`}
					role="alert"
				>
					{message}
				</p>
			) : null}
		</div>
	);
}

/** A money amount entered as a decimal major-unit string ("12.50") and
 * validated with `parseMoneyInputToMinor` — money never round-trips through
 * binary floating point (CLAUDE.md §7). */
export function PosMoneyField({
	field,
	id,
	label,
}: {
	field: TextFieldAdapter;
	/** See {@link PosTextField}'s `id` doc — same duplicate-DOM-id hazard. */
	id?: string;
	label: string;
}) {
	const { errors } = field.state.meta;
	const message = fieldErrorMessage(errors);
	const parsed = parseMoneyInputToMinor(field.state.value || "0");
	const fieldId = id ?? field.name;
	return (
		<div className="grid gap-1">
			<Label htmlFor={fieldId}>{label}</Label>
			<Input
				aria-describedby={message ? `${fieldId}-error` : undefined}
				aria-invalid={errors.length > 0 || parsed === null}
				id={fieldId}
				inputMode="decimal"
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				placeholder="0.00"
				value={field.state.value}
			/>
			{message ? (
				<p
					className="text-destructive text-sm"
					id={`${fieldId}-error`}
					role="alert"
				>
					{message}
				</p>
			) : null}
		</div>
	);
}

export function PosSectionCard({
	children,
	description,
	title,
}: {
	children: React.ReactNode;
	description?: string;
	title: string;
}) {
	return (
		<section className="grid gap-4 rounded-2xl border p-5">
			<div>
				<h2 className="font-medium">{title}</h2>
				{description ? (
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

export function CopyableId({ id, label }: { id: string; label: string }) {
	return (
		<p className="rounded-xl border bg-muted/40 p-3 text-sm">
			<span className="font-medium">{label}:</span>{" "}
			<span className="break-all font-mono">{id}</span>
			<br />
			<span className="text-muted-foreground text-xs">
				Share this ID with the second authorized identity who will complete the
				approval step; no pending-approvals list is available in this contract
				surface.
			</span>
		</p>
	);
}

export function PosCrossLink({
	description,
	href,
	label,
}: {
	description: string;
	href: Route;
	label: string;
}) {
	return (
		<Link className="block rounded-xl border p-4 hover:bg-muted" href={href}>
			<p className="font-medium">{label}</p>
			<p className="text-muted-foreground text-sm">{description}</p>
		</Link>
	);
}
