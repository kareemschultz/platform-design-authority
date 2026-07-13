import {
	auth,
	closeDb,
	isBlockedNativeAuthHttpRoute,
} from "@meridian/platform-identity";

import type { IdentitySessionService } from "../src/context";

export const identitySessionService: IdentitySessionService = {
	getSession: ({ headers }) => auth.api.getSession({ headers }),
};

export const identityHttpHandler = (request: Request): Promise<Response> => {
	if (isBlockedNativeAuthHttpRoute(request)) {
		return Promise.resolve(new Response(null, { status: 404 }));
	}

	return auth.handler(request);
};

export async function closeIdentityComposition(): Promise<void> {
	await closeDb();
}
