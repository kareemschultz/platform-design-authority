import { cn } from "@meridian/ui-web/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const alertVariants = cva(
	"group/alert relative grid w-full gap-0.5 rounded-2xl border px-4 py-3 text-start text-sm has-data-[slot=alert-action]:relative has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 has-data-[slot=alert-action]:pe-18 *:[svg:not([class*='size-'])]:size-4 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current",
	{
		defaultVariants: {
			variant: "default",
		},
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive:
					"bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
				info: "bg-card text-status-info *:data-[slot=alert-description]:text-status-info *:[svg]:text-current",
				offline:
					"bg-card text-status-offline *:data-[slot=alert-description]:text-status-offline *:[svg]:text-current",
				pending:
					"bg-card text-status-pending *:data-[slot=alert-description]:text-status-pending *:[svg]:text-current",
				success:
					"bg-card text-status-success *:data-[slot=alert-description]:text-status-success *:[svg]:text-current",
				// Border + icon carry the warning color; title/description stay
				// neutral rather than using --status-warning-foreground (issue
				// 209) -- this treatment already shipped verified-accessible
				// and there's no need to add colored text here. Border only
				// needs 3:1 (passes at 4.92:1); --status-warning itself still
				// fails 4.5:1 once tinted/blended, which is exactly why the
				// separate -foreground role exists for consumers that do need
				// colored warning text (see metric-card.tsx).
				warning:
					"border-status-warning bg-card text-card-foreground *:[svg]:text-status-warning",
			},
		},
	}
);

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			className={cn(alertVariants({ variant }), className)}
			data-slot="alert"
			role="alert"
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
				className
			)}
			data-slot="alert-title"
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"text-balance text-muted-foreground text-sm md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
				className
			)}
			data-slot="alert-description"
			{...props}
		/>
	);
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("absolute end-3 top-2.5", className)}
			data-slot="alert-action"
			{...props}
		/>
	);
}

export { Alert, AlertAction, AlertDescription, AlertTitle };
