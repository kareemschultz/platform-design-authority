import { expo } from "@better-auth/expo";
import { createDb } from "@meridian/db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth's Drizzle adapter expects a schema object namespace.
import * as schema from "@meridian/db/schema/auth";
import { env } from "@meridian/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getTrustedOrigins } from "./security";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "lax",
				secure: true,
			},
		},
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(db, {
			provider: "pg",

			schema,
		}),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [expo()],
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: getTrustedOrigins({
			authUrl: env.BETTER_AUTH_URL,
			configuredOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
			corsOrigin: env.CORS_ORIGIN,
			nodeEnv: env.NODE_ENV,
		}),
	});
}

export const auth = createAuth();
