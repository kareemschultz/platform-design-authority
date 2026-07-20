import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@meridian/ui-web/components/card";
import { ChartNoAxesColumnIncreasingIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface MetricEmptyStateProps {
	helperText?: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	message: string;
	value: string | number;
}

function MetricEmptyState({
	label,
	value,
	message,
	helperText,
	icon: Icon = ChartNoAxesColumnIncreasingIcon,
}: MetricEmptyStateProps) {
	return (
		<Card className="w-full max-w-lg">
			<CardHeader className="gap-0">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-3xl">{value}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border border-dashed p-6 text-center">
					<Icon className="mx-auto size-12 text-muted-foreground" />
					<p className="mt-2 font-medium text-sm">{message}</p>
					{helperText ? (
						<p className="mt-1 text-muted-foreground text-sm">{helperText}</p>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

export { MetricEmptyState };
