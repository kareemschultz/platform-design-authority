import { env } from "@meridian/tooling-env/web";
import { createAuthClient } from "better-auth/react";

import { resolveApiBase } from "./api-base";

export const authClient = createAuthClient({
	// better-auth derives its route-matching base from this URL's path, so the
	// public auth path must equal the server-side mount (/api/auth everywhere)
	baseURL: new URL(
		"/api/auth",
		resolveApiBase({
			browserOrigin:
				typeof window === "undefined" ? undefined : window.location.origin,
			configuredUrl: env.NEXT_PUBLIC_SERVER_URL,
			internalUrl:
				typeof window === "undefined"
					? env.PLATFORM_API_INTERNAL_URL
					: undefined,
		})
	).toString(),
});
