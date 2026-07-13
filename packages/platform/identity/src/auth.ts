import { env } from "@meridian/tooling-env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth's Drizzle adapter expects a schema object namespace.
import * as schema from "./schema/auth";
import { getCookieAttributes, getTrustedOrigins } from "./security";

// Plugin policy (PDA-PLT-028, deny-by-default): only matrix-adopted core
// features are enabled here. Email/password is Adopt. No official, community,
// payment, or managed-infrastructure plugin is enabled. The Expo integration
// remains disabled until its matrix preconditions (secure storage, deep-link
// allowlists, cookie exchange, recovery tests) are evidenced and approved.
export const auth = betterAuth({
	advanced: {
		defaultCookieAttributes: getCookieAttributes(env.NODE_ENV),
	},
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: getTrustedOrigins({
		authUrl: env.BETTER_AUTH_URL,
		configuredOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
		corsOrigin: env.CORS_ORIGIN,
		nodeEnv: env.NODE_ENV,
	}),
});
