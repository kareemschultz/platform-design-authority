import { passkey } from "@better-auth/passkey";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { admin, organization, twoFactor } from "better-auth/plugins";
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
	displayName: string;
	nodeEnv: "development" | "production" | "test";
	persistence: IdentityPersistence;
	secret: string;
	sendTwoFactorOtp: (input: { email: string; otp: string }) => Promise<void>;
	trustedOrigins: readonly string[];
}

export function requirePasskeyUserVerification(
	verification:
		| { authenticationInfo: { userVerified: boolean } }
		| { registrationInfo?: { userVerified: boolean } }
): void {
	const userVerified =
		"authenticationInfo" in verification
			? verification.authenticationInfo.userVerified
			: verification.registrationInfo?.userVerified;
	if (!userVerified) {
		throw new Error("Passkey user verification is required");
	}
}

// Plugin policy (PDA-PLT-028, deny-by-default): only matrix-adopted core
// features are enabled here. Email/password is Adopt. No official, community,
// payment, or managed-infrastructure plugin is enabled. The Expo integration
// remains disabled until its matrix preconditions (secure storage, deep-link
// allowlists, cookie exchange, recovery tests) are evidenced and approved.
export function createIdentityAuth(
	options: CreateIdentityAuthOptions
): ReturnType<typeof betterAuth> {
	const authOrigin = new URL(options.authUrl).origin;
	const rpId = new URL(authOrigin).hostname;
	const auth = betterAuth({
		advanced: {
			defaultCookieAttributes: getCookieAttributes(options.nodeEnv),
		},
		appName: options.displayName,
		baseURL: options.authUrl,
		database: options.persistence[identityDatabase] as NonNullable<
			BetterAuthOptions["database"]
		>,
		emailAndPassword: {
			enabled: true,
		},
		plugins: [
			twoFactor({
				accountLockout: {
					durationSeconds: 900,
					enabled: true,
					maxFailedAttempts: 10,
				},
				allowPasswordless: true,
				backupCodeOptions: {
					allowPasswordless: true,
					storeBackupCodes: "encrypted",
				},
				issuer: options.displayName,
				otpOptions: {
					allowedAttempts: 5,
					digits: 6,
					period: 3,
					sendOTP: async ({ otp, user }) => {
						await options.sendTwoFactorOtp({ email: user.email, otp });
					},
					storeOTP: "encrypted",
				},
				skipVerificationOnEnable: false,
				trustDeviceMaxAge: 7 * 24 * 60 * 60,
				twoFactorCookieMaxAge: 10 * 60,
			}),
			passkey({
				authentication: {
					afterVerification: ({ verification }) => {
						requirePasskeyUserVerification(verification);
					},
				},
				authenticatorSelection: {
					residentKey: "preferred",
					userVerification: "required",
				},
				origin: authOrigin,
				registration: {
					afterVerification: ({ verification }) => {
						requirePasskeyUserVerification(verification);
					},
					requireSession: true,
				},
				rpID: rpId,
				rpName: options.displayName,
			}),
			admin({ adminUserIds: [] }),
			organization({
				allowUserToCreateOrganization: false,
				disableOrganizationDeletion: true,
				requireEmailVerificationOnInvitation: true,
				teams: { enabled: false },
			}),
		],
		secret: options.secret,
		trustedOrigins: getTrustedOrigins({
			authUrl: options.authUrl,
			configuredOrigins: options.trustedOrigins,
			corsOrigin: options.corsOrigin,
			nodeEnv: options.nodeEnv,
		}),
	});

	// The public identity boundary deliberately exposes only Better Auth's
	// stable base surface. Plugin-specific methods stay inside this package;
	// the configured instance is a runtime superset of that base surface.
	return auth as unknown as ReturnType<typeof betterAuth>;
}

export type IdentityAuth = ReturnType<typeof betterAuth>;
