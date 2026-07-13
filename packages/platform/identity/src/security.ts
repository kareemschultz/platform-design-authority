export function toExactOrigin(value: string): string {
	const parsed = new URL(value);

	if (
		parsed.origin !== value ||
		parsed.pathname !== "/" ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(`Expected an exact origin, received ${value}`);
	}

	return parsed.origin;
}

export function validateRedirectPath(value: string): string {
	if (!value.startsWith("/") || value.startsWith("//")) {
		throw new Error("Redirects must be same-origin paths");
	}

	const parsed = new URL(value, "https://meridian.invalid");
	if (parsed.origin !== "https://meridian.invalid") {
		throw new Error("Redirects must not include an external origin");
	}

	return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function getCookieAttributes(
	nodeEnv: "development" | "production" | "test"
) {
	return {
		httpOnly: true,
		sameSite: "lax" as const,
		secure: nodeEnv === "production",
	};
}

export function getTrustedOrigins(options: {
	authUrl: string;
	corsOrigin: string;
	configuredOrigins: readonly string[];
	nodeEnv: "development" | "production" | "test";
}): string[] {
	const origins = new Set<string>();
	origins.add(toExactOrigin(new URL(options.authUrl).origin));
	origins.add(toExactOrigin(new URL(options.corsOrigin).origin));

	for (const origin of options.configuredOrigins) {
		origins.add(toExactOrigin(origin));
	}

	if (options.nodeEnv === "production") {
		for (const origin of origins) {
			const parsed = new URL(origin);
			if (parsed.protocol !== "https:") {
				throw new Error(`Production trusted origins must use https: ${origin}`);
			}
		}
	}

	return [...origins].sort();
}

const BLOCKED_ORGANIZATION_PATHS = new Set([
	"/organization/accept-invitation",
	"/organization/cancel-invitation",
	"/organization/create",
	"/organization/delete",
	"/organization/invite-member",
	"/organization/leave",
	"/organization/reject-invitation",
	"/organization/remove-member",
	"/organization/set-active",
	"/organization/update",
	"/organization/update-member-role",
]);

function authRelativePath(pathname: string): string {
	const mountPath = "/api/auth";
	const mountIndex = pathname.indexOf(mountPath);
	return mountIndex === -1
		? pathname
		: pathname.slice(mountIndex + mountPath.length) || "/";
}

/**
 * Deny native HTTP authority-changing routes that WS1 exposes only through
 * governed platform application contracts. Server-side Better Auth APIs stay
 * available to composition-owned adapters; this guard controls the public
 * mounted handler only.
 */
export function isBlockedNativeAuthHttpRoute(request: Request): boolean {
	const relativePath = authRelativePath(new URL(request.url).pathname);
	if (relativePath === "/admin" || relativePath.startsWith("/admin/")) {
		return true;
	}

	return BLOCKED_ORGANIZATION_PATHS.has(relativePath);
}
