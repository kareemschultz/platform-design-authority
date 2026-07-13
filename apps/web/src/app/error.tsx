"use client";

import { Button } from "@meridian/ui-web/components/button";
import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Prototype-only diagnostics; production error reporting is not wired yet.
		console.error(error);
	}, [error]);

	return (
		<div className="container mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
			<h1 className="font-heading font-semibold text-2xl">
				Something went wrong
			</h1>
			<p className="text-muted-foreground text-sm">
				An unexpected error occurred while rendering this page.
				{error.digest ? ` Reference: ${error.digest}` : null}
			</p>
			<Button onClick={() => reset()} variant="outline">
				Try again
			</Button>
		</div>
	);
}
