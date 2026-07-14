import { createHash, randomUUID } from "node:crypto";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import {
	createIdentityPersistence,
	createIdentitySessionRepository,
} from "@meridian/persistence-platform-identity-postgres";
import {
	createIdentityAuth,
	createIdentitySessionApplication,
	isBlockedNativeAuthHttpRoute,
} from "@meridian/platform-identity";
import { env } from "@meridian/tooling-env/server";

import type { IdentitySessionService } from "../src/context";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const auth = createIdentityAuth({
	authUrl: env.BETTER_AUTH_URL,
	corsOrigin: env.CORS_ORIGIN,
	displayName: env.IDENTITY_DISPLAY_NAME,
	nodeEnv: env.NODE_ENV,
	persistence: createIdentityPersistence(databasePool),
	secret: env.BETTER_AUTH_SECRET,
	sendTwoFactorOtp: () =>
		Promise.reject(new Error("Two-factor OTP delivery is not configured")),
	trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
});

export const identitySessionService: IdentitySessionService = {
	getSession: ({ headers }) => auth.api.getSession({ headers }),
};

const sessionRepository = createIdentitySessionRepository(databasePool);

export const identitySessionApplication = createIdentitySessionApplication({
	clock: () => new Date(),
	fingerprint: (value) =>
		Promise.resolve(createHash("sha256").update(value).digest("hex")),
	ids: { create: () => `event_session_${randomUUID()}` },
	repository: sessionRepository,
	unitOfWork: createPostgresUnitOfWork(databasePool, (client) => ({
		events: createPostgresOutbox(client),
		repository: createIdentitySessionRepository(client),
	})),
});

export const identitySessionTransportApplication = {
	listCurrentUserSessions: identitySessionApplication.list,
	revokeCurrentUserSession: identitySessionApplication.revoke,
};

export const identityHttpHandler = (request: Request): Promise<Response> => {
	if (isBlockedNativeAuthHttpRoute(request)) {
		return Promise.resolve(new Response(null, { status: 404 }));
	}

	return auth.handler(request);
};
