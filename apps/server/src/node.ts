import { serve } from "@hono/node-server";
import { closeDb } from "@meridian/db";

import app from "./index";
import { parsePort } from "./port";

const port = parsePort(process.env.PORT);

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
		closeDb()
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
