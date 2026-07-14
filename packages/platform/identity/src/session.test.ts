import { describe, expect, it } from "vitest";
import {
	createIdentitySessionApplication,
	type IdentitySessionCommandReceipt,
	IdentitySessionError,
	type IdentitySessionRecord,
	type IdentitySessionRepository,
} from "./session";

function harness() {
	const sessions: IdentitySessionRecord[] = [
		{
			createdAt: new Date("2026-07-13T00:00:00.000Z"),
			expiresAt: new Date("2026-07-14T00:00:00.000Z"),
			id: "session_owned_0001",
			ipAddress: "203.0.113.42",
			updatedAt: new Date("2026-07-13T01:00:00.000Z"),
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0",
			userId: "auth_user_owner_0001",
		},
		{
			createdAt: new Date("2026-07-12T00:00:00.000Z"),
			expiresAt: new Date("2026-07-14T00:00:00.000Z"),
			id: "session_other_0001",
			updatedAt: new Date("2026-07-12T01:00:00.000Z"),
			userId: "auth_user_other_0001",
		},
	];
	const receipts: IdentitySessionCommandReceipt[] = [];
	const events: Record<string, unknown>[] = [];
	const repository: IdentitySessionRepository = {
		claimCommandReceipt(receipt) {
			const existing = receipts.find(
				(item) =>
					item.authUserId === receipt.authUserId &&
					item.idempotencyKey === receipt.idempotencyKey &&
					item.operation === receipt.operation
			);
			if (existing) {
				return Promise.resolve({ inserted: false, receipt: existing });
			}
			receipts.push(receipt);
			return Promise.resolve({ inserted: true, receipt });
		},
		completeCommandReceipt(receipt) {
			const index = receipts.findIndex(
				(item) => item.idempotencyKey === receipt.idempotencyKey
			);
			receipts[index] = receipt;
			return Promise.resolve();
		},
		findCommandReceipt: (input) =>
			Promise.resolve(
				receipts.find(
					(item) =>
						item.authUserId === input.authUserId &&
						item.idempotencyKey === input.idempotencyKey &&
						item.operation === input.operation
				) ?? null
			),
		findOwned: (authUserId, sessionId) =>
			Promise.resolve(
				sessions.find(
					(item) => item.userId === authUserId && item.id === sessionId
				) ?? null
			),
		listOwned: (authUserId) =>
			Promise.resolve(sessions.filter((item) => item.userId === authUserId)),
		revokeOwned(authUserId, sessionId) {
			const index = sessions.findIndex(
				(item) => item.userId === authUserId && item.id === sessionId
			);
			if (index < 0) {
				return Promise.resolve(false);
			}
			sessions.splice(index, 1);
			return Promise.resolve(true);
		},
	};
	let id = 0;
	const createEventId = () => {
		id += 1;
		return `event_session_${String(id).padStart(4, "0")}`;
	};
	const application = createIdentitySessionApplication({
		clock: () => new Date("2026-07-13T02:00:00.000Z"),
		fingerprint: (value) => Promise.resolve(`hash:${value}`),
		ids: {
			create: createEventId,
		},
		repository,
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: {
						append: (event) => {
							events.push(event);
							return Promise.resolve("inserted");
						},
					},
					repository,
				}),
		},
	});
	return { application, events, receipts, sessions };
}

describe("identity session application", () => {
	it("returns only owned, non-expired safe summaries", async () => {
		const { application } = harness();
		const result = await application.list({
			authUserId: "auth_user_owner_0001",
			currentSessionId: "session_owned_0001",
			page: { limit: 50 },
		});
		expect(result.items).toEqual([
			expect.objectContaining({
				current: true,
				deviceLabel: "Windows device",
				ipAddressMasked: "203.0.113.x",
				userAgentSummary: "Chrome on Windows device",
			}),
		]);
		expect(JSON.stringify(result)).not.toContain("140.0.0.0");
	});

	it("revokes once and emits one platform-scoped durable fact under retry", async () => {
		const { application, events, receipts, sessions } = harness();
		const input = {
			authUserId: "auth_user_owner_0001",
			correlationId: "correlation_session_revoke_0001",
			currentSessionId: "session_owned_0001",
			idempotencyKey: "idempotency_session_revoke_0001",
			sessionId: "session_owned_0001",
		};
		await application.revoke(input);
		await application.revoke(input);
		expect(sessions.some((item) => item.id === input.sessionId)).toBe(false);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			name: "platform.session.revoked.v1",
			scopeType: "Platform",
		});
		expect(events[0]).not.toHaveProperty("tenantId");
		expect(receipts[0]?.completedAt).toBeInstanceOf(Date);
	});

	it("does not reveal or revoke another account's session", async () => {
		const { application, events, sessions } = harness();
		await application.revoke({
			authUserId: "auth_user_owner_0001",
			correlationId: "correlation_session_revoke_0002",
			currentSessionId: "session_owned_0001",
			idempotencyKey: "idempotency_session_revoke_0002",
			sessionId: "session_other_0001",
		});
		expect(sessions.some((item) => item.id === "session_other_0001")).toBe(
			true
		);
		expect(events).toHaveLength(0);
	});

	it("rejects reuse of an idempotency key for another target", async () => {
		const { application } = harness();
		await application.revoke({
			authUserId: "auth_user_owner_0001",
			correlationId: "correlation_session_revoke_0003",
			currentSessionId: "session_owned_0001",
			idempotencyKey: "idempotency_session_revoke_0003",
			sessionId: "session_owned_0001",
		});
		await expect(
			application.revoke({
				authUserId: "auth_user_owner_0001",
				correlationId: "correlation_session_revoke_0003",
				currentSessionId: "session_owned_0001",
				idempotencyKey: "idempotency_session_revoke_0003",
				sessionId: "session_different_0001",
			})
		).rejects.toBeInstanceOf(IdentitySessionError);
	});
});
