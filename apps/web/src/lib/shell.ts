export const ACTIVE_CONTEXT_STORAGE_KEY = "platform.active-context-id";

export const ADMINISTRATION_NAVIGATION = [
	{ href: "/administration", label: "Overview" },
	{ href: "/administration/users", label: "Users" },
	{ href: "/administration/roles", label: "Roles" },
	{ href: "/administration/entitlements", label: "Entitlements" },
	{ href: "/administration/sessions", label: "Sessions" },
	{ href: "/administration/audit", label: "Audit" },
] as const;

export const OPERATIONS_NAVIGATION = [
	{ href: "/operations", label: "Overview" },
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

export function isNavigationCurrent(pathname: string, href: string): boolean {
	return href === "/administration" || href === "/operations" || href === "/"
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);
}
