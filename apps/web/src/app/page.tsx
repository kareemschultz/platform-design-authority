"use client";
import { Button } from "@meridian/ui-web/components/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { orpc } from "@/utils/orpc";

function getStatusText(isLoading: boolean, isConnected: boolean): string {
	if (isLoading) {
		return "Checking...";
	}
	return isConnected ? "Connected" : "Disconnected";
}

export default function Home() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	const isConnected = Boolean(healthCheck.data);
	const statusText = getStatusText(healthCheck.isLoading, isConnected);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<h1 className="font-heading font-semibold text-2xl">
				Controlled Prototype
			</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Internal controlled prototype for the first identity, tenancy, Party,
				authorization, entitlement, session, and audit slice.
			</p>
			<div className="mt-6 grid gap-6">
				<section
					aria-labelledby="api-status-heading"
					className="rounded-lg border p-4"
				>
					<h2 className="mb-2 font-medium" id="api-status-heading">
						API Status
					</h2>
					<div className="flex items-center gap-2">
						<div
							aria-hidden="true"
							className={`h-2 w-2 rounded-full ${isConnected ? "bg-status-success" : "bg-status-critical"}`}
						/>
						<span className="text-muted-foreground text-sm" role="status">
							{statusText}
						</span>
					</div>
				</section>
			</div>
			<div className="mt-6 flex flex-wrap gap-3">
				<Button className="min-h-10" render={<Link href="/administration" />}>
					Open administration
				</Button>
				<Button
					className="min-h-10"
					render={<Link href="/login" />}
					variant="outline"
				>
					Sign in
				</Button>
			</div>
		</div>
	);
}
