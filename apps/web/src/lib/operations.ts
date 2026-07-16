import type { Route } from "next";

const DOWNLOAD_NAME_UNSAFE_PATTERN = /[^A-Za-z0-9._-]/g;
const OPERATIONS_PATH_PATTERN = /^\/operations(?:\/[A-Za-z0-9._~%-]+)*\/?$/u;
const SAFE_OPERATIONS_QUERY_KEYS = new Set([
	"barcode",
	"cursor",
	"cursorTrail",
	"findingsCursor",
	"locationId",
	"productId",
	"query",
	"reason",
	"returnTo",
	"sku",
	"state",
	"target",
	"variantId",
	"view",
]);

export type FreshnessState = "current" | "stale" | "unreconciled";
export type MutationFailureKind =
	| "approval-required"
	| "conflict"
	| "domain"
	| "entitlement"
	| "network"
	| "permission"
	| "reauthenticate"
	| "step-up"
	| "unavailable"
	| "validation";

export interface MutationFailurePresentation {
	correlationId?: string;
	description: string;
	kind: MutationFailureKind;
	title: string;
}

export interface OperationsScope {
	contextId: string;
	locationId: string | null;
	organizationId: string;
	tenantId: string;
}

export function operationsHref(
	pathname: string,
	current: URLSearchParams,
	updates: Record<string, string | null | undefined>
): Route {
	const next = new URLSearchParams(current);
	for (const [key, value] of Object.entries(updates)) {
		if (value) {
			next.set(key, value);
		} else {
			next.delete(key);
		}
	}
	const query = next.toString();
	return (query ? `${pathname}?${query}` : pathname) as Route;
}

export function freshnessState(
	asOf: string,
	reconciled: boolean | undefined,
	now = Date.now(),
	staleAfterMs = 5000
): FreshnessState {
	if (reconciled === false) {
		return "unreconciled";
	}
	const timestamp = Date.parse(asOf);
	if (!Number.isFinite(timestamp) || now - timestamp > staleAfterMs) {
		return "stale";
	}
	return "current";
}

export function operationsScopeKey(scope: OperationsScope): readonly string[] {
	return [
		"operations-scope",
		scope.tenantId,
		scope.organizationId,
		scope.locationId ?? "all-locations",
		scope.contextId,
	];
}

const CURSOR_TRAIL_LIMIT = 20;
const CURSOR_VALUE_LIMIT = 512;

export function parseCursorTrail(value: string | null): string[] {
	if (!value || value.length > 12_000) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(value);
		if (
			!Array.isArray(parsed) ||
			parsed.length > CURSOR_TRAIL_LIMIT ||
			parsed.some(
				(item) => typeof item !== "string" || item.length > CURSOR_VALUE_LIMIT
			)
		) {
			return [];
		}
		return parsed;
	} catch {
		return [];
	}
}

export function appendCursorTrail(
	trail: string[],
	currentCursor: string | null
): string {
	return JSON.stringify(
		[...trail, currentCursor ?? ""].slice(-CURSOR_TRAIL_LIMIT)
	);
}

export function previousCursorState(trail: string[]): {
	cursor: string | null;
	cursorTrail: string | null;
} | null {
	if (!trail.length) {
		return null;
	}
	const previous = trail.at(-1) ?? "";
	const remaining = trail.slice(0, -1);
	return {
		cursor: previous || null,
		cursorTrail: remaining.length ? JSON.stringify(remaining) : null,
	};
}

interface ProblemLike {
	code?: string;
	correlationId?: string;
	detail?: string | null;
	nextAction?: string | null;
	retryable?: boolean;
	status?: number;
}

function problemFrom(error: unknown): {
	code?: string;
	data: ProblemLike;
} {
	if (!error || typeof error !== "object") {
		return { data: {} };
	}
	const candidate = error as { code?: string; data?: ProblemLike };
	return { code: candidate.code, data: candidate.data ?? {} };
}

function domainFailureFrom(code: string | undefined): {
	description: string;
	title: string;
} | null {
	if (code === "provider_uncertainty") {
		return {
			description:
				"Do not repeat the action until the current server outcome has been reviewed.",
			title: "Outcome requires review",
		};
	}
	if (code === "state_transition") {
		return {
			description:
				"Refresh the record and use an action available for its current business state.",
			title: "Change is not valid in the current state",
		};
	}
	return null;
}

