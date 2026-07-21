import { Badge } from "@meridian/ui-web/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
} from "@meridian/ui-web/components/card";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import { cn } from "@meridian/ui-web/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/**
 * Compact KPI card following the governed compact-KPI anatomy in
 * DASHBOARD_AND_DATA_VISUALIZATION.md: label, preformatted value, governed
 * time window, textual delta (direction stated in words, never color alone),
 * freshness, and explicit stale/unavailable language instead of a misleading
 * zero. Empty metrics use MetricEmptyState, not this component.
 *
 * `trend` is the arrow direction (a fact); `tone` is the interpretation
 * (whether the movement is good, bad, or neutral). They are deliberately
 * separate: a falling defect count trends down with a positive tone.
 * Value formatting, currency, and units are the caller's responsibility —
 * no money or quantity logic lives in UI.
 */
export interface MetricCardProps {
	changeText?: string;
	className?: string;
	errorText?: string;
	freshnessText?: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	loading?: boolean;
	periodText: string;
	stale?: boolean;
	tone?: "negative" | "neutral" | "positive";
	trend?: "down" | "flat" | "up";
	value: string | number;
}

const toneTextClass = {
	negative: "text-status-critical",
	neutral: "text-muted-foreground",
	positive: "text-status-success",
} as const;

const trendIcon = {
	down: ChevronDownIcon,
	flat: MinusIcon,
	up: ChevronUpIcon,
} as const;

const trendLabel = {
	down: "decrease",
	flat: "no change",
	up: "increase",
} as const;

function MetricCardValue({
	errorText,
	label,
	loading,
	stale,
	value,
}: Pick<
	MetricCardProps,
	"errorText" | "label" | "loading" | "stale" | "value"
>) {
	if (loading) {
		return (
			<>
				<Skeleton className="h-7 w-24 rounded-md" />
				<span className="sr-only">Loading {label}</span>
			</>
		);
	}
	if (errorText) {
		return (
			<p className="text-sm text-status-critical" role="status">
				{errorText}
			</p>
		);
	}
	return (
		<p className="flex items-baseline gap-2">
			<span className="font-semibold text-2xl">{value}</span>
			{stale ? (
				<span className="text-status-warning text-xs" role="status">
					Stale
				</span>
			) : null}
		</p>
	);
}

function MetricCard({
	changeText,
	className,
	errorText,
	freshnessText,
	icon: Icon,
	label,
	loading = false,
	periodText,
	stale = false,
	tone = "neutral",
	trend,
	value,
}: MetricCardProps) {
	const TrendIcon = trend ? trendIcon[trend] : null;
	const showChange = Boolean(changeText) && !loading && !errorText;

	return (
		<Card aria-busy={loading} className={cn("w-full gap-4", className)}>
			<CardHeader className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{Icon ? (
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
							<Icon aria-hidden="true" className="size-4" />
						</span>
					) : null}
					<span className="text-muted-foreground text-sm">{label}</span>
				</div>
				{showChange ? (
					<p
						className={cn(
							"flex items-center gap-1 text-sm",
							toneTextClass[tone]
						)}
					>
						{TrendIcon ? (
							<TrendIcon aria-hidden="true" className="size-4" />
						) : null}
						<span>{changeText}</span>
						{trend ? (
							<span className="sr-only">({trendLabel[trend]})</span>
						) : null}
					</p>
				) : null}
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<MetricCardValue
					errorText={errorText}
					label={label}
					loading={loading}
					stale={stale}
					value={value}
				/>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{periodText}</Badge>
					{freshnessText ? (
						<span className="text-muted-foreground text-xs">
							{freshnessText}
						</span>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

export { MetricCard };
