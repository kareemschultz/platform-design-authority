function withoutTrailingSlash(value: string): string {
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveApiBase(options: {
	browserOrigin?: string;
	configuredUrl: string;
	internalUrl?: string;
}): string {
	if (options.browserOrigin) {
		return withoutTrailingSlash(options.browserOrigin);
	}
	return withoutTrailingSlash(options.internalUrl ?? options.configuredUrl);
}
