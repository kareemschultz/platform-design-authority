import { type BetterAuthOptions, betterAuth } from "better-auth";
import { getCookieAttributes, getTrustedOrigins } from "./security";

const identityDatabase = Symbol("identity.persistence.database");

export interface IdentityPersistence {
	readonly [identityDatabase]: unknown;
}

/** Wrap a concrete adapter without publishing its database type in the port. */
export function bindIdentityPersistence(
	database: unknown
): IdentityPersistence {
	return { [identityDatabase]: database };
}

export interface CreateIdentityAuthOptions {
	authUrl: string;
	corsOrigin: string;
	nodeEnv: "development" | "production" | "test";
	persistence: IdentityPersistence;
	secret: string;
	trustedOrigins: readonly string[];
}

// Plugin policy (PDA-PLT-028, deny-by-default): only matrix-adopted core
// features are enabled here. Email/password is Adopt. No official, community,
// payment, or managed-infrastructure plugin is enabled. The Expo integration
// remains disabled until its matrix preconditions (secure storage, deep-link
// allowlists, cookie exchange, recovery tests) are evidenced and approved.
export function createIdentityAuth(options: CreateIdentityAuthOptions) {
	return betterAuth({
		advanced: {
			defaultCookieAttributes: getCookieAttributes(options.nodeEnv),
		},
		baseURL: options.authUrl,
		database: options.persistence[identityDatabase] as NonNullable<
			BetterAuthOptions["database"]
		>,
		emailAndPassword: {
			enabled: true,
		},
		secret: options.secret,
		trustedOrigins: getTrustedOrigins({
			authUrl: options.authUrl,
			configuredOrigins: options.trustedOrigins,
			corsOrigin: options.corsOrigin,
			nodeEnv: options.nodeEnv,
		}),
	});
}

export type IdentityAuth = ReturnType<typeof createIdentityAuth>;
