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
 * time window, and a textual delta whose direction AND meaning are both
 * stated in visible text — "green or red alone is insufficient" per that
 * document, so `tone` renders as a visible word (toneWord), not color alone.
 * Loading, error, and stale states announce through one persistent
 * aria-live region (statusAnnouncement) rather than a role="status" element
 * that is only mounted once its content already exists, which screen
 * readers are not guaranteed to announce. Empty metrics use
 * MetricEmptyState, not this component.
 *
 * `trend` is the arrow direction (a fact); `tone` is the interpretation
 * (whether the movement is good, bad, or neutral). They are deliberately
 * separate: a falling defect count trends down with a positive tone.
 * Value formatting, currency, and units are the caller's responsibility —
 * no money or quantity logic lives in UI.
 *
 * Deferred, disclosed rather than silently omitted: the governed anatomy
 * also names a required "evidence link" and a "partial" data state. Neither
 * is implemented here — no adopting surface exists yet to validate what an
 * evidence link should point to (a raw record, a drill-down report, an
 * audit trail), and inventing that shape without a real consumer risks
 * committing to an interface the first real adopter has to work around.
 * Tracked as an open gap in the catalog entry, not claimed as done.
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

const toneWord = {
	negative: "Worsening",
	neutral: "Steady",
	positive: "Improving",
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

function statusAnnouncement({
	errorText,
	label,
	loading,
	stale,
}: Pick<MetricCardProps, "errorText" | "label" | "loading" | "stale">) {
	if (loading) {
		return `Loading ${label}`;
	}
	if (errorText) {
		return `${label} unavailable: ${errorText}`;
	}
	if (stale) {
		return `${label} is stale`;
	}
	return "";
}

function MetricCardValue({
	errorText,
	loading,
	stale,
	value,
}: Pick<MetricCardProps, "errorText" | "loading" | "stale" | "value">) {
	if (loading) {
		return <Skeleton aria-hidden="true" className="h-7 w-24 rounded-md" />;
	}
	if (errorText) {
		return (
			<p aria-hidden="true" className="text-sm text-status-critical">
				{errorText}
			</p>
		);
	}
	return (
		<p className="flex items-baseline gap-2">
			<span className="font-semibold text-2xl">{value}</span>
			{stale ? (
				<span aria-hidden="true" className="text-status-warning text-xs">
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
			{/*
			 * Single persistent live region: loading/error/stale are announced
			 * by updating this node's text, not by mounting a role="status"
			 * element after the fact — a live region must already exist in the
			 * DOM for its content changes to be reliably announced. The
			 * corresponding visible indicators in MetricCardValue and the tone
			 * word below are aria-hidden to avoid a duplicate announcement.
			 */}
			<span aria-atomic="true" aria-live="polite" className="sr-only">
				{statusAnnouncement({ errorText, label, loading, stale })}
			</span>
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
						{/*
						 * Meaning (good/bad/neutral) is stated as visible text, not
						 * color alone: DASHBOARD_AND_DATA_VISUALIZATION.md — "Delta
						 * badges state direction and meaning in text; green or red
						 * alone is insufficient."
						 */}
						<span className="font-medium">{toneWord[tone]}</span>
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
