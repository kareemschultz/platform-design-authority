import type { Context as HonoContext } from "hono";

export interface IdentitySessionService {
	getSession: (input: { headers: Headers }) => Promise<IdentitySession | null>;
}

export interface IdentitySession {
	session: {
		createdAt: Date;
		expiresAt: Date;
		id: string;
		token: string;
		updatedAt: Date;
		userId: string;
		[key: string]: unknown;
	};
	user: {
		createdAt: Date;
		email: string;
		emailVerified: boolean;
		id: string;
		image?: string | null;
		name: string;
		updatedAt: Date;
		[key: string]: unknown;
	};
}

export interface CreateContextOptions {
	context: HonoContext;
	identity: IdentitySessionService;
}

export async function createContext({
	context,
	identity,
}: CreateContextOptions) {
	const session = await identity.getSession({
		headers: context.req.raw.headers,
	});
	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
