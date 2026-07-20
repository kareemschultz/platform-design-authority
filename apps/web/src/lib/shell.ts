export const ACTIVE_CONTEXT_STORAGE_KEY = "platform.active-context-id";

export const ADMINISTRATION_NAVIGATION = [
	{ href: "/administration", label: "Overview" },
	{ href: "/administration/users", label: "Users" },
	{ href: "/administration/roles", label: "Roles" },
	{ href: "/administration/entitlements", label: "Entitlements" },
	{ href: "/administration/sessions", label: "Sessions" },
	{ href: "/administration/audit", label: "Audit" },
] as const;

// WS3 remediation R3b, Item 9 (POS workspace/navigation). Before this fix,
// "/operations/pos" was ENTIRELY ABSENT from this list — every POS route
// (registers, sales, receipts, returns, refunds, deposits, exports) had
// no matching entry, so `OperationsNavigation`'s mobile `<select>` (which
// falls back to `OPERATIONS_NAVIGATION[0]`, i.e. "Overview", whenever
// nothing matches) showed the WRONG current section on any POS deep
// route, and the desktop links showed NO current section at all — the
// exact "exactly one correct current item on deep routes" gap this item
// names.
export const OPERATIONS_NAVIGATION = [
	{ href: "/operations", label: "Overview" },
	{ href: "/operations/pos", label: "POS" },
	{ href: "/operations/products", label: "Products" },
	{ href: "/operations/inventory", label: "Inventory" },
	{ href: "/operations/imports", label: "Imports" },
] as const;

export const PRIMARY_NAVIGATION = [
	{ href: "/", label: "Home" },
	{ href: "/operations", label: "Operations" },
	{ href: "/administration", label: "Administration" },
] as const;

const SAFE_RETURN_PATHS = [
	...ADMINISTRATION_NAVIGATION.map((item) => item.href),
	...OPERATIONS_NAVIGATION.map((item) => item.href),
];
export type SafeReturnPath = (typeof SAFE_RETURN_PATHS)[number];

export type ShellFailure =
	| "approval-required"
	| "entitlement-unavailable"
	| "offline"
	| "permission-denied"
	| "reauthenticate"
	| "step-up-required"
	| "unavailable";

interface ErrorShape {
	code?: string;
	data?: { code?: string; nextAction?: string | null };
}

export function classifyShellFailure(
	error: unknown,
	isOnline = true
): ShellFailure {
	if (!isOnline) {
		return "offline";
	}
	if (
		error === null ||
		(!(error instanceof Error) && typeof error !== "object")
	) {
		return "unavailable";
	}
	const candidate = error as ErrorShape;
	if (
		candidate.code === "UNAUTHORIZED" ||
		candidate.data?.nextAction === "reauthenticate"
	) {
		return "reauthenticate";
	}
	if (candidate.data?.nextAction === "step_up") {
		return "step-up-required";
	}
	if (candidate.data?.nextAction === "request_approval") {
		return "approval-required";
	}
	if (candidate.data?.code === "entitlement") {
		return "entitlement-unavailable";
	}
	if (
		candidate.code === "FORBIDDEN" ||
		candidate.data?.code === "authorization"
	) {
		return "permission-denied";
	}
	if (error instanceof TypeError) {
		return "offline";
	}
	return "unavailable";
}

export function safeReturnPath(
	value: string | null | undefined
): SafeReturnPath {
	const match = SAFE_RETURN_PATHS.find((path) => path === value);
	return match ?? "/administration";
}

/** Section-aware failure return target: Operations routes recover into
 * Operations, everything else into Administration (fifth-audit F-H-001). */
export function sectionOverviewPath(
	pathname: string | null | undefined
): SafeReturnPath {
	const isOperationsRoute =
		pathname === "/operations" ||
		(pathname?.startsWith("/operations/") ?? false);
	return safeReturnPath(isOperationsRoute ? "/operations" : "/administration");
}

export function isNavigationCurrent(pathname: string, href: string): boolean {
	return href === "/administration" || href === "/operations" || href === "/"
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * WS3 remediation R3b, Item 9 (POS workspace/navigation — "exactly one
 * correct current item on deep routes").
 *
 * `isNavigationCurrent` is a per-item prefix check: when a navigation
 * list contains NESTED hrefs (e.g. `POS_NAVIGATION`'s "Overview" at
 * `/operations/pos` is a path-prefix of every other POS section —
 * `/operations/pos/sales`, `/operations/pos/returns`, etc.), calling it
 * independently per item lets MULTIPLE items match the same pathname at
 * once (a deep route like `/operations/pos/sales/abc123` matches BOTH
 * "Overview" and "Sales"'s prefix check) — a nav bar that marked every
 * matching link `aria-current="page"` would show more than one "current"
 * item simultaneously, and a `<select>` naively picking the first match
 * could show the wrong one.
 *
 * This resolves EXACTLY ONE current item per navigation list: among all
 * items whose href matches (`isNavigationCurrent`), the one with the
 * LONGEST (most specific) href wins — `/operations/pos/sales` beats
 * `/operations/pos` for a `/operations/pos/sales/abc123` pathname. Falls
 * back to `items[0]` (matching the prior fallback behavior) when nothing
 * matches at all.
 */
export function currentNavigationItem<T extends { href: string }>(
	pathname: string,
	items: readonly T[]
): T {
	const matches = items.filter((item) =>
		isNavigationCurrent(pathname, item.href)
	);
	if (matches.length === 0) {
		return items[0];
	}
	return matches.reduce((longest, candidate) =>
		candidate.href.length > longest.href.length ? candidate : longest
	);
}
