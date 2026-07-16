import type { Route } from "next";

export type FreshnessState = "current" | "stale" | "unreconciled";

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
	const normalized = value.replaceAll(/[^A-Za-z0-9._-]/g, "-");
	return normalized.slice(0, 120) || "correction-report.csv";
}

export function safeOperationsReturn(
	value: string | null | undefined,
	fallback: Route = "/operations"
): Route {
	if (!value?.startsWith("/operations") || value.startsWith("//")) {
		return fallback;
	}
	return value as Route;
}
