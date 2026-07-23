"use client";

import { cn } from "@meridian/ui-web/lib/utils";
import type * as React from "react";
import { createContext, useContext } from "react";

/**
 * Row density per DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md's Density section
 * and the matching registry-backed dimension tokens in
 * registry/design-tokens.json (`size.row-comfortable`, `size.row-compact`):
 * comfortable is 44px (`row-comfortable`), compact is 34px (`row-compact`
 * exactly, not a value picked independently within the doc's 32-36px prose
 * range), touch is the 52px POS row figure the Density section states
 * under Comfortable. No `size.row-touch` registry token exists yet — 52px
 * is taken directly from the doc's own POS-row prose rather than the
 * more generic 48px `size.target-pos` touch-target minimum, since a row
 * height and a minimum tap-target size are different things and the doc
 * gives a specific row figure. TableHead and TableCell use the same fixed
 * height per tier (not independent padding-derived heights) so head and
 * body rows cannot drift apart within one density. Threaded via context
 * (not a className prop on each cell) so TableHead/TableCell can react to
 * the density chosen on the enclosing Table without every call site
 * repeating density-specific classes. RR-004 (no design-token-to-CSS
 * generation pipeline exists yet) means these are literal pixel values
 * copied from the token source, not a live binding to it — recheck this
 * comment against the registry if either changes.
 */
type TableDensity = "comfortable" | "compact" | "touch";

const TableDensityContext = createContext<TableDensity>("comfortable");

function useTableDensity() {
	return useContext(TableDensityContext);
}

function Table({
	className,
	density = "comfortable",
	...props
}: React.ComponentProps<"table"> & { density?: TableDensity }) {
	return (
		<TableDensityContext.Provider value={density}>
			<div
				className="relative w-full overflow-x-auto"
				data-slot="table-container"
			>
				<table
					className={cn("w-full caption-bottom text-sm", className)}
					data-slot="table"
					{...props}
				/>
			</div>
		</TableDensityContext.Provider>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			className={cn("[&_tr]:border-b", className)}
			data-slot="table-header"
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			className={cn("[&_tr:last-child]:border-0", className)}
			data-slot="table-body"
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			className={cn(
				"border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
				className
			)}
			data-slot="table-footer"
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			className={cn(
				"border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
				className
			)}
			data-slot="table-row"
			{...props}
		/>
	);
}

/**
 * rem, not px: matches the existing `--density-compact-control` /
 * `--density-comfortable-control` / `--density-touch-control` tokens in
 * globals.css and lets row height grow with text-only font-size scaling
 * instead of clipping content against a pinned pixel height (a real
 * accessibility-review finding on this change — a px height stays fixed
 * while rem-based text grows under OS/browser text-size settings that
 * aren't full-page zoom).
 */
const tableRowDensityClass: Record<TableDensity, string> = {
	comfortable: "h-11",
	compact: "h-[2.125rem]",
	touch: "h-[3.25rem]",
};

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	const density = useTableDensity();
	return (
		<th
			className={cn(
				tableRowDensityClass[density],
				"whitespace-nowrap px-2 text-start align-middle font-medium text-foreground [&:has([role=checkbox])]:pe-0",
				className
			)}
			data-slot="table-head"
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	const density = useTableDensity();
	return (
		<td
			className={cn(
				tableRowDensityClass[density],
				"whitespace-nowrap px-2 align-middle [&:has([role=checkbox])]:pe-0",
				className
			)}
			data-slot="table-cell"
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			className={cn("mt-4 text-muted-foreground text-sm", className)}
			data-slot="table-caption"
			{...props}
		/>
	);
}

export type { TableDensity };
export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
};
