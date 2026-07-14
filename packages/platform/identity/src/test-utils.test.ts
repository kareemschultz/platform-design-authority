import { passkey } from "@better-auth/passkey";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { getTestInstance } from "better-auth/test";
import { describe, expect, test } from "vitest";

describe("test-only Better Auth composition", () => {
	test("creates a deterministic authenticated session without entering production composition", async () => {
		const deliveredOtps: string[] = [];
		const instance = await getTestInstance({
			appName: "Platform Identity Test",
			emailAndPassword: { enabled: true },
			plugins: [
				twoFactor({
					accountLockout: {
						durationSeconds: 900,
						enabled: true,
						maxFailedAttempts: 10,
					},
					backupCodeOptions: { storeBackupCodes: "encrypted" },
					otpOptions: {
						allowedAttempts: 5,
						sendOTP: ({ otp }) => {
							deliveredOtps.push(otp);
							return Promise.resolve();
						},
						storeOTP: "encrypted",
					},
					skipVerificationOnEnable: false,
				}),
				passkey({
					authenticatorSelection: { userVerification: "required" },
					origin: "http://localhost:3000",
					rpID: "localhost",
					rpName: "Platform Identity Test",
				}),
				admin({ adminUserIds: [] }),
				organization({
					allowUserToCreateOrganization: false,
					disableOrganizationDeletion: true,
					requireEmailVerificationOnInvitation: true,
					teams: { enabled: false },
				}),
			],
			secret: "test-only-identity-secret-value-32",
		});

		const signedIn = await instance.signInWithTestUser();
		const activeSession = await instance.auth.api.getSession({
			headers: signedIn.headers,
		});
		expect(signedIn.user.email).toBe(instance.testUser.email);
		expect(activeSession?.session.userId).toBe(signedIn.user.id);
		expect(signedIn.headers.get("cookie")).toContain(
			"better-auth.session_token"
		);
		expect(deliveredOtps).toEqual([]);
	});
});
