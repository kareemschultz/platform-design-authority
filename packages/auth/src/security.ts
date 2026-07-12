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
