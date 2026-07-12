import { describe, expect, test } from "bun:test";
import { call, ORPCError } from "@orpc/server";
import type { Context } from "../context";
import { appRouter } from "./index";

const anonymousContext = { session: null } as Context;

const now = new Date();

const authenticatedSession = {
	session: {
		createdAt: now,
		expiresAt: new Date(now.getTime() + 60_000),
		id: "session_1",
		token: "unit-test-session-token",
		updatedAt: now,
		userId: "user_1",
	},
	user: {
		createdAt: now,
		email: "test.user@example.com",
		emailVerified: true,
		id: "user_1",
		image: null,
		name: "Test User",
		updatedAt: now,
	},
} as unknown as NonNullable<Context["session"]>;

const authenticatedContext = { session: authenticatedSession } as Context;

describe("appRouter contract surface", () => {
	test("exposes exactly the expected procedures", () => {
		expect(Object.keys(appRouter).sort()).toEqual([
			"healthCheck",
			"privateData",
		]);
	});

	test("healthCheck responds OK without a session", async () => {
		const result = await call(appRouter.healthCheck, undefined, {
			context: anonymousContext,
		});
		expect(result).toBe("OK");
	});

	test("privateData rejects anonymous callers with UNAUTHORIZED", async () => {
		try {
			await call(appRouter.privateData, undefined, {
				context: anonymousContext,
			});
			throw new Error("expected privateData to reject anonymous callers");
		} catch (error) {
			expect(error).toBeInstanceOf(ORPCError);
			expect((error as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
		}
	});

	test("privateData returns the session user for authenticated callers", async () => {
		const result = await call(appRouter.privateData, undefined, {
			context: authenticatedContext,
		});
		expect(result.message).toBe("This is private");
		expect(result.user?.id).toBe("user_1");
		expect(result.user?.email).toBe("test.user@example.com");
	});
});
