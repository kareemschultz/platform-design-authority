import { serve } from "@hono/node-server";
import { env } from "@meridian/tooling-env/server";

import { closeIdentityComposition } from "../composition/identity";
import app from "./index";

const port = env.PORT ?? 3000;

const server = serve({
	fetch: app.fetch,
	port,
});

let shuttingDown = false;
function shutdown(): void {
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;
	server.close((closeError) => {
		if (closeError) {
			console.error("Error while closing HTTP server:", closeError);
		}
		closeIdentityComposition()
			.catch((error: unknown) => {
				console.error("Error while closing database pool:", error);
			})
			.finally(() => {
				process.exit(closeError ? 1 : 0);
			});
	});
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
