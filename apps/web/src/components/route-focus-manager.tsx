"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function focusMainContent(
	documentTarget: Pick<Document, "getElementById">
) {
	const main = documentTarget.getElementById("main-content");
	main?.focus();
}

export function shouldMoveFocus(
	previousPathname: string | null,
	nextPathname: string
) {
	return previousPathname !== null && previousPathname !== nextPathname;
}

export function RouteFocusManager() {
	const pathname = usePathname();
	const previousPathname = useRef<string | null>(null);

	useEffect(() => {
		if (shouldMoveFocus(previousPathname.current, pathname)) {
			focusMainContent(document);
		}
		previousPathname.current = pathname;
	}, [pathname]);

	return null;
}
