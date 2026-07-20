"use client";

export function SkipLink() {
	return (
		<a
			className="sr-only z-50 rounded-md bg-background px-3 py-2 text-foreground ring-1 ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
			href="#main-content"
		>
			Skip to main content
		</a>
	);
}
