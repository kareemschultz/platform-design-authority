import { env } from "@meridian/tooling-env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serverApplication } from "../composition/application";
import { permissionAuthorizer } from "../composition/authorization";
import {
	identityHttpHandler,
	identitySessionService,
} from "../composition/identity";
import { closeDatabaseComposition } from "../composition/postgres";
import { createContext } from "./context";
import { appRouter } from "./router";

const app = new Hono();

app.use(
	"/*",
	cors({
		allowHeaders: [
			"Authorization",
			"Content-Type",
			"Idempotency-Key",
			"If-Match",
			"X-Active-Context-Id",
		],
		allowMethods: ["DELETE", "GET", "PATCH", "POST", "PUT", "OPTIONS"],
		credentials: true,
		maxAge: 600,
		origin: env.CORS_ORIGIN,
	})
);

// Cheap liveness probes: no context creation, no database round trip.
app.get("/", (c) => c.text("OK"));
app.get("/health", (c) => c.json({ status: "ok" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => identityHttpHandler(c.req.raw));

// Do not log expected client errors (4xx); log everything unexpected without
// serializing request payloads.
function logUnexpectedError(error: unknown): void {
	if (error instanceof ORPCError && error.status < 500) {
		return;
	}
	console.error(error);
}

export const apiHandler = new OpenAPIHandler(appRouter, {
	interceptors: [onError(logUnexpectedError)],
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [onError(logUnexpectedError)],
});

// Handlers are mounted on their exact prefixes so session lookup (a database
// round trip inside createContext) runs only for RPC/OpenAPI traffic, never
// for health checks or unmatched routes.
const handleRpc: MiddlewareHandler = async (c, next) => {
	const context = await createContext({
		application: serverApplication,
		authorizer: permissionAuthorizer,
		context: c,
		identity: identitySessionService,
	});
	const result = await rpcHandler.handle(c.req.raw, {
		context,
		prefix: "/rpc",
	});
	if (result.matched) {
		return c.newResponse(result.response.body, result.response);
	}
	await next();
};
app.use("/rpc", handleRpc);
app.use("/rpc/*", handleRpc);

const handleApiReference: MiddlewareHandler = async (c, next) => {
	const context = await createContext({
		application: serverApplication,
		authorizer: permissionAuthorizer,
		context: c,
		identity: identitySessionService,
	});
	const result = await apiHandler.handle(c.req.raw, {
		context,
		prefix: "/api-reference",
	});
	if (result.matched) {
		return c.newResponse(result.response.body, result.response);
	}
	await next();
};
app.use("/api-reference", handleApiReference);
app.use("/api-reference/*", handleApiReference);

// Graceful shutdown for the Bun runtime, which serves the default export
// directly (dev and bundled `bun dist/index.mjs`). The Node fallback
// (`node.ts`) owns its own shutdown, so this must not register under Node.
// Note: an `import.meta.main` guard would break after bundling because tsdown
// moves this module into a shared chunk that is never the entrypoint.
if ("bun" in process.versions) {
	let shuttingDown = false;
	const shutdown = () => {
		if (shuttingDown) {
			return;
		}
		shuttingDown = true;
		closeDatabaseComposition()
			.catch((error: unknown) => {
				console.error("Error while closing database pool:", error);
			})
			.finally(() => {
				process.exit(0);
			});
	};
	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}

export default app;