export function mutationFailurePresentation(
	error: unknown,
	isOnline = true
): MutationFailurePresentation | null {
	if (!error) {
		return null;
	}
	const { code, data } = problemFrom(error);
	const correlationId =
		typeof data.correlationId === "string" &&
		data.correlationId.length >= 12 &&
		data.correlationId.length <= 128
			? data.correlationId
			: undefined;
	const result = (
		kind: MutationFailureKind,
		title: string,
		description: string
	): MutationFailurePresentation => ({
		correlationId,
		description,
		kind,
		title,
	});
	if (!isOnline || error instanceof TypeError) {
		return result(
			"network",
			"Connection required",
			"Reconnect, confirm the current record state, then retry the same intended change."
		);
	}
	if (code === "UNAUTHORIZED" || data.nextAction === "reauthenticate") {
		return result(
			"reauthenticate",
			"Sign in again",
			"Your session is no longer sufficient for this change. Sign in again before retrying."
		);
	}
	if (data.nextAction === "step_up") {
		return result(
			"step-up",
			"Additional verification required",
			"Complete the required stronger authentication factor, then review the change again."
		);
	}
	if (data.nextAction === "request_approval") {
		return result(
			"approval-required",
			"Approval required",
			"This change requires a separate authorized approval before it can continue."
		);
	}
	if (data.code === "entitlement") {
		return result(
			"entitlement",
			"Capability unavailable",
			"This organization is not currently provisioned for the requested capability."
		);
	}
	if (code === "FORBIDDEN" || data.code === "authorization") {
		return result(
			"permission",
			"Permission denied",
			"Your current role or scope does not permit this change. No change was applied."
		);
	}
	const domainFailure = domainFailureFrom(data.code);
	if (domainFailure) {
		return result("domain", domainFailure.title, domainFailure.description);
	}
	if (code === "CONFLICT" || data.code === "conflict" || data.status === 409) {
		return result(
			"conflict",
			"Record changed",
			"Refresh the authoritative record, compare the new version, and decide again."
		);
	}
	if (data.code === "validation") {
		return result(
			"validation",
			"Change needs correction",
			"One or more values were rejected. Review the entered values and the field guidance before retrying."
		);
	}
	return result(
		"unavailable",
		"Change was not applied",
		data.retryable
			? "The service could not complete the change. Retry the same intended action after checking the current record."
			: "The service could not complete the change. Review the current record or contact support before retrying."
	);
}

export interface StableIntentKey {
	key: string;
	signature: string;
}

/**
 * Retains an idempotency key while the canonical command intent is unchanged.
 * A caller clears the returned state only after an authoritative success. An
 * uncertain failure therefore retries the same command with the same key,
 * while any material input change produces a new key before submission.
 */
export function stableIntentKey(
	current: StableIntentKey | null,
	signature: string,
	create: () => string
): StableIntentKey {
	return current?.signature === signature
		? current
		: { key: create(), signature };
}

export function isVersionConflict(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	const candidate = error as {
		code?: string;
		data?: { code?: string; status?: number };
	};
	return (
		candidate.code === "CONFLICT" ||
		candidate.data?.code === "conflict" ||
		candidate.data?.status === 409
	);
}

export function safeDownloadName(value: string): string {
	const normalized = value.replaceAll(DOWNLOAD_NAME_UNSAFE_PATTERN, "-");
	return normalized.slice(0, 120) || "correction-report.csv";
}

export function safeOperationsReturn(
	value: string | null | undefined,
	fallback: Route = "/operations"
): Route {
	if (
		!value ||
		value.includes("\\") ||
		[...value].some((character) => {
			const code = character.codePointAt(0) ?? 0;
			return code < 32 || code === 127;
		})
	) {
		return fallback;
	}
	let parsed: URL;
	try {
		parsed = new URL(value, "https://internal.invalid");
	} catch {
		return fallback;
	}
	if (
		parsed.origin !== "https://internal.invalid" ||
		parsed.hash ||
		!OPERATIONS_PATH_PATTERN.test(parsed.pathname) ||
		[...parsed.searchParams.keys()].some(
			(key) => !SAFE_OPERATIONS_QUERY_KEYS.has(key)
		)
	) {
		return fallback;
	}
	return `${parsed.pathname}${parsed.search}` as Route;
}
