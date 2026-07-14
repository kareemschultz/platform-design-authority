"use client";

export function SkipLink() {
	return (
		<button
			className="sr-only z-50 rounded-md bg-background px-3 py-2 text-foreground ring-1 ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
			onClick={() => document.getElementById("main-content")?.focus()}
			type="button"
		>
			Skip to main content
		</button>
	);
}
