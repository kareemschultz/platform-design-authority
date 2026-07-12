import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
	const { session } = context;
	if (!session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			// Narrowed local so downstream context.session is non-nullable.
			session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
