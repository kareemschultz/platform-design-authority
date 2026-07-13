import { createIdentityPersistence } from "@meridian/persistence-platform-identity-postgres";
import {
	createIdentityAuth,
	isBlockedNativeAuthHttpRoute,
} from "@meridian/platform-identity";
import { env } from "@meridian/tooling-env/server";

import type { IdentitySessionService } from "../src/context";
import { databasePool } from "./postgres";

const auth = createIdentityAuth({
	authUrl: env.BETTER_AUTH_URL,
	corsOrigin: env.CORS_ORIGIN,
	nodeEnv: env.NODE_ENV,
	persistence: createIdentityPersistence(databasePool),
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
});

export const identitySessionService: IdentitySessionService = {
	getSession: ({ headers }) => auth.api.getSession({ headers }),
};

export const identityHttpHandler = (request: Request): Promise<Response> => {
	if (isBlockedNativeAuthHttpRoute(request)) {
		return Promise.resolve(new Response(null, { status: 404 }));
	}

	return auth.handler(request);
};
