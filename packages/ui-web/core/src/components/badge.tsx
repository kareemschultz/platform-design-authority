import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@meridian/ui-web/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
	"group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-2xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-start]:ps-1.5 has-data-[icon=inline-end]:pe-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
	{
		defaultVariants: {
			variant: "default",
		},
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				destructive:
					"bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
				ghost:
					"hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				info: "bg-status-info/10 text-status-info focus-visible:ring-status-info/20 dark:bg-status-info/20 dark:focus-visible:ring-status-info/40 [a]:hover:bg-status-info/20",
				link: "text-primary underline-offset-4 hover:underline",
				offline:
					"bg-status-offline/10 text-status-offline focus-visible:ring-status-offline/20 dark:bg-status-offline/20 dark:focus-visible:ring-status-offline/40 [a]:hover:bg-status-offline/20",
				outline:
					"border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				pending:
					"bg-status-pending/10 text-status-pending focus-visible:ring-status-pending/20 dark:bg-status-pending/20 dark:focus-visible:ring-status-pending/40 [a]:hover:bg-status-pending/20",
				secondary:
					"bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				success:
					"bg-status-success/10 text-status-success focus-visible:ring-status-success/20 dark:bg-status-success/20 dark:focus-visible:ring-status-success/40 [a]:hover:bg-status-success/20",
				// Border carries the warning color; text stays neutral rather
				// than using --status-warning-foreground (issue 209) -- this
				// treatment already shipped verified-accessible and there's no
				// need to add colored text here. Border only needs 3:1 (passes
				// at 4.92:1); --status-warning itself still fails 4.5:1 once
				// tinted (verified: 4.32:1 if this variant used the same
				// bg-status-warning/10 tinted background as the success/info/
				// pending/offline variants above -- which is exactly why
				// warning alone dropped that tint in favor of a neutral-text,
				// border-only treatment, and why the separate -foreground
				// role exists for consumers that do need colored warning
				// text (see metric-card.tsx).
				warning:
					"border-status-warning text-foreground focus-visible:ring-status-warning/20 dark:focus-visible:ring-status-warning/40 [a]:hover:bg-muted [a]:hover:text-muted-foreground",
			},
		},
	}
);

function Badge({
	className,
	variant = "default",
	render,
	...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ variant }), className),
			},
			props
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	});
}

export { Badge, badgeVariants };
